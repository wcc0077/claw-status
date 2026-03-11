import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spin, Empty, Typography, Table, Tag, Space, Button, Timeline, Alert, Tabs } from 'antd';
import {
  ClockCircleOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { api } from '@/lib/api';
import type { CronJob, CronRunsResponse } from '@/types/api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

/**
 * Cron 页面 - 定时任务管理
 */
const Cron: React.FC = () => {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [heartbeatContent, setHeartbeatContent] = useState<string>('');
  const [todosContent, setTodosContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState('jobs');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cronRes, heartbeatRes, todosRes] = await Promise.all([
        api.cron.list(),
        api.heartbeat.getConfig(),
        api.todos.getToday(),
      ]);
      setCronJobs(cronRes.jobs || []);
      setHeartbeatContent(heartbeatRes.content || '');
      setTodosContent(todosRes.content || '');
    } catch (error: any) {
      console.error('Failed to load cron data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScheduleLabel = (job: CronJob) => {
    const { schedule } = job;
    switch (schedule.kind) {
      case 'at':
        return `一次性：${schedule.at}`;
      case 'every':
        return `每 ${(schedule.everyMs || 0) / 60000} 分钟`;
      case 'cron':
        return `${schedule.expr} (${schedule.tz || 'UTC'})`;
      default:
        return '未知';
    }
  };

  const getPayloadPreview = (job: CronJob) => {
    if (job.payload.kind === 'systemEvent') {
      return `系统事件：${job.payload.text?.slice(0, 50) || '无'}`;
    } else {
      return `Agent 指令：${job.payload.message?.slice(0, 50) || '无'}`;
    }
  };

  const jobsColumns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '调度',
      dataIndex: 'schedule',
      key: 'schedule',
      render: (_: any, record: CronJob) => getScheduleLabel(record),
    },
    {
      title: '会话类型',
      dataIndex: 'sessionTarget',
      key: 'sessionTarget',
      render: (target: 'main' | 'isolated') => (
        <Tag color={target === 'main' ? 'blue' : 'purple'}>
          {target === 'main' ? '主会话' : '隔离会话'}
        </Tag>
      ),
    },
    {
      title: '交付模式',
      dataIndex: 'delivery',
      key: 'delivery',
      render: (delivery?: any) => (
        <Tag color={delivery?.mode === 'announce' ? 'green' : delivery?.mode === 'webhook' ? 'orange' : 'default'}>
          {delivery?.mode || 'none'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled?: boolean) => (
        enabled !== false ? (
          <Tag icon={<CheckCircleOutlined />} color="success">启用</Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="default">禁用</Tag>
        )
      ),
    },
    {
      title: '内容',
      key: 'payload',
      render: (_: any, record: CronJob) => (
        <Text type="secondary" ellipsis style={{ maxWidth: 300 }}>
          {getPayloadPreview(record)}
        </Text>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'jobs',
      label: '定时任务',
      children: (
        <Card>
          {cronJobs.length === 0 ? (
            <Empty description="暂无定时任务" />
          ) : (
            <Table
              columns={jobsColumns}
              dataSource={cronJobs}
              rowKey={(record) => record.jobId || record.id || record.name}
              pagination={false}
              size="small"
            />
          )}
        </Card>
      ),
    },
    {
      key: 'heartbeat',
      label: 'HEARTBEAT.md',
      children: (
        <Card title="心跳检查清单">
          {heartbeatContent ? (
            <Paragraph
              style={{
                background: '#f5f5f5',
                padding: 16,
                borderRadius: 8,
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
              }}
            >
              {heartbeatContent}
            </Paragraph>
          ) : (
            <Empty description="HEARTBEAT.md 不存在" />
          )}
        </Card>
      ),
    },
    {
      key: 'todos',
      label: '今日待办',
      children: (
        <Card title="今日待办事项">
          {todosContent ? (
            <Paragraph
              style={{
                background: '#f5f5f5',
                padding: 16,
                borderRadius: 8,
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
              }}
            >
              {todosContent}
            </Paragraph>
          ) : (
            <Empty description="今日暂无待办" />
          )}
        </Card>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" tip="加载定时任务数据..." />
      </div>
    );
  }

  return (
    <div>
      <Alert
        message="定时任务系统"
        description={
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>• Heartbeat: 周期性运行（默认 30 分钟），批量检查多个任务</Text>
            <Text>• Cron: 精确时间调度，支持一次性/周期性任务</Text>
            <Text>• 决策指南：批量检查用 Heartbeat，精确时间用 Cron</Text>
          </Space>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        tabBarExtraContent={
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            刷新
          </Button>
        }
      />
    </div>
  );
};

export default Cron;
