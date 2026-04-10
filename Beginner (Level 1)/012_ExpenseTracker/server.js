/**
 * LEDGER — Expense Tracker Server
 * A lightweight Node.js/Express server with REST API + file-based JSON persistence
 * Run: npm install && node server.js
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Request logger
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    const ts = new Date().toISOString().slice(11, 23);
    console.log(`[${ts}] ${req.method} ${req.path}`);
  }
  next();
});

// ─── DATA PERSISTENCE ─────────────────────────────────────────────────────────
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const defaults = { transactions: [], budgets: {} };
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    console.error('⚠️  Corrupt data.json – resetting');
    const defaults = { transactions: [], budgets: {} };
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaults, null, 2));
    return defaults;
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────
const VALID_TYPES = ['income', 'expense'];
const VALID_CATEGORIES = [
  'Food','Transport','Shopping','Health','Entertainment',
  'Bills','Housing','Education','Travel','Salary','Freelance','Investment','Other'
];

function validateTransaction(body) {
  const errors = [];
  if (!body.desc || typeof body.desc !== 'string' || !body.desc.trim()) errors.push('desc is required');
  if (!body.amount || isNaN(body.amount) || Number(body.amount) <= 0) errors.push('amount must be a positive number');
  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) errors.push('date must be YYYY-MM-DD');
  if (!VALID_TYPES.includes(body.type)) errors.push(`type must be one of: ${VALID_TYPES.join(', ')}`);
  if (!VALID_CATEGORIES.includes(body.category)) errors.push(`invalid category`);
  return errors;
}

// ─── TRANSACTIONS API ─────────────────────────────────────────────────────────

// GET /api/transactions — list all (with optional filters)
app.get('/api/transactions', (req, res) => {
  const { type, category, month, search, sort = 'date', order = 'desc' } = req.query;
  let data = loadData();
  let txs = [...data.transactions];

  if (type && VALID_TYPES.includes(type)) txs = txs.filter(t => t.type === type);
  if (category && VALID_CATEGORIES.includes(category)) txs = txs.filter(t => t.category === category);
  if (month && /^\d{4}-\d{2}$/.test(month)) txs = txs.filter(t => t.date.startsWith(month));
  if (search) {
    const q = search.toLowerCase();
    txs = txs.filter(t => t.desc.toLowerCase().includes(q) || (t.note||'').toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }

  // Sorting
  txs.sort((a, b) => {
    let va = a[sort], vb = b[sort];
    if (sort === 'amount') { va = Number(va); vb = Number(vb); }
    if (va < vb) return order === 'asc' ? -1 : 1;
    if (va > vb) return order === 'asc' ? 1 : -1;
    return 0;
  });

  res.json({ success: true, count: txs.length, transactions: txs });
});

// GET /api/transactions/:id
app.get('/api/transactions/:id', (req, res) => {
  const data = loadData();
  const tx = data.transactions.find(t => t.id === req.params.id);
  if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
  res.json({ success: true, transaction: tx });
});

// POST /api/transactions — create
app.post('/api/transactions', (req, res) => {
  const errors = validateTransaction(req.body);
  if (errors.length) return res.status(400).json({ success: false, errors });

  const tx = {
    id: crypto.randomUUID(),
    type: req.body.type,
    desc: req.body.desc.trim(),
    amount: Math.round(Number(req.body.amount) * 100) / 100,
    date: req.body.date,
    category: req.body.category,
    note: (req.body.note || '').trim(),
    createdAt: new Date().toISOString()
  };

  const data = loadData();
  data.transactions.push(tx);
  saveData(data);

  res.status(201).json({ success: true, transaction: tx });
});

// PUT /api/transactions/:id — update
app.put('/api/transactions/:id', (req, res) => {
  const data = loadData();
  const idx = data.transactions.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Transaction not found' });

  const errors = validateTransaction(req.body);
  if (errors.length) return res.status(400).json({ success: false, errors });

  data.transactions[idx] = {
    ...data.transactions[idx],
    type: req.body.type,
    desc: req.body.desc.trim(),
    amount: Math.round(Number(req.body.amount) * 100) / 100,
    date: req.body.date,
    category: req.body.category,
    note: (req.body.note || '').trim(),
    updatedAt: new Date().toISOString()
  };

  saveData(data);
  res.json({ success: true, transaction: data.transactions[idx] });
});

// DELETE /api/transactions/:id
app.delete('/api/transactions/:id', (req, res) => {
  const data = loadData();
  const idx = data.transactions.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Transaction not found' });

  data.transactions.splice(idx, 1);
  saveData(data);
  res.json({ success: true, message: 'Transaction deleted' });
});

// DELETE /api/transactions — clear all
app.delete('/api/transactions', (req, res) => {
  const data = loadData();
  data.transactions = [];
  saveData(data);
  res.json({ success: true, message: 'All transactions cleared' });
});

// ─── BUDGETS API ──────────────────────────────────────────────────────────────

// GET /api/budgets
app.get('/api/budgets', (req, res) => {
  const data = loadData();
  res.json({ success: true, budgets: data.budgets });
});

// PUT /api/budgets/:category — set/update
app.put('/api/budgets/:category', (req, res) => {
  const { category } = req.params;
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ success: false, message: 'Invalid category' });
  }
  const amount = Number(req.body.amount);
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'amount must be a positive number' });
  }

  const data = loadData();
  data.budgets[category] = Math.round(amount * 100) / 100;
  saveData(data);
  res.json({ success: true, category, budget: data.budgets[category] });
});

// DELETE /api/budgets/:category
app.delete('/api/budgets/:category', (req, res) => {
  const { category } = req.params;
  const data = loadData();
  if (!data.budgets[category]) {
    return res.status(404).json({ success: false, message: 'Budget not found' });
  }
  delete data.budgets[category];
  saveData(data);
  res.json({ success: true, message: `Budget for ${category} removed` });
});

// ─── SUMMARY API ──────────────────────────────────────────────────────────────

// GET /api/summary?month=YYYY-MM
app.get('/api/summary', (req, res) => {
  const data = loadData();
  const { month } = req.query;

  let txs = data.transactions;
  if (month && /^\d{4}-\d{2}$/.test(month)) txs = txs.filter(t => t.date.startsWith(month));

  const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

  // Category breakdown
  const byCategory = {};
  txs.filter(t => t.type === 'expense').forEach(t => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  });

  // Budget status
  const budgetStatus = {};
  if (month) {
    Object.entries(data.budgets).forEach(([cat, limit]) => {
      const spent = txs.filter(t => t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0);
      budgetStatus[cat] = { limit, spent, pct: Math.round((spent / limit) * 100), over: spent > limit };
    });
  }

  res.json({
    success: true,
    summary: {
      period: month || 'all',
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      savingsRate,
      transactionCount: txs.length,
      byCategory,
      ...(month && { budgetStatus })
    }
  });
});

// ─── EXPORT API ───────────────────────────────────────────────────────────────

// GET /api/export/csv
app.get('/api/export/csv', (req, res) => {
  const data = loadData();
  const rows = [['ID','Date','Description','Type','Category','Amount','Note','Created At']];
  data.transactions.sort((a,b)=>b.date.localeCompare(a.date)).forEach(t => {
    rows.push([t.id, t.date, t.desc, t.type, t.category, t.amount, t.note||'', t.createdAt||'']);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  res.header('Content-Type', 'text/csv');
  res.header('Content-Disposition', `attachment; filename="ledger-export-${new Date().toISOString().slice(0,10)}.csv"`);
  res.send(csv);
});

// GET /api/export/json
app.get('/api/export/json', (req, res) => {
  const data = loadData();
  res.header('Content-Disposition', `attachment; filename="ledger-export-${new Date().toISOString().slice(0,10)}.json"`);
  res.json(data);
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const data = loadData();
  res.json({
    success: true,
    status: 'ok',
    uptime: process.uptime().toFixed(1) + 's',
    transactions: data.transactions.length,
    budgets: Object.keys(data.budgets).length
  });
});

// ─── SERVE APP ────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log(`│  ◈  LEDGER — Expense Tracker             │`);
  console.log('├─────────────────────────────────────────┤');
  console.log(`│  App:    http://localhost:${PORT}            │`);
  console.log(`│  API:    http://localhost:${PORT}/api        │`);
  console.log(`│  Health: http://localhost:${PORT}/api/health │`);
  console.log('└─────────────────────────────────────────┘\n');
});