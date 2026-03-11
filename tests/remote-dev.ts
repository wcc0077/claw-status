# 远程联调脚本 - 用于连接远程 OpenClaw Gateway

#!/usr/bin/env node

/**
 * 用法：
 * 1. 本地开发模式（通过 SSH 隧道）
 *    ssh -L 18789:localhost:18789 root@43.163.246.185
 *    npm run dev:remote
 *
 * 2. 直接连接远程 Gateway（需要 Gateway 开放外网访问）
 *    npm run dev:remote
 */

import { spawn } from 'child_process';
import axios from 'axios';
import { setTimeout } from 'timers/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 配置
const CONFIG = {
  // 远程服务器
  remoteHost: process.env.REMOTE_HOST || '43.163.246.185',
  gatewayPort: process.env.GATEWAY_PORT || '18789',
  dashboardPort: process.env.DASHBOARD_PORT || '3000',

  // 本地开发
  localGatewayPort: process.env.LOCAL_GATEWAY_PORT || '18789',
};

const GATEWAY_URL = `ws://localhost:${CONFIG.localGatewayPort}`;

const log = (msg) => console.log(`[远程联调] ${msg}`);
const error = (msg) => console.error(`[远程联调] ❌ ${msg}`);
const success = (msg) => console.log(`[远程联调] ✅ ${msg}`);

// 创建 .env 文件
const envContent = `DASHBOARD_PORT=${CONFIG.dashboardPort}
OPENCLAW_GATEWAY_URL=${GATEWAY_URL}
OPENCLAW_HOME=/root/.openclaw
REMOTE_HOST=${CONFIG.remoteHost}
`;

async function checkGateway() {
  log('检查 Gateway 连接...');

  try {
    const response = await axios.get(`http://localhost:${CONFIG.localGatewayPort}/health`, {
      timeout: 3000,
    });
    success(`Gateway 已连接：${response.data.status}`);
    return true;
  } catch (e) {
    error(`Gateway 未连接 (localhost:${CONFIG.localGatewayPort})`);
    return false;
  }
}

async function promptSSHReminder() {
  log('\n=== 连接远程 Gateway 的步骤 ===\n');
  log('1. 打开新终端，运行 SSH 隧道命令：');
  console.log(`   ssh -L ${CONFIG.localGatewayPort}:localhost:${CONFIG.localGatewayPort} root@${CONFIG.remoteHost}`);
  log('\n2. 在另一个终端运行：');
  console.log('   npm run dev');
  log('\n3. 访问：http://localhost:3000\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('按回车键继续检测 Gateway...', () => {
      rl.close();
      resolve();
    });
  });
}

async function main() {
  log('远程联调模式\n');
  log(`远程服务器：${CONFIG.remoteHost}`);
  log(`Gateway 端口：${CONFIG.gatewayPort}`);
  log(`本地映射端口：${CONFIG.localGatewayPort}\n`);

  // 写入临时 .env
  import('fs').then(fs => {
    fs.writeFileSync(path.join(__dirname, '..', '.env'), envContent);
    log('已写入 .env 配置文件');
  });

  // 检查 Gateway
  const connected = await checkGateway();

  if (!connected) {
    await promptSSHReminder();
    const stillNotConnected = !(await checkGateway());
    if (stillNotConnected) {
      error('无法连接 Gateway，请确保 SSH 隧道已建立');
      process.exit(1);
    }
  }

  // 启动开发服务器
  log('\n启动开发服务器...');
  const isWindows = process.platform === 'win32';
  const serverProcess = spawn(
    isWindows ? 'cmd' : 'npx',
    isWindows ? ['/c', 'tsx', 'watch', 'src-server/index.ts'] : ['tsx', 'watch', 'src-server/index.ts'],
    {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    }
  );

  serverProcess.on('close', (code) => {
    log(`服务器已停止 (exit code: ${code})`);
  });
}

main();
