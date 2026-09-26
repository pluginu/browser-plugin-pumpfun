chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message.target !== 'matcher' || sender.id !== chrome.runtime.id) return;
  const worker = new Worker('match-worker.js', { type: 'module' });
  let activeRule;
  let timer;
  const finish = result => { clearTimeout(timer); clearTimeout(deadline); worker.terminate(); respond(result); };
  const deadline = setTimeout(() => finish({ error: 'Matching exceeded its time budget. Reduce the number or complexity of rules.' }), 5000);
  timer = setTimeout(() => finish({ error: 'Matching worker did not start. Try refreshing the page.' }), 2000);
  worker.onmessage = ({ data }) => {
    if (data.done) finish(data);
    else {
      activeRule = data.activeRule;
      clearTimeout(timer);
      timer = setTimeout(() => finish({ timedOut: activeRule, error: 'A slow rule was skipped on this page. Edit it to retry.' }), 200);
    }
  };
  worker.onerror = () => finish({ error: 'The matching worker failed. Reload the extension.' });
  worker.postMessage({ texts: message.texts, rules: message.rules });
  return true;
});
