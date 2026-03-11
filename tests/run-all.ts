#!/usr/bin/env node

/**
 * 测试运行脚本 - 统一运行所有测试
 *
 * 用法：
 *   npm run test:all          - 运行所有测试
 *   npm run test:all --watch  - 监视模式
 *   npm run test:all --ui     - 打开 Vitest UI
 */

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

const isWatch = args.includes('--watch');
const isUI = args.includes('--ui');
const isCoverage = args.includes('--coverage');

async function runCommand(cmd: string, cwd?: string) {
  return new Promise<number>((resolve) => {
    const [command, ...cmdArgs] = cmd.split(' ');
    const child = spawn(command, cmdArgs, {
      stdio: 'inherit',
      cwd: cwd || __dirname,
      shell: true,
    });

    child.on('close', (code) => {
      resolve(code || 0);
    });
  });
}

async function main() {
  console.log('='.repeat(50));
  console.log('OpenClaw Dashboard 测试套件');
  console.log('='.repeat(50));
  console.log();

  // 后端测试
  console.log('📦 运行后端测试...');
  const serverArgs = ['vitest', 'run'];
  if (isWatch) serverArgs.push('--watch');
  if (isUI) serverArgs.push('--ui');
  if (isCoverage) serverArgs.push('--coverage');

  const serverCode = await runCommand(
    `npx ${serverArgs.join(' ')}`
  );

  if (serverCode !== 0) {
    console.error('❌ 后端测试失败');
    process.exit(1);
  }

  console.log();
  console.log('✅ 后端测试通过');
  console.log();

  // 前端测试
  console.log('📦 运行前端测试...');
  const clientArgs = ['vitest', 'run', '--config', 'vite.test.config.ts'];
  if (isWatch) clientArgs.push('--watch');
  if (isCoverage) clientArgs.push('--coverage');

  const clientCode = await runCommand(
    `npx ${clientArgs.join(' ')}`,
    join(__dirname, 'client')
  );

  if (clientCode !== 0) {
    console.error('❌ 前端测试失败');
    process.exit(1);
  }

  console.log();
  console.log('✅ 前端测试通过');
  console.log();
  console.log('='.repeat(50));
  console.log('🎉 所有测试通过！');
  console.log('='.repeat(50));
}

main().catch((err) => {
  console.error('测试运行异常:', err);
  process.exit(1);
});
