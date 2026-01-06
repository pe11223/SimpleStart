#!/bin/bash

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit
}

# Trap SIGINT (Ctrl+C) to run cleanup
trap cleanup SIGINT

echo "🚀 Starting SimpleStart services..."

# Default Ports (can be overridden by environment variables)
BACKEND_PORT=${BACKEND_PORT:-8001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# --- Start Backend ---
echo "-----------------------------------"
echo "🐍 Starting Backend (Port $BACKEND_PORT)..."
cd backend
source venv/bin/activate
# Run uvicorn in background
uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT &
BACKEND_PID=$!
cd ..

# --- Start Frontend ---
echo "-----------------------------------"
echo "⚛️ Starting Frontend (Port $FRONTEND_PORT)..."
cd frontend
# Export BACKEND_PORT so Next.js server can proxy correctly
export BACKEND_PORT=$BACKEND_PORT
# Run Next.js in background, binding to all interfaces for server access
# Using 'npm run dev' for development flexibility (no build step required)
npm run dev -- -H 0.0.0.0 -p $FRONTEND_PORT &
FRONTEND_PID=$!
cd ..

echo "-----------------------------------"
echo "✅ Application is running!"
echo "   Backend API: http://<server-ip>:$BACKEND_PORT"
echo "   Frontend UI: http://<server-ip>:$FRONTEND_PORT"
echo "   (Press Ctrl+C to stop both)"
echo "-----------------------------------"

# Wait for background processes
wait
