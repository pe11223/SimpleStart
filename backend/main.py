from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from database import create_db_and_tables, get_session, engine
from models import Tool
from logic.crawler import crawl_tools
from logic.news import fetch_github_trending
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    
    # Initialize Scheduler
    # scheduler = AsyncIOScheduler()
    
    # Define the job function that creates its own session
    # async def scheduled_crawl():
    #     with Session(engine) as session:
    #         await crawl_tools(session)
            
    # Schedule: Run once a week (e.g., Sunday at 3 AM)
    # scheduler.add_job(scheduled_crawl, CronTrigger(day_of_week='sun', hour=3, minute=0))
    
    # Start scheduler
    # scheduler.start()
    # print("Scheduler started: Crawler set for every Sunday at 3:00 AM.")
    
    yield
    
    # scheduler.shutdown()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "SimpleStart API is running"}

import json
from pathlib import Path

# ... (imports)

@app.get("/tools")
def get_tools():
    # Serve directly from apps.json for manual configuration
    try:
        with open("apps.json", "r", encoding="utf-8") as f:
            tools = json.load(f)
        return tools
    except FileNotFoundError:
        return []

# @app.post("/tools") ... (comment out or leave as is if not used)
# For now, we disable the DB write endpoints as we are using manual JSON config


@app.post("/tools")
def create_tool(tool: Tool, session: Session = Depends(get_session)):
    session.add(tool)
    session.commit()
    session.refresh(tool)
    return tool

@app.put("/tools/{tool_id}")
def update_tool(tool_id: int, tool: Tool, session: Session = Depends(get_session)):
    db_tool = session.get(Tool, tool_id)
    if not db_tool:
        return {"error": "Tool not found"}
    
    tool_data = tool.model_dump(exclude_unset=True)
    for key, value in tool_data.items():
        setattr(db_tool, key, value)
    
    session.add(db_tool)
    session.commit()
    session.refresh(db_tool)
    return db_tool

@app.post("/crawl")
async def trigger_crawl(background_tasks: BackgroundTasks, session: Session = Depends(get_session)):
    # In a real app, we shouldn't pass session to background task like this directly 
    # if the request scope closes. But for this prototype it illustrates the point.
    # Better: Create a new session inside the task.
    # For now, we'll await it to ensure it runs for the demo.
    await crawl_tools(session)
    return {"message": "Crawler triggered"}

@app.get("/news")
async def get_news():
    news = await fetch_github_trending()
    return news
