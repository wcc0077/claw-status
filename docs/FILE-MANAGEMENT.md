# 文件管理指南

## 问题背景

使用 Claude Code 连续开发时，容易产生大量临时文件：
- `*-plan.md` - 实现计划
- `*-todo.md` - 任务清单
- `tasks/*.md` - 任务文件
- `*.tmp.md` - 临时笔记

如果不加管理，项目根目录会迅速膨胀，影响开发效率和 AI 上下文质量。

---

## 文件分类与存储

### 永久保留的文件

| 目录/文件 | 用途 | 清理时机 |
|-----------|------|----------|
| `CLAUDE.md` | 项目指南 | 从不清理 |
| `README.md` | 项目说明 | 从不清理 |
| `docs/` | 正式文档 | 从不清理 |
| `memory/` | 项目记忆 | 从不清理 |
| `API-INTERFACE.md` | 接口规范 | 从不清理 |
| `DEVELOPMENT-FLOW.md` | 开发流程 | 从不清理 |

### 临时文件（会话后清理）

| 模式 | 用途 | 清理时机 |
|------|------|----------|
| `*-plan.md` | 实现计划 | 实现完成后 |
| `*-todo.md` | 任务清单 | 会话结束后 |
| `tasks/*.md` | 任务文件 | 会话结束后 |
| `*.tmp.md` | 临时笔记 | 立即清理 |
| `TASKS.md`, `TODO.md` | 临时清单 | 会话结束后 |

---

## 目录结构

```
project-root/
├── CLAUDE.md                    # ✅ 永久
├── README.md                    # ✅ 永久
├── API-INTERFACE.md             # ✅ 永久
├── DEVELOPMENT-FLOW.md          # ✅ 永久
│
├── docs/                        # ✅ 永久（正式文档）
│   ├── plans/                   # 设计文档（按日期命名）
│   │   └── 2026-03-11-memory-feature-design.md
│   ├── decisions/               # ADR 架构决策记录
│   │   └── 001-database-selection.md
│   └── PARALLEL-DEVELOPMENT.md  # 并行开发示例
│
├── memory/                      # ✅ 永久（Claude 自动管理）
│   └── MEMORY.md
│
├── .archive/                    # 📦 归档目录（自动创建）
│   ├── 2026-03-11-14-30-45-current-plan.md
│   └── 2026-03-11-15-00-00-tasks-tasks/
│
└── scripts/
    └── cleanup-temp-files.js    # 归档脚本
```

**注意：** `.archive/` 目录用于存放临时文件归档，保持 `docs/` 目录干净。

---

## 清理流程

## 清理时机

### 什么时候算"会话结束"？

**会话 (Session)** = 你的一次 Claude Code 对话周期

```
会话开始 → 多次问答交互 → 会话结束
    ↑                        ↑
  打开终端              关闭终端/
  Claude Code          超时断开/
                       刷新页面
```

**重要：临时文件不会自动归档！**

Claude Code 无法自动执行归档命令，需要手动运行。

### 推荐的归档时机

| 场景 | 建议 |
|------|------|
| 每天工作结束 | 运行 `npm run archive` |
| 一个功能完成后 | 运行 `npm run archive` |
| 准备提交代码前 | 运行 `npm run archive` |
| 长时间离开前 | 运行 `npm run archive` |

### 检查有哪些临时文件

```bash
# 检查模式 - 只查看，不移动
npm run archive:check

# 示例输出：
# 🔍 检查模式 - 以下文件将被归档:
#    - current-plan.md → .archive/2026-03-11-14-30-45-current-plan.md
#    - tasks/ → .archive/2026-03-11-14-30-45-tasks-tasks
# 共 2 个文件/目录
```

### 会话结束前

1. **检查临时文件**
   ```bash
   # 检查模式 - 只查看，不移动
   npm run archive:check

   # 查看根目录的 MD 文件
   ls *.md
   ```

2. **迁移有价值的内容**
   - 设计思路 → `docs/plans/YYYY-MM-DD-<topic>-design.md`
   - 架构决策 → `docs/decisions/00N-<topic>.md`
   - 项目记忆 → 让 Claude 更新 `memory/MEMORY.md`

3. **运行归档命令**
   ```bash
   npm run archive
   ```

### 归档脚本行为

```bash
npm run archive
```

会归档：
- `tasks/` 目录整体 → `.archive/YYYY-MM-DD-HH-MM-SS-tasks-tasks/`
- 临时文件 → `.archive/YYYY-MM-DD-HH-MM-SS-文件名.md`

保留：
- `docs/`, `memory/`, `node_modules/`, `.git/`, `.claude/`, `client/`, `src-server/`, `tests/`, `scripts/` 目录
- `CLAUDE.md`, `README.md` 文件
- 匹配模式的文件：`*-plan.md`, `*-todo.md`, `*.tmp.md`, `*-task.md`

保留：
- `docs/`, `memory/`, `node_modules/`, `.git/`, `.claude/` 目录
- `CLAUDE.md`, `README.md` 文件

---

## 给 AI 的上下文优化

### 会话开始时

```
当前项目状态：
- 根目录干净，无临时文件
- 最新设计文档：docs/plans/2026-03-11-memory-feature-design.md
- 项目记忆：memory/MEMORY.md
```

### 会话进行中

创建临时文件记录思路：
```
tasks/current-task-plan.md  # 当前任务计划
```

### 会话结束前

1. 将临时文件中有价值的内容提取到正式文档
2. 运行清理命令
3. 确保根目录只保留永久文件

---

## 最佳实践

### ✅ 推荐

1. **临时文件用统一前缀**
   - `task-xxx.md` 或 `xxx-plan.md`
   - 便于识别和清理

2. **正式文档用日期前缀**
   - `docs/plans/2026-03-11-feature-name.md`
   - 便于按时间排序和查找

3. **会话结束前清理**
   - 像提交代码前运行测试一样自然
   - 保持项目干净整洁

### ❌ 避免

1. **在根目录创建临时文件**
   - 错误：`TODO.md`, `notes.md`
   - 正确：`tasks/todo.md`, `docs/notes.md`

2. **永久保留思考过程**
   - 错误：保留所有 `*-plan.md`
   - 正确：只保留最终设计文档

3. **过度组织**
   - 错误：创建 `docs/archive/old/backup/`
   - 正确：不需要的文件直接删除

---

## 自动化建议

### Git 集成（可选）

```gitignore
# .gitignore
tasks/
*-plan.md
*-todo.md
*.tmp.md
```

### 会话钩子（Claude Code hooks）

```json
// .claude/settings.json
{
  "hooks": {
    "beforeSessionEnd": "npm run cleanup"
  }
}
```

---

## 上下文质量

**干净的目录结构给 AI 的益处：**

1. **更快的文件定位**
   - 根目录只有核心文档
   - AI 不会被临时文件干扰

2. **更好的上下文理解**
   - `CLAUDE.md` 提供项目指南
   - `docs/` 提供详细设计
   - 临时文件不污染上下文

3. **一致的开发体验**
   - 每次会话都从干净的状态开始
   - 历史决策有据可查

---

## 检查清单

### 会话开始前
- [ ] 确认根目录干净（`ls *.md` 只有永久文件）
- [ ] 查看 `memory/MEMORY.md` 了解历史上下文

### 会话进行中
- [ ] 临时思路记录到 `tasks/current-plan.md`
- [ ] 重要决策记录到 `docs/decisions/`

### 会话结束前
- [ ] 将有价值的内容移至 `docs/` 或 `memory/`
- [ ] 运行 `npm run cleanup`
- [ ] 确认根目录只保留永久文件
