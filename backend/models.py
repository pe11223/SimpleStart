from typing import Optional
from sqlmodel import Field, SQLModel

class Tool(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    category: str = Field(default="Programming")
    description: Optional[str] = None
    icon_url: Optional[str] = None
    version: Optional[str] = None
    homepage_url: str
    original_download_url: Optional[str] = None
    smart_download_url: Optional[str] = None
    last_updated: Optional[str] = None
    versions_json: Optional[str] = None
