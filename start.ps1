$env:BACKEND_PORT = "8000"
$env:FRONTEND_PORT = "3000"

Write-Host "🚀 Starting SimpleStart services..."

# Start Backend in a new window
Write-Host "🐍 Starting Backend (Port $env:BACKEND_PORT)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\activate; uvicorn main:app --reload --host 0.0.0.0 --port $env:BACKEND_PORT"

# Start Frontend in a new window
Write-Host "⚛️ Starting Frontend (Port $env:FRONTEND_PORT)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev -- -H 0.0.0.0 -p $env:FRONTEND_PORT"

Write-Host "-----------------------------------"
Write-Host "✅ Services started in new windows!"
Write-Host "   Frontend UI: http://localhost:$env:FRONTEND_PORT"
Write-Host "   Backend API: http://localhost:$env:BACKEND_PORT"
Write-Host "-----------------------------------"
