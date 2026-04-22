const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());
app.use(express.static('public'));

const ADMIN = { username: 'admin', password: 'admin123' };
let plans = [
  { id: 1, name: 'Starter', price: 9, duration: 30 },
  { id: 2, name: 'Pro', price: 29, duration: 90 },
  { id: 3, name: 'Enterprise', price: 99, duration: 365 }
];
let users = [];
let adminSessions = new Set();
let nextPlanId = 4;

function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (adminSessions.has(token)) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

app.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) {
    const token = Math.random().toString(36).slice(2);
    adminSessions.add(token);
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/plans', (req, res) => res.json(plans));

app.post('/add-plan', adminAuth, (req, res) => {
  const { name, price, duration } = req.body;
  if (!name || !price || !duration) return res.status(400).json({ error: 'All fields required' });
  const plan = { id: nextPlanId++, name, price: Number(price), duration: Number(duration) };
  plans.push(plan);
  res.json(plan);
});

app.delete('/delete-plan/:id', adminAuth, (req, res) => {
  const id = Number(req.params.id);
  const subscribed = users.some(u => u.planId === id);
  if (subscribed) return res.status(400).json({ error: 'Users subscribed to this plan' });
  plans = plans.filter(p => p.id !== id);
  res.json({ success: true });
});

app.post('/register', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already registered' });
  const user = { id: Date.now(), name, email, planId: null, startDate: null, expiryDate: null };
  users.push(user);
  res.json(user);
});

app.post('/subscribe', (req, res) => {
  const { email, planId } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.planId) return res.status(400).json({ error: 'Already subscribed' });
  const plan = plans.find(p => p.id === Number(planId));
  if (!plan) return res.status(404).json({ error: 'Plan not found' });
  user.planId = plan.id;
  user.planName = plan.name;
  user.startDate = new Date().toISOString();
  user.expiryDate = new Date(Date.now() + plan.duration * 86400000).toISOString();
  res.json(user);
});

app.post('/unsubscribe', (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!user.planId) return res.status(400).json({ error: 'No active subscription' });
  user.planId = null; user.planName = null; user.startDate = null; user.expiryDate = null;
  res.json(user);
});

app.get('/user-status', (req, res) => {
  const { email } = req.query;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const status = user.expiryDate ? (new Date(user.expiryDate) > new Date() ? 'Active' : 'Expired') : 'None';
  res.json({ ...user, status });
});

app.get('/users', adminAuth, (req, res) => {
  const result = users.map(u => ({
    ...u,
    status: u.expiryDate ? (new Date(u.expiryDate) > new Date() ? 'Active' : 'Expired') : 'None'
  }));
  res.json(result);
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));