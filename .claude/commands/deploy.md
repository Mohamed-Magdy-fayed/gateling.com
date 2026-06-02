# /deploy

Run the full pre-deployment checklist, commit all changes with a descriptive message, and push to the remote to trigger Vercel deployment.

## Steps

Run in strict sequence. Abort with a clear error message if any step fails — never push if quality gates did not pass.

### 1. Type-check

```bash
npm run typecheck
```

Must exit with zero errors. If there are errors, stop here, report them, and ask whether to fix them first.

### 2. Production build

```bash
npm run build
```

Must complete without errors. If the build fails, stop here, report the errors, and ask whether to fix them first.

### 3. Analyse what changed

Run `git status` and `git diff HEAD` to read the full diff of staged and unstaged changes.

Write a concise, descriptive commit message that accurately reflects what actually changed — not a generic "update files" message. The message should:
- Use the imperative mood (e.g. "Add X", "Fix Y", "Refactor Z")
- Cover the most significant changes in the subject line (72 chars max)
- Add a brief body if multiple unrelated areas changed

### 4. Stage and commit

Stage all modified and untracked files that belong to the change (be selective — never stage `.env`, secrets, or build artifacts).

Commit using the message from step 3, with the Co-Authored-By trailer:

```
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

### 5. Push

```bash
git push
```

Push to the tracked remote branch. This triggers Vercel deployment automatically.

## Done

Report the commit hash, the commit message used, and confirm the push succeeded. Remind the user to watch the Vercel dashboard for the deployment status.
