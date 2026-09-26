export const MAX_TOKENS = 5000;
export const emptyHistory = () => ({ version: 1, tokens: [], full: false });
export const textKey = value => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
export function imageKey(value, depth = 0) {
  if (depth > 4 || !value) return '';
  try {
    let url = new URL(value);
    if (url.hostname === 'images.pump.fun') {
      const cid = url.searchParams.get('ipfs');
      if (cid) return `ipfs://${cid}`;
      const source = url.searchParams.get('src') || url.searchParams.get('evmFallbackImage');
      if (source) return imageKey(source, depth + 1);
      url.searchParams.delete('variant');
    }
    if (url.pathname === '/_next/image' && url.searchParams.has('url')) return imageKey(new URL(url.searchParams.get('url'), url).href, depth + 1);
    const ipfs = url.pathname.match(/\/ipfs\/(.+)/);
    if (ipfs) return `ipfs://${ipfs[1]}`;
    if (!['https:', 'http:', 'ipfs:'].includes(url.protocol)) return '';
    url.hash = ''; return url.href;
  } catch { return ''; }
}
export function mergeSightings(history, batch, now = Date.now()) {
  if (!Array.isArray(batch) || batch.length > 200) throw new Error('Invalid token batch.');
  const next = structuredClone(history || emptyHistory());
  const byId = new Map(next.tokens.map(t => [t.id, t]));
  let changed = false;
  let bytes = new TextEncoder().encode(JSON.stringify(next)).length;
  for (const item of batch) {
    if (!item || typeof item.id !== 'string' || !/^(?:[1-9A-HJ-NP-Za-km-z]{32,44}|0x[0-9a-fA-F]{40})$/.test(item.id)) continue;
    const id = item.id.startsWith('0x') ? item.id.toLowerCase() : item.id;
    const data = {};
    for (const key of ['name', 'ticker', 'image']) {
      const value = typeof item[key] === 'string' ? item[key].trim() : '';
      data[key] = value.length <= (key === 'image' ? 2000 : 200) ? value : '';
    }
    data.ticker = data.ticker.replace(/^\$/, '');
    data.imageUrl = /^https?:\/\//.test(data.image) ? data.image : '';
    data.image = imageKey(data.image);
    if (!data.name && !data.ticker && !data.image) continue;
    const existing = byId.get(id);
    if (existing) {
      for (const key of ['name', 'ticker', 'image', 'imageUrl']) {
        if (!existing[key] && data[key]) {
          const addedBytes = new TextEncoder().encode(JSON.stringify(data[key])).length;
          if (bytes + addedBytes > 6000000) { if (!next.full) { next.full = true; changed = true; } continue; }
          existing[key] = data[key]; bytes += addedBytes; changed = true;
        }
      }
    } else if (next.tokens.length < MAX_TOKENS) {
      const token = { id, ...data, firstSeen: now };
      const addedBytes = new TextEncoder().encode(JSON.stringify(token)).length + 1;
      if (bytes + addedBytes > 6000000) { if (!next.full) { next.full = true; changed = true; } continue; }
      next.tokens.push(token); byId.set(id, token); bytes += addedBytes; changed = true;
    } else if (!next.full) { next.full = true; changed = true; }
  }
  return { history: next, changed };
}
export function groupSightings(history, field) {
  const groups = new Map();
  for (const token of history?.tokens || []) {
    const value = token[field]; if (!value) continue;
    const key = field === 'image' ? value : textKey(value);
    const group = groups.get(key) || { value, count: 0, firstSeen: token.firstSeen, imageUrl: token.imageUrl };
    group.count++; groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}
