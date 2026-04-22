const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

let users = [];
let logs = [];
let uid = 1;
let lid = 1;

const ADMIN = { email: "admin@fit.com", password: "admin123" };

function json(res, code, data) {
  res.writeHead(code, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
  res.end(JSON.stringify(data));
}

function serveStatic(res, filePath, ct) {
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, { "Content-Type": ct });
    res.end(data);
  });
}

function body(req) {
  return new Promise(r => { let d = ""; req.on("data", c => d += c); req.on("end", () => r(JSON.parse(d || "{}"))); });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") { json(res, 200, {}); return; }
  const { pathname } = url.parse(req.url);
  const pub = path.join(__dirname, "public");

  if (req.method === "GET" && pathname === "/") { serveStatic(res, path.join(pub, "index.html"), "text/html"); return; }
  if (req.method === "GET" && pathname === "/style.css") { serveStatic(res, path.join(pub, "style.css"), "text/css"); return; }
  if (req.method === "GET" && pathname === "/script.js") { serveStatic(res, path.join(pub, "script.js"), "application/javascript"); return; }

  if (req.method === "POST" && pathname === "/register") {
    const b = await body(req);
    if (!b.name || !b.email || !b.password) return json(res, 400, { error: "Missing fields" });
    if (b.password.length < 6) return json(res, 400, { error: "Password min 6 chars" });
    if (users.find(u => u.email === b.email)) return json(res, 400, { error: "Email exists" });
    const u = { id: uid++, name: b.name, email: b.email, password: b.password, height: b.height || "", age: b.age || "", currentWeight: b.currentWeight || "", targetWeight: b.targetWeight || "" };
    users.push(u);
    const { password, ...safe } = u;
    return json(res, 201, safe);
  }

  if (req.method === "POST" && pathname === "/login") {
    const b = await body(req);
    const u = users.find(u => u.email === b.email && u.password === b.password);
    if (!u) return json(res, 401, { error: "Invalid credentials" });
    const { password, ...safe } = u;
    return json(res, 200, safe);
  }

  if (req.method === "POST" && pathname === "/admin-login") {
    const b = await body(req);
    if (b.email === ADMIN.email && b.password === ADMIN.password) return json(res, 200, { role: "admin" });
    return json(res, 401, { error: "Invalid admin credentials" });
  }

  if (req.method === "GET" && pathname === "/users") {
    return json(res, 200, users.map(({ password, ...u }) => u));
  }

  if (req.method === "DELETE" && pathname.startsWith("/user/")) {
    const id = parseInt(pathname.split("/")[2]);
    users = users.filter(u => u.id !== id);
    logs = logs.filter(l => l.userId !== id);
    return json(res, 200, { ok: true });
  }

  if (req.method === "POST" && pathname === "/log") {
    const b = await body(req);
    if (!b.userId || !b.date) return json(res, 400, { error: "Missing fields" });
    const l = { id: lid++, userId: b.userId, date: b.date, steps: b.steps || 0, calories: b.calories || 0, workoutType: b.workoutType || "", duration: b.duration || 0, weight: b.weight || 0 };
    logs.push(l);
    return json(res, 201, l);
  }

  if (req.method === "GET" && pathname.startsWith("/logs/")) {
    const userId = parseInt(pathname.split("/")[2]);
    return json(res, 200, logs.filter(l => l.userId === userId));
  }

  if (req.method === "GET" && pathname === "/logs") {
    return json(res, 200, logs);
  }

  if (req.method === "PUT" && pathname.startsWith("/log/")) {
    const id = parseInt(pathname.split("/")[2]);
    const b = await body(req);
    const i = logs.findIndex(l => l.id === id);
    if (i === -1) return json(res, 404, { error: "Not found" });
    logs[i] = { ...logs[i], ...b };
    return json(res, 200, logs[i]);
  }

  if (req.method === "DELETE" && pathname.startsWith("/log/")) {
    const id = parseInt(pathname.split("/")[2]);
    logs = logs.filter(l => l.id !== id);
    return json(res, 200, { ok: true });
  }

  if (req.method === "GET" && pathname === "/stats") {
    const totalCalories = logs.reduce((s, l) => s + Number(l.calories), 0);
    const totalSteps = logs.reduce((s, l) => s + Number(l.steps), 0);
    const userLogCount = {};
    logs.forEach(l => { userLogCount[l.userId] = (userLogCount[l.userId] || 0) + 1; });
    let mostActiveId = null, max = 0;
    Object.entries(userLogCount).forEach(([id, c]) => { if (c > max) { max = c; mostActiveId = parseInt(id); } });
    const mostActive = users.find(u => u.id === mostActiveId);
    return json(res, 200, { totalUsers: users.length, totalLogs: logs.length, totalCalories, totalSteps, mostActiveUser: mostActive ? mostActive.name : "N/A" });
  }

  res.writeHead(404); res.end("Not found");
});

server.listen(3000, () => console.log("Server running at http://localhost:3000"));