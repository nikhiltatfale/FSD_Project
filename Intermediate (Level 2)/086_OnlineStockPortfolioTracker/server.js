const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let stocks = [];
let logs = [];
let nextId = 1;

app.post('/addStock', (req, res) => {
  const { name, qty, buyPrice, currentPrice, date, user } = req.body;
  if (!name || !qty || !buyPrice || !currentPrice) return res.status(400).json({ error: 'Missing fields' });
  const stock = { id: nextId++, name: name.toUpperCase(), qty: +qty, buyPrice: +buyPrice, currentPrice: +currentPrice, date: date || new Date().toISOString().split('T')[0], user: user || 'User' };
  stocks.push(stock);
  logs.push(`[${new Date().toLocaleTimeString()}] ${stock.user} added ${stock.name} ${stock.qty} qty @ ₹${stock.buyPrice}`);
  res.json(stock);
});

app.get('/stocks', (req, res) => {
  res.json(stocks);
});

app.delete('/delete/:id', (req, res) => {
  const id = +req.params.id;
  const s = stocks.find(x => x.id === id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  stocks = stocks.filter(x => x.id !== id);
  logs.push(`[${new Date().toLocaleTimeString()}] ${s.user} deleted ${s.name}`);
  res.json({ ok: true });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') return res.json({ ok: true });
  res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/admin/stocks', (req, res) => {
  res.json({ stocks, logs });
});

app.delete('/admin/reset', (req, res) => {
  stocks = [];
  logs.push(`[${new Date().toLocaleTimeString()}] Admin reset all data`);
  res.json({ ok: true });
});

app.listen(3000, () => console.log('http://localhost:3000'));