---
name: code-reviewer
description: Use this skill when the user asks you to review code, a branch, or a pull request
---

# Goal

Review code, branches, or pull requests for quality, best practices, and potential issues

# Instructions

- Identify the files which have been edited or added in the branch or pull request
- Look at the /.agent/rules directory for understanding the expected programming rules from the agents
- Look at the /docs directory and read all the files to understand the project structure and architecture, and standards
- Go through all the files edited or added in the current branch or pull request and check for any violations of the rules, standards or general good software development practices. 
- Look for test coverage of .ts files. If you see strong gaps suggest improvements
- Don't limit yourself to only the files edited or added, also check for any related files that might be affected by the changes
- Make a plan for improving the code and execute all improvements including the minor or optional ones

