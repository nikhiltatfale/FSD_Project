const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
const ADMIN = { username: "admin", password: "1234" };
let leaves = [];
let nextId = 1;
let adminLoggedIn = false;
app.post("/apply-leave", (req, res) => {
  const { name, empId, department, leaveType, fromDate, toDate, reason } = req.body;
  if (!name || !empId || !department || !leaveType || !fromDate || !toDate || !reason) return res.status(400).json({ error: "All fields required" });
  if (new Date(fromDate) > new Date(toDate)) return res.status(400).json({ error: "From date must be <= To date" });
  const leave = { id: nextId++, name, empId, department, leaveType, fromDate, toDate, reason, status: "Pending" };
  leaves.push(leave);
  res.json({ success: true, leave });
});
app.get("/employee/:empId", (req, res) => {
  res.json(leaves.filter(l => l.empId === req.params.empId));
});
app.post("/admin-login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) { adminLoggedIn = true; return res.json({ success: true }); }
  res.status(401).json({ error: "Invalid credentials" });
});
app.get("/all-leaves", (req, res) => {
  if (!adminLoggedIn) return res.status(403).json({ error: "Unauthorized" });
  const q = req.query.empId;
  res.json(q ? leaves.filter(l => l.empId === q) : leaves);
});
app.post("/update-status", (req, res) => {
  if (!adminLoggedIn) return res.status(403).json({ error: "Unauthorized" });
  const { id, status } = req.body;
  const leave = leaves.find(l => l.id === id);
  if (!leave) return res.status(404).json({ error: "Not found" });
  leave.status = status;
  res.json({ success: true, leave });
});
app.delete("/delete/:id", (req, res) => {
  if (!adminLoggedIn) return res.status(403).json({ error: "Unauthorized" });
  const id = parseInt(req.params.id);
  leaves = leaves.filter(l => l.id !== id);
  res.json({ success: true });
});
app.listen(3000, () => console.log("Running on http://localhost:3000"));