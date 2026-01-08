import sqlite3
import os

db_path = "backend/database.db"
if not os.path.exists(db_path):
    print("DB not found")
    exit()

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
try:
    cursor.execute("SELECT version, versions_json FROM tool WHERE name='Node.js'")
    row = cursor.fetchone()
    print(f"Version: {row[0]}")
    print(f"Versions JSON: {row[1]}")
except Exception as e:
    print(e)
finally:
    conn.close()
