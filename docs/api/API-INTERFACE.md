# OpenClaw Dashboard API 接口规范

## 接口优先设计原则

本文档定义了 Dashboard 与 OpenClaw Gateway 之间的所有接口。所有实现必须遵循此规范。

---

## Gateway WebSocket RPC 接口

Dashboard 通过 WebSocket JSON-RPC 2.0 与 Gateway 通信。

### 连接配置

```typescript
interface GatewayConfig {
  wsUrl: string;           // 默认：ws://localhost:18789
  timeout: number;         // 默认：30000ms
  reconnectDelay: number;  // 默认：5000ms
}
```

### 通用响应格式

```typescript
interface RpcResponse<T> {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
}
```

---

## 健康检查接口

### `health`

检查 Gateway 健康状态。

**请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "health",
  "params": {}
}
```

**响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "status": "ok" | "error",
    "version": "string",
    "uptime": number
  }
}
```

---

## 状态查询接口

### `status`

获取 Gateway 运行状态。

**请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "status",
  "params": {}
}
```

**响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "uptime": number,
    "memory": number,
    "agents": number,
    "sessions": number
  }
}
```

### `last-heartbeat`

获取心跳状态。

**请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "last-heartbeat",
  "params": {}
}
```

**响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "lastHeartbeat": "ISO8601 string",
    "heartbeats": number
  }
}
```

---

## 会话管理接口

### `sessions.list`

获取所有会话列表。

**请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 10,
  "method": "sessions.list",
  "params": {}
}
```

**响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 10,
  "result": {
    "sessions": [
      {
        "id": "string",
        "createdAt": "ISO8601 string",
        "updatedAt": "ISO8601 string"
      }
    ]
  }
}
```

### `sessions.preview`

获取会话预览。

**请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 11,
  "method": "sessions.preview",
  "params": {
    "sessionId": "string"
  }
}
```

**响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 11,
  "result": {
    "sessionId": "string",
    "messageCount": number,
    "messages": Array<any>
  }
}
```

### `sessions.delete`

删除会话。

**请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "sessions.delete",
  "params": {
    "sessionId": "string"
  }
}
```

**响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "result": {
    "ok": true
  }
}
```

### `sessions.compact`

压缩会话。

**请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 13,
  "method": "sessions.compact",
  "params": {
    "sessionId": "string"
  }
}
```

**响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 13,
  "result": {
    "ok": true,
    "compactedCount": number
  }
}
```

---

## 记忆系统接口

### `doctor.memory.status`

获取记忆系统状态。

**请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 20,
  "method": "doctor.memory.status",
  "params": {}
}
```

**响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 20,
  "result": {
    "enabled": boolean,
    "backend": "qmd" | "none",
    "embeddingModel": "string",
    "dimensions": number,
    "count": number,
    "indexSize": number
  }
}
```

---

## 代理与技能接口

### `agents.list`

获取代理列表。

**请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 30,
  "method": "agents.list",
  "params": {}
}
```

**响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 30,
  "result": {
    "agents": [
      {
        "id": "string",
        "model": "string",
        "workspaceDir": "string"
      }
    ]
  }
}
```

### `skills.status`

获取技能状态。

**请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 31,
  "method": "skills.status",
  "params": {}
}
```

**响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 31,
  "result": {
    "bins": ["string"],
    "installed": ["string"],
    "updated": "ISO8601 string"
  }
}
```

---

## REST API 接口（Dashboard 后端）

Dashboard 后端提供 REST API 供前端调用。

### GET /api/health

**响应：**
```typescript
{
  ok: boolean;
  data: {
    status: string;
    version: string;
  };
}
```

### GET /api/status

**响应：**
```typescript
{
  ok: boolean;
  data: {
    uptime: number;
    memory: number;
  };
}
```

### GET /api/sessions

**响应：**
```typescript
{
  ok: boolean;
  data: {
    sessions: Array<{
      id: string;
      createdAt: string;
    }>;
  };
}
```

### GET /api/sessions/:id/preview

**响应：**
```typescript
{
  ok: boolean;
  data: {
    messageCount: number;
    messages: Array<any>;
  };
}
```

### DELETE /api/sessions/:id

**响应：**
```typescript
{
  ok: boolean;
  data: Record<string, any>;
}
```

### POST /api/sessions/:id/compact

**响应：**
```typescript
{
  ok: boolean;
  data: {
    compactedCount: number;
  };
}
```

### GET /api/memory/status

**响应：**
```typescript
{
  ok: boolean;
  data: {
    enabled: boolean;
    backend: string;
    embeddingModel: string;
    dimensions: number;
    count: number;
  };
}
```

### GET /api/agents

**响应：**
```typescript
{
  ok: boolean;
  data: {
    agents: Array<{
      id: string;
      model: string;
      workspaceDir: string;
    }>;
  };
}
```

### GET /api/skills/status

**响应：**
```typescript
{
  ok: boolean;
  data: {
    bins: string[];
    installed: string[];
  };
}
```

### GET /api/heartbeat

**响应：**
```typescript
{
  ok: boolean;
  data: {
    lastHeartbeat: string;
    heartbeats: number;
  };
}
```

### GET /api/config-path

**响应：**
```typescript
{
  home: string;
  config: string;
  sessions: string;
  memories: string;
}
```

### GET /api/files?path=:path

**响应：**
```typescript
{
  path: string;
  items: Array<{
    name: string;
    path: string;
    isDirectory: boolean;
    size: number;
    modified: string;
  }>;
}
```

### GET /api/files/content?path=:path

**响应：**
```typescript
{
  path: string;
  content: string;
}
```

### POST /api/files/content

**请求：**
```typescript
{
  path: string;
  content: string;
}
```

**响应：**
```typescript
{
  ok: boolean;
  path: string;
}
```

### POST /api/files/create

创建文件或目录。

**请求：**
```typescript
{
  path: string;        // 要创建的文件/目录路径（相对于 FILE_ROOT）
  isDirectory: boolean; // true=创建目录，false=创建文件
}
```

**响应：**
```typescript
{
  ok: boolean;
  path: string;        // 创建后的完整路径
  relativePath: string; // 相对路径
}
```

### DELETE /api/files

删除文件或目录。

**请求：**
```typescript
{
  path: string;  // 要删除的文件/目录路径
  recursive?: boolean; // 是否递归删除目录，默认 false
}
```

**响应：**
```typescript
{
  ok: boolean;
  deletedPath: string;
}
```

### PUT /api/files/rename

重命名文件或目录。

**请求：**
```typescript
{
  oldPath: string;  // 原路径
  newPath: string;  // 新路径
}
```

**响应：**
```typescript
{
  ok: boolean;
  oldPath: string;
  newPath: string;
}
```

### PUT /api/files/move

移动文件或目录到另一个位置。

**请求：**
```typescript
{
  sourcePath: string;  // 源路径
  destPath: string;    // 目标路径
}
```

**响应：**
```typescript
{
  ok: boolean;
  sourcePath: string;
  destPath: string;
}
```

---

## 错误处理

### Gateway RPC 错误

```typescript
interface RpcError {
  code: number;
  message: string;
}

// 常见错误码
const GATEWAY_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
};
```

### REST API 错误

```typescript
interface ApiError {
  ok: false;
  error: string;
  status?: number;
}

// 常见状态码
const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};
```

---

## 测试驱动开发指南

### 1. 先定义接口类型

```typescript
// types/gateway.ts
export interface GatewayHealth {
  status: 'ok' | 'error';
  version: string;
  uptime: number;
}
```

### 2. 编写接口测试

```typescript
// tests/gateway-rpc.test.ts
describe('Gateway RPC', () => {
  it('health should return status', async () => {
    const result = await callGateway('health', {});
    expect(result).toHaveProperty('status');
    expect(result.status).toBe('ok');
  });
});
```

### 3. 实现接口调用

```typescript
// src-server/gateway-client.ts
export async function getHealth(): Promise<GatewayHealth> {
  return callGateway('health', {});
}
```

### 4. 编写单元测试

```typescript
// src-server/gateway-client.test.ts
describe('getHealth', () => {
  it('should return health status', async () => {
    // ...
  });
});
```

### 5. 集成测试

```typescript
// tests/integration.test.ts
describe('Integration', () => {
  it('should fetch health via REST API', async () => {
    const response = await axios.get('/api/health');
    expect(response.data.ok).toBe(true);
  });
});
```

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2026-03-11 | 初始版本 |
