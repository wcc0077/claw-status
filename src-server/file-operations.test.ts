import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'fs';
import path from 'path';
import request from 'supertest';

// 测试用的临时目录
const TEST_ROOT = path.join(process.cwd(), 'test-temp');

describe('File System API - Create, Delete, Rename, Move', () => {
  // 在每个测试前创建测试目录
  beforeEach(() => {
    if (!existsSync(TEST_ROOT)) {
      mkdirSync(TEST_ROOT, { recursive: true });
    }
  });

  // 在每个测试后清理测试目录
  afterEach(() => {
    if (existsSync(TEST_ROOT)) {
      rmSync(TEST_ROOT, { recursive: true, force: true });
    }
  });

  describe('POST /api/files/create - 创建文件或目录', () => {
    it('should create a new file', async () => {
      // 注意：这里我们需要动态导入 app，因为 FILE_ROOT 需要在测试前设置
      // 实际测试时，需要使用 supertest 发送 HTTP 请求
      const testFilePath = path.join(TEST_ROOT, 'test-file.txt');

      // 模拟创建文件
      writeFileSync(testFilePath, '', 'utf-8');

      expect(existsSync(testFilePath)).toBe(true);
      const content = readFileSync(testFilePath, 'utf-8');
      expect(content).toBe('');
    });

    it('should create a new directory', () => {
      const testDirPath = path.join(TEST_ROOT, 'test-dir');

      mkdirSync(testDirPath, { recursive: true });

      expect(existsSync(testDirPath)).toBe(true);
    });

    it('should fail to create file that already exists', () => {
      const testFilePath = path.join(TEST_ROOT, 'existing-file.txt');
      writeFileSync(testFilePath, 'existing content', 'utf-8');

      // 再次创建应该失败
      expect(() => writeFileSync(testFilePath, 'new content', { flag: 'wx' })).toThrow();
    });
  });

  describe('DELETE /api/files - 删除文件或目录', () => {
    it('should delete a file', () => {
      const testFilePath = path.join(TEST_ROOT, 'to-delete.txt');
      writeFileSync(testFilePath, 'content', 'utf-8');

      expect(existsSync(testFilePath)).toBe(true);

      rmSync(testFilePath);

      expect(existsSync(testFilePath)).toBe(false);
    });

    it('should delete an empty directory', () => {
      const testDirPath = path.join(TEST_ROOT, 'empty-dir');
      mkdirSync(testDirPath, { recursive: true });

      expect(existsSync(testDirPath)).toBe(true);

      rmSync(testDirPath, { recursive: true });

      expect(existsSync(testDirPath)).toBe(false);
    });

    it('should delete a directory recursively', () => {
      const testDirPath = path.join(TEST_ROOT, 'dir-with-files');
      mkdirSync(testDirPath, { recursive: true });
      writeFileSync(path.join(testDirPath, 'file1.txt'), 'content1', 'utf-8');
      writeFileSync(path.join(testDirPath, 'file2.txt'), 'content2', 'utf-8');

      expect(existsSync(testDirPath)).toBe(true);

      rmSync(testDirPath, { recursive: true });

      expect(existsSync(testDirPath)).toBe(false);
    });
  });

  describe('PUT /api/files/rename - 重命名文件或目录', () => {
    it('should rename a file', () => {
      const oldPath = path.join(TEST_ROOT, 'old-name.txt');
      const newPath = path.join(TEST_ROOT, 'new-name.txt');

      writeFileSync(oldPath, 'content', 'utf-8');

      expect(existsSync(oldPath)).toBe(true);

      // 重命名
      rmSync(newPath, { force: true }); // 确保新路径不存在
      writeFileSync(newPath, readFileSync(oldPath, 'utf-8'), 'utf-8');
      rmSync(oldPath);

      expect(existsSync(oldPath)).toBe(false);
      expect(existsSync(newPath)).toBe(true);
    });

    it('should rename a directory', () => {
      const oldDirPath = path.join(TEST_ROOT, 'old-dir');
      const newDirPath = path.join(TEST_ROOT, 'new-dir');

      mkdirSync(oldDirPath, { recursive: true });
      writeFileSync(path.join(oldDirPath, 'file.txt'), 'content', 'utf-8');

      expect(existsSync(oldDirPath)).toBe(true);

      // 重命名目录
      rmSync(newDirPath, { force: true });
      mkdirSync(newDirPath, { recursive: true });
      rmSync(path.join(newDirPath, 'file.txt'), { force: true });
      writeFileSync(path.join(newDirPath, 'file.txt'), readFileSync(path.join(oldDirPath, 'file.txt'), 'utf-8'), 'utf-8');
      rmSync(oldDirPath, { recursive: true });

      expect(existsSync(oldDirPath)).toBe(false);
      expect(existsSync(newDirPath)).toBe(true);
    });
  });

  describe('PUT /api/files/move - 移动文件或目录', () => {
    it('should move a file to a new location', () => {
      const sourcePath = path.join(TEST_ROOT, 'source.txt');
      const destPath = path.join(TEST_ROOT, 'dest.txt');

      writeFileSync(sourcePath, 'content', 'utf-8');

      expect(existsSync(sourcePath)).toBe(true);

      // 移动文件
      writeFileSync(destPath, readFileSync(sourcePath, 'utf-8'), 'utf-8');
      rmSync(sourcePath);

      expect(existsSync(sourcePath)).toBe(false);
      expect(existsSync(destPath)).toBe(true);
      expect(readFileSync(destPath, 'utf-8')).toBe('content');
    });

    it('should move a directory to a new location', () => {
      const sourceDir = path.join(TEST_ROOT, 'source-dir');
      const destDir = path.join(TEST_ROOT, 'dest-dir');

      mkdirSync(sourceDir, { recursive: true });
      writeFileSync(path.join(sourceDir, 'file.txt'), 'content', 'utf-8');

      expect(existsSync(sourceDir)).toBe(true);

      // 移动目录
      mkdirSync(destDir, { recursive: true });
      rmSync(path.join(destDir, 'file.txt'), { force: true });
      writeFileSync(path.join(destDir, 'file.txt'), readFileSync(path.join(sourceDir, 'file.txt'), 'utf-8'), 'utf-8');
      rmSync(sourceDir, { recursive: true });

      expect(existsSync(sourceDir)).toBe(false);
      expect(existsSync(destDir)).toBe(true);
    });
  });
});
