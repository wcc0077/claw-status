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
  SessionsListResponse,
  SessionDetailResponse,
  SessionsStatsResponse,
  MemoryStatusResponse,
  MemoryFilesResponse,
  MemoryContentResponse,
  CronListResponse,
  CronRunsResponse,
  SubAgentsResponse,
  HeartbeatConfigResponse,
  TodosResponse,
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
 * 会话管理 API
 */
export const sessionsApi = {
  /** 获取会话列表 */
  list: (): Promise<SessionsListResponse> =>
    requestDirect('/api/sessions'),

  /** 获取会话详情 */
  getDetail: (id: string): Promise<SessionDetailResponse> =>
    requestDirect(`/api/sessions/${encodeURIComponent(id)}`),

  /** 获取会话统计 */
  getStats: (): Promise<SessionsStatsResponse> =>
    requestDirect('/api/sessions/stats'),
};

/**
 * 记忆系统 API
 */
export const memoryApi = {
  /** 获取记忆状态 */
  getStatus: (): Promise<MemoryStatusResponse> =>
    requestDirect('/api/memory/status'),

  /** 获取记忆文件列表 */
  getFiles: (): Promise<MemoryFilesResponse> =>
    requestDirect('/api/memory/files'),

  /** 获取记忆内容 */
  getContent: (path: string): Promise<MemoryContentResponse> =>
    requestDirect(`/api/memory/content/${encodeURIComponent(path)}`),
};

/**
 * 定时任务 API
 */
export const cronApi = {
  /** 获取定时任务列表 */
  list: (): Promise<CronListResponse> =>
    requestDirect('/api/cron'),

  /** 获取运行历史 */
  getRuns: (jobId: string): Promise<CronRunsResponse> =>
    requestDirect(`/api/cron/${encodeURIComponent(jobId)}/runs`),
};

/**
 * 子代理 API
 */
export const subagentsApi = {
  /** 获取子代理状态 */
  getStatus: (): Promise<SubAgentsResponse> =>
    requestDirect('/api/subagents'),
};

/**
 * Heartbeat & Todos API
 */
export const heartbeatApi = {
  /** 获取 HEARTBEAT.md 内容 */
  getConfig: (): Promise<HeartbeatConfigResponse> =>
    requestDirect('/api/heartbeat/config'),
};

export const todosApi = {
  /** 获取今日待办 */
  getToday: (): Promise<TodosResponse> =>
    requestDirect('/api/todos/today'),
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
  sessions: sessionsApi,
  memory: memoryApi,
  cron: cronApi,
  subagents: subagentsApi,
  heartbeat: heartbeatApi,
  todos: todosApi,
  config: configApi,
};

export default api;
