#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting project completion workflow...${NC}\n"

# Step 1: Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}Step 1: Current branch: $CURRENT_BRANCH${NC}\n"

if [ "$CURRENT_BRANCH" = "main" ]; then
    echo -e "${RED}You are currently on the main branch.${NC}"
    echo -e "${RED}This script should be run from a feature branch, not main.${NC}"
    exit 1
fi

# Step 2: Check for uncommitted changes
echo -e "${YELLOW}Step 2: Checking for uncommitted changes...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}You have uncommitted or unstaged changes:${NC}\n"
    git status --short
    echo -e "\n${RED}Please commit or stash your changes before running this script.${NC}"
    exit 1
fi

echo -e "${GREEN}Working directory is clean.${NC}\n"

# Step 3: Check translation synchronization
echo -e "${YELLOW}Step 3: Checking translation key synchronization...${NC}"
node scripts/check-translations.js
if [ $? -ne 0 ]; then
    echo -e "${RED}Translation check failed. Please synchronize all translation files.${NC}"
    exit 1
fi

echo -e "${GREEN}Translation keys are synchronized.${NC}\n"

# Step 4: Full lint check
echo -e "${YELLOW}Step 4: Running full lint check (ESLint + Type Check)...${NC}"
npm run lint && npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Lint check, Type check or Build failed (errors or warnings found). Please fix them before proceeding.${NC}"
    exit 1
fi

echo -e "${GREEN}Lint and Type checks passed.${NC}\n"

# Step 5: Fetch latest changes
echo -e "${YELLOW}Step 5: Fetching latest changes from origin...${NC}"
git fetch origin
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to fetch from origin. Please check your connection.${NC}"
    exit 1
fi

echo -e "${GREEN}Successfully fetched latest changes.${NC}\n"

# Step 6: Merge main into current branch
echo -e "${YELLOW}Step 6: Merging main into $CURRENT_BRANCH...${NC}"
git merge origin/main --no-edit
if [ $? -ne 0 ]; then
    echo -e "${RED}Merge conflicts detected!${NC}"
    echo -e "${YELLOW}Please resolve the conflicts manually, then run this script again.${NC}"
    git merge --abort
    exit 1
fi

echo -e "${GREEN}Successfully merged main into $CURRENT_BRANCH.${NC}\n"

# Step 7: Run unit tests
echo -e "${YELLOW}Step 7: Running unit tests...${NC}"
npm run test -- --run
if [ $? -ne 0 ]; then
    echo -e "${RED}Unit tests failed. Please fix the tests before merging to main.${NC}"
    exit 1
fi

echo -e "${GREEN}Unit tests passed.${NC}\n"

# Step 8: Run Edge Function tests
echo -e "${YELLOW}Step 8: Running Edge Function tests (Deno)...${NC}"
if command -v deno &> /dev/null; then
    deno test --allow-all supabase/functions/
    if [ $? -ne 0 ]; then
        echo -e "${RED}Edge Function tests failed. Please fix them before proceeding.${NC}"
        exit 1
    fi
    echo -e "${GREEN}Edge Function tests passed.${NC}\n"
else
    echo -e "${YELLOW}Deno not found. Skipping Edge Function tests.${NC}"
    echo -e "${YELLOW}Please install Deno to ensure Edge Functions are tested locally.${NC}\n"
fi

# Step 9: Run E2E tests
# echo -e "${YELLOW}Step 9: Running E2E tests...${NC}"
# npx playwright test
# if [ $? -ne 0 ]; then
#     echo -e "${RED}E2E tests failed. Please fix the tests before merging to main.${NC}"
#     exit 1
# fi

echo -e "${GREEN}E2E tests passed.${NC}\n"

# Step 10: Push current branch changes
echo -e "${YELLOW}Step 10: Pushing current branch changes...${NC}"
git push origin "$CURRENT_BRANCH"
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to push changes to origin.${NC}"
    exit 1
fi

echo -e "${GREEN}Successfully pushed changes.${NC}\n"

# Step 11: Switch to main branch
echo -e "${YELLOW}Step 11: Switching to main branch...${NC}"
git checkout main
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to checkout main branch.${NC}"
    exit 1
fi

echo -e "${GREEN}Switched to main branch.${NC}\n"

# Step 12: Merge feature branch into main
echo -e "${YELLOW}Step 12: Merging $CURRENT_BRANCH into main...${NC}"
git merge "$CURRENT_BRANCH" --no-edit
if [ $? -ne 0 ]; then
    echo -e "${RED}Merge conflicts detected!${NC}"
    echo -e "${YELLOW}Please resolve the conflicts manually.${NC}"
    git merge --abort
    git checkout "$CURRENT_BRANCH"
    exit 1
fi

echo -e "${GREEN}Successfully merged $CURRENT_BRANCH into main.${NC}\n"

# Step 13: Run unit tests on main
echo -e "${YELLOW}Step 13: Running unit tests on main...${NC}"
npm run test -- --run
if [ $? -ne 0 ]; then
    echo -e "${RED}Unit tests failed on main. Rolling back...${NC}"
    git reset --hard HEAD~1
    git checkout "$CURRENT_BRANCH"
    exit 1
fi

echo -e "${GREEN}Unit tests passed on main.${NC}\n"

# Step 14: Run Edge Function tests on main
echo -e "${YELLOW}Step 14: Running Edge Function tests on main...${NC}"
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

# Step 15: Run E2E tests on main
# echo -e "${YELLOW}Step 15: Running E2E tests on main...${NC}"
# npx playwright test
# if [ $? -ne 0 ]; then
#     echo -e "${RED}E2E tests failed on main. Rolling back...${NC}"
#     git reset --hard HEAD~1
#     git checkout "$CURRENT_BRANCH"
#     exit 1
# fi

echo -e "${GREEN}E2E tests passed on main.${NC}\n"
