const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage
let users = [];
let tasks = [];
let taskIdCounter = 1;

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// POST /api/user - create or get user
app.post('/api/user', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  let user = users.find(u => u.name.toLowerCase() === name.toLowerCase());
  if (!user) {
    user = { id: Date.now(), name, createdAt: new Date().toISOString() };
    users.push(user);
  }
  res.json(user);
});

// GET /api/tasks?user=NAME&date=DATE
app.get('/api/tasks', (req, res) => {
  const { user, date } = req.query;
  let filtered = tasks;
  if (user) filtered = filtered.filter(t => t.user.toLowerCase() === user.toLowerCase());
  if (date) filtered = filtered.filter(t => t.date === date);
  res.json(filtered);
});

// POST /api/tasks
app.post('/api/tasks', (req, res) => {
  const { user, date, title, description, time, priority } = req.body;
  if (!user || !date || !title) return res.status(400).json({ error: 'user, date, title required' });
  const task = {
    id: taskIdCounter++,
    user,
    date,
    title,
    description: description || '',
    time: time || '',
    priority: priority || 'Low',
    completed: false,
    createdAt: new Date().toISOString()
  };
  tasks.push(task);
  res.status(201).json(task);
});

// PUT /api/tasks/:id
app.put('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });
  tasks[idx] = { ...tasks[idx], ...req.body, id };
  res.json(tasks[idx]);
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });
  tasks.splice(idx, 1);
  res.json({ success: true });
});

// POST /api/admin/login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({ success: true, token: 'admin-token-secret' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// GET /api/admin/users
app.get('/api/admin/users', (req, res) => {
  const { token } = req.headers;
  if (token !== 'admin-token-secret') return res.status(401).json({ error: 'Unauthorized' });
  res.json(users);
});

// GET /api/admin/tasks
app.get('/api/admin/tasks', (req, res) => {
  const { token } = req.headers;
  if (token !== 'admin-token-secret') return res.status(401).json({ error: 'Unauthorized' });
  res.json(tasks);
});

// DELETE /api/admin/task/:id
app.delete('/api/admin/task/:id', (req, res) => {
  const { token } = req.headers;
  if (token !== 'admin-token-secret') return res.status(401).json({ error: 'Unauthorized' });
  const id = parseInt(req.params.id);
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });
  tasks.splice(idx, 1);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));