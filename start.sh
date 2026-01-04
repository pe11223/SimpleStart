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

# --- Start Backend ---
echo "-----------------------------------"
echo "🐍 Starting Backend (Port 8000)..."
cd backend
source venv/bin/activate
# Run uvicorn in background
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# --- Start Frontend ---
echo "-----------------------------------"
echo "⚛️ Starting Frontend (Port 3000)..."
cd frontend
# Run Next.js in background, binding to all interfaces for server access
npm start -- -H 0.0.0.0 -p 3000 &
FRONTEND_PID=$!
cd ..

echo "-----------------------------------"
echo "✅ Application is running!"
echo "   Backend API: http://<server-ip>:8000"
echo "   Frontend UI: http://<server-ip>:3000"
echo "   (Press Ctrl+C to stop both)"
echo "-----------------------------------"

# Wait for background processes
wait
