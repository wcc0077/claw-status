import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { ptyManager } from './pty-manager.js';
import type { WSMessage } from './types.js';

/**
 * 终端 WebSocket 服务器
 * 处理前端终端的 WebSocket 连接
 */
export class TerminalWebSocketServer {
  private wss: WebSocketServer;
  private sessionCounter = 0;

  constructor(server: Server) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws/terminal',
      // 允许所有来源（开发模式）
      verifyClient: (info, callback) => {
        // 允许来自 Vite 开发服务器和 localhost 的连接
        const origin = info.req.headers.origin || '';
        const allowed = origin.includes('localhost') || origin.includes('127.0.0.1') || !origin;
        callback(allowed);
      },
    });

    this.wss.on('connection', (ws) => this.handleConnection(ws));
    console.log('[TerminalWebSocket] WebSocket 服务器已启动，路径：/ws/terminal');
  }

  /**
   * 处理 WebSocket 连接
   */
  private handleConnection(ws: WebSocket): void {
    console.log('[TerminalWebSocket] 新的终端连接');

    ws.on('message', (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error: any) {
        this.sendError(ws, '无法解析消息', error.message);
      }
    });

    ws.on('close', () => {
      console.log('[TerminalWebSocket] 连接关闭');
    });

    ws.on('error', (error) => {
      console.error('[TerminalWebSocket] 错误:', error.message);
    });

    // 发送连接确认（使用 'connected' 类型，区别于会话创建）
    this.send(ws, { type: 'connected' });
  }

  /**
   * 处理 WebSocket 消息
   */
  private handleMessage(ws: WebSocket, message: WSMessage): void {
    console.log('[TerminalWebSocket] 收到消息:', message.action, message.sessionId);

    switch (message.action) {
      case 'create':
        this.handleCreate(ws, message.payload || {});
        break;

      case 'write':
        this.handleWrite(ws, message);
        break;

      case 'resize':
        this.handleResize(ws, message);
        break;

      case 'close':
        this.handleClose(ws, message);
        break;

      default:
        console.warn('[TerminalWebSocket] 未知消息类型:', message.action);
    }
  }

  /**
   * 创建新终端
   */
  private handleCreate(
    ws: WebSocket,
    payload: { cols?: number; rows?: number; cwd?: string; shell?: string }
  ): void {
    try {
      this.sessionCounter++;
      const session = ptyManager.create({
        cols: payload.cols || 80,
        rows: payload.rows || 30,
        cwd: payload.cwd,
        shell: payload.shell,
      });

      // 绑定输出事件（node-pty 使用 onData，simple-pty 也使用 onData）
      session.process.onData((data: string) => {
        this.sendOutput(ws, session.id, data);
      });

      // 绑定退出事件
      session.process.onExit(({ exitCode, signal }: { exitCode?: number; signal?: string }) => {
        console.log(`[TerminalWebSocket] 会话 ${session.id} 退出，code: ${exitCode}, signal: ${signal}`);
        this.send(ws, {
          type: 'closed',
          sessionId: session.id,
          message: exitCode !== undefined ? `进程退出，退出码：${exitCode}` : '进程已退出',
        });
      });

      console.log(`[TerminalWebSocket] 创建会话 ${session.id}`);

      this.send(ws, {
        type: 'created',
        sessionId: session.id,
      });
    } catch (error: any) {
      console.error('[TerminalWebSocket] 创建会话失败:', error.message);
      this.sendError(ws, '创建终端失败', error.message);
    }
  }

  /**
   * 处理输入
   */
  private handleWrite(ws: WebSocket, message: WSMessage): void {
    if (!message.sessionId || !message.payload?.data) {
      console.log('[TerminalWebSocket] write 消息缺少参数:', { sessionId: message.sessionId, hasData: !!message.payload?.data });
      this.sendError(ws, '缺少 sessionId 或 data');
      return;
    }

    console.log('[TerminalWebSocket] 写入数据到会话:', message.sessionId, '数据:', message.payload.data);
    const success = ptyManager.write(message.sessionId, message.payload.data);
    if (!success) {
      console.log('[TerminalWebSocket] 写入失败：会话不存在或已关闭');
      this.sendError(ws, '写入失败', '会话不存在或已关闭');
    }
  }

  /**
   * 处理调整大小
   */
  private handleResize(ws: WebSocket, message: WSMessage): void {
    if (!message.sessionId || !message.payload?.cols || !message.payload?.rows) {
      this.sendError(ws, '缺少 sessionId、cols 或 rows');
      return;
    }

    const success = ptyManager.resize(
      message.sessionId,
      message.payload.cols,
      message.payload.rows
    );
    if (!success) {
      this.sendError(ws, '调整大小失败', '会话不存在或调整失败');
    }
  }

  /**
   * 处理关闭
   */
  private handleClose(ws: WebSocket, message: WSMessage): void {
    if (!message.sessionId) {
      this.sendError(ws, '缺少 sessionId');
      return;
    }

    const success = ptyManager.close(message.sessionId);
    if (!success) {
      this.sendError(ws, '关闭失败', '会话不存在');
    }
  }

  /**
   * 发送输出数据
   */
  private sendOutput(ws: WebSocket, sessionId: string, data: string): void {
    this.send(ws, {
      type: 'output',
      sessionId,
      payload: { data },
    });
  }

  /**
   * 发送消息
   */
  private send(ws: WebSocket, message: WSMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * 发送错误
   */
  private sendError(ws: WebSocket, message: string, details?: string): void {
    this.send(ws, {
      type: 'error',
      sessionId: 'unknown',
      message,
      payload: details ? { data: details } : undefined,
    });
  }

  /**
   * 关闭服务器
   */
  close(): void {
    console.log('[TerminalWebSocket] 关闭 WebSocket 服务器');
    ptyManager.closeAll();
    this.wss.close();
  }
}
