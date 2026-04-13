const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let contacts = [];
let nextId = 1;

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

// GET all contacts
app.get('/api/contacts', (req, res) => {
  res.json(contacts);
});

// POST add contact
app.post('/api/contacts', (req, res) => {
  const { name, phone, email, address, notes } = req.body;
  if (!name || !phone || !email || !address) {
    return res.status(400).json({ error: 'Name, phone, email, and address are required.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  const phoneRegex = /^[0-9+\-\s().]{7,20}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number.' });
  }
  const contact = { id: nextId++, name, phone, email, address, notes: notes || '', createdAt: new Date().toISOString() };
  contacts.push(contact);
  res.status(201).json(contact);
});

// PUT edit contact
app.put('/api/contacts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = contacts.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Contact not found.' });
  const { name, phone, email, address, notes } = req.body;
  if (!name || !phone || !email || !address) {
    return res.status(400).json({ error: 'Name, phone, email, and address are required.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  const phoneRegex = /^[0-9+\-\s().]{7,20}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number.' });
  }
  contacts[idx] = { ...contacts[idx], name, phone, email, address, notes: notes || '' };
  res.json(contacts[idx]);
});

// DELETE contact
app.delete('/api/contacts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = contacts.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Contact not found.' });
  contacts.splice(idx, 1);
  res.json({ success: true });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true, token: 'admin-token-xyz' });
  } else {
    res.status(401).json({ error: 'Invalid credentials.' });
  }
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});