const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.static('public'));

const ADMIN = { email: 'admin@doc.com', password: 'admin123' };
const sessions = {};
const documents = [];
let docId = 1;

function genToken() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function auth(req) { return sessions[req.headers['x-token']]; }
function adminAuth(req) { const s = auth(req); return s && s.isAdmin ? s : null; }

app.post('/login', (req, res) => {
  const { email, password, name, isAdmin } = req.body;
  if (isAdmin) {
    if (email === ADMIN.email && password === ADMIN.password) {
      const token = genToken();
      sessions[token] = { email, name: 'Admin', isAdmin: true };
      return res.json({ token, name: 'Admin', isAdmin: true });
    }
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  if (!email) return res.status(400).json({ error: 'Email required' });
  const token = genToken();
  sessions[token] = { email, name: name || email.split('@')[0], isAdmin: false };
  res.json({ token, name: sessions[token].name, isAdmin: false });
});

app.post('/logout', (req, res) => {
  delete sessions[req.headers['x-token']];
  res.json({ ok: true });
});

app.post('/upload', upload.single('file'), (req, res) => {
  const user = auth(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const allowed = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!allowed.includes(ext)) return res.status(400).json({ error: 'Invalid file type' });
  const doc = {
    id: docId++,
    userName: user.name,
    userEmail: user.email,
    title: req.body.title || 'Untitled',
    description: req.body.description || '',
    fileName: req.file.originalname,
    filePath: req.file.path,
    status: 'Pending',
    adminRemark: '',
    date: new Date().toISOString()
  };
  documents.push(doc);
  res.json(doc);
});

app.get('/documents', (req, res) => {
  const user = auth(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  res.json(documents.filter(d => d.userEmail === user.email));
});

app.get('/admin/documents', (req, res) => {
  if (!adminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  const q = (req.query.q || '').toLowerCase();
  const docs = q ? documents.filter(d => d.userName.toLowerCase().includes(q) || d.userEmail.toLowerCase().includes(q) || d.title.toLowerCase().includes(q)) : documents;
  res.json(docs);
});

app.get('/admin/file/:id', (req, res) => {
  if (!adminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  const doc = documents.find(d => d.id == req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.download(doc.filePath, doc.fileName);
});

app.post('/admin/action', (req, res) => {
  if (!adminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  const { id, action, remark } = req.body;
  const doc = documents.find(d => d.id == id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  doc.status = action === 'approve' ? 'Approved' : 'Rejected';
  doc.adminRemark = remark || '';
  res.json(doc);
});

app.delete('/admin/delete/:id', (req, res) => {
  if (!adminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  const idx = documents.findIndex(d => d.id == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const [doc] = documents.splice(idx, 1);
  if (doc.filePath && fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath);
  res.json({ ok: true });
});

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
app.listen(3000, () => console.log('Server running at http://localhost:3000'));