export const MODES = ['contains', 'startsWith', 'endsWith', 'exact', 'regex', 'length'];
export const MAX_RULES = 200;
export function normalizeRule(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Each rule must be an object.');
  const mode = input.mode ?? 'contains';
  if (!MODES.includes(mode)) throw new Error(`Unknown match mode: ${mode}`);
  const pattern = typeof input.pattern === 'string' ? input.pattern.trim() : '';
  if (mode !== 'length' && !pattern) throw new Error('Enter a word, phrase, or regular expression.');
  if (pattern.length > 300) throw new Error('Patterns must be 300 characters or fewer.');
  const polarity = input.polarity ?? 'positive';
  if (!['positive', 'negative'].includes(polarity)) throw new Error('Polarity must be positive or negative.');
  for (const name of ['enabled', 'caseSensitive', 'wholeWord']) {
    if (input[name] !== undefined && typeof input[name] !== 'boolean') throw new Error(`${name} must be true or false.`);
  }
  const lengths = {};
  for (const name of ['minLength', 'maxLength']) {
    const raw = input[name];
    lengths[name] = raw === '' || raw == null ? null : Number(raw);
    if (lengths[name] !== null && (!Number.isInteger(lengths[name]) || lengths[name] < 1 || lengths[name] > 5000)) throw new Error('Length limits must be integers between 1 and 5000.');
  }
  if (lengths.minLength && lengths.maxLength && lengths.minLength > lengths.maxLength) throw new Error('Minimum length cannot exceed maximum length.');
  if (mode === 'length' && !lengths.minLength && !lengths.maxLength) throw new Error('Set a minimum or maximum length.');
  const flags = input.flags ?? '';
  if (typeof flags !== 'string' || !/^(?!.*(.).*\1)[imsu]*$/.test(flags)) throw new Error('Regex flags may contain i, m, s, u once each.');
  if (mode === 'regex') {
    try { new RegExp(pattern, flags); } catch (error) { throw new Error(`Invalid regex: ${error.message}`); }
  }
  return { id: typeof input.id === 'string' ? input.id : crypto.randomUUID(), pattern, mode, polarity,
    enabled: input.enabled ?? true, caseSensitive: input.caseSensitive ?? false,
    wholeWord: input.wholeWord ?? false, flags, ...lengths };
}
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function matchText(text, rule) {
  const leading = text.length - text.trimStart().length;
  const value = text.trim();
  const length = [...value].length;
  if (!value || (rule.minLength && length < rule.minLength) || (rule.maxLength && length > rule.maxLength)) return [];
  if (rule.mode === 'length') return [[leading, leading + value.length]];
  let source = rule.mode === 'regex' ? rule.pattern : escapeRegex(rule.pattern);
  if (rule.mode === 'startsWith' || rule.mode === 'exact') source = `^(?:${source})`;
  if (rule.mode === 'endsWith' || rule.mode === 'exact') source = `(?:${source})$`;
  if (rule.wholeWord) source = `(?<![\\p{L}\\p{N}_])(?:${source})(?![\\p{L}\\p{N}_])`;
  let flags = rule.mode === 'regex' ? rule.flags : '';
  if (!rule.caseSensitive && !flags.includes('i')) flags += 'i';
  if (rule.wholeWord && !flags.includes('u')) flags += 'u';
  const regex = new RegExp(source, flags + 'g');
  const ranges = [];
  for (const match of value.matchAll(regex)) {
    if (match[0].length) ranges.push([leading + match.index, leading + match.index + match[0].length]);
    if (ranges.length >= 100) break;
  }
  return ranges;
}
export function fingerprint(rule) {
  return JSON.stringify([rule.pattern,rule.mode,rule.polarity,rule.caseSensitive,rule.wholeWord,rule.flags,rule.minLength,rule.maxLength]);
}
export function parseImport(raw, existing = []) {
  if (raw.length > 250000) throw new Error('JSON is too large (maximum 250 KB).');
  const clean = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let data;
  try { data = JSON.parse(clean); } catch { throw new Error('Invalid JSON. Paste the complete JSON response, with or without its code fence.'); }
  let inputs;
  if (Array.isArray(data)) inputs = data.map(x => typeof x === 'string' ? { pattern:x } : x);
  else if (data && typeof data === 'object' && Array.isArray(data.rules)) inputs = data.rules;
  else if (data && typeof data === 'object' && (Array.isArray(data.positive) || Array.isArray(data.negative))) {
    inputs = ['positive','negative'].flatMap(polarity => {
      if (data[polarity] !== undefined && !Array.isArray(data[polarity])) throw new Error(`${polarity} must be an array.`);
      return (data[polarity] ?? []).map(pattern => {
        if (typeof pattern !== 'string') throw new Error('Positive and negative arrays must contain strings.');
        return { pattern, polarity };
      });
    });
  } else throw new Error('Expected {"positive":[],"negative":[]}, {"rules":[]}, or an array of rules/words.');
  if (inputs.length > MAX_RULES) throw new Error(`Import at most ${MAX_RULES} rules at once.`);
  const seen = new Set(existing.map(fingerprint));
  let duplicates = 0;
  const rules = [];
  inputs.forEach((input, i) => {
    let rule;
    try { rule = normalizeRule(input); } catch (error) { throw new Error(`Rule ${i + 1}: ${error.message}`); }
    rule.id = crypto.randomUUID();
    const key = fingerprint(rule);
    if (seen.has(key)) duplicates++; else { seen.add(key); rules.push(rule); }
  });
  if (existing.length + rules.length > MAX_RULES) throw new Error(`Maximum ${MAX_RULES} saved rules. Remove some rules first.`);
  return { rules, duplicates };
}
