#!/usr/bin/env bash

# Complete startup script - starts DB and API

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Library Application${NC}"
echo ""

# Start database
echo -e "${YELLOW}📚 Step 1: Starting PostgreSQL...${NC}"
if [ -f "$SCRIPT_DIR/start-db.sh" ]; then
    bash "$SCRIPT_DIR/start-db.sh"
else
    echo -e "${YELLOW}⚠️  Database startup script not found. Make sure PostgreSQL is running.${NC}"
fi

echo ""
echo -e "${YELLOW}📚 Step 2: Starting API server...${NC}"
cd "$ROOT_DIR/apps/api"
npm run dev

