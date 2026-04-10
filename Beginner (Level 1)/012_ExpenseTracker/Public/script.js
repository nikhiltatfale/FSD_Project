/* =============================
   LEDGER — EXPENSE TRACKER JS
   ============================= */

// ─── STATE ───────────────────────────────────────────────────────────────────
let transactions = JSON.parse(localStorage.getItem('ledger_tx') || '[]');
let budgets = JSON.parse(localStorage.getItem('ledger_budgets') || '{}');
let editId = null;

const CATEGORY_ICONS = {
  Food: '🍔', Transport: '🚗', Shopping: '🛍', Health: '💊',
  Entertainment: '🎮', Bills: '💡', Housing: '🏠', Education: '📚',
  Travel: '✈️', Salary: '💼', Freelance: '💻', Investment: '📈', Other: '📦'
};

const CATEGORY_COLORS = [
  '#c8ff5a','#5affb0','#ff5a7a','#5aa0ff','#ffb85a',
  '#d05aff','#5ad6ff','#ff8a5a','#a0ff5a','#ff5ae0','#5a7aff','#ffd85a','#5affdd'
];

// ─── PERSIST ─────────────────────────────────────────────────────────────────
function save() {
  localStorage.setItem('ledger_tx', JSON.stringify(transactions));
  localStorage.setItem('ledger_budgets', JSON.stringify(budgets));
}

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(viewId)?.classList.add('active');
  document.querySelectorAll(`[data-view="${viewId}"]`).forEach(n => n.classList.add('active'));

  if (viewId === 'dashboard') renderDashboard();
  if (viewId === 'transactions') renderTransactions();
  if (viewId === 'budgets') renderBudgets();
  if (viewId === 'reports') renderReports();

  closeSidebar();
}

// ─── SIDEBAR MOBILE ───────────────────────────────────────────────────────────
const sidebar = document.getElementById('sidebar');
const hamburger = document.getElementById('hamburger');

function closeSidebar() {
  sidebar.classList.remove('open');
  hamburger.classList.remove('open');
  document.querySelector('.sidebar-overlay')?.classList.remove('show');
}

hamburger.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  hamburger.classList.toggle('open');
  document.querySelector('.sidebar-overlay')?.classList.toggle('show');
});

// Create overlay
const overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';
overlay.addEventListener('click', closeSidebar);
document.body.appendChild(overlay);

document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});

document.querySelectorAll('.link-btn[data-view]').forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});

// ─── TOAST ────────────────────────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3000);
}

// ─── FORMAT ──────────────────────────────────────────────────────────────────
function fmt(n) {
  return '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  const [y, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(day)} ${months[parseInt(m)-1]} ${y}`;
}

function getMonth(d) { return d.slice(0, 7); } // YYYY-MM

// ─── MODALS ───────────────────────────────────────────────────────────────────
const expenseModal = document.getElementById('expenseModal');
const budgetModal = document.getElementById('budgetModal');

function openExpenseModal(id = null) {
  editId = id;
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('modalTitle').textContent = id ? 'Edit Transaction' : 'Add Transaction';

  if (id) {
    const tx = transactions.find(t => t.id === id);
    setType(tx.type);
    document.getElementById('txDesc').value = tx.desc;
    document.getElementById('txAmount').value = tx.amount;
    document.getElementById('txDate').value = tx.date;
    document.getElementById('txCategory').value = tx.category;
    document.getElementById('txNote').value = tx.note || '';
  } else {
    setType('expense');
    document.getElementById('txDesc').value = '';
    document.getElementById('txAmount').value = '';
    document.getElementById('txDate').value = today;
    document.getElementById('txCategory').value = 'Food';
    document.getElementById('txNote').value = '';
  }

  expenseModal.classList.add('open');
}

function closeExpenseModal() {
  expenseModal.classList.remove('open');
  editId = null;
}

function setType(type) {
  document.querySelectorAll('.type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.type === type);
  });
  // Filter categories
  const catSel = document.getElementById('txCategory');
  const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Other'];
  const expenseCategories = ['Food','Transport','Shopping','Health','Entertainment','Bills','Housing','Education','Travel','Other'];
  Array.from(catSel.options).forEach(o => {
    if (type === 'income') o.hidden = !incomeCategories.includes(o.value);
    else o.hidden = incomeCategories.includes(o.value) && o.value !== 'Other';
  });
  // Set sensible default
  if (type === 'income') catSel.value = 'Salary';
  else catSel.value = 'Food';
}

document.querySelectorAll('.type-btn').forEach(b => {
  b.addEventListener('click', () => setType(b.dataset.type));
});

document.getElementById('addExpenseBtn').addEventListener('click', () => openExpenseModal());
document.getElementById('addExpenseBtn2').addEventListener('click', () => openExpenseModal());
document.getElementById('addBtnMobile').addEventListener('click', () => openExpenseModal());
document.getElementById('closeModal').addEventListener('click', closeExpenseModal);
document.getElementById('cancelModal').addEventListener('click', closeExpenseModal);
expenseModal.addEventListener('click', e => { if (e.target === expenseModal) closeExpenseModal(); });

document.getElementById('addBudgetBtn').addEventListener('click', () => {
  document.getElementById('budgetCategory').value = 'Food';
  document.getElementById('budgetAmount').value = '';
  budgetModal.classList.add('open');
});
document.getElementById('closeBudgetModal').addEventListener('click', () => budgetModal.classList.remove('open'));
document.getElementById('cancelBudgetModal').addEventListener('click', () => budgetModal.classList.remove('open'));
budgetModal.addEventListener('click', e => { if (e.target === budgetModal) budgetModal.classList.remove('open'); });

// ─── SAVE TRANSACTION ─────────────────────────────────────────────────────────
document.getElementById('saveTransaction').addEventListener('click', () => {
  const type = document.querySelector('.type-btn.active').dataset.type;
  const desc = document.getElementById('txDesc').value.trim();
  const amount = parseFloat(document.getElementById('txAmount').value);
  const date = document.getElementById('txDate').value;
  const category = document.getElementById('txCategory').value;
  const note = document.getElementById('txNote').value.trim();

  if (!desc) return toast('Please enter a description', 'error');
  if (!amount || amount <= 0) return toast('Please enter a valid amount', 'error');
  if (!date) return toast('Please select a date', 'error');

  if (editId) {
    const idx = transactions.findIndex(t => t.id === editId);
    transactions[idx] = { ...transactions[idx], type, desc, amount, date, category, note };
    toast('Transaction updated ✓');
  } else {
    transactions.push({ id: Date.now().toString(), type, desc, amount, date, category, note });
    toast('Transaction added ✓');
  }

  save();
  closeExpenseModal();
  refreshCurrentView();
  checkBudgetAlerts(category, type);
});

function checkBudgetAlerts(category, type) {
  if (type !== 'expense') return;
  const budget = budgets[category];
  if (!budget) return;
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const spent = transactions.filter(t => t.type === 'expense' && t.category === category && t.date.startsWith(month))
    .reduce((s, t) => s + t.amount, 0);
  const pct = spent / budget * 100;
  if (pct >= 100) toast(`⚠️ Budget exceeded for ${category}!`, 'error');
  else if (pct >= 80) toast(`⚠️ 80% of ${category} budget used`, 'warning');
}

// ─── SAVE BUDGET ──────────────────────────────────────────────────────────────
document.getElementById('saveBudget').addEventListener('click', () => {
  const cat = document.getElementById('budgetCategory').value;
  const amt = parseFloat(document.getElementById('budgetAmount').value);
  if (!amt || amt <= 0) return toast('Enter a valid budget amount', 'error');
  budgets[cat] = amt;
  save();
  budgetModal.classList.remove('open');
  toast(`Budget set for ${cat} ✓`);
  renderBudgets();
});

// ─── CLEAR DATA ───────────────────────────────────────────────────────────────
document.getElementById('clearDataBtn').addEventListener('click', () => {
  if (!confirm('Clear all transactions and budgets? This cannot be undone.')) return;
  transactions = [];
  budgets = {};
  save();
  toast('All data cleared', 'warning');
  refreshCurrentView();
});

// ─── REFRESH ─────────────────────────────────────────────────────────────────
function refreshCurrentView() {
  const active = document.querySelector('.view.active');
  if (active) showView(active.id);
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function renderDashboard() {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  const monthTx = transactions.filter(t => t.date.startsWith(thisMonth));
  const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

  document.getElementById('totalBalance').textContent = (balance < 0 ? '-' : '') + fmt(balance);
  document.getElementById('totalIncome').textContent = fmt(income);
  document.getElementById('totalExpenses').textContent = fmt(expense);
  document.getElementById('savingsRate').textContent = `${Math.max(0, savingsRate)}%`;

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  document.getElementById('chartMonth').textContent = `${months[now.getMonth()]} ${now.getFullYear()}`;

  renderRecentTx();
  drawCategoryChart(monthTx);
  drawTrendChart();
}

function renderRecentTx() {
  const list = document.getElementById('recentList');
  const recent = [...transactions].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 6);
  list.innerHTML = recent.length ? recent.map(txHTML).join('') : '<div class="empty-state">No transactions yet. Add your first expense!</div>';
  bindTxActions(list);
}

function txHTML(tx) {
  const icon = CATEGORY_ICONS[tx.category] || '📦';
  const sign = tx.type === 'income' ? '+' : '−';
  return `
    <div class="tx-item" data-id="${tx.id}">
      <div class="tx-icon">${icon}</div>
      <div class="tx-info">
        <div class="tx-desc">${escHtml(tx.desc)}</div>
        <div class="tx-meta">${tx.category} · ${fmtDate(tx.date)}${tx.note ? ' · ' + escHtml(tx.note) : ''}</div>
      </div>
      <div class="tx-amount ${tx.type}">${sign}${fmt(tx.amount)}</div>
      <div class="tx-actions">
        <button class="icon-btn edit" title="Edit">✏️</button>
        <button class="icon-btn delete" title="Delete">🗑</button>
      </div>
    </div>`;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function bindTxActions(container) {
  container.querySelectorAll('.icon-btn.edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.tx-item').dataset.id;
      openExpenseModal(id);
    });
  });
  container.querySelectorAll('.icon-btn.delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.tx-item').dataset.id;
      if (confirm('Delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        save();
        toast('Deleted', 'warning');
        refreshCurrentView();
      }
    });
  });
}

// ─── CATEGORY CHART (PIE) ────────────────────────────────────────────────────
function drawCategoryChart(monthTx) {
  const canvas = document.getElementById('categoryChart');
  const ctx = canvas.getContext('2d');
  const legend = document.getElementById('categoryLegend');

  const expenses = monthTx.filter(t => t.type === 'expense');
  const catMap = {};
  expenses.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });

  const entries = Object.entries(catMap).sort((a,b) => b[1]-a[1]);
  const total = expenses.reduce((s, t) => s + t.amount, 0);

  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth || 320, H = 220;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  if (!entries.length) {
    ctx.fillStyle = '#5e5c75';
    ctx.font = '14px Syne';
    ctx.textAlign = 'center';
    ctx.fillText('No expense data this month', W/2, H/2);
    legend.innerHTML = '';
    return;
  }

  const cx = W/2, cy = H/2, r = Math.min(cx, cy) - 20;
  let start = -Math.PI/2;

  entries.forEach(([cat, val], i) => {
    const angle = (val / total) * Math.PI * 2;
    const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#0d0d0f';
    ctx.lineWidth = 2;
    ctx.stroke();
    start += angle;
  });

  // Center hole
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = '#141418';
  ctx.fill();

  // Center text
  ctx.fillStyle = '#f0eeff';
  ctx.font = 'bold 14px DM Mono';
  ctx.textAlign = 'center';
  ctx.fillText(fmt(total), cx, cy + 5);

  // Legend
  legend.innerHTML = entries.slice(0, 6).map(([cat, val], i) =>
    `<div class="legend-item">
      <div class="legend-dot" style="background:${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}"></div>
      <span>${cat} (${Math.round(val/total*100)}%)</span>
    </div>`
  ).join('');
}

// ─── TREND CHART (LINE) ───────────────────────────────────────────────────────
function drawTrendChart() {
  const canvas = document.getElementById('trendChart');
  const ctx = canvas.getContext('2d');

  // Last 6 months
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label: d.toLocaleString('default', { month: 'short' }) });
  }

  const incomeData = months.map(m => transactions.filter(t => t.type === 'income' && t.date.startsWith(m.key)).reduce((s,t)=>s+t.amount,0));
  const expenseData = months.map(m => transactions.filter(t => t.type === 'expense' && t.date.startsWith(m.key)).reduce((s,t)=>s+t.amount,0));
  const maxVal = Math.max(...incomeData, ...expenseData, 1);

  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth || 320, H = 220;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const padL = 50, padR = 16, padT = 20, padB = 36;
  const chartW = W - padL - padR, chartH = H - padT - padB;

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const y = padT + (chartH / 4) * i;
    ctx.beginPath();
    ctx.strokeStyle = '#2a2a35';
    ctx.lineWidth = 1;
    ctx.moveTo(padL, y); ctx.lineTo(W - padR, y);
    ctx.stroke();
    const val = maxVal - (maxVal / 4) * i;
    ctx.fillStyle = '#5e5c75';
    ctx.font = '10px DM Mono';
    ctx.textAlign = 'right';
    ctx.fillText(val >= 1000 ? (val/1000).toFixed(0)+'k' : val.toFixed(0), padL - 6, y + 4);
  }

  // X labels
  months.forEach((m, i) => {
    const x = padL + (i / (months.length - 1)) * chartW;
    ctx.fillStyle = '#5e5c75';
    ctx.font = '10px DM Mono';
    ctx.textAlign = 'center';
    ctx.fillText(m.label, x, H - 8);
  });

  function drawLine(data, color, fill) {
    const pts = data.map((v, i) => ({ x: padL + (i/(months.length-1))*chartW, y: padT + (1 - v/maxVal)*chartH }));

    if (fill) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, padT + chartH);
      pts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pts[pts.length-1].x, padT + chartH);
      ctx.closePath();
      ctx.fillStyle = color + '18';
      ctx.fill();
    }

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i-1].x + pts[i].x) / 2;
      ctx.bezierCurveTo(cpx, pts[i-1].y, cpx, pts[i].y, pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    pts.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#141418';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  drawLine(incomeData, '#5affb0', true);
  drawLine(expenseData, '#ff5a7a', false);
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
function renderTransactions() {
  populateFilters();
  applyFilters();
}

function populateFilters() {
  const catSel = document.getElementById('filterCategory');
  const monthSel = document.getElementById('filterMonth');

  const cats = [...new Set(transactions.map(t => t.category))].sort();
  catSel.innerHTML = '<option value="all">All Categories</option>' +
    cats.map(c => `<option value="${c}">${CATEGORY_ICONS[c]||''} ${c}</option>`).join('');

  const months = [...new Set(transactions.map(t => getMonth(t.date)))].sort().reverse();
  monthSel.innerHTML = '<option value="all">All Months</option>' +
    months.map(m => {
      const [y, mo] = m.split('-');
      const label = new Date(y, parseInt(mo)-1).toLocaleString('default', {month:'long', year:'numeric'});
      return `<option value="${m}">${label}</option>`;
    }).join('');
}

['searchInput','filterType','filterCategory','filterMonth'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', applyFilters);
  document.getElementById(id)?.addEventListener('change', applyFilters);
});

function applyFilters() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const type = document.getElementById('filterType').value;
  const cat = document.getElementById('filterCategory').value;
  const month = document.getElementById('filterMonth').value;

  let filtered = [...transactions].sort((a,b) => b.date.localeCompare(a.date));

  if (q) filtered = filtered.filter(t => t.desc.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || (t.note||'').toLowerCase().includes(q));
  if (type !== 'all') filtered = filtered.filter(t => t.type === type);
  if (cat !== 'all') filtered = filtered.filter(t => t.category === cat);
  if (month !== 'all') filtered = filtered.filter(t => t.date.startsWith(month));

  const list = document.getElementById('fullTxList');
  list.innerHTML = filtered.length ? filtered.map(txHTML).join('') : '<div class="empty-state">No transactions match your filters.</div>';
  bindTxActions(list);
}

// ─── EXPORT CSV ───────────────────────────────────────────────────────────────
document.getElementById('exportBtn')?.addEventListener('click', () => {
  const rows = [['Date','Description','Type','Category','Amount','Note']];
  transactions.sort((a,b)=>b.date.localeCompare(a.date)).forEach(t => {
    rows.push([t.date, t.desc, t.type, t.category, t.amount, t.note||'']);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'ledger-export.csv'; a.click();
  URL.revokeObjectURL(url);
  toast('CSV exported ✓');
});

// ─── BUDGETS ──────────────────────────────────────────────────────────────────
function renderBudgets() {
  const grid = document.getElementById('budgetsGrid');
  const cats = Object.keys(budgets);

  if (!cats.length) {
    grid.innerHTML = '<div class="empty-state">No budgets set. Create one to track your spending limits!</div>';
    return;
  }

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  grid.innerHTML = cats.map(cat => {
    const limit = budgets[cat];
    const spent = transactions.filter(t => t.type === 'expense' && t.category === cat && t.date.startsWith(thisMonth)).reduce((s,t) => s+t.amount, 0);
    const pct = Math.min((spent/limit)*100, 100);
    const cls = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'safe';
    const remaining = limit - spent;

    return `
      <div class="budget-card">
        <div class="budget-header">
          <div class="budget-cat">${CATEGORY_ICONS[cat]||'📦'} ${cat}</div>
          <button class="budget-delete" data-cat="${cat}">✕</button>
        </div>
        <div class="budget-amounts">
          <span class="budget-spent" style="color:var(--${cls === 'danger' ? 'expense' : cls === 'warning' ? 'warning' : 'income'})">${fmt(spent)}</span>
          <span class="budget-limit">/ ${fmt(limit)}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${cls}" style="width:${pct}%"></div>
        </div>
        <div class="budget-status">
          ${pct >= 100 ? '⚠️ Budget exceeded by ' + fmt(Math.abs(remaining)) : remaining >= 0 ? fmt(remaining) + ' remaining' : ''}
          · ${Math.round(pct)}% used
        </div>
      </div>`;
  }).join('');

  grid.querySelectorAll('.budget-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      if (confirm(`Remove budget for ${cat}?`)) {
        delete budgets[cat];
        save();
        renderBudgets();
        toast('Budget removed', 'warning');
      }
    });
  });
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
function renderReports() {
  const sel = document.getElementById('reportYear');
  const years = [...new Set(transactions.map(t => t.date.slice(0,4)))].sort().reverse();
  if (!years.length) years.push(String(new Date().getFullYear()));

  const currentYear = sel.value || years[0];
  sel.innerHTML = years.map(y => `<option value="${y}" ${y===currentYear?'selected':''}>${y}</option>`).join('');

  const yearTx = transactions.filter(t => t.date.startsWith(currentYear));
  const yi = yearTx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const ye = yearTx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);

  document.getElementById('yearlyIncome').textContent = fmt(yi);
  document.getElementById('yearlyExpense').textContent = fmt(ye);
  document.getElementById('yearlyNet').textContent = (yi-ye < 0 ? '-' : '') + fmt(yi-ye);

  const activeMonths = [...new Set(yearTx.map(t=>t.date.slice(0,7)))].length || 1;
  document.getElementById('avgMonthly').textContent = fmt(ye / activeMonths);

  drawBarChart(currentYear);
  renderTopCategories(yearTx);
}

document.getElementById('reportYear')?.addEventListener('change', renderReports);

function drawBarChart(year) {
  const canvas = document.getElementById('barChart');
  const ctx = canvas.getContext('2d');

  const allMonths = Array.from({length:12},(_,i)=>`${year}-${String(i+1).padStart(2,'0')}`);
  const incomeData = allMonths.map(m => transactions.filter(t=>t.type==='income'&&t.date.startsWith(m)).reduce((s,t)=>s+t.amount,0));
  const expenseData = allMonths.map(m => transactions.filter(t=>t.type==='expense'&&t.date.startsWith(m)).reduce((s,t)=>s+t.amount,0));
  const maxVal = Math.max(...incomeData, ...expenseData, 1);
  const labels = ['J','F','M','A','M','J','J','A','S','O','N','D'];

  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth || 660, H = 260;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);
  ctx.clearRect(0,0,W,H);

  const padL=50,padR=16,padT=20,padB=36;
  const chartW=W-padL-padR, chartH=H-padT-padB;
  const groupW = chartW / 12;
  const barW = groupW * 0.3;

  for (let i=0;i<=4;i++) {
    const y = padT+(chartH/4)*i;
    ctx.beginPath(); ctx.strokeStyle='#2a2a35'; ctx.lineWidth=1;
    ctx.moveTo(padL,y); ctx.lineTo(W-padR,y); ctx.stroke();
    const v = maxVal-(maxVal/4)*i;
    ctx.fillStyle='#5e5c75'; ctx.font='10px DM Mono'; ctx.textAlign='right';
    ctx.fillText(v>=1000?(v/1000).toFixed(0)+'k':v.toFixed(0), padL-6, y+4);
  }

  allMonths.forEach((_, i) => {
    const cx = padL + (i+0.5)*groupW;
    const iH = (incomeData[i]/maxVal)*chartH;
    const eH = (expenseData[i]/maxVal)*chartH;

    // Income bar
    const iy = padT+chartH-iH;
    ctx.fillStyle='#5affb0';
    roundRect(ctx, cx-barW-2, iy, barW, iH, 3);
    ctx.fill();

    // Expense bar
    const ey = padT+chartH-eH;
    ctx.fillStyle='#ff5a7a';
    roundRect(ctx, cx+2, ey, barW, eH, 3);
    ctx.fill();

    ctx.fillStyle='#5e5c75'; ctx.font='10px DM Mono'; ctx.textAlign='center';
    ctx.fillText(labels[i], cx, H-8);
  });
}

function roundRect(ctx, x, y, w, h, r) {
  if (h <= 0) return;
  r = Math.min(r, h/2, w/2);
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h);
  ctx.lineTo(x, y+h);
  ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

function renderTopCategories(yearTx) {
  const catMap = {};
  yearTx.filter(t=>t.type==='expense').forEach(t=>{ catMap[t.category]=(catMap[t.category]||0)+t.amount; });
  const entries = Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,7);
  const maxVal = entries[0]?.[1] || 1;

  document.getElementById('topCategories').innerHTML = entries.length
    ? entries.map(([cat,val],i) => `
      <div class="top-cat-item">
        <div class="top-cat-rank">#${i+1}</div>
        <div class="top-cat-name">${CATEGORY_ICONS[cat]||'📦'} ${cat}</div>
        <div class="top-cat-bar-wrap"><div class="top-cat-bar" style="width:${(val/maxVal*100).toFixed(1)}%"></div></div>
        <div class="top-cat-amount">−${fmt(val)}</div>
      </div>`).join('')
    : '<div class="empty-state">No expense data this year.</div>';
}

// ─── RESIZE CHARTS ───────────────────────────────────────────────────────────
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(refreshCurrentView, 200);
});

// ─── INIT ────────────────────────────────────────────────────────────────────
showView('dashboard');