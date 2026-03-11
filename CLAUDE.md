# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 核心开发流程

严格遵循 **接口优先 → 测试驱动 → 并行实现 → 代码优化 → 再次测试** 的开发流程：

1. **接口优先** - 先在 `API-INTERFACE.md` 中定义接口规范
2. **测试驱动** - 编写测试用例（先失败，实现后通过）
3. **并行实现** - 接口是唯一真相源，后端、前端、Mock、测试同时进行
   - 前后端并行：前端用 Mock，不依赖后端实现
   - 后端内部并行：每个端点独立实现和测试
   - 前端内部并行：每个页面独立开发和测试
   - 详见 [DEVELOPMENT-FLOW.md](DEVELOPMENT-FLOW.md) 第 3 节 和 [docs/PARALLEL-DEVELOPMENT.md](docs/PARALLEL-DEVELOPMENT.md)
4. **代码优化** - 重构、错误处理、类型安全
5. **再次测试** - 运行完整测试套件

详见 [DEVELOPMENT-FLOW.md](DEVELOPMENT-FLOW.md)

## Project Overview

OpenClaw Dashboard - a web-based management panel that runs on the same machine as an OpenClaw instance. It provides:
- WebSocket connection to OpenClaw Gateway (port 18789)
- Direct file system access to OpenClaw directories (`~/.openclaw`)
- REST API proxy for Gateway methods
- React frontend for monitoring and management

## Architecture

```
┌─────────────────────────────────────────────┐
│  OpenClaw Instance Machine                  │
│                                             │
│  ┌─────────────┐    ┌─────────────────┐    │
│  │ OpenClaw    │◄──►│ Dashboard       │    │
│  │ Gateway     │    │ Express Server  │    │
│  │ :18789      │    │ :3000           │    │
│  └─────────────┘    └─────────────────┘    │
│                            ▲                │
└────────────────────────────┼────────────────┘
                             │ HTTP
                             ▼
                    ┌─────────────────┐
                    │ Browser         │
                    └─────────────────┘
```

## Commands

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Development (both server and client with hot reload)
npm run dev

# Development - server only (tsx watch, hot reload on file changes)
npm run dev:server

# Development - client only (Vite HMR)
npm run dev:client

# Production build
npm run build        # builds client to client/dist
npm start            # runs built server

# Connect to remote Gateway (43.163.246.185)
ssh -L 18789:localhost:18789 root@43.163.246.185  # new terminal
npm run config:remote  # configuration wizard, choose Y for SSH tunnel
npm run dev
```

**Hot Reload:**
- Backend: `tsx watch` recompiles and reloads code without port restart
- Frontend: Vite HMR updates modules in place without page reload

## Testing

```bash
# Run all tests
npm run test

# Backend unit tests
npm run test:server        # run once
npm run test:watch         # watch mode
npm run test:coverage      # with coverage report

# Frontend unit tests
cd client && npm run test:run    # run once
cd client && npm run test        # watch mode
cd client && npm run test:coverage

# Integration/E2E tests
npm run test:e2e           # requires running server
```

**Test Frameworks:**
- Backend: Vitest (Node environment)
- Frontend: Vitest + React Testing Library (JSDOM)
- E2E: Custom integration runner with axios

**Test Configuration:**
- Backend: `vitest.config.ts` - includes `src-server/**/*.test.ts`, `tests/**/*.test.ts`
- Frontend: `client/vitest.config.ts` - includes `client/src/**/*.test.tsx`
- Frontend tests require `@vitest-environment jsdom` directive

**Cross-platform Testing:**
- Use `path.posix.resolve()` for consistent path handling between Windows and Linux
- Integration runner uses `cmd /c` on Windows for proper spawn handling

## Project Structure

- `src-server/` - Express backend (TypeScript, ESM)
  - `index.ts` - Main server: WebSocket RPC to Gateway, REST API, file system access
- `client/` - React frontend (Vite + TypeScript)
  - `src/pages/` - Route components (Dashboard, Sessions, Memory, Files, Agents)
  - `src/lib/api.ts` - API client for backend endpoints
  - `src/App.tsx` - Router and layout
- `ecosystem.config.js` - PM2 deployment config

**API 文档：** 详见 [API-INTERFACE.md](API-INTERFACE.md) - 完整的 Gateway RPC 方法和 REST API 端点定义

## 临时文件管理

**归档命令：**
```bash
npm run archive           # 执行归档
npm run archive:check     # 仅检查，不移动
```

**完整指南：** 详见 [docs/FILE-MANAGEMENT.md](docs/FILE-MANAGEMENT.md)

**会话是什么？**
- 会话 = 你的一次 Claude Code 对话周期
- 会话结束 = 关闭终端/超时断开/主动结束
- **不会自动归档**，需要手动运行 `npm run archive`

**归档策略：**

| 类型 | 归档位置 | 说明 |
|------|----------|------|
| 任务文件 | `.archive/` | `tasks/` 目录整体归档 |
| 临时笔记 | `.archive/` | `*-plan.md`, `*-todo.md`, `*.tmp.md` |
| 设计文档 | 手动移至 `docs/plans/` | 有价值的内容 |
| 项目记忆 | 手动移至 `memory/` | 跨 session 经验 |

**归档文件命名：**
```
原始文件：current-plan.md
归档后：   .archive/2026-03-11-14-30-45-current-plan.md
           └─────┬─────┬─────┬────┘
          YYYY-MM-DD-HH-MM-SS-原名
```

**推荐流程：**
1. 会话进行中：临时文件可放在根目录
2. 会话结束前：运行 `npm run archive:check` 查看有哪些文件
3. 有价值的内容手动移至 `docs/plans/` 或 `memory/`
4. 运行 `npm run archive` 归档其余临时文件
5. 归档文件带时间戳，可随时查阅或手动删除
