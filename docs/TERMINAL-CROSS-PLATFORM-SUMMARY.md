# 跨平台终端部署方案 - 总结

## 核心方案

**一套代码，跨平台运行**：使用 `node-pty` 作为主要实现，自动降级到简单终端模拟器。

---

## 技术架构

### 后端跨平台支持

```
src-server/terminal/
├── pty-manager.ts      # 主管理器，自动检测 node-pty 可用性
├── simple-pty.ts       # 降级模式实现（简单终端）
├── websocket.ts        # WebSocket 服务器
└── types.ts            # TypeScript 类型定义
```

### 平台兼容逻辑

```typescript
// 1. 优先尝试加载 node-pty
import('node-pty').then(mod => {
  nodePty = mod;  // 加载成功
}).catch(err => {
  useFallback = true;  // 加载失败，使用降级模式
});

// 2. 平台检测
const isWindows = process.platform === 'win32';
const DEFAULT_SHELL = isWindows ? 'powershell.exe' : '/bin/bash';

// 3. 创建终端时选择合适的实现
if (nodePty) {
  // 使用 node-pty（完整功能）
} else {
  // 使用 simple-pty（基本功能）
}
```

---

## Windows 开发环境

### 安装步骤

```bash
# 1. 安装依赖
npm install

# node-pty 会自动尝试加载，失败则降级
```

### 功能支持

| 功能 | node-pty | 降级模式 |
|------|----------|----------|
| 基本命令 | ✅ | ✅ |
| 交互式命令 (vim, nano) | ✅ | ❌ |
| 实时输出 | ✅ | ⚠️ 有限 |
| 调整大小 | ✅ | ❌ |

### 测试步骤

```bash
# 1. 启动开发服务器
npm run dev

# 2. 访问终端页面
http://localhost:5173/terminal

# 3. 尝试执行命令
ls, dir, cd 等
```

---

## Linux 生产部署

### 前置要求

```bash
# 安装编译工具
sudo apt install python3 make g++  # Debian/Ubuntu
sudo yum install python3 make gcc-c++  # CentOS/RHEL
```

### 部署步骤

```bash
# 1. 安装依赖（会编译 node-pty 原生模块）
npm install

# 2. 构建生产版本
npm run build

# 3. 启动服务
npm start

# 或使用 PM2（推荐）
pm2 start ecosystem.config.js
```

### 环境变量

```bash
# .env
DASHBOARD_PORT=3000
FILE_ROOT=/home/user/openclaw
```

---

## 代码修改说明

### 1. pty-manager.ts

- 动态导入 `node-pty`
- 添加平台检测
- 添加降级模式支持
- 统一会话接口

### 2. simple-pty.ts (新增)

- 使用 `child_process.spawn` 实现简单终端
- 支持基本的 `onData` 和 `onExit` 事件
- 支持 `write` 和 `kill` 操作

### 3. websocket.ts

- 适配新的 `PTYSession` 接口
- 使用 `session.process` 统一访问

---

## 推荐方案

### 开发环境 (Windows)

1. **首选**: 安装 node-pty 预编译版本
   ```bash
   npm install node-pty-prebuilt-multiarch
   ```

2. **备选**: 使用降级模式（功能受限）

### 生产环境 (Linux)

1. 安装编译工具
2. 正常安装 `node-pty`
3. 使用 PM2 管理进程

---

## 故障排查

### node-pty 加载失败

**日志**: `[PtyManager] node-pty 加载失败，使用降级模式`

**解决**:
- Windows: `npm install node-pty-prebuilt-multiarch`
- Linux: `sudo apt install python3 make g++ && npm rebuild node-pty`

### 终端无法连接

**检查**:
1. WebSocket 路径：`/ws/terminal`
2. 端口是否正确
3. 防火墙设置

### 中文乱码

```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

---

## 总结

| 场景 | 方案 | 功能完整度 |
|------|------|------------|
| Windows 开发 | node-pty 预编译 | ✅ 完整 |
| Windows 开发 | 降级模式 | ⚠️ 基本 |
| Linux 生产 | node-pty 编译 | ✅ 完整 |

**核心优势**:
1. 一套代码，跨平台运行
2. 自动检测，优雅降级
3. 开发简单，部署灵活
