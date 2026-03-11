import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spin, Empty, Typography, Tag, Space, Progress, List, Badge, Statistic, Descriptions, Divider } from 'antd';
import {
  DatabaseOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { api } from '@/lib/api';
import type { MemoryStatusResponse, MemoryFile } from '@/types/api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

/**
 * Memory 页面 - 记忆系统状态
 */
const Memory: React.FC = () => {
  const [memoryStatus, setMemoryStatus] = useState<MemoryStatusResponse | null>(null);
  const [memoryFiles, setMemoryFiles] = useState<MemoryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<MemoryFile | null>(null);
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statusRes, filesRes] = await Promise.all([
        api.memory.getStatus(),
        api.memory.getFiles(),
      ]);
      setMemoryStatus(statusRes);
      setMemoryFiles(filesRes.files);
    } catch (error: any) {
      console.error('Failed to load memory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFileContent = async (path: string) => {
    setContentLoading(true);
    try {
      const res = await api.memory.getContent(path);
      setSelectedContent(res.content);
    } catch (error: any) {
      setSelectedContent(`Error: ${error.message}`);
    } finally {
      setContentLoading(false);
    }
  };

  const handleFileClick = (file: MemoryFile) => {
    setSelectedFile(file);
    if (file.path.endsWith('.md')) {
      loadFileContent(file.path);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" tip="加载记忆数据..." />
      </div>
    );
  }

  return (
    <div>
      {/* 状态概览 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="记忆状态"
              value={memoryStatus?.status === 'active' ? '运行中' : '未激活'}
              prefix={memoryStatus?.status === 'active' ? <CheckCircleOutlined /> : <DatabaseOutlined />}
              valueStyle={{ color: memoryStatus?.status === 'active' ? '#52c41a' : '#d9d9d9' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="文件数量"
              value={memoryStatus?.fileCount || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="向量维度"
              value={memoryStatus?.config?.vectorDims || 0}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="MEMORY.md"
              value={memoryStatus?.hasMemoryMd ? '存在' : '不存在'}
              valueStyle={{ color: memoryStatus?.hasMemoryMd ? '#52c41a' : '#d9d9d9' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* 配置信息 */}
        <Col span={24}>
          <Card title="记忆系统配置" style={{ marginBottom: 24 }}>
            {memoryStatus?.config ? (
              <Descriptions column={4} bordered>
                <Descriptions.Item label="嵌入模型" span={2}>
                  <Text code>{memoryStatus.config.model}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="提供商">
                  {memoryStatus.config.provider}
                </Descriptions.Item>
                <Descriptions.Item label="向量维度">
                  {memoryStatus.config.vectorDims}
                </Descriptions.Item>
                <Descriptions.Item label="Chunk Tokens">
                  {memoryStatus.config.chunkTokens}
                </Descriptions.Item>
                <Descriptions.Item label="Chunk Overlap">
                  {memoryStatus.config.chunkOverlap}
                </Descriptions.Item>
                <Descriptions.Item label="数据源" span={2}>
                  <Space wrap>
                    {memoryStatus.config.sources.map((source, idx) => (
                      <Tag key={idx}>{source}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Empty description="无配置信息" />
            )}
          </Card>
        </Col>

        {/* MEMORY.md 预览 */}
        {memoryStatus?.hasMemoryMd && (
          <Col span={24}>
            <Card title="MEMORY.md 预览" style={{ marginBottom: 24 }}>
              <Paragraph
                style={{
                  background: '#f5f5f5',
                  padding: 16,
                  borderRadius: 8,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                }}
              >
                {memoryStatus.memoryMdPreview}...
              </Paragraph>
            </Card>
          </Col>
        )}

        {/* 文件列表 */}
        <Col span={12}>
          <Card title="记忆文件列表">
            <List
              dataSource={memoryFiles.slice(0, 30)}
              loading={loading}
              renderItem={(file) => (
                <List.Item
                  onClick={() => handleFileClick(file)}
                  style={{
                    cursor: 'pointer',
                    background: selectedFile?.path === file.path ? '#e6f7ff' : undefined,
                    padding: '12px 16px',
                  }}
                >
                  <List.Item.Meta
                    avatar={<FileTextOutlined style={{ fontSize: 20, color: '#1890ff' }} />}
                    title={
                      <Space>
                        <Text ellipsis style={{ maxWidth: 300 }}>{file.path}</Text>
                        {file.path.endsWith('.md') && <Tag color="blue">Markdown</Tag>}
                      </Space>
                    }
                    description={
                      <Space size={16}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <ClockCircleOutlined /> {dayjs(file.mtime).format('YYYY-MM-DD HH:mm')}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {(file.size / 1024).toFixed(1)} KB
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 文件内容预览 */}
        <Col span={12}>
          <Card title={selectedFile ? `内容预览：${selectedFile.path}` : '文件内容预览'}>
            {contentLoading ? (
              <Spin />
            ) : !selectedContent ? (
              <Empty description="选择 Markdown 文件查看内容" />
            ) : (
              <Paragraph
                style={{
                  background: '#fafafa',
                  padding: 16,
                  borderRadius: 8,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  maxHeight: 600,
                  overflowY: 'auto',
                }}
              >
                {selectedContent}
              </Paragraph>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Memory;
