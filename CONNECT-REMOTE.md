# 连接远程 OpenClaw Gateway (43.163.246.185)

## 快速开始

### 方案 1: SSH 隧道（推荐）

```bash
# 1. 建立 SSH 隧道（新终端）
ssh -L 18789:localhost:18789 root@43.163.246.185

# 2. 配置本地环境
npm run config:remote
# 选择 Y 使用 SSH 隧道模式

# 3. 启动开发服务器
npm run dev

# 4. 访问 Dashboard
# http://localhost:5173
```

### 方案 2: 直接连接（需要 Gateway 开放外网）

```bash
# 1. 配置直接连接
echo "OPENCLAW_GATEWAY_URL=ws://43.163.246.185:18789" > .env

# 2. 启动开发服务器
npm run dev
```

### 方案 3: 使用配置向导

```bash
# 运行配置向导
npm run config:remote

# 按提示操作：
# - 输入远程服务器地址 (默认：43.163.246.185)
# - 选择是否使用 SSH 隧道
# - 确认配置
```

## 配置说明

### .env 文件

```env
# Dashboard 端口
DASHBOARD_PORT=3000

# Gateway 地址
# SSH 隧道模式：
OPENCLAW_GATEWAY_URL=ws://localhost:18789

# 直接连接模式：
OPENCLAW_GATEWAY_URL=ws://43.163.246.185:18789

# OpenClaw 主目录
OPENCLAW_HOME=/root/.openclaw
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DASHBOARD_PORT` | Dashboard 服务端口 | `3000` |
| `OPENCLAW_GATEWAY_URL` | Gateway WebSocket 地址 | `ws://localhost:18789` |
| `OPENCLAW_HOME` | OpenClaw 主目录 | `/root/.openclaw` |
| `REMOTE_HOST` | 远程服务器 IP | `43.163.246.185` |

## 连接测试

```bash
# 测试 Gateway 连接
npm run test:e2e

# 查看测试结果
# ✅ 配置路径 API - 通过
# ⚠️  健康检查 API - 需要 Gateway 运行
```

## 故障排查

### Gateway 未连接

```bash
# 检查 SSH 隧道
ssh -L 18789:localhost:18789 root@43.163.246.185

# 检查 Gateway 状态
ssh root@43.163.246.185 "ps aux | grep openclaw"

# 重启 Gateway
ssh root@43.163.246.185 "pkill -f openclaw && openclaw gateway run --bind 0.0.0.0 --port 18789"
```

### 端口占用

```bash
# 查看端口
netstat -tlnp | grep 18789
netstat -tlnp | grep 3000

# 更换端口
DASHBOARD_PORT=3001 npm run dev
```

## 部署到远程服务器

```bash
# 1. SSH 登录
ssh root@43.163.246.185

# 2. 在服务器上安装
cd /path/to/claw-status
npm install
cd client && npm install && cd ..

# 3. 启动
npm run dev          # 开发模式
npm run build && npm start  # 生产模式

# 4. PM2 部署
pm2 start ecosystem.config.js
pm2 save
```

## 安全建议

1. **使用 SSH 密钥** 而不是密码
2. **SSH 隧道** 比直接开放端口更安全
3. **防火墙** 限制访问来源
4. **HTTPS** 生产环境使用

## 相关文档

- [REMOTE-DEV.md](REMOTE-DEV.md) - 完整远程开发指南
- [DEPLOY.md](DEPLOY.md) - 部署指南
- [TESTING.md](TESTING.md) - 测试指南
