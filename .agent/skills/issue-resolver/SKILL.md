---
name: issue-resolver
description: Use this skill to autonomously resolve a GitHub issue end-to-end — coding, reviewing, testing, and opening a pull request
---

# Goal

Fully resolve the assigned GitHub issue by writing code, reviewing it, testing it, and creating a pull request for human review.

# Instructions

## 1. Understand the issue
- Read the full issue title, description, and any comments carefully
- Ask clarifying questions as issue comments if the requirements are ambiguous before writing any code

## 2. Create a branch
- Always create a new branch from `main` using the naming pattern: `copilot/issue-<issue-number>-<short-description>`
- Never commit directly to `main`

## 3. Implement the solution (Frontend Developer skill)
- Follow all instructions in `/.agent/skills/frontend-developer/SKILL.md`
- Follow all rules in `/.agent/rules/` directory
- Follow the project structure, standards, and architecture described in `/docs/technical-architecture.md` and other files in `/docs`
- Do not hardcode text — use i18n
- Break logic into small, focused functions and components (single responsibility)
- Extract complex logic from `.tsx` files into separate `.ts` files so they can be unit-tested

## 4. Write tests
- Write unit tests for any new or modified `.ts` logic files
- Follow the testing rules in `/.agent/rules/unit-testing.md` and `/.agent/rules/end-to-end-testing.md`
- Run existing tests to confirm nothing is broken

## 5. Review the code (Code Reviewer skill)
- Follow all instructions in `/.agent/skills/code-reviewer/SKILL.md`
- Check every file you have added or modified for violations of the rules in `/.agent/rules/`
- Check for gaps in test coverage and address them
- Fix all issues found during review before opening the pull request

## 6. Open a pull request
- Target the `main` branch
- Write a clear PR title and description that explains:
  - What issue is being resolved (link it with `Closes #<issue-number>`)
  - A summary of the changes made
  - Any decisions or trade-offs worth highlighting
- Request a human review before merging
