#!/bin/bash

# 门锁看板 - 数据更新和推送脚本
# 使用方法: bash update-data.sh

cd "$(dirname "$0")" || exit 1

echo "════════════════════════════════════════════════════════"
echo "门锁看板数据 - 数据更新和推送到 GitHub"
echo "════════════════════════════════════════════════════════"
echo ""

# 检查 Git 仓库
if [ ! -d ".git" ]; then
  echo "❌ 错误：不是 Git 仓库"
  exit 1
fi

echo "✓ Git 仓库验证通过"
echo ""

# 检查 data.json 是否存在
if [ ! -f "data.json" ]; then
  echo "❌ 错误：找不到 data.json 文件"
  exit 1
fi

echo "✓ data.json 文件存在"
echo ""

# 更新 data.json 中的时间戳
echo "=== 更新数据版本时间戳 ==="
CURRENT_TIMESTAMP=$(date +%s%3N)

# 使用 Node.js 或 Python 更新时间戳
if command -v node &> /dev/null; then
  node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    data.timestamp = $(date +%s)000;
    data.version = '$(date +%s)';
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
    console.log('✓ 时间戳已更新到: ' + data.timestamp);
  "
elif command -v python3 &> /dev/null; then
  python3 << EOF
import json
import time
with open('data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
current_time = int(time.time() * 1000)
data['timestamp'] = current_time
data['version'] = str(current_time)
with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print(f'✓ 时间戳已更新到: {current_time}')
EOF
else
  echo "⚠️  未找到 Node.js 或 Python，跳过时间戳更新"
fi

echo ""

# 显示当前状态
echo "=== 当前分支状态 ==="
git status --short
echo ""

# 暂存所有变化
echo "=== 暂存文件 ==="
git add -A
git status --short
echo ""

# 检查是否有待提交的内容
if git diff --cached --quiet; then
  echo "❌ 没有待提交的更改"
  exit 0
fi

# 提交更新
echo "=== 创建提交 ==="
COMMIT_MSG="chore: Update data.json and sync with remote

Timestamp: $(date '+%Y-%m-%d %H:%M:%S')
Data version: $(date +%s)"

git commit -m "$COMMIT_MSG"

if [ $? -ne 0 ]; then
  echo "❌ 提交失败"
  exit 1
fi

echo ""

# 显示待推送的提交
echo "=== 待推送的提交 ==="
git log origin/main..HEAD --oneline
echo ""

# 推送
echo "=== 开始推送到 GitHub ==="
git push -v origin main

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ 推送成功！"
  echo ""
  echo "数据已同步到 GitHub Pages，将在 1-2 分钟后生效："
  echo "📍 https://zhangfan58.github.io/product-roadmap/"
  echo ""
  echo "其他用户刷新页面即可看到最新数据"
else
  echo ""
  echo "❌ 推送失败，请检查网络连接"
  exit 1
fi
