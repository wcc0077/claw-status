# OpenClaw Dashboard

OpenClaw 网页版管理面板 - 运行在 OpenClaw 实例机器上，提供可视化的监控和管理功能。

## 开发流程

本项目遵循 **接口优先，测试驱动，并行实现，代码优化，再次测试** 的开发流程：

1. **接口优先** - 先在 [API-INTERFACE.md](API-INTERFACE.md) 中定义接口规范
2. **测试驱动** - 编写接口测试和单元测试
3. **并行实现** - 前后端并行开发
4. **代码优化** - 重构和优化代码
5. **再次测试** - 运行完整测试套件

## 功能特性

- **仪表盘** - 查看网关健康状态、心跳、版本信息
- **会话管理** - 浏览、删除、压缩会话
- **记忆系统** - 查看记忆配置和统计信息
- **文件管理** - 浏览和编辑 OpenClaw 配置文件
- **代理与技能** - 查看代理列表和技能状态

## 架构

```
┌─────────────────────────────────────────────┐
│  OpenClaw 实例机器                          │
│                                             │
│  ┌─────────────┐    ┌─────────────────┐    │
│  │ OpenClaw    │    │ Dashboard       │    │
│  │ Gateway     │◄──►│ Express Server  │    │
│  │ :18789      │    │ :3000           │    │
│  └─────────────┘    └─────────────────┘    │
│                            ▲                │
└────────────────────────────┼────────────────┘
                             │ HTTP/HTTPS
                             ▼
                    ┌─────────────────┐
                    │ 任何浏览器       │
                    └─────────────────┘
```

## 安装

### 1. 安装依赖

```bash
# 安装根目录依赖（后端）
npm install

# 安装前端依赖
cd client
npm install
cd ..
```

### 2. 环境变量（可选）

```bash
# .env 文件
DASHBOARD_PORT=3000
OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789
OPENCLAW_HOME=/home/user/.openclaw
```

### 3. 启动

```bash
# 开发模式（前后端同时启动，支持热更新）
npm run dev

# 开发模式说明：
# - 后端：tsx watch 热更新（代码变更不重启端口）
# - 前端：Vite HMR 热模块替换（页面不刷新）
# - 访问地址：http://localhost:5173 (Vite 开发服务器)

# 生产构建
npm run build    # 构建前端到 client/dist
npm start        # 启动生产服务器（端口 3000，服务静态文件）
```

## 访问

**开发模式：**
- 访问 Vite 开发服务器：`http://localhost:5173`
- 前端热更新 (HMR)，后端 API 代理到 Express

**生产模式：**
- 访问 Express 服务器：`http://localhost:3000`
- Express 直接服务静态文件

**远程 Gateway 连接（如 43.163.246.185）：**

```bash
# 方式 1: SSH 隧道（推荐）
ssh -L 18789:localhost:18789 root@43.163.246.185
npm run config:remote  # 选择 Y 使用隧道模式
npm run dev

# 方式 2: 直接连接
echo "OPENCLAW_GATEWAY_URL=ws://43.163.246.185:18789" > .env
npm run dev
```

详见 [CONNECT-REMOTE.md](CONNECT-REMOTE.md) 和 [REMOTE-DEV.md](REMOTE-DEV.md)

## API 说明

详见 [API-INTERFACE.md](API-INTERFACE.md) - 完整的接口规范和 TypeScript 类型定义。

后端提供以下核心 API 端点：

| 端点 | 说明 |
|------|------|
| `GET /api/health` | 网关健康检查 |
| `GET /api/sessions` | 会话列表 |
| `GET /api/memory/status` | 记忆状态 |
| `GET /api/files` | 文件列表 |
| `POST /api/files/content` | 写入文件 |

## 安全

- 文件系统访问限制在 `OPENCLAW_HOME` 目录内
- 建议在部署时添加认证中间件
- 生产环境建议使用 HTTPS

## 技术栈

**后端:**
- Node.js + Express
- WebSocket (连接 OpenClaw Gateway)
- TypeScript

**前端:**
- React 18
- TypeScript
- Tailwind CSS
- React Query
- React Router

## 测试

```bash
# 运行所有测试
npm run test

# 后端单元测试
npm run test:server

# 前端单元测试
npm run test:client

# 联调测试（需要运行服务器）
npm run test:e2e
```

**测试覆盖:**
- 后端：6 个测试（API 路由、文件系统安全）
- 前端：10 个测试（组件、API 客户端）
- 联调：配置路径 API 验证

详见 [TESTING.md](TESTING.md)

## License

MIT
haha
