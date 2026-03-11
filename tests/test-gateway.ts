/**
 * Gateway WebSocket 测试脚本
 * 用于诊断与云端 Gateway 的连接问题
 *
 * Gateway 认证流程:
 * 1. 连接后收到 connect.challenge 事件 (包含 nonce)
 * 2. 发送 connect.auth 事件进行认证
 */

import WebSocket from 'ws';
import crypto from 'crypto';

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'ws://43.163.246.185:18789';
const API_KEY = process.env.OPENCLAW_API_KEY || '';

console.log(`🦞 OpenClaw Gateway 测试工具`);
console.log(`目标地址：${GATEWAY_URL}`);
console.log(`API Key: ${API_KEY ? '已配置' : '未配置'}\n`);

let ws: WebSocket | null = null;
let rpcId = 0;
let challengeNonce: string | null = null;

function callGateway(method: string, params?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return reject(new Error('WebSocket 未连接'));
    }

    const id = ++rpcId;
    const timeout = setTimeout(() => {
      reject(new Error(`调用 ${method} 超时`));
    }, 10000);

    ws.once(`result:${id}`, (data) => {
      clearTimeout(timeout);
      resolve(data);
    });

    ws.once(`error:${id}`, (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    const message = {
      jsonrpc: '2.0' as const,
      id,
      method,
      params: params || {}
    };

    console.log(`发送请求：${method}`);
    ws.send(JSON.stringify(message));
  });
}

async function testGateway() {
  return new Promise<void>((resolve, reject) => {
    ws = new WebSocket(GATEWAY_URL, {
      protocol: 'openclaw-rpc',
    });

    ws.on('open', () => {
      console.log('✅ WebSocket 连接成功\n');
    });

    ws.on('close', (code) => {
      console.log(`连接关闭，退出码：${code}`);
    });

    ws.on('error', (err) => {
      console.error('❌ WebSocket 错误:', err.message);
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());

        // 处理认证挑战
        if (msg.type === 'event' && msg.event === 'connect.challenge') {
          challengeNonce = msg.payload?.nonce;
          console.log('收到认证挑战:', challengeNonce);

          if (!API_KEY) {
            console.log('❌ 需要 API_KEY 进行认证');
            console.log('请在 .env 文件中设置 OPENCLAW_API_KEY');
            return;
          }

          // 使用 API_KEY 对 nonce 进行 HMAC-SHA256 签名
          const signature = crypto
            .createHmac('sha256', API_KEY)
            .update(challengeNonce)
            .digest('hex');

          console.log('生成签名:', signature);

          // 发送认证响应
          const authMessage = {
            jsonrpc: '2.0' as const,
            id: ++rpcId,
            method: 'connect.auth',
            params: {
              nonce: challengeNonce,
              signature
            }
          };

          console.log('发送认证请求...\n');
          ws?.send(JSON.stringify(authMessage));
          return;
        }

        // 处理认证响应
        if (msg.type === 'event' && msg.event === 'connect.auth') {
          if (msg.payload?.success) {
            console.log('✅ 认证成功!\n');
            runTests().catch(console.error);
          } else {
            console.log('❌ 认证失败:', msg.payload?.error);
          }
          return;
        }

        // 处理 RPC 响应
        console.log(`收到响应:`, JSON.stringify(msg, null, 2));
        if (msg.id) {
          if (msg.error) {
            ws?.emit(`error:${msg.id}`, new Error(msg.error.message || msg.error));
          } else if (msg.result !== undefined) {
            ws?.emit(`result:${msg.id}`, msg.result);
          }
        }
      } catch (e) {
        console.error('解析消息失败:', e);
      }
    });

    // 连接后等待认证挑战
    setTimeout(() => {
      if (!challengeNonce) {
        console.log('未收到认证挑战，可能连接已断开');
      }
    }, 5000);
  });
}

async function runTests() {
  console.log('📋 开始测试 RPC 方法...\n');

  // 测试 1: health
  try {
    console.log('[测试 1] health...');
    const health = await callGateway('health', {});
    console.log('✅ health:', JSON.stringify(health, null, 2), '\n');
  } catch (e: any) {
    console.log('❌ health 失败:', e.message, '\n');
  }

  // 测试 2: status
  try {
    console.log('[测试 2] status...');
    const status = await callGateway('status', {});
    console.log('✅ status:', JSON.stringify(status, null, 2), '\n');
  } catch (e: any) {
    console.log('❌ status 失败:', e.message, '\n');
  }

  // 测试 3: sessions.list
  try {
    console.log('[测试 3] sessions.list...');
    const sessions = await callGateway('sessions.list', {});
    console.log('✅ sessions.list:', JSON.stringify(sessions, null, 2), '\n');
  } catch (e: any) {
    console.log('❌ sessions.list 失败:', e.message, '\n');
  }

  console.log('\n🎉 测试完成');
  ws?.close(1000);
}

testGateway().catch(console.error);
