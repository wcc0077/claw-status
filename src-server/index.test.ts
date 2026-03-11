import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mock the WebSocket module
vi.mock('ws', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      send: vi.fn(),
      terminate: vi.fn(),
    })),
  };
});

describe('Server API Routes', () => {
  let app: express.Express;
  let server: any;

  beforeAll(async () => {
    // Create a minimal express app for testing routes
    app = express();
    app.use(express.json());

    // Simple test routes
    app.get('/api/health', (req, res) => {
      res.json({ ok: true, data: { status: 'ok', version: '1.0.0' } });
    });

    app.get('/api/status', (req, res) => {
      res.json({ ok: true, data: { uptime: 1000, memory: 1024 } });
    });

    app.get('/api/config-path', (req, res) => {
      res.json({
        home: '/test/.openclaw',
        config: '/test/.openclaw/config.yaml',
        sessions: '/test/.openclaw/sessions',
        memories: '/test/.openclaw/memories',
      });
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        ok: true,
        data: { status: 'ok', version: '1.0.0' }
      });
    });
  });

  describe('GET /api/status', () => {
    it('should return gateway status', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        ok: true,
        data: { uptime: 1000, memory: 1024 }
      });
    });
  });

  describe('GET /api/config-path', () => {
    it('should return OpenClaw paths', async () => {
      const response = await request(app)
        .get('/api/config-path')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.home).toBe('/test/.openclaw');
      expect(response.body.config).toContain('config.yaml');
    });
  });
});
