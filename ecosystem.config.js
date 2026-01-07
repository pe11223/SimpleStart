module.exports = {
  apps: [
    {
      name: "ss-frontend",
      cwd: "./frontend",
      script: "npm",
      args: "start", // 生产环境使用 start (需先运行 npm run build)
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        BACKEND_PORT: 8001, // 确保 Next.js 知道后端端口
        BACKEND_HOST: "127.0.0.1"
      }
    },
    {
      name: "ss-backend",
      cwd: "./backend",
      // 直接指向虚拟环境中的 uvicorn，避免环境污染
      script: "./venv/bin/uvicorn", 
      args: "main:app --host 0.0.0.0 --port 8001",
      interpreter: "none", // 脚本本身就是可执行文件(uvicorn)，不需要额外的解释器
      env: {
        // 确保 Playwright 能找到浏览器 (默认在 ~/.cache/ms-playwright)
        // 如果自定义了路径，请在这里添加 PLAYWRIGHT_BROWSERS_PATH
      }
    }
  ]
};
