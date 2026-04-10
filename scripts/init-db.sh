#!/usr/bin/env bash

# Script to initialize database with migrations
# This script creates the database and runs Prisma migrations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗂️  Database Initialization Script${NC}"
echo ""

# Load environment variables
if [ -f ".env" ]; then
    source .env
    echo -e "${GREEN}✅ Loaded .env${NC}"
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Set defaults
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-library}"

# Build DATABASE_URL if not set
if [ -z "$DATABASE_URL" ]; then
    DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
    export DATABASE_URL
fi

echo -e "${YELLOW}📍 Database Configuration:${NC}"
echo "  Host: $POSTGRES_HOST"
echo "  Port: $POSTGRES_PORT"
echo "  Database: $POSTGRES_DB"
echo "  User: $POSTGRES_USER"
echo ""

# Check if we need to create the database
if [ "$POSTGRES_HOST" = "localhost" ] || [ "$POSTGRES_HOST" = "127.0.0.1" ]; then
    echo -e "${YELLOW}🔍 Checking if database exists...${NC}"

    POSTGRES_ADMIN_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/postgres"

    # Try to create database if it doesn't exist
    echo -e "${YELLOW}📝 Creating database if it doesn't exist...${NC}"
    psql "$POSTGRES_ADMIN_URL" -tc "SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_DB'" | grep -q 1 || \
    psql "$POSTGRES_ADMIN_URL" -c "CREATE DATABASE $POSTGRES_DB;" || true

    echo -e "${GREEN}✅ Database ready${NC}"
fi

# Navigate to API directory
cd "apps/api" || { echo -e "${RED}❌ apps/api directory not found${NC}"; exit 1; }

echo ""
echo -e "${YELLOW}📦 Generating Prisma Client...${NC}"
npx prisma generate

echo ""
echo -e "${YELLOW}🗂️  Running migrations...${NC}"
npx prisma migrate deploy || {
    echo -e "${YELLOW}⚠️  First migration run, using db push...${NC}"
    npx prisma db push
}

echo ""
echo -e "${GREEN}✅ Database initialized successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Run: npm run dev (from the api directory or root with turbo)"
echo "  2. The application will connect to the database automatically"

