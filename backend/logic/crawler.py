import asyncio
import json
import httpx
from bs4 import BeautifulSoup
from .accelerator import get_smart_link
from sqlmodel import Session, select
from models import Tool

# Common headers to mimic a browser
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

async def fetch_vscode():
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            resp = await client.get("https://update.code.visualstudio.com/api/update/win32-x64-user/stable/latest", headers=HEADERS)
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
        async with httpx.AsyncClient(follow_redirects=True) as client:
            resp = await client.get("https://api.github.com/repos/git-for-windows/git/releases/latest", headers=HEADERS)
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
        print("Fetching Node.js...")
        async with httpx.AsyncClient(follow_redirects=True, verify=False) as client:
            resp = await client.get("https://nodejs.org/dist/index.json", headers=HEADERS)
            if resp.status_code == 200:
                data = resp.json()
                
                versions_list = []
                
                # Get Top 5 LTS
                lts_versions = [v for v in data if v["lts"]][:5]
                for v in lts_versions:
                    ver = v["version"].lstrip("v")
                    versions_list.append({
                        "version": f"v{ver}",
                        "url": f"https://nodejs.org/dist/v{ver}/node-v{ver}-x64.msi",
                        "group": "LTS"
                    })

                # Get Top 5 Current (non-LTS)
                current_versions = [v for v in data if not v["lts"]][:5]
                for v in current_versions:
                    ver = v["version"].lstrip("v")
                    versions_list.append({
                        "version": f"v{ver}",
                        "url": f"https://nodejs.org/dist/v{ver}/node-v{ver}-x64.msi",
                        "group": "Current"
                    })
                
                # Primary is latest LTS
                primary_version = lts_versions[0]["version"].lstrip("v") if lts_versions else "Latest"
                primary_url = f"https://nodejs.org/dist/v{primary_version}/node-v{primary_version}-x64.msi"

                print(f"Node.js versions fetched: {len(versions_list)}")
                return {
                    "name": "Node.js",
                    "category": "Programming",
                    "version": primary_version,
                    "homepage_url": "https://nodejs.org/",
                    "original_download_url": primary_url,
                    "versions": versions_list
                }
            else:
                print(f"Node.js fetch failed: {resp.status_code}")
    except Exception as e:
        print(f"Error fetching Node.js: {e}")
    return None

async def fetch_python():
    try:
        print("Fetching Python...")
        async with httpx.AsyncClient(follow_redirects=True) as client:
            resp = await client.get("https://www.python.org/downloads/windows/", headers=HEADERS)
            
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, 'html.parser')
                
                # Find all "Stable Releases"
                # They are usually under a header "Python Releases for Windows" -> "Stable Releases"
                # But simple heuristic: Find links with text "Download Windows installer (64-bit)"
                # And look at their parent/preceding text for version.
                
                versions_list = []
                seen_versions = set()
                
                # Find all links that look like installers
                links = soup.find_all("a", string=lambda t: t and "installer (64-bit)" in t)
                
                for link in links:
                    href = link.get("href")
                    if "amd64.exe" in href:
                        # Extract version from URL: /ftp/python/3.12.1/python-3.12.1-amd64.exe
                        try:
                            ver = href.split("python-")[1].split("-amd64")[0] # 3.12.1
                            major_minor = ".".join(ver.split(".")[:2]) # 3.12
                            
                            if major_minor not in seen_versions:
                                versions_list.append({
                                    "version": ver,
                                    "url": href
                                })
                                seen_versions.add(major_minor)
                                
                            if len(versions_list) >= 2:
                                break
                        except:
                            continue

                if not versions_list:
                    # Fallback to strategy 1 if list is empty
                    version_elem = soup.find("a", string=lambda t: t and "Latest Python 3 Release" in t)
                    if version_elem:
                        version_text = version_elem.get_text()
                        version = version_text.split("-")[-1].strip().replace("Python ", "")
                        url = f"https://www.python.org/ftp/python/{version}/python-{version}-amd64.exe"
                        versions_list.append({"version": version, "url": url})
                
                if versions_list:
                    primary = versions_list[0]
                    print(f"Python versions found: {[v['version'] for v in versions_list]}")
                    return {
                        "name": "Python",
                        "category": "Programming",
                        "version": primary["version"],
                        "homepage_url": "https://www.python.org/",
                        "original_download_url": primary["url"],
                        "versions": versions_list
                    }
    except Exception as e:
        print(f"Error fetching Python: {e}")
    return None

async def fetch_vlc():
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            resp = await client.get("http://update.videolan.org/vlc/status-win-x64", headers=HEADERS)
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
        async with httpx.AsyncClient(follow_redirects=True) as client:
            resp = await client.get("https://api.github.com/repos/obsproject/obs-studio/releases/latest", headers=HEADERS)
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
        # else:
            # print(f"No fetcher found for {app.get('name')}")
    
    if not tasks:
        print("No tasks to run.")
        return

    results = await asyncio.gather(*tasks)
    tools_data = [r for r in results if r]
    
    print(f"Fetched {len(tools_data)} tools successfully.")

    # Save to DB
    for data in tools_data:
        smart_url = get_smart_link(data["original_download_url"])
        versions_json = json.dumps(data.get("versions", [])) if data.get("versions") else None
        
        statement = select(Tool).where(Tool.name == data["name"])
        existing_tool = session.exec(statement).first()
        
        if not existing_tool:
            tool = Tool(
                name=data["name"],
                category=data["category"], 
                version=data["version"],
                homepage_url=data["homepage_url"],
                original_download_url=data["original_download_url"],
                smart_download_url=smart_url,
                versions_json=versions_json
            )
            session.add(tool)
        else:
            existing_tool.category = data["category"]
            existing_tool.version = data["version"]
            existing_tool.original_download_url = data["original_download_url"]
            existing_tool.smart_download_url = smart_url
            existing_tool.versions_json = versions_json
            session.add(existing_tool)
        
    session.commit()
    print(f"Crawler finished. Database updated.")