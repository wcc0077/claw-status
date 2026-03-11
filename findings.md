# Findings: 网页版终端技术选型

## 技术栈

### 前端
| 依赖 | 用途 | 说明 |
|------|------|------|
| `@xterm/xterm` | 终端模拟器 | VS Code 同款，功能完整 |
| `@xterm/addon-fit` | 自适应尺寸 | 根据容器自动调整终端大小 |
| `@xterm/addon-web-links` | 链接识别 | 自动识别 URL |

### 后端
| 依赖 | 用途 | 说明 |
|------|------|------|
| `node-pty` | 伪终端 | 创建 /bin/bash 会话 |
| `ws` | WebSocket | 实时双向通信 |

---

## 架构设计

### 整体架构

```
┌─────────────────────────────────────┐
│  Browser (前端)                     │
│  ┌─────────────────────────────┐    │
│  │ xterm.js (终端模拟器)       │    │
│  └──────────────┬──────────────┘    │
│                 │ WebSocket         │
└─────────────────┼───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Linux Server (后端)                │
│  ┌─────────────────────────────┐    │
│  │ WebSocket Server            │    │
│  │ - 会话管理 (Map)            │    │
│  │ - 消息路由                  │    │
│  └──────────────┬──────────────┘    │
│                 │                   │
│  ┌──────────────▼──────────────┐    │
│  │ node-pty (伪终端)           │    │
│  │ - pty1: /bin/bash           │    │
│  │ - pty2: /bin/bash           │    │
│  │ - pty3: /bin/bash           │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### 数据流

```
用户输入 → xterm.js → WebSocket → node-pty → /bin/bash
                              ↓
/bash 输出 → node-pty → WebSocket → xterm.js → 显示
```

### WebSocket 消息格式

**客户端 → 服务端：**
```typescript
{
  type: 'input' | 'resize' | 'create' | 'close',
  sessionId?: string,
  data?: string,        // 输入字符
  cols?: number,        // 终端列数
  rows?: number         // 终端行数
}
```

**服务端 → 客户端：**
```typescript
{
  type: 'output' | 'created' | 'closed' | 'error',
  sessionId: string,
  data?: string         // 终端输出
}
```

---

## node-pty 使用说明

### 创建伪终端

```typescript
import * as pty from 'node-pty';

// 创建 bash 会话
const ptyProcess = pty.spawn('/bin/bash', [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: process.env.HOME,
  env: process.env as { [key: string]: string }
});

// 读取输出
ptyProcess.onData((data: string) => {
  console.log('Received:', data);
});

// 写入输入
ptyProcess.write('ls -la\r');

// 调整大小
ptyProcess.resize(100, 40);

// 结束会话
ptyProcess.kill();
```

---

## xterm.js 使用说明

### 基本用法

```typescript
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

// 创建终端
const term = new Terminal({
  cursorBlink: true,
  fontSize: 14,
  fontFamily: 'Consolas, "Courier New", monospace',
});

// 自适应尺寸
const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById('terminal'));
fitAddon.fit();

// 接收服务端数据
ws.onmessage = (event) => {
  term.write(event.data);
};

// 发送用户输入
term.onData((data: string) => {
  ws.send(data);
});

// 调整大小
term.onResize(({ cols, rows }) => {
  ws.send(JSON.stringify({ type: 'resize', cols, rows }));
});
```

---

## 多终端会话管理

### 会话结构

```typescript
interface TerminalSession {
  id: string;           // 唯一标识
  pty: any;             // node-pty 实例
  ws: WebSocket;        // 所属 WebSocket 连接
  createdAt: number;    // 创建时间
}
```

### 服务端会话管理

```typescript
const sessions = new Map<string, pty.IPty>();

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    const message = JSON.parse(msg);

    switch (message.type) {
      case 'create': {
        const id = uuid();
        const pty = pty.spawn('/bin/bash', [], {
          cols: message.cols || 80,
          rows: message.rows || 30,
        });
        sessions.set(id, pty);

        pty.onData((data) => {
          ws.send(JSON.stringify({ type: 'output', sessionId: id, data }));
        });

        ws.send(JSON.stringify({ type: 'created', sessionId: id }));
        break;
      }

      case 'input': {
        const pty = sessions.get(message.sessionId);
        pty?.write(message.data);
        break;
      }

      case 'close': {
        const pty = sessions.get(message.sessionId);
        pty?.kill();
        sessions.delete(message.sessionId);
        break;
      }
    }
  });
});
```

---

## 注意事项

1. **node-pty 需要编译原生模块**，在 Linux 上需要 `python` 和 `make`
2. **安全性**：需要认证机制，避免未授权访问
3. **资源管理**：设置会话超时，及时回收 pty 进程
4. **并发限制**：限制每个用户的最大终端数量
