const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const appointments = [];
let nextId = 1;

const ADMIN = { username: 'admin', password: 'admin123' };

// Book appointment
app.post('/api/book', (req, res) => {
  const { name, email, phone, date, time, reason } = req.body;

  if (!name || !email || !phone || !date || !time || !reason) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRx.test(email)) return res.status(400).json({ error: 'Invalid email.' });

  const phoneRx = /^[0-9]{7,15}$/;
  if (!phoneRx.test(phone.replace(/[\s\-\+]/g, ''))) {
    return res.status(400).json({ error: 'Invalid phone number.' });
  }

  const conflict = appointments.find(a => a.date === date && a.time === time);
  if (conflict) return res.status(409).json({ error: 'This slot is already booked.' });

  const appt = { id: nextId++, name, email, phone, date, time, reason };
  appointments.push(appt);
  res.status(201).json({ message: 'Appointment booked successfully!', appointment: appt });
});

// Admin login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) {
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid credentials.' });
});

// Get all appointments (admin)
app.get('/api/appointments', (req, res) => {
  res.json(appointments);
});

// Delete appointment (admin)
app.delete('/api/appointments/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = appointments.findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found.' });
  appointments.splice(idx, 1);
  res.json({ message: 'Deleted.' });
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));