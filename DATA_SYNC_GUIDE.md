# 多用户数据同步指南

## 概述

门锁看板现已支持**多用户数据同步**。当一个用户修改并推送数据到 GitHub 后，其他用户刷新页面时能自动获取最新数据。

## 工作流程

### 第一步：编辑看板数据

1. 打开看板：https://zhangfan58.github.io/product-roadmap/
2. 在看板中进行编辑：
   - 添加/删除/修改需求卡片
   - 更改版本时间（提测、UAT、准出日期）
   - 新增 SKU 等

### 第二步：导出数据

1. 点击看板上的 **"导出"** 按钮
2. 这会下载一个 JSON 文件，包含你的所有编辑

### 第三步：更新 data.json 文件

**方案 A：使用自动更新脚本（推荐）**

```bash
# 将导出的 JSON 复制内容到 data.json 文件中
# 然后运行：
bash update-data.sh
```

这个脚本会：
- ✅ 自动更新数据版本时间戳
- ✅ 创建一个带时间戳的 Git 提交
- ✅ 推送到 GitHub
- ✅ 自动同步到 GitHub Pages

**方案 B：手动更新**

1. 编辑 `/tmp/kanban-pages/data.json` 文件
2. 替换为导出的 JSON 数据
3. 运行 git 命令：
   ```bash
   cd /tmp/kanban-pages
   git add data.json
   git commit -m "chore: Update door lock data - $(date '+%Y-%m-%d %H:%M:%S')"
   git push origin main
   ```

### 第四步：其他用户同步

当你推送数据后，其他用户只需要：
1. 刷新浏览器页面
2. 页面会自动检测远程数据更新
3. 如果有新版本，会自动应用最新数据

> **注意**：除了默认的 6 个 SKU 的数据会被同步外，用户新增的 SKU 仍会保留在本地 localStorage 中，不会被覆盖。

## 同步机制详解

### 版本检测

- 每个 `data.json` 都有一个 `timestamp` 字段
- 页面加载时检查本地 localStorage 的时间戳
- 如果远程数据更新，自动应用新数据

### 缓存破坏

- 每次请求 data.json 都附加时间戳参数：`?t={Date.now()}`
- 避免 GitHub Pages CDN 缓存问题
- 确保总是获取最新版本

### 用户编辑保护

- 用户新增的 SKU 和编辑内容保留在本地
- 只有默认 6 个 SKU 的数据会被远程数据覆盖
- 防止远程更新覆盖用户本地编辑

## 故障排除

### 问题：刷新后没看到新数据

**解决方案：**
1. 检查浏览器是否清除了缓存（Ctrl+Shift+Delete）
2. 尝试硬刷新（Ctrl+Shift+R 或 Cmd+Shift+R）
3. 检查浏览器控制台是否有错误（F12 → Console）
4. 等待 2-5 分钟让 GitHub Pages 重新部署

### 问题：看到错误消息 "Failed to fetch remote data"

**原因：**
- 网络连接问题
- GitHub Pages 暂时无法访问
- 浏览器跨域限制

**解决方案：**
1. 检查网络连接
2. 等待片刻后重试
3. 页面仍会显示本地缓存的数据，功能不受影响

### 问题：我的编辑被覆盖了

**恢复方案：**
1. 打开浏览器开发者工具（F12）
2. Console 中运行：
   ```javascript
   localStorage.removeItem('lock_kanban_v3');
   location.reload();
   ```
3. 这会清除 localStorage 并重新加载，可能需要重新编辑

## API 端点

- **看板主页**：https://zhangfan58.github.io/product-roadmap/
- **数据文件**：https://zhangfan58.github.io/product-roadmap/data.json
- **GitHub 仓库**：https://github.com/zhangfan58/product-roadmap

## 技术细节

### 核心同步流程

```
用户在页面加载时
  ↓
loadState() → 从 localStorage 加载本地数据
  ↓
loadRemoteData() → 异步获取 GitHub data.json
  ↓
检查 timestamp 比较版本
  ↓
如果远程更新 → 应用到 state（保留用户新增 SKU）
  ↓
触发 render() 更新 UI（如果看板已打开）
```

### 时间戳格式

```json
{
  "version": "1.0",
  "timestamp": 1726987200000,  // Unix 毫秒时间戳
  "skus": [...],
  "cards": {...}
}
```

## 最佳实践

1. ✅ **定期更新**：每次重要修改后立即推送
2. ✅ **保持通知**：告诉团队何时推送了新数据
3. ✅ **验证数据**：在导出前检查所有编辑是否正确
4. ✅ **备份重要数据**：在本地保存关键版本
5. ✅ **使用描述性提交信息**：方便追溯数据变更历史

## 更新日志

- **v1.0** (2026-09-22)：初始多用户同步功能
  - 支持从 GitHub 加载远程数据
  - 实现版本检测和缓存破坏
  - 保护用户本地编辑

## 需要帮助？

如有问题，请：
1. 查看浏览器控制台错误（F12）
2. 检查网络连接
3. 清除浏览器缓存后重试
4. 参考本指南的故障排除部分
