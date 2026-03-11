# 开发流程规范

## 核心原则

**接口优先 → 测试驱动 → 并行实现 → 代码优化 → 再次测试**

---

## 1. 接口优先 (Interface First)

在编写任何实现代码之前，先定义清晰的接口规范。

### 步骤

1. **定义 API 接口** - 在 `API-INTERFACE.md` 中写明：
   - 请求格式
   - 响应格式
   - 错误处理
   - 类型定义

2. **评审接口设计** - 确认：
   - 接口是否简洁明了
   - 参数是否合理
   - 错误处理是否完善
   - 是否符合 REST/RPC 规范

3. **生成类型定义** - TypeScript 项目应先生成类型：
   ```typescript
   // types/gateway.ts
   export interface GatewayHealth {
     status: 'ok' | 'error';
     version: string;
     uptime: number;
   }
   ```

### 示例

```typescript
// 1. 先定义类型
interface Session {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// 2. 定义接口
interface SessionsListResponse {
  ok: boolean;
  data: {
    sessions: Session[];
  };
}

// 3. 文档化
/**
 * GET /api/sessions
 * 获取会话列表
 */
```

---

## 2. 测试驱动 (Test Driven)

在实现功能之前，先编写测试用例。

### 步骤

1. **编写失败的测试**
   ```typescript
   // src-server/health.test.ts
   describe('GET /api/health', () => {
     it('should return health status', async () => {
       const response = await request(app).get('/api/health');
       expect(response.status).toBe(200);
       expect(response.body).toHaveProperty('ok', true);
       expect(response.body.data).toHaveProperty('status');
     });
   });
   ```

2. **运行测试（确认失败）**
   ```bash
   npm run test:server
   ```

3. **编写接口实现**

4. **运行测试（确认通过）**

### 测试层次

```
┌─────────────────────┐
│   E2E 测试          │  ← 联调测试
├─────────────────────┤
│   集成测试          │  ← API 测试
├─────────────────────┤
│   单元测试          │  ← 组件/函数测试
└─────────────────────┘
```

---

## 3. 并行实现 (Parallel Implementation)

**核心原则：接口是唯一真相源，所有实现直接依赖接口，而非依赖彼此。**

### 真正并行的含义

```
                    ┌─────────────────┐
                    │  API-INTERFACE  │
                    │  (唯一真相源)    │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
   │后端服务层│         │前端 API 层 │         │Mock 数据 │
   │ + 测试   │         │ + 测试   │         │ + 测试   │
   └─────────┘         └─────────┘         └─────────┘
```

**传统伪并行：** 接口 → 后端 → 前端 → 联调（每步都在等）

**真正并行：** 接口完成后，后端、前端、Mock、测试 **同时进行**

---

### 多层次并行策略

#### 第一层：前后端并行

```
┌─────────────────────────────────────────────────┐
│ API-INTERFACE.md 完成（唯一依赖）                 │
└─────────────────────────────────────────────────┘
              │
    ┌─────────┴─────────┐
    ▼                   ▼
┌─────────┐       ┌─────────┐
│ 后端实现 │       │ 前端实现 │
│ - 直接写 │       │ - 用 Mock │
│ - 不依赖 │       │ - 不依赖 │
│  前端    │       │  后端   │
└─────────┘       └─────────┘
```

#### 第二层：后端内部并行

每个端点独立实现，互不阻塞：

```
健康检查端点    会话管理端点    记忆系统端点    文件管理端点
    ↓              ↓              ↓              ↓
独立实现        独立实现        独立实现        独立实现
    ↓              ↓              ↓              ↓
独立测试        独立测试        独立测试        独立测试

所有端点共享：
- API-INTERFACE.md 中的类型
- gateway-client.ts (通用 RPC 客户端)
```

#### 第三层：前端内部并行

每个页面/组件独立开发，互不阻塞：

```
Dashboard 页面   Sessions 页面   Memory 页面   Files 页面
    ↓              ↓              ↓             ↓
独立组件        独立组件        独立组件       独立组件
    ↓              ↓              ↓             ↓
独立 Mock       独立 Mock       独立 Mock      独立 Mock
    ↓              ↓              ↓             ↓
独立测试        独立测试        独立测试       独立测试

所有页面共享：
- api.ts (API 客户端接口)
- types/ (从 API-INTERFACE 生成的类型)
```

---

### Mock 数据策略

**Mock 是并行的关键** —— 前端不依赖真实后端即可开发和测试。

```typescript
// Mock 数据示例 (client/src/lib/api.mock.ts)
export const mockSessions: SessionsListResponse = {
  ok: true,
  data: { sessions: [{ id: '1', createdAt: '...' }] },
};
```

组件使用 Mock 作为初始数据，完全不依赖真实后端：

```typescript
const { data } = useQuery(['sessions'], () => api.getSessions(), {
  initialData: mockSessions
});
```

**详细示例：** 详见 [docs/PARALLEL-DEVELOPMENT.md](docs/PARALLEL-DEVELOPMENT.md) - 完整的任务分解模板和 Mock 数据策略。

---

### 并行检查清单

开始实现前确认：

- [ ] 接口已定义（API-INTERFACE.md）
- [ ] Mock 数据已创建（前端可用）
- [ ] 每个任务都有独立测试

**详细检查清单：** 详见 [docs/PARALLEL-DEVELOPMENT.md](docs/PARALLEL-DEVELOPMENT.md) 第 6 节。

开始实现后：

- [ ] 后端不依赖前端进度
- [ ] 前端不依赖后端进度
- [ ] 每个端点/页面独立开发和测试
- [ ] 只在最后进行集成测试

---

## 4. 代码优化 (Code Optimization)

功能实现后，进行代码重构和优化。

### 检查清单

- [ ] **代码复用** - 提取公共函数/组件
- [ ] **命名规范** - 变量、函数命名清晰
- [ ] **错误处理** - 完善的 try-catch
- [ ] **类型安全** - 避免 any，使用严格类型
- [ ] **代码格式** - 运行 linter 和 formatter
- [ ] **性能优化** - 减少不必要的渲染/请求
- [ ] **注释文档** - 复杂逻辑添加注释

### 优化示例

**优化前：**
```typescript
function getData() {
  return fetch('/api/data').then(r => r.json());
}
```

**优化后：**
```typescript
/**
 * 获取数据
 * @throws {ApiError} 当 API 请求失败时
 */
export async function fetchData(): Promise<DataResponse> {
  try {
    const response = await api.get<DataResponse>('/api/data');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new ApiError(error.response?.status || 500, error.message);
    }
    throw error;
  }
}
```

---

## 5. 再次测试 (Test Again)

完成所有开发后，运行完整测试套件。

### 测试命令

```bash
# 运行所有测试
npm run test

# 后端测试
npm run test:server

# 前端测试
npm run test:client

# 联调测试
npm run test:e2e

# 测试覆盖率
npm run test:coverage
```

### 通过标准

- ✅ 所有单元测试通过
- ✅ 所有集成测试通过
- ✅ 所有 E2E 测试通过
- ✅ 代码覆盖率达标（>70%）
- ✅ 无 TypeScript 错误
- ✅ 无 ESLint 警告

---

## 完整流程示例

### 新增功能：获取网关状态

**1. 接口定义**
```typescript
// API-INTERFACE.md 中添加
interface GatewayStatus {
  uptime: number;
  memory: number;
  agents: number;
}
```

**2. 编写测试**
```typescript
// src-server/status.test.ts
describe('GET /api/status', () => {
  it('should return gateway status', async () => {
    const response = await request(app).get('/api/status');
    expect(response.body.data).toHaveProperty('uptime');
    expect(response.body.data).toHaveProperty('memory');
  });
});
```

**3. 并行实现**

后端：
```typescript
// src-server/index.ts
app.get('/api/status', async (req, res) => {
  const status = await callGateway('status', {});
  res.json({ ok: true, data: status });
});
```

前端：
```typescript
// src/pages/Dashboard.tsx
const { data } = useQuery(['status'], () => api.getStatus());
```

**4. 代码优化**
```typescript
// 提取公共错误处理
const handleApiError = (error: unknown) => {
  // ...
};
```

**5. 再次测试**
```bash
npm run test
npm run test:coverage
```

---

## 工具支持

### 开发工具

- **TypeScript** - 类型检查
- **Vitest** - 测试框架
- **ESLint** - 代码检查
- **Prettier** - 代码格式化

### 自动化

```json
{
  "scripts": {
    "test": "运行所有测试",
    "test:coverage": "生成覆盖率报告",
    "check": "运行 linter 和 typecheck"
  }
}
```

### CI/CD

```yaml
# GitHub Actions 示例
jobs:
  test:
    steps:
      - run: npm install
      - run: npm run test
      - run: npm run test:coverage
```

---

## 参考文档

- [API-INTERFACE.md](API-INTERFACE.md) - 接口规范
- [TESTING.md](TESTING.md) - 测试指南
- [CLAUDE.md](CLAUDE.md) - 开发指南
- [docs/PARALLEL-DEVELOPMENT.md](docs/PARALLEL-DEVELOPMENT.md) - 并行开发任务分解示例
