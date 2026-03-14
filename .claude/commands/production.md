# Goal

Create a pull request from `main` to `production` summarizing all changes since the last merge.

# Instructions

1. Fetch the latest state of both `main` and `production` branches from the remote.
2. Identify all commits on `main` that are not yet in `production` using `git log production..main`.
3. Read through the diffs (`git diff production..main`) and commit messages to fully understand every change.
4. Draft the pull request with the three sections described below.
5. Check if there is already an open PR from `main` to `production`. If one exists, update its body instead of creating a duplicate.
6. Create (or update) the PR using `gh pr create --base production --head main` (or `gh pr edit`).

# Pull Request Format

Use the following template for the PR body. Fill in each section thoroughly based on the actual changes.

```
## Summary of changes

A developer-oriented summary of all changes since the last production merge.
Group related changes under clear sub-headings (e.g. Features, Bug fixes, Infrastructure, Performance, Code quality).
Reference relevant commit hashes or PR numbers where helpful.

## Release notes

A user-facing description of what changed, written in plain language that non-technical users can understand.
Use bullet points. Focus on what users will notice: new features, improved experiences, and fixed problems.
Do not mention internal refactors, CI/CD changes, or code-quality work unless it directly affects users.

## Smoke test plan

### Staging
Bulleted checklist of things to verify in the staging environment before promoting to production.
Focus on new or changed functionality and any areas with higher risk of regression.

### Production
Bulleted checklist of things to verify in production after the deploy.
Include quick sanity checks for critical paths (e.g. auth, payments, core gameplay) even if they were not directly changed.
```

# Output

Return the PR URL when done.
