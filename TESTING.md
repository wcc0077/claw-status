# OpenClaw Dashboard 测试指南

## 测试架构

```
┌─────────────────────────────────────────────────────────┐
│                    测试金字塔                           │
│                                                         │
│                   ┌─────────┐                          │
│                  /   E2E    \                          │
│                 /  (联调测试) \                         │
│                ───────────────                          │
│               /  Integration  \                         │
│              /   (API 测试)    \                         │
│             ─────────────────────                        │
│            /      Unit Tests     \                       │
│           /   (组件 + 工具函数)    \                      │
│          ───────────────────────────                      │
└─────────────────────────────────────────────────────────┘
```

## 测试状态

**后端测试：** ✅ 6 个测试全部通过
- API 路由测试 (3 个)
- 文件系统安全测试 (3 个)

**前端测试：** ✅ 10 个测试全部通过
- API 客户端测试 (3 个)
- Dashboard 组件测试 (3 个)
- Sessions 组件测试 (4 个)

**联调测试：** ✅ 通过（需要 Gateway 的测试会优雅降级）

## 单元测试

### 后端测试

```bash
# 运行所有后端测试
npm run test:server

# 监视模式（开发时使用）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

**测试文件位置：**
- `src-server/*.test.ts` - 后端路由和工具函数测试
- `src-server/file-security.test.ts` - 文件系统安全测试

**示例测试：**

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

describe('API Routes', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.get('/api/health', (req, res) => {
      res.json({ ok: true, data: { status: 'ok' } });
    });
  });

  it('GET /api/health should return status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toEqual({
      ok: true,
      data: { status: 'ok' }
    });
  });
});
```

### 前端测试

```bash
# 进入客户端目录
cd client

# 运行所有前端测试
npm run test

# 运行一次（不监视）
npm run test:run

# 生成覆盖率报告
npm run test:coverage
```

**测试文件位置：**
- `client/src/**/*.test.tsx` - React 组件测试
- `client/src/**/*.test.ts` - 工具函数测试

**示例测试：**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../pages/Dashboard';

vi.mock('../lib/api', () => ({
  dashboardApi: {
    getHealth: vi.fn(() => Promise.resolve({ data: { status: 'ok' } })),
  },
}));

describe('Dashboard', () => {
  it('should display health status', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('健康状态')).toBeInTheDocument();
    });
  });
});
```

## 联调测试

### 自动化联调

```bash
# 运行联调测试（自动启动服务器）
npm run test:e2e
```

### 手动联调步骤

1. **启动 OpenClaw Gateway**（可选，用于完整测试）

```bash
# 确保 OpenClaw Gateway 运行在 18789 端口
openclaw gateway run
```

2. **启动 Dashboard 开发服务器**

```bash
npm run dev
```

3. **测试 API 端点**

```bash
# 配置路径
curl http://localhost:3000/api/config-path

# 健康检查（需要 Gateway）
curl http://localhost:3000/api/health

# 会话列表（需要 Gateway）
curl http://localhost:3000/api/sessions
```

4. **测试前端**

访问 http://localhost:5173，检查：
- 仪表盘显示正常
- 各页面导航正常
- API 数据加载正常

## 测试检查清单

### 后端
- [ ] API 路由响应正确
- [ ] WebSocket 连接处理
- [ ] 文件系统安全验证
- [ ] 错误处理完善
- [ ] 日志输出正常

### 前端
- [ ] 组件渲染正确
- [ ] API 调用正常
- [ ] 加载状态显示
- [ ] 错误状态显示
- [ ] 导航路由正常

### 联调
- [ ] 前后端通信正常
- [ ] 代理配置正确
- [ ] 静态文件服务正常
- [ ] WebSocket 重连机制

## 常见问题

### 1. 测试超时

**原因：** Gateway 未运行，API 调用超时

**解决：** Mock Gateway 响应或跳过需要 Gateway 的测试

```typescript
vi.mock('../lib/api', () => ({
  dashboardApi: {
    getHealth: vi.fn(() => Promise.resolve({ data: null })),
  },
}));
```

### 2. 端口占用

**原因：** 3000 或 5173 端口已被占用

**解决：** 修改环境变量

```bash
# 修改后端端口
DASHBOARD_PORT=3001 npm run dev:server

# 修改前端端口
cd client && VITE_PORT=5174 npm run dev
```

### 3. WebSocket 连接失败

**原因：** OpenClaw Gateway 未运行

**解决：** 启动 Gateway 或使用 Mock 模式

```bash
# 启动 Gateway
openclaw gateway run --bind loopback --port 18789
```

## CI/CD 集成

```yaml
# GitHub Actions 示例
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          npm install
          cd client && npm install

      - name: Run backend tests
        run: npm run test:server

      - name: Run frontend tests
        run: cd client && npm run test:run
```
