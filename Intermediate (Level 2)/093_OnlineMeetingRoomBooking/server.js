const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage
let rooms = [
  { id: 1, name: 'Conference Room A', capacity: 10, facilities: ['Projector', 'AC', 'WiFi'] },
  { id: 2, name: 'Meeting Room B', capacity: 6, facilities: ['TV', 'AC', 'WiFi'] },
  { id: 3, name: 'Board Room C', capacity: 20, facilities: ['Projector', 'TV', 'AC', 'WiFi'] }
];

let bookings = [];
let blockedSlots = [];
let adminSessions = {};
let bookingIdCounter = 1;

// Admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// Generate booking ID
function generateBookingId() {
  return 'BK' + (bookingIdCounter++);
}

// Generate session token
function generateSessionToken() {
  return Math.random().toString(36).substr(2, 9);
}

// Verify admin session
function verifyAdmin(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token || !adminSessions[token]) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ===== ROOM ENDPOINTS =====

// GET all rooms
app.get('/rooms', (req, res) => {
  res.json(rooms);
});

// POST add new room (admin only)
app.post('/rooms', verifyAdmin, (req, res) => {
  const { name, capacity, facilities } = req.body;
  
  if (!name || !capacity) {
    return res.status(400).json({ error: 'Name and capacity required' });
  }

  const newRoom = {
    id: Math.max(...rooms.map(r => r.id), 0) + 1,
    name,
    capacity: parseInt(capacity),
    facilities: facilities || []
  };

  rooms.push(newRoom);
  res.json(newRoom);
});

// PUT edit room (admin only)
app.put('/rooms/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { name, capacity, facilities } = req.body;
  
  const room = rooms.find(r => r.id === parseInt(id));
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (name) room.name = name;
  if (capacity) room.capacity = parseInt(capacity);
  if (facilities) room.facilities = facilities;

  res.json(room);
});

// DELETE room (admin only)
app.delete('/rooms/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const index = rooms.findIndex(r => r.id === parseInt(id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const deletedRoom = rooms.splice(index, 1)[0];
  
  // Remove related bookings
  bookings = bookings.filter(b => b.roomId !== parseInt(id));
  
  res.json({ message: 'Room deleted', room: deletedRoom });
});

// ===== BOOKING ENDPOINTS =====

// GET availability for a specific room and date
app.get('/availability', (req, res) => {
  const { roomId, date } = req.query;
  
  if (!roomId || !date) {
    return res.status(400).json({ error: 'roomId and date required' });
  }

  const room = rooms.find(r => r.id === parseInt(roomId));
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  // Get all bookings for this room on this date
  const dayBookings = bookings.filter(b => b.roomId === parseInt(roomId) && b.date === date);
  const dayBlockedSlots = blockedSlots.filter(b => b.roomId === parseInt(roomId) && b.date === date);

  const occupied = [...dayBookings, ...dayBlockedSlots].map(b => ({
    start: b.startTime,
    end: b.endTime
  }));

  res.json({ occupied });
});

// POST new booking
app.post('/book', (req, res) => {
  const { roomId, userName, date, startTime, endTime } = req.body;
  
  if (!roomId || !userName || !date || !startTime || !endTime) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const room = rooms.find(r => r.id === parseInt(roomId));
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  // Validate times
  if (startTime >= endTime) {
    return res.status(400).json({ error: 'End time must be after start time' });
  }

  // Check for overlapping bookings
  const hasConflict = bookings.some(b => 
    b.roomId === parseInt(roomId) && 
    b.date === date && 
    !(b.endTime <= startTime || b.startTime >= endTime)
  );

  // Check for blocked slots
  const isBlocked = blockedSlots.some(b => 
    b.roomId === parseInt(roomId) && 
    b.date === date && 
    !(b.endTime <= startTime || b.startTime >= endTime)
  );

  if (hasConflict || isBlocked) {
    return res.status(409).json({ error: 'Time slot already booked or blocked' });
  }

  const newBooking = {
    id: generateBookingId(),
    roomId: parseInt(roomId),
    userName,
    date,
    startTime,
    endTime
  };

  bookings.push(newBooking);
  res.json(newBooking);
});

// GET all bookings (or filter by user)
app.get('/bookings', (req, res) => {
  const { userName } = req.query;
  
  let result = bookings;
  if (userName) {
    result = bookings.filter(b => b.userName === userName);
  }

  // Include room names
  result = result.map(b => ({
    ...b,
    roomName: rooms.find(r => r.id === b.roomId)?.name
  }));

  res.json(result);
});

// DELETE cancel booking
app.delete('/bookings/:id', (req, res) => {
  const { id } = req.params;
  const index = bookings.findIndex(b => b.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  const deletedBooking = bookings.splice(index, 1)[0];
  res.json({ message: 'Booking cancelled', booking: deletedBooking });
});

// ===== ADMIN ENDPOINTS =====

// POST admin login
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateSessionToken();
  adminSessions[token] = { username, loginTime: new Date() };
  
  res.json({ token, message: 'Login successful' });
});

// POST admin logout
app.post('/admin/logout', (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token) {
    delete adminSessions[token];
  }
  res.json({ message: 'Logged out' });
});

// POST block time slot (admin only)
app.post('/block', verifyAdmin, (req, res) => {
  const { roomId, date, startTime, endTime } = req.body;
  
  if (!roomId || !date || !startTime || !endTime) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const room = rooms.find(r => r.id === parseInt(roomId));
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const blockedSlot = {
    roomId: parseInt(roomId),
    date,
    startTime,
    endTime
  };

  blockedSlots.push(blockedSlot);
  res.json(blockedSlot);
});

// GET admin stats
app.get('/admin/stats', verifyAdmin, (req, res) => {
  res.json({
    totalRooms: rooms.length,
    totalBookings: bookings.length,
    totalBlockedSlots: blockedSlots.length,
    bookingsByRoom: rooms.map(room => ({
      roomName: room.name,
      bookingCount: bookings.filter(b => b.roomId === room.id).length
    }))
  });
});

// GET all bookings (admin)
app.get('/admin/bookings', verifyAdmin, (req, res) => {
  const result = bookings.map(b => ({
    ...b,
    roomName: rooms.find(r => r.id === b.roomId)?.name
  }));
  res.json(result);
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
