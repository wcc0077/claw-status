import type { TerminalSession, WSMessage } from '../types/terminal';

/**
 * 终端 WebSocket 客户端
 * 管理与后端的 WebSocket 连接和终端会话
 */
export class TerminalWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private sessionCounter = 0;

  // 事件处理器
  private onOutputHandlers: Map<string, (data: string) => void> = new Map();
  private onStatusChangeHandlers: Map<string, (status: TerminalSession['status']) => void> = new Map();
  private onSessionCreatedHandlers: ((sessionId: string) => void)[] = [];
  private onSessionClosedHandlers: ((sessionId: string) => void)[] = [];
  private onErrorHandlers: ((message: string) => void)[] = [];
  private onConnectionChangeHandlers: ((connected: boolean) => void)[] = [];

  constructor(url?: string) {
    // 开发模式直接连接后端端口（绕过 Vite 代理），生产模式使用当前 host
    const isDev = import.meta.env.DEV;
    if (url) {
      this.url = url;
    } else if (isDev) {
      // 开发模式：直接连接到后端服务器
      this.url = 'ws://localhost:3000/ws/terminal';
    } else {
      // 生产模式：使用当前 host
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.url = `${protocol}//${window.location.host}/ws/terminal`;
    }
  }

  /**
   * 连接 WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.notifyConnectionChange(true);
          resolve();
        };

        this.ws.onclose = () => {
          this.notifyConnectionChange(false);
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          this.notifyError('WebSocket 连接错误');
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: WSMessage): void {
    switch (message.type) {
      case 'connected':
        // 连接确认信号，不需要处理
        break;

      case 'created':
        this.sessionCounter++;
        this.notifySessionCreated(message.sessionId || 'unknown');
        break;

      case 'output':
        if (message.sessionId) {
          this.notifyOutput(message.sessionId, message.payload?.data || '');
        }
        break;

      case 'closed':
        if (message.sessionId) {
          this.notifySessionClosed(message.sessionId);
        }
        break;

      case 'error':
        this.notifyError(message.message || '未知错误');
        break;
    }
  }

  /**
   * 创建新终端
   */
  create(cols: number, rows: number): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket 未连接'));
        return;
      }

      const handler = (sessionId: string) => {
        this.removeSessionCreatedHandler(handler);
        resolve(sessionId);
      };

      this.onSessionCreatedHandlers.push(handler);

      const message: WSMessage = {
        action: 'create',
        payload: { cols, rows },
      };

      this.ws.send(JSON.stringify(message));
    });
  }

  /**
   * 向终端写入数据
   */
  write(sessionId: string, data: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[TerminalWebSocket] 无法发送数据：未连接');
      return;
    }

    const message: WSMessage = {
      action: 'write',
      sessionId,
      payload: { data },
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * 调整终端大小
   */
  resize(sessionId: string, cols: number, rows: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: WSMessage = {
      action: 'resize',
      sessionId,
      payload: { cols, rows },
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * 关闭终端
   */
  close(sessionId: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: WSMessage = {
      action: 'close',
      sessionId,
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 尝试重新连接
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
    } else {
      this.notifyError('无法连接到终端服务器');
    }
  }

  // ============ 事件订阅方法 ============

  onOutput(sessionId: string, handler: (data: string) => void): () => void {
    this.onOutputHandlers.set(sessionId, handler);
    return () => this.onOutputHandlers.delete(sessionId);
  }

  onStatusChange(sessionId: string, handler: (status: TerminalSession['status']) => void): () => void {
    this.onStatusChangeHandlers.set(sessionId, handler);
    return () => this.onStatusChangeHandlers.delete(sessionId);
  }

  onSessionCreated(handler: (sessionId: string) => void): () => void {
    this.onSessionCreatedHandlers.push(handler);
    return () => {
      const index = this.onSessionCreatedHandlers.indexOf(handler);
      if (index > -1) this.onSessionCreatedHandlers.splice(index, 1);
    };
  }

  onSessionClosed(handler: (sessionId: string) => void): () => void {
    this.onSessionClosedHandlers.push(handler);
    return () => {
      const index = this.onSessionClosedHandlers.indexOf(handler);
      if (index > -1) this.onSessionClosedHandlers.splice(index, 1);
    };
  }

  onError(handler: (message: string) => void): () => void {
    this.onErrorHandlers.push(handler);
    return () => {
      const index = this.onErrorHandlers.indexOf(handler);
      if (index > -1) this.onErrorHandlers.splice(index, 1);
    };
  }

  onConnectionChange(handler: (connected: boolean) => void): () => void {
    this.onConnectionChangeHandlers.push(handler);
    return () => {
      const index = this.onConnectionChangeHandlers.indexOf(handler);
      if (index > -1) this.onConnectionChangeHandlers.splice(index, 1);
    };
  }

  // ============ 通知处理器 ============

  private notifyOutput(sessionId: string, data: string): void {
    const handler = this.onOutputHandlers.get(sessionId);
    if (handler) handler(data);
  }

  private notifySessionCreated(sessionId: string): void {
    for (const handler of this.onSessionCreatedHandlers) {
      handler(sessionId);
    }
  }

  private notifySessionClosed(sessionId: string): void {
    for (const handler of this.onSessionClosedHandlers) {
      handler(sessionId);
    }
  }

  private notifyError(message: string): void {
    for (const handler of this.onErrorHandlers) {
      handler(message);
    }
  }

  private notifyConnectionChange(connected: boolean): void {
    for (const handler of this.onConnectionChangeHandlers) {
      handler(connected);
    }
  }

  private removeSessionCreatedHandler(handler: (sessionId: string) => void): void {
    const index = this.onSessionCreatedHandlers.indexOf(handler);
    if (index > -1) this.onSessionCreatedHandlers.splice(index, 1);
  }
}

// 导出单例
export const terminalWS = new TerminalWebSocketClient();
