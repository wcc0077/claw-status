import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spin, Empty, Statistic, Descriptions, Table, Tag, Typography, Alert, List } from 'antd';
import {
  RobotOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { api } from '@/lib/api';
import type { SubAgentsResponse, SubAgentRun } from '@/types/api';

const { Text } = Typography;

/**
 * SubAgents 页面 - 子代理状态
 */
const SubAgents: React.FC = () => {
  const [subAgentsData, setSubAgentsData] = useState<SubAgentsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.subagents.getStatus();
      setSubAgentsData(res);
    } catch (error: any) {
      console.error('Failed to load subagents data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runsList = subAgentsData
    ? Object.entries(subAgentsData.runs).map(([key, value]) => ({
        key,
        ...value,
      }))
    : [];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" tip="加载子代理数据..." />
      </div>
    );
  }

  return (
    <div>
      {/* 状态概览 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="子代理版本"
              value={subAgentsData?.version || 0}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="运行记录数"
              value={runsList.length}
              prefix={<RobotOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="状态"
              value={runsList.length > 0 ? '有活动' : '空闲'}
              valueStyle={{ color: runsList.length > 0 ? '#52c41a' : '#d9d9d9' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 运行记录 */}
      <Card title="子代理运行记录">
        {runsList.length === 0 ? (
          <Empty description="暂无子代理运行记录" />
        ) : (
          <Table
            dataSource={runsList}
            rowKey="key"
            pagination={false}
            size="small"
            columns={[
              {
                title: '运行 ID',
                dataIndex: 'key',
                key: 'key',
                render: (text: string) => <Text code>{text}</Text>,
              },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                render: (status?: string) => (
                  status ? (
                    <Tag color="processing">{status}</Tag>
                  ) : (
                    <Tag color="default">-</Tag>
                  )
                ),
              },
              {
                title: '创建时间',
                dataIndex: 'createdAt',
                key: 'createdAt',
                render: (createdAt?: number) =>
                  createdAt ? (
                    <Text>
                      <ClockCircleOutlined /> {new Date(createdAt).toLocaleString('zh-CN')}
                    </Text>
                  ) : (
                    '-'
                  ),
              },
              {
                title: '结束时间',
                dataIndex: 'endedAt',
                key: 'endedAt',
                render: (endedAt?: number) =>
                  endedAt ? (
                    <Text>
                      <CheckCircleOutlined /> {new Date(endedAt).toLocaleString('zh-CN')}
                    </Text>
                  ) : (
                    <Text type="secondary">运行中</Text>
                  ),
              },
            ]}
          />
        )}
      </Card>

      {/* 说明信息 */}
      <Alert
        message="子代理系统说明"
        description={
          <div style={{ marginTop: 8 }}>
            <Text>• 子代理用于执行独立的任务或特定功能</Text>
            <br />
            <Text>• 运行记录存储在 ~/.openclaw/subagents/runs.json</Text>
            <br />
            <Text>• 当前为空表示没有正在运行或已完成的子代理任务</Text>
          </div>
        }
        type="info"
        showIcon
        style={{ marginTop: 24 }}
      />
    </div>
  );
};

export default SubAgents;
