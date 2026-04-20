const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ADMIN = { username: 'admin', password: 'admin123' };
const products = [
  { id: 1, name: 'Rice (1kg)', category: 'Grocery', price: 60, quantity: 50 },
  { id: 2, name: 'Wheat Flour (1kg)', category: 'Grocery', price: 45, quantity: 30 },
  { id: 3, name: 'Sugar (1kg)', category: 'Grocery', price: 42, quantity: 3 },
  { id: 4, name: 'Salt (1kg)', category: 'Grocery', price: 20, quantity: 100 },
  { id: 5, name: 'Cooking Oil (1L)', category: 'Grocery', price: 130, quantity: 4 },
];
const bills = [];
let productId = 6;
let billId = 1;

app.get('/products', (req, res) => res.json(products));

app.get('/search-product', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  res.json(products.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)));
});

app.post('/add-product', (req, res) => {
  const { name, category, price, quantity } = req.body;
  if (!name || !price || quantity === undefined) return res.status(400).json({ error: 'Missing fields' });
  const p = { id: productId++, name, category: category || 'General', price: Number(price), quantity: Number(quantity) };
  products.push(p);
  res.json(p);
});

app.put('/edit-product/:id', (req, res) => {
  const p = products.find(x => x.id === Number(req.params.id));
  if (!p) return res.status(404).json({ error: 'Not found' });
  const { name, category, price, quantity } = req.body;
  if (name) p.name = name;
  if (category) p.category = category;
  if (price !== undefined) p.price = Number(price);
  if (quantity !== undefined) p.quantity = Number(quantity);
  res.json(p);
});

app.delete('/delete-product/:id', (req, res) => {
  const i = products.findIndex(x => x.id === Number(req.params.id));
  if (i === -1) return res.status(404).json({ error: 'Not found' });
  products.splice(i, 1);
  res.json({ success: true });
});

app.post('/create-bill', (req, res) => {
  const { items, tax } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'No items' });
  for (const item of items) {
    const p = products.find(x => x.id === item.id);
    if (!p) return res.status(404).json({ error: `Product ${item.id} not found` });
    if (p.quantity < item.quantity) return res.status(400).json({ error: `Insufficient stock for ${p.name}` });
  }
  const billItems = items.map(item => {
    const p = products.find(x => x.id === item.id);
    p.quantity -= item.quantity;
    return { id: p.id, name: p.name, price: p.price, quantity: item.quantity, subtotal: p.price * item.quantity };
  });
  const subtotal = billItems.reduce((s, i) => s + i.subtotal, 0);
  const taxAmt = +(subtotal * (Number(tax) || 0) / 100).toFixed(2);
  const bill = { billNumber: `BILL-${String(billId++).padStart(4,'0')}`, date: new Date().toISOString(), items: billItems, subtotal, tax: Number(tax) || 0, taxAmount: taxAmt, grandTotal: +(subtotal + taxAmt).toFixed(2) };
  bills.push(bill);
  res.json(bill);
});

app.get('/bills', (req, res) => {
  const q = req.query.q;
  if (q) return res.json(bills.filter(b => b.billNumber.includes(q)));
  res.json(bills);
});

app.get('/dashboard', (req, res) => {
  const today = new Date().toDateString();
  const todayBills = bills.filter(b => new Date(b.date).toDateString() === today);
  res.json({
    totalProducts: products.length,
    totalStock: products.reduce((s, p) => s + p.quantity, 0),
    salesToday: todayBills.reduce((s, b) => s + b.grandTotal, 0),
    lowStock: products.filter(p => p.quantity < 5),
    billsToday: todayBills.length
  });
});

app.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) return res.json({ success: true });
  res.status(401).json({ error: 'Invalid credentials' });
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));