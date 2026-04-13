const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const users = new Set();
const posts = [];
let postIdCounter = 1;
let commentIdCounter = 1;

// Join
app.post('/join', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name required' });
  users.add(name.trim());
  res.json({ success: true, name: name.trim() });
});

// Get all posts
app.get('/posts', (req, res) => {
  res.json(posts.slice().reverse());
});

// Create post
app.post('/posts', (req, res) => {
  const { title, content, author } = req.body;
  if (!title || !content || !author) return res.status(400).json({ error: 'Missing fields' });
  const post = {
    id: postIdCounter++,
    title: title.trim(),
    content: content.trim(),
    author: author.trim(),
    likes: 0,
    likedBy: [],
    comments: [],
    time: new Date().toISOString()
  };
  posts.push(post);
  res.json(post);
});

// Like post
app.post('/posts/:id/like', (req, res) => {
  const { user } = req.body;
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.likedBy.includes(user)) {
    post.likedBy = post.likedBy.filter(u => u !== user);
    post.likes--;
    return res.json({ likes: post.likes, liked: false });
  }
  post.likedBy.push(user);
  post.likes++;
  res.json({ likes: post.likes, liked: true });
});

// Get single post
app.get('/posts/:id', (req, res) => {
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// Add comment
app.post('/posts/:id/comment', (req, res) => {
  const { text, author } = req.body;
  if (!text || !author) return res.status(400).json({ error: 'Missing fields' });
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const comment = {
    id: commentIdCounter++,
    text: text.trim(),
    author: author.trim(),
    time: new Date().toISOString()
  };
  post.comments.push(comment);
  res.json(comment);
});

// Admin: delete post
app.delete('/admin/post/:id', (req, res) => {
  const idx = posts.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });
  posts.splice(idx, 1);
  res.json({ success: true });
});

// Admin: delete comment
app.delete('/admin/comment/:postId/:commentId', (req, res) => {
  const post = posts.find(p => p.id === parseInt(req.params.postId));
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const idx = post.comments.findIndex(c => c.id === parseInt(req.params.commentId));
  if (idx === -1) return res.status(404).json({ error: 'Comment not found' });
  post.comments.splice(idx, 1);
  res.json({ success: true });
});

// Admin: stats
app.get('/admin/stats', (req, res) => {
  const totalComments = posts.reduce((sum, p) => sum + p.comments.length, 0);
  res.json({
    totalUsers: users.size,
    totalPosts: posts.length,
    totalComments
  });
});

// SPA fallback for /admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Forum running at http://localhost:${PORT}`));