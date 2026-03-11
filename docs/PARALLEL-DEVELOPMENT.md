# 并行开发任务分解示例

**功能：记忆系统状态页面**

本文档展示如何按照"接口优先、测试驱动、并行实现"原则，将一个完整功能分解为可并行执行的最小任务单元。

---

## 1. 接口定义（已完成）

**API-INTERFACE.md 中已定义：**

```typescript
// GET /api/memory/status
interface MemoryStatusResponse {
  ok: boolean;
  data: {
    enabled: boolean;
    backend: string;      // 'qmd' | 'none'
    embeddingModel: string;
    dimensions: number;
    count: number;
    indexSize: number;
  };
}
```

---

## 2. 任务分解图

```
                    ┌─────────────────────┐
                    │ API-INTERFACE.md    │
                    │ (唯一真相源，已完成) │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
   ┌─────▼─────┐       ┌──────▼──────┐      ┌──────▼──────┐
   │ 后端任务   │       │  Mock 任务   │      │  前端任务   │
   │   T1-T3   │       │     T4      │      │   T5-T7     │
   └───────────┘       └─────────────┘      └─────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                         ┌─────▼─────┐
                         │  E2E 任务  │
                         │    T8     │
                         └───────────┘

说明：
- T1-T7 可以同时进行（都只依赖 API-INTERFACE.md）
- T8 必须等 T1-T7 完成后进行（集成测试）
```

---

## 3. 详细任务列表

### 后端任务（独立并行）

| 任务 ID | 任务名 | 依赖 | 产出文件 | 验收标准 |
|---------|--------|------|----------|----------|
| **T1** | 实现 GET /api/memory/status 路由 | API-INTERFACE.md | `src-server/index.ts` | 路由返回正确格式 |
| **T2** | 编写路由单元测试 | T1 | `src-server/index.test.ts` | 测试通过 |
| **T3** | 实现 Gateway RPC 调用 | API-INTERFACE.md | `src-server/gateway-client.ts` | 能调用 `doctor.memory.status` |

**T1 实现提示：**
```typescript
// src-server/index.ts
app.get('/api/memory/status', async (req, res) => {
  const result = await callGateway('doctor.memory.status', {});
  res.json({ ok: true, data: result });
});
```

**T2 测试提示：**
```typescript
// src-server/index.test.ts
describe('GET /api/memory/status', () => {
  it('should return memory status', async () => {
    const response = await request(app).get('/api/memory/status');
    expect(response.body).toHaveProperty('ok', true);
    expect(response.body.data).toHaveProperty('enabled');
    expect(response.body.data).toHaveProperty('backend');
  });
});
```

---

### Mock 任务（独立并行）

| 任务 ID | 任务名 | 依赖 | 产出文件 | 验收标准 |
|---------|--------|------|----------|----------|
| **T4** | 创建记忆系统 Mock 数据 | API-INTERFACE.md | `client/src/lib/api.mock.ts` | 数据类型匹配接口定义 |

**T4 实现提示：**
```typescript
// client/src/lib/api.mock.ts
export const mockMemoryStatus: MemoryStatusResponse = {
  ok: true,
  data: {
    enabled: true,
    backend: 'qmd',
    embeddingModel: 'text-embedding-3-small',
    dimensions: 1536,
    count: 1250,
    indexSize: 2048,
  },
};

export const mockApi = {
  // ... 其他 mock
  getMemoryStatus: () => Promise.resolve(mockMemoryStatus),
};
```

---

### 前端任务（独立并行）

| 任务 ID | 任务名 | 依赖 | 产出文件 | 验收标准 |
|---------|--------|------|----------|----------|
| **T5** | 实现 API 客户端方法 | API-INTERFACE.md | `client/src/lib/api.ts` | 返回正确的 Promise |
| **T6** | 创建 Memory 页面组件 | API-INTERFACE.md + T4 | `client/src/pages/Memory.tsx` | 显示记忆状态信息 |
| **T7** | 编写组件测试 | T6 | `client/src/pages/Memory.test.tsx` | 测试通过 |

**T5 实现提示：**
```typescript
// client/src/lib/api.ts
export interface MemoryStatus {
  enabled: boolean;
  backend: string;
  embeddingModel: string;
  dimensions: number;
  count: number;
  indexSize: number;
}

export async function getMemoryStatus(): Promise<MemoryStatusResponse> {
  const response = await axios.get<MemoryStatusResponse>('/api/memory/status');
  return response.data;
}
```

**T6 实现提示：**
```typescript
// client/src/pages/Memory.tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { mockMemoryStatus } from '../lib/api.mock';

export function Memory() {
  const { data, isLoading } = useQuery(
    ['memory'],
    () => api.getMemoryStatus(),
    { initialData: mockMemoryStatus }
  );

  if (isLoading) return <div>加载中...</div>;

  return (
    <div className="memory-page">
      <h1>记忆系统</h1>
      <div className="status-cards">
        <StatusCard label="状态" value={data.data.enabled ? '已启用' : '未启用'} />
        <StatusCard label="后端" value={data.data.backend} />
        <StatusCard label="Embedding" value={data.data.embeddingModel} />
        <StatusCard label="记忆数量" value={data.data.count.toString()} />
      </div>
    </div>
  );
}
```

**T7 测试提示：**
```typescript
// client/src/pages/Memory.test.tsx
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Memory } from './Memory';

describe('Memory Page', () => {
  it('should display memory status', () => {
    render(<Memory />);
    expect(screen.getByText('记忆系统')).toBeInTheDocument();
    expect(screen.getByText('qmd')).toBeInTheDocument();
  });
});
```

---

### E2E 任务（最后集成）

| 任务 ID | 任务名 | 依赖 | 产出文件 | 验收标准 |
|---------|--------|------|----------|----------|
| **T8** | 联调测试 | T1-T7 | `tests/memory.e2e.test.ts` | 端到端测试通过 |

**T8 测试提示：**
```typescript
// tests/memory.e2e.test.ts
import axios from 'axios';

describe('Memory E2E', () => {
  const API_BASE = 'http://localhost:3000/api';

  it('should fetch memory status', async () => {
    const response = await axios.get(`${API_BASE}/memory/status`);
    expect(response.data.ok).toBe(true);
    expect(response.data.data).toHaveProperty('enabled');
    expect(response.data.data).toHaveProperty('backend');
  });
});
```

---

## 4. 并行执行时间线

```
时间轴（小时为单位）：
     0    1    2    3    4    5
     │    │    │    │    │    │
     ├────├────┤    │    │    │  T1: 后端路由实现
     │    │    │    │    │    │
     ├────┼────┤    │    │    │  T2: 后端测试编写
     │    │    │    │    │    │
     ├────┤    │    │    │    │  T3: Gateway RPC 调用
     │    │    │    │    │    │
     │    ├────┼────┤    │    │  T4: Mock 数据创建
     │    │    │    │    │    │
     │    │    ├────┼────┤    │  T5: API 客户端方法
     │    │    │    │    │    │
     │    │    ├────┼────┼────┤  T6: 前端页面组件
     │    │    │    │    │    │
     │    │    │    ├────┼────┤  T7: 前端测试编写
     │    │    │    │    │    │
     │    │    │    │    │    ├─┤ T8: E2E 联调测试

传统串行开发：约 8-10 小时
真正并行开发：约 5 小时（T1-T7 并行，T8 最后）
效率提升：约 40-50%
```

---

## 5. 任务分配建议

如果是多人团队：

```
开发者 A（后端专精）：T1, T2, T3
开发者 B（前端专精）：T5, T6, T7
开发者 C（数据/测试）：T4, T8

所有开发者在开工前确认：
- API-INTERFACE.md 已评审通过
- 类型定义已同步
```

如果是单人开发：

```
策略：按依赖关系分组执行

第一批（T1 + T4）：先完成路由和 Mock
  - 后端路由实现（T1）
  - Mock 数据创建（T4）
  这两项可以交替进行，互相不影响

第二批（T2 + T5 + T6）：测试和组件
  - 后端测试（T2）
  - API 客户端（T5）
  - 前端组件（T6）

第三批（T3 + T7）：收尾
  - Gateway RPC 调试（T3）
  - 前端测试（T7）

最后一批（T8）：联调
  - E2E 测试（T8）
```

---

## 6. 检查清单

**开始每个任务前：**
- [ ] API-INTERFACE.md 中的接口已定义
- [ ] TypeScript 类型已生成
- [ ] 理解输入和输出

**完成每个任务后：**
- [ ] 代码已通过本地测试
- [ ] 类型检查通过（无 any）
- [ ] 代码已格式化

**集成前确认：**
- [ ] T1-T7 全部完成
- [ ] 所有单元测试通过
- [ ] 准备运行 E2E 测试

---

## 7. 扩展到更大功能

对于更复杂的功能（如完整的会话管理），将上述模板复制多份：

```
会话管理功能分解：
├── GET /api/sessions       → T1-T8（如上分解）
├── GET /api/sessions/:id/preview  → T1-T8
├── DELETE /api/sessions/:id       → T1-T8
└── POST /api/sessions/:id/compact → T1-T8

每个端点都是一套完整的 T1-T8 流程
所有端点可以同时进行
```

---

## 8. 关键原则总结

1. **接口是唯一真相源** - 所有任务直接依赖 API-INTERFACE.md，不依赖彼此
2. **Mock 是并行的关键** - 前端通过 Mock 完全不依赖后端实现
3. **最小独立单元** - 每个任务都应该小到可以独立理解和完成
4. **测试伴随实现** - 每个实现任务都有对应的测试任务
5. **集成最后进行** - E2E 测试只在所有单元测试通过后进行

`★ Insight ─────────────────────────────────────`

1. **并行开发的本质不是"同时做多件事"，而是"减少依赖链"**：传统开发是线性依赖（A→B→C→D），真正并行开发是星型依赖（所有任务都只依赖接口文档）。这要求接口设计必须先行且稳定。

2. **Mock 数据不是"假数据"，而是"可执行的接口契约"**：Mock 数据的结构必须与接口定义 100% 一致，它既是前端开发的工具，也是验证接口设计合理性的手段 —— 如果 Mock 数据很难构造，说明接口设计可能有问题。

3. **任务分解的质量决定并行的效率**：任务分解过大会导致"伪并行"（看似同时做，实则互相等待），分解过小会增加协调成本。经验法则：每个任务应该在 1-2 小时内可以独立完成。

`─────────────────────────────────────────────────`
