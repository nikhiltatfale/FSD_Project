const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const JWT_SECRET = 'blog_secret_2024';
const MONGO_URI = 'mongodb://localhost:27017/blogdb';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(MONGO_URI).then(() => console.log('MongoDB connected')).catch(err => console.log(err));

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
  isBlocked: { type: Boolean, default: false }
});

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorName: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.isBlocked) return res.status(403).json({ message: 'Access denied' });
    req.user = user;
    next();
  } catch { res.status(401).json({ message: 'Invalid token' }); }
};

const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
};

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    res.json({ message: 'Registered successfully' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (user.isBlocked) return res.status(403).json({ message: 'Your account is blocked' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/posts', async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch { res.status(404).json({ message: 'Post not found' }); }
});

app.post('/api/posts', auth, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ message: 'Title and content required' });
  const post = await Post.create({ title, content, authorId: req.user._id, authorName: req.user.name });
  res.json(post);
});

app.put('/api/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.authorId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not your post' });
    post.title = req.body.title || post.title;
    post.content = req.body.content || post.content;
    await post.save();
    res.json(post);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

app.delete('/api/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.authorId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not your post' });
    await post.deleteOne();
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/admin/users', auth, adminAuth, async (req, res) => {
  const users = await User.find({}, '-password');
  res.json(users);
});

app.put('/api/admin/block/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot block admin' });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ message: user.isBlocked ? 'User blocked' : 'User unblocked', isBlocked: user.isBlocked });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

app.delete('/api/admin/post/:id', auth, adminAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    await post.deleteOne();
    res.json({ message: 'Post deleted by admin' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/admin/stats', auth, adminAuth, async (req, res) => {
  const totalUsers = await User.countDocuments({ role: 'user' });
  const totalPosts = await Post.countDocuments();
  const blockedUsers = await User.countDocuments({ isBlocked: true });
  res.json({ totalUsers, totalPosts, blockedUsers });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));