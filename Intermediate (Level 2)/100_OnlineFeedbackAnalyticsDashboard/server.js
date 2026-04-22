const express = require('express');
const path = require('path');
const app = express();
let feedbacks = [];
let nextId = 1;
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.post('/submit-feedback', (req, res) => {
  const { name, email, category, rating, comment } = req.body;
  if (!name || !email || !category || !rating || !comment) return res.status(400).json({ error: 'All fields required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });
  const fb = { id: nextId++, name, email, category, rating: parseInt(rating), comment, date: new Date().toISOString() };
  feedbacks.unshift(fb);
  res.json({ success: true });
});
app.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') res.json({ success: true });
  else res.status(401).json({ error: 'Invalid credentials' });
});
app.get('/feedbacks', (req, res) => res.json(feedbacks));
app.delete('/feedback/:id', (req, res) => {
  const id = parseInt(req.params.id);
  feedbacks = feedbacks.filter(f => f.id !== id);
  res.json({ success: true });
});
app.get('/export', (req, res) => {
  const header = 'ID,Name,Email,Category,Rating,Comment,Date\n';
  const rows = feedbacks.map(f => `${f.id},"${f.name}","${f.email}","${f.category}",${f.rating},"${f.comment.replace(/"/g,'""')}","${f.date}"`).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="feedbacks.csv"');
  res.send(header + rows);
});
app.listen(3000, () => console.log('Running on http://localhost:3000'));