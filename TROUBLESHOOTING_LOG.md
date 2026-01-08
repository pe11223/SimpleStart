# 故障排查日志 (Troubleshooting Log)

**项目名称:** SimpleStart  
**创建日期:** 2026-01-08  
**当前状态:** ✅ 已解决 (Resolved)

---

## 📅 记录 001: 远程服务器应用中心与热点显示空白

### 1. 问题描述 (Problem)
*   **现象**: 在本地 (Windows) 开发环境下，应用中心和热点新闻均能正常加载数据。部署到远程 Linux 服务器后，页面框架加载正常，但内容区域空白。
*   **测试结果**:
    *   `curl` 后端接口 (Port 8001): **成功** (返回 JSON)。
    *   `curl` 前端页面 (Port 3000): **成功** (返回 HTML)。
    *   浏览器访问: 接口请求失败或 404。

### 2. 根因分析 (Root Cause Analysis)

经过排查，该问题由三个独立的配置问题叠加导致：

#### A. CORS 跨域限制 (Security)
*   **原因**: 后端 `main.py` 原配置仅允许 `http://localhost:3000` 访问。
*   **影响**: 当用户通过公网 IP 或域名访问时，浏览器检测到 Origin 与允许列表不符，出于安全策略拦截了请求。

#### B. 硬编码端口 (Hardcoded Ports)
*   **原因**: 前端代码 (`pdf-to-image.tsx`, `epub-term-replacement.tsx`) 和后端上传逻辑中，直接写死了 `http://localhost:8000`。
*   **影响**: 服务器环境后端运行在 `8001`，且用户浏览器无法访问服务器的 `localhost`。导致 PDF/EPUB 工具和图片上传功能失效。

#### C. 代理路径重写匹配 (Proxy Path Rewriting)
*   **原因**: Next.js 的 `rewrites` 规则将 `/api/py/tools` 转发给后端。在特定环境下，后端接收到的路径仍包含 `/api/py` 前缀。
*   **影响**: 后端只定义了 `/tools` 路由，收到 `/api/py/tools` 请求时无法匹配，FastAPI 返回 `{"detail": "Not Found"}` (404)。

### 3. 解决方案 (Solution)

已对代码库进行如下修改：

1.  **放宽 CORS 策略 (`backend/main.py`)**:
    ```python
    allow_origins=["*"] # 允许所有来源，适配反向代理架构
    ```

2.  **统一相对路径 (`frontend/...`, `backend/main.py`)**:
    *   将所有 `http://localhost:8000/...` 替换为 `/api/py/...`。
    *   利用 Next.js 代理转发请求，不再依赖硬编码端口。

3.  **添加路径剥离中间件 (`backend/main.py`)**:
    *   新增 Middleware，自动检测并移除请求路径中的 `/api/py` 前缀。
    *   **效果**: 无论 Next.js 是否剥离了前缀，后端都能正确识别路由 (e.g., `/api/py/tools` -> `/tools`)。

### 4. 验证 (Verification)
*   浏览器访问 `/apps` 页面，应用列表正常渲染。
*   浏览器访问 `/api/py/tools`，返回 JSON 数据。
*   PDF/EPUB 工具及图片上传功能经由代理正常工作。

---

## 📅 记录 002: [待添加新问题...]
*在此处记录后续遇到的部署或运行问题。*
