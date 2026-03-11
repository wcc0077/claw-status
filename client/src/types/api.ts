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
// 配置接口
// ============================================================================

export interface ConfigPathResponse {
  fileRoot: string;
  home: string;
  config: string;
  sessions: string;
  memories: string;
}
