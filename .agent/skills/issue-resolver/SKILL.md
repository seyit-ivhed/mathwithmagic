---
name: issue-resolver
description: Use this skill to autonomously resolve a GitHub issue end-to-end — coding, reviewing, testing, and pinging the developer
---

# Goal

Fully resolve the assigned GitHub issue by writing code, reviewing it, testing it, and pinging the developer for human review.

# Instructions

## 1. Understand the issue
- Read the full issue title, description, and any comments carefully
- Ask clarifying questions as issue comments if the requirements are ambiguous before writing any code

## 2. Create a branch
- Always create a new branch from `main` using the naming pattern: `copilot/issue-<issue-number>-<short-description>`
- Never commit directly to `main`

## 3. Implement the solution (Frontend Developer skill)
- Read and follow all rules in `/docs/developer-expectations.md`
- Follow the project structure, standards, and architecture described in `/docs/technical-architecture.md` and other files in `/docs`

## 4. Write tests
- Write unit tests for any new or modified `.ts` logic files
- Follow the testing rules in `/docs/developer-expectations.md`
- Run existing tests to confirm nothing is broken
- Do NOT add unit tests for `.tsx` files, but ensure that any complex logic in them is properly extracted into `.ts` files and those are unit tested

## 5. Review the code (Code Reviewer skill)
- Follow all instructions in `/.agent/skills/code-reviewer/SKILL.md`
- Check every file you have added or modified against the rules in `/docs/developer-expectations.md`
- Check for gaps in test coverage and address them
- Fix all issues found during review before finishing the implementation

## 6. Push and Comment
- Push the branch to the repository
- Go back to the issue and add a comment pinging the developer
- In the comment, include:
  - The name of the branch you created
  - A summary of the changes made
  - Any decisions or trade-offs worth highlighting
- DO NOT create a pull request. The developer will review the branch directly and merge it when ready.
