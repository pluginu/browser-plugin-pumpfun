(() => {
  let enabled = true, timer, busy = false, pending = false;
  const sent = new Map();
  function schedule() {
    pending = true;
    if (!timer) timer = setTimeout(() => { timer = null; scan(); }, 800);
  }
  function readToken(link) {
    const url = new URL(link.href);
    if (url.origin !== location.origin) return null;
    const id = url.pathname.match(/^\/coin\/([^/]+)\/?$/)?.[1];
    if (!id) return null;
    const card = link.closest('[data-testid="trending-coin-row"]') || link;
    if (!card.checkVisibility({ checkVisibilityCSS: true })) return null;
    const name = card.querySelector('[data-token-name]')?.textContent || link.getAttribute('aria-label');
    const ticker = card.querySelector('[data-token-ticker]')?.textContent || [...card.querySelectorAll('span.truncate')].find(n => n.textContent.trim().startsWith('$'))?.textContent;
    // Only associate metadata when the token card has both identifying labels.
    if (!name || !ticker) return null;
    const img = card.querySelector('img');
    return { id, name, ticker, image: img?.currentSrc || img?.src || '' };
  }
  async function scan() {
    if (busy || !enabled) return;
    pending = false; busy = true;
    try {
      const batch = new Map();
      for (const link of document.querySelectorAll('a[href*="/coin/"]')) {
        const token = readToken(link);
        if (token && sent.get(token.id) !== JSON.stringify(token)) batch.set(token.id, token);
        if (batch.size >= 200) break;
      }
      if (batch.size) {
        const tokens = [...batch.values()];
        const result = await chrome.runtime.sendMessage({ type: 'observe-tokens', tokens });
        if (result?.error) throw new Error(result.error);
        if (result?.ok && !result.paused) {
          for (const token of tokens) sent.set(token.id, JSON.stringify(token));
          if (sent.size > 6000) sent.clear();
          if (batch.size === 200) pending = true;
        }
      }
    } catch (error) { console.warn('Pump Lens token history:', error.message); }
    finally { busy = false; if (pending) schedule(); }
  }
  chrome.storage.local.get('settings').then(({ settings }) => { enabled = settings?.enabled !== false; schedule(); });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.settings) { enabled = changes.settings.newValue?.enabled !== false; schedule(); }
    if (changes.tokenHistory && !changes.tokenHistory.newValue?.tokens?.length) { sent.clear(); schedule(); }
  });
  new MutationObserver(schedule).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['href', 'src', 'srcset', 'class', 'style', 'hidden', 'aria-label'] });
})();
