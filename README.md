# ToolsWeb - Developer Dashboard

A minimalist, high-performance developer dashboard with auto-updating tool links and download acceleration.

## Features
- **Dashboard:** Search (Google/Baidu/GitHub), Clock, and App Grid.
- **Design:** Modern Minimalist, Glassmorphism, Auto Dark/Light Mode.
- **Backend:** Python crawler to fetch latest tool versions (VS Code, Git).
- **Acceleration:** Smart link replacement for faster downloads in China (Azure CDN mirror, GitHub Proxy).

## Setup & Run

### 1. Backend (Python/FastAPI)

```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
playwright install chromium

# Run Server
uvicorn main:app --reload
```
API will run at `http://localhost:8000`.

### 2. Frontend (Next.js 14)

```bash
cd frontend
npm install
npm run dev
```
Frontend will run at `http://localhost:3000`.

## Logic
- The backend runs a crawler (triggered via API or scheduled) to find latest download links.
- `logic/accelerator.py` rewrites URLs (e.g., replaces standard VS Code CDN with Azure China CDN).
- Frontend fetches this data; if Backend is offline, it falls back to a default static list.
