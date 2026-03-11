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
