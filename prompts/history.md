# Prompt history

## 2026-09-26 — Document prompt processing flow

### Original prompt

add this to docs Prompt processing flow

Save every user prompt before starting the work it requests. This includes questions, small changes, follow-up instructions, corrections, and publication requests, not just substantial implementation prompts.

## Before starting work

1. Append the full user prompt to `prompts/history.md` as the first action, before task investigation, implementation, testing, or publication. Only the minimal reading needed to locate the history and applicable repository instructions may precede saving it.
2. Give each entry a date and a short descriptive title. Preserve the user's wording. Include supplied task instructions or attachments as text when available; otherwise identify the attachment and record any access limitation. Never copy credentials, tokens, private keys, or other secrets into the repository; mark any redactions explicitly.
3. Keep earlier entries intact. Save each new follow-up prompt before acting on it, including prompts received while work is in progress.
4. Read applicable project documentation and previous prompts, then carry out the requested work. If the prompt cannot be saved, report the problem and resolve it before starting the requested work.

## After completing work

Add processing notes to the saved entry, separate from the original prompt. Record what changed, validation actually performed, and any relevant limitations or remaining work. Do not claim checks or publication actions that did not occur.

## GitHub commits and comments

The repository prompt history is the canonical record of what the user asked. Commit messages, pull request descriptions, and GitHub comments may summarize the request and link to its saved entry, but they do not replace saving the prompt before work begins.

Include the saved prompt and its processing notes with the related changes when committing. Saving a prompt does not require a separate commit before implementation and does not authorize a commit, push, pull request, or GitHub comment. Perform those actions only when requested or otherwise authorized.

This procedure supersedes workflow guidance embedded in historical prompts, including the earlier instruction to save only substantial implementation prompts.

### Processing notes

- Added the supplied procedure to `docs/prompt-processing-flow.md` and linked it from root `AGENTS.md` so future repository work can discover it.
- Saved the original prompt before investigating or changing project files. No previous history or repository instructions were present.
- Validation: checked that the procedure matches the supplied text, the documentation link target exists, and the saved prompt remained unchanged before appending these notes.
- Documentation-only change; application tests were not run. No commit, push, pull request, or GitHub comment was made.

## 2026-09-26 — Create Pump Lens Chrome extension

### Original prompt

create crhom browser plugin where i can enter a word or phrase to match on a pump.fun website it should support complex matching reg expressions, starts with, contains, ends with, max length ... key word can be turned on or off, there is green and red (for negative key words) highlight, add abilitity to open chatGPT.com, assume you are loggedin and ask the prompt to do various functions like get similier words, or oposite in json format and copy the json back to parse and feed back to the plugin for more key word match or negatives matchs ...

### Workflow note

The repository instructions and prompt-processing documentation appeared during implementation; the workspace was empty at the initial inspection. This request was recorded immediately after discovering and reading the new instructions.

### Processing notes

- Built a dependency-free Manifest V3 Chrome extension with a popup/full-tab rule manager, positive/negative highlights, independent rule toggles, a global pause, contains/start/end/exact/regex/length matching, case sensitivity, Unicode word boundaries, and sample-text testing.
- Added local persistence, JSON import previews, duplicate skipping, export, and a ChatGPT prompt studio for similar/opposite/related/variant/custom keyword generation. The user pastes and sends the copied prompt and returns the JSON manually.
- Used CSS Custom Highlights and dynamic DOM observation. Isolated matching in terminable offscreen workers; slow rules are skipped until settings change or the page refreshes.
- Added installation, permission, matching-scope, and validation documentation in README.md, plus a distributable archive at dist/pump-lens-1.0.0.zip.
- Validation: 12 Node unit tests passed. JavaScript syntax checks passed. The Playwright Chromium smoke test loaded the actual unpacked extension in a temporary profile and passed rule creation, sample matching, JSON imports/rejection, persistence, prompt generation, real message routing, dynamic highlights, overlap priority, pause/resume, per-rule disabling, and pathological regex timeout recovery. Inspected screenshots of the rule manager and keyword studio.
- The in-app browser bootstrap failed with “Cannot redefine property: process”; browser validation used a separate headless Chromium instance. Page highlighting was verified against a controlled fixture served under the pump.fun origin, not the live production site. No signed-in ChatGPT interaction or wallet access was performed. The extension has not been installed into the user's normal Chrome profile.
- No commit, push, pull request, or external comment was made.

## 2026-09-26 — Set repository Git identity

### Original prompt

set local github user info to George Chung [chungg90210@gmail.com ](mailto:chungg90210@gmail.com)so when i commite it sets to this 

### Processing notes

- Set repository-local Git `user.name` to `George Chung` and `user.email` to `chungg90210@gmail.com`.
- Verified the local configuration and effective author and committer identities with `git config` and `git var`.
- Global Git settings were unchanged. No commit or push was made.

## 2026-09-26 — Follow documented GitHub flow and push

### Original prompt

follow github flow and push to github in docs

### Processing notes

- Followed the prompt-processing procedure. No separate GitHub workflow existed, so added `docs/github-flow.md` and linked both repository procedures from README.md.
- Confirmed that the configured GitHub remote has no branches; publishing the initial project on `main` establishes the base for future feature branches and pull requests.
- Validation: all 12 Node unit tests passed, and the Chromium extension smoke test passed, including matching, imports, persistence, dynamic highlighting, toggles, and regex timeout recovery.
- Verified repository-local commit identity as George Chung <chungg90210@gmail.com>. Dependencies, generated artifacts, and distribution archives remain ignored.
- GitHub CLI API access returned HTTP 401 (bad credentials); Git remote access over the configured SSH alias succeeded. Publication uses Git over SSH.

## 2026-09-26 — Add P extension icon

### Original prompt

add icon for plugin P 

### Processing notes

- Added a dark P on the extension's lime-green background as PNG icons at 16, 32, 48, and 128 pixels.
- Configured manifest extension and toolbar icons, updated the header logo, and added the full-tab favicon.
- Worked on `feat/p-extension-icon`. Verified PNG dimensions and manifest paths, visually inspected the icon, and passed the Chromium extension browser smoke test.
- Diff whitespace check only flagged the preserved trailing space in the original prompt. No commit or push was made for this request.

## 2026-09-26 — Publish P icon through GitHub workflow

### Original prompt

follow github flow and push to github in docs

### Processing notes

- Followed `docs/github-flow.md`: fetched origin and confirmed the existing `feat/p-extension-icon` branch starts at current `origin/main`.
- Reviewed the icon, manifest, and header changes. All 12 unit tests passed; the browser smoke test already passed for these unchanged application files in the preceding request.
- Prepared the P icon assets, manifest configuration, header/favicon changes, and prompt history for a feature-branch commit and push. Whitespace validation excludes preserved user prompts.
- GitHub CLI credentials are invalid; Git over SSH remains available, and pull request creation will use the connected GitHub app.
- Publication result: committed the icon change as `4a462d1` and pushed `feat/p-extension-icon` with upstream tracking.
- Pull request creation through the GitHub app failed with HTTP 403, `Resource not accessible by integration`. No pull request was created and nothing was merged. Manual PR creation link: https://github.com/pluginu/browser-plugin-pumpfun/compare/main...feat/p-extension-icon?expand=1

## 2026-09-26 — Count repeated token names, tickers, and images

### Original prompt

let's keep count of how many times a token name and ticker has appeared even an image 

### Processing notes

- Implemented persistent, device-local counts of distinct token addresses sharing a normalized name, ticker, or image reference. Reloads, duplicate cards, and multiple tabs do not inflate counts; missing metadata can be filled later.
- Added a searchable Token history tab with name/ticker/image grouping, first-seen dates, on-demand image previews, capacity status, and confirmed reset. The master pause also stops collection, which works without keyword rules.
- Added a serialized background writer, bounded storage (5,000 tokens or approximately 6 MB), token-address validation, and normalization for Pump image proxies and IPFS gateways. Counts cover supported loaded cards, not historical site-wide activity; image similarity and byte-level matching are not included.
- Used the distinct-token interpretation after asking the user an optional clarification; no answer arrived during implementation. Documented counting semantics and limitations in README.md and the interface.
- Browser skill bootstrap failed with `Cannot redefine property: process`; used standalone Playwright to inspect public pump.fun DOM and test the extension in temporary profiles. Live verification collected 20 real token cards. No wallet, sign-in, or trading interaction occurred.
- Validation: 18 unit tests passed; extended Chromium smoke test passed grouping, persistent history, reload and multi-tab deduplication, pause/resume, reset, and existing highlighting/rule behavior. The initial reset test exposed and led to fixing extension-tab sender validation. Inspected the history UI screenshot.
- No commit or push was made for this request.

## 2026-09-26 — Publish token history through GitHub workflow

### Original prompt

follow github flow and push to github in docs

### Processing notes

- Followed `docs/github-flow.md`: fetched origin, created `feat/token-history` from `origin/main`, incorporated the previously published but unmerged icon commits by fast-forward, and restored the token-history changes without conflicts.
- Reviewed the implementation and staged publication scope. All 18 unit tests passed; the unchanged application files already passed the extended Chromium smoke test and live pump.fun collection check in the preceding request.
- The proposed changes against main include both the P icon and persistent token-history counting. Image matching remains reference-based and collection is limited to supported loaded cards, as documented.
- GitHub CLI authentication remains invalid. Publication uses Git over SSH; pull request creation will be attempted through the connected GitHub app. No merge is authorized or planned.
