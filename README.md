# Pump Lens

A Chrome Manifest V3 extension for green positive and red negative keyword highlights on **pump.fun**. No build step, backend, API key, or runtime dependency.

## Install

1. Open `chrome://extensions` in Chrome 116 or newer.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select this project folder (the folder containing `manifest.json`).
4. Pin **Pump Lens** in Chrome's extensions menu.
5. Open or refresh `https://pump.fun`, then click the extension to add rules. **Expand** opens the manager in a full tab.

After changing extension source, click Reload on its card at `chrome://extensions`, then refresh pump.fun.

## Matching

- Contains, starts with, ends with, exact, JavaScript regular expressions, or length-only rules.
- Independent enable/disable toggles and a master pause switch.
- Green positive and red negative highlights. Red wins when highlights overlap; negatives do not hide tokens or suppress other matches.
- Optional case sensitivity, Unicode-aware whole words, and minimum/maximum lengths.
- Regex supports `i`, `m`, `s`, and `u` flags. Enter the pattern without `/` delimiters. Matching is always global. The `i` flag overrides the case-sensitive checkbox.
- Sample-text testing in the rule editor runs the same engine as the page.
- Settings persist locally. JSON backups preserve individual rule settings; imports merge and skip exact duplicates.

**Matching scope:** Rules inspect each visible DOM text node as a separate segment, including page labels and descriptions. Start/end/exact and length limits apply to the entire trimmed segment, not just the matched substring or a whole token card. Length counts Unicode code points; a phrase split between HTML elements does not match across that boundary. Content in iframes and shadow roots is not scanned. New and changed page content is rescanned automatically.

**Limits:** 200 saved rules, 300 characters per pattern, 2,500 eligible text segments per scan, 5,000 UTF-16 code units per segment, 100 matches per rule/segment, and 10,000 matching rule/segment pairs per scan. Very long segments are skipped. A worker watchdog stops slow rules and skips them on that page until rules change or the page is refreshed. Slow-rule evaluation has a 200 ms per-rule budget and each scan has a 5 s budget. The footer shows scan status when the popup is opened on pump.fun. Match counters count rule occurrences, including overlaps.

## ChatGPT keyword studio

1. Enter a seed phrase and choose similar words, opposites, related themes, spelling variants, or a custom instruction.
2. Review or edit the generated prompt.
3. Click **Copy prompt & open ChatGPT**.
4. In your signed-in ChatGPT tab, paste and send the prompt. Copy the resulting JSON.
5. Return to Pump Lens → **Import / export**, paste the response, and click **Preview import**.
6. Review the positive/negative list, then click **Add these rules**.

The extension opens ChatGPT and copies your prompt. Sending the prompt and copying the response are manual; it does not read your ChatGPT session, submit messages automatically, or scrape replies. Opposite-word generation goes into the negative list by default. No text from pump.fun is sent to ChatGPT automatically.

```json
{
  "positive": ["cat", "kitten", "feline"],
  "negative": ["scam", "rug"]
}
```

Also accepts an array of strings, an array of full rule objects, or `{ "rules": [...] }` backups. Markdown JSON fences are accepted. Malformed imports are rejected entirely. Imports are additive; they never replace existing rules. The global pause state is not part of a rules backup.

```json
{
  "rules": [
    { "pattern": "cat|kitten", "mode": "regex", "polarity": "positive", "enabled": true, "wholeWord": true, "maxLength": 60 },
    { "pattern": "rug", "mode": "contains", "polarity": "negative", "enabled": true },
    { "mode": "length", "maxLength": 12, "polarity": "positive" }
  ]
}
```

## Privacy and implementation

- `storage`: save rules on this device.
- `offscreen`: run a terminable matching worker outside the page.
- `clipboardWrite`: copy a prompt only when you click a copy button.
- Content scripts run only on HTTPS pump.fun and its subdomains. There is no ChatGPT host permission, analytics, remote code, or network API integration.
- Highlights use the [CSS Custom Highlight API](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API), leaving the site's DOM structure intact.
- Regex evaluation uses a worker hosted by a [Chrome offscreen document](https://developer.chrome.com/docs/extensions/reference/api/offscreen), so a pathological expression can be terminated.

## Development and validation

```sh
npm test
```

Tests use Node's built-in test runner. To preview the interface without installing:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Visit `http://127.0.0.1:8765`. This preview uses isolated localStorage and cannot highlight pump.fun. It does not share settings with the installed extension.

Optional end-to-end test (downloads a separate Chromium browser and uses a temporary browser profile):

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node tests/browser-smoke.mjs
```

The browser smoke test uses a locally fulfilled pump.fun fixture to exercise real extension messaging, dynamic highlights, red overlap priority, master pause, imports, persistence, and regex timeout recovery. It does not require or interact with a wallet or ChatGPT account.

Repository procedures: [Prompt processing](docs/prompt-processing-flow.md) and [GitHub workflow](docs/github-flow.md).

## Token history

Open **Token history** to see how many distinct token addresses share a name, ticker, or image. Collection starts with this version and persists locally across visits and browser restarts. Reloads, repeated cards, and multiple tabs do not increase a token's count. Names and tickers ignore case, repeated whitespace, and Unicode compatibility differences. The first observed metadata is retained; missing fields can be filled later.

The collector reads visible supported token cards loaded in the page, including the current pump.fun trending rows. It does not crawl all tokens, recover historical appearances, or read metadata from arbitrary page text. Layout changes or unsupported card layouts can leave tokens uncounted. The **Live / Paused** switch controls both highlighting and collection; collection works without keyword rules.

Image counts match the image reference, not visual similarity or file contents. Pump image proxies and IPFS gateway references are normalized so size variants can match. Identical pictures uploaded to different URLs may not match. **Show image** loads that saved image from its original host on demand; unavailable images still retain their counts.

History keeps up to 5,000 distinct tokens or approximately 6 MB, whichever comes first. It stops adding new entries at capacity rather than silently deleting old counts. **Clear history** resets counts after confirmation; open pages may immediately collect their tokens again. History is separate from keyword-rule JSON imports and exports.
