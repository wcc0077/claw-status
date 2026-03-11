# API 接口索引

> **本文件为 AI 提供接口概览和快速定位**
> **详细定义请查阅各子模块文件**

---

## 快速导航

### Gateway RPC 接口

| 接口 | 方法 | 状态 | 说明 |
|------|------|------|------|
| [health](gateway/health.md) | `health` | ✅ | 网关健康检查 |
| [status](gateway/status.md) | `status` | ✅ | 网关运行状态 |
| [last-heartbeat](gateway/status.md) | `last-heartbeat` | ✅ | 心跳状态 |
| [sessions.list](gateway/sessions.md) | `sessions.list` | ✅ | 会话列表 |
| [sessions.preview](gateway/sessions.md) | `sessions.preview` | ✅ | 会话预览 |
| [sessions.delete](gateway/sessions.md) | `sessions.delete` | ✅ | 删除会话 |
| [sessions.compact](gateway/sessions.md) | `sessions.compact` | ✅ | 压缩会话 |
| [doctor.memory.status](gateway/memory.md) | `doctor.memory.status` | ✅ | 记忆系统状态 |
| [agents.list](gateway/agents.md) | `agents.list` | ✅ | 代理列表 |
| [skills.status](gateway/skills.md) | `skills.status` | ✅ | 技能状态 |

### REST API 接口

| 端点 | 方法 | 状态 | 说明 |
|------|------|------|------|
| [/api/health](rest/endpoints/health.md) | GET | ✅ | 健康检查 |
| [/api/status](rest/endpoints/status.md) | GET | ✅ | 状态查询 |
| [/api/heartbeat](rest/endpoints/heartbeat.md) | GET | ✅ | 心跳状态 |
| [/api/sessions](rest/endpoints/sessions.md) | GET | ✅ | 会话列表 |
| [/api/sessions/:id/preview](rest/endpoints/sessions.md) | GET | ✅ | 会话预览 |
| [/api/sessions/:id](rest/endpoints/sessions.md) | DELETE | ✅ | 删除会话 |
| [/api/sessions/:id/compact](rest/endpoints/sessions.md) | POST | ✅ | 压缩会话 |
| [/api/memory/status](rest/endpoints/memory.md) | GET | ✅ | 记忆状态 |
| [/api/agents](rest/endpoints/agents.md) | GET | ✅ | 代理列表 |
| [/api/skills/status](rest/endpoints/skills.md) | GET | ✅ | 技能状态 |
| [/api/files](rest/endpoints/files.md) | GET | ✅ | 文件列表 |
| [/api/files/content](rest/endpoints/files.md) | GET/POST | ✅ | 文件内容 |
| [/api/config-path](rest/endpoints/config.md) | GET | ✅ | 配置路径 |

---

## 通用类型

详见 [shared/types.md](shared/types.md)

```typescript
// REST API 通用响应格式
interface ApiResponse<T> {
  ok: boolean;
  data: T;
  error?: string;
}

// Gateway RPC 通用响应格式
interface RpcResponse<T> {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: { code: number; message: string };
}
```

---

## 错误处理

详见 [shared/errors.md](shared/errors.md)

---

## 实现进度

详见 [progress.md](progress.md)

**状态标记：**
- ✅ 已实现
- 🔄 开发中
- 📋 待实现
- ❌ 已废弃

---

## 使用指南

### 查找特定接口

1. **通过导航表** - 根据端点/方法快速定位
2. **通过子索引** - `gateway/index.md`, `rest/index.md`

### 添加新接口

1. 在对应模块创建 `*.md` 文件
2. 更新本索引表的链接
3. 更新 `progress.md` 标记状态

### 接口变更流程

1. 修改接口定义（对应 .md 文件）
2. 更新 `progress.md` 中的状态
3. 提交代码和文档