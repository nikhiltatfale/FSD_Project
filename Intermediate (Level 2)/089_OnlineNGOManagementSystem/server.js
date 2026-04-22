const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const ADMIN = { username: 'admin', password: 'admin123' };
let donations = [];
let volunteers = [];
let events = [
  { id: 1, title: 'Clean Water Drive', date: '2025-08-10', location: 'Mumbai', description: 'Providing clean drinking water to rural areas.', campaign: 'Water For All' },
  { id: 2, title: 'Tree Plantation', date: '2025-09-05', location: 'Pune', description: 'Plant 10,000 trees across Maharashtra.', campaign: 'Green Earth' },
  { id: 3, title: 'Education Camp', date: '2025-10-01', location: 'Nashik', description: 'Free coaching for underprivileged children.', campaign: 'Learn & Grow' }
];
let nextEventId = 4;
const sessions = new Set();

function auth(req, res, next) {
  const token = req.headers['x-token'];
  if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) {
    const token = Math.random().toString(36).slice(2) + Date.now();
    sessions.add(token);
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/donate', (req, res) => {
  const { name, email, phone, amount, campaign } = req.body;
  if (!name || !email || !amount || !campaign) return res.status(400).json({ error: 'Missing fields' });
  const d = { id: Date.now(), name, email, phone, amount: parseFloat(amount), campaign, date: new Date().toISOString().split('T')[0] };
  donations.push(d);
  res.json({ success: true, donation: d });
});

app.post('/volunteer', (req, res) => {
  const { name, email, phone, skills, availability } = req.body;
  if (!name || !email || !skills) return res.status(400).json({ error: 'Missing fields' });
  const v = { id: Date.now(), name, email, phone, skills, availability, status: 'Pending', date: new Date().toISOString().split('T')[0] };
  volunteers.push(v);
  res.json({ success: true, volunteer: v });
});

app.get('/events', (req, res) => res.json(events));

app.get('/admin/donations', auth, (req, res) => res.json(donations));
app.get('/admin/volunteers', auth, (req, res) => res.json(volunteers));
app.get('/admin/stats', auth, (req, res) => res.json({
  totalDonations: donations.length,
  totalFunds: donations.reduce((s, d) => s + d.amount, 0),
  totalVolunteers: volunteers.length,
  totalEvents: events.length
}));

app.post('/admin/event', auth, (req, res) => {
  const { title, date, location, description, campaign } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Missing fields' });
  const e = { id: nextEventId++, title, date, location, description, campaign };
  events.push(e);
  res.json({ success: true, event: e });
});

app.put('/admin/event/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const idx = events.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  events[idx] = { ...events[idx], ...req.body, id };
  res.json({ success: true, event: events[idx] });
});

app.delete('/admin/event/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  events = events.filter(e => e.id !== id);
  res.json({ success: true });
});

app.delete('/admin/donation/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  donations = donations.filter(d => d.id !== id);
  res.json({ success: true });
});

app.put('/admin/volunteer/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const v = volunteers.find(v => v.id === id);
  if (!v) return res.status(404).json({ error: 'Not found' });
  v.status = req.body.status;
  res.json({ success: true, volunteer: v });
});

app.delete('/admin/volunteer/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  volunteers = volunteers.filter(v => v.id !== id);
  res.json({ success: true });
});
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000, () => console.log('NGO System running at http://localhost:3000'));