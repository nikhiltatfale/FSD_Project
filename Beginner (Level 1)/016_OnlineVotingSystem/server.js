const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// In-memory storage
const votes = {}; // { voterId: candidateName }
const voters = {}; // { voterId: { name, department, age } }

const candidates = [
  { id: 'aryan', name: 'Aryan Mehta', party: 'Progressive Alliance', symbol: '🌟', color: '#6366f1' },
  { id: 'priya', name: 'Priya Sharma', party: 'National Front', symbol: '🌿', color: '#10b981' },
  { id: 'rahul', name: 'Rahul Verma', party: 'United Voice', symbol: '🔥', color: '#f59e0b' },
  { id: 'neha', name: 'Neha Kapoor', party: 'Future Party', symbol: '💡', color: '#ec4899' },
  { id: 'amit', name: 'Amit Singh', party: 'People\'s Union', symbol: '⚡', color: '#3b82f6' },
  { id: 'kavya', name: 'Kavya Nair', party: 'Democratic Force', symbol: '🌸', color: '#8b5cf6' },
];

// GET candidates
app.get('/candidates', (req, res) => {
  res.json(candidates);
});

// POST /vote
app.post('/vote', (req, res) => {
  const { name, voterId, department, age, candidate } = req.body;

  if (!name || !voterId || !department || !age || !candidate) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const ageNum = parseInt(age);
  if (isNaN(ageNum) || ageNum < 18) {
    return res.status(400).json({ error: 'Voter must be at least 18 years old.' });
  }

  if (votes[voterId]) {
    return res.status(409).json({ error: 'This Voter ID has already cast a vote.' });
  }

  const validCandidate = candidates.find(c => c.id === candidate);
  if (!validCandidate) {
    return res.status(400).json({ error: 'Invalid candidate selected.' });
  }

  votes[voterId] = candidate;
  voters[voterId] = { name, department, age: ageNum };

  console.log(`✅ Vote cast: ${name} (${voterId}) → ${validCandidate.name}`);

  res.json({ success: true, message: 'Vote recorded successfully.' });
});

// GET /results
app.get('/results', (req, res) => {
  const results = candidates.map(c => ({
    id: c.id,
    name: c.name,
    party: c.party,
    symbol: c.symbol,
    color: c.color,
    votes: Object.values(votes).filter(v => v === c.id).length
  }));

  const totalVotes = Object.keys(votes).length;
  res.json({ results, totalVotes });
});

// GET /admin/results (detailed)
app.get('/admin/results', (req, res) => {
  const results = candidates.map(c => ({
    id: c.id,
    name: c.name,
    party: c.party,
    symbol: c.symbol,
    color: c.color,
    votes: Object.values(votes).filter(v => v === c.id).length
  }));

  const voterLog = Object.entries(votes).map(([voterId, candidateId]) => ({
    voterId,
    voterName: voters[voterId]?.name || 'Unknown',
    department: voters[voterId]?.department || 'Unknown',
    age: voters[voterId]?.age || 'Unknown',
    votedFor: candidates.find(c => c.id === candidateId)?.name || 'Unknown'
  }));

  res.json({
    results,
    totalVotes: Object.keys(votes).length,
    voterLog
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🗳️  Voting System running at http://localhost:${PORT}`);
  console.log(`📊 Results:  http://localhost:${PORT}/#results`);
  console.log(`🔐 Admin:    Click logo 5× → password: admin123\n`);
});