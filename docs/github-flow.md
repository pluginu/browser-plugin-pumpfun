# GitHub workflow

Follow [Prompt processing flow](prompt-processing-flow.md) to record each request before work and add processing notes before committing.

## Initial publication

For an empty remote repository, commit the initial project on `main` and push it with upstream tracking. This establishes the base branch for subsequent pull requests.

## Subsequent changes

1. Fetch the remote and start a descriptive feature branch from the current `origin/main`.
2. Make the requested changes and record processing notes in `prompts/history.md`.
3. Run `npm test` and any additional checks appropriate to the change. Review the staged diff and keep generated artifacts and dependencies out of commits.
4. Commit with a concise description of the change and push the feature branch.
5. Open a pull request against `main` with a description of the resulting behavior and validation.
6. Address review feedback and required checks. Merge only when authorized, then update local `main`.

Perform commits, pushes, pull requests, and GitHub comments only within the user's authorized scope. Never force-push or overwrite unrelated work as part of routine publication.
