const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";
const orders = {};

function id() {
  return "ORD" + Math.random().toString(36).substr(2, 6).toUpperCase();
}

app.post("/order", (req, res) => {
  const { name, phone, address, item, quantity } = req.body;
  if (!name || !phone || !address || !item || !quantity) return res.status(400).json({ error: "All fields required" });
  if (!/^\d{7,15}$/.test(phone)) return res.status(400).json({ error: "Invalid phone" });
  const orderId = id();
  orders[orderId] = { name, phone, address, item, quantity, status: "Order Placed", createdAt: Date.now() };
  res.json({ orderId });
});

app.get("/track/:id", (req, res) => {
  const o = orders[req.params.id];
  if (!o) return res.status(404).json({ error: "Order not found" });
  res.json(o);
});

app.get("/orders", (req, res) => {
  const { auth } = req.headers;
  if (auth !== btoa(ADMIN_USER + ":" + ADMIN_PASS)) return res.status(401).json({ error: "Unauthorized" });
  res.json(orders);
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) return res.json({ token: btoa(username + ":" + password) });
  res.status(401).json({ error: "Invalid credentials" });
});

app.put("/update/:id", (req, res) => {
  const { auth } = req.headers;
  if (auth !== btoa(ADMIN_USER + ":" + ADMIN_PASS)) return res.status(401).json({ error: "Unauthorized" });
  if (!orders[req.params.id]) return res.status(404).json({ error: "Not found" });
  orders[req.params.id].status = req.body.status;
  res.json({ ok: true });
});

app.delete("/delete/:id", (req, res) => {
  const { auth } = req.headers;
  if (auth !== btoa(ADMIN_USER + ":" + ADMIN_PASS)) return res.status(401).json({ error: "Unauthorized" });
  if (!orders[req.params.id]) return res.status(404).json({ error: "Not found" });
  delete orders[req.params.id];
  res.json({ ok: true });
});

app.listen(3000, () => console.log("Running on http://localhost:3000"));

function btoa(s) { return Buffer.from(s).toString("base64"); }