
// ════════════════════════════════════════════════════════
// 视图路由
// ════════════════════════════════════════════════════════
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function showLauncher() { showView('view-launcher'); }
function showKanban()   { showView('view-kanban'); render(); }

// ════════════════════════════════════════════════════════
// Launcher 配置
// 新增内嵌看板：加 { name, desc, emoji, viewId: 'kanban', tag, color }
// 链接外部页面：加 { name, desc, emoji, href: './xxx/index.html', tag, color }
// ════════════════════════════════════════════════════════
const LAUNCHER_PROJECTS = [
  {
    name:  '门锁 SKU 需求看板',
    desc:  '门锁产品线各 SKU 版本需求管理，支持拖拽排序、版本节点时间',
    emoji: '🔐',
    viewId: 'kanban',
    tag:   '硬件·门锁',
    color: '#2563eb',
  },
];

function renderLauncher(list) {
  const grid = document.getElementById('launcherGrid');
  grid.innerHTML = '';
  list.forEach(p => {
    const el = document.createElement('div');
    el.className = 'launcher-card';
    el.style.setProperty('--card-color', p.color || '#2563eb');
    el.innerHTML = `
      <div class="lc-head">
        <div class="lc-emoji">${p.emoji}</div>
        <div class="lc-info">
          <div class="lc-name">${esc(p.name)}</div>
          <div class="lc-desc">${esc(p.desc)}</div>
        </div>
      </div>
      <div class="lc-footer">
        <span class="lc-tag">${esc(p.tag)}</span>
        <span class="lc-arrow">→</span>
      </div>
    `;
    el.addEventListener('click', () => {
      if (p.viewId === 'kanban')  showKanban();
      else if (p.href)            window.open(p.href, '_blank');
    });
    grid.appendChild(el);
  });
}

function filterCards() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  renderLauncher(q
    ? LAUNCHER_PROJECTS.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        p.tag.toLowerCase().includes(q))
    : LAUNCHER_PROJECTS);
}

// 时钟
function updateClock() {
  const d = new Date(), pad = n => String(n).padStart(2,'0');
  const days = ['周日','周一','周二','周三','周四','周五','周六'];
  document.getElementById('clock').textContent =
    `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${days[d.getDay()]} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
updateClock(); setInterval(updateClock, 1000);

// ════════════════════════════════════════════════════════
// 看板数据层
// ════════════════════════════════════════════════════════
const STORAGE_KEY = 'lock_kanban_v3';

const DEFAULT_SKUS = [
  { id: 'sku1', name: 'ML-F10 指纹密码锁',  code: 'MLK-F10-SLV'  },
  { id: 'sku2', name: 'ML-X200 全能旗舰版', code: 'MLK-X200-BLK' },
  { id: 'sku3', name: 'ML-V5 猫眼智能锁',   code: 'MLK-V5-GLD'   },
  { id: 'sku4', name: 'ML-S1 入门款',       code: 'MLK-S1-WHT'   },
  { id: 'sku5', name: 'ML-Pro 商用版',      code: 'MLK-PRO-BLK'  },
];
const DEFAULT_VERSIONS = ['V1.0', 'V1.1', 'V2.0'];

function defaultCards(skuId, version) {
  if (skuId === 'sku1' && version === 'V1.0') {
    return [
      { id: uid(), title: '指纹录入优化',   link: '', priority: 'high', due: '2026-10-15', desc: '支持最多 100 枚指纹，录入成功率 ≥99%' },
      { id: uid(), title: 'App 远程开锁',   link: '', priority: 'mid',  due: '2026-11-01', desc: '' },
      { id: uid(), title: '低电量报警推送', link: '', priority: 'low',  due: '2026-12-01', desc: '电量低于 15% 时推送通知' },
    ];
  }
  return [];
}

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  const skus = DEFAULT_SKUS.map(s => ({...s}));
  const versions = {}, cards = {};
  skus.forEach(s => {
    versions[s.id] = [...DEFAULT_VERSIONS];
    DEFAULT_VERSIONS.forEach(v => { cards[`${s.id}::${v}`] = defaultCards(s.id, v); });
  });
  return {
    skus, versions, cards,
    activeVersions: Object.fromEntries(skus.map(s => [s.id, DEFAULT_VERSIONS[0]])),
    versionMeta: {},
  };
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function uid()       { return Math.random().toString(36).slice(2,9) + Date.now().toString(36); }
function esc(s)      { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function skuCards(skuId) {
  const v = state.activeVersions[skuId] || (state.versions[skuId] || [])[0] || '';
  return state.cards[`${skuId}::${v}`] || [];
}
function setSkuCards(skuId, list) {
  const v = state.activeVersions[skuId];
  state.cards[`${skuId}::${v}`] = list;
}

// ════════════════════════════════════════════════════════
// 看板渲染
// ════════════════════════════════════════════════════════
function render() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  state.skus.forEach(sku => board.appendChild(buildSkuCol(sku)));
  const addCol = document.createElement('div');
  addCol.className = 'add-sku-col';
  addCol.innerHTML = `<div class="plus">＋</div><div class="label">新增 SKU</div>`;
  addCol.onclick = openAddSkuModal;
  board.appendChild(addCol);
}

function buildSkuCol(sku) {
  const col = document.createElement('div');
  col.className = 'sku-col'; col.dataset.skuId = sku.id;

  const vers = state.versions[sku.id] || [];
  const activeVer = state.activeVersions[sku.id] || vers[0] || '';
  const cards = skuCards(sku.id);

  const header = document.createElement('div');
  header.className = 'sku-col-header';

  const titleRow = document.createElement('div');
  titleRow.className = 'sku-col-title-row';

  const nameEl = document.createElement('div');
  nameEl.className = 'sku-col-name';
  nameEl.textContent = sku.name; nameEl.title = '双击编辑名称';

  const actions = document.createElement('div');
  actions.className = 'sku-col-actions';

  const addBtn = document.createElement('button');
  addBtn.className = 'sku-icon-btn'; addBtn.title = '新增需求'; addBtn.textContent = '＋';
  addBtn.onclick = () => openAddCardModal(sku.id);

  const delBtn = document.createElement('button');
  delBtn.className = 'sku-icon-btn del'; delBtn.title = '删除 SKU'; delBtn.textContent = '×';
  delBtn.onclick = () => {
    if (state.skus.length <= 1) { alert('至少保留一个 SKU'); return; }
    if (!confirm(`确认删除 SKU「${sku.name}」及其所有需求？`)) return;
    state.skus = state.skus.filter(s => s.id !== sku.id);
    delete state.versions[sku.id]; delete state.activeVersions[sku.id];
    Object.keys(state.cards).filter(k => k.startsWith(sku.id + '::')).forEach(k => delete state.cards[k]);
    saveState(); render();
  };

  actions.appendChild(addBtn); actions.appendChild(delBtn);
  titleRow.appendChild(nameEl); titleRow.appendChild(actions);

  nameEl.addEventListener('dblclick', e => {
    e.stopPropagation();
    const input = document.createElement('input');
    input.className = 'sku-name-input'; input.value = sku.name;
    input.style.width = Math.max(80, nameEl.offsetWidth) + 'px';
    titleRow.replaceChild(input, nameEl); input.focus(); input.select();
    const commit = () => { const v = input.value.trim(); if (v) sku.name = v; saveState(); render(); };
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', e2 => {
      if (e2.key === 'Enter')  input.blur();
      if (e2.key === 'Escape') { input.value = sku.name; input.blur(); }
      e2.stopPropagation();
    });
  });

  const verRow = document.createElement('div');
  verRow.className = 'sku-version-row';

  const sel = document.createElement('select');
  sel.className = 'version-select';
  vers.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v; opt.textContent = v;
    if (v === activeVer) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.onchange = () => { state.activeVersions[sku.id] = sel.value; saveState(); render(); };

  const verAddBtn = document.createElement('button');
  verAddBtn.className = 'version-add-btn'; verAddBtn.textContent = '+ 版本';
  verAddBtn.onclick = () => {
    const name = prompt('输入新版本名称（如 V2.1）：');
    if (!name || !name.trim()) return;
    if (vers.includes(name.trim())) { alert('版本已存在'); return; }
    vers.push(name.trim()); state.versions[sku.id] = vers;
    state.activeVersions[sku.id] = name.trim();
    state.cards[`${sku.id}::${name.trim()}`] = [];
    saveState(); render();
  };

  const verEditBtn = document.createElement('button');
  verEditBtn.className = 'version-edit-btn'; verEditBtn.textContent = '节点时间';
  verEditBtn.title = '编辑提测/UAT/准出时间';
  verEditBtn.onclick = () => openVerDateModal(sku.id, activeVer);

  verRow.appendChild(sel); verRow.appendChild(verAddBtn); verRow.appendChild(verEditBtn);

  const milestones = document.createElement('div');
  milestones.className = 'ver-milestones';
  const meta = (state.versionMeta || {})[`${sku.id}::${activeVer}`] || {};
  [
    { key: 'test',    dot: '#2563eb', label: '提测' },
    { key: 'uat',     dot: '#f59e0b', label: 'UAT'  },
    { key: 'release', dot: '#10b981', label: '准出' },
  ].forEach(m => {
    const row = document.createElement('div'); row.className = 'ver-milestone';
    const dot = document.createElement('span'); dot.className = 'ver-milestone-dot'; dot.style.background = m.dot;
    const lbl = document.createElement('span'); lbl.className = 'ver-milestone-label'; lbl.textContent = m.label;
    const dateEl = document.createElement('span');
    dateEl.className = meta[m.key] ? 'ver-milestone-date' : 'ver-milestone-empty';
    dateEl.textContent = meta[m.key] ? formatDateFull(meta[m.key]) : '—';
    row.appendChild(dot); row.appendChild(lbl); row.appendChild(dateEl);
    milestones.appendChild(row);
  });

  header.appendChild(titleRow); header.appendChild(verRow); header.appendChild(milestones);

  const body = document.createElement('div');
  body.className = 'sku-col-body'; body.dataset.skuId = sku.id;

  if (cards.length === 0) {
    body.innerHTML = `<div class="empty-state"><div class="icon">📋</div><p>暂无需求</p></div>`;
  } else {
    cards.forEach(card => body.appendChild(buildCardEl(card, sku.id)));
  }

  body.addEventListener('dragover', e => {
    e.preventDefault();
    const ph = document.getElementById('drag-placeholder'); if (!ph) return;
    const after = getDragAfterElement(body, e.clientY);
    if (after) body.insertBefore(ph, after); else body.appendChild(ph);
  });
  body.addEventListener('drop', e => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('cardId'), srcSkuId = e.dataTransfer.getData('skuId');
    if (srcSkuId !== sku.id) return;
    const allCards = skuCards(sku.id), card = allCards.find(c => c.id === cardId);
    if (!card) return;
    const filtered = allCards.filter(c => c.id !== cardId);
    const after = getDragAfterElement(body, e.clientY);
    let idx = after && after.dataset.cardId ? filtered.findIndex(c => c.id === after.dataset.cardId) : -1;
    if (idx === -1) idx = filtered.length;
    filtered.splice(idx, 0, card); setSkuCards(sku.id, filtered); saveState(); render();
  });
  body.addEventListener('dragleave', e => {
    if (!body.contains(e.relatedTarget)) { const ph = document.getElementById('drag-placeholder'); if (ph) ph.remove(); }
  });

  const colAddBtn = document.createElement('button');
  colAddBtn.className = 'col-add-btn'; colAddBtn.textContent = '＋ 添加需求';
  colAddBtn.onclick = () => openAddCardModal(sku.id);

  col.appendChild(header); col.appendChild(body); col.appendChild(colAddBtn);
  return col;
}

function buildCardEl(card, skuId) {
  const el = document.createElement('div');
  el.className = 'card'; el.draggable = true; el.dataset.cardId = card.id;

  const now = new Date(); now.setHours(0,0,0,0);
  let dueHtml = '';
  if (card.due) {
    const dueDate = new Date(card.due), diff = Math.round((dueDate - now) / 86400000);
    let cls = 'due-badge', label = formatDate(card.due);
    if (diff < 0)       { cls += ' overdue'; label = `逾期 ${-diff}d`; }
    else if (diff <= 7) { cls += ' soon';    label = diff === 0 ? '今天截止' : `${diff}天后截止`; }
    dueHtml = `<span class="${cls}">📅 ${label}</span>`;
  }
  const linkHtml = card.link
    ? `<a class="card-link" href="${esc(card.link)}" target="_blank" title="${esc(card.link)}"><span>🔗</span><span class="link-text">${esc(card.link)}</span></a>`
    : '';
  const prioMap = { high: ['high','高优'], mid: ['mid','中优'], low: ['low','低优'] };
  const [pcls, plabel] = prioMap[card.priority] || prioMap.mid;

  el.innerHTML = `
    <div class="card-top">
      <div class="card-title">${esc(card.title)}${linkHtml}</div>
      <div class="card-actions">
        <button class="card-action-btn" onclick="editCard('${skuId}','${card.id}')">编辑</button>
        <button class="card-action-btn del" onclick="deleteCard('${skuId}','${card.id}')">删除</button>
      </div>
    </div>
    <div class="card-meta">
      <span class="priority-tag priority-${pcls}">${plabel}</span>
      ${dueHtml}
    </div>
    ${card.desc ? `<div class="card-desc">${esc(card.desc)}</div>` : ''}
  `;
  el.addEventListener('mousedown', e => {
    if (e.target.closest('a')) { el.draggable = false; setTimeout(() => { el.draggable = true; }, 300); }
  });
  el.addEventListener('dragstart', e => {
    if (!el.draggable) { e.preventDefault(); return; }
    e.dataTransfer.setData('cardId', card.id); e.dataTransfer.setData('skuId', skuId);
    el.classList.add('dragging');
    const ph = document.createElement('div');
    ph.className = 'card-placeholder'; ph.id = 'drag-placeholder';
    document.body.appendChild(ph); setTimeout(() => ph.remove(), 0);
  });
  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
    const ph = document.getElementById('drag-placeholder'); if (ph) ph.remove();
  });
  return el;
}

function getDragAfterElement(container, y) {
  const els = [...container.querySelectorAll('.card:not(.dragging)')];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect(), offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str); return `${d.getMonth()+1}/${d.getDate()}`;
}
function formatDateFull(str) {
  if (!str) return '';
  const d = new Date(str);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ════════════════════════════════════════════════════════
// 版本节点 Modal
// ════════════════════════════════════════════════════════
let vdSkuId = null, vdVerKey = null;

function openVerDateModal(skuId, ver) {
  vdSkuId = skuId; vdVerKey = `${skuId}::${ver}`;
  if (!state.versionMeta) state.versionMeta = {};
  const meta = state.versionMeta[vdVerKey] || {};
  document.getElementById('verDateTitle').textContent = `版本节点时间 · ${ver}`;
  document.getElementById('vd_test').value    = meta.test    || '';
  document.getElementById('vd_uat').value     = meta.uat     || '';
  document.getElementById('vd_release').value = meta.release || '';
  document.getElementById('verDateOverlay').classList.remove('hidden');
}
function closeVerDateModal() {
  document.getElementById('verDateOverlay').classList.add('hidden');
  vdSkuId = null; vdVerKey = null;
}
function saveVerDate() {
  if (!state.versionMeta) state.versionMeta = {};
  state.versionMeta[vdVerKey] = {
    test:    document.getElementById('vd_test').value,
    uat:     document.getElementById('vd_uat').value,
    release: document.getElementById('vd_release').value,
  };
  saveState(); closeVerDateModal(); render();
}

// ════════════════════════════════════════════════════════
// 需求 Card Modal
// ════════════════════════════════════════════════════════
let editingCardId = null, editingSkuId = null;

function openAddCardModal(skuId) {
  editingCardId = null; editingSkuId = skuId;
  document.getElementById('cardModalTitle').textContent = '新增需求';
  ['f_title','f_link','f_due','f_desc'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('f_priority').value = 'mid';
  document.getElementById('cardOverlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('f_title').focus(), 80);
}
function editCard(skuId, id) {
  const card = skuCards(skuId).find(c => c.id === id); if (!card) return;
  editingCardId = id; editingSkuId = skuId;
  document.getElementById('cardModalTitle').textContent = '编辑需求';
  document.getElementById('f_title').value    = card.title;
  document.getElementById('f_link').value     = card.link || '';
  document.getElementById('f_priority').value = card.priority;
  document.getElementById('f_due').value      = card.due || '';
  document.getElementById('f_desc').value     = card.desc || '';
  document.getElementById('cardOverlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('f_title').focus(), 80);
}
function closeCardModal() {
  document.getElementById('cardOverlay').classList.add('hidden');
  editingCardId = null; editingSkuId = null;
}
function saveCard() {
  const title = document.getElementById('f_title').value.trim();
  if (!title) { alert('需求名称不能为空'); return; }
  const newCard = {
    id: editingCardId || uid(), title,
    link:     document.getElementById('f_link').value.trim(),
    priority: document.getElementById('f_priority').value,
    due:      document.getElementById('f_due').value,
    desc:     document.getElementById('f_desc').value.trim(),
  };
  const cards = skuCards(editingSkuId);
  if (editingCardId) {
    const idx = cards.findIndex(c => c.id === editingCardId);
    if (idx !== -1) cards[idx] = newCard; else cards.push(newCard);
  } else { cards.push(newCard); }
  setSkuCards(editingSkuId, cards);
  saveState(); closeCardModal(); render();
}
function deleteCard(skuId, id) {
  if (!confirm('确认删除该需求？')) return;
  setSkuCards(skuId, skuCards(skuId).filter(c => c.id !== id));
  saveState(); render();
}

// ════════════════════════════════════════════════════════
// SKU Modal
// ════════════════════════════════════════════════════════
function openAddSkuModal() {
  document.getElementById('sku_name').value = '';
  document.getElementById('sku_code').value = '';
  document.getElementById('skuOverlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('sku_name').focus(), 80);
}
function closeSkuModal() { document.getElementById('skuOverlay').classList.add('hidden'); }
function saveSku() {
  const name = document.getElementById('sku_name').value.trim();
  if (!name) { alert('SKU 名称不能为空'); return; }
  const code = document.getElementById('sku_code').value.trim(), id = 'sku_' + uid();
  state.skus.push({ id, name, code });
  state.versions[id] = ['V1.0'];
  state.activeVersions[id] = 'V1.0';
  state.cards[`${id}::V1.0`] = [];
  saveState(); closeSkuModal(); render();
}

// ════════════════════════════════════════════════════════
// 导入 / 导出
// ════════════════════════════════════════════════════════
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = '门锁需求看板数据.json'; a.click();
  URL.revokeObjectURL(url);
}
function importData() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json,application/json';
  input.onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.skus || !data.cards) { alert('文件格式不正确'); return; }
        if (!confirm('导入后将覆盖当前所有数据，确认继续？')) return;
        localStorage.setItem(STORAGE_KEY, ev.target.result);
        state = JSON.parse(ev.target.result);
        render(); alert('导入成功！');
      } catch(err) { alert('解析失败：' + err.message); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ════════════════════════════════════════════════════════
// 键盘快捷键
// ════════════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeCardModal(); closeSkuModal(); closeVerDateModal(); }
  if (e.key === 'Enter' && e.metaKey) {
    if (!document.getElementById('cardOverlay').classList.contains('hidden'))    saveCard();
    if (!document.getElementById('skuOverlay').classList.contains('hidden'))     saveSku();
    if (!document.getElementById('verDateOverlay').classList.contains('hidden')) saveVerDate();
  }
});
document.getElementById('cardOverlay').addEventListener('click',    e => { if (e.target === e.currentTarget) closeCardModal();    });
document.getElementById('skuOverlay').addEventListener('click',     e => { if (e.target === e.currentTarget) closeSkuModal();     });
document.getElementById('verDateOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeVerDateModal(); });

// ════════════════════════════════════════════════════════
// 启动
// ════════════════════════════════════════════════════════
renderLauncher(LAUNCHER_PROJECTS);
