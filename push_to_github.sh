#!/bin/bash

# 门锁看板 - 推送到 GitHub 脚本
# 使用方法: bash push_to_github.sh

cd /tmp/kanban-pages

echo "════════════════════════════════════════"
echo "门锁看板数据 - 推送到 GitHub Pages"
echo "════════════════════════════════════════"
echo ""

# 检查 Git 仓库
if [ ! -d ".git" ]; then
  echo "❌ 错误：不是 Git 仓库"
  exit 1
fi

echo "✓ Git 仓库验证通过"
echo ""

# 显示当前状态
echo "=== 当前分支状态 ==="
git status --short
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
  echo "页面将在 2-5 分钟后更新到："
  echo "https://zhangfan58.github.io/product-roadmap/"
else
  echo ""
  echo "❌ 推送失败，请检查网络连接"
  exit 1
fi
