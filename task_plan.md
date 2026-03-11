# Task Plan: 网页版终端界面

## 项目目标 ✅ 实现完成

开发一个支持多终端标签页的网页版终端界面，后端部署在 Linux 上，使用本地 pty 实现终端会话。

### 核心功能 ✅ 全部实现
- [x] 单个终端连接 Linux 主机
- [x] 支持多个终端标签页
- [x] 实时命令输出显示
- [x] 命令输入和执行
- [x] 终端会话管理（新建、关闭、切换）

---

## 技术选型

### 前端终端组件
| 方案 | 优势 | 劣势 | 选择 |
|------|------|------|------|
| **xterm.js** | 功能完整、VS Code 同款、生态成熟 | 包体积较大 | ✅ 已用 |

### 后端 pty 方案
| 方案 | 优势 | 劣势 | 选择 |
|------|------|------|------|
| **node-pty** | 原生伪终端、功能完整 | 需编译原生模块 | ✅ 已用 |

### 通信协议
| 方案 | 优势 | 选择 |
|------|------|------|
| **WebSocket** | 双向实时通信、低延迟 | ✅ 已用 |

---

## 实施阶段 ✅ 全部完成

### 阶段 1: 后端实现 ✅
- [x] 安装依赖：`npm install node-pty uuid`
- [x] 创建 `src-server/terminal/pty-manager.ts`
- [x] 创建 `src-server/terminal/types.ts`
- [x] 创建 `src-server/terminal/websocket.ts`
- [x] 在 `index.ts` 中集成 WebSocket

### 阶段 2: 前端实现 ✅
- [x] 安装依赖：`npm install @xterm/xterm @xterm/addon-fit`
- [x] 创建 `client/src/types/terminal.ts`
- [x] 创建 `client/src/lib/xterm.ts`
- [x] 创建 `client/src/lib/terminal-ws.ts`
- [x] 创建 `client/src/components/XtermContainer.tsx`
- [x] 创建 `client/src/components/TerminalTabs.tsx`
- [x] 创建 `client/src/pages/Terminal.tsx`
- [x] 更新路由和菜单

### 阶段 3: 编译验证 ✅
- [x] 前端 TypeScript 编译通过
- [x] 后端 TypeScript 编译通过

---

## 运行命令

```bash
# 开发模式 (需要 node-pty 原生模块)
npm run dev

# 访问终端
http://localhost:5173/terminal
```

---

## 注意事项

⚠️ **node-pty 需要编译原生模块**，在 Linux 上需要 `python` 和 `make`
⚠️ **当前 Windows 环境**：node-pty 可能无法正常工作
⚠️ **部署到 Linux**：需要在 Linux 服务器上重新安装 node-pty

---

## 架构设计

详见 [`docs/terminal-architecture.md`](docs/terminal-architecture.md)
