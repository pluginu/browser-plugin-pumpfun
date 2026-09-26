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
