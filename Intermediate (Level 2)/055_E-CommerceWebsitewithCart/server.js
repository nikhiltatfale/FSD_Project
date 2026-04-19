const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let products = [
  { id: 1, name: 'Wireless Headphones', price: 2999, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300', description: 'Premium wireless headphones with noise cancellation.' },
  { id: 2, name: 'Mechanical Keyboard', price: 4599, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300', description: 'Tactile mechanical switches, RGB backlight.' },
  { id: 3, name: 'USB-C Hub', price: 1799, image: 'https://images.unsplash.com/photo-1625948515291-69dbc77400bb?w=300', description: '7-in-1 USB-C hub with HDMI and PD charging.' },
  { id: 4, name: 'LED Desk Lamp', price: 1299, image: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=300', description: 'Adjustable LED lamp with USB charging port.' },
];
let orders = [];
let nextProductId = 5;
let nextOrderId = 1;

app.get('/api/products', (req, res) => res.json(products));

app.get('/api/products/:id', (req, res) => {
  const p = products.find(p => p.id === parseInt(req.params.id));
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

app.post('/api/products', (req, res) => {
  const { name, price, image, description } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
  const product = { id: nextProductId++, name, price: parseFloat(price), image: image || '', description: description || '' };
  products.push(product);
  res.status(201).json(product);
});

app.put('/api/products/:id', (req, res) => {
  const idx = products.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { name, price, image, description } = req.body;
  products[idx] = {
    ...products[idx],
    name: name || products[idx].name,
    price: price !== undefined ? parseFloat(price) : products[idx].price,
    image: image !== undefined ? image : products[idx].image,
    description: description !== undefined ? description : products[idx].description,
  };
  res.json(products[idx]);
});

app.delete('/api/products/:id', (req, res) => {
  const idx = products.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  products.splice(idx, 1);
  res.json({ success: true });
});

app.post('/api/order', (req, res) => {
  const { name, address, phone, items, total } = req.body;
  if (!name || !address || !phone || !items || items.length === 0)
    return res.status(400).json({ error: 'Missing required fields' });
  const order = { id: nextOrderId++, name, address, phone, items, total, date: new Date().toISOString() };
  orders.push(order);
  res.status(201).json({ success: true, orderId: order.id });
});

app.get('/api/orders', (req, res) => res.json(orders));

app.listen(3000, () => console.log('Server running on http://localhost:3000'));