import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import path from 'path';

// 测试用的临时目录
const TEST_ROOT = path.join(process.cwd(), 'test-api-temp');

describe('File System API Integration Tests', () => {
  const testAgent = request('http://localhost:3999');

  beforeAll(() => {
    // 创建测试目录
    if (!existsSync(TEST_ROOT)) {
      mkdirSync(TEST_ROOT, { recursive: true });
    }
    console.log(`测试目录：${TEST_ROOT}`);
  });

  afterAll(() => {
    // 清理测试目录
    if (existsSync(TEST_ROOT)) {
      rmSync(TEST_ROOT, { recursive: true, force: true });
    }
  });

  describe('POST /api/files/create', () => {
    it('should create a file', async () => {
      const response = await testAgent
        .post('/api/files/create')
        .send({
          path: 'test-create-file.txt',
          isDirectory: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    it('should create a directory', async () => {
      const response = await testAgent
        .post('/api/files/create')
        .send({
          path: 'test-create-dir',
          isDirectory: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    it('should return 400 when file already exists', async () => {
      // 先创建文件
      await testAgent.post('/api/files/create').send({
        path: 'existing.txt',
        isDirectory: false,
      });

      // 再次创建应该失败
      const response = await testAgent
        .post('/api/files/create')
        .send({
          path: 'existing.txt',
          isDirectory: false,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/files', () => {
    it('should delete a file', async () => {
      // 先创建文件
      await testAgent.post('/api/files/create').send({
        path: 'to-delete.txt',
        isDirectory: false,
      });

      const response = await testAgent
        .delete('/api/files')
        .send({
          path: 'to-delete.txt',
          recursive: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    it('should return 400 for non-empty directory without recursive', async () => {
      // 创建目录和文件
      await testAgent.post('/api/files/create').send({
        path: 'dir-with-files',
        isDirectory: true,
      });
      await testAgent.post('/api/files/create').send({
        path: 'dir-with-files/file.txt',
        isDirectory: false,
      });

      const response = await testAgent
        .delete('/api/files')
        .send({
          path: 'dir-with-files',
          recursive: false,
        });

      expect(response.status).toBe(400);
    });

    it('should delete directory with recursive=true', async () => {
      const response = await testAgent
        .delete('/api/files')
        .send({
          path: 'dir-with-files',
          recursive: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });
  });

  describe('PUT /api/files/rename', () => {
    it('should rename a file', async () => {
      // 先创建文件
      await testAgent.post('/api/files/create').send({
        path: 'old-name.txt',
        isDirectory: false,
      });

      const response = await testAgent
        .put('/api/files/rename')
        .send({
          oldPath: 'old-name.txt',
          newPath: 'new-name.txt',
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.oldPath).toContain('old-name.txt');
      expect(response.body.newPath).toContain('new-name.txt');
    });

    it('should return 404 when old path does not exist', async () => {
      const response = await testAgent
        .put('/api/files/rename')
        .send({
          oldPath: 'non-existent.txt',
          newPath: 'something.txt',
        });

      expect(response.status).toBe(404);
    });

    it('should return 400 when new path already exists', async () => {
      // 创建两个文件
      await testAgent.post('/api/files/create').send({
        path: 'file1.txt',
        isDirectory: false,
      });
      await testAgent.post('/api/files/create').send({
        path: 'file2.txt',
        isDirectory: false,
      });

      // 尝试重命名为已存在的文件
      const response = await testAgent
        .put('/api/files/rename')
        .send({
          oldPath: 'file1.txt',
          newPath: 'file2.txt',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/files/move', () => {
    it('should move a file', async () => {
      // 先创建文件
      await testAgent.post('/api/files/create').send({
        path: 'source.txt',
        isDirectory: false,
      });

      const response = await testAgent
        .put('/api/files/move')
        .send({
          sourcePath: 'source.txt',
          destPath: 'dest/subfolder/dest.txt',
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    it('should return 404 when source does not exist', async () => {
      const response = await testAgent
        .put('/api/files/move')
        .send({
          sourcePath: 'non-existent.txt',
          destPath: 'dest.txt',
        });

      expect(response.status).toBe(404);
    });
  });
});
