from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, BackgroundTasks, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlmodel import Session, select
from database import create_db_and_tables, get_session, engine
from models import Tool
from urllib.parse import quote
from logic.crawler import crawl_tools
from logic.news import fetch_github_trending
from logic.epub_tool import replace_terms_in_epub
from logic.pdf_tool import convert_pdf_to_images
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import json
import csv
import io
import zipfile

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Processing-Stats", "Content-Disposition"],
)

@app.get("/")
def read_root():
    return {"message": "SimpleStart API is running"}

@app.get("/tools")
def get_tools():
    try:
        with open("apps.json", "r", encoding="utf-8") as f:
            tools = json.load(f)
        return tools
    except FileNotFoundError:
        return []

from typing import List

# ... (previous imports)

@app.post("/api/tools/epub-replace")
async def epub_replace(
    files: List[UploadFile] = File(...),
    glossary_file: UploadFile = File(...),
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
        
    for file in files:
        if not file.filename.endswith(".epub"):
            raise HTTPException(status_code=400, detail=f"File {file.filename} is not an EPUB")

    glossary_content = await glossary_file.read()
    glossary = {}

    try:
        if glossary_file.filename.endswith(".json"):
            glossary = json.loads(glossary_content.decode("utf-8"))
        elif glossary_file.filename.endswith(".csv") or glossary_file.filename.endswith(".txt"):
            csv_str = glossary_content.decode("utf-8")
            reader = csv.reader(io.StringIO(csv_str))
            for row in reader:
                if len(row) >= 2:
                    glossary[row[0]] = row[1]
        else:
             raise HTTPException(status_code=400, detail="Glossary must be JSON or CSV")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse glossary: {str(e)}")

    if not glossary:
        raise HTTPException(status_code=400, detail="Glossary is empty")

    processed_files = []
    total_stats = []

    try:
        for file in files:
            content = await file.read()
            new_epub_bytes, count = replace_terms_in_epub(content, glossary)
            processed_files.append((file.filename, new_epub_bytes))
            total_stats.append(f"{file.filename}: {count} replacements")

        # Create report string
        report = "Processing Report\n=================\n\n" + "\n".join(total_stats)
        
        # If single file, return it directly but include stats in header
        if len(processed_files) == 1:
            filename, content = processed_files[0]
            modified_filename = f"modified_{filename}"
            encoded_filename = quote(modified_filename)
            encoded_stats = quote(total_stats[0])
            
            return Response(
                content=content,
                media_type="application/epub+zip",
                headers={
                    "Content-Disposition": f"attachment; filename*=utf-8''{encoded_filename}",
                    "X-Processing-Stats": encoded_stats
                }
            )
        else:
            # Multiple files: Return ZIP
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
                for filename, content in processed_files:
                    zf.writestr(f"modified_{filename}", content)
                zf.writestr("report.txt", report)
            
            zip_buffer.seek(0)
            zip_bytes = zip_buffer.read()
            
            encoded_filename = quote("batch_processed_epubs.zip")
            encoded_stats = quote(f"Processed {len(files)} files")
            
            return Response(
                content=zip_bytes,
                media_type="application/zip",
                headers={
                    "Content-Disposition": f"attachment; filename*=utf-8''{encoded_filename}",
                    "X-Processing-Stats": encoded_stats
                }
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.post("/api/tools/pdf-to-image")
async def pdf_to_image(
    file: UploadFile = File(...)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    pdf_content = await file.read()

    try:
        images = convert_pdf_to_images(pdf_content)
        
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            base_name = file.filename.rsplit('.', 1)[0]
            for i, img_bytes in enumerate(images):
                zf.writestr(f"{base_name}_page_{i+1}.png", img_bytes)
        
        zip_buffer.seek(0)
        zip_bytes = zip_buffer.read()

        filename = f"{file.filename.rsplit('.', 1)[0]}_images.zip"
        encoded_filename = quote(filename)

        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename*=utf-8''{encoded_filename}"
            }
        )
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

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
    await crawl_tools(session)
    return {"message": "Crawler triggered"}

@app.get("/news")
async def get_news():
    news = await fetch_github_trending()
    return news