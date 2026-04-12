/* ============================================================
   PERSONAL FINANCE TRACKER — script.js
   All functionality: CRUD, filters, charts, CSV, dark mode
   ============================================================ */

// ─── State ───────────────────────────────────────────────────
let transactions = [];
let editingId    = null;

// ─── DOM References ──────────────────────────────────────────
const txTitle       = document.getElementById('txTitle');
const txAmount      = document.getElementById('txAmount');
const txType        = document.getElementById('txType');
const txCategory    = document.getElementById('txCategory');
const txDate        = document.getElementById('txDate');
const submitBtn     = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formTitle     = document.getElementById('formTitle');

const txBody        = document.getElementById('txBody');
const emptyMsg      = document.getElementById('emptyMsg');

const searchInput      = document.getElementById('searchInput');
const filterType       = document.getElementById('filterType');
const filterCategory   = document.getElementById('filterCategory');

const totalBalance     = document.getElementById('totalBalance');
const totalIncome      = document.getElementById('totalIncome');
const totalExpenses    = document.getElementById('totalExpenses');
const totalSavings     = document.getElementById('totalSavings');

const monthlyIncome    = document.getElementById('monthlyIncome');
const monthlyExpenses  = document.getElementById('monthlyExpenses');
const monthlySavings   = document.getElementById('monthlySavings');
const currentMonthLabel = document.getElementById('currentMonthLabel');

const themeToggle      = document.getElementById('themeToggle');
const exportBtn        = document.getElementById('exportBtn');

const pieCanvas        = document.getElementById('pieChart');
const barCanvas        = document.getElementById('barChart');
const pieLegend        = document.getElementById('pieLegend');

// ─── Chart Colors ────────────────────────────────────────────
const CHART_COLORS = [
  '#2563eb','#16a34a','#dc2626','#f59e0b',
  '#7c3aed','#0891b2','#be185d','#65a30d'
];

// ─── Init ────────────────────────────────────────────────────
function init() {
  // Set today's date as default
  txDate.value = new Date().toISOString().split('T')[0];

  // Set current month label
  const now = new Date();
  currentMonthLabel.textContent = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Load from localStorage
  const saved = localStorage.getItem('ft_transactions');
  if (saved) transactions = JSON.parse(saved);

  // Render everything
  refresh();

  // Event listeners
  submitBtn.addEventListener('click', handleSubmit);
  cancelEditBtn.addEventListener('click', cancelEdit);
  searchInput.addEventListener('input', renderList);
  filterType.addEventListener('change', renderList);
  filterCategory.addEventListener('change', renderList);
  themeToggle.addEventListener('click', toggleTheme);
  exportBtn.addEventListener('click', exportCSV);

  // Restore theme
  const savedTheme = localStorage.getItem('ft_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeBtn(savedTheme);
}

// ─── Save to localStorage ────────────────────────────────────
function save() {
  localStorage.setItem('ft_transactions', JSON.stringify(transactions));
}

// ─── Refresh all UI ──────────────────────────────────────────
function refresh() {
  renderSummary();
  renderMonthlySummary();
  renderList();
  renderCharts();
}

// ─── Handle Add / Edit Submit ────────────────────────────────
function handleSubmit() {
  const title    = txTitle.value.trim();
  const amount   = parseFloat(txAmount.value);
  const type     = txType.value;
  const category = txCategory.value;
  const date     = txDate.value;

  // Validation
  if (!title) return alert('Please enter a title.');
  if (isNaN(amount) || amount <= 0) return alert('Please enter a valid positive amount.');
  if (!date) return alert('Please select a date.');

  if (editingId !== null) {
    // Edit existing
    const idx = transactions.findIndex(t => t.id === editingId);
    if (idx !== -1) {
      transactions[idx] = { id: editingId, title, amount, type, category, date };
    }
    editingId = null;
    formTitle.innerHTML = '<i class="fa-solid fa-plus-circle"></i> Add Transaction';
    submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Add Transaction';
    cancelEditBtn.style.display = 'none';
  } else {
    // Add new
    const tx = {
      id: Date.now(),
      title,
      amount,
      type,
      category,
      date
    };
    transactions.unshift(tx); // newest first
  }

  save();
  clearForm();
  refresh();
}

// ─── Clear Form ───────────────────────────────────────────────
function clearForm() {
  txTitle.value   = '';
  txAmount.value  = '';
  txType.value    = 'income';
  txCategory.value = 'Food';
  txDate.value    = new Date().toISOString().split('T')[0];
}

// ─── Delete Transaction ───────────────────────────────────────
function deleteTransaction(id) {
  if (!confirm('Delete this transaction?')) return;
  transactions = transactions.filter(t => t.id !== id);
  if (editingId === id) cancelEdit();
  save();
  refresh();
}

// ─── Start Edit ───────────────────────────────────────────────
function startEdit(id) {
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;

  editingId          = id;
  txTitle.value      = tx.title;
  txAmount.value     = tx.amount;
  txType.value       = tx.type;
  txCategory.value   = tx.category;
  txDate.value       = tx.date;

  formTitle.innerHTML = '<i class="fa-solid fa-pen"></i> Edit Transaction';
  submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Changes';
  cancelEditBtn.style.display = 'inline-flex';

  // Scroll to form
  document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// ─── Cancel Edit ─────────────────────────────────────────────
function cancelEdit() {
  editingId = null;
  formTitle.innerHTML = '<i class="fa-solid fa-plus-circle"></i> Add Transaction';
  submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Add Transaction';
  cancelEditBtn.style.display = 'none';
  clearForm();
}

// ─── Render Summary Cards ─────────────────────────────────────
function renderSummary() {
  const income   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance  = income - expenses;
  const savings  = balance;

  totalIncome.textContent   = fmt(income);
  totalExpenses.textContent = fmt(expenses);
  totalBalance.textContent  = fmt(balance);
  totalSavings.textContent  = fmt(savings);

  // Color balance depending on positive/negative
  totalBalance.style.color = balance >= 0 ? 'var(--income)' : 'var(--expense)';
}

// ─── Render Monthly Summary ───────────────────────────────────
function renderMonthlySummary() {
  const now   = new Date();
  const month = now.getMonth();
  const year  = now.getFullYear();

  const monthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const inc = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const exp = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  monthlyIncome.textContent   = fmt(inc);
  monthlyExpenses.textContent = fmt(exp);
  monthlySavings.textContent  = fmt(inc - exp);
}

// ─── Render Transaction List ──────────────────────────────────
function renderList() {
  const search   = searchInput.value.toLowerCase();
  const typeF    = filterType.value;
  const catF     = filterCategory.value;

  let filtered = transactions.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search);
    const matchType   = typeF === 'all' || t.type === typeF;
    const matchCat    = catF === 'all' || t.category === catF;
    return matchSearch && matchType && matchCat;
  });

  txBody.innerHTML = '';

  if (filtered.length === 0) {
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';

  filtered.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(t.date)}</td>
      <td>${escHtml(t.title)}</td>
      <td>${t.category}</td>
      <td><span class="badge badge-${t.type}">${capitalize(t.type)}</span></td>
      <td class="amount-${t.type}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</td>
      <td class="actions-cell">
        <button class="edit-btn" onclick="startEdit(${t.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="delete-btn" onclick="deleteTransaction(${t.id})"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    txBody.appendChild(tr);
  });
}

// ─── Render Charts ────────────────────────────────────────────
function renderCharts() {
  drawPieChart();
  drawBarChart();
}

/* ── Pie Chart: Expense by Category ── */
function drawPieChart() {
  const ctx = pieCanvas.getContext('2d');
  const W   = pieCanvas.width;
  const H   = pieCanvas.height;
  ctx.clearRect(0, 0, W, H);

  const expenses = transactions.filter(t => t.type === 'expense');

  // Group by category
  const grouped = {};
  expenses.forEach(t => {
    grouped[t.category] = (grouped[t.category] || 0) + t.amount;
  });

  const entries = Object.entries(grouped);
  const total   = entries.reduce((s, [, v]) => s + v, 0);

  if (total === 0) {
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#888';
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('No expense data', W / 2, H / 2);
    pieLegend.innerHTML = '';
    return;
  }

  const cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 20;
  let startAngle = -Math.PI / 2;

  entries.forEach(([cat, val], i) => {
    const slice = (val / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label inside slice if big enough
    if (slice > 0.3) {
      const midAngle = startAngle + slice / 2;
      const lx = cx + (r * 0.65) * Math.cos(midAngle);
      const ly = cy + (r * 0.65) * Math.sin(midAngle);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(((val / total) * 100).toFixed(0) + '%', lx, ly);
    }

    startAngle += slice;
  });

  // Legend
  pieLegend.innerHTML = entries.map(([cat, val], i) => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${CHART_COLORS[i % CHART_COLORS.length]}"></span>
      ${cat} (${fmt(val)})
    </div>
  `).join('');
}

/* ── Bar Chart: Income vs Expense ── */
function drawBarChart() {
  const ctx = barCanvas.getContext('2d');
  const W   = barCanvas.width;
  const H   = barCanvas.height;
  ctx.clearRect(0, 0, W, H);

  const income   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const maxVal   = Math.max(income, expenses, 1);

  const isDark  = document.documentElement.getAttribute('data-theme') === 'dark';
  const axisColor = isDark ? '#6b7280' : '#9ca3af';
  const textColor = isDark ? '#d1d5db' : '#374151';

  const padL = 60, padR = 20, padT = 20, padB = 50;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // Axes
  ctx.strokeStyle = axisColor;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, padT + chartH);
  ctx.lineTo(padL + chartW, padT + chartH);
  ctx.stroke();

  // Y gridlines + labels
  const steps = 4;
  ctx.fillStyle = textColor;
  ctx.font = '11px Inter';
  ctx.textAlign = 'right';
  for (let i = 0; i <= steps; i++) {
    const y     = padT + chartH - (i / steps) * chartH;
    const label = fmt((maxVal * i) / steps);
    ctx.fillText(label, padL - 6, y + 4);
    ctx.strokeStyle = isDark ? '#374151' : '#e5e7eb';
    ctx.lineWidth   = 0.5;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + chartW, y);
    ctx.stroke();
  }

  // Bars
  const barW   = 60;
  const gap    = 40;
  const totalBarsW = 2 * barW + gap;
  const startX = padL + (chartW - totalBarsW) / 2;

  const bars = [
    { label: 'Income',  value: income,   color: '#16a34a' },
    { label: 'Expense', value: expenses, color: '#dc2626' }
  ];

  bars.forEach((bar, i) => {
    const bh  = (bar.value / maxVal) * chartH;
    const bx  = startX + i * (barW + gap);
    const by  = padT + chartH - bh;

    ctx.fillStyle = bar.color;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(bx, by, barW, bh, 4) : ctx.rect(bx, by, barW, bh);
    ctx.fill();

    // Value on top
    ctx.fillStyle = textColor;
    ctx.font      = 'bold 11px Inter';
    ctx.textAlign = 'center';
    if (bh > 0) ctx.fillText(fmt(bar.value), bx + barW / 2, by - 6);

    // Label below
    ctx.fillText(bar.label, bx + barW / 2, padT + chartH + 18);
  });
}

// ─── Dark / Light Toggle ──────────────────────────────────────
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ft_theme', next);
  updateThemeBtn(next);
  renderCharts(); // redraw charts with new colors
}

function updateThemeBtn(theme) {
  themeToggle.innerHTML = theme === 'dark'
    ? '<i class="fa-solid fa-sun"></i> Light Mode'
    : '<i class="fa-solid fa-moon"></i> Dark Mode';
}

// ─── Export CSV ───────────────────────────────────────────────
function exportCSV() {
  if (transactions.length === 0) return alert('No transactions to export.');

  const header = ['Date', 'Title', 'Category', 'Type', 'Amount'];
  const rows   = transactions.map(t => [
    t.date,
    `"${t.title.replace(/"/g, '""')}"`,
    t.category,
    t.type,
    t.amount.toFixed(2)
  ]);

  const csv  = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Helpers ──────────────────────────────────────────────────
function fmt(n) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00'); // avoid UTC offset issues
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── Boot ─────────────────────────────────────────────────────
init();