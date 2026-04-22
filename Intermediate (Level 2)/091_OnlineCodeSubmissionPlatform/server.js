const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const ADMIN = { username: 'admin', password: 'admin123' };

const problems = [
  {
    id: 1,
    title: 'Sum of Two Numbers',
    description: 'Write a function `solve(a, b)` that returns the sum of two numbers.',
    sampleInput: 'solve(3, 5)',
    sampleOutput: '8',
    constraints: '1 <= a, b <= 10^6',
    testCases: [
      { input: [2, 3], expected: 5 },
      { input: [10, 20], expected: 30 },
      { input: [0, 0], expected: 0 },
      { input: [100, 200], expected: 300 }
    ]
  }
];

const submissions = [];
const users = [];
let nextProblemId = 2;

app.get('/problem', (req, res) => {
  const p = problems[0];
  if (!p) return res.json({ error: 'No problems available' });
  const { testCases, ...safe } = p;
  res.json(safe);
});

app.post('/submit', (req, res) => {
  const { name, email, code, language } = req.body;
  if (!name || !email || !code) return res.status(400).json({ error: 'Missing fields' });

  if (!users.find(u => u.email === email)) users.push({ name, email });

  const problem = problems[0];
  if (!problem) return res.status(400).json({ error: 'No problem found' });

  let results = [];
  let passed = 0;

  if (language === 'javascript') {
    for (const tc of problem.testCases) {
      try {
        const fn = new Function(`${code}; return solve(${tc.input.join(',')});`);
        const out = fn();
        const ok = String(out) === String(tc.expected);
        if (ok) passed++;
        results.push({ input: tc.input.join(', '), expected: tc.expected, got: out, passed: ok });
      } catch (e) {
        results.push({ input: tc.input.join(', '), expected: tc.expected, got: e.message, passed: false });
      }
    }
  } else {
    results = problem.testCases.map(tc => ({
      input: tc.input.join(', '),
      expected: tc.expected,
      got: 'Simulation: output not available for ' + language,
      passed: false
    }));
  }

  const submission = {
    id: submissions.length + 1,
    name, email, code, language,
    problemId: problem.id,
    problemTitle: problem.title,
    passed, total: problem.testCases.length,
    status: passed === problem.testCases.length ? 'Accepted' : 'Wrong Answer',
    results,
    timestamp: new Date().toISOString()
  };
  submissions.push(submission);

  res.json({ status: submission.status, passed, total: submission.total, results });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) {
    res.json({ success: true, token: 'admin-token-xyz' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

function adminAuth(req, res, next) {
  if (req.headers['x-admin-token'] !== 'admin-token-xyz') return res.status(403).json({ error: 'Forbidden' });
  next();
}

app.get('/admin/submissions', adminAuth, (req, res) => res.json(submissions));
app.get('/admin/users', adminAuth, (req, res) => res.json(users));
app.get('/admin/problems', adminAuth, (req, res) => res.json(problems));

app.get('/admin/stats', adminAuth, (req, res) => {
  const total = submissions.length;
  const accepted = submissions.filter(s => s.status === 'Accepted').length;
  res.json({ totalUsers: users.length, totalSubmissions: total, successRate: total ? Math.round(accepted / total * 100) : 0 });
});

app.post('/admin/problem', adminAuth, (req, res) => {
  const { title, description, sampleInput, sampleOutput, constraints, testCases } = req.body;
  const p = { id: nextProblemId++, title, description, sampleInput, sampleOutput, constraints, testCases: testCases || [] };
  problems.push(p);
  res.json(p);
});

app.put('/admin/problem/:id', adminAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const idx = problems.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  problems[idx] = { ...problems[idx], ...req.body, id };
  res.json(problems[idx]);
});

app.delete('/admin/problem/:id', adminAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const idx = problems.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  problems.splice(idx, 1);
  res.json({ success: true });
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));