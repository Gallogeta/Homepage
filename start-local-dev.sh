#!/bin/bash
# Start Local Development Environment for Homepage
# This script sets up and starts both backend and frontend

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Homepage Local Development Setup        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# ============================================
# 1. Setup Backend
# ============================================
echo -e "${CYAN}📦 Step 1: Setting up backend...${NC}"
cd "$BACKEND_DIR"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -q -r requirements.txt
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Create local database if it doesn't exist
if [ ! -f "data/db.sqlite3" ]; then
    echo "Creating local database..."
    python -c "
import sqlite3
import bcrypt
import os

os.makedirs('data', exist_ok=True)
conn = sqlite3.connect('data/db.sqlite3')
cursor = conn.cursor()

# Create users table
cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        is_verified INTEGER DEFAULT 0,
        is_approved INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        locked_until INTEGER DEFAULT 0,
        role TEXT DEFAULT 'user'
    )
''')

# Create pages table
cursor.execute('''
    CREATE TABLE IF NOT EXISTS pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        content TEXT
    )
''')

# Create admin user
password = '1234'
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
cursor.execute('''
    INSERT OR REPLACE INTO users (username, email, hashed_password, is_verified, is_approved, failed_count, locked_until, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
''', ('gallo', 'gallogeta@gmail.com', hashed, 1, 1, 0, 0, 'admin'))

conn.commit()
conn.close()
print('✓ Local database created')
"
    echo -e "${GREEN}✓ Database created with admin user: gallo/1234${NC}"
else
    echo -e "${YELLOW}Database already exists, skipping...${NC}"
fi

# ============================================
# 2. Setup Frontend
# ============================================
echo ""
echo -e "${CYAN}📦 Step 2: Setting up frontend...${NC}"
cd "$FRONTEND_DIR"

# Install npm dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
    echo -e "${GREEN}✓ npm dependencies installed${NC}"
else
    echo -e "${YELLOW}node_modules exists, skipping npm install...${NC}"
fi

# ============================================
# 3. Start Services
# ============================================
echo ""
echo -e "${CYAN}🚀 Step 3: Starting services...${NC}"
echo ""
echo -e "${GREEN}Starting backend on http://localhost:8000${NC}"
echo -e "${GREEN}Starting frontend on http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both services${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${CYAN}Stopping services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✓ Services stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend in background
cd "$BACKEND_DIR"
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 > /tmp/homepage-backend.log 2>&1 &
BACKEND_PID=$!

# Give backend a moment to start
sleep 2

# Start frontend in background
cd "$FRONTEND_DIR"
npm run dev > /tmp/homepage-frontend.log 2>&1 &
FRONTEND_PID=$!

# Give frontend a moment to start
sleep 3

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ Development Server Running! ✅     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Access your application:${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "  Backend:  ${GREEN}http://localhost:8000${NC}"
echo ""
echo -e "${CYAN}Admin Login:${NC}"
echo -e "  Username: ${GREEN}gallo${NC}"
echo -e "  Password: ${GREEN}1234${NC}"
echo ""
echo -e "${CYAN}Logs:${NC}"
echo -e "  Backend:  tail -f /tmp/homepage-backend.log"
echo -e "  Frontend: tail -f /tmp/homepage-frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for user to stop
wait
