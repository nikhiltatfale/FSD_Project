const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let products = [];
let logs = [];
let nextId = 1;

app.get('/products', (req, res) => res.json(products));

app.post('/add-product', (req, res) => {
  const { name, category, price, quantity } = req.body;
  if (!name || !category || price == null || quantity == null)
    return res.status(400).json({ error: 'All fields required' });
  const product = { id: nextId++, name, category, price: +price, quantity: +quantity, lastUpdated: new Date().toISOString() };
  products.push(product);
  res.json(product);
});

app.put('/update-product/:id', (req, res) => {
  const id = +req.params.id;
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { name, category, price, quantity } = req.body;
  products[idx] = { ...products[idx], name, category, price: +price, quantity: +quantity, lastUpdated: new Date().toISOString() };
  res.json(products[idx]);
});

app.delete('/delete-product/:id', (req, res) => {
  const id = +req.params.id;
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  products.splice(idx, 1);
  res.json({ success: true });
});

app.post('/stock-in', (req, res) => {
  const { productId, quantity } = req.body;
  const product = products.find(p => p.id === +productId);
  if (!product) return res.status(404).json({ error: 'Not found' });
  if (!quantity || quantity <= 0) return res.status(400).json({ error: 'Invalid quantity' });
  product.quantity += +quantity;
  product.lastUpdated = new Date().toISOString();
  logs.push({ productId: product.id, productName: product.name, action: 'IN', quantity: +quantity, date: new Date().toISOString() });
  res.json(product);
});

app.post('/stock-out', (req, res) => {
  const { productId, quantity } = req.body;
  const product = products.find(p => p.id === +productId);
  if (!product) return res.status(404).json({ error: 'Not found' });
  if (!quantity || quantity <= 0) return res.status(400).json({ error: 'Invalid quantity' });
  if (product.quantity < +quantity) return res.status(400).json({ error: 'Insufficient stock' });
  product.quantity -= +quantity;
  product.lastUpdated = new Date().toISOString();
  logs.push({ productId: product.id, productName: product.name, action: 'OUT', quantity: +quantity, date: new Date().toISOString() });
  res.json(product);
});

app.get('/logs', (req, res) => res.json(logs));

app.listen(3000, () => console.log('IMS running on http://localhost:3000'));