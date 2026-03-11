# Findings - OpenClaw 文件结构（实际）

## 实际文件结构 (~/.openclaw/)

```
~/.openclaw/
├── openclaw.json           # 主配置文件（8.5KB）
├── openclaw.json.bak*      # 多个备份文件
├── exec-approvals.json     # 执行批准记录
├── update-check.json       # 更新检查状态
├── clawpanel.json          # ClawPanel 配置
├── clawpanel-device-key.json  # 设备密钥
│
├── agents/                 # 代理目录
├── browser/                # 浏览器相关
├── canvas/                 # 画布功能
├── clawpanel/              # ClawPanel 数据
├── completions/            # 完成记录
├── credentials/            # 凭据存储 (权限 700)
├── cron/                   # ⭐ 定时任务目录
├── delivery-queue/         # 交付队列
├── devices/                # 设备信息
├── experiences/            # 经验记录
├── extensions/             # 扩展插件
├── feishu/                 # 飞书集成
├── identity/               # 身份认证
├── logs/                   # 日志目录 (权限 700)
├── media/                  # 媒体文件
├── memory/                 # ⭐ 记忆目录
├── models/                 # 模型相关
├── skills/                 # 技能目录
├── subagents/              # ⭐ 子代理目录
└── workspace/              # 工作空间 (22 个子目录)
```

## 关键目录详情

### 1. 定时任务 (cron/)
- 路径：`~/.openclaw/cron/`
- 权限：普通目录
- 需要查看内部文件结构

### 2. 记忆 (memory/)
- 路径：`~/.openclaw/memory/`
- 注意：是单数 `memory` 不是 `memories`
- 需要查看内部文件结构

### 3. 子代理 (subagents/)
- 路径：`~/.openclaw/subagents/`
- 权限：普通目录
- 需要查看内部文件结构

### 4. 会话 (sessions?)
- ⚠️ 未发现 `sessions/` 目录
- 会话数据可能存储在：
  - `openclaw.json` 主配置中
  - `workspace/` 目录下
  - `agents/` 目录下

## 需要进一步调查

1. **cron/ 目录内容** - 定时任务配置和状态
2. **memory/ 目录内容** - 记忆数据存储
3. **subagents/ 目录内容** - 子代理状态
4. **workspace/ 目录结构** - 22 个子目录
5. **openclaw.json** - 主配置文件格式

## 下一步命令

```bash
# 查看 cron 目录
ls -la ~/.openclaw/cron/

# 查看 memory 目录
ls -la ~/.openclaw/memory/

# 查看 subagents 目录
ls -la ~/.openclaw/subagents/

# 查看 workspace 目录结构
ls -la ~/.openclaw/workspace/

# 查看主配置文件
cat ~/.openclaw/openclaw.json
```

---

# Findings - 详细数据结构（2026-03-11）

## 1. 定时任务 (cron/jobs.json)

**文件路径:** `~/.openclaw/cron/jobs.json`

**数据结构:**
```json
{
  "version": 1,
  "jobs": []
}
```

**说明:**
- 当前没有定时任务（空数组）
- 有备份文件 `jobs.json.bak`

## 2. 子代理 (subagents/runs.json)

**文件路径:** `~/.openclaw/subagents/runs.json`

**数据结构:**
```json
{
  "version": 2,
  "runs": {}
}
```

**说明:**
- 当前没有运行的子代理
- `runs` 对象用于存储子代理运行状态

## 3. 记忆系统 (memory/main.sqlite)

**文件路径:** `~/.openclaw/memory/main.sqlite`

**类型:** SQLite 数据库 (5.2MB)

**数据库表结构:**
| 表名 | 用途 |
|------|------|
| `meta` | 元数据（索引配置、模型信息） |
| `files` | 文件列表（路径、哈希、时间戳） |
| `chunks` | 文本块数据 |
| `chunks_fts*` | 全文搜索索引 |
| `chunks_vec*` | 向量嵌入 |
| `embedding_cache` | 嵌入缓存 |

**meta 表内容示例:**
```
memory_index_meta_v1 | {"model":"/root/.openclaw/models/embeddinggemma-300M-Q8_0.gguf",
                       "provider":"local",
                       "chunkTokens":400,
                       "chunkOverlap":80,
                       "vectorDims":768}
```

**files 表内容示例:**
```
memory/github-trending.md | memory | 58a999a2... | 1772697601788.98 | 2266
memory/2026-03-01.md | memory | 454cf2af... | 1772340883279.24 | 2341
MEMORY.md | memory | 5d4348ff... | 1772601459348.77 | 8839
```

**说明:**
- 使用本地 embedding 模型 (embeddinggemma-300M)
- 768 维向量嵌入
- 每块 400 tokens，重叠 80 tokens
- 支持全文搜索和向量搜索

## 4. 工作空间 (workspace/)

**路径:** `~/.openclaw/workspace/`

**子目录结构:**
```
workspace/
├── AGENTS.md              # Agents 规范
├── backup-daily.sh        # 每日备份脚本
├── backup.log             # 备份日志
├── BOOTSTRAP.md           # 启动指南
├── .clawhub/              # ClawHub 配置
├── downloads/             # 下载文件
├── drafts/                # 草稿
├── generated-images/      # 生成的图片
├── .git/                  # Git 仓库
├── health-agent/          # 健康代理
├── HEARTBEAT.md           # 心跳文档
├── IDENTITY.md            # 身份文档
├── knowledge-base/        # 知识库
├── memory/                # 工作空间记忆
├── MEMORY.md              # 记忆文档
├── n8n/                   # N8N 工作流
├── .openclaw/             # 嵌套的.openclaw
├── opennest/              # OpenNest 项目
├── output/                # 输出文件
├── research/              # 研究
├── scripts/               # 脚本
├── skills/                # 技能
├── SOUL.md                # 灵魂文档
├── test-infra/            # 测试基础设施
├── todo/                  # 待办
├── TOOLS.md               # 工具文档
├── USER.md                # 用户文档
├── vibe-coding/           # Vibe 编程
├── wisdom-core/           # 智慧核心
└── xiaohongshu/           # 小红书项目
```

## 5. 主配置 (openclaw.json)

**文件路径:** `~/.openclaw/openclaw.json`

**主要配置项:**
- `meta` - 元数据（最后接触版本/时间）
- `wizard` - 向导配置
- `browser` - 浏览器配置（CDP URL、配置文件）
- `models` - 模型配置（提供商、API 密钥）

**模型提供商:**
- 通义千问 (qwen3.5-plus, qwen3-max, qwen3-coder-next, qwen3-coder-plus)
- MiniMax-M2.5

**浏览器配置:**
- 默认配置文件：`openclaw`
- 自定义配置文件：`xiaohongshu` (CDP: http://127.0.0.1:18888)

## 6. 会话数据 (sessions) - 📁 已确认文件存储

**文件路径:** `~/.openclaw/agents/main/sessions/`

**目录结构:**
```
~/.openclaw/agents/main/sessions/
├── sessions.json              # 会话元数据索引
├── agent/                     # 子代理会话
├── {sessionId}.jsonl          # 会话对话记录（JSONL 格式）
├── {sessionId}.jsonl.deleted  # 已删除的会话
└── {sessionId}.jsonl.reset    # 重置的会话
```

### sessions.json - 会话元数据

**结构:**
```json
{
  "agent:main:main": {
    "sessionId": "c7416684-fcd0-4918-b3d7-05a1c091a8df",
    "updatedAt": 1773223157825,           // 最后更新时间（毫秒时间戳）
    "systemSent": true,
    "abortedLastRun": false,
    "chatType": "direct",                  // direct | group
    "deliveryContext": {
      "channel": "webchat",                // webchat | feishu | wecom
      "to": "heartbeat"
    },
    "origin": { ... },                     // 来源信息
    "sessionFile": "/root/.openclaw/agents/main/sessions/{sessionId}.jsonl",
    "compactionCount": 0,
    "skillsSnapshot": { ... }              // 技能快照
  }
}
```

### 会话类型（按渠道）

| 渠道 | 示例键名 | chatType | deliveryContext |
|------|---------|----------|-----------------|
| WebChat | `agent:main:main` | direct | `{channel: "webchat"}` |
| 飞书私聊 | `agent:main:feishu:direct:ou_xxx` | direct | `{channel: "feishu", to: "user:ou_xxx"}` |
| 飞书群聊 | `agent:main:feishu:group:xxx` | group | `{channel: "feishu"}` |
| 企微私聊 | `agent:main:wecom:direct:xxx` | direct | `{channel: "wecom", to: "wecom-agent:xxx"}` |
| 企微群聊 | `agent:main:wecom:group:xxx` | group | `{channel: "wecom"}` |

### .jsonl 会话文件

**格式:** JSON Lines（每行一个 JSON 对象）

**事件类型:**
| type | 说明 |
|------|------|
| `session` | 会话开始（包含 id、timestamp、cwd） |
| `model_change` | 模型切换 |
| `thinking_level_change` | 思考级别变化 |
| `custom` | 自定义事件（如 model-snapshot） |
| `message` | 用户/助手消息 |
| `tool_use` | 工具使用 |
| `tool_result` | 工具结果 |

**示例:**
```json
{"type":"session","version":3,"id":"c7416684-fcd0-4918-b3d7-05a1c091a8df","timestamp":"2026-03-10T21:40:08.608Z","cwd":"/root/.openclaw/workspace"}
{"type":"model_change","id":"0a222398","parentId":null,"timestamp":"2026-03-10T21:40:08.616Z","provider":"bailian","modelId":"qwen3.5-plus"}
{"type":"message","id":"470d79f6","parentId":"...","timestamp":"...", "message":{"role":"user","content":[{"type":"text","text":"Hello"}]}}
```

### 当前活动会话

```
1. agent:main:main              -> webchat (heartbeat)
2. agent:main:feishu:direct:*   -> 飞书私聊
3. agent:main:wecom:direct:*    -> 企微私聊
4. agent:main:wecom:group:*     -> 企微群聊
```

**结论:** 会话数据存储在文件系统中，可以通过直接读取 `sessions.json` 和 `.jsonl` 文件获取。

---

## 7. 记忆系统 (memory) - 📁 详细研究

### 文件存储

**路径:** `~/.openclaw/memory/`

**内容:**
- `main.sqlite` - SQLite 数据库 (5.2MB)
- 记忆 Markdown 文件存储在 `~/.openclaw/workspace/MEMORY.md` 和 `~/.openclaw/workspace/memory/` 目录

### SQLite 数据库结构

**表结构:**
```sql
-- 元数据表
CREATE TABLE meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 文件索引表
CREATE TABLE files (
  path TEXT PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'memory',
  hash TEXT NOT NULL,
  mtime INTEGER NOT NULL,
  size INTEGER NOT NULL
);

-- 文本块表
CREATE TABLE chunks (...);
CREATE TABLE chunks_fts (...) -- 全文搜索
CREATE TABLE chunks_vec (...) -- 向量嵌入
```

**meta 表内容:**
```
key: memory_index_meta_v1
value: {
  "model": "/root/.openclaw/models/embeddinggemma-300M-Q8_0.gguf",
  "provider": "local",
  "chunkTokens": 400,
  "chunkOverlap": 80,
  "vectorDims": 768
}
```

**files 表示例:**
| path | mtime | size |
|------|-------|------|
| memory/github-trending.md | 1772697601788 | 2266 |
| MEMORY.md | 1772601459348 | 8839 |
| memory/2026-03-03.md | 1772551182337 | 3309 |

### MEMORY.md 文件内容

**路径:** `~/.openclaw/workspace/MEMORY.md`

**内容类型:**
- 核心原则（价值观、逆向思维、思考方式）
- 项目记录（OpenNest、价值闭环探索）
- Agent 互联网愿景
- 待办事项

**示例内容:**
```markdown
# 核心原则

## 价值观
> 互利：所有参与者都能获益
> 共赢：不是零和博弈，一起做大蛋糕

## 逆向思维
> 从终点倒推起点
```

### 记忆系统特点

1. **双存储模式:**
   - SQLite 数据库：存储向量化记忆、全文索引
   - Markdown 文件：人类可读的记忆内容

2. **本地 Embedding:**
   - 使用 `embeddinggemma-300M-Q8_0.gguf` 模型
   - 768 维向量嵌入
   - 支持本地语义搜索

3. **记忆分类:**
   - `memory/` 目录：自动记忆
   - `MEMORY.md`：核心原则和项目记录

---

## 8. 定时任务系统 (cron) - 📁 详细研究

### 文件存储

**路径:** `~/.openclaw/cron/`

**内容:**
- `jobs.json` - 定时任务配置
- `jobs.json.bak` - 备份文件
- `runs/<jobId>.jsonl` - 运行历史记录（JSONL 格式）

### jobs.json 结构

```json
{
  "version": 1,
  "jobs": []
}
```

**当前状态:** 没有已配置的定时任务

### 定时任务类型

根据官方文档，定时任务支持三种调度类型：

| 类型 | schedule.kind | 说明 |
|------|--------------|------|
| 一次性 | `at` | 指定时间运行一次 |
| 周期性 | `every` | 固定间隔运行 |
| Cron 表达式 | `cron` | 5 字段 cron 表达式 |

### 执行模式

| 模式 | sessionTarget | 用途 |
|------|--------------|------|
| 主会话 | `main` | 在心跳运行时一起执行 |
| 隔离会话 | `isolated` | 独立的 cron 会话 |

### 与 HEARTBEAT.md 的关系

**HEARTBEAT.md** 是心跳任务的检查清单：

**路径:** `~/.openclaw/workspace/HEARTBEAT.md`

**内容示例:**
```markdown
# HEARTBEAT.md

## 每日检查任务

### 第零优先级：每日待办
1. 检查今日待办 - 读取 `todo/YYYY-MM-DD.md`
2. 汇报进展 - 告诉老大今天完成了哪些待办
3. 未完成提醒 - 如果有未完成的重要事项，提醒老大

## 第一优先级：OpenNest（开放巢）
- 查看 `opennest/` 目录状态
- 继续完成待办事项
```

### Cron vs Heartbeat

| 特性 | Heartbeat | Cron |
|------|-----------|------|
| 执行时机 | 周期性（默认 30 分钟） | 精确时间（cron 表达式） |
| 执行环境 | 主会话 | 主会话或隔离会话 |
| 用途 | 批量检查多个任务 | 精确调度的独立任务 |
| 上下文 | 共享主会话上下文 | 隔离会话无上下文 |
| 模型 | 主会话模型 | 可自定义模型 |

### 待办事项目录

**路径:** `~/.openclaw/workspace/todo/`

**文件:**
- `README.md` - 待办目录说明
- `YYYY-MM-DD.md` - 每日待办清单

---

## 9. 官方文档参考

### Heartbeat 文档

**关键概念:**
- Heartbeat 是周期性运行的代理回合（默认 30 分钟）
- 用于检查需要关注的事项，不打扰用户
- 通过 `HEARTBEAT.md` 文件定义检查清单
- 回复 `HEARTBEAT_OK` 表示无需要关注的事项

### Cron 文档

**关键概念:**
- Cron 是 Gateway 内置的调度器
- 任务持久化在 `~/.openclaw/cron/jobs.json`
- 支持一次性任务和周期性任务
- 运行历史存储在 `cron/runs/<jobId>.jsonl`

### Cron vs Heartbeat 决策指南

| 用例 | 推荐 | 原因 |
|------|------|------|
| 每 30 分钟检查收件箱 | Heartbeat | 批量检查，上下文感知 |
| 每天 9 点发送日报 | Cron (隔离) | 需要精确时间 |
| 监控日历事件 | Heartbeat | 周期性检查自然匹配 |
| 每周深度分析 | Cron (隔离) | 独立任务，可用不同模型 |
| 20 分钟后提醒 | Cron (main, --at) | 一次性精确时间 |
