const express = require("express");
const app = express();
app.use(express.json());
app.use(express.static("public"));

const ADMIN = { username: "admin", password: "admin123" };
const tokens = new Set();
let posts = [
  { id: 1, title: "Welcome to the Blog", content: "This is your first blog post. Edit or delete it from the admin panel.", author: "Admin", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isPublished: true },
];
let nextId = 2;

function auth(req, res, next) {
  const t = req.headers["authorization"];
  if (!t || !tokens.has(t)) return res.status(401).json({ error: "Unauthorized" });
  next();
}

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) {
    const token = Math.random().toString(36).slice(2) + Date.now();
    tokens.add(token);
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.post("/api/logout", auth, (req, res) => {
  tokens.delete(req.headers["authorization"]);
  res.json({ ok: true });
});

app.get("/api/posts", (req, res) => {
  res.json(posts.filter(p => p.isPublished));
});

app.get("/api/posts/:id", (req, res) => {
  const p = posts.find(p => p.id === +req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(p);
});

app.get("/api/admin/posts", auth, (req, res) => {
  res.json(posts);
});

app.post("/api/posts", auth, (req, res) => {
  const { title, content, author } = req.body;
  if (!title || !content || !author) return res.status(400).json({ error: "title, content, author required" });
  const p = { id: nextId++, title, content, author, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isPublished: false };
  posts.push(p);
  res.status(201).json(p);
});

app.put("/api/posts/:id", auth, (req, res) => {
  const p = posts.find(p => p.id === +req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });
  const { title, content, author } = req.body;
  if (title) p.title = title;
  if (content) p.content = content;
  if (author) p.author = author;
  p.updatedAt = new Date().toISOString();
  res.json(p);
});

app.delete("/api/posts/:id", auth, (req, res) => {
  const idx = posts.findIndex(p => p.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  posts.splice(idx, 1);
  res.json({ ok: true });
});

app.patch("/api/posts/:id/publish", auth, (req, res) => {
  const p = posts.find(p => p.id === +req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });
  p.isPublished = !p.isPublished;
  p.updatedAt = new Date().toISOString();
  res.json(p);
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));