export interface TerminalSession {
  id: string;
  name: string;
  status: 'connecting' | 'connected' | 'closed' | 'error';
  createdAt: number;
  shell?: string;
}

export type WSAction = 'create' | 'write' | 'resize' | 'close';
export type WSType = 'connected' | 'created' | 'output' | 'closed' | 'error';

export interface WSMessage {
  action?: WSAction;
  type?: WSType;
  sessionId?: string;
  payload?: {
    data?: string;
    cols?: number;
    rows?: number;
    cwd?: string;
    shell?: string;
  };
  message?: string;
}

/**
 * 生成终端会话名称
 */
export function generateSessionName(index: number): string {
  return `终端 ${index}`;
}
