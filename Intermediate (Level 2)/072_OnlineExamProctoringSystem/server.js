const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let students = {};
let questions = [
  { id: 1, text: "What is the output of console.log(typeof null)?", options: ["null", "object", "undefined", "string"], answer: 1 },
  { id: 2, text: "Which protocol is used for secure web communication?", options: ["HTTP", "FTP", "HTTPS", "SMTP"], answer: 2 },
  { id: 3, text: "What does CPU stand for?", options: ["Central Process Unit", "Central Processing Unit", "Computer Processing Unit", "Core Processing Unit"], answer: 1 },
  { id: 4, text: "Which data structure uses LIFO?", options: ["Queue", "Stack", "Linked List", "Tree"], answer: 1 },
  { id: 5, text: "What is 2^10?", options: ["512", "1024", "2048", "256"], answer: 1 }
];
let logs = [];
let results = [];
let activeExams = {};
let examConfig = { violationLimit: 5, examActive: true };
let adminPassword = "admin123";

app.post("/start-exam", (req, res) => {
  const { name, rollNo, department, college } = req.body;
  if (!name || !rollNo) return res.status(400).json({ error: "Missing fields" });
  const studentId = rollNo + "_" + Date.now();
  students[studentId] = { name, rollNo, department, college, startTime: Date.now(), violations: 0 };
  activeExams[studentId] = { current: 0, answers: [] };
  res.json({ studentId, total: questions.length });
});

app.get("/questions", (req, res) => {
  res.json(questions.map(q => ({ id: q.id, text: q.text, options: q.options })));
});

app.post("/log", (req, res) => {
  const { studentId, event, detail } = req.body;
  if (!students[studentId]) return res.status(404).json({ error: "Student not found" });
  logs.push({ studentId, event, detail, time: new Date().toISOString(), name: students[studentId].name });
  students[studentId].violations++;
  res.json({ violations: students[studentId].violations, limit: examConfig.violationLimit });
});

app.post("/submit", (req, res) => {
  const { studentId, answers } = req.body;
  if (!students[studentId]) return res.status(404).json({ error: "Student not found" });
  let score = 0;
  const detail = answers.map((ans, i) => {
    const correct = questions[i] && questions[i].answer === ans;
    if (correct) score++;
    return { q: i + 1, selected: ans, correct: questions[i] ? questions[i].answer : -1, got: correct };
  });
  const result = { studentId, name: students[studentId].name, rollNo: students[studentId].rollNo, score, total: questions.length, detail, time: new Date().toISOString() };
  results.push(result);
  delete activeExams[studentId];
  res.json(result);
});

app.post("/admin-login", (req, res) => {
  const { password } = req.body;
  if (password === adminPassword) res.json({ success: true, token: "admin_" + Date.now() });
  else res.status(401).json({ error: "Wrong password" });
});

app.get("/admin/students", (req, res) => {
  res.json(Object.entries(students).map(([id, s]) => ({ id, ...s, active: !!activeExams[id] })));
});

app.get("/admin/logs", (req, res) => { res.json(logs); });

app.get("/admin/results", (req, res) => { res.json(results); });

app.post("/admin/exam", (req, res) => {
  const { action, question } = req.body;
  if (action === "add" && question) {
    questions.push({ id: questions.length + 1, ...question });
    res.json({ success: true, total: questions.length });
  } else if (action === "clear") {
    questions = [];
    res.json({ success: true });
  } else if (action === "config") {
    if (req.body.violationLimit) examConfig.violationLimit = req.body.violationLimit;
    if (req.body.examActive !== undefined) examConfig.examActive = req.body.examActive;
    res.json(examConfig);
  } else {
    res.status(400).json({ error: "Invalid action" });
  }
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));