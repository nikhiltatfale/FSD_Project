const express = require("express");
const app = express();
app.use(express.json());
app.use(express.static("public"));

const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";
let adminToken = null;

let responses = {
  hello: "Hi! How can I help you today?",
  hi: "Hello! What can I do for you?",
  price: "Our pricing starts at ₹999. Contact us for custom plans.",
  pricing: "Our pricing starts at ₹999. Contact us for custom plans.",
  services: "We offer web development, app design, and digital marketing.",
  contact: "Reach us at support@company.com or call +91-9876543210.",
  hours: "We are available Monday to Saturday, 9 AM to 6 PM IST.",
  location: "We are based in Pune, Maharashtra, India.",
  bye: "Goodbye! Have a great day!",
  thanks: "You're welcome! Is there anything else I can help with?"
};

let chatLogs = [];

function getReply(msg) {
  const lower = msg.toLowerCase();
  for (const key in responses) {
    if (lower.includes(key)) return responses[key];
  }
  return "Our support team will contact you shortly. Thank you!";
}

app.post("/chat", (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "No message" });
  const bot = getReply(message);
  chatLogs.push({ user: message, bot, time: new Date().toISOString() });
  res.json({ reply: bot });
});

app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    adminToken = "tok_" + Date.now();
    return res.json({ token: adminToken });
  }
  res.status(401).json({ error: "Invalid credentials" });
});

function auth(req, res, next) {
  if (req.headers.authorization === adminToken) return next();
  res.status(403).json({ error: "Unauthorized" });
}

app.get("/admin/logs", auth, (req, res) => res.json(chatLogs));

app.post("/admin/add", auth, (req, res) => {
  const { keyword, reply } = req.body;
  if (!keyword || !reply) return res.status(400).json({ error: "Missing fields" });
  responses[keyword.toLowerCase()] = reply;
  res.json({ success: true });
});

app.put("/admin/edit", auth, (req, res) => {
  const { keyword, reply } = req.body;
  if (!responses[keyword]) return res.status(404).json({ error: "Not found" });
  responses[keyword.toLowerCase()] = reply;
  res.json({ success: true });
});

app.delete("/admin/delete", auth, (req, res) => {
  const { keyword } = req.body;
  if (!responses[keyword]) return res.status(404).json({ error: "Not found" });
  delete responses[keyword.toLowerCase()];
  res.json({ success: true });
});

app.delete("/admin/clear", auth, (req, res) => {
  chatLogs = [];
  res.json({ success: true });
});

app.get("/admin/responses", auth, (req, res) => res.json(responses));

app.listen(3000, () => console.log("Server running at http://localhost:3000"));