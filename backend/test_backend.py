import asyncio
from logic.crawler import crawl_tools
from logic.news import fetch_github_trending
from database import create_db_and_tables, get_session
from sqlmodel import Session, select
from models import Tool

async def test():
    print("Testing database creation...")
    create_db_and_tables()
    
    print("Testing crawler...")
    # Get a session
    from database import engine
    with Session(engine) as session:
        await crawl_tools(session)
        
        # Verify tools in DB
        statement = select(Tool)
        results = session.exec(statement).all()
        print(f"Found {len(results)} tools in database:")
        for tool in results:
            print(f"- [{tool.category}] {tool.name} (v{tool.version}): {tool.smart_download_url}")

    print("\nTesting news fetcher...")
    news = await fetch_github_trending()
    print(f"Found {len(news)} trending repos:")
    for item in news[:3]:
        print(f"- {item['title']} ({item['language']})")

if __name__ == "__main__":
    asyncio.run(test())
