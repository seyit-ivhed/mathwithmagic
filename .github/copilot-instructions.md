# Copilot Coding Agent Instructions

When working on a GitHub issue, follow the **issue-resolver** skill defined in `/.agent/skills/issue-resolver/SKILL.md`.

Key points:
- Always create a new branch from `main` before making any changes. Use the pattern `copilot/issue-<issue-number>-<short-description>`.
- Write code following the **frontend-developer** skill in `/.agent/skills/frontend-developer/SKILL.md`.
- After writing code, review it following the **code-reviewer** skill in `/.agent/skills/code-reviewer/SKILL.md`.
- Run existing tests and add new unit tests for any logic you introduce.
- Open a pull request targeting `main` with a description that closes the issue.
