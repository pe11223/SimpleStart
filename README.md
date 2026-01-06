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

我们强烈推荐使用 Docker 进行部署，这是最简单且无侵入的方式。

### 方法一：Docker Compose (推荐)

1.  **克隆仓库**
    ```bash
    git clone https://github.com/pe11223/SimpleStart.git
    cd SimpleStart
    ```

2.  **启动服务**
    ```bash
    docker-compose up -d
    ```

3.  **访问**
    - 前端页面：`http://localhost:3000`
    - 后端 API：`http://localhost:8000`

### 方法二：手动部署 (传统方式)

<details>
<summary>点击展开手动部署步骤</summary>

#### 后端 (Backend)

1.  进入后端目录并创建虚拟环境：
    ```bash
    cd backend
    python -m venv venv
    ```
2.  激活环境并安装依赖：
    - Windows: `.\venv\Scripts\activate`
    - Linux/Mac: `source venv/bin/activate`
    ```bash
    pip install -r requirements.txt
    playwright install chromium
    ```
3.  启动后端：
    ```bash
    uvicorn main:app --host 0.0.0.0 --port 8000
    ```

#### 前端 (Frontend)

1.  进入前端目录并安装依赖：
    ```bash
    cd frontend
    npm install
    ```
2.  构建并启动：
    ```bash
    npm run build
    npm start
    ```
</details>

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