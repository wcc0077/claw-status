# Findings: OpenClaw Dashboard 前端开发

## 项目现状分析

### 当前代码结构

```
client/src/
├── components/
│   └── MainLayout.tsx      # 侧边栏导航布局
├── lib/
│   └── api.ts              # API 客户端
├── pages/
│   ├── Dashboard.tsx       # 健康看板
│   ├── Sessions.tsx        # 会话管理
│   ├── Memory.tsx          # 记忆系统
│   ├── Agents.tsx          # 代理管理
│   └── Files.tsx           # 文件浏览器
├── types/
│   └── api.ts              # TypeScript 类型定义
├── App.tsx                 # 路由配置
├── main.tsx                # 入口文件
└── index.css               # 全局样式
```

### 依赖配置

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.13.1",
    "antd": "^5.x",
    "@ant-design/icons": "^5.x",
    "@ant-design/pro-components": "^2.x"
  },
  "devDependencies": {
    "typescript": "~5.9.3",
    "vite": "^7.3.1",
    "@vitejs/plugin-react": "^5.1.1"
  }
}
```

### 配置要点

1. **vite.config.ts**:
   - 路径别名 `@` 映射到 `src/`
   - API 代理 `/api` → `http://localhost:3000`
   - 开发端口 `5173`

2. **tsconfig.app.json**:
   - 启用严格模式
   - 配置路径映射 `@/*` → `src/*`

---

## API 接口分析

### Gateway WebSocket RPC 方法

| 方法 | 用途 | 返回数据 |
|------|------|----------|
| `health` | 健康检查 | status, version, uptime |
| `status` | 运行状态 | uptime, memory, agents, sessions |
| `last-heartbeat` | 心跳 | lastHeartbeat, heartbeats |
| `sessions.list` | 会话列表 | sessions[] |
| `sessions.preview` | 会话预览 | messageCount, messages |
| `sessions.delete` | 删除会话 | ok |
| `sessions.compact` | 压缩会话 | ok, compactedCount |
| `doctor.memory.status` | 记忆状态 | enabled, backend, count |
| `agents.list` | 代理列表 | agents[] |
| `skills.status` | 技能状态 | bins, installed |

### REST API 端点

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/status` | GET | 运行状态 |
| `/api/sessions` | GET | 会话列表 |
| `/api/sessions/:id` | DELETE | 删除会话 |
| `/api/sessions/:id/compact` | POST | 压缩会话 |
| `/api/memory/status` | GET | 记忆状态 |
| `/api/agents` | GET | 代理列表 |
| `/api/skills/status` | GET | 技能状态 |
| `/api/files` | GET | 文件列表 |
| `/api/files/content` | GET/POST | 文件内容 |

---

## 设计决策

### 布局结构

```
┌─────────────────────────────────────┐
│  Header (Logo + 全局状态指示器)     │
├─────────┬───────────────────────────┤
│ Sidebar │  Main Content Area        │
│         │                           │
│ - Dash  │  - 卡片式仪表板           │
│ - 会话  │  - 数据表格               │
│ - 记忆  │  - 状态面板               │
│ - 代理  │  - 文件浏览器             │
│ - 文件  │                           │
└─────────┴───────────────────────────┘
```

### 配色方案

- 主色调：Ant Design 默认蓝 (#1677ff)
- 状态色：成功绿 (#52c41a)、警告橙 (#fa8c16)、错误红 (#ff4d4f)
- 背景：浅灰背景 (#f0f2f5)

### 组件映射

| UI 元素 | Ant Design 组件 |
|---------|-----------------|
| 布局 | `Layout`, `Sider`, `Header`, `Content` |
| 导航 | `Menu` |
| 卡片 | `Card`, `StatCard` |
| 表格 | `Table` |
| 按钮 | `Button` |
| 状态 | `Tag`, `Badge`, `Progress` |
| 消息 | `message`, `notification`, `Result` |
| 弹窗 | `Modal`, `Drawer` |
| 表单 | `Form`, `Input` |
| 面包屑 | `Breadcrumb` |

---

## 技术要点

### 1. API 客户端设计

```typescript
// 模块化设计
export const api = {
  health: healthApi,
  sessions: sessionsApi,
  memory: memoryApi,
  agents: agentsApi,
  files: filesApi,
  config: configApi,
};
```

### 2. 类型安全

- 完整的 TypeScript 类型定义
- API 响应类型推断
- 错误处理类型安全

### 3. 状态管理

- 使用 React Hooks (useState, useEffect)
- 简单的加载/错误/数据状态
- 无额外状态管理库依赖

### 4. 错误处理

- try-catch 包裹异步操作
- 友好的错误提示
- 自动重试机制

---

## 编译优化建议

生产构建时出现代码块过大警告 (>500KB)，建议：

1. **代码分割**:
```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        'antd-vendor': ['antd', '@ant-design/icons'],
      },
    },
  },
}
```

2. **按需加载**: 使用 Ant Design 按需引入

3. **懒加载路由**:
```typescript
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

---

## 参考文档

- [API-INTERFACE.md](API-INTERFACE.md) - 完整 API 规范
- [DEVELOPMENT-FLOW.md](DEVELOPMENT-FLOW.md) - 开发流程
- [CLAUDE.md](CLAUDE.md) - 项目指令
