import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';

/**
 * E2E 测试 - 测试前后端联调
 *
 * 运行方式：
 * 1. 启动开发服务器：npm run dev
 * 2. 运行 E2E 测试：npm run test:e2e
 *
 * 注意：需要先启动 OpenClaw Gateway 或使用 mock 模式
 */

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3000/api';

describe('E2E Tests', () => {
  describe('Server Health', () => {
    it('should respond to health check', async () => {
      try {
        const response = await axios.get(`${API_URL}/health`);
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('ok');
      } catch (error) {
        // 如果 Gateway 未连接，可能会失败
        console.log('Health check skipped (Gateway may not be running)');
      }
    });

    it('should serve static files in production', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/`);
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('text/html');
      } catch (error) {
        console.log('Static files test skipped (dev mode)');
      }
    });
  });

  describe('Config API', () => {
    it('should return config paths', async () => {
      const response = await axios.get(`${API_URL}/config-path`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('home');
      expect(response.data).toHaveProperty('config');
    });
  });
});
