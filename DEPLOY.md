# OpenClaw Dashboard 部署指南

## 快速部署（开发环境）

```bash
# 1. 克隆/下载项目
cd /path/to/openclaw-dashboard

# 2. 安装依赖
npm install
cd client && npm install && cd ..

# 3. 启动
npm run dev
```

访问 http://localhost:3000

## 生产环境部署

### 方式一：PM2（推荐）

```bash
# 1. 安装 PM2
npm install -g pm2

# 2. 构建前端
cd client && npm run build && cd ..

# 3. 构建后端
npx tsc --project tsconfig.server.json 2>/dev/null || mkdir -p dist-server && cp -r src-server/* dist-server/

# 4. 启动
pm2 start ecosystem.config.js

# 5. 设置开机自启
pm2 startup
pm2 save
```

### 方式二：systemd 服务

创建服务文件 `/etc/systemd/system/openclaw-dashboard.service`:

```ini
[Unit]
Description=OpenClaw Dashboard
After=network.target openclaw.service

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/openclaw-dashboard
Environment=NODE_ENV=production
Environment=DASHBOARD_PORT=3000
Environment=OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789
Environment=OPENCLAW_HOME=/home/your-user/.openclaw
ExecStart=/usr/bin/node dist-server/index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

然后启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable openclaw-dashboard
sudo systemctl start openclaw-dashboard
```

## 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DASHBOARD_PORT` | Dashboard 服务端口 | `3000` |
| `OPENCLAW_GATEWAY_URL` | OpenClaw Gateway WebSocket 地址 | `ws://127.0.0.1:18789` |
| `OPENCLAW_HOME` | OpenClaw 主目录 | `~/.openclaw` |

### 配置文件

- 后端配置：`src-server/index.ts`
- 前端配置：`client/`
- PM2 配置：`ecosystem.config.js`

## 远程访问

如果 Dashboard 运行在远程服务器上：

### SSH 端口转发

```bash
ssh -L 3000:localhost:3000 user@server
# 然后访问 http://localhost:3000
```

### 开放防火墙端口

```bash
# Ubuntu/Debian
sudo ufw allow 3000/tcp

# CentOS/RHEL
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

## 安全建议

1. **添加认证** - 在 `src-server/index.ts` 中添加 Basic Auth 或 JWT 认证
2. **使用 HTTPS** - 通过 Nginx 反向代理配置 SSL
3. **限制访问 IP** - 使用防火墙限制只允许信任的 IP 访问
4. **文件访问控制** - 确保 `OPENCLAW_HOME` 权限正确

## 日志查看

```bash
# PM2 日志
pm2 logs openclaw-dashboard

# systemd 日志
journalctl -u openclaw-dashboard -f
```
