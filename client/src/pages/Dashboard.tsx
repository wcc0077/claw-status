// Dashboard 页面 - 简化的欢迎页面

import React from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import {
  FolderOutlined,
  FileOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

/**
 * Dashboard 首页组件 - 简化版
 */
const Dashboard: React.FC = () => {
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>欢迎使用 OpenClaw Dashboard</h2>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="文件管理"
              value={1}
              suffix="个服务"
              prefix={<FolderOutlined />}
            />
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              浏览、查看和编辑本地文件
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="系统状态"
              value="运行中"
              prefix={<FileOutlined />}
            />
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              后端文件服务正常运行
            </Text>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24 }} title="快速开始">
        <ul style={{ lineHeight: 2 }}>
          <li>点击左侧导航栏的 <strong>Files</strong> 进入文件管理页面</li>
          <li>在文件管理页面中，点击目录名称可以进入该目录</li>
          <li>点击文件的 <strong>编辑</strong> 按钮可以查看和修改文件内容</li>
          <li>编辑完成后点击 <strong>保存</strong> 按钮保存修改</li>
        </ul>
      </Card>

      <Card style={{ marginTop: 24 }} title="当前配置">
        <Row gutter={16}>
          <Col span={12}>
            <Statistic title="后端服务" value="http://localhost:3000" />
          </Col>
          <Col span={12}>
            <Statistic title="前端服务" value="http://localhost:5173" />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;
