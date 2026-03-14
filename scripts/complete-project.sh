#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting project completion workflow...${NC}\n"

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}Current branch: $CURRENT_BRANCH${NC}\n"

if [ "$CURRENT_BRANCH" = "main" ]; then
    echo -e "${RED}You are currently on the main branch.${NC}"
    echo -e "${RED}This script should be run from a feature branch, not main.${NC}"
    exit 1
fi

# Check for uncommitted changes
echo -e "${YELLOW}Checking for uncommitted changes...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}You have uncommitted or unstaged changes:${NC}\n"
    git status --short
    echo -e "\n${RED}Please commit or stash your changes before running this script.${NC}"
    exit 1
fi

echo -e "${GREEN}Working directory is clean.${NC}\n"

# Check translation synchronization
echo -e "${YELLOW}Checking translation key synchronization...${NC}"
node scripts/check-translations.js
if [ $? -ne 0 ]; then
    echo -e "${RED}Translation check failed. Please synchronize all translation files.${NC}"
    exit 1
fi

echo -e "${GREEN}Translation keys are synchronized.${NC}\n"

# Full lint check
echo -e "${YELLOW}Running full lint check (ESLint + Type Check)...${NC}"
npm run lint && npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Lint check, Type check or Build failed (errors or warnings found). Please fix them before proceeding.${NC}"
    exit 1
fi

echo -e "${GREEN}Lint and Type checks passed.${NC}\n"

# Fetch latest changes
echo -e "${YELLOW}Fetching latest changes from origin...${NC}"
git fetch origin
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to fetch from origin. Please check your connection.${NC}"
    exit 1
fi

echo -e "${GREEN}Successfully fetched latest changes.${NC}\n"

# Merge main into current branch
echo -e "${YELLOW}Merging main into $CURRENT_BRANCH...${NC}"
git merge origin/main --no-edit
if [ $? -ne 0 ]; then
    echo -e "${RED}Merge conflicts detected!${NC}"
    echo -e "${YELLOW}Please resolve the conflicts manually, then run this script again.${NC}"
    git merge --abort
    exit 1
fi

echo -e "${GREEN}Successfully merged main into $CURRENT_BRANCH.${NC}\n"

# Save the commit before the merge so we can roll back if tests fail
PRE_MERGE_SHA=$(git rev-parse HEAD)

# Run unit tests with coverage (enforces 90% statements/branches/functions/lines per file)
echo -e "${YELLOW}Running unit tests with coverage...${NC}"
npm run test:coverage -- --run
if [ $? -ne 0 ]; then
    echo -e "${RED}Unit tests or coverage thresholds failed. Rolling back merge from main...${NC}"
    git reset --hard "$PRE_MERGE_SHA"
    exit 1
fi

echo -e "${GREEN}Unit tests and coverage thresholds passed.${NC}\n"

# Run Edge Function tests
echo -e "${YELLOW}Running Edge Function tests (Deno)...${NC}"
if command -v deno &> /dev/null; then
    deno test --allow-all supabase/functions/
    if [ $? -ne 0 ]; then
        echo -e "${RED}Edge Function tests failed. Rolling back merge from main...${NC}"
        git reset --hard "$PRE_MERGE_SHA"
        exit 1
    fi
    echo -e "${GREEN}Edge Function tests passed.${NC}\n"
else
    echo -e "${YELLOW}Deno not found. Skipping Edge Function tests.${NC}"
    echo -e "${YELLOW}Please install Deno to ensure Edge Functions are tested locally.${NC}\n"
fi

# Push current branch changes
echo -e "${YELLOW}Pushing current branch changes...${NC}"
git push origin "$CURRENT_BRANCH"
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to push changes to origin.${NC}"
    exit 1
fi

echo -e "${GREEN}Successfully pushed changes.${NC}\n"

# Switch to main branch
echo -e "${YELLOW}Switching to main branch...${NC}"
git checkout main
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to checkout main branch. Staying on $CURRENT_BRANCH.${NC}"
    exit 1
fi

echo -e "${GREEN}Switched to main branch.${NC}\n"

# Merge feature branch into main
echo -e "${YELLOW}Merging $CURRENT_BRANCH into main...${NC}"
git merge "$CURRENT_BRANCH" --no-edit
if [ $? -ne 0 ]; then
    echo -e "${RED}Merge conflicts detected!${NC}"
    echo -e "${YELLOW}Please resolve the conflicts manually.${NC}"
    git merge --abort
    git checkout "$CURRENT_BRANCH"
    exit 1
fi

echo -e "${GREEN}Successfully merged $CURRENT_BRANCH into main.${NC}\n"

# Run unit tests on main
echo -e "${YELLOW}Running unit tests on main...${NC}"
npm run test -- --run
if [ $? -ne 0 ]; then
    echo -e "${RED}Unit tests failed on main. Rolling back...${NC}"
    git reset --hard HEAD~1
    git checkout "$CURRENT_BRANCH"
    exit 1
fi

echo -e "${GREEN}Unit tests passed on main.${NC}\n"

# Run Edge Function tests on main
echo -e "${YELLOW}Running Edge Function tests on main...${NC}"
if command -v deno &> /dev/null; then
    deno test --allow-all supabase/functions/
    if [ $? -ne 0 ]; then
        echo -e "${RED}Edge Function tests failed on main. Rolling back...${NC}"
        git reset --hard HEAD~1
        git checkout "$CURRENT_BRANCH"
        exit 1
    fi
    echo -e "${GREEN}Edge Function tests passed on main.${NC}\n"
else
    echo -e "${YELLOW}Deno not found. Skipping Edge Function tests on main.${NC}\n"
fi

# Run E2E tests on main
echo -e "${YELLOW}Running E2E tests on main...${NC}"
npm run test:e2e
if [ $? -ne 0 ]; then
    echo -e "${RED}E2E tests failed on main. Rolling back...${NC}"
    git reset --hard HEAD~1
    git checkout "$CURRENT_BRANCH"
    exit 1
fi

echo -e "${GREEN}E2E tests passed on main.${NC}\n"

# Push main to origin
echo -e "${YELLOW}Pushing main to origin...${NC}"
git push origin main
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to push main to origin. Switching back to $CURRENT_BRANCH...${NC}"
    git checkout "$CURRENT_BRANCH"
    exit 1
fi

echo -e "${GREEN}Successfully pushed main to origin.${NC}\n"

# Delete feature branch locally and remotely
echo -e "${YELLOW}Deleting branch $CURRENT_BRANCH...${NC}"
git branch -d "$CURRENT_BRANCH"
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to delete local branch $CURRENT_BRANCH.${NC}"
    exit 1
fi

git push origin --delete "$CURRENT_BRANCH"
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Failed to delete remote branch $CURRENT_BRANCH. You may need to delete it manually.${NC}"
fi

echo -e "${GREEN}Successfully deleted branch $CURRENT_BRANCH locally and remotely.${NC}\n"

echo -e "${GREEN}Project completion workflow finished successfully!${NC}"
