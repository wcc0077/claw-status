import { spawn } from 'child_process';

/**
 * 降级模式终端模拟器
 * 当 node-pty 不可用时使用（如 Windows 上编译失败）
 *
 * 限制：
 * - 不支持交互式命令（如 vim, nano, top）
 * - 只支持简单命令执行
 * - 输出可能不完整
 */
export interface SimplePtyOptions {
  cols: number;
  rows: number;
  cwd?: string;
}

export interface SimplePtyProcess {
  onData: (handler: (data: string) => void) => void;
  onExit: (handler: (exitCode: number | null, signal: NodeJS.Signals | null) => void) => void;
  write: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  kill: () => void;
}

export class SimplePtyManager {
  /**
   * 创建简单的 pty 会话
   * 使用 child_process.spawn 模拟
   */
  create(options: SimplePtyOptions): SimplePtyProcess {
    const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh';
    const child = spawn(shell, [], {
      cwd: options.cwd || process.cwd(),
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let dataHandler: ((data: string) => void) | null = null;
    let exitHandler: ((exitCode: number | null, signal: NodeJS.Signals | null) => void) | null = null;

    // 处理输出
    child.stdout?.on('data', (data: Buffer) => {
      if (dataHandler) {
        dataHandler(data.toString('utf-8'));
      }
    });

    child.stderr?.on('data', (data: Buffer) => {
      if (dataHandler) {
        dataHandler(data.toString('utf-8'));
      }
    });

    // 处理退出
    child.on('exit', (code, signal) => {
      if (exitHandler) {
        exitHandler(code, signal);
      }
    });

    return {
      onData: (handler: (data: string) => void) => {
        dataHandler = handler;
      },
      onExit: (handler: (exitCode: number | null, signal: NodeJS.Signals | null) => void) => {
        exitHandler = handler;
      },
      write: (data: string) => {
        // 将输入写入 stdin
        child.stdin?.write(data);
      },
      resize: (_cols: number, _rows: number) => {
        // 简单实现不支持调整大小
        console.warn('[SimplePty] resize 不支持');
      },
      kill: () => {
        child.kill();
      },
    };
  }
}

export const simplePtyManager = new SimplePtyManager();
