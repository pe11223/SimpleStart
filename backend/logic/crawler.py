import asyncio
import json
import os
import httpx
from playwright.async_api import async_playwright
from .accelerator import get_smart_link
from sqlmodel import Session, select
from models import Tool

# ... [Keep fetch_vscode, fetch_git, etc. functions exactly as they were] ...
# To avoid re-writing all functions and consuming tokens, I will just replace the crawl_tools function 
# and ensure the imports are correct. I need to make sure I don't lose the fetch functions.
# Since the tool 'replace' requires context, I should carefully target the end of the file.

# RE-DEFINING ALL FUNCTIONS TO BE SAFE because I need to make them accessible to a map.
# Or better, I can keep them and just change crawl_tools.

async def fetch_vscode():
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://update.code.visualstudio.com/api/update/win32-x64-user/stable/latest")
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "name": "VS Code",
                    "category": "Programming",
                    "version": data.get("name", "Latest"),
                    "homepage_url": "https://code.visualstudio.com/",
                    "original_download_url": data.get("url")
                }
    except Exception as e:
        print(f"Error fetching VS Code: {e}")
    return None

async def fetch_git():
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://api.github.com/repos/git-for-windows/git/releases/latest")
            if resp.status_code == 200:
                data = resp.json()
                version = data.get("tag_name", "").replace("v", "")
                original_url = ""
                for asset in data.get("assets", []):
                    if asset["name"].endswith("64-bit.exe") and "busybox" not in asset["name"]:
                        original_url = asset["browser_download_url"]
                        break
                
                return {
                    "name": "Git",
                    "category": "Programming",
                    "version": version,
                    "homepage_url": "https://git-scm.com/",
                    "original_download_url": original_url or "https://git-scm.com/download/win"
                }
    except Exception as e:
        print(f"Error fetching Git: {e}")
    return None

async def fetch_nodejs():
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://nodejs.org/dist/index.json")
            if resp.status_code == 200:
                data = resp.json()
                latest_lts = next((v for v in data if v["lts"]), data[0])
                version = latest_lts["version"].lstrip("v")
                return {
                    "name": "Node.js",
                    "category": "Programming",
                    "version": version,
                    "homepage_url": "https://nodejs.org/",
                    "original_download_url": f"https://nodejs.org/dist/v{version}/node-v{version}-x64.msi"
                }
    except Exception as e:
        print(f"Error fetching Node.js: {e}")
    return None

async def fetch_python():
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto("https://www.python.org/downloads/windows/")
            version_elem = await page.query_selector("a:has-text('Latest Python 3 Release')")
            version_text = await version_elem.inner_text() if version_elem else "Python 3"
            version = version_text.split("-")[-1].strip().replace("Python ", "")
            await browser.close()
            return {
                "name": "Python",
                "category": "Programming",
                "version": version,
                "homepage_url": "https://www.python.org/",
                "original_download_url": f"https://www.python.org/ftp/python/{version}/python-{version}-amd64.exe"
            }
    except Exception as e:
        print(f"Error fetching Python: {e}")
    return None

async def fetch_vlc():
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("http://update.videolan.org/vlc/status-win-x64")
            if resp.status_code == 200:
                version = resp.text.splitlines()[0].strip()
                return {
                    "name": "VLC Media Player",
                    "category": "Media",
                    "version": version,
                    "homepage_url": "https://www.videolan.org/vlc/",
                    "original_download_url": f"https://get.videolan.org/vlc/{version}/win64/vlc-{version}-win64.exe"
                }
    except Exception as e:
        print(f"Error fetching VLC: {e}")
    return None

async def fetch_obs():
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://api.github.com/repos/obsproject/obs-studio/releases/latest")
            if resp.status_code == 200:
                data = resp.json()
                version = data.get("tag_name", "Latest").replace("release/","").strip()
                original_url = next((asset["browser_download_url"] for asset in data.get("assets", []) if asset["name"].endswith("Full-Installer-x64.exe")), "")
                return {
                    "name": "OBS Studio",
                    "category": "Media",
                    "version": version,
                    "homepage_url": "https://obsproject.com/",
                    "original_download_url": original_url
                }
    except Exception as e:
        print(f"Error fetching OBS: {e}")
    return None

async def fetch_steam():
    return {
        "name": "Steam",
        "category": "Games",
        "version": "Latest",
        "homepage_url": "https://store.steampowered.com/",
        "original_download_url": "https://cdn.akamai.steamstatic.com/client/installer/SteamSetup.exe"
    }

# Map string names to functions
FETCHER_MAP = {
    "fetch_vscode": fetch_vscode,
    "fetch_git": fetch_git,
    "fetch_nodejs": fetch_nodejs,
    "fetch_python": fetch_python,
    "fetch_vlc": fetch_vlc,
    "fetch_obs": fetch_obs,
    "fetch_steam": fetch_steam
}

async def crawl_tools(session: Session):
    print("Starting crawler...")
    
    # Load apps from config
    apps_config = []
    try:
        with open("apps.json", "r") as f:
            apps_config = json.load(f)
    except Exception as e:
        print(f"Failed to load apps.json: {e}")
        return

    tasks = []
    for app in apps_config:
        fetcher_name = app.get("fetcher")
        if fetcher_name and fetcher_name in FETCHER_MAP:
            tasks.append(FETCHER_MAP[fetcher_name]())
        else:
            print(f"No fetcher found for {app.get('name')}")
    
    if not tasks:
        print("No tasks to run.")
        return

    results = await asyncio.gather(*tasks)
    tools_data = [r for r in results if r]
    
    # Save to DB
    for data in tools_data:
        smart_url = get_smart_link(data["original_download_url"])
        
        statement = select(Tool).where(Tool.name == data["name"])
        existing_tool = session.exec(statement).first()
        
        if not existing_tool:
            tool = Tool(
                name=data["name"],
                category=data["category"], # Ensure category comes from fetcher or config? 
                # Currently fetcher returns it. We could override from config if needed.
                version=data["version"],
                homepage_url=data["homepage_url"],
                original_download_url=data["original_download_url"],
                smart_download_url=smart_url
            )
            session.add(tool)
        else:
            existing_tool.category = data["category"]
            existing_tool.version = data["version"]
            existing_tool.original_download_url = data["original_download_url"]
            existing_tool.smart_download_url = smart_url
            session.add(existing_tool)
        
    session.commit()
    print(f"Crawler finished. Updated {len(tools_data)} tools.")
