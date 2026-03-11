# 远程开发部署指南

本指南说明如何在本地开发 Dashboard，并连接到远程服务器 (`43.163.246.185`) 上的 OpenClaw Gateway。

## 架构

```
┌─────────────────┐      SSH 隧道       ┌─────────────────────────┐
│  本地开发环境   │────────────────────►│  远程服务器             │
│  localhost      │    ws:18789         │  43.163.246.185         │
│                 │    http:3000        │                         │
│  - Vite :5173   │                     │  - OpenClaw Gateway     │
│  - Express :3000│                     │    :18789               │
└─────────────────┘                     └─────────────────────────┘
```

## 方案一：SSH 隧道（推荐）

### 步骤

**1. 建立 SSH 隧道**

打开终端，运行：

```bash
# Windows PowerShell / Linux / macOS
ssh -L 18789:localhost:18789 -L 3000:localhost:3000 root@43.163.246.185

# Windows CMD
ssh -L 18789:localhost:18789 -L 3000:localhost:3000 root@43.163.246.185
```

这会将远程服务器的端口映射到本地：
- `localhost:18789` → 远程 Gateway
- `localhost:3000` → 远程 Dashboard（如果已在远程运行）

**2. 配置本地环境变量**

创建 `.env` 文件：

```bash
cp .env.example .env
```

内容：

```env
DASHBOARD_PORT=3000
OPENCLAW_GATEWAY_URL=ws://localhost:18789
OPENCLAW_HOME=/root/.openclaw
```

**3. 启动本地开发服务器**

```bash
# 安装依赖（首次运行）
npm install
cd client && npm install && cd ..

# 启动开发模式
npm run dev
```

**4. 访问 Dashboard**

- Vite 开发服务器：http://localhost:5173
- 后端 API：http://localhost:3000

## 方案二：远程服务器部署 + 本地访问

### 步骤

**1. 在远程服务器上部署 Dashboard**

SSH 登录远程服务器：

```bash
ssh root@43.163.246.185
```

在服务器上安装并运行：

```bash
# 克隆/复制代码到服务器
cd /path/to/claw-status

# 安装依赖
npm install
cd client && npm install && cd ..

# 启动开发模式
npm run dev
```

**2. 配置服务器防火墙**

确保服务器开放端口：

```bash
# Ubuntu/Debian
ufw allow 3000/tcp
ufw allow 5173/tcp

# CentOS/RHEL
firewall-cmd --add-port=3000/tcp --permanent
firewall-cmd --add-port=5173/tcp --permanent
firewall-cmd --reload
```

**3. 本地访问**

- 开发服务器：http://43.163.246.185:5173
- 后端 API：http://43.163.246.185:3000

## 方案三：使用远程开发脚本

我们提供了专门的远程开发脚本：

```bash
# 运行远程开发脚本
npm run dev:remote
```

脚本会自动：
1. 检查 Gateway 连接
2. 提示 SSH 隧道配置
3. 启动开发服务器

## 安全建议

### 1. SSH 密钥认证

建议使用 SSH 密钥而不是密码：

```bash
# 生成 SSH 密钥（如果没有）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 复制公钥到服务器
ssh-copy-id root@43.163.246.185
```

### 2. 使用非标准端口

修改 SSH 端口（可选）：

```bash
# 服务器配置 /etc/ssh/sshd_config
Port 2222

# 客户端连接
ssh -p 2222 -L 18789:localhost:18789 root@43.163.246.185
```

### 3. 添加 Dashboard 认证

在生产环境中，建议添加 HTTP 基础认证：

```typescript
// src-server/index.ts
import basicAuth from 'express-basic-auth';

app.use(basicAuth({
  users: { admin: 'your-password' },
  challenge: true,
}));
```

## 联调测试

### 本地运行测试（通过 SSH 隧道）

```bash
# 1. 先建立 SSH 隧道
ssh -L 18789:localhost:18789 root@43.163.246.185

# 2. 本地运行测试
npm run test:e2e
```

### 远程服务器运行测试

```bash
# SSH 登录服务器
ssh root@43.163.246.185

# 在服务器上运行
cd /path/to/claw-status
npm run test:e2e
```

## 故障排查

### Gateway 连接失败

```bash
# 检查 SSH 隧道是否建立
netstat -an | grep 18789

# 检查 Gateway 是否在运行
ssh root@43.163.246.185 "ps aux | grep openclaw"

# 重启 Gateway
ssh root@43.163.246.185 "openclaw gateway run --bind loopback --port 18789"
```

### 端口占用

```bash
# 查看端口占用
netstat -tlnp | grep 3000
netstat -tlnp | grep 18789

# 更换端口
DASHBOARD_PORT=3001 npm run dev
```

### 慢速网络

如果 SSH 隧道延迟高，考虑：
1. 使用 Mosh 代替 SSH
2. 在远程服务器上开发（VS Code Remote）
3. 减少前端热更新频率

## VS Code Remote 开发

如果使用 VS Code，推荐安装 Remote - SSH 扩展：

1. 安装 `Remote - SSH` 扩展
2. 连接到 `root@43.163.246.185`
3. 在远程终端运行 `npm run dev`
4. 本地浏览器访问 http://localhost:5173（通过 VS Code 端口转发）

## 快速命令参考

```bash
# SSH 隧道
ssh -L 18789:localhost:18789 -L 3000:localhost:3000 root@43.163.246.185

# 本地开发
npm run dev                    # 启动开发服务器
npm run dev:remote            # 远程开发模式
npm run test:e2e              # 联调测试

# 远程部署
npm run build                 # 生产构建
npm start                     # 生产运行
pm2 start ecosystem.config.js # PM2 部署
```
