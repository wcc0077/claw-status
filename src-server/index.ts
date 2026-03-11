import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, lstatSync, mkdirSync, rmSync, renameSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.DASHBOARD_PORT || 3000;

// 本地文件根目录
const FILE_ROOT = process.env.FILE_ROOT || path.join(process.cwd());

// OpenClaw 主目录
const OPENCLAW_HOME = process.env.OPENCLAW_HOME || path.join(process.env.HOME || '', '.openclaw');

// 开发模式检测
const isDev = process.env.NODE_ENV !== 'production';

// ============ 缓存和连接复用 ============

// SQLite 数据库连接缓存（只读模式）
let memoryDb: Database.Database | null = null;

/**
 * 获取记忆数据库连接（复用）
 */
function getMemoryDb(): Database.Database {
  const memoryDbPath = path.join(OPENCLAW_HOME, 'memory/main.sqlite');
  if (!memoryDb || memoryDb.name !== memoryDbPath) {
    if (memoryDb) {
      memoryDb.close();
    }
    memoryDb = new Database(memoryDbPath, { readonly: true });
  }
  return memoryDb;
}

// 会话数据缓存
let sessionsCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 5000; // 5 秒缓存

/**
 * 读取会话数据（带缓存）
 */
function getSessionsData() {
  const sessionsPath = path.join(OPENCLAW_HOME, 'agents/main/sessions/sessions.json');
  const now = Date.now();

  if (sessionsCache && now - sessionsCache.timestamp < CACHE_TTL_MS) {
    return sessionsCache.data;
  }

  const sessionsData = JSON.parse(readFileSync(sessionsPath, 'utf-8'));
  sessionsCache = { data: sessionsData, timestamp: now };
  return sessionsData;
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============ 开发模式：代理到 Vite 服务器 ============
if (isDev) {
  console.log('开发模式：代理 /api 请求到后端，其他请求到 Vite 开发服务器');
} else {
  console.log('生产模式：服务静态文件');
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// ============ 文件系统 API ============

/**
 * 验证路径安全
 * 确保访问路径在 FILE_ROOT 范围内
 */
function validatePath(requestedPath: string): { valid: boolean; resolvedPath?: string; error?: string } {
  const fileRootResolved = path.resolve(FILE_ROOT);

  // 空路径或 "/" 返回根目录
  if (!requestedPath || requestedPath === '/' || requestedPath === '\\') {
    return { valid: true, resolvedPath: fileRootResolved };
  }

  // 解析请求路径
  const normalizedPath = path.normalize(requestedPath);

  let resolvedPath: string;
  if (path.isAbsolute(normalizedPath)) {
    resolvedPath = path.resolve(normalizedPath);
  } else {
    // 相对路径，相对于 FILE_ROOT
    resolvedPath = path.join(fileRootResolved, normalizedPath);
  }

  // 确保解析后的路径在 FILE_ROOT 内
  if (!resolvedPath.startsWith(fileRootResolved)) {
    return { valid: false, error: '路径不允许访问' };
  }

  return { valid: true, resolvedPath };
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// 浏览目录
app.get('/api/files', (req, res) => {
  const requestedPath = req.query.path as string || '';

  // 验证路径
  const validation = validatePath(requestedPath || FILE_ROOT);
  if (!validation.valid) {
    return res.status(403).json({ error: validation.error });
  }

  const resolvedPath = validation.resolvedPath!;

  if (!existsSync(resolvedPath)) {
    return res.status(404).json({ error: '路径不存在' });
  }

  try {
    const items = readdirSync(resolvedPath).map(name => {
      const fullPath = path.join(resolvedPath, name);

      // 跳过符号链接，避免无限循环
      if (lstatSync(fullPath).isSymbolicLink()) {
        return null;
      }

      const stats = statSync(fullPath);
      return {
        name,
        path: path.relative(FILE_ROOT, fullPath) || '/',
        fullPath,
        isDirectory: stats.isDirectory(),
        size: stats.size,
        sizeFormatted: formatFileSize(stats.size),
        modified: stats.mtime.toISOString(),
      };
    }).filter(item => item !== null);

    // 排序：目录在前，文件在后
    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({
      path: resolvedPath,
      relativePath: path.relative(FILE_ROOT, resolvedPath) || '/',
      items
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 读取文件内容
app.get('/api/files/content', (req, res) => {
  const requestedPath = req.query.path as string;

  // 验证路径
  const validation = validatePath(requestedPath);
  if (!validation.valid) {
    return res.status(403).json({ error: validation.error });
  }

  const resolvedPath = validation.resolvedPath!;

  if (!existsSync(resolvedPath)) {
    return res.status(404).json({ error: '文件不存在' });
  }

  try {
    const stats = statSync(resolvedPath);
    if (stats.isDirectory()) {
      return res.status(400).json({ error: '无法读取目录内容' });
    }

    // 检查文件大小（限制 10MB）
    if (stats.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: '文件过大，无法读取' });
    }

    const content = readFileSync(resolvedPath, 'utf-8');
    res.json({
      path: resolvedPath,
      relativePath: path.relative(FILE_ROOT, resolvedPath),
      content,
      size: stats.size,
      modified: stats.mtime.toISOString(),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 写入文件内容
app.post('/api/files/content', (req, res) => {
  const { path: requestedPath, content } = req.body;

  if (!requestedPath || content === undefined) {
    return res.status(400).json({ error: '缺少 path 或 content 参数' });
  }

  // 验证路径
  const validation = validatePath(requestedPath);
  if (!validation.valid) {
    return res.status(403).json({ error: validation.error });
  }

  const resolvedPath = validation.resolvedPath!;

  try {
    // 确保父目录存在
    const parentDir = path.dirname(resolvedPath);
    if (!existsSync(parentDir)) {
      writeFileSync(resolvedPath, content, 'utf-8');
    } else {
      writeFileSync(resolvedPath, content, 'utf-8');
    }

    res.json({
      ok: true,
      path: resolvedPath,
      relativePath: path.relative(FILE_ROOT, resolvedPath),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 创建文件或目录
app.post('/api/files/create', (req, res) => {
  const { path: requestedPath, isDirectory } = req.body;

  if (!requestedPath) {
    return res.status(400).json({ error: '缺少 path 参数' });
  }

  // 验证路径
  const validation = validatePath(requestedPath);
  if (!validation.valid) {
    return res.status(403).json({ error: validation.error });
  }

  const resolvedPath = validation.resolvedPath!;

  try {
    if (existsSync(resolvedPath)) {
      return res.status(400).json({ error: '文件/目录已存在' });
    }

    if (isDirectory) {
      mkdirSync(resolvedPath, { recursive: true });
    } else {
      // 确保父目录存在
      const parentDir = path.dirname(resolvedPath);
      if (!existsSync(parentDir)) {
        mkdirSync(parentDir, { recursive: true });
      }
      writeFileSync(resolvedPath, '', 'utf-8');
    }

    res.json({
      ok: true,
      path: resolvedPath,
      relativePath: path.relative(FILE_ROOT, resolvedPath),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 删除文件或目录
app.delete('/api/files', (req, res) => {
  const { path: requestedPath, recursive } = req.body;

  if (!requestedPath) {
    return res.status(400).json({ error: '缺少 path 参数' });
  }

  // 验证路径
  const validation = validatePath(requestedPath);
  if (!validation.valid) {
    return res.status(403).json({ error: validation.error });
  }

  const resolvedPath = validation.resolvedPath!;

  try {
    if (!existsSync(resolvedPath)) {
      return res.status(404).json({ error: '文件/目录不存在' });
    }

    const stats = statSync(resolvedPath);
    if (stats.isDirectory() && !recursive) {
      // 检查目录是否为空
      const items = readdirSync(resolvedPath);
      if (items.length > 0) {
        return res.status(400).json({ error: '目录不为空，请使用递归删除' });
      }
    }

    rmSync(resolvedPath, { recursive: recursive || false, force: true });

    res.json({
      ok: true,
      deletedPath: path.relative(FILE_ROOT, resolvedPath) || '/',
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 重命名文件或目录
app.put('/api/files/rename', (req, res) => {
  const { oldPath, newPath } = req.body;

  if (!oldPath || !newPath) {
    return res.status(400).json({ error: '缺少 oldPath 或 newPath 参数' });
  }

  // 验证旧路径
  const oldValidation = validatePath(oldPath);
  if (!oldValidation.valid) {
    return res.status(403).json({ error: '原路径不允许访问' });
  }

  // 验证新路径
  const newValidation = validatePath(newPath);
  if (!newValidation.valid) {
    return res.status(403).json({ error: '新路径不允许访问' });
  }

  const oldResolvedPath = oldValidation.resolvedPath!;
  const newResolvedPath = newValidation.resolvedPath!;

  try {
    if (!existsSync(oldResolvedPath)) {
      return res.status(404).json({ error: '原文件/目录不存在' });
    }

    if (existsSync(newResolvedPath)) {
      return res.status(400).json({ error: '新文件/目录已存在' });
    }

    renameSync(oldResolvedPath, newResolvedPath);

    res.json({
      ok: true,
      oldPath: path.relative(FILE_ROOT, oldResolvedPath) || '/',
      newPath: path.relative(FILE_ROOT, newResolvedPath) || '/',
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 移动文件或目录
app.put('/api/files/move', (req, res) => {
  const { sourcePath, destPath } = req.body;

  if (!sourcePath || !destPath) {
    return res.status(400).json({ error: '缺少 sourcePath 或 destPath 参数' });
  }

  // 验证源路径
  const sourceValidation = validatePath(sourcePath);
  if (!sourceValidation.valid) {
    return res.status(403).json({ error: '源路径不允许访问' });
  }

  // 验证目标路径
  const destValidation = validatePath(destPath);
  if (!destValidation.valid) {
    return res.status(403).json({ error: '目标路径不允许访问' });
  }

  const sourceResolvedPath = sourceValidation.resolvedPath!;
  const destResolvedPath = destValidation.resolvedPath!;

  try {
    if (!existsSync(sourceResolvedPath)) {
      return res.status(404).json({ error: '源文件/目录不存在' });
    }

    if (existsSync(destResolvedPath)) {
      return res.status(400).json({ error: '目标位置已存在文件/目录' });
    }

    // 确保目标父目录存在
    const destParentDir = path.dirname(destResolvedPath);
    if (!existsSync(destParentDir)) {
      mkdirSync(destParentDir, { recursive: true });
    }

    renameSync(sourceResolvedPath, destResolvedPath);

    res.json({
      ok: true,
      sourcePath: path.relative(FILE_ROOT, sourceResolvedPath) || '/',
      destPath: path.relative(FILE_ROOT, destResolvedPath) || '/',
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 获取配置路径
app.get('/api/config-path', (req, res) => {
  res.json({
    fileRoot: FILE_ROOT,
    home: FILE_ROOT,
    config: path.join(FILE_ROOT, 'config.yaml'),
    sessions: path.join(FILE_ROOT, 'sessions'),
    memories: path.join(FILE_ROOT, 'memories'),
  });
});

// ============ OpenClaw 状态看板 API ============

/**
 * 获取会话列表
 */
app.get('/api/sessions', (req, res) => {
  const sessionsPath = path.join(OPENCLAW_HOME, 'agents/main/sessions/sessions.json');

  if (!existsSync(sessionsPath)) {
    return res.status(404).json({ error: '会话文件不存在' });
  }

  try {
    const sessionsData = getSessionsData();
    const sessions = Object.entries(sessionsData).map(([key, value]: [string, any]) => ({
      id: key,
      sessionId: value.sessionId,
      updatedAt: value.updatedAt,
      chatType: value.chatType,
      channel: value.deliveryContext?.channel || 'unknown',
      to: value.deliveryContext?.to || '',
      accountId: value.deliveryContext?.accountId || '',
    }));

    // 按更新时间排序
    sessions.sort((a, b) => b.updatedAt - a.updatedAt);

    res.json({ sessions });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * 获取会话统计
 * 注意：必须放在 /api/sessions/:id 之前，因为 Express 按顺序匹配路由
 */
app.get('/api/sessions/stats', (req, res) => {
  const sessionsPath = path.join(OPENCLAW_HOME, 'agents/main/sessions/sessions.json');

  if (!existsSync(sessionsPath)) {
    return res.status(404).json({ error: '会话文件不存在' });
  }

  try {
    const sessionsData = getSessionsData();
    const sessions = Object.values(sessionsData) as any[];

    const stats = {
      total: sessions.length,
      byChannel: {} as Record<string, number>,
      byChatType: {} as Record<string, number>,
    };

    sessions.forEach(session => {
      const channel = session.deliveryContext?.channel || 'unknown';
      const chatType = session.chatType || 'unknown';

      stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1;
      stats.byChatType[chatType] = (stats.byChatType[chatType] || 0) + 1;
    });

    res.json(stats);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * 获取会话详情
 */
app.get('/api/sessions/:id', (req, res) => {
  const sessionId = req.params.id;
  const sessionsPath = path.join(OPENCLAW_HOME, 'agents/main/sessions/sessions.json');

  if (!existsSync(sessionsPath)) {
    return res.status(404).json({ error: '会话文件不存在' });
  }

  try {
    const sessionsData = getSessionsData();
    const sessionEntry = Object.entries(sessionsData).find(([key]) => {
      const session = sessionsData[key];
      return session.sessionId === sessionId || key === sessionId;
    });

    if (!sessionEntry) {
      return res.status(404).json({ error: '会话不存在' });
    }

    const [sessionKey, sessionData] = sessionEntry;
    const sessionFile = sessionData.sessionFile;

    // 读取会话消息（不缓存，因为消息文件可能较大）
    let messages = [];
    if (sessionFile && existsSync(sessionFile)) {
      const content = readFileSync(sessionFile, 'utf-8');
      messages = content.split('\n').filter(line => line.trim()).map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);
    }

    res.json({
      id: sessionKey,
      sessionId: sessionData.sessionId,
      updatedAt: sessionData.updatedAt,
      chatType: sessionData.chatType,
      channel: sessionData.deliveryContext?.channel || 'unknown',
      messages: messages.slice(-100), // 只返回最后 100 条消息
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * 获取记忆系统状态
 */
app.get('/api/memory/status', (req, res) => {
  const memoryDbPath = path.join(OPENCLAW_HOME, 'memory/main.sqlite');
  const memoryMdPath = path.join(OPENCLAW_HOME, 'workspace/MEMORY.md');

  if (!existsSync(memoryDbPath)) {
    return res.status(404).json({ error: '记忆数据库不存在' });
  }

  try {
    const db = getMemoryDb();

    // 查询 meta 表
    const metaRow = db.prepare('SELECT value FROM meta WHERE key = ?').get('memory_index_meta_v1') as any;
    const metaConfig = metaRow ? JSON.parse(metaRow.value) : null;

    // 查询文件数量
    const fileCount = db.prepare('SELECT COUNT(*) as count FROM files').get() as any;

    // 读取 MEMORY.md 文件
    let memoryMdContent = '';
    if (existsSync(memoryMdPath)) {
      memoryMdContent = readFileSync(memoryMdPath, 'utf-8');
    }

    res.json({
      status: 'active',
      database: memoryDbPath,
      config: metaConfig,
      fileCount: fileCount?.count || 0,
      hasMemoryMd: existsSync(memoryMdPath),
      memoryMdPreview: memoryMdContent.slice(0, 1000), // 增加到 1000 字符
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * 获取记忆文件列表
 */
app.get('/api/memory/files', (req, res) => {
  const memoryDbPath = path.join(OPENCLAW_HOME, 'memory/main.sqlite');

  if (!existsSync(memoryDbPath)) {
    return res.status(404).json({ error: '记忆数据库不存在' });
  }

  try {
    const db = getMemoryDb();

    const files = db.prepare('SELECT path, source, hash, mtime, size FROM files ORDER BY mtime DESC LIMIT 100').all() as any[];

    res.json({
      files: files.map(f => ({
        path: f.path,
        source: f.source,
        hash: f.hash,
        mtime: f.mtime,
        size: f.size,
      })),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * 获取记忆内容
 */
app.get('/api/memory/content/:path(*)', (req, res) => {
  const requestedPath = req.params.path;
  const memoryRoot = path.join(OPENCLAW_HOME, 'workspace');
  const fullPath = path.join(memoryRoot, requestedPath);

  // 安全检查
  if (!fullPath.startsWith(memoryRoot)) {
    return res.status(403).json({ error: '不允许访问该路径' });
  }

  if (!existsSync(fullPath)) {
    return res.status(404).json({ error: '文件不存在' });
  }

  try {
    const content = readFileSync(fullPath, 'utf-8');
    res.json({
      path: requestedPath,
      content,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * 获取定时任务列表
 */
app.get('/api/cron', (req, res) => {
  const cronJobsPath = path.join(OPENCLAW_HOME, 'cron/jobs.json');

  if (!existsSync(cronJobsPath)) {
    return res.status(404).json({ error: '定时任务文件不存在' });
  }

  try {
    const cronData = JSON.parse(readFileSync(cronJobsPath, 'utf-8'));

    res.json({
      version: cronData.version,
      jobs: cronData.jobs || [],
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * 获取定时任务运行历史
 */
app.get('/api/cron/:id/runs', (req, res) => {
  const jobId = req.params.id;
  const cronRunsPath = path.join(OPENCLAW_HOME, 'cron/runs', `${jobId}.jsonl`);

  if (!existsSync(cronRunsPath)) {
    return res.json({ runs: [] }); // 返回空数组而不是 404
  }

  try {
    const content = readFileSync(cronRunsPath, 'utf-8');
    const runs = content.split('\n').filter(line => line.trim()).map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);

    res.json({
      jobId,
      runs: runs.slice(-50), // 只返回最后 50 条
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * 获取子代理状态
 */
app.get('/api/subagents', (req, res) => {
  const subagentsPath = path.join(OPENCLAW_HOME, 'subagents/runs.json');

  if (!existsSync(subagentsPath)) {
    return res.status(404).json({ error: '子代理文件不存在' });
  }

  try {
    const subagentsData = JSON.parse(readFileSync(subagentsPath, 'utf-8'));

    res.json({
      version: subagentsData.version,
      runs: subagentsData.runs || {},
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * 获取 HEARTBEAT.md 内容
 */
app.get('/api/heartbeat/config', (req, res) => {
  const heartbeatPath = path.join(OPENCLAW_HOME, 'workspace/HEARTBEAT.md');

  if (!existsSync(heartbeatPath)) {
    return res.json({
      exists: false,
      content: '',
    });
  }

  try {
    const content = readFileSync(heartbeatPath, 'utf-8');
    res.json({
      exists: true,
      content,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * 获取今日待办
 */
app.get('/api/todos/today', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const todosPath = path.join(OPENCLAW_HOME, 'workspace/todo', `${today}.md`);

  if (!existsSync(todosPath)) {
    return res.json({
      exists: false,
      date: today,
      content: '',
    });
  }

  try {
    const content = readFileSync(todosPath, 'utf-8');
    res.json({
      exists: true,
      date: today,
      content,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ============ 服务静态前端 ============
if (!isDev) {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// ============ 启动服务器 ============
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🦞 OpenClaw Dashboard 运行在 http://0.0.0.0:${PORT}`);
  console.log(`📁 文件根目录：${FILE_ROOT}`);
  console.log(`🔧 模式：${isDev ? '开发 (Vite HMR)' : '生产'}\n`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
