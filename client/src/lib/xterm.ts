import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export interface TerminalOptions {
  fontSize?: number;
  fontFamily?: string;
  theme?: 'dark' | 'light';
  cursorBlink?: boolean;
}

/**
 * 创建并配置 xterm.js 终端实例
 */
export function createTerminal(
  container: HTMLElement,
  options: TerminalOptions = {}
): { terminal: Terminal; fitAddon: FitAddon } {
  const {
    fontSize = 14,
    fontFamily = 'Consolas, "Courier New", monospace',
    theme = 'dark',
    cursorBlink = true,
  } = options;

  const terminal = new Terminal({
    fontSize,
    fontFamily,
    cursorBlink,
    theme: theme === 'dark' ? {
      background: '#1e1e1e',
      foreground: '#ffffff',
      cursor: '#ffffff',
      cursorAccent: '#1e1e1e',
      selectionBackground: 'rgba(255, 255, 255, 0.3)',
      black: '#1e1e1e',
      red: '#cd3131',
      green: '#0dbc79',
      yellow: '#e5e510',
      blue: '#2472c8',
      magenta: '#bc3fbc',
      cyan: '#11a8cd',
      white: '#e5e5e5',
      brightBlack: '#666666',
      brightRed: '#f14c4c',
      brightGreen: '#23d18b',
      brightYellow: '#f5f543',
      brightBlue: '#3b8eea',
      brightMagenta: '#d670d6',
      brightCyan: '#29b8db',
      brightWhite: '#ffffff',
    } : undefined,
    scrollback: 10000,
    tabStopWidth: 4,
    drawBoldTextInBrightColors: true,
    minimumContrastRatio: 1,
    disableStdin: false, // 确保允许输入
  });

  const fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  terminal.open(container);
  fitAddon.fit();

  return { terminal, fitAddon };
}
