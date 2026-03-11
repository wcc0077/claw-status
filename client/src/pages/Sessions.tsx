import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Space, Button, Badge, Statistic, Row, Col, Spin, Divider, Empty, Tooltip, Descriptions, Progress } from 'antd';
import {
  MessageOutlined,
  UserOutlined,
  GroupOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  DatabaseOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { api } from '@/lib/api';
import type { Session, SessionsStatsResponse, SessionMessage } from '@/types/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Title, Text, Paragraph } = Typography;

/**
 * 渠道颜色和标签映射（常量）
 */
const CHANNEL_COLORS: Record<string, string> = {
  webchat: '#1890ff',
  feishu: '#3370ff',
  wecom: '#07c160',
  whatsapp: '#25D366',
  telegram: '#0088cc',
  discord: '#5865F2',
  slack: '#4A154B',
};

const CHANNEL_LABELS: Record<string, string> = {
  webchat: 'Web',
  feishu: '飞书',
  wecom: '企微',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  discord: 'Discord',
  slack: 'Slack',
};

/**
 * Sessions 页面 - 会话管理
 */
const Sessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionsStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, statsRes] = await Promise.all([
        api.sessions.list(),
        api.sessions.getStats(),
      ]);
      setSessions(sessionsRes.sessions);
      setStats(statsRes);
    } catch (error: any) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const detail = await api.sessions.getDetail(id);
      setSelectedSessionDetail(detail);
    } catch (error: any) {
      console.error('Failed to load session detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSessionClick = (id: string) => {
    setSelectedSessionId(id);
    loadSessionDetail(id);
  };

  const getChannelColor = (channel: string) => CHANNEL_COLORS[channel] || '#8c8c8d';

  const getChannelLabel = (channel: string) => CHANNEL_LABELS[channel] || channel;

  const MessageBubble: React.FC<{ message: SessionMessage }> = ({ message }) => {
    const isUser = message.message?.role === 'user';
    const isSystem = message.message?.role === 'system';

    if (message.type === 'model_change') {
      return (
        <div style={{ textAlign: 'center', margin: '8px 0' }}>
          <Tag color="purple">切换模型</Tag>
        </div>
      );
    }

    const content = message.message?.content?.[0]?.text || '';
    if (!content && message.type !== 'message') return null;

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            maxWidth: '70%',
            padding: '12px 16px',
            borderRadius: 12,
            background: isSystem
              ? '#f5f5f5'
              : isUser
              ? '#1890ff'
              : '#f0f2f5',
            color: isUser ? '#fff' : '#000',
          }}
        >
          {isSystem && <Tag size="small" style={{ marginBottom: 8 }}>System</Tag>}
          <Paragraph
            style={{
              margin: 0,
              color: isUser ? '#fff' : '#000',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {content.slice(0, 500)}
            {content.length > 500 && '...'}
          </Paragraph>
          <div style={{ textAlign: 'right', marginTop: 8, fontSize: 12, opacity: 0.6 }}>
            {dayjs(message.timestamp).format('HH:mm:ss')}
          </div>
        </div>
      </div>
    );
  };

  const sessionsColumns = [
    {
      title: '会话 ID',
      dataIndex: 'sessionId',
      key: 'sessionId',
      width: 120,
      render: (text: string) => <Text code>{text.slice(0, 8)}...</Text>,
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      key: 'channel',
      width: 100,
      render: (channel: string) => (
        <Tag color={getChannelColor(channel)}>{getChannelLabel(channel)}</Tag>
      ),
    },
    {
      title: '类型',
      dataIndex: 'chatType',
      key: 'chatType',
      width: 80,
      render: (chatType: 'direct' | 'group') => (
        <Tag icon={chatType === 'direct' ? <UserOutlined /> : <GroupOutlined />}>
          {chatType === 'direct' ? '私聊' : '群聊'}
        </Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (updatedAt: number) => (
        <Tooltip title={dayjs(updatedAt).format('YYYY-MM-DD HH:mm:ss')}>
          <Space>
            <ClockCircleOutlined />
            {dayjs(updatedAt).fromNow()}
          </Space>
        </Tooltip>
      ),
      sorter: (a: any, b: any) => b.updatedAt - a.updatedAt,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: Session) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleSessionClick(record.id)}
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总会话数"
              value={stats?.total || 0}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="渠道数"
              value={Object.keys(stats?.byChannel || {}).length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="私聊会话"
              value={stats?.byChatType?.direct || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="群聊会话"
              value={stats?.byChatType?.group || 0}
              prefix={<GroupOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 按渠道分类 */}
      {stats && Object.keys(stats.byChannel).length > 0 && (
        <Card style={{ marginBottom: 24 }} title="按渠道分类">
          <Space wrap>
            {Object.entries(stats.byChannel).map(([channel, count]) => (
              <Tag key={channel} color={getChannelColor(channel)} style={{ fontSize: 14, padding: '4px 12px' }}>
                {getChannelLabel(channel)}: {count}
              </Tag>
            ))}
          </Space>
        </Card>
      )}

      <Row gutter={16}>
        {/* 会话列表 */}
        <Col span={12}>
          <Card
            title="会话列表"
            extra={
              <Button icon={<ReloadOutlined />} onClick={loadData} size="small">
                刷新
              </Button>
            }
          >
            {loading ? (
              <Spin />
            ) : sessions.length === 0 ? (
              <Empty description="暂无会话数据" />
            ) : (
              <Table
                columns={sessionsColumns}
                dataSource={sessions}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ y: 600 }}
                onRow={(record) => ({
                  onClick: () => handleSessionClick(record.id),
                  style: {
                    cursor: 'pointer',
                    background: selectedSessionId === record.id ? '#e6f7ff' : undefined,
                  },
                })}
              />
            )}
          </Card>
        </Col>

        {/* 会话详情 */}
        <Col span={12}>
          <Card
            title={selectedSessionDetail ? (
              <Space>
                <Tag color={getChannelColor(selectedSessionDetail.channel)}>
                  {getChannelLabel(selectedSessionDetail.channel)}
                </Tag>
                <Text>{selectedSessionDetail.sessionId?.slice(0, 8)}...</Text>
              </Space>
            ) : '会话详情'}
          >
            {detailLoading ? (
              <Spin />
            ) : !selectedSessionDetail ? (
              <Empty description="选择会话查看详情" />
            ) : (
              <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="会话 ID">{selectedSessionDetail.sessionId}</Descriptions.Item>
                  <Descriptions.Item label="渠道">{getChannelLabel(selectedSessionDetail.channel)}</Descriptions.Item>
                  <Descriptions.Item label="类型">{selectedSessionDetail.chatType === 'direct' ? '私聊' : '群聊'}</Descriptions.Item>
                  <Descriptions.Item label="目标">{selectedSessionDetail.to || '-'}</Descriptions.Item>
                  <Descriptions.Item label="更新时间">
                    {dayjs(selectedSessionDetail.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                </Descriptions>
                <Divider>消息记录</Divider>
                <div>
                  {selectedSessionDetail.messages?.map((msg: SessionMessage, idx: number) => (
                    <MessageBubble key={idx} message={msg} />
                  )) || <Empty description="暂无消息" />}
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Sessions;
