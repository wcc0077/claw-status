import { v4 as uuidv4 } from 'uuid';
import { simplePtyManager, SimplePtyProcess } from './simple-pty.js';

// 平台检测
const isWindows = process.platform === 'win32';

// 默认 shell 配置
const DEFAULT_SHELL = isWindows
  ? 'powershell.exe'
  : process.env.SHELL || '/bin/bash';

// Windows 需要特殊处理 PATH
const DEFAULT_ENV = isWindows
  ? { ...process.env, TERM: 'xterm-256color' }
  : { ...process.env, TERM: 'xterm-256color' };

// node-pty 动态导入
let nodePty: typeof import('node-pty') | null = null;
let loadError: string | null = null;

try {
  // 使用 then() 而不是 await，因为这是顶层
  import('node-pty').then((mod) => {
    nodePty = mod;
    console.log('[PtyManager] node-pty 加载成功');
  }).catch((err: any) => {
    loadError = err.message;
    console.warn('[PtyManager] node-pty 加载失败，将使用降级模式:', err.message);
  });
} catch (e: any) {
  loadError = e.message;
}

export interface PTYOptions {
  cols: number;
  rows: number;
  cwd?: string;
  shell?: string;
}

// 统一的会话接口
interface TerminalSession {
  id: string;
  process: any; // IPty | SimplePtyProcess
  createdAt: number;
  lastActivity: number;
}

/**
 * 跨平台 pty 进程管理器
 * 优先使用 node-pty，失败时降级到简单实现
 */
export class PtyManager {
  private sessions: Map<string, TerminalSession> = new Map();
  private initialized = false;
  private usingFallback = false;

  /**
   * 检查 node-pty 是否可用
   */
  private isNodePtyAvailable(): boolean {
    return nodePty !== null && !this.usingFallback;
  }

  /**
   * 创建新的 pty 会话
   */
  create(options: PTYOptions): TerminalSession {
    const id = uuidv4();
    const shell = options.shell || DEFAULT_SHELL;

    console.log(`[PtyManager] 创建会话，shell: ${shell}, platform: ${process.platform}`);

    let ptyProcess: any;

    if (this.isNodePtyAvailable() && nodePty) {
      // 使用 node-pty
      ptyProcess = nodePty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: options.cols || 80,
        rows: options.rows || 30,
        cwd: options.cwd || (isWindows ? process.cwd() : process.env.HOME || process.cwd()),
        env: DEFAULT_ENV as { [key: string]: string },
      });
    } else {
      // 降级到简单实现
      console.warn('[PtyManager] 使用降级模式（简单终端）');
      this.usingFallback = true;
      ptyProcess = simplePtyManager.create({
        cols: options.cols || 80,
        rows: options.rows || 30,
        cwd: options.cwd,
      });
    }

    const session: TerminalSession = {
      id,
      process: ptyProcess,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };

    this.sessions.set(id, session);
    return session;
  }

  /**
   * 获取会话
   */
  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * 向 pty 写入数据
   */
  write(sessionId: string, data: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[PtyManager] 会话不存在：${sessionId}`);
      return false;
    }

    session.lastActivity = Date.now();
    session.process.write(data);
    return true;
  }

  /**
   * 调整 pty 大小
   */
  resize(sessionId: string, cols: number, rows: number): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[PtyManager] 会话不存在：${sessionId}`);
      return false;
    }

    try {
      if (session.process.resize) {
        session.process.resize(cols, rows);
        session.lastActivity = Date.now();
        return true;
      }
    } catch (error: any) {
      console.error(`[PtyManager] 调整大小失败：${error.message}`);
      return false;
    }
    return false;
  }

  /**
   * 关闭会话
   */
  close(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[PtyManager] 会话不存在：${sessionId}`);
      return false;
    }

    try {
      if (session.process.kill) {
        session.process.kill();
        this.sessions.delete(sessionId);
        console.log(`[PtyManager] 关闭会话 ${sessionId}`);
        return true;
      }
    } catch (error: any) {
      console.error(`[PtyManager] 关闭会话失败：${error.message}`);
      return false;
    }
    return false;
  }

  /**
   * 关闭所有会话
   */
  closeAll(): void {
    console.log(`[PtyManager] 关闭所有 ${this.sessions.size} 个会话`);
    for (const [id, session] of this.sessions) {
      try {
        if (session.process.kill) {
          session.process.kill();
        }
      } catch (error: any) {
        console.error(`[PtyManager] 关闭会话 ${id} 失败：${error.message}`);
      }
    }
    this.sessions.clear();
  }

  /**
   * 获取会话数量
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * 检查是否在使用降级模式
   */
  isUsingFallback(): boolean {
    return this.usingFallback || nodePty === null;
  }
}

// 导出单例
export const ptyManager = new PtyManager();
