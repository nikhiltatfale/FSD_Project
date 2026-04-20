const express = require("express");
const app = express();
app.use(express.json());
app.use(express.static("public"));

const slots = [];
const bookings = [];
const admin = { username: "admin", password: "1234" };
let adminSession = false;

app.get("/slots", (req, res) => {
  res.json(slots);
});

app.post("/book", (req, res) => {
  const { name, email, phone, position, slotId } = req.body;
  if (!name || !email || !phone || !position || !slotId) return res.status(400).json({ error: "All fields required" });
  const slot = slots.find(s => s.id === slotId);
  if (!slot) return res.status(404).json({ error: "Slot not found" });
  if (slot.isBooked) return res.status(409).json({ error: "Slot already booked" });
  slot.isBooked = true;
  bookings.push({ id: Date.now().toString(), name, email, phone, position, slotId, date: slot.date, time: slot.time });
  res.json({ message: "Booking confirmed" });
});

app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === admin.username && password === admin.password) {
    adminSession = true;
    res.json({ message: "Login successful" });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

function auth(req, res, next) {
  if (!adminSession) return res.status(403).json({ error: "Unauthorized" });
  next();
}

app.post("/admin/add-slot", auth, (req, res) => {
  const { date, time } = req.body;
  if (!date || !time) return res.status(400).json({ error: "Date and time required" });
  const exists = slots.find(s => s.date === date && s.time === time);
  if (exists) return res.status(409).json({ error: "Slot already exists" });
  slots.push({ id: Date.now().toString(), date, time, isBooked: false });
  res.json({ message: "Slot added" });
});

app.delete("/admin/delete-slot", auth, (req, res) => {
  const { id } = req.body;
  const idx = slots.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: "Slot not found" });
  if (slots[idx].isBooked) return res.status(400).json({ error: "Cannot delete booked slot" });
  slots.splice(idx, 1);
  res.json({ message: "Slot deleted" });
});

app.get("/admin/bookings", auth, (req, res) => {
  const { date } = req.query;
  if (date) return res.json(bookings.filter(b => b.date === date));
  res.json(bookings);
});

app.delete("/admin/cancel-booking", auth, (req, res) => {
  const { id } = req.body;
  const idx = bookings.findIndex(b => b.id === id);
  if (idx === -1) return res.status(404).json({ error: "Booking not found" });
  const booking = bookings[idx];
  const slot = slots.find(s => s.id === booking.slotId);
  if (slot) slot.isBooked = false;
  bookings.splice(idx, 1);
  res.json({ message: "Booking cancelled" });
});

app.post("/admin/logout", auth, (req, res) => {
  adminSession = false;
  res.json({ message: "Logged out" });
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));