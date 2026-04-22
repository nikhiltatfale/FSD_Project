const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const ADMIN = { username: "admin", password: "admin123" };

let jobs = [
  { id: 1, role: "Frontend Developer", keywords: ["html", "css", "javascript", "react", "typescript", "webpack"] },
  { id: 2, role: "Backend Developer", keywords: ["node", "express", "mongodb", "sql", "api", "python"] },
  { id: 3, role: "Data Scientist", keywords: ["python", "pandas", "numpy", "ml", "tensorflow", "statistics"] },
  { id: 4, role: "DevOps Engineer", keywords: ["docker", "kubernetes", "aws", "ci", "linux", "terraform"] }
];

let candidates = [];
let nextJobId = 5;

app.get("/jobs", (req, res) => res.json(jobs));

app.post("/admin-login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) res.json({ success: true });
  else res.status(401).json({ success: false });
});

app.post("/submit-resume", (req, res) => {
  const { name, email, phone, role, resumeText } = req.body;
  const job = jobs.find(j => j.role === role);
  if (!job) return res.status(400).json({ error: "Invalid role" });
  const text = resumeText.toLowerCase();
  const matched = job.keywords.filter(k => text.includes(k));
  const missing = job.keywords.filter(k => !text.includes(k));
  const score = Math.round((matched.length / job.keywords.length) * 100);
  const status = score > 70 ? "Selected" : score >= 40 ? "Review" : "Rejected";
  const candidate = { id: Date.now(), name, email, phone, role, score, status, matched, missing, resumeText };
  candidates.push(candidate);
  res.json({ score, status, matched, missing });
});

app.get("/candidates", (req, res) => res.json(candidates));

app.post("/add-job", (req, res) => {
  const { role, keywords } = req.body;
  const job = { id: nextJobId++, role, keywords: keywords.map(k => k.toLowerCase().trim()) };
  jobs.push(job);
  res.json(job);
});

app.delete("/delete-job/:id", (req, res) => {
  jobs = jobs.filter(j => j.id !== parseInt(req.params.id));
  res.json({ success: true });
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));