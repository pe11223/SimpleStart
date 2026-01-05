# SimpleStart

**SimpleStart** 是一个极简、高颜值且响应式的程序员专属起始页。它集成了聚合搜索、开发工具下载加速、GitHub 趋势浏览以及个性化书签管理等功能，旨在提供一个无干扰、高效的浏览器新标签页体验。

![Screenshot Placeholder](public/window.svg)

## ✨ 核心特性

### 1. 极简首页 (The Dashboard)
- **聚合搜索**：中央搜索框支持 Tab 键快速切换搜索引擎（Google, Baidu, GitHub, Stack Overflow 等）。
- **动态背景**：流体渐变背景，支持随系统自动切换深色/浅色模式 (Dark/Light Mode)。
- **实用组件**：内置数字时钟、日历挂件（支持事件标记）。
- **快捷书签**：支持分组管理的书签系统，支持拖拽排序（PC）和长按管理（Mobile）。

### 2. 应用中心 (App Center)
- **手动配置**：通过 `backend/apps.json` 灵活配置常用开发工具。
- **多版本管理**：支持维护软件的历史版本下载链接。
- **下载加速**：针对 VS Code、GitHub Release 等提供国内加速镜像链接（需在 JSON 中配置）。
- **移动端优化**：完美适配手机屏幕，支持触摸交互。

### 3. 技术聚合 (Tech Feed)
- **GitHub Trending**：实时获取 GitHub 热门项目，不错过任何技术热点。
- **极简阅读**：卡片式布局，侧边栏快速预览。

### 4. 本地工具 (Local Tools)
- **PDF 转换**：内置图片转 PDF 等纯前端实用小工具。

## 🛠️ 技术栈

- **Frontend:** Next.js 16 (Turbopack), Tailwind CSS, Framer Motion
- **Backend:** Python (FastAPI)
- **Deployment:** Vercel (Frontend) + Any Python Host

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Python 3.10+

### 1. 启动项目 (一键脚本)

项目根目录提供了 `start.sh` 脚本，可同时启动前后端服务：

```bash
# Windows (Git Bash / WSL)
./start.sh
```

### 2. 手动启动

#### Backend (Port 8000)

```bash
cd backend
# 创建并激活虚拟环境
python -m venv venv
# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动服务
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend (Port 3000)

```bash
cd frontend
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问地址：
- 前端页面：`http://localhost:3000`
- 后端 API：`http://localhost:8000`

## ⚙️ 配置说明

### 应用中心配置 (`backend/apps.json`)

应用中心的数据不再依赖数据库爬虫，而是直接读取 `backend/apps.json` 文件。你可以按照以下格式手动添加或修改应用：

```json
[
  {
    "id": 1,
    "name": "VS Code",
    "category": "Programming",
    "description": "Code editing. Redefined.",
    "icon_url": "https://code.visualstudio.com/assets/images/code-stable.png",
    "homepage_url": "https://code.visualstudio.com/",
    "versions": [
      {
        "version": "1.85.1",
        "date": "2023-12-13",
        "url": "https://vscode.cdn.azure.cn/stable/..." 
      }
    ]
  }
]
```

### 环境变量

在 `frontend` 目录下创建 `.env.local` (可选)：

```env
# 指定后端 API 地址
BACKEND_PORT=8000
```

## 📱 移动端适配

项目针对移动端进行了深度优化：
- **动态视口高度 (dvh)**：解决移动端浏览器地址栏遮挡问题。
- **触控优化**：搜索框按钮位置调整，下拉菜单支持惯性滚动。
- **PWA 支持**：可添加到主屏幕作为独立应用使用。

---



© 2026 SimpleStart
