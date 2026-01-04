import httpx
from playwright.async_api import async_playwright

async def fetch_github_trending():
    try:
        # Using playwright to handle any dynamic content, though GitHub Trending is mostly static
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto("https://github.com/trending")
            
            # Selector for repo rows
            repos = await page.query_selector_all("article.Box-row")
            results = []
            
            for repo in repos[:10]: # Top 10
                title_elem = await repo.query_selector("h2 a")
                title = await title_elem.inner_text() if title_elem else "Unknown"
                title = title.replace("\n", "").replace(" ", "")
                
                desc_elem = await repo.query_selector("p")
                desc = await desc_elem.inner_text() if desc_elem else ""
                
                link = await title_elem.get_attribute("href") if title_elem else ""
                full_link = f"https://github.com{link}"
                
                lang_elem = await repo.query_selector("[itemprop='programmingLanguage']")
                lang = await lang_elem.inner_text() if lang_elem else ""
                
                results.append({
                    "title": title,
                    "description": desc.strip(),
                    "url": full_link,
                    "language": lang
                })
            
            await browser.close()
            return results
    except Exception as e:
        print(f"Error fetching GitHub Trending: {e}")
        return []
