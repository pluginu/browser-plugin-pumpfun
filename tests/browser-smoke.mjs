import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const profile = await mkdtemp(path.join(os.tmpdir(), 'pump-lens-test-'));
const context = await chromium.launchPersistentContext(profile, {
  channel: 'chromium', headless: true, viewport: { width: 1080, height: 900 },
  args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`]
});
const errors = [];
context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
const waitFor = async (fn, description) => {
  const until = Date.now() + 12000;
  while (Date.now() < until) { if (await fn()) return; await new Promise(resolve => setTimeout(resolve, 100)); }
  throw new Error(`Timed out: ${description}`);
};
try {
  const service = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  const id = new URL(service.url()).host;
  const manager = await context.newPage();
  await manager.goto(`chrome-extension://${id}/index.html`);
  await manager.getByRole('button', { name: '+ Add rule', exact: true }).click();
  await manager.locator('#pattern').fill('cat');
  await manager.locator('#whole-word').check();
  await manager.locator('#test-text').fill('Cosmic cat');
  await waitFor(async () => (await manager.locator('#test-result').textContent()).includes('1 match(es): cat'), 'sample test');
  await manager.getByRole('button', { name: 'Save rule', exact: true }).click();
  await waitFor(async () => await manager.locator('.rule').count() === 1, 'save rule');
  await manager.getByRole('tab', { name: 'Import / export', exact: true }).click();
  await manager.locator('#import-json').fill('{"positive":["cat","moon"],"negative":["cat","rug"]}');
  await manager.getByRole('button', { name: 'Preview import', exact: true }).click();
  assert.equal(await manager.locator('#import-summary').textContent(), '4 new rules · 0 duplicates skipped');
  await manager.getByRole('button', { name: 'Add these rules', exact: true }).click();
  await waitFor(async () => await manager.locator('.rule').count() === 5, 'import');
  await manager.reload();
  await waitFor(async () => await manager.locator('.rule').count() === 5, 'persistence');
  await mkdir(path.join(root, 'artifacts'), { recursive: true });
  await manager.screenshot({ path: path.join(root, 'artifacts', 'rules.png'), fullPage: true });
  await manager.getByRole('tab', { name: '✧ Keyword studio', exact: true }).click();
  await manager.locator('#seed').fill('cosmic cat');
  await manager.locator('#ai-task').selectOption('opposite');
  assert.match(await manager.locator('#prompt').inputValue(), /opposite words.*negative/i);
  await manager.screenshot({ path: path.join(root, 'artifacts', 'keyword-studio.png'), fullPage: true });
  await manager.getByRole('tab', { name: 'Import / export', exact: true }).click();
  await manager.locator('#import-json').fill('{"positive":["new keyword",123]}');
  await manager.getByRole('button', { name: 'Preview import', exact: true }).click();
  assert.match(await manager.locator('#toast').textContent(), /must contain strings/);
  assert.equal(await manager.locator('#import-preview').isVisible(), false);
  const fixture = await context.newPage();
  await fixture.route('https://pump.fun/**', route => route.fulfill({ contentType: 'text/html', path: path.join(root, 'tests', 'fixture.html') }));
  await fixture.goto('https://pump.fun/pump-lens-test');
  const getHighlights = () => fixture.evaluate(() => ({
    positive: [...(CSS.highlights.get('pump-lens-positive') ?? [])].map(r => r.toString()),
    negative: [...(CSS.highlights.get('pump-lens-negative') ?? [])].map(r => r.toString()),
    priority: CSS.highlights.get('pump-lens-negative')?.priority
  }));
  await waitFor(async () => (await getHighlights()).negative.includes('rug'), 'real extension messaging and highlights');
  const first = await getHighlights();
  assert.equal(first.positive.length, 4);
  assert.equal(first.negative.length, 3);
  assert.equal(first.priority, 1);
  await fixture.evaluate(() => { const p = document.createElement('p'); p.textContent = 'moon cat'; document.getElementById('dynamic').append(p); });
  await waitFor(async () => (await getHighlights()).positive.includes('moon'), 'dynamic content');
  await fixture.screenshot({ path: path.join(root, 'artifacts', 'highlights.png'), fullPage: true });
  await manager.locator('#enabled').uncheck();
  await waitFor(async () => (await getHighlights()).positive.length === 0 && (await getHighlights()).negative.length === 0, 'master pause');
  await manager.locator('#enabled').check();
  await waitFor(async () => (await getHighlights()).positive.includes('moon'), 'master resume');
  await manager.getByRole('tab', { name: /Matching rules/ }).click();
  await manager.getByRole('button', { name: '+ Add rule', exact: true }).click();
  await manager.locator('#pattern').fill('(a+)+$');
  await manager.locator('#mode').selectOption('regex');
  await manager.getByRole('button', { name: 'Save rule', exact: true }).click();
  await waitFor(async () => await manager.locator('.rule').count() === 6, 'slow regex saved');
  await fixture.evaluate(() => { const p = document.createElement('p'); p.textContent = 'a'.repeat(80) + '!'; document.body.append(p); });
  const tabId = await service.evaluate(async () => { for (const tab of await chrome.tabs.query({})) { try { await chrome.tabs.sendMessage(tab.id, {type:'status'}); return tab.id; } catch {} } throw new Error('Fixture content script was not found'); });
  await waitFor(async () => {
    const status = await service.evaluate(async tabId => chrome.tabs.sendMessage(tabId, {type:'status'}), tabId);
    return status.error.includes('slow rule') && status.positive > 0;
  }, 'pathological regex terminated and other matches restored');
  await manager.locator('.rule input[type=checkbox]').first().uncheck();
  await waitFor(async () => (await getHighlights()).positive.length === 4, 'per-rule disable');
  // Token cards mirror the inspected live trending-row structure.
  const addToken = (page, id) => page.evaluate(id => {
    const card = document.createElement('div'); card.dataset.testid = 'trending-coin-row';
    const link = document.createElement('a'); link.href = '/coin/' + id; link.setAttribute('aria-label', 'Shared Moon');
    const ticker = document.createElement('span'); ticker.className = 'truncate'; ticker.textContent = '$MOON';
    const image = document.createElement('img'); image.src = 'https://images.pump.fun/coin-image/' + id + '?ipfs=QmShared';
    card.append(link, ticker, image); document.body.append(card);
  }, id);
  const history = () => service.evaluate(async () => (await chrome.storage.local.get('tokenHistory')).tokenHistory);
  await addToken(fixture, 'A'.repeat(32));
  await addToken(fixture, 'B'.repeat(32));
  await waitFor(async () => (await history())?.tokens.length === 2, 'collect different tokens');
  await addToken(fixture, 'A'.repeat(32));
  await manager.getByRole('tab', {name:'Token history',exact:true}).click();
  await waitFor(async () => await manager.locator('.history-count').first().textContent() === '2', 'grouped names');
  await manager.locator('#history-field').selectOption('ticker');
  assert.equal(await manager.locator('.history-count').first().textContent(), '2');
  await manager.locator('#history-field').selectOption('image');
  assert.equal(await manager.locator('.history-count').first().textContent(), '2');
  await manager.screenshot({path:path.join(root,'artifacts','token-history.png'),fullPage:true});
  await manager.reload();
  await manager.getByRole('tab', {name:'Token history',exact:true}).click();
  await waitFor(async () => await manager.locator('.history-count').first().textContent() === '2', 'history persistence');
  await fixture.reload();
  await addToken(fixture, 'A'.repeat(32));
  const second = await context.newPage();
  await second.route('https://pump.fun/**', route => route.fulfill({contentType:'text/html',body:'<html><body>Tokens</body></html>'}));
  await second.goto('https://pump.fun/second');
  await Promise.all([addToken(second,'B'.repeat(32)), addToken(fixture,'C'.repeat(32)), addToken(second,'D'.repeat(32))]);
  await waitFor(async () => (await history())?.tokens.length === 4, 'cross-tab collection without lost writes or duplicates');
  await manager.locator('#enabled').uncheck();
  await addToken(second, 'E'.repeat(32));
  await new Promise(resolve => setTimeout(resolve, 1300));
  assert.equal((await history()).tokens.length, 4);
  await manager.locator('#enabled').check();
  await waitFor(async () => (await history())?.tokens.length === 5, 'collection resumes');
  await fixture.close(); await second.close();
  manager.once('dialog', dialog => dialog.accept());
  await manager.locator('#clear-history').click();
  await waitFor(async () => (await history())?.tokens.length === 0, 'clear history');
  assert.deepEqual(errors, []);
  console.log('Browser smoke passed: editing, worker test, imports, persistence, prompt generation, live highlights, dynamic content, red priority, pause/resume, rule toggles, regex timeout recovery, token history grouping, persistence, multi-tab deduplication, pause and reset.');
} finally { await context.close(); await rm(profile, { recursive: true, force: true }); }
