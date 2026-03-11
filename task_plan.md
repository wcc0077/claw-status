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
├── cron/                   # ⭐ 定时任务目录
├── memory/                 # ⭐ 记忆目录 (单数)
├── subagents/              # ⭐ 子代理目录
├── workspace/              # 工作空间 (22 个子目录)
│
├── agents/                 # 代理目录
├── browser/                # 浏览器相关
├── completions/            # 完成记录
├── credentials/            # 凭据存储
├── delivery-queue/         # 交付队列
├── devices/                # 设备信息
├── experiences/            # 经验记录
├── extensions/             # 扩展插件
├── logs/                   # 日志目录
├── media/                  # 媒体文件
├── models/                 # 模型相关
├── skills/                 # 技能目录
└── feishu/                 # 飞书集成
```

**注意：** 未发现 `sessions/` 目录，会话数据可能存储在：
- `openclaw.json` 主配置中
- `workspace/` 目录下
- `agents/` 目录下
- Gateway 内存中（通过 `sessions.list` RPC 获取）

## 实施阶段

### 📋 Phase 1: 研究（进行中）

- [x] 分析现有 API 接口文档
- [x] 分析现有 Gateway 测试代码
- [x] 获取远程服务器文件结构
- [ ] 确认定时任务文件格式
- [ ] 确认记忆文件格式
- [ ] 确认子代理状态格式
- [ ] 确认会话数据存储位置

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
| 实时更新 | WebSocket vs  polling | 待决定 | WebSocket 实时，轮询简单 |
| 会话数据 | 文件 vs RPC | RPC 优先 | Gateway 可能内存存储 |

## 开放问题

1. 会话数据存储在哪里？（未发现 sessions/ 目录）
2. cron/ 目录下的文件格式是什么？
3. memory/ 目录下的文件如何组织？
4. subagents/ 目录的状态如何读取？

## 进度摘要

- **上次会话:** N/A
- **当前会话:** Phase 1 研究中 - 已获取文件结构
- **整体状态:** 等待 SSH 验证修复后继续研究

## 下一步行动

**阻塞：** SSH 主机密钥验证失败，需要：
```bash
ssh-keygen -R 43.163.246.185
```

然后运行：
```bash
ls -la ~/.openclaw/cron/
cat ~/.openclaw/cron/*.json 2>/dev/null || cat ~/.openclaw/cron/* 2>/dev/null

ls -la ~/.openclaw/memory/
cat ~/.openclaw/memory/*.json 2>/dev/null || head -50 ~/.openclaw/memory/*

ls -la ~/.openclaw/subagents/
cat ~/.openclaw/subagents/*.json 2>/dev/null
```
