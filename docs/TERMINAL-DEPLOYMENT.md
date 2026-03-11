# 跨平台终端部署指南

## 快速开始

### Windows 开发环境

```bash
# 1. 安装依赖（node-pty 会自动使用预编译版本）
npm install

# 2. 启动开发服务器
npm run dev

# 3. 访问终端
http://localhost:5173/terminal
```

**注意**: Windows 上使用 PowerShell 作为默认 shell，支持大多数命令行工具。

### Linux 生产环境

```bash
# 1. 安装系统依赖
sudo apt install python3 make g++  # Debian/Ubuntu
# 或
sudo yum install python3 make gcc-c++  # CentOS/RHEL

# 2. 安装 node 依赖
npm install

# 3. 启动服务器
npm run dev
# 或生产环境
npm run build && npm start

# 4. 访问终端
http://<server-ip>:3000/terminal
```

---

## 架构说明

### 平台检测

代码会自动检测运行平台并使用合适的 shell：

| 平台 | 默认 Shell | 说明 |
|------|----------|------|
| Windows | `powershell.exe` | 支持大多数 PowerShell 命令 |
| Linux/macOS | `/bin/bash` 或 `$SHELL` | 使用环境变量指定的 shell |

### node-pty 兼容性

`node-pty` 本身支持跨平台，但需要编译原生模块：

- **Windows**: 使用预编译版本或需要 Windows Build Tools
- **Linux**: 需要 gcc、make、python3 编译

### 降级模式

如果 node-pty 无法使用，代码会显示错误提示。可以启用降级模式（使用 `simple-pty.ts`），但功能受限：
- ❌ 不支持交互式命令（vim、nano、htop 等）
- ✅ 支持简单命令执行（ls、cd、cat 等）

---

## 部署到远程 Linux 服务器

### 方法 1: 本地构建后上传

```bash
# 1. 本地构建
npm run build

# 2. 上传到服务器
scp -r dist-server/ client/dist/ package*.json user@server:/path/to/dashboard/

# 3. 在服务器上安装依赖（编译 node-pty）
ssh user@server
cd /path/to/dashboard
npm install --production

# 4. 启动服务
npm start
```

### 方法 2: 直接在服务器上构建

```bash
# 1.  clone 代码或上传源码到服务器
git clone <repo> /path/to/dashboard
cd /path/to/dashboard

# 2. 安装依赖
npm install

# 3. 构建
npm run build

# 4. 启动
npm start
```

---

## 环境变量配置

创建 `.env` 文件：

```bash
# 服务端口
DASHBOARD_PORT=3000

# 文件根目录（文件浏览功能）
FILE_ROOT=/home/user/openclaw

# 终端默认配置（可选）
TERMINAL_DEFAULT_SHELL=/bin/bash
TERMINAL_DEFAULT_CWD=/home/user
```

---

## PM2 部署（推荐）

使用 PM2 管理生产环境进程：

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 设置开机自启
pm2 startup
pm2 save
```

`ecosystem.config.js` 配置：

```javascript
module.exports = {
  apps: [{
    name: 'openclaw-dashboard',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/dashboard',
    env: {
      NODE_ENV: 'production',
      DASHBOARD_PORT: 3000,
    },
  }],
};
```

---

## 故障排查

### node-pty 编译失败

**错误**: `gyp ERR!` 或 `node-pty: Failed to execute`

**解决**:
```bash
# Windows: 安装构建工具
npm install --global windows-build-tools

# Linux: 安装编译依赖
sudo apt install python3 make g++

# 然后重新安装
npm rebuild node-pty
```

### 终端无法连接 WebSocket

**检查**:
1. 防火墙是否开放端口
2. WebSocket 路径是否正确：`/ws/terminal`
3. 查看服务器日志

### 中文乱码

**解决**: 确保终端使用 UTF-8 编码：
```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

---

## 安全建议

1. **认证**: 添加 HTTP Basic Auth 或 Token 认证
2. **HTTPS**: 生产环境使用 HTTPS
3. **访问控制**: 限制 IP 访问
4. **会话超时**: 设置空闲超时自动断开
