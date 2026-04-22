const express = require('express');
const app = express();
const path = require('path');
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
const ADMIN = { username: 'admin', password: 'admin123' };
const tickets = [];
function uid() { return 'TKT-' + Math.random().toString(36).substr(2, 8).toUpperCase(); }
app.post('/api/ticket', (req, res) => {
  const { name, email, title, description, priority } = req.body;
  if (!name || !email || !title || !description || !priority) return res.status(400).json({ error: 'All fields required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });
  const ticket = { id: uid(), name, email, title, description, priority, status: 'Open', replies: [], createdAt: new Date().toLocaleString() };
  tickets.push(ticket);
  res.json({ id: ticket.id });
});
app.post('/api/ticket/status', (req, res) => {
  const { id, email } = req.body;
  if (!id || !email) return res.status(400).json({ error: 'Ticket ID and email required' });
  const ticket = tickets.find(t => t.id === id && t.email === email);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) return res.json({ success: true });
  res.status(401).json({ error: 'Invalid credentials' });
});
app.get('/api/admin/tickets', (req, res) => { res.json(tickets); });
app.post('/api/admin/reply', (req, res) => {
  const { id, reply } = req.body;
  const ticket = tickets.find(t => t.id === id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  ticket.replies.push({ text: reply, time: new Date().toLocaleString() });
  res.json({ success: true });
});
app.post('/api/admin/status', (req, res) => {
  const { id, status } = req.body;
  const ticket = tickets.find(t => t.id === id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  ticket.status = status;
  res.json({ success: true });
});
app.delete('/api/admin/delete/:id', (req, res) => {
  const idx = tickets.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Ticket not found' });
  tickets.splice(idx, 1);
  res.json({ success: true });
});
app.listen(3000, () => console.log('Server at http://localhost:3000'));