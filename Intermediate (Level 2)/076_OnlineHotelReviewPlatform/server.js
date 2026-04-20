const express = require('express');
const app = express();
const path = require('path');
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ADMIN_USER = "admin";
const ADMIN_PASS = "1234";
let adminToken = null;

const hotels = [
  { id: '1', name: 'The Grand Palace', location: 'Paris, France', description: 'Luxury hotel in the heart of Paris with stunning Eiffel Tower views.' },
  { id: '2', name: 'Ocean Breeze Resort', location: 'Maldives', description: 'Overwater bungalows with crystal clear lagoon access.' },
  { id: '3', name: 'Mountain Escape Lodge', location: 'Aspen, Colorado', description: 'Cozy alpine retreat perfect for ski and spa enthusiasts.' }
];
const reviews = { '1': [], '2': [], '3': [] };

function auth(req, res, next) {
  if (req.headers['x-admin-token'] !== adminToken || !adminToken) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.get('/hotels', (req, res) => {
  const result = hotels.map(h => {
    const r = reviews[h.id] || [];
    const avg = r.length ? (r.reduce((s, x) => s + x.rating, 0) / r.length).toFixed(1) : null;
    return { ...h, avgRating: avg, reviewCount: r.length };
  });
  res.json(result);
});

app.post('/hotels', auth, (req, res) => {
  const { name, location, description } = req.body;
  if (!name || !location || !description) return res.status(400).json({ error: 'All fields required' });
  const hotel = { id: Date.now().toString(), name, location, description };
  hotels.push(hotel);
  reviews[hotel.id] = [];
  res.json(hotel);
});

app.delete('/hotels/:id', auth, (req, res) => {
  const idx = hotels.findIndex(h => h.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  hotels.splice(idx, 1);
  delete reviews[req.params.id];
  res.json({ success: true });
});

app.get('/reviews/:hotelId', (req, res) => {
  res.json(reviews[req.params.hotelId] || []);
});

app.post('/reviews/:hotelId', (req, res) => {
  const { hotelId } = req.params;
  if (!hotels.find(h => h.id === hotelId)) return res.status(404).json({ error: 'Hotel not found' });
  const { username, rating, comment } = req.body;
  if (!username || !rating || !comment) return res.status(400).json({ error: 'All fields required' });
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });
  const review = { id: Date.now().toString(), username, rating: Number(rating), comment, date: new Date().toISOString() };
  if (!reviews[hotelId]) reviews[hotelId] = [];
  reviews[hotelId].push(review);
  res.json(review);
});

app.delete('/reviews/:hotelId/:reviewId', auth, (req, res) => {
  const { hotelId, reviewId } = req.params;
  const r = reviews[hotelId];
  if (!r) return res.status(404).json({ error: 'Not found' });
  const idx = r.findIndex(x => x.id === reviewId);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  r.splice(idx, 1);
  res.json({ success: true });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    adminToken = Date.now().toString();
    res.json({ token: adminToken });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));