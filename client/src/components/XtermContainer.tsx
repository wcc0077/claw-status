import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { createTerminal } from '../lib/xterm';
import { terminalWS } from '../lib/terminal-ws';
import './XtermContainer.css';

export interface XtermContainerProps {
  isActive: boolean;
  onCreated: (sessionId: string) => void;
  onClosed: (sessionId: string) => void;
}

/**
 * xterm.js 终端容器组件
 */
export const XtermContainer: React.FC<XtermContainerProps> = ({
  isActive,
  onCreated,
  onClosed,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<{ terminal: Terminal; fitAddon: FitAddon } | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // 初始化终端
  useEffect(() => {
    if (!terminalRef.current) return;

    console.log('[XtermContainer] 开始初始化终端');

    const { terminal, fitAddon } = createTerminal(terminalRef.current, {
      fontSize: 14,
      cursorBlink: true,
    });

    terminalInstance.current = { terminal, fitAddon };

    // 处理终端输入
    terminal.onData((data) => {
      console.log('[XtermContainer] 收到输入:', JSON.stringify(data));
      console.log('[XtermContainer] sessionIdRef.current:', sessionIdRef.current);
      if (sessionIdRef.current) {
        console.log('[XtermContainer] 发送数据到 WebSocket');
        terminalWS.write(sessionIdRef.current, data);
      } else {
        console.error('[XtermContainer] sessionId 为空，无法发送');
      }
    });

    console.log('[XtermContainer] onData 事件已注册');

    // 处理终端大小调整
    terminal.onResize(({ cols, rows }) => {
      if (sessionIdRef.current) {
        terminalWS.resize(sessionIdRef.current, cols, rows);
      }
    });

    // 创建后端会话
    console.log('[XtermContainer] 开始创建后端会话，terminal.cols:', terminal.cols, 'terminal.rows:', terminal.rows);
    terminalWS.create(terminal.cols, terminal.rows)
      .then((newSessionId) => {
        console.log('[XtermContainer] 会话创建成功，sessionId:', newSessionId);
        sessionIdRef.current = newSessionId;
        onCreated(newSessionId);

        // 订阅输出
        const unsubscribe = terminalWS.onOutput(newSessionId, (data) => {
          terminal.write(data);
        });

        // 订阅关闭
        const unsubscribeClosed = terminalWS.onSessionClosed((closedSessionId) => {
          if (closedSessionId === newSessionId) {
            onClosed(newSessionId);
            unsubscribe();
            unsubscribeClosed();
          }
        });
      })
      .catch((error) => {
        console.error('[XtermContainer] 创建会话失败:', error);
        terminal.write('\r\n\x1b[31m无法连接到终端服务器\x1b[0m\r\n');
      });

    // 初始适配
    fitAddon.fit();

    // 聚焦终端
    terminal.focus();

    // 清理
    return () => {
      if (sessionIdRef.current) {
        terminalWS.close(sessionIdRef.current);
      }
      terminal.dispose();
    };
  }, []);

  // 处理激活/失焦
  useEffect(() => {
    if (terminalInstance.current?.terminal) {
      if (isActive) {
        terminalInstance.current.terminal.focus();
        terminalInstance.current.fitAddon.fit();
      }
    }
  }, [isActive]);

  // 窗口大小变化时重新适配
  useEffect(() => {
    const handleResize = () => {
      if (isActive && terminalInstance.current?.fitAddon) {
        terminalInstance.current.fitAddon.fit();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isActive]);

  return (
    <div className="xterm-container">
      <div ref={terminalRef} className="xterm-terminal" />
    </div>
  );
};
