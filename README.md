# SimpleStart - 程序员的一体化极简工作台

<div align="center">

![SimpleStart](public/window.svg) <!-- 这里可以替换为实际的项目截图 -->

**高颜值 · 响应式 · 自动化**

一个专为开发者打造的浏览器起始页。无需维护，自动加速，开箱即用。

[特性](#特性) • [演示](#演示) • [部署](#部署指南) • [开发](#本地开发) • [贡献](#贡献)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![FastAPI](https://img.shields.io/badge/Python-FastAPI-green)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

</div>

---

## 📖 简介

**SimpleStart** 不仅仅是一个浏览器导航页。它旨在解决开发者日常工作中的琐碎痛点：
1.  **书签混乱**：提供支持文件夹的本地书签管理，自动抓取高清图标。
2.  **环境配置慢**：内置软件下载加速（Smart Accelerator），自动将 GitHub Release、VS Code 等国外下载链接替换为国内高速镜像。
3.  **信息焦虑**：聚合 GitHub Trending，让你不错过每日技术热点。
4.  **美学追求**：采用 Modern Minimalist 设计风格，支持日/夜间模式自动切换，Glassmorphism 毛玻璃特效。

---

## ✨ 特性

### 🖥️ 极简仪表盘 (Dashboard)
- **极致美学**：大圆角卡片设计，丝滑的 Framer Motion 动画。
- **动态组件**：包含像素风时钟、可持久化配置的日历组件、天气（开发中）。
- **本地书签**：
    - 支持无限层级文件夹。
    - **智能图标抓取**：自动解析网页 Favicon，优先尝试直连，失败自动回退至国内 CDN 节点，并支持本地缓存。
    - **隐私优先**：所有数据存储在本地浏览器或自托管数据库中。

### 🚀 应用中心 (App Store)
- **自动爬虫**：后端 Python 爬虫定期抓取常用开发工具（VS Code, Git, Node.js, Python 等）的最新版本号。
- **下载加速**：
    - 智能识别下载链接。
    - 自动替换 `github.com` 为国内加速代理。
    - 自动替换 `azure.cn` 等 CDN 节点。

### 🛠️ 开发者工具箱
- **Tech Feed**：实时聚合 GitHub Trending 热门项目，不错过任何技术趋势。
- **本地工具**：内置 PDF 转图片、EPUB 术语替换等实用小工具（无需上传文件到第三方服务器）。

---

## 🛠️ 技术栈

| 模块 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14** | App Router, React Server Components |
| **Styling** | **Tailwind CSS** | 配合 framer-motion 实现流畅动画 |
| **Backend** | **Python (FastAPI)** | 高性能异步 API 框架 |
| **Crawler** | **Playwright / HTTPX** | 负责应用版本抓取与网页图标解析 |
| **Database** | **SQLite (SQLModel)** | 轻量级，无需配置，适合单人部署 |
| **Deploy** | **Docker Compose** | 一键容器化部署 |

---

## 📦 部署指南

### 方法一：服务器部署 (推荐 - Nginx + PM2)

此方案适用于生产环境，使用 PM2 管理进程，Nginx 反向代理域名。

#### 1. 环境准备
确保服务器已安装：
- **Node.js 18+**
- **Python 3.10+**
- **Nginx**
- **PM2**: `npm install -g pm2`

#### 2. 后端部署
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 安装 Playwright 及其依赖
playwright install chromium
playwright install-deps

# 使用 PM2 启动后端 (端口 8000)
pm2 start "venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000" --name "ss-backend"
```

#### 3. 前端部署
```bash
cd ../frontend
npm install
npm run build

# 使用 PM2 启动前端 (端口 3000)
pm2 start "npm start -- -p 3000" --name "ss-frontend"
```

保存进程列表以便开机自启：
```bash
pm2 save
pm2 startup
```

#### 4. Nginx 配置 (域名访问)
编辑 Nginx 配置文件（如 `/etc/nginx/sites-available/simplestart`），添加以下内容将域名转发到前端端口：

```nginx
server {
    listen 80;
    server_name your-domain.com; # 替换为你的域名

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # 获取真实 IP
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

启用配置并重启 Nginx：
```bash
sudo ln -s /etc/nginx/sites-available/simplestart /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 方法二：Docker Compose

最简单的容器化部署方式。

1.  **启动服务**
    ```bash
    docker-compose up -d
    ```
2.  **访问**
    - `http://localhost:3000`

---

## 💻 本地开发

如果你想参与贡献或修改代码，请按以下步骤配置开发环境。

### 1. 环境准备
- Node.js 18+
- Python 3.10+
- Git

### 2. 快速启动 (Windows)
我们提供了一键启动脚本（推荐）：
```powershell
# 在项目根目录运行
./start.ps1
```

### 3. 手动启动

**后端：**
```bash
cd backend
# 首次运行需安装依赖
# pip install -r requirements.txt
uvicorn main:app --reload
```

**前端：**
```bash
cd frontend
# 首次运行需安装依赖
# npm install
npm run dev
```

浏览器访问 `http://localhost:3000` 即可看到开发版。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1.  Fork 本仓库
2.  创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3.  提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4.  推送到分支 (`git push origin feature/AmazingFeature`)
5.  开启一个 Pull Request

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。

## 📚 自定义版本管理与上传

SimpleStart 支持为每个应用管理多个版本（如 Node.js 的 LTS 和 Current 版本）。同时，您也可以手动上传本地安装包或设置自定义版本。

### 1. 管理版本
进入 **管理模式**（点击应用中心右上角的 "+ 添加应用" 或悬浮在应用上的编辑笔），在编辑窗口中：
- **Versions 列表**：查看当前已抓取或设置的版本。
- **Primary Version**：列表中的第一个版本将作为首页直接下载的版本。

### 2. 手动上传
在编辑窗口的 "Version Management" 区域：
1.  输入 **Group**（如 "Custom"）。
2.  输入 **Version**（如 "1.0.0-beta"）。
3.  点击上传图标选择本地文件，或直接在 URL 输入框填写外部链接。
4.  点击 "Add Version"。
5.  最后点击 "Save" 保存应用配置。

上传的文件将保存在 `backend/uploads/` 目录下。
