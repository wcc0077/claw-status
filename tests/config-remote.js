#!/usr/bin/env node

/**
 * 快速配置远程 Gateway 连接
 *
 * 用法：
 *   node tests/config-remote.js
 *   node tests/config-remote.js 43.163.246.185 18789
 */

import { writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => {
  rl.question(query, resolve);
});

async function main() {
  console.log('🦞 OpenClaw Dashboard - 远程配置向导\n');

  // 默认配置
  let remoteHost = '43.163.246.185';
  let gatewayPort = '18789';
  let dashboardPort = '3000';
  let openclawHome = '/root/.openclaw';

  // 从命令行参数读取
  if (process.argv[2]) {
    remoteHost = process.argv[2];
  }
  if (process.argv[3]) {
    gatewayPort = process.argv[3];
  }

  console.log(`当前配置：`);
  console.log(`  远程服务器：${remoteHost}`);
  console.log(`  Gateway 端口：${gatewayPort}`);
  console.log(`  Dashboard 端口：${dashboardPort}`);
  console.log(`  OpenClaw 主目录：${openclawHome}\n`);

  const useTunnel = await question('使用 SSH 隧道连接？(Y/n): ');

  if (useTunnel.toLowerCase() !== 'n') {
    console.log('\n使用 SSH 隧道模式');
    console.log(`\n步骤 1: 打开新终端，运行 SSH 命令：`);
    console.log(`   ssh -L ${gatewayPort}:localhost:${gatewayPort} root@${remoteHost}`);
    console.log(`\n步骤 2: 在本终端继续配置\n`);

    const tunnelReady = await question('SSH 隧道已建立？(Y/n): ');
    if (tunnelReady.toLowerCase() === 'n') {
      console.log('请先建立 SSH 隧道，然后重新运行此脚本');
      rl.close();
      return;
    }

    // 隧道模式：Gateway 通过 localhost 连接
    gatewayPort = 'localhost:' + gatewayPort;
  }

  // 生成 .env 文件
  const envContent = `# OpenClaw Dashboard 配置
# 由 config-remote.js 生成

# Dashboard 服务端口
DASHBOARD_PORT=${dashboardPort}

# Gateway WebSocket 地址
OPENCLAW_GATEWAY_URL=ws://${gatewayPort}

# OpenClaw 主目录（服务器上的路径）
OPENCLAW_HOME=${openclawHome}

# 远程服务器地址（仅供参考）
REMOTE_HOST=${remoteHost.replace('localhost:', '')}
`;

  const envPath = path.join(__dirname, '..', '.env');

  if (existsSync(envPath)) {
    const overwrite = await question('.env 文件已存在，是否覆盖？(y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('已取消配置');
      rl.close();
      return;
    }
  }

  writeFileSync(envPath, envContent);
  console.log(`\n✅ 配置已保存到 ${envPath}`);

  console.log('\n下一步操作：');
  console.log('  1. 运行 npm run dev 启动开发服务器');
  console.log(`  2. 访问 http://localhost:5173`);
  console.log('  3. 如果需要生产部署，运行 npm run build && npm start');

  rl.close();
}

main().catch(console.error);
