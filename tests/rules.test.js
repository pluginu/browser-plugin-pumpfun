import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRule as rule, matchText, parseImport } from '../rules.js';
const match = (text, changes = {}) => matchText(text, rule({ pattern: 'cat', ...changes }));
test('contains returns all case-insensitive ranges with original offsets', () => { assert.deepEqual(match('  Cat cat! '), [[2,5], [6,9]]); });
test('literal patterns escape regex symbols', () => { assert.deepEqual(match('a.b axb', { pattern: 'a.b' }), [[0,3]]); });
test('starts, ends and exact match trimmed text segments', () => {
  assert.deepEqual(match(' catapult ', { mode: 'startsWith' }), [[1,4]]);
  assert.deepEqual(match('bobcat ', { mode: 'endsWith' }), [[3,6]]);
  assert.deepEqual(match(' cat ', { mode: 'exact' }), [[1,4]]);
  assert.deepEqual(match('catapult', { mode: 'exact' }), []);
});
test('whole words support Unicode boundaries', () => {
  assert.deepEqual(match('cat bobcat cat_ caté cat!', { wholeWord: true }), [[0,3],[21,24]]);
  assert.deepEqual(match('кот котик', { pattern: 'кот', wholeWord: true }), [[0,3]]);
});
test('case sensitive and regex flags', () => {
  assert.deepEqual(match('CAT cat', { caseSensitive: true }), [[4,7]]);
  assert.deepEqual(match('CAT', { mode: 'regex', caseSensitive: true, flags: 'i' }), [[0,3]]);
  assert.deepEqual(match('dog42 CAT7', { mode:'regex', pattern:'(?:dog|cat)\\d+' }), [[0,5],[6,10]]);
});
test('min/max lengths apply to the whole trimmed segment and count Unicode codepoints', () => {
  assert.deepEqual(match('catapult', { maxLength: 3 }), []);
  assert.deepEqual(match(' cat ', { maxLength: 3, minLength: 3 }), [[1,4]]);
  assert.deepEqual(match('🐱', { mode: 'length', maxLength: 1 }), [[0,2]]);
});
test('zero-width regex completes without creating invisible highlights', () => { assert.deepEqual(match('hello', { mode:'regex', pattern:'(?=.)' }), []); });
test('regex ranges bounded per segment', () => { assert.equal(match('a'.repeat(200), { mode: 'regex', pattern: '.' }).length, 100); });
test('invalid rules fail validation', () => {
  for (const input of [{pattern:'[' ,mode:'regex'}, {pattern:'cat', flags:'gg'}, {pattern:'cat',flags:'ii'}, {pattern:'cat', enabled:'false'}, {pattern:'cat',maxLength:2,minLength:3}, {mode:'length'}, {pattern:'cat',polarity:'blue'}, {pattern:'cat',mode:'unknown'}]) assert.throws(() => rule(input));
});
test('ChatGPT import supports fenced JSON, negatives, deduplication', () => {
  const result = parseImport('```json\n{"positive":["cat","cat"],"negative":["rug"]}\n```', [rule({pattern:'cat'})]);
  assert.equal(result.rules.length,1); assert.equal(result.rules[0].polarity,'negative'); assert.equal(result.duplicates,2);
});
test('full backup preserves matching options and enabled state but assigns fresh ids', () => {
  const original = rule({pattern:'a+',mode:'regex',polarity:'negative',enabled:false,maxLength:20});
  const imported = parseImport(JSON.stringify({rules:[original]})).rules[0];
  assert.notEqual(imported.id, original.id); assert.equal(imported.enabled,false); assert.equal(imported.maxLength,20); assert.equal(imported.mode,'regex');
});
test('invalid import is rejected as a whole; no partial additions', () => {
  for (const json of ['no', '{}', '{"positive":[123]}', '{"positive":[],"negative":"cat"}', '["cat",{}]']) assert.throws(() => parseImport(json));
  assert.throws(() => parseImport(JSON.stringify(Array.from({length:201}, (_,i)=>`cat${i}`))));
});
