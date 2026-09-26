(() => {
  let settings = { enabled: true, rules: [] };
  let running = false, pending = false, timer, generation = 0;
  let blocked = new Set();
  let status = { positive: 0, negative: 0, scanned: 0, error: '' };
  const clear = () => { CSS.highlights.delete('pump-lens-positive'); CSS.highlights.delete('pump-lens-negative'); };
  function schedule() {
    pending = true;
    if (!timer) timer = setTimeout(() => { timer = null; scan(); }, 450);
  }
  async function scan() {
    if (running) return;
    pending = false;
    clear();
    status = { positive: 0, negative: 0, scanned: 0, error: '' };
    if (!settings.enabled || !settings.rules.some(r => r.enabled)) return;
    running = true;
    const version = generation;
    try {
      const nodes = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || !node.textContent.trim() || node.textContent.length > 5000 || parent.closest('script,style,noscript,textarea,input,select,option,[contenteditable]:not([contenteditable="false"]),[hidden],[aria-hidden="true"]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }});
      let node;
      while (nodes.length < 2500 && (node = walker.nextNode())) {
        if (node.parentElement.checkVisibility({ checkVisibilityCSS: true })) nodes.push(node);
      }
      const texts = nodes.map(n => n.textContent);
      const result = await chrome.runtime.sendMessage({ type: 'match', texts, rules: settings.rules.filter(r => !blocked.has(r.id)) });
      if (version !== generation) return;
      status.scanned = nodes.length;
      status.limited = nodes.length === 2500;
      if (result.timedOut) { blocked.add(result.timedOut); pending = true; }
      status.error = result.error || (result.errors?.length ? 'Some rules could not be evaluated.' : blocked.size ? `${blocked.size} slow rule(s) skipped. Edit rules to retry.` : '');
      const positive = new Highlight(), negative = new Highlight();
      negative.priority = 1;
      for (const hit of result.hits ?? []) {
        const n = nodes[hit.index];
        if (!n?.isConnected || n.textContent !== texts[hit.index]) continue;
        for (const [start, end] of hit.ranges) {
          const range = new Range();
          range.setStart(n, start); range.setEnd(n, end);
          (hit.polarity === 'negative' ? negative : positive).add(range);
          status[hit.polarity]++;
        }
      }
      CSS.highlights.set('pump-lens-positive', positive);
      CSS.highlights.set('pump-lens-negative', negative);
    } catch (error) { status.error = error.message; }
    finally { running = false; if (pending) schedule(); }
  }
  chrome.storage.local.get('settings').then(({ settings: stored }) => { if (stored) settings = stored; schedule(); });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.settings) return;
    settings = changes.settings.newValue ?? { enabled: true, rules: [] };
    generation++; blocked = new Set(); clear(); schedule();
  });
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (message.type === 'status') respond({ ...status, enabled: settings.enabled });
  });
  new MutationObserver(schedule).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'class', 'style', 'aria-hidden'] });
})();
