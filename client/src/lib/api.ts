// API 客户端 - OpenClaw Dashboard REST API 调用封装

import type {
  FilesListResponse,
  FileContentResponse,
  FileContentRequest,
  FileSaveResponse,
  FileCreateResponse,
  FileDeleteResponse,
  FileRenameResponse,
  FileMoveResponse,
  ConfigPathResponse,
} from '@/types/api';

// API 基础 URL - 开发环境代理到本地服务器
const API_BASE_URL = '';

/**
 * 直接请求处理函数（用于直接返回数据的端点，如 /api/files）
 * 后端返回格式：{ ok: true, ... } 直接返回响应数据
 */
async function requestDirect<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data as T;
}

/**
 * 文件管理 API
 */
export const filesApi = {
  /** 获取文件列表 */
  list: (path: string = ''): Promise<FilesListResponse> =>
    requestDirect(`/api/files?path=${encodeURIComponent(path)}`),

  /** 获取文件内容 */
  getContent: (path: string): Promise<FileContentResponse> =>
    requestDirect(`/api/files/content?path=${encodeURIComponent(path)}`),

  /** 保存文件内容 */
  saveContent: (data: FileContentRequest): Promise<FileSaveResponse> =>
    requestDirect<FileSaveResponse>('/api/files/content', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** 创建文件或目录 */
  create: (path: string, isDirectory: boolean): Promise<FileCreateResponse> =>
    requestDirect<FileCreateResponse>('/api/files/create', {
      method: 'POST',
      body: JSON.stringify({ path, isDirectory }),
    }),

  /** 删除文件或目录 */
  delete: (path: string, recursive: boolean = false): Promise<FileDeleteResponse> =>
    requestDirect<FileDeleteResponse>('/api/files', {
      method: 'DELETE',
      body: JSON.stringify({ path, recursive }),
    }),

  /** 重命名文件或目录 */
  rename: (oldPath: string, newPath: string): Promise<FileRenameResponse> =>
    requestDirect<FileRenameResponse>('/api/files/rename', {
      method: 'PUT',
      body: JSON.stringify({ oldPath, newPath }),
    }),

  /** 移动文件或目录 */
  move: (sourcePath: string, destPath: string): Promise<FileMoveResponse> =>
    requestDirect<FileMoveResponse>('/api/files/move', {
      method: 'PUT',
      body: JSON.stringify({ sourcePath, destPath }),
    }),
};

/**
 * 配置 API
 */
export const configApi = {
  /** 获取配置路径 */
  getPath: (): Promise<ConfigPathResponse> => requestDirect('/api/config-path'),
};

// 导出所有 API 模块
export const api = {
  files: filesApi,
  config: configApi,
};

export default api;
