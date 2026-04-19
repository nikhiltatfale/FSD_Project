const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let posts = [];
let nextId = 1;

app.get('/posts', (req, res) => res.json(posts));

app.post('/posts', (req, res) => {
  const { username, content } = req.body;
  if (!username?.trim() || !content?.trim()) return res.status(400).json({ error: 'Name and content required' });
  const post = { id: nextId++, username: username.trim(), content: content.trim(), likes: 0, time: new Date().toISOString() };
  posts.unshift(post);
  res.status(201).json(post);
});

app.post('/like/:id', (req, res) => {
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });
  post.likes++;
  res.json(post);
});

app.delete('/delete/:id', (req, res) => {
  const { username } = req.body;
  const idx = posts.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });
  if (posts[idx].username !== username) return res.status(403).json({ error: 'Not your post' });
  posts.splice(idx, 1);
  res.json({ success: true });
});

app.delete('/admin/delete/:id', (req, res) => {
  const idx = posts.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });
  posts.splice(idx, 1);
  res.json({ success: true });
});

app.get('/admin/stats', (req, res) => {
  res.json({ total: posts.length, totalLikes: posts.reduce((s, p) => s + p.likes, 0) });
});

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(3000, () => console.log('Server running at http://localhost:3000'));