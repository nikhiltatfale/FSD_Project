require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGO_URI);

const UserSchema = new mongoose.Schema({ username: String, password: String, role: { type: String, default: 'staff' } });
const CustomerSchema = new mongoose.Schema({ name: String, phone: String, email: String, company: String, status: String, notes: String, date: { type: Date, default: Date.now } });
const LeadSchema = new mongoose.Schema({ name: String, phone: String, source: String, product: String, status: String, assignedTo: String, date: { type: Date, default: Date.now } });
const FollowupSchema = new mongoose.Schema({ refName: String, date: Date, remarks: String, status: { type: String, default: 'pending' } });

const User = mongoose.model('User', UserSchema);
const Customer = mongoose.model('Customer', CustomerSchema);
const Lead = mongoose.model('Lead', LeadSchema);
const Followup = mongoose.model('Followup', FollowupSchema);

async function seedAdmin() {
  const exists = await User.findOne({ username: 'admin' });
  if (!exists) {
    const hash = await bcrypt.hash('admin123', 10);
    await User.create({ username: 'admin', password: hash, role: 'admin' });
    console.log('Admin created: admin / admin123');
  }
}
seedAdmin();

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !await bcrypt.compare(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, role: user.role, username: user.username });
});

app.get('/api/customers', auth, async (req, res) => {
  const q = req.query.q;
  const filter = q ? { $or: [{ name: new RegExp(q, 'i') }, { phone: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }, { company: new RegExp(q, 'i') }] } : {};
  res.json(await Customer.find(filter).sort({ date: -1 }));
});
app.post('/api/customers', auth, async (req, res) => res.json(await Customer.create(req.body)));
app.put('/api/customers/:id', auth, async (req, res) => res.json(await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/customers/:id', auth, async (req, res) => { await Customer.findByIdAndDelete(req.params.id); res.json({ ok: true }); });

app.get('/api/leads', auth, async (req, res) => res.json(await Lead.find().sort({ date: -1 })));
app.post('/api/leads', auth, async (req, res) => res.json(await Lead.create(req.body)));
app.put('/api/leads/:id', auth, async (req, res) => res.json(await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/leads/:id', auth, async (req, res) => { await Lead.findByIdAndDelete(req.params.id); res.json({ ok: true }); });

app.post('/api/leads/:id/convert', auth, async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  const customer = await Customer.create({ name: lead.name, phone: lead.phone, email: '', company: '', status: 'active', notes: `Converted from lead. Product: ${lead.product}` });
  await Lead.findByIdAndUpdate(req.params.id, { status: 'converted' });
  res.json(customer);
});

app.get('/api/followups', auth, async (req, res) => res.json(await Followup.find().sort({ date: 1 })));
app.post('/api/followups', auth, async (req, res) => res.json(await Followup.create(req.body)));
app.put('/api/followups/:id', auth, async (req, res) => res.json(await Followup.findByIdAndUpdate(req.params.id, req.body, { new: true })));

app.get('/api/followups/today', auth, async (req, res) => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(); end.setHours(23, 59, 59, 999);
  res.json(await Followup.find({ date: { $gte: start, $lte: end } }));
});

app.get('/api/admin/stats', auth, adminOnly, async (req, res) => {
  const [customers, leads, followups, users] = await Promise.all([Customer.countDocuments(), Lead.countDocuments(), Followup.countDocuments(), User.countDocuments()]);
  const byStatus = await Customer.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const leadStatus = await Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  res.json({ customers, leads, followups, users, byStatus, leadStatus });
});

app.get('/api/admin/users', auth, adminOnly, async (req, res) => res.json(await User.find({}, '-password')));
app.post('/api/admin/user', auth, adminOnly, async (req, res) => {
  const { username, password, role } = req.body;
  const hash = await bcrypt.hash(password, 10);
  res.json(await User.create({ username, password: hash, role: role || 'staff' }));
});
app.delete('/api/admin/user/:id', auth, adminOnly, async (req, res) => { await User.findByIdAndDelete(req.params.id); res.json({ ok: true }); });

app.listen(3000, () => console.log('CRM running at http://localhost:3000'));