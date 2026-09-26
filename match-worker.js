import { matchText } from './rules.js';
self.onmessage = ({ data }) => {
  const hits = [];
  const errors = [];
  for (const rule of data.rules) {
    if (!rule.enabled) continue;
    self.postMessage({ activeRule: rule.id });
    try {
      for (let i = 0; i < data.texts.length; i++) {
        const ranges = matchText(data.texts[i], rule);
        if (ranges.length) hits.push({ index: i, ranges, polarity: rule.polarity, id: rule.id });
        if (hits.length >= 10000) break;
      }
    } catch (error) { errors.push({ id: rule.id, message: error.message }); }
    if (hits.length >= 10000) break;
  }
  self.postMessage({ done: true, hits, errors });
};
