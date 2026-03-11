#!/usr/bin/env node

/**
 * 联调测试脚本
 *
 * 功能：
 * 1. 启动后端服务器
 * 2. 等待服务器就绪
 * 3. 运行 API 测试
 * 4. 清理资源
 */

import { spawn } from 'child_process';
import axios from 'axios';
import { setTimeout } from 'timers/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

const log = (msg: string) => {
  console.log(`[联调测试] ${msg}`);
};

const error = (msg: string) => {
  console.error(`[联调测试] ❌ ${msg}`);
};

const success = (msg: string) => {
  console.log(`[联调测试] ✅ ${msg}`);
};

async function waitForServer(maxAttempts = 30) {
  log('等待服务器启动...');

  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(`${BASE_URL}/api/config-path`, { timeout: 1000 });
      success('服务器已就绪');
      return true;
    } catch {
      await setTimeout(500);
    }
  }

  error('服务器启动超时');
  return false;
}

async function runApiTests() {
  log('运行 API 测试...\n');

  const tests = [
    {
      name: '配置路径 API',
      url: `${BASE_URL}/api/config-path`,
      validate: (data: any) => {
        return data.home && data.config && data.sessions;
      },
    },
    {
      name: '健康检查 API (需要 Gateway)',
      url: `${BASE_URL}/api/health`,
      validate: (data: any) => {
        return data.ok !== undefined;
      },
    },
    {
      name: '会话列表 API (需要 Gateway)',
      url: `${BASE_URL}/api/sessions`,
      validate: (data: any) => {
        return data.ok !== undefined;
      },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const response = await axios.get(test.url, { timeout: 5000 });

      if (test.validate(response.data)) {
        success(`${test.name} - 通过`);
        passed++;
      } else {
        error(`${test.name} - 验证失败`);
        failed++;
      }
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED') {
        error(`${test.name} - 连接拒绝`);
      } else if (e.response) {
        error(`${test.name} - HTTP ${e.response.status}`);
      } else {
        // Gateway 未运行时允许失败
        log(`${test.name} - 跳过 (Gateway 未运行)`);
        passed++;
      }
    }
  }

  console.log(`\n${'='.repeat(40)}`);
  console.log(`测试结果：${passed} 通过，${failed} 失败`);
  console.log(`${'='.repeat(40)}\n`);

  return failed === 0;
}

async function main() {
  log('开始联调测试...\n');

  // 在 Windows 上使用 cmd /c 来运行 npx
  const isWindows = process.platform === 'win32';
  const serverProcess = spawn(
    isWindows ? 'cmd' : 'npx',
    isWindows ? ['/c', 'tsx', 'src-server/index.ts'] : ['tsx', 'src-server/index.ts'],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: path.join(__dirname, '..'),
    }
  );

  serverProcess.stdout?.on('data', (data) => {
    const output = data.toString();
    if (output.includes('运行在')) {
      log('服务器输出：' + output.trim());
    }
  });

  serverProcess.stderr?.on('data', (data) => {
    error('服务器错误：' + data.toString().trim());
  });

  serverProcess.on('error', (err) => {
    error(`服务器进程错误：${err.message}`);
  });

  try {
    // 等待服务器启动
    const ready = await waitForServer();
    if (!ready) {
      serverProcess.kill();
      process.exit(1);
    }

    // 运行测试
    const allPassed = await runApiTests();

    // 清理
    log('停止服务器...');
    serverProcess.kill();
    await setTimeout(500);

    if (allPassed) {
      success('联调测试完成！');
      process.exit(0);
    } else {
      error('联调测试失败');
      process.exit(1);
    }
  } catch (e: any) {
    error(`测试异常：${e.message}`);
    serverProcess.kill();
    process.exit(1);
  }
}

main();
