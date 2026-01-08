from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, BackgroundTasks, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
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
import httpx
import base64
import os
import shutil

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

# Mount uploads directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Processing-Stats", "Content-Disposition"],
)

from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from playwright.async_api import async_playwright

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_path = f"uploads/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return the URL relative to the server
        # Assuming server is on port 8000
        url = f"http://localhost:8000/uploads/{file.filename}"
        return {"url": url, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/api/favicon")
async def get_favicon(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    # 1. Ensure URL has schema
    if not url.startswith("http"):
        url = "https://" + url

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
    }

    # Strategy 1: Fast & Lightweight (HTTPX + BeautifulSoup)
    try:
        async with httpx.AsyncClient(follow_redirects=True, verify=False, timeout=5.0) as client:
            # 2. Try to fetch the page HTML directly
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                # 3. Parse HTML for icon links
                soup = BeautifulSoup(resp.text, 'html.parser')
                icon_link = (
                    soup.find("link", rel=lambda x: x and 'icon' in x.lower().split()) or
                    soup.find("link", rel="apple-touch-icon") or
                    soup.find("link", rel="shortcut icon")
                )

                candidates = []
                
                # If HTML defines an icon, use it
                if icon_link and icon_link.get("href"):
                    candidates.append(urljoin(str(resp.url), icon_link.get("href")))

                # Always add default favicon.ico at root as candidate
                parsed_uri = urlparse(str(resp.url))
                base_domain = f"{parsed_uri.scheme}://{parsed_uri.netloc}"
                candidates.append(urljoin(base_domain, "/favicon.ico"))

                # 4. Try to fetch the image candidates
                for img_url in candidates:
                    try:
                        img_resp = await client.get(img_url, headers=headers, timeout=3.0)
                        if img_resp.status_code == 200 and len(img_resp.content) > 0:
                            # Verify it's an image
                            content_type = img_resp.headers.get("content-type", "").lower()
                            if "image" in content_type or img_url.endswith(".ico"):
                                b64_img = base64.b64encode(img_resp.content).decode("utf-8")
                                final_type = content_type if "image" in content_type else "image/x-icon"
                                return {"icon": f"data:{final_type};base64,{b64_img}"}
                    except Exception:
                        continue
    except Exception as e:
        print(f"Fast scrape failed for {url}: {e}")

    # Strategy 2: Heavy & Robust (Playwright Headless Browser) - STEALTH MODE
    # Useful for sites with heavy anti-bot protections (Cloudflare, Aliyun) or dynamic JS rendering
    print(f"Attempting Playwright for {url}...")
    try:
        async with async_playwright() as p:
            # Launch with anti-detection arguments
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    "--disable-blink-features=AutomationControlled", # Hides "Chrome is being controlled by automated test software"
                    "--no-sandbox",
                    "--disable-setuid-sandbox"
                ]
            )
            
            # Create context with realistic User-Agent and Viewport
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={"width": 1920, "height": 1080},
                locale="zh-CN"
            )
            
            # Inject JS to delete 'navigator.webdriver' property (Key for bypassing detection)
            await context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
            """)

            page = await context.new_page()
            try:
                # Go to page. For SPAs (Koodo), we need to wait for network to be idle-ish.
                # Timeout set to 15s to avoid hanging.
                await page.goto(url, timeout=15000, wait_until="domcontentloaded")
                
                # Try to wait for network idle (useful for SPAs loading config), but don't crash if it times out
                try:
                    await page.wait_for_load_state("networkidle", timeout=3000)
                except:
                    pass
                
                # Execute JS to find icon. We look for standard tags.
                icon_href = await page.evaluate("""() => {
                    const link = document.querySelector('link[rel*="icon"]') || document.querySelector('link[rel="apple-touch-icon"]');
                    return link ? link.href : null;
                }""")
                
                if icon_href:
                     # Download using the page context (preserves cookies/session passed anti-bot)
                     response = await page.request.get(icon_href)
                     if response.status == 200:
                         body = await response.body()
                         content_type = response.headers.get("content-type", "image/png")
                         b64_img = base64.b64encode(body).decode("utf-8")
                         return {"icon": f"data:{content_type};base64,{b64_img}"}
            except Exception as e:
                print(f"Playwright scrape error: {e}")
            finally:
                await browser.close()
    except Exception as e:
        print(f"Playwright failed: {e}")

    # Strategy 3: Third-Party APIs (Last Resort)
    async with httpx.AsyncClient(follow_redirects=True, verify=False, timeout=5.0) as client:
        providers = [
            f"https://api.uomg.com/api/get.favicon?url={url}",
            f"https://www.google.com/s2/favicons?domain={url}&sz=128"
        ]
        
        for api in providers:
            try:
                resp = await client.get(api, timeout=3.0)
                if resp.status_code == 200 and "image" in resp.headers.get("content-type", ""):
                     b64_img = base64.b64encode(resp.content).decode("utf-8")
                     return {"icon": f"data:{resp.headers.get('content-type')};base64,{b64_img}"}
            except:
                continue

    return {"icon": None}

@app.get("/")
def read_root():
    return {"message": "SimpleStart API is running"}

@app.get("/tools")
def get_tools(session: Session = Depends(get_session)):
    # 1. Load config
    config_tools = []
    try:
        with open("apps.json", "r", encoding="utf-8") as f:
            config_tools = json.load(f)
    except FileNotFoundError:
        pass
    
    # 2. Load DB tools
    db_tools = session.exec(select(Tool)).all()
    db_map = {t.name: t for t in db_tools}
    
    final_tools = []
    
    # 3. Process Config Tools (base list)
    for app in config_tools:
        db_app = db_map.get(app["name"])
        if db_app:
            # Merge DB data (Auto-updated or Manually Edited via API)
            app["id"] = db_app.id
            app["category"] = db_app.category or app.get("category")
            app["homepage_url"] = db_app.homepage_url or app.get("homepage_url")
            app["icon_url"] = db_app.icon_url or app.get("icon_url")
            
            # If DB has version info, it takes precedence for "latest"
            if db_app.version:
                app["version"] = db_app.version
                app["smart_download_url"] = db_app.smart_download_url
            
            # Prioritize versions_json from DB if available
            if db_app.versions_json:
                try:
                    app["versions"] = json.loads(db_app.versions_json)
                except:
                    # Fallback to single version if JSON parse fails
                     app["versions"] = [{
                        "version": db_app.version,
                        "url": db_app.smart_download_url or db_app.original_download_url
                    }]
            elif db_app.version:
                # Construct single-version list for the frontend to render "Direct Download" or "Latest"
                app["versions"] = [{
                    "version": db_app.version,
                    "url": db_app.smart_download_url or db_app.original_download_url
                }]
            
            # Remove from map so we know it's handled
            del db_map[app["name"]]
        
        final_tools.append(app)
        
    # 4. Add remaining DB tools (created via API but not in apps.json)
    for db_app in db_map.values():
        versions_list = []
        if db_app.versions_json:
            try:
                versions_list = json.loads(db_app.versions_json)
            except:
                pass
        
        if not versions_list and db_app.version:
             versions_list = [{
                "version": db_app.version,
                "url": db_app.smart_download_url or db_app.original_download_url
            }]

        final_tools.append({
            "id": db_app.id,
            "name": db_app.name,
            "category": db_app.category,
            "homepage_url": db_app.homepage_url,
            "icon_url": db_app.icon_url,
            "version": db_app.version,
            "smart_download_url": db_app.smart_download_url,
            "versions": versions_list
        })
        
    return final_tools

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