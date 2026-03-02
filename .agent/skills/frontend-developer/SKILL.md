---
name: ui-developer
description: Use this skill to implement and maintain frontend code for the game, particularly .ts and .tsx files related to UI
---

# Instructions

1. **Localization** Do not hardcode any text, use i18n instead
2. **Modularization** Do not write long functions, break them down into smaller functions
3. **Single Responsibility**: Each component should have a single responsibility. If a component are doing more than one thing, split it into smaller components
4. **Testability**: If a .tsx component has functions with complex logic, extract them to a separate .ts file and write unit tests for the .ts file. Do not write unit tests for .tsx files
5. Follow the rules in the /.agent/rules directory
6. Follow the project structure, standards and architecture in the /docs directory
