const express = require('express');
const app = express();
let appointments = [];
let nextId = 1;

app.use(express.json());
app.use(express.static('public'));

app.post('/api/appointments', (req, res) => {
  const { name, age, problem, doctor, date, time } = req.body;
  if (!name || !age || !problem || !doctor || !date || !time)
    return res.status(400).json({ error: 'All fields required' });
  const duplicate = appointments.find(a => a.doctor === doctor && a.date === date && a.time === time);
  if (duplicate) return res.status(409).json({ error: 'Slot already booked for this doctor' });
  const appt = { id: nextId++, name, age, problem, doctor, date, time };
  appointments.push(appt);
  res.status(201).json(appt);
});

app.get('/api/appointments', (req, res) => res.json(appointments));

app.get('/api/appointments/:name', (req, res) => {
  const results = appointments.filter(a => a.name.toLowerCase() === req.params.name.toLowerCase());
  results.length ? res.json(results) : res.status(404).json({ error: 'No appointments found' });
});

app.delete('/api/appointments/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = appointments.findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  appointments.splice(idx, 1);
  res.json({ success: true });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));