const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const users = [{ id: 'admin', name: 'Admin', email: 'admin@job.com', password: 'admin123', role: 'admin' }];
const jobs = [];
const applications = [];
let uid = 1, jid = 1;

app.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'All fields required' });
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already exists' });
  if (!['seeker', 'recruiter'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const user = { id: String(uid++), name, email, password, role };
  users.push(user);
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

app.get('/jobs', (req, res) => res.json(jobs));

app.post('/jobs', (req, res) => {
  const { title, company, description, recruiterId } = req.body;
  const recruiter = users.find(u => u.id === recruiterId && u.role === 'recruiter');
  if (!recruiter) return res.status(403).json({ error: 'Only recruiters can post jobs' });
  if (!title || !company || !description) return res.status(400).json({ error: 'All fields required' });
  const job = { id: String(jid++), title, company, description, recruiterId, recruiterName: recruiter.name };
  jobs.push(job);
  res.json(job);
});

app.delete('/jobs/:id', (req, res) => {
  const idx = jobs.findIndex(j => j.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Job not found' });
  jobs.splice(idx, 1);
  const appIdx = applications.filter(a => a.jobId !== req.params.id);
  applications.length = 0;
  appIdx.forEach(a => applications.push(a));
  res.json({ success: true });
});

app.post('/apply', (req, res) => {
  const { jobId, userId } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user || user.role !== 'seeker') return res.status(403).json({ error: 'Only seekers can apply' });
  if (!jobs.find(j => j.id === jobId)) return res.status(404).json({ error: 'Job not found' });
  if (applications.find(a => a.jobId === jobId && a.userId === userId)) return res.status(400).json({ error: 'Already applied' });
  applications.push({ jobId, userId });
  res.json({ success: true });
});

app.get('/applications/:userId', (req, res) => {
  const applied = applications.filter(a => a.userId === req.params.userId);
  const result = applied.map(a => jobs.find(j => j.id === a.jobId)).filter(Boolean);
  res.json(result);
});

app.get('/applicants/:jobId', (req, res) => {
  const applicants = applications.filter(a => a.jobId === req.params.jobId);
  const result = applicants.map(a => {
    const u = users.find(u => u.id === a.userId);
    return u ? { id: u.id, name: u.name, email: u.email } : null;
  }).filter(Boolean);
  res.json(result);
});

app.get('/users', (req, res) => res.json(users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))));

app.delete('/users/:id', (req, res) => {
  if (req.params.id === 'admin') return res.status(403).json({ error: 'Cannot delete admin' });
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  users.splice(idx, 1);
  const filtered = applications.filter(a => a.userId !== req.params.id);
  applications.length = 0;
  filtered.forEach(a => applications.push(a));
  const userJobs = jobs.filter(j => j.recruiterId === req.params.id).map(j => j.id);
  userJobs.forEach(jid => {
    const ji = jobs.findIndex(j => j.id === jid);
    if (ji !== -1) jobs.splice(ji, 1);
  });
  res.json({ success: true });
});

app.get('/applications', (req, res) => {
  const result = applications.map(a => {
    const job = jobs.find(j => j.id === a.jobId);
    const user = users.find(u => u.id === a.userId);
    return { jobTitle: job?.title, company: job?.company, applicantName: user?.name, applicantEmail: user?.email };
  });
  res.json(result);
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));