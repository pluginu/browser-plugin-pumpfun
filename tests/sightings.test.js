import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyHistory, mergeSightings, groupSightings, imageKey, MAX_TOKENS } from '../sightings.js';
const token = (id = 'A'.repeat(32), fields = {}) => ({ id, name: 'Moon Coin', ticker: '$MOON', image: 'https://gateway.example/ipfs/QmShared', ...fields });
test('repeated visits deduplicate addresses while distinct tokens increase all three counts', () => {
  let { history } = mergeSightings(emptyHistory(), [token()], 100);
  assert.equal(mergeSightings(history, [token()], 200).changed, false);
  history = mergeSightings(history, [token('B'.repeat(32), {name:' moon   coin ',ticker:'moon'})], 300).history;
  for (const field of ['name','ticker','image']) assert.equal(groupSightings(history, field)[0].count, 2);
  assert.equal(groupSightings(history, 'name')[0].firstSeen, 100);
});
test('late metadata fills missing fields without counting the address twice', () => {
  let {history} = mergeSightings(emptyHistory(), [token(undefined, {image:''})]);
  history = mergeSightings(history, [token()]).history;
  assert.equal(history.tokens.length, 1);
  assert.equal(groupSightings(history, 'image')[0].count, 1);
});
test('image proxies normalize to shared IPFS or source and preserve meaningful query parameters', () => {
  assert.equal(imageKey('https://images.pump.fun/coin-image/abc?variant=64&ipfs=QmShared'), 'ipfs://QmShared');
  assert.equal(imageKey('https://another.example/ipfs/QmShared'), 'ipfs://QmShared');
  assert.equal(imageKey('https://images.pump.fun/coin-image/abc?src=https%3A%2F%2Fexample.com%2Fx.png'), 'https://example.com/x.png');
  assert.notEqual(imageKey('https://example.com/img?id=1'), imageKey('https://example.com/img?id=2'));
  assert.equal(imageKey('javascript:alert(1)'), '');
});
test('invalid addresses and metadata do not poison history', () => {
  const {history} = mergeSightings(emptyHistory(), [{id:'__proto__',name:'bad'}, token(undefined,{name:123,ticker:null,image:'data:image/png;base64,abc'})]);
  assert.equal(history.tokens.length,0);
  assert.throws(()=>mergeSightings(emptyHistory(), Array(201).fill(token())));
});
test('EVM address casing deduplicates but Solana address casing stays significant', () => {
  const {history} = mergeSightings(emptyHistory(), [token('0x'+'ab'.repeat(20)),token('0x'+'AB'.repeat(20)),token('A'.repeat(32)),token('a'.repeat(32))]);
  assert.equal(history.tokens.length,3);
});
test('capacity preserves existing counts instead of silently evicting history', () => {
  const history = emptyHistory();
  history.tokens = Array.from({length:MAX_TOKENS}, (_,i)=>({id:String(i), name:'Original',ticker:'OLD',image:'',firstSeen:1}));
  const next = mergeSightings(history,[token()]).history;
  assert.equal(next.tokens.length,MAX_TOKENS); assert.equal(next.full,true);
  assert.equal(groupSightings(next,'name')[0].count,MAX_TOKENS);
});
