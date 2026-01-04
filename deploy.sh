#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting deployment setup for SimpleStart..."

# --- Check Prerequisites ---
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

# --- Backend Setup ---
echo "-----------------------------------"
echo "🐍 Setting up Backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing backend requirements..."
pip install -r requirements.txt

echo "Installing Playwright browsers..."
playwright install

deactivate
cd ..

# --- Frontend Setup ---
echo "-----------------------------------"
echo "⚛️ Setting up Frontend..."
cd frontend

echo "Installing frontend dependencies..."
npm install

echo "Building frontend..."
npm run build

cd ..

echo "-----------------------------------"
echo "✅ Deployment setup complete!"
echo "To start the application, run: ./start.sh"
