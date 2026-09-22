# 门锁看板 - 数据持久化说明

## 工作原理

### 首次加载（新用户或清除缓存）
1. 页面加载时检查浏览器 localStorage
2. 如果 localStorage 为空或版本过期，使用**内嵌的默认数据**（来自 JSON）
3. 显示完整的门锁产品数据：
   - 6 个 SKU
   - 31 条需求卡片
   - 所有版本及时间节点

### 编辑并保存
每次以下操作都会自动保存到 localStorage：
- ✏️ 新增/编辑需求卡片
- ✏️ 删除需求卡片
- ✏️ 拖拽排序需求卡片
- ✏️ 新增 SKU
- ✏️ 删除 SKU
- ✏️ 编辑 SKU 名称
- ✏️ 切换版本
- ✏️ 编辑版本时间（提测/UAT/准出）

### 重新加载（同一浏览器）
1. 检查 localStorage 中的版本号
2. 如果版本兼容，使用保存的用户编辑数据
3. 如果版本不兼容（代码更新），自动迁移：
   - 保留内嵌的最新默认数据（6 个 SKU）
   - 保留用户新增的额外 SKU 和卡片
   - 保留用户编辑的版本时间

## 数据版本控制

当前版本：`v4`

版本更新触发场景：
- 添加新的默认 SKU
- 添加新的默认需求卡片
- 修改数据结构

版本不兼容时的行为：
- 自动合并旧数据
- 用户编辑的内容保留
- 新增的默认数据应用

## 文件位置

- **本地文件**：`/tmp/kanban-pages/index.html`
- **GitHub Pages**：`https://zhangfan58.github.io/product-roadmap/`
- **存储键**：`lock_kanban_v3` (localStorage)

## 测试清单

```
✓ 首次打开看板 - 显示完整的 6 个门锁 SKU
✓ 新增需求卡片 - 刷新后仍存在
✓ 编辑需求卡片 - 刷新后保留修改
✓ 删除需求卡片 - 刷新后保留删除状态
✓ 拖拽排序 - 刷新后保留顺序
✓ 切换版本 - 切换后显示对应需求
✓ 编辑版本时间 - 刷新后保留时间
✓ 新增 SKU - 刷新后仍存在
✓ 删除 SKU - 刷新后保留删除状态
```

## 常见问题

### Q: 如何重置为默认数据？
A: 清除浏览器的 localStorage 数据：
- Chrome: Ctrl+Shift+Delete > Cookies and data > Clear
- Safari: Develop > Clear WebKit Storage
- Firefox: Ctrl+Shift+Delete > Cookies > Clear
然后刷新页面

### Q: 编辑丢失了？
A: 检查浏览器是否禁用了 localStorage，或者：
1. 打开浏览器开发者工具 (F12)
2. 进入 "Application" 或 "Storage" 标签
3. 查看 "Local Storage" 中是否有 `lock_kanban_v3` 数据

### Q: 为什么数据显示不完整？
A: 可能是旧版本的 localStorage 导致的。解决方案：
1. 清除浏览器缓存
2. 清除 localStorage
3. 刷新页面

## 代码提交

- 提交 1：嵌入所有默认数据
- 提交 2：移除 localStorage 优先级
- 提交 3：实现版本控制和数据迁移
