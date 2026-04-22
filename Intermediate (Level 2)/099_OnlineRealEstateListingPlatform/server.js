const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const ADMIN = { username: 'admin', password: 'admin123' };
let properties = [
  { id: 1, title: 'Modern Downtown Apartment', price: 85000, location: 'Mumbai', type: 'buy', bedrooms: 2, bathrooms: 2, area: 950, description: 'Stunning modern apartment in the heart of downtown with panoramic city views, open floor plan, gourmet kitchen, and luxury finishes throughout.', images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'] },
  { id: 2, title: 'Cozy Studio Near Park', price: 12000, location: 'Pune', type: 'rent', bedrooms: 1, bathrooms: 1, area: 450, description: 'Charming studio apartment steps from the park. Perfect for young professionals. Fully furnished with modern amenities.', images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'] },
  { id: 3, title: 'Luxury Villa with Pool', price: 450000, location: 'Goa', type: 'buy', bedrooms: 5, bathrooms: 4, area: 4200, description: 'Magnificent luxury villa featuring a private infinity pool, lush tropical gardens, gourmet kitchen, and breathtaking ocean views.', images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'] },
  { id: 4, title: 'Family Home in Suburbs', price: 38000, location: 'Bangalore', type: 'rent', bedrooms: 3, bathrooms: 2, area: 1800, description: 'Spacious family home in a quiet suburb with large backyard, modern kitchen, garage, and excellent school district nearby.', images: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'] },
  { id: 5, title: 'Penthouse Suite', price: 220000, location: 'Delhi', type: 'buy', bedrooms: 4, bathrooms: 3, area: 3100, description: 'Exclusive penthouse with floor-to-ceiling windows, private rooftop terrace, chef kitchen, and concierge service.', images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'] },
  { id: 6, title: 'Heritage Bungalow', price: 18000, location: 'Chennai', type: 'rent', bedrooms: 2, bathrooms: 1, area: 1100, description: 'Beautiful heritage bungalow with original wooden floors, high ceilings, wraparound porch, and lush private garden.', images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800', 'https://images.unsplash.com/photo-1582063289852-62e3ba2747f8?w=800'] }
];
let inquiries = [];
let nextId = 7;

app.get('/api/properties', (req, res) => res.json(properties));

app.post('/api/properties', (req, res) => {
  const p = { ...req.body, id: nextId++ };
  if (typeof p.images === 'string') p.images = p.images.split(',').map(s => s.trim()).filter(Boolean);
  properties.push(p);
  res.json(p);
});

app.put('/api/properties/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = properties.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const updated = { ...req.body, id };
  if (typeof updated.images === 'string') updated.images = updated.images.split(',').map(s => s.trim()).filter(Boolean);
  properties[idx] = updated;
  res.json(updated);
});

app.delete('/api/properties/:id', (req, res) => {
  const id = parseInt(req.params.id);
  properties = properties.filter(p => p.id !== id);
  res.json({ success: true });
});

app.post('/api/inquiry', (req, res) => {
  inquiries.push(req.body);
  res.json({ success: true });
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) res.json({ success: true });
  else res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/api/inquiries', (req, res) => res.json(inquiries));

app.listen(3000, () => console.log('Running on http://localhost:3000'));