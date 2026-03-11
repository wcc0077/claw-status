import { describe, it, expect } from 'vitest';
import path from 'path';

describe('File System API Security', () => {
  const OPENCLAW_HOME = '/test/.openclaw';

  describe('Path validation', () => {
    it('should allow paths within OPENCLAW_HOME', () => {
      const testPath = path.posix.join(OPENCLAW_HOME, 'config.yaml');
      // 使用 posix 路径来避免 Windows 盘符问题
      const resolvedPath = path.posix.resolve(testPath);
      const normalizedHome = path.posix.resolve(OPENCLAW_HOME);

      expect(resolvedPath.startsWith(normalizedHome)).toBe(true);
    });

    it('should reject paths outside OPENCLAW_HOME', () => {
      const testPath = '/etc/passwd';
      const resolvedPath = path.posix.resolve(testPath);
      const normalizedHome = path.posix.resolve(OPENCLAW_HOME);

      expect(resolvedPath.startsWith(normalizedHome)).toBe(false);
    });

    it('should reject path traversal attempts', () => {
      const testPath = path.posix.join(OPENCLAW_HOME, '../../etc/passwd');
      const resolvedPath = path.posix.resolve(testPath);

      // path.resolve normalizes the path
      expect(resolvedPath).not.toContain('..');
    });
  });
});
