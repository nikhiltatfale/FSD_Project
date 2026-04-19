const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public'));

let rooms = [
  { id: 1, number: '101', type: 'Standard', price: 1500, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400' },
  { id: 2, number: '202', type: 'Deluxe', price: 2500, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400' },
  { id: 3, number: '303', type: 'Suite', price: 4500, image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400' }
];
let bookings = [];
let roomIdCounter = 4;
let bookingIdCounter = 1;

app.get('/api/rooms', (req, res) => res.json(rooms));

app.post('/api/rooms', (req, res) => {
  const { number, type, price, image } = req.body;
  if (!number || !type || !price) return res.status(400).json({ error: 'Missing fields' });
  const room = { id: roomIdCounter++, number, type, price: Number(price), image: image || '' };
  rooms.push(room);
  res.json(room);
});

app.put('/api/rooms/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = rooms.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Room not found' });
  rooms[idx] = { ...rooms[idx], ...req.body, id };
  res.json(rooms[idx]);
});

app.delete('/api/rooms/:id', (req, res) => {
  const id = Number(req.params.id);
  rooms = rooms.filter(r => r.id !== id);
  res.json({ success: true });
});

app.get('/api/bookings', (req, res) => res.json(bookings));

app.post('/api/check-availability', (req, res) => {
  const { roomId, checkIn, checkOut } = req.body;
  const ci = new Date(checkIn), co = new Date(checkOut);
  const conflict = bookings.some(b =>
    b.roomId === Number(roomId) &&
    !(new Date(b.checkOut) <= ci || new Date(b.checkIn) >= co)
  );
  res.json({ available: !conflict });
});

app.post('/api/book', (req, res) => {
  const { name, email, roomId, checkIn, checkOut } = req.body;
  if (!name || !email || !roomId || !checkIn || !checkOut)
    return res.status(400).json({ error: 'All fields required' });
  const ci = new Date(checkIn), co = new Date(checkOut);
  if (co <= ci) return res.status(400).json({ error: 'Check-out must be after check-in' });
  const room = rooms.find(r => r.id === Number(roomId));
  if (!room) return res.status(404).json({ error: 'Room not found' });
  const conflict = bookings.some(b =>
    b.roomId === Number(roomId) &&
    !(new Date(b.checkOut) <= ci || new Date(b.checkIn) >= co)
  );
  if (conflict) return res.status(409).json({ error: 'Room not available for selected dates' });
  const booking = { id: 'BK' + String(bookingIdCounter++).padStart(4, '0'), name, email, roomId: Number(roomId), checkIn, checkOut };
  bookings.push(booking);
  res.json(booking);
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));