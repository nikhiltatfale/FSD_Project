const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const ADMIN = { username: 'admin', password: 'admin123' };
const students = [
  { id: 'S001', name: 'Rahul Sharma', department: 'Computer Science', year: '2' },
  { id: 'S002', name: 'Priya Patel', department: 'Electronics', year: '3' },
  { id: 'S003', name: 'Amit Kumar', department: 'Mechanical', year: '1' }
];
const attendance = {
  'S001': [{ date: '2025-01-10', status: 'Present' }, { date: '2025-01-11', status: 'Absent' }],
  'S002': [{ date: '2025-01-10', status: 'Present' }, { date: '2025-01-11', status: 'Present' }],
  'S003': [{ date: '2025-01-10', status: 'Absent' }, { date: '2025-01-11', status: 'Present' }]
};
const marks = {
  'S001': { Maths: 88, Science: 76, English: 91, Computer: 95 },
  'S002': { Maths: 72, Science: 85, English: 68, Computer: 79 },
  'S003': { Maths: 60, Science: 55, English: 70, Computer: 65 }
};
const notices = [
  { id: 1, title: 'Exam Schedule', body: 'Final exams begin from Feb 10th.', date: '2025-01-08' },
  { id: 2, title: 'Holiday Notice', body: 'Republic Day holiday on Jan 26th.', date: '2025-01-07' }
];
let noticeIdCounter = 3;

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) return res.json({ success: true });
  res.status(401).json({ success: false });
});

app.post('/student/login', (req, res) => {
  const { id, name } = req.body;
  const s = students.find(s => s.id === id && s.name.toLowerCase() === name.toLowerCase());
  if (s) return res.json({ success: true, student: s });
  res.status(401).json({ success: false });
});

app.get('/students', (req, res) => res.json(students));

app.post('/students', (req, res) => {
  const { id, name, department, year } = req.body;
  if (students.find(s => s.id === id)) return res.status(400).json({ error: 'ID exists' });
  students.push({ id, name, department, year });
  res.json({ success: true });
});

app.delete('/students/:id', (req, res) => {
  const i = students.findIndex(s => s.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: 'Not found' });
  students.splice(i, 1);
  res.json({ success: true });
});

app.post('/attendance', (req, res) => {
  const { id, date, status } = req.body;
  if (!attendance[id]) attendance[id] = [];
  const existing = attendance[id].find(a => a.date === date);
  if (existing) existing.status = status;
  else attendance[id].push({ date, status });
  res.json({ success: true });
});

app.get('/attendance/:id', (req, res) => res.json(attendance[req.params.id] || []));

app.post('/marks', (req, res) => {
  const { id, subject, score } = req.body;
  if (!marks[id]) marks[id] = {};
  marks[id][subject] = score;
  res.json({ success: true });
});

app.get('/marks/:id', (req, res) => res.json(marks[req.params.id] || {}));

app.get('/notices', (req, res) => res.json(notices));

app.post('/notices', (req, res) => {
  const { title, body } = req.body;
  const notice = { id: noticeIdCounter++, title, body, date: new Date().toISOString().split('T')[0] };
  notices.unshift(notice);
  res.json({ success: true });
});

app.delete('/notices/:id', (req, res) => {
  const i = notices.findIndex(n => n.id === parseInt(req.params.id));
  if (i === -1) return res.status(404).json({ error: 'Not found' });
  notices.splice(i, 1);
  res.json({ success: true });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));