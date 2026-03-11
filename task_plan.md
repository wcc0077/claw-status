# Task Plan - OpenClaw 状态看板

## 目标

构建一个完整的状态看板，展示 OpenClaw 实例的核心数据：
1. **Session（会话）** - 展示所有会话列表、预览、管理功能
2. **Memory（记忆）** - 展示记忆系统状态、记忆内容
3. **Scheduled Tasks（定时任务）** - 展示和管理定时任务
4. **SubAgents（子代理）** - 展示子代理状态
5. **文件监控** - 实时监控文件变化，自动更新看板

## 文件结构发现（实际）

```
~/.openclaw/
├── openclaw.json           # 主配置文件
├── exec-approvals.json     # 执行批准记录
├── clawpanel.json          # ClawPanel 配置
│
├── cron/                   # ⭐ 定时任务目录 (jobs.json)
├── memory/                 # ⭐ 记忆目录 (main.sqlite + Markdown 文件)
├── subagents/              # ⭐ 子代理目录 (runs.json)
├── agents/main/sessions/   # ⭐ 会话目录 (sessions.json + *.jsonl)
└── workspace/              # 工作空间 (22 个子目录)
    ├── HEARTBEAT.md        # 心跳检查清单
    ├── MEMORY.md           # 核心记忆文档
    ├── memory/             # 记忆 Markdown 文件
    └── todo/               # 待办事项
```

**已确认的数据存储:**
| 模块 | 文件/目录 | 格式 | 详细说明 |
|------|----------|------|----------|
| 定时任务 | `cron/jobs.json` | JSON | 空数组表示无任务 |
| 记忆系统 | `memory/main.sqlite` | SQLite | 含向量嵌入、全文搜索 |
| 记忆文件 | `workspace/MEMORY.md` | Markdown | 核心原则、项目记录 |
| 记忆文件 | `workspace/memory/*.md` | Markdown | 自动记忆文件 |
| 子代理 | `subagents/runs.json` | JSON | 运行状态 |
| 会话 | `agents/main/sessions/` | JSON + JSONL | sessions.json 索引 + jsonl 对话记录 |
| 待办事项 | `workspace/todo/YYYY-MM-DD.md` | Markdown | 每日待办清单 |

## 实施阶段

### 📋 Phase 1: 研究（✅ 已完成）

- [x] 分析现有 API 接口文档
- [x] 分析现有 Gateway 测试代码
- [x] 获取本地文件结构
- [x] 确认定时任务文件格式 (`cron/jobs.json`)
- [x] 确认记忆文件格式 (`memory/main.sqlite` - SQLite)
- [x] 确认子代理状态格式 (`subagents/runs.json`)
- [x] 确认会话数据存储位置 (`agents/main/sessions/`)

**研究结果:** 详见 [findings.md](findings.md)

### 📋 Phase 2: 后端实现

- [ ] 新增 `/api/cron` - 获取定时任务列表
- [ ] 新增 `/api/memory/details` - 获取记忆详情
- [ ] 新增 `/api/subagents` - 获取子代理状态
- [ ] 新增 `/api/workspace` - 获取工作空间状态
- [ ] 实现文件监控服务（chokidar）
- [ ] 实现 WebSocket 推送文件变化通知

### 📋 Phase 3: 前端实现

- [ ] 创建 Dashboard 首页（概览）
- [ ] 创建 Cron 页面（定时任务）
- [ ] 创建 Memory 页面（记忆）
- [ ] 创建 SubAgents 页面（子代理）
- [ ] 创建 Files 页面（文件浏览，已有）
- [ ] 实现文件变化监听 UI 反馈

### 📋 Phase 4: 验证与优化

- [ ] 端到端测试
- [ ] 性能优化
- [ ] 错误处理完善

## 关键决策

| 决策 | 选项 | 已选择 | 理由 |
|------|------|--------|------|
| 文件监控 | fs.watch vs chokidar | chokidar | 跨平台、稳定、递归监听 |
| 实时更新 | WebSocket vs polling | WebSocket | 与 Gateway 共用连接，实时性好 |
| 会话数据 | 文件 vs RPC | 文件读取 | 数据在 `agents/main/sessions/` 目录 |
| 记忆数据 | 直接读文件 vs SQLite 查询 | SQLite 查询 | 需要查询 meta、files 表获取结构化数据 |

## 开放问题（已解决）

1. ✅ 会话数据存储位置：`~/.openclaw/agents/main/sessions/sessions.json` + `.jsonl` 文件
2. ✅ cron/ 目录下的文件格式：`jobs.json` - JSON 格式
3. ✅ memory/ 目录下的文件组织：`main.sqlite` - SQLite 数据库
4. ✅ subagents/ 目录的状态读取：`runs.json` - JSON 格式

## 进度摘要

- **上次会话:** N/A
- **当前会话:** Phase 1 已完成 - 所有数据结构已确认
- **整体状态:** 准备开始 Phase 2 后端实现

## 下一步行动

Phase 1 研究已完成，所有数据结构已确认。现在可以开始后端实现：

**Phase 2: 后端 API 实现**

需要实现以下 API 端点：

```bash
# 1. 会话列表
GET /api/sessions
# 读取 ~/.openclaw/agents/main/sessions/sessions.json
# 返回：sessionId, updatedAt, chatType, deliveryContext, channel 等

# 2. 会话详情
GET /api/sessions/:id
# 读取对应的 .jsonl 文件
# 返回：会话消息列表（支持分页）

# 3. 会话统计
GET /api/sessions/stats
# 统计会话数量、按渠道分类、按时间排序

# 4. 记忆状态
GET /api/memory/status
# 查询 SQLite: SELECT * FROM meta
# 返回：模型信息、配置参数（chunkTokens, vectorDims 等）

# 5. 记忆文件列表
GET /api/memory/files
# 查询 SQLite: SELECT path, mtime, size FROM files
# 返回：文件列表（带时间戳、大小）

# 6. 记忆内容
GET /api/memory/content/:path
# 读取 Markdown 文件内容
# 返回：文件原始内容

# 7. 定时任务列表
GET /api/cron
# 读取 ~/.openclaw/cron/jobs.json
# 返回：任务列表

# 8. 定时任务运行历史
GET /api/cron/:id/runs
# 读取 ~/.openclaw/cron/runs/<jobId>.jsonl
# 返回：运行历史记录

# 9. 子代理状态
GET /api/subagents
# 读取 ~/.openclaw/subagents/runs.json
# 返回：运行状态

# 10. HEARTBEAT.md 内容
GET /api/heartbeat/config
# 读取 ~/.openclaw/workspace/HEARTBEAT.md
# 返回：心跳检查清单内容

# 11. 待办事项
GET /api/todos/today
# 读取 ~/.openclaw/workspace/todo/YYYY-MM-DD.md
# 返回：今日待办清单
```

### 深入研究补充（2026-03-11）

根据官方文档和文件内容的深入研究：

**Heartbeat 系统:**
- 周期性运行（默认 30 分钟）
- 读取 `HEARTBEAT.md` 作为检查清单
- 回复 `HEARTBEAT_OK` 表示无需要关注的事项
- 支持活跃时间设置（activeHours）

**Cron 系统:**
- 支持三种调度类型：at（一次性）、every（周期性）、cron（ cron 表达式）
- 支持两种执行模式：main（主会话）、isolated（隔离会话）
- 运行历史存储在 `cron/runs/<jobId>.jsonl`
- 支持模型覆盖、思考级别控制

**记忆系统:**
- 双存储模式：SQLite（向量化）+ Markdown 文件（人类可读）
- 使用本地 embedding 模型（embeddinggemma-300M）
- 支持全文搜索和向量搜索

**待办系统:**
- 每日待办文件：`todo/YYYY-MM-DD.md`
- 与 HEARTBEAT.md 集成，心跳时自动检查
