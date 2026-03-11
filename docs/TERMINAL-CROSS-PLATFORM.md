# 跨平台终端部署方案

## 方案概述

使用条件判断，在不同平台使用不同的 pty 实现：

| 平台 | 使用方案 | 说明 |
|------|----------|------|
| **Windows** | `node-pty` (powershell/cmd) | 本地伪终端 |
| **Linux/macOS** | `node-pty` (/bin/bash) | 本地伪终端 |

## 核心思路

`node-pty` 本身支持跨平台，但需要在对应平台上编译原生模块。

### 开发环境 (Windows)
- 安装 `node-pty` 预编译版本
- 使用 PowerShell 作为默认 shell

### 生产环境 (Linux)
- 在 Linux 服务器上重新安装 `node-pty`
- 使用 `/bin/bash` 作为默认 shell

## 实现步骤

### 1. 修改 pty-manager.ts

添加跨平台支持：

```typescript
// 检测平台和 shell
const isWindows = process.platform === 'win32';
const defaultShell = isWindows
  ? 'powershell.exe'
  : process.env.SHELL || '/bin/bash';
```

### 2. Windows 开发环境

```bash
# 安装 node-pty (使用预编译版本)
npm install node-pty-prebuilt-multiarch

# 或者使用官方版本（可能需要构建工具）
npm install node-pty
```

### 3. Linux 部署

```bash
# 在 Linux 服务器上
npm install node-pty

# 需要安装构建工具
sudo apt install python3 make g++  # Debian/Ubuntu
# 或
sudo yum install python3 make gcc-c++  # CentOS/RHEL
```

## 备选方案

如果 node-pty 在 Windows 上无法正常工作，可以使用纯 JS 实现作为 fallback：

### node-console-pty (纯 JS 实现)
```bash
npm install node-console-pty
```

### 降级模式
创建一个模拟终端（只执行命令，返回输出）：
```typescript
// 当 node-pty 不可用时
import { exec } from 'child_process';

class FallbackTerminal {
  write(data: string) {
    // 模拟执行命令
  }
}
```

## 推荐方案

使用 `node-pty` + 平台检测，代码几乎不需要改动，只需要：

1. 在 Windows 上安装预编译版本
2. 在 Linux 上正常安装并编译
3. 配置不同平台的默认 shell
