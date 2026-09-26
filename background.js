import { emptyHistory, mergeSightings } from './sightings.js';
import { normalizeRule, MAX_RULES } from './rules.js';
let creating;
async function ensureMatcher() {
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  if (contexts.length) return;
  if (!creating) creating = chrome.offscreen.createDocument({ url: 'offscreen.html', reasons: ['WORKERS'], justification: 'Run regex matching in terminable workers to keep pages responsive.' }).finally(() => { creating = null; });
  await creating;
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message.type !== 'match' || sender.id !== chrome.runtime.id) return;
  (async () => {
    if (!Array.isArray(message.texts) || message.texts.length > 2500 || message.texts.some(x => typeof x !== 'string' || x.length > 5000)) throw new Error('Invalid text batch.');
    if (!Array.isArray(message.rules) || message.rules.length > MAX_RULES) throw new Error('Invalid rules.');
    const rules = message.rules.map(normalizeRule);
    await ensureMatcher();
    return await chrome.runtime.sendMessage({ target: 'matcher', texts: message.texts, rules });
  })().then(respond).catch(error => respond({ error: error.message }));
  return true;
});

// Serialize read-modify-write operations across all tabs.
let historyQueue = Promise.resolve();
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || !['observe-tokens', 'clear-token-history'].includes(message.type)) return;
  const task = async () => {
    if (message.type === 'clear-token-history') {
      if (sender.url !== chrome.runtime.getURL('index.html')) throw new Error('Open the extension to clear history.');
      await chrome.storage.local.set({ tokenHistory: emptyHistory() });
      return { ok: true };
    }
    if (!sender.tab || !/^https:\/\/(?:[\w-]+\.)*pump\.fun\//.test(sender.url || '')) throw new Error('Unsupported token source.');
    const { settings, tokenHistory } = await chrome.storage.local.get(['settings', 'tokenHistory']);
    if (settings?.enabled === false) return { ok: true, paused: true };
    const result = mergeSightings(tokenHistory, message.tokens);
    if (result.changed) await chrome.storage.local.set({ tokenHistory: result.history });
    return { ok: true };
  };
  const result = historyQueue.then(task);
  historyQueue = result.catch(() => {});
  result.then(respond, error => respond({ error: error.message }));
  return true;
});
