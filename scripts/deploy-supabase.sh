#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Read project_id from supabase/config.toml
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ID=$(grep '^project_id' "$SCRIPT_DIR/../supabase/config.toml" | sed 's/.*= *"\(.*\)"/\1/')
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: could not read project_id from supabase/config.toml${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running.${NC}"
    echo -e "${YELLOW}Please start Docker Desktop and try again.${NC}"
    exit 1
fi

# 1. Reset database, Apply config, Apply migrations, Deploy functions
# All of these are handled by stopping (wiping data) and starting fresh.
echo -e "${YELLOW}Step 1: Restarting Supabase services with a clean slate...${NC}"
echo -e "${YELLOW}(This will stop services, delete data volumes, and start fresh)${NC}"

# Stop and wipe data
npx supabase stop --no-backup
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to stop Supabase services.${NC}"
    # Continue anyway, as we want to start
fi

# Start services (Applies config, initializes DB, applies migrations, serves functions)
npx supabase start
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to start Supabase services.${NC}"
    exit 1
fi

echo -e "${GREEN}Supabase services started successfully.${NC}"
echo -e "${GREEN}Database has been reset, migrations applied, and edge functions are executing.${NC}\n"

echo -e "${GREEN}Local Supabase deployment/reset completed successfully!${NC}"

# 2. View Edge Function Logs
echo -e "${YELLOW}Tailing Edge Function logs... (Press Ctrl+C to exit)${NC}"
docker logs -f "supabase_edge_runtime_${PROJECT_ID}"
