// Files 页面 - 文件浏览器（增强版：支持增删改、右键菜单）

import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Space,
  Button,
  Breadcrumb,
  Input,
  Modal,
  message,
  Spin,
  Alert,
  Tag,
  Typography,
  Dropdown,
  Menu,
} from 'antd';
import {
  FolderOutlined,
  FileOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
  EditOutlined,
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileAddOutlined,
  FolderAddOutlined,
} from '@ant-design/icons';
import { api } from '@/lib/api';
import type { FileItem } from '@/types/api';

const { TextArea } = Input;
const { Text } = Typography;

/**
 * 右键菜单状态
 */
interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  selectedItem: FileItem | null;
}

/**
 * 创建文件/目录弹窗状态
 */
interface CreateModalState {
  visible: boolean;
  isDirectory: boolean;
  name: string;
}

/**
 * 重命名弹窗状态
 */
interface RenameModalState {
  visible: boolean;
  item: FileItem | null;
  newName: string;
}

/**
 * 删除确认弹窗状态
 */
interface DeleteModalState {
  visible: boolean;
  item: FileItem | null;
}

/**
 * Files 文件浏览器组件
 */
const Files: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 文件内容编辑状态
  const [editVisible, setEditVisible] = useState(false);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [saving, setSaving] = useState(false);

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    selectedItem: null,
  });

  // 创建文件/目录弹窗
  const [createModal, setCreateModal] = useState<CreateModalState>({
    visible: false,
    isDirectory: false,
    name: '',
  });

  // 重命名弹窗
  const [renameModal, setRenameModal] = useState<RenameModalState>({
    visible: false,
    item: null,
    newName: '',
  });

  // 删除确认弹窗
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    visible: false,
    item: null,
  });

  /**
   * 加载文件列表
   */
  const loadFiles = async (path: string = '') => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.files.list(path);
      setFiles(data.items || []);
      setCurrentPath(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载文件列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  // 关闭右键菜单
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu.visible]);

  /**
   * 进入目录
   */
  const handleEnterDirectory = (item: FileItem) => {
    if (item.isDirectory) {
      setPathHistory([...pathHistory, currentPath]);
      loadFiles(item.path);
    }
  };

  /**
   * 左键单击文件 - 打开文件内容
   */
  const handleFileClick = (item: FileItem) => {
    if (!item.isDirectory) {
      handleEditFile(item);
    }
  };

  /**
   * 返回上级目录
   */
  const handleGoBack = () => {
    if (pathHistory.length > 0) {
      const prevPath = pathHistory[pathHistory.length - 1];
      setPathHistory(pathHistory.slice(0, -1));
      loadFiles(prevPath);
    } else {
      loadFiles('');
    }
  };

  /**
   * 返回首页
   */
  const handleGoHome = () => {
    setPathHistory([]);
    loadFiles('');
  };

  /**
   * 打开文件编辑
   */
  const handleEditFile = async (item: FileItem) => {
    if (item.isDirectory) return;

    try {
      setEditingFile(item.path);
      setEditVisible(true);
      const data = await api.files.getContent(item.path);
      setFileContent(data.content);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载文件内容失败');
      setEditVisible(false);
    }
  };

  /**
   * 保存文件内容
   */
  const handleSaveFile = async () => {
    if (!editingFile) return;

    try {
      setSaving(true);
      await api.files.saveContent({
        path: editingFile,
        content: fileContent,
      });
      message.success('文件已保存');
      setEditVisible(false);
      setEditingFile(null);
      loadFiles(currentPath);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  /**
   * 右键菜单处理
   */
  const handleContextMenu = (e: React.MouseEvent, item: FileItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      selectedItem: item,
    });
  };

  /**
   * 删除文件/目录
   */
  const handleDelete = async (item: FileItem) => {
    try {
      await api.files.delete(item.path, item.isDirectory);
      message.success(`${item.isDirectory ? '目录' : '文件'} "${item.name}" 已删除`);
      loadFiles(currentPath);
      setDeleteModal({ visible: false, item: null });
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  /**
   * 打开删除确认
   */
  const handleOpenDeleteConfirm = (item: FileItem) => {
    setDeleteModal({
      visible: true,
      item,
    });
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  /**
   * 打开重命名弹窗
   */
  const handleRename = (item: FileItem) => {
    setRenameModal({
      visible: true,
      item,
      newName: item.name,
    });
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  /**
   * 确认重命名
   */
  const handleRenameConfirm = async () => {
    if (!renameModal.item || !renameModal.newName.trim()) {
      message.error('请输入新的名称');
      return;
    }

    const newPath = renameModal.item.path.substring(
      0,
      renameModal.item.path.lastIndexOf('/') + 1
    ) + renameModal.newName.trim();

    try {
      await api.files.rename(renameModal.item.path, newPath);
      message.success('重命名成功');
      setRenameModal({ visible: false, item: null, newName: '' });
      loadFiles(currentPath);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '重命名失败');
    }
  };

  /**
   * 打开创建弹窗
   */
  const handleOpenCreateModal = (isDirectory: boolean) => {
    setCreateModal({
      visible: true,
      isDirectory,
      name: '',
    });
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  /**
   * 确认创建
   */
  const handleCreateConfirm = async () => {
    if (!createModal.name.trim()) {
      message.error('请输入名称');
      return;
    }

    const newPath = currentPath
      ? `${currentPath}/${createModal.name.trim()}`
      : createModal.name.trim();

    try {
      await api.files.create(newPath, createModal.isDirectory);
      message.success(`${createModal.isDirectory ? '目录' : '文件'} "${createModal.name}" 已创建`);
      setCreateModal({ visible: false, isDirectory: false, name: '' });
      loadFiles(currentPath);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '创建失败');
    }
  };

  /**
   * 面包屑导航
   */
  const renderBreadcrumb = () => {
    const segments = currentPath ? currentPath.split('/') : [];
    const items: { title: React.ReactNode; href?: string; onClick?: () => void }[] = [
      { title: <HomeOutlined />, onClick: handleGoHome }
    ];

    let accumulatedPath = '';
    segments.forEach((segment, idx) => {
      accumulatedPath += (idx > 0 ? '/' : '') + segment;
      items.push({
        title: segment,
      });
    });

    return items;
  };

  /**
   * 文件大小格式化
   */
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  /**
   * 表格列定义
   */
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: FileItem) => (
        <Space>
          {record.isDirectory ? (
            <FolderOutlined style={{ color: '#1890ff' }} />
          ) : (
            <FileOutlined style={{ color: '#52c41a' }} />
          )}
          <Text>{text}</Text>
        </Space>
      ),
      onCell: (record: FileItem) => ({
        onClick: () => {
          if (record.isDirectory) {
            handleEnterDirectory(record);
          } else {
            handleFileClick(record);
          }
        },
        onContextMenu: (e: React.MouseEvent) => handleContextMenu(e, record),
        style: { cursor: record.isDirectory ? 'pointer' : 'pointer' },
      }),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size: number, record: FileItem) =>
        record.isDirectory ? '-' : formatSize(size),
    },
    {
      title: '修改时间',
      dataIndex: 'modified',
      key: 'modified',
      width: 200,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '类型',
      key: 'type',
      width: 100,
      render: (_: any, record: FileItem) => (
        <Tag color={record.isDirectory ? 'blue' : 'green'}>
          {record.isDirectory ? '目录' : '文件'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: FileItem) => (
        <Space size="small">
          {!record.isDirectory && (
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEditFile(record);
              }}
            >
              编辑
            </Button>
          )}
          <Dropdown
            menu={{
              items: [
                {
                  key: 'rename',
                  icon: <EditOutlined />,
                  label: '重命名',
                  onClick: () => handleRename(record),
                },
                {
                  type: 'divider',
                },
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: <span style={{ color: '#ff4d4f' }}>删除</span>,
                  onClick: () => handleOpenDeleteConfirm(record),
                },
              ],
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="link"
              size="small"
              onClick={(e) => e.stopPropagation()}
            >
              更多
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>文件浏览器</h2>
        <Space>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'create-file',
                  icon: <FileAddOutlined />,
                  label: '新建文件',
                  onClick: () => handleOpenCreateModal(false),
                },
                {
                  key: 'create-folder',
                  icon: <FolderAddOutlined />,
                  label: '新建文件夹',
                  onClick: () => handleOpenCreateModal(true),
                },
              ],
            }}
            trigger={['click']}
          >
            <Button type="primary" icon={<PlusOutlined />}>
              新建
            </Button>
          </Dropdown>
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={() => loadFiles(currentPath)}
            loading={loading}
          >
            刷新
          </Button>
        </Space>
      </div>

      {/* 面包屑导航 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleGoBack}
            disabled={pathHistory.length === 0}
          />
          <Breadcrumb items={renderBreadcrumb()} />
        </Space>
      </Card>

      {/* 文件列表 */}
      <Card>
        {loading && !files.length ? (
          <div style={{ textAlign: 'center', padding: 50 }}>
            <Spin tip="加载文件列表中..." />
          </div>
        ) : error ? (
          <Alert
            message="加载失败"
            description={error}
            type="error"
            showIcon
            action={
              <a onClick={() => loadFiles(currentPath)}>重试</a>
            }
          />
        ) : files.length === 0 ? (
          <Alert
            message="空目录"
            description="当前目录中没有文件"
            type="info"
            showIcon
          />
        ) : (
          <Table
            columns={columns}
            dataSource={files}
            rowKey="path"
            pagination={false}
            onRow={(record: FileItem) => ({
              onContextMenu: (e) => handleContextMenu(e, record),
            })}
          />
        )}
      </Card>

      {/* 文件编辑弹窗 */}
      <Modal
        title={`编辑文件：${editingFile}`}
        open={editVisible}
        onOk={handleSaveFile}
        onCancel={() => {
          setEditVisible(false);
          setEditingFile(null);
        }}
        width={800}
        confirmLoading={saving}
        okText="保存"
        cancelText="取消"
      >
        <TextArea
          value={fileContent}
          onChange={(e) => setFileContent(e.target.value)}
          rows={20}
          style={{ fontFamily: 'monospace' }}
        />
      </Modal>

      {/* 创建文件/目录弹窗 */}
      <Modal
        title={`新建${createModal.isDirectory ? '文件夹' : '文件'}`}
        open={createModal.visible}
        onOk={handleCreateConfirm}
        onCancel={() => setCreateModal({ visible: false, isDirectory: false, name: '' })}
        okText="创建"
        cancelText="取消"
      >
        <Input
          placeholder={`请输入${createModal.isDirectory ? '文件夹' : '文件'}名称`}
          value={createModal.name}
          onChange={(e) => setCreateModal(prev => ({ ...prev, name: e.target.value }))}
          onPressEnter={handleCreateConfirm}
          autoFocus
        />
      </Modal>

      {/* 重命名弹窗 */}
      <Modal
        title="重命名"
        open={renameModal.visible}
        onOk={handleRenameConfirm}
        onCancel={() => setRenameModal({ visible: false, item: null, newName: '' })}
        okText="确认"
        cancelText="取消"
      >
        <Input
          placeholder="请输入新名称"
          value={renameModal.newName}
          onChange={(e) => setRenameModal(prev => ({ ...prev, newName: e.target.value }))}
          onPressEnter={handleRenameConfirm}
          autoFocus
        />
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        title="删除确认"
        open={deleteModal.visible}
        onOk={() => deleteModal.item && handleDelete(deleteModal.item)}
        onCancel={() => setDeleteModal({ visible: false, item: null })}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>
          确定要删除{deleteModal.item?.isDirectory ? '目录' : '文件'} "{deleteModal.item?.name}" 吗？
          {deleteModal.item?.isDirectory && (
            <Alert
              message="此操作将递归删除目录及其所有内容，不可撤销！"
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </p>
      </Modal>

      {/* 右键菜单 */}
      {contextMenu.visible && contextMenu.selectedItem && (
        <Menu
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000,
            minWidth: '150px',
          }}
          items={[
            {
              key: 'rename',
              icon: <EditOutlined />,
              label: '重命名',
              onClick: () => handleRename(contextMenu.selectedItem!),
            },
            {
              type: 'divider',
            },
            {
              key: 'delete',
              icon: <DeleteOutlined />,
              label: <span style={{ color: '#ff4d4f' }}>删除</span>,
              onClick: () => handleOpenDeleteConfirm(contextMenu.selectedItem!),
            },
          ]}
        />
      )}
    </div>
  );
};

export default Files;
