import React from 'react';
import { TerminalTabs } from '../components/TerminalTabs';
import './Terminal.css';

/**
 * 终端页面
 * 提供多标签页的网页版终端功能
 */
const Terminal: React.FC = () => {
  return (
    <div className="terminal-page">
      <TerminalTabs />
    </div>
  );
};

export default Terminal;
