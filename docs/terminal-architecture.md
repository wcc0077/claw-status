# 终端功能架构设计

## 一、整体架构

```
┌─────────────────────────────────────────────────────────┐
│  Browser (前端 React + xterm.js)                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │  TerminalPage.tsx                               │    │
│  │  ┌─────────────────────────────────────────┐    │    │
│  │  │  TerminalTabs (标签页管理)              │    │    │
│  │  │  ┌───────────┬───────────┬───────────┐  │    │    │
│  │  │  │ Terminal  │ Terminal  │ Terminal  │  │    │    │
│  │  │  │ xterm.js  │ xterm.js  │ xterm.js  │  │    │    │
│  │  │  └───────────┴───────────┴───────────┘  │    │    │
│  │  └─────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────┘    │
│                     │ WebSocket                         │
└─────────────────────┼───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Linux Server (后端 Express + node-pty)                 │
│  ┌─────────────────────────────────────────────────┐    │
│  │  src-server/terminal/                           │    │
│  │  ├── websocket.ts    - WebSocket 服务器         │    │
│  │  ├── session.ts      - 会话管理                 │    │
│  │  └── pty-manager.ts  - pty 进程管理             │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  pty1 (bash)  pty2 (bash)  pty3 (bash)          │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 二、API 接口设计

### WebSocket 端点

```
ws://localhost:3000/ws/terminal
```

### 消息格式

#### 客户端 → 服务端

**1. 创建新终端**
```json
{
  "action": "create",
  "payload": {
    "cols": 80,
    "rows": 30,
    "cwd": "/home/user"
  }
}
```

**2. 输入数据**
```json
{
  "action": "write",
  "sessionId": "term-123",
  "payload": {
    "data": "ls -la\r"
  }
}
```

**3. 调整大小**
```json
{
  "action": "resize",
  "sessionId": "term-123",
  "payload": {
    "cols": 120,
    "rows": 40
  }
}
```

**4. 关闭终端**
```json
{
  "action": "close",
  "sessionId": "term-123"
}
```

#### 服务端 → 客户端

**1. 终端创建成功**
```json
{
  "type": "created",
  "sessionId": "term-123"
}
```

**2. 终端输出**
```json
{
  "type": "output",
  "sessionId": "term-123",
  "data": "total 0\r\ndrwxr-xr-x  2 user user  40 Jan 1 12:00 .\r\n"
}
```

**3. 终端关闭**
```json
{
  "type": "closed",
  "sessionId": "term-123"
}
```

**4. 错误**
```json
{
  "type": "error",
  "sessionId": "term-123",
  "message": "Failed to create pty"
}
```

---

## 三、后端设计

### 1. 文件结构

```
src-server/
├── index.ts                  # 主入口
└── terminal/
    ├── websocket.ts          # WebSocket 服务器
    ├── session.ts            # 终端会话管理
    └── pty-manager.ts        # pty 进程管理
```

### 2. 核心类设计

**PTyManager (pty-manager.ts)**
```typescript
interface PTYOptions {
  cols: number;
  rows: number;
  cwd?: string;
}

interface PTYSession {
  id: string;
  pty: IPty;
  createdAt: number;
  lastActivity: number;
}

class PtyManager {
  private sessions: Map<string, PTYSession>;

  create(options: PTYOptions): PTYSession;
  write(sessionId: string, data: string): void;
  resize(sessionId: string, cols: number, rows: number): void;
  close(sessionId: string): void;
  getSession(sessionId: string): PTYSession | undefined;
}
```

**WebSocket 处理器 (websocket.ts)**
```typescript
class TerminalWebSocket {
  private wss: WebSocket.Server;
  private ptyManager: PtyManager;

  // 处理 WebSocket 连接
  handleConnection(ws: WebSocket): void;

  // 处理消息
  handleMessage(ws: WebSocket, message: string): void;

  // 广播输出
  broadcastOutput(sessionId: string, data: string): void;
}
```

---

## 四、前端设计

### 1. 文件结构

```
client/src/
├── pages/
│   └── Terminal.tsx          # 终端页面
├── components/
│   ├── TerminalTabs.tsx      # 标签页管理
│   └── XtermContainer.tsx    # xterm.js 容器
├── lib/
│   └── terminal-ws.ts        # WebSocket 客户端
└── types/
    └── terminal.ts           # TypeScript 类型
```

### 2. 核心组件设计

**终端页面 (Terminal.tsx)**
```typescript
interface TerminalPageState {
  sessions: TerminalSession[];
  activeSessionId: string | null;
}

class TerminalPage {
  // 创建新终端
  createSession(): void;

  // 关闭终端
  closeSession(sessionId: string): void;

  // 切换活动终端
  setActiveSession(sessionId: string): void;
}
```

**xterm.js 容器 (XtermContainer.tsx)**
```typescript
interface XtermContainerProps {
  sessionId: string;
  isActive: boolean;
  onWrite: (data: string) => void;
  onResize: (cols: number, rows: number) => void;
}
```

**WebSocket 客户端 (terminal-ws.ts)**
```typescript
class TerminalWebSocketClient {
  private ws: WebSocket | null;
  private handlers: Map<string, (data: any) => void>;

  connect(): Promise<void>;
  create(cols: number, rows: number): Promise<string>;
  write(sessionId: string, data: string): void;
  resize(sessionId: string, cols: number, rows: number): void;
  close(sessionId: string): void;
  onOutput(sessionId: string, handler: (data: string) => void): void;
}
```

---

## 五、类型定义

### types/terminal.ts

```typescript
// WebSocket 消息
export type WSAction = 'create' | 'write' | 'resize' | 'close';
export type WSType = 'created' | 'output' | 'closed' | 'error';

export interface WSMessage {
  action?: WSAction;
  type?: WSType;
  sessionId?: string;
  payload?: {
    data?: string;
    cols?: number;
    rows?: number;
    cwd?: string;
  };
  message?: string;
}

// 终端会话
export interface TerminalSession {
  id: string;
  name: string;
  status: 'connecting' | 'connected' | 'closed' | 'error';
  createdAt: number;
}

// xterm.js 配置
export interface XtermOptions {
  fontSize: number;
  fontFamily: string;
  theme: 'dark' | 'light';
  cursorBlink: boolean;
}
```

---

## 六、依赖清单

### 后端 (package.json)
```json
{
  "dependencies": {
    "node-pty": "^1.0.0",
    "ws": "^8.16.0",
    "uuid": "^9.0.0"
  }
}
```

### 前端 (client/package.json)
```json
{
  "dependencies": {
    "@xterm/xterm": "^5.x",
    "@xterm/addon-fit": "^0.x",
    "uuid": "^9.0.0"
  }
}
```

---

## 七、实现清单

### 后端
- [ ] 安装依赖：`npm install node-pty uuid`
- [ ] 创建 `src-server/terminal/pty-manager.ts`
- [ ] 创建 `src-server/terminal/session.ts`
- [ ] 创建 `src-server/terminal/websocket.ts`
- [ ] 在 `index.ts` 中集成 WebSocket

### 前端
- [ ] 安装依赖：`npm install @xterm/xterm @xterm/addon-fit uuid`
- [ ] 创建 `client/src/types/terminal.ts`
- [ ] 创建 `client/src/lib/terminal-ws.ts`
- [ ] 创建 `client/src/components/XtermContainer.tsx`
- [ ] 创建 `client/src/components/TerminalTabs.tsx`
- [ ] 创建 `client/src/pages/Terminal.tsx`
- [ ] 在路由中添加 Terminal 页面
