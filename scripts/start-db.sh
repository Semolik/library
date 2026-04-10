#!/usr/bin/env bash

# Script to start Docker PostgreSQL for local development

set -e

DOCKER_COMPOSE_PATH="./deployment/docker-compose.local.yaml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐘 PostgreSQL Docker Startup Script${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker from https://www.docker.com"
    exit 1
fi

# Check if docker-compose file exists
if [ ! -f "$DOCKER_COMPOSE_PATH" ]; then
    echo -e "${RED}❌ Docker Compose file not found: $DOCKER_COMPOSE_PATH${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Checking Docker daemon...${NC}"
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon is not running${NC}"
    echo "Please start Docker Desktop or Docker daemon"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -q '^starter-postgres$'; then
    echo -e "${YELLOW}ℹ️  PostgreSQL container already exists${NC}"

    if docker ps --format '{{.Names}}' | grep -q '^starter-postgres$'; then
        echo -e "${GREEN}✅ PostgreSQL is already running${NC}"
    else
        echo -e "${YELLOW}⏸️  Starting existing PostgreSQL container...${NC}"
        docker-compose -f "$DOCKER_COMPOSE_PATH" start postgres
        echo -e "${GREEN}✅ PostgreSQL started${NC}"
    fi
else
    echo -e "${YELLOW}🚀 Starting PostgreSQL container...${NC}"
    docker-compose -f "$DOCKER_COMPOSE_PATH" up -d postgres
    echo -e "${GREEN}✅ PostgreSQL started${NC}"
fi

echo ""

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker-compose -f "$DOCKER_COMPOSE_PATH" exec -T postgres pg_isready -U postgres &> /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
        break
    fi

    attempt=$((attempt + 1))
    echo -n "."
    sleep 1
done

if [ $attempt -eq $max_attempts ]; then
    echo ""
    echo -e "${RED}❌ PostgreSQL failed to start${NC}"
    echo "Check logs with: docker-compose -f $DOCKER_COMPOSE_PATH logs postgres"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 PostgreSQL is ready!${NC}"
echo ""
echo -e "${BLUE}Connection info:${NC}"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  User: postgres"
echo "  Password: postgres"
echo "  Database: library"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  View logs:     docker-compose -f $DOCKER_COMPOSE_PATH logs -f postgres"
echo "  Stop:          docker-compose -f $DOCKER_COMPOSE_PATH stop postgres"
echo "  Restart:       docker-compose -f $DOCKER_COMPOSE_PATH restart postgres"
echo "  Remove:        docker-compose -f $DOCKER_COMPOSE_PATH down"
echo ""

