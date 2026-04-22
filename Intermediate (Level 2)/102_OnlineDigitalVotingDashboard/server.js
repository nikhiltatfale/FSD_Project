const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(__dirname));

let voters = new Set();
let votes = {};
let voteLog = [];
let electionStatus = false;
let candidates = [
  { id: 1, name: 'Alice Johnson', party: 'Progressive Party' },
  { id: 2, name: 'Bob Martinez', party: 'Liberty Union' },
  { id: 3, name: 'Carol Singh', party: 'National Front' }
];

const ADMIN = { username: 'admin', password: 'admin123' };

app.get('/candidates', (req, res) => {
  res.json({ candidates, electionStatus });
});

app.post('/vote', (req, res) => {
  const { voterId, candidateId } = req.body;
  if (!electionStatus) return res.status(400).json({ error: 'Election is not active' });
  if (!voterId || !voterId.trim()) return res.status(400).json({ error: 'Invalid Voter ID' });
  if (voters.has(voterId.trim())) return res.status(400).json({ error: 'Already voted' });
  const candidate = candidates.find(c => c.id === candidateId);
  if (!candidate) return res.status(400).json({ error: 'Invalid candidate' });
  voters.add(voterId.trim());
  votes[candidateId] = (votes[candidateId] || 0) + 1;
  voteLog.push({ voterId: voterId.trim(), candidateId, candidateName: candidate.name, time: new Date().toISOString() });
  res.json({ success: true });
});

app.get('/results', (req, res) => {
  const results = candidates.map(c => ({ ...c, votes: votes[c.id] || 0 }));
  res.json({ results, total: voters.size, electionStatus });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) return res.json({ success: true });
  res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/admin/add', (req, res) => {
  const { name, party } = req.body;
  if (!name || !party) return res.status(400).json({ error: 'Name and party required' });
  const id = Date.now();
  candidates.push({ id, name, party });
  res.json({ success: true, candidates });
});

app.delete('/admin/delete', (req, res) => {
  const { id } = req.body;
  candidates = candidates.filter(c => c.id !== id);
  delete votes[id];
  res.json({ success: true, candidates });
});

app.post('/admin/toggle', (req, res) => {
  electionStatus = !electionStatus;
  res.json({ electionStatus });
});

app.post('/admin/reset', (req, res) => {
  voters.clear();
  votes = {};
  voteLog = [];
  electionStatus = false;
  res.json({ success: true });
});

app.get('/admin/logs', (req, res) => {
  res.json({ logs: voteLog, total: voters.size });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));