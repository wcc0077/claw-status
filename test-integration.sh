#!/bin/bash

# 集成测试脚本 - 验证前后端 API 调用

echo "======================================"
echo "OpenClaw Dashboard 集成测试"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试结果统计
PASSED=0
FAILED=0

# 测试函数
test_endpoint() {
  local name=$1
  local url=$2
  local expected=$3

  echo -n "测试：$name ... "

  response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$http_code" = "200" ]; then
    if [ -n "$expected" ]; then
      if echo "$body" | grep -q "$expected"; then
        echo -e "${GREEN}通过${NC}"
        ((PASSED++))
      else
        echo -e "${RED}失败${NC} (未找到预期内容：$expected)"
        ((FAILED++))
      fi
    else
      echo -e "${GREEN}通过${NC}"
      ((PASSED++))
    fi
  else
    echo -e "${RED}失败${NC} (HTTP $http_code)"
    ((FAILED++))
  fi
}

# 检查服务是否运行
echo "检查服务状态..."
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo -e "${RED}错误：后端服务器未运行 (端口 3000)${NC}"
  exit 1
fi
echo -e "${GREEN}后端服务器运行正常 (端口 3000)${NC}"

if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
  echo -e "${RED}错误：前端服务器未运行 (端口 5173)${NC}"
  exit 1
fi
echo -e "${GREEN}前端服务器运行正常 (端口 5173)${NC}"
echo ""

# 测试 API 端点
echo "测试后端 API 端点..."
echo "--------------------------------------"

test_endpoint "GET /api/sessions" "http://localhost:3000/api/sessions" "sessions"
test_endpoint "GET /api/sessions/stats" "http://localhost:3000/api/sessions/stats" "total"
test_endpoint "GET /api/memory/status" "http://localhost:3000/api/memory/status" "active"
test_endpoint "GET /api/memory/files" "http://localhost:3000/api/memory/files" "files"
test_endpoint "GET /api/cron" "http://localhost:3000/api/cron" "jobs"
test_endpoint "GET /api/subagents" "http://localhost:3000/api/subagents" "runs"
test_endpoint "GET /api/heartbeat/config" "http://localhost:3000/api/heartbeat/config" "HEARTBEAT"
test_endpoint "GET /api/todos/today" "http://localhost:3000/api/todos/today" "exists"
test_endpoint "GET /api/config-path" "http://localhost:3000/api/config-path" "config"
test_endpoint "GET /api/files" "http://localhost:3000/api/files" "items"

echo ""
echo "测试前端页面加载..."
echo "--------------------------------------"

# 前端页面测试：检查 HTML 结构是否存在
test_endpoint "GET / (首页)" "http://localhost:5173/" "root"
test_endpoint "GET /sessions" "http://localhost:5173/sessions" "root"
test_endpoint "GET /memory" "http://localhost:5173/memory" "root"
test_endpoint "GET /cron" "http://localhost:5173/cron" "root"
test_endpoint "GET /subagents" "http://localhost:5173/subagents" "root"
test_endpoint "GET /files" "http://localhost:5173/files" "root"

echo ""
echo "======================================"
echo "测试结果汇总"
echo "======================================"
echo -e "通过：${GREEN}$PASSED${NC}"
echo -e "失败：${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}所有测试通过！${NC}"
  exit 0
else
  echo -e "${RED}部分测试失败${NC}"
  exit 1
fi
