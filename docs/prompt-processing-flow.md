# Prompt processing flow

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
