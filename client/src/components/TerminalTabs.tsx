import React, { useState, useEffect } from 'react';
import { Tabs, Button, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { XtermContainer } from './XtermContainer';
import { terminalWS } from '../lib/terminal-ws';
import './TerminalTabs.css';

const { Text } = Typography;

interface TerminalTab {
  key: string;
  sessionId: string;
  name: string;
}

/**
 * 终端标签页管理组件
 */
export const TerminalTabs: React.FC = () => {
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [sessionCounter, setSessionCounter] = useState(0);
  const [connected, setConnected] = useState(false);

  // 页面加载时连接 WebSocket 并创建第一个终端
  useEffect(() => {
    // 连接 WebSocket
    terminalWS.connect()
      .then(() => {
        console.log('[TerminalTabs] WebSocket 已连接');
        setConnected(true);
        // 直接创建第一个终端，不依赖 addTerminal
        const key = `terminal-${Date.now()}`;
        setTabs((prev) => [...prev, { key, sessionId: '', name: '终端 1' }]);
        setSessionCounter(1);
        setActiveTab(key); // 设置第一个终端为激活状态
      })
      .catch((error) => {
        console.error('[TerminalTabs] WebSocket 连接失败:', error);
        message.error('无法连接到终端服务器，请检查后端服务是否运行');
      });

    // 监听连接状态变化
    const unsubscribe = terminalWS.onConnectionChange((isConnected) => {
      setConnected(isConnected);
      if (!isConnected) {
        message.warning('终端连接已断开');
      }
    });

    return () => {
      unsubscribe();
      terminalWS.disconnect();
    };
  }, []);

  // 添加新终端
  const addTerminal = () => {
    const key = `terminal-${Date.now()}`;
    const newCounter = sessionCounter + 1;
    const name = `终端 ${newCounter}`;

    setTabs((prev) => [...prev, { key, sessionId: '', name }]);
    setSessionCounter(newCounter);
  };

  // 终端创建完成
  const handleTerminalCreated = (tabKey: string, sessionId: string) => {
    setTabs((prev) =>
      prev.map((tab) => (tab.key === tabKey ? { ...tab, sessionId } : tab))
    );
    setActiveTab(tabKey);
    message.success('终端已连接');
  };

  // 终端关闭
  const handleTerminalClosed = (tabKey: string) => {
    setTabs((prev) => prev.filter((tab) => tab.key !== tabKey));
    if (activeTab === tabKey) {
      const remaining = tabs.filter((t) => t.key !== tabKey);
      setActiveTab(remaining.length > 0 ? remaining[remaining.length - 1].key : null);
    }
    message.info('终端已关闭');
  };

  // 切换标签
  const handleTabChange = (key: string | null) => {
    setActiveTab(key);
  };

  // 关闭标签
  const handleCloseTab = (e: React.MouseEvent<HTMLElement>, tabKey: string) => {
    e.stopPropagation();
    const tab = tabs.find((t) => t.key === tabKey);
    if (tab?.sessionId) {
      terminalWS.close(tab.sessionId);
    }
    // 直接移除 tab，不等待后端响应
    setTabs((prev) => {
      const remaining = prev.filter((t) => t.key !== tabKey);
      // 如果关闭的是当前激活的 tab，切换到最后一个 tab
      if (activeTab === tabKey && remaining.length > 0) {
        setActiveTab(remaining[remaining.length - 1].key);
      } else if (remaining.length === 0) {
        setActiveTab(null);
      }
      return remaining;
    });
  };

  // 渲染标签页 - 只渲染标签栏，不渲染内容
  const renderTabBarOnly = () => {
    return (
      <div className="terminal-tab-bar">
        <div style={{ flex: 1 }}>
          <Tabs
            activeKey={activeTab || undefined}
            onChange={(key) => handleTabChange(key || null)}
            type="editable-card"
            size="small"
            hideAdd
            tabBarStyle={{ marginBottom: 0 }}
            items={tabs.map((tab) => ({
              key: tab.key,
              label: tab.name,
              closable: true,
              onClose: (e: React.MouseEvent<HTMLElement>) => handleCloseTab(e, tab.key),
            }))}
          />
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={addTerminal}
          size="small"
        >
          新建终端
        </Button>
      </div>
    );
  };

  // 渲染内容
  const renderContent = () => {
    if (!connected) {
      return (
        <div className="terminal-empty">
          <Text type="secondary">正在连接终端服务器...</Text>
        </div>
      );
    }

    if (tabs.length === 0) {
      return (
        <div className="terminal-empty">
          <Text type="secondary">暂无终端</Text>
          <br />
          <Button type="primary" icon={<PlusOutlined />} onClick={addTerminal}>
            创建第一个终端
          </Button>
        </div>
      );
    }

    return (
      <div className="terminal-content">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            className={`terminal-panel ${activeTab === tab.key ? 'active' : ''}`}
          >
            <XtermContainer
              isActive={activeTab === tab.key}
              onCreated={(sessionId) => handleTerminalCreated(tab.key, sessionId)}
              onClosed={() => handleTerminalClosed(tab.key)}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="terminal-tabs-container">
      {renderTabBarOnly()}
      {renderContent()}
    </div>
  );
};
