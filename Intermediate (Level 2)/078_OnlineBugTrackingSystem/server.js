const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public'));
let bugs = [];
let nextId = 1;
const ADMIN = { username: 'admin', password: 'admin123' };
app.get('/api/bugs', (req, res) => res.json(bugs));
app.post('/api/bugs', (req, res) => {
const { name, email, title, description, severity } = req.body;
if (!name || !email || !title || !description || !severity) return res.status(400).json({ error: 'All fields required' });
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });
const bug = { id: nextId++, name, email, title, description, severity, status: 'Open', createdAt: new Date() };
bugs.push(bug);
res.status(201).json(bug);
});
app.put('/api/bugs/:id', (req, res) => {
const bug = bugs.find(b => b.id === parseInt(req.params.id));
if (!bug) return res.status(404).json({ error: 'Not found' });
bug.status = req.body.status;
res.json(bug);
});
app.delete('/api/bugs/:id', (req, res) => {
const idx = bugs.findIndex(b => b.id === parseInt(req.params.id));
if (idx === -1) return res.status(404).json({ error: 'Not found' });
bugs.splice(idx, 1);
res.json({ success: true });
});
app.post('/api/admin/login', (req, res) => {
const { username, password } = req.body;
if (username === ADMIN.username && password === ADMIN.password) return res.json({ success: true });
res.status(401).json({ error: 'Invalid credentials' });
});
app.get('/api/stats', (req, res) => {
res.json({
total: bugs.length,
open: bugs.filter(b => b.status === 'Open').length,
inProgress: bugs.filter(b => b.status === 'In Progress').length,
resolved: bugs.filter(b => b.status === 'Resolved').length
});
});
app.listen(3000, () => console.log('Server running on http://localhost:3000'));