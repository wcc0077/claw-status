#!/usr/bin/env node
/**
 * 归档 Claude Code 产生的临时文件
 * 将临时文件移动到 .archive/ 而不是删除
 * 保持 docs/ 目录干净
 *
 * 用法:
 *   npm run archive            # 执行归档
 *   npm run archive:check      # 仅检查，不移动
 */

import { readdir, mkdir, rename } from 'fs/promises';
import { join, extname } from 'path';

const ROOT = process.cwd();
const ARCHIVE_DIR = join(ROOT, '.archive');

// 保留的目录（这些目录中的文件不会被归档）
const KEEP_DIRS = new Set(['node_modules', '.git', '.claude', 'client', 'src-server', 'tests', 'scripts', 'docs', 'memory']);

// 保留的文件（根目录永远保留这些）
const KEEP_FILES = new Set(['CLAUDE.md', 'README.md']);

// 要归档的模式
const ARCHIVE_PATTERNS = [
  /.*-plan\.md$/i,
  /.*_plan\.md$/i,
  /.*-todo\.md$/i,
  /.*\.tmp\.md$/i,
  /.*-task\.md$/i,
  /^task-.*\.md$/i,
  /^TODO\.md$/i,
  /^TASKS\.md$/i,
  /^notes.*\.md$/i,
  /progress\.md/,
  /findings\.md/,
];

function shouldArchive(name) {
  const lowerName = name.toLowerCase();

  for (const pattern of ARCHIVE_PATTERNS) {
    // 如果是正则表达式，使用 test 方法
    if (pattern instanceof RegExp) {
      if (pattern.test(name)) return true;
    }
    // 如果是字符串，精确匹配（忽略大小写）
    else if (typeof pattern === 'string') {
      if (pattern.toLowerCase() === lowerName) return true;
    }
  }

  return false;
}

function generateArchiveName(name) {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  return `${date}-${time}-${name}`;
}

async function findArchivableFiles() {
  const files = [];

  try {
    const entries = await readdir(ROOT, { withFileTypes: true });

    for (const entry of entries) {
      // 跳过保留目录
      if (entry.isDirectory()) {
        if (KEEP_DIRS.has(entry.name)) continue;

        // tasks 目录整体归档
        if (entry.name === 'tasks') {
          files.push({
            type: 'dir',
            path: 'tasks/',
            fullPath: join(ROOT, entry.name)
          });
          continue;
        }
        continue;
      }

      // 检查 MD 文件
      if (entry.isFile() && extname(entry.name) === '.md') {
        if (shouldArchive(entry.name)) {
          files.push({
            type: 'file',
            path: entry.name,
            fullPath: join(ROOT, entry.name)
          });
        }
      }
    }
  } catch (error) {
    console.error('扫描失败:', error.message);
  }

  return files;
}

async function archive(dryRun = false) {
  const archived = [];
  const errors = [];

  try {
    // 确保归档目录存在
    if (!dryRun) {
      await mkdir(ARCHIVE_DIR, { recursive: true });
    }

    const files = await findArchivableFiles();

    for (const file of files) {
      const archiveName = file.type === 'dir'
        ? `tasks-${generateArchiveName('tasks')}`
        : generateArchiveName(file.path);

      const destPath = join(ARCHIVE_DIR, archiveName);

      if (dryRun) {
        archived.push(`${file.path} → .archive/${archiveName}`);
      } else {
        try {
          await rename(file.fullPath, destPath);
          archived.push(`${file.path} → .archive/${archiveName}`);
        } catch (error) {
          errors.push(`${file.path}: ${error.message}`);
        }
      }
    }

    if (dryRun) {
      console.log('🔍 检查模式 - 以下文件将被归档:\n');
      archived.forEach(f => console.log(`   - ${f}`));
      if (archived.length === 0) {
        console.log('   ✅ 没有需要归档的文件');
      }
      console.log(`\n共 ${archived.length} 个文件/目录`);
    } else {
      console.log('📦 归档完成:\n');
      archived.forEach(f => console.log(`   - ${f}`));
      if (errors.length > 0) {
        console.log('\n❌ 失败:\n');
        errors.forEach(e => console.log(`   - ${e}`));
      }
      console.log(`\n成功归档 ${archived.length} 个文件/目录`);
      if (errors.length === 0 && archived.length === 0) {
        console.log('   没有需要归档的文件');
      }
    }
  } catch (error) {
    console.error('归档失败:', error.message);
    process.exit(1);
  }
}

// 主程序
const args = process.argv.slice(2);
const isCheckMode = args.includes('--check') || args.includes('-c');

if (isCheckMode) {
  await archive(true);
} else {
  await archive(false);
}
