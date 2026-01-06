# 🌍 服务器域名部署指南 (Production Guide)

本指南将帮助您在 Linux 服务器（如 Ubuntu/CentOS）上配置 `xxx.top` 域名，并隐藏 3000/8000 端口，实现通过标准 HTTP/HTTPS 访问。

---

## 🏗️ 架构说明

```
用户 (Browser)  ->  xxx.top (Nginx:80/443)  ->  Docker (Frontend:3000)  ->  Docker (Backend:8000)
```

我们将使用 **Nginx** 作为反向代理服务器，它监听 80 端口，将流量转发给我们的 Docker 容器。

---

## 🚀 第一步：启动应用 (Docker)

1.  **上传代码到服务器**：
    ```bash
    # 在您的服务器上
    git clone https://github.com/pe11223/SimpleStart.git
    cd xxx
    ```

2.  **启动容器**：
    ```bash
    docker-compose up -d
    ```
    此时，您的应用应该可以通过 `http://服务器IP:3000` 访问。

---

## 🌐 第二步：安装与配置 Nginx

### 1. 安装 Nginx
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx -y

# CentOS
sudo yum install nginx -y
```

### 2. 创建站点配置文件
创建一个新的配置文件：
```bash
sudo nano /etc/nginx/sites-available/xxx.top
```

**将以下内容粘贴进去**（请直接复制）：

```nginx
server {
    listen 80;
    server_name xxx.top www.xxx.top;

    # 前端代理 (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000; # 转发到 Docker 映射的端口
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # 获取真实 IP (重要：防止被反爬虫误判为同一 IP)
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 后端 API 代理 (可选，通常 Next.js 已经处理了，但为了保险可以加上)
    # 如果您的前端直接请求了 :8000，则需要这个。
    # 但 xxx 使用了 Next.js Rewrites，所以通常不需要这个 block。
}
```

### 3. 启用配置
```bash
# 建立软链接 (Ubuntu/Debian)
sudo ln -s /etc/nginx/sites-available/xxx.top /etc/nginx/sites-enabled/

# 检查配置是否正确
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

🎉 **此时，您应该可以通过 `http://xxx.top` 直接访问您的网站了！** (无需加端口号)

---

## 🔒 第三步：配置 HTTPS (SSL 证书)

为了安全（以及消除浏览器“不安全”的提示），强烈建议配置 HTTPS。我们可以使用 Certbot 免费申请。

### 1. 安装 Certbot
```bash
# Ubuntu
sudo apt install certbot python3-certbot-nginx -y
```

### 2. 一键申请并自动配置
```bash
sudo certbot --nginx -d xxx.top -d www.xxx.top
```

- 它会询问您是否强制跳转 HTTPS，选择 **Redirect (2)**。

### 3. 完成
Certbot 会自动修改您的 Nginx 配置文件。现在访问 `http://xxx.top` 会自动跳转到 `https://xxx.top`。

---

## 🛠️ 常见问题排查

**Q: 访问域名显示 502 Bad Gateway?**
A: 这说明 Nginx 无法连接到后端端口 (3000)。
1. 检查 Docker 是否运行：`docker ps`
2. 确保端口映射正确：应该看到 `0.0.0.0:3000->3000/tcp`。

**Q: 依然需要输入端口才能访问?**
A: 请检查云服务商（阿里云/腾讯云/AWS）的**安全组**设置。
- ✅ **必须放行**：80 (HTTP) 和 443 (HTTPS) 端口。
- ❌ **建议关闭**：3000 和 8000 端口（为了安全，只通过 Nginx 访问）。
