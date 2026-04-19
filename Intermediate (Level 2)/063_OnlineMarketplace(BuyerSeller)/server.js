const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public'));

let users = [];
let products = [];
let carts = {};
let orders = [];
let pid = 1;

app.post('/login', (req, res) => {
  const { username, role } = req.body;
  if (!username || !role) return res.status(400).json({ error: 'Missing fields' });
  let user = users.find(u => u.username === username);
  if (!user) { user = { username, role }; users.push(user); }
  res.json(user);
});

app.get('/products', (req, res) => res.json(products));

app.post('/products', (req, res) => {
  const { name, price, desc, seller } = req.body;
  const p = { id: pid++, name, price: parseFloat(price), desc, seller };
  products.push(p);
  res.json(p);
});

app.put('/products/:id', (req, res) => {
  const p = products.find(p => p.id == req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const { name, price, desc, seller } = req.body;
  if (p.seller !== seller) return res.status(403).json({ error: 'Forbidden' });
  p.name = name; p.price = parseFloat(price); p.desc = desc;
  res.json(p);
});

app.delete('/products/:id', (req, res) => {
  const { seller } = req.body;
  const idx = products.findIndex(p => p.id == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  if (seller && products[idx].seller !== seller) return res.status(403).json({ error: 'Forbidden' });
  products.splice(idx, 1);
  res.json({ success: true });
});

app.post('/cart/add', (req, res) => {
  const { username, productId } = req.body;
  if (!carts[username]) carts[username] = [];
  carts[username].push(parseInt(productId));
  res.json(carts[username]);
});

app.delete('/cart/remove', (req, res) => {
  const { username, index } = req.body;
  if (!carts[username]) return res.status(404).json({ error: 'No cart' });
  carts[username].splice(index, 1);
  res.json(carts[username]);
});

app.get('/cart/:user', (req, res) => {
  const items = (carts[req.params.user] || []).map(id => products.find(p => p.id === id)).filter(Boolean);
  res.json(items);
});

app.post('/cart/checkout', (req, res) => {
  const { username } = req.body;
  const items = (carts[username] || []).map(id => products.find(p => p.id === id)).filter(Boolean);
  if (!items.length) return res.status(400).json({ error: 'Cart empty' });
  const total = items.reduce((s, p) => s + p.price, 0);
  const order = { id: orders.length + 1, buyer: username, items, total };
  orders.push(order);
  carts[username] = [];
  res.json(order);
});

app.get('/orders/:user', (req, res) => res.json(orders.filter(o => o.buyer === req.params.user)));

app.get('/admin/orders', (req, res) => res.json(orders));
app.get('/admin/users', (req, res) => res.json(users));
app.get('/admin/products', (req, res) => res.json(products));

app.delete('/admin/product/:id', (req, res) => {
  const idx = products.findIndex(p => p.id == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  products.splice(idx, 1);
  res.json({ success: true });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));