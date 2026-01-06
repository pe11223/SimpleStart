# 🌍 服务器手动部署指南 (无 Docker)

本指南适用于不希望使用 Docker，直接在 Linux 服务器（Ubuntu/CentOS）上运行环境的用户。我们将使用 **PM2** 或 **Systemd** 来管理进程，并使用 **Nginx** 配置域名 `xxx.top`。

---

## 🛠️ 第一步：环境准备

您需要在服务器上安装 Node.js (前端) 和 Python (后端)。

### 1. 安装 Node.js (v18+)
```bash
# Ubuntu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证
node -v  # 应显示 v18.x.x 或更高
npm -v
```

### 2. 安装 Python (3.10+) & Nginx
```bash
# Ubuntu
sudo apt update
sudo apt install python3 python3-pip python3-venv nginx git -y
```

---

## 🐍 第二步：部署后端 (Backend)

1.  **下载代码**
    ```bash
    cd /var/www  # 或者您喜欢的任何目录
    sudo git clone https://github.com/pe11223/SimpleStart.git
    cd xxx/backend
    ```

2.  **创建虚拟环境并安装依赖**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    
    # 重要：安装 Playwright 浏览器内核 (用于绕过反爬虫)
    playwright install chromium
    playwright install-deps
    ```

3.  **后台运行后端**
    我们推荐使用 `pm2` (进程管理器) 来保持服务一直运行。
    ```bash
    sudo npm install -g pm2
    
    # 启动后端 (假设还在 backend 目录, 且 venv 已激活)
    pm2 start "venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000" --name "ss-backend"
    ```

---

## ⚛️ 第三步：部署前端 (Frontend)

1.  **编译项目**
    ```bash
    cd ../frontend
    
    # 安装依赖
    npm install
    
    # 编译生产版本
    npm run build
    ```

2.  **后台运行前端**
    ```bash
    # 启动 Next.js 生产服务
    pm2 start "npm start -- -p 3000" --name "ss-frontend"
    ```

3.  **保存进程列表** (确保开机自启)
    ```bash
    pm2 save
    pm2 startup
    ```

---

## 🌐 第四步：配置 Nginx (域名访问)

现在后端运行在 8000，前端运行在 3000。我们需要配置 Nginx 让 `xxx.top` 转发到 3000。

1.  **编辑配置文件**
    ```bash
    sudo nano /etc/nginx/sites-available/xxx.top
    ```

2.  **写入配置**
    ```nginx
    server {
        listen 80;
        server_name xxx.top www.xxx.top;

        # 转发所有请求到前端 (Next.js)
        location / {
            proxy_pass http://127.0.0.1:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            
            # 传递真实 IP
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
    ```

3.  **启用并重启**
    ```bash
    sudo ln -s /etc/nginx/sites-available/xxx.top /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

---

## 🔒 第五步：HTTPS (SSL)

最后，给域名加上绿锁。

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d xxx.top -d www.xxx.top
```

---

## ✅ 部署完成！

访问 **https://xxx.top** 即可。

- **查看日志**: `pm2 logs`
- **重启服务**: `pm2 restart all`
- **更新代码**: 
  1. `git pull`
  2. 前端: `npm run build` -> `pm2 restart ss-frontend`
  3. 后端: `pm2 restart ss-backend`
