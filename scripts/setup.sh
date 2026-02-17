#!/bin/bash

# OVRMS Installation Script
# Automated setup for development environment

set -e  # Exit on error

echo "======================================"
echo "OVRMS Installation Script"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    echo "Please install PostgreSQL 13+ from https://www.postgresql.org"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL detected${NC}"

# Install backend dependencies
echo ""
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd backend
npm install
cd ..

# Install frontend dependencies
echo ""
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
cd frontend
npm install
cd ..

# Setup environment file
echo ""
echo -e "${BLUE}⚙️  Setting up environment configuration...${NC}"
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo -e "${RED}⚠️  Please edit backend/.env with your configuration${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Database setup
echo ""
read -p "Do you want to setup the database now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🗄️  Setting up database...${NC}"
    
    read -p "Enter PostgreSQL username [postgres]: " PG_USER
    PG_USER=${PG_USER:-postgres}
    
    read -p "Enter database name [ovrms]: " DB_NAME
    DB_NAME=${DB_NAME:-ovrms}
    
    # Create database
    echo "Creating database..."
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database may already exist"
    
    # Load schema
    echo "Loading schema..."
    sudo -u postgres psql -d $DB_NAME -f database/database-schema.sql
    
    echo -e "${GREEN}✅ Database setup complete${NC}"
else
    echo -e "${BLUE}ℹ️  Skipping database setup${NC}"
    echo "You can manually run: psql -d ovrms -f database/database-schema.sql"
fi

# Create necessary directories
echo ""
echo -e "${BLUE}📁 Creating required directories...${NC}"
mkdir -p backend/logs backend/uploads
echo -e "${GREEN}✅ Directories created${NC}"

# Final instructions
echo ""
echo "======================================"
echo -e "${GREEN}✅ Installation Complete!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your configuration"
echo "2. Start the backend: cd backend && npm run dev"
echo "3. Start the frontend: cd frontend && npm run dev"
echo "4. Access the app at http://localhost:5173"
echo ""
echo "For production deployment, see docs/DEPLOYMENT.md"
echo ""

# Optional: Start the application
read -p "Do you want to start the development servers now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🚀 Starting servers...${NC}"
    
    # Start backend in background
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait a bit for backend to start
    sleep 3
    
    # Start frontend
    cd frontend
    npm run dev
    
    # When frontend is stopped, also stop backend
    kill $BACKEND_PID
else
    echo -e "${GREEN}Setup complete! You can start the servers manually.${NC}"
fi
