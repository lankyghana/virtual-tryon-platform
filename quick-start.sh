#!/bin/bash

# Quick Start Script for Virtual Try-On Platform
# This script automates the initial setup process

set -e

echo "🚀 Virtual Try-On Platform - Quick Start"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found. Please install Python 3.10+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Python 3 found${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker not found. Will use local PostgreSQL/Redis${NC}"
    USE_DOCKER=false
else
    echo -e "${GREEN}✅ Docker found${NC}"
    USE_DOCKER=true
fi

# Check pip
if ! command -v pip &> /dev/null; then
    echo -e "${RED}❌ pip not found. Please install pip${NC}"
    exit 1
fi
echo -e "${GREEN}✅ pip found${NC}"

echo ""
echo -e "${GREEN}All prerequisites met!${NC}"
echo ""

# Setup backend
echo -e "${YELLOW}Setting up backend...${NC}"
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -q -r requirements.txt

echo -e "${GREEN}✅ Backend dependencies installed${NC}"

# Create .env if doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit backend/.env with your credentials:${NC}"
    echo "  - DATABASE_URL"
    echo "  - REDIS_URL"
    echo "  - AWS credentials"
    echo "  - Google OAuth credentials"
    echo "  - JWT_SECRET_KEY"
    echo ""
    echo "Press Enter when ready..."
    read
fi

cd ..

# Start services
if [ "$USE_DOCKER" = true ]; then
    echo -e "${YELLOW}Starting PostgreSQL and Redis with Docker...${NC}"
    docker-compose up -d postgres redis
    
    echo "Waiting for services to be ready..."
    sleep 10
    
    echo -e "${GREEN}✅ Services started${NC}"
else
    echo -e "${YELLOW}⚠️  Make sure PostgreSQL and Redis are running locally${NC}"
fi

# Initialize database
echo -e "${YELLOW}Initializing database...${NC}"
cd backend
source venv/bin/activate
python scripts/init_db.py
cd ..

echo ""
echo -e "${GREEN}✨ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your credentials"
echo "2. Start the backend:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   uvicorn app.main:app --reload"
echo ""
echo "3. Visit http://localhost:8000/docs"
echo ""
echo "For GPU worker setup, see docs/SETUP_GUIDE.md"
echo ""
