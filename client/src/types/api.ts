// API 类型定义 - OpenClaw Dashboard

// ============================================================================
// 文件管理接口
// ============================================================================

export interface FileItem {
  name: string;
  path: string;
  fullPath?: string;       // 后端返回的完整路径（可选）
  relativePath?: string;   // 相对路径（可选）
  isDirectory: boolean;
  size: number;
  sizeFormatted?: string;  // 格式化后的大小（可选）
  modified: string;
}

export interface FilesListResponse {
  path: string;
  relativePath?: string;   // 相对路径（可选）
  items: FileItem[];
}

export interface FileContentResponse {
  path: string;
  relativePath?: string;   // 相对路径（可选）
  content: string;
  size?: number;
  modified?: string;
}

export interface FileContentRequest {
  path: string;
  content: string;
}

export interface FileSaveResponse {
  ok: boolean;
  path: string;
  relativePath?: string;
}

export interface FileCreateRequest {
  path: string;
  isDirectory: boolean;
}

export interface FileCreateResponse {
  ok: boolean;
  path: string;
  relativePath: string;
}

export interface FileDeleteRequest {
  path: string;
  recursive?: boolean;
}

export interface FileDeleteResponse {
  ok: boolean;
  deletedPath: string;
}

export interface FileRenameRequest {
  oldPath: string;
  newPath: string;
}

export interface FileRenameResponse {
  ok: boolean;
  oldPath: string;
  newPath: string;
}

export interface FileMoveRequest {
  sourcePath: string;
  destPath: string;
}

export interface FileMoveResponse {
  ok: boolean;
  sourcePath: string;
  destPath: string;
}

// ============================================================================
// 会话管理接口
// ============================================================================

export interface Session {
  id: string;
  sessionId: string;
  updatedAt: number;
  chatType: 'direct' | 'group';
  channel: string;
  to: string;
  accountId?: string;
}

export interface SessionDetail extends Session {
  messages: SessionMessage[];
}

export interface SessionMessage {
  type: string;
  id: string;
  parentId?: string;
  timestamp: string;
  message?: {
    role: 'user' | 'assistant' | 'system';
    content: Array<{ type: string; text?: string }>;
  };
}

export interface SessionsListResponse {
  sessions: Session[];
}

export interface SessionDetailResponse extends SessionDetail {}

export interface SessionsStatsResponse {
  total: number;
  byChannel: Record<string, number>;
  byChatType: Record<string, number>;
}

// ============================================================================
// 记忆系统接口
// ============================================================================

export interface MemoryConfig {
  model: string;
  provider: string;
  providerKey?: string;
  sources: string[];
  chunkTokens: number;
  chunkOverlap: number;
  vectorDims: number;
}

export interface MemoryStatusResponse {
  status: 'active' | 'inactive';
  database: string;
  config: MemoryConfig | null;
  fileCount: number;
  hasMemoryMd: boolean;
  memoryMdPreview: string;
}

export interface MemoryFile {
  path: string;
  source: string;
  hash: string;
  mtime: number;
  size: number;
}

export interface MemoryFilesResponse {
  files: MemoryFile[];
}

export interface MemoryContentResponse {
  path: string;
  content: string;
}

// ============================================================================
// 定时任务接口
// ============================================================================

export interface CronJob {
  jobId?: string;
  id?: string;
  name: string;
  schedule: {
    kind: 'at' | 'every' | 'cron';
    at?: string;
    everyMs?: number;
    expr?: string;
    tz?: string;
    staggerMs?: number;
  };
  sessionTarget: 'main' | 'isolated';
  payload: {
    kind: 'systemEvent' | 'agentTurn';
    text?: string;
    message?: string;
  };
  delivery?: {
    mode: 'announce' | 'webhook' | 'none';
    channel?: string;
    to?: string;
  };
  enabled?: boolean;
  deleteAfterRun?: boolean;
}

export interface CronRunsResponse {
  jobId: string;
  runs: CronRun[];
}

export interface CronRun {
  jobId: string;
  startedAt: number;
  endedAt?: number;
  status: 'success' | 'failed' | 'running';
  error?: string;
}

export interface CronListResponse {
  version: number;
  jobs: CronJob[];
}

// ============================================================================
// 子代理接口
// ============================================================================

export interface SubAgentsResponse {
  version: number;
  runs: Record<string, SubAgentRun>;
}

export interface SubAgentRun {
  id?: string;
  status?: string;
  createdAt?: number;
  endedAt?: number;
}

// ============================================================================
// Heartbeat & Todos 接口
// ============================================================================

export interface HeartbeatConfigResponse {
  exists: boolean;
  content: string;
}

export interface TodosResponse {
  exists: boolean;
  date: string;
  content: string;
}

// ============================================================================
// 配置接口
// ============================================================================

export interface ConfigPathResponse {
  fileRoot: string;
  home: string;
  config: string;
  sessions: string;
  memories: string;
}
