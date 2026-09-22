# 手动推送到 GitHub Pages 的步骤

由于网络问题，请按以下步骤手动推送代码到 GitHub：

## 方案 1：使用 Git 命令（推荐）

```bash
cd /tmp/kanban-pages

# 查看待推送的提交
git log origin/main..HEAD

# 推送到 GitHub
git push origin main
```

## 方案 2：检查提交状态

```bash
cd /tmp/kanban-pages
git status
git log --oneline -10
```

## 方案 3：验证数据

```bash
# 检查代码中的门锁数据是否正确
grep -A 2 "美的E3门锁" /tmp/kanban-pages/index.html
grep -A 2 "OTA升级推送" /tmp/kanban-pages/index.html
```

## 已完成的修改

✅ Commit 1: feat: embed user's smart lock SKU data
✅ Commit 2: fix: always load default data from constants  
✅ Commit 3: refactor: implement versioned data persistence
✅ Commit 4: fix: force reload default door lock data on page load
✅ Commit 5: fix: force clear localStorage and load door lock data on page load
✅ README_DATA_PERSISTENCE.md: 数据持久化文档

## 验证 index.html 中的关键内容

```bash
# 应该看到所有 6 个 SKU
grep "id: 'sku" /tmp/kanban-pages/index.html | wc -l  # 应该输出 6

# 应该看到所有 31 条需求卡片
grep "title: '" /tmp/kanban-pages/index.html | grep -E "(OTA|密码|国标|故障|烧录|天气|安全|临时|主题|冲突|提醒|播报)" | wc -l
```
