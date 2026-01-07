import httpx
from bs4 import BeautifulSoup

async def fetch_github_trending():
    try:
        async with httpx.AsyncClient() as client:
            # Add headers to mimic a browser
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            resp = await client.get("https://github.com/trending", headers=headers)
            
            if resp.status_code != 200:
                print(f"Failed to fetch GitHub Trending: {resp.status_code}")
                return []

            soup = BeautifulSoup(resp.text, 'html.parser')
            repos = soup.select("article.Box-row")
            results = []
            
            for repo in repos[:10]: # Top 10
                title_elem = repo.select_one("h2 a")
                if not title_elem:
                    continue
                
                # Clean up title (remove newlines and extra spaces)
                raw_title = title_elem.get_text().strip()
                title = raw_title.replace("\n", "").replace(" ", "")
                
                desc_elem = repo.select_one("p")
                desc = desc_elem.get_text().strip() if desc_elem else ""
                
                link = title_elem.get("href")
                full_link = f"https://github.com{link}"
                
                lang_elem = repo.select_one("[itemprop='programmingLanguage']")
                lang = lang_elem.get_text().strip() if lang_elem else ""
                
                results.append({
                    "title": title,
                    "description": desc,
                    "url": full_link,
                    "language": lang
                })
            
            return results
    except Exception as e:
        print(f"Error fetching GitHub Trending: {e}")
        return []
