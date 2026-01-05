# SimpleStart - 程序员一体化极简工作台

## 1. 项目愿景

打造一个**高颜值、响应式**的程序员专属导航站。它既是浏览器起始页，也是一个无需人工维护、自动更新的“国内加速版”开发工具库。

---

## 2. 视觉与设计规范 (Design System)

项目采用 **Modern Minimalist** 风格，强调呼吸感与几何美学。

* **核心元素：**
* **多圆角设计 (Super Ellipse)：** 全站卡片、按钮、输入框统一采用 `16px` 至 `24px` 的大圆角。
* **动态主题：** 支持原生 **Light / Dark Mode** 切换，并根据系统时间自动触发。
* **磨砂玻璃 (Glassmorphism)：** 导航栏与悬浮层采用 `backdrop-filter: blur(10px)` 效果。
* **动效：** 丝滑的伸缩动画（Spring Physics）和微交互反馈。


* **配色方案：**
* *Light:* 背景 `#F5F5F7`，卡片 `#FFFFFF`，文字 `#1D1D1F`。
* *Dark:* 背景 `#000000`，卡片 `#1C1C1E`，文字 `#F5F5F7`。



---

## 3. 功能模块详解

### 3.1 首页：极简起始页 (The Dashboard)

* **视觉重心：** 页面中央仅保留一个毛玻璃质感的搜索框（支持 Tab 键切换百度/Google/GitHub）。
* **动态组件：**
* **时钟：** 居中显示的大字体数字时钟（支持像素风或拟态风）。
* **快捷收藏：** 以图标阵列形式排列，PC 端支持拖拽排序，手机端支持长按管理。
* **程序员日历：** 每日显示一条技术梗或随机的 `git commit` 信息。



### 3.2 应用中心：自动更新仓库 (Smart App Store)

* **爬虫自动化 (Python Backend)：**
* **频率：** 每周自动运行一次，抓取官网最新版本号及原始链接。
* **存储：** 仅存储 URL 字符串至数据库，不存储安装包二进制文件（零存储成本）。


* **零成本加速策略：**
* **VS Code / Chrome：** 逻辑重写域名（如将 `az764295.vo.msecnd.net` 替换为国内 Azure 节点）。
* **GitHub Project：** 在原始 Release 链接前动态拼接免费的代理前缀（如 `https://ghproxy.cn/`）。
* **分流判断：** 前端检测用户环境，如果是移动端则优先展示扫码下载或应用商店跳转。



### 3.3 待定板块：技术聚合 (Tech Feed)

* **建议方案：** “技术日报”板块。
* **内容：** 聚合 GitHub Trending（今日热门项目）和 V2EX 最热帖。
* **形态：** 采用瀑布流卡片，点击后在站内以侧边抽屉（Drawer）形式打开预览。

---

## 4. 技术架构方案

| 维度 | 技术选型 |
| --- | --- |
| **前端 (PC/Mobile)** | **Next.js 14** + **Tailwind CSS** + **Framer Motion** (处理圆角动画) |
| **后端 API** | **Python (FastAPI)** - 轻量、高性能，原生支持异步 |
| **自动化爬虫** | **Playwright / HTTPX** (伪装浏览器指纹，规避反爬) |
| **数据库** | **SQLite** (初期无需维护数据库服务器，直接存为文件) |
| **部署环境** | **Vercel** (前端) + **个人 PC 或 廉价轻量服务器** (运行周常爬虫) |

---

## 5. 核心逻辑伪代码 (Python 链接转换示例)

```python
# logic/accelerator.py

def get_smart_link(original_url, app_name):
    """
    零成本加速转换引擎
    """
    # 针对 VS Code 的国内镜像转换
    if "az764295.vo.msecnd.net" in original_url:
        return original_url.replace("az764295.vo.msecnd.net", "vscode.cdn.azure.cn")
    
    # 针对 GitHub Release 的代理转换
    if "github.com" in original_url and "/releases/download/" in original_url:
        proxy_prefix = "https://ghproxy.cn/" 
        return f"{proxy_prefix}{original_url}"
    
    return original_url

```

---

## 6. 开发路径 (Roadmap)

1. **Phase 1 (UI Prototype):** 完成 Next.js 项目搭建，实现大圆角、深色模式切换的首页 UI。
2. **Phase 2 (Crawler Engine):** 编写 Python 脚本，通过 Playwright 抓取首批 10 个开发工具（VS Code, Git, Docker, Postman 等）。
3. **Phase 3 (Smart Redirect):** 实现链接转换逻辑，确保国外软件在国内网络下可满速下载。
4. **Phase 4 (Mobile Optimization):** 针对手机端进行触摸优化，确保 PWA（渐进式 Web 应用）体验。