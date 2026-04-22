const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const ADMIN = { username: "admin", password: "admin123" };
let adminSession = false;

let items = [];
let bids = [];
let nextId = 1;

function res404(res) { res.writeHead(404); res.end(JSON.stringify({ error: "Not found" })); }
function res401(res) { res.writeHead(401); res.end(JSON.stringify({ error: "Unauthorized" })); }
function resJSON(res, code, data) { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(data)); }
function serveFile(res, filePath, ct) {
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, { "Content-Type": ct });
    res.end(data);
  });
}
function bodyJSON(req, cb) {
  let body = "";
  req.on("data", d => body += d);
  req.on("end", () => { try { cb(JSON.parse(body)); } catch { cb({}); } });
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(200); res.end(); return; }

  const parsed = url.parse(req.url, true);
  const p = parsed.pathname;
  const method = req.method;

  if (method === "GET" && p === "/") return serveFile(res, path.join(__dirname, "public", "index.html"), "text/html");
  if (method === "GET" && p === "/style.css") return serveFile(res, path.join(__dirname, "public", "style.css"), "text/css");
  if (method === "GET" && p === "/script.js") return serveFile(res, path.join(__dirname, "public", "script.js"), "application/javascript");

  if (method === "GET" && p === "/items") {
    const now = Date.now();
    items.forEach(i => { if (i.status === "active" && i.endTime && now >= i.endTime) i.status = "ended"; });
    return resJSON(res, 200, items);
  }

  if (method === "POST" && p === "/bid") {
    return bodyJSON(req, body => {
      const { itemId, bidderName, bidAmount } = body;
      if (!bidderName || !bidAmount) return resJSON(res, 400, { error: "Missing fields" });
      const item = items.find(i => i.id === itemId);
      if (!item) return resJSON(res, 404, { error: "Item not found" });
      if (item.status !== "active") return resJSON(res, 400, { error: "Auction not active" });
      if (Date.now() >= item.endTime) { item.status = "ended"; return resJSON(res, 400, { error: "Auction ended" }); }
      const amt = parseFloat(bidAmount);
      if (isNaN(amt) || amt <= item.currentBid) return resJSON(res, 400, { error: "Bid too low" });
      item.currentBid = amt;
      item.highestBidder = bidderName;
      bids.push({ itemId, bidderName, bidAmount: amt, time: new Date().toISOString() });
      return resJSON(res, 200, { message: "Bid successful", item });
    });
  }

  if (method === "POST" && p === "/admin/login") {
    return bodyJSON(req, body => {
      if (body.username === ADMIN.username && body.password === ADMIN.password) {
        adminSession = true;
        return resJSON(res, 200, { message: "Login successful" });
      }
      return resJSON(res, 401, { error: "Invalid credentials" });
    });
  }

  if (method === "POST" && p === "/admin/logout") {
    adminSession = false;
    return resJSON(res, 200, { message: "Logged out" });
  }

  if (method === "POST" && p === "/admin/add-item") {
    if (!adminSession) return res401(res);
    return bodyJSON(req, body => {
      const { name, description, startPrice } = body;
      if (!name || isNaN(parseFloat(startPrice))) return resJSON(res, 400, { error: "Invalid data" });
      const item = { id: nextId++, name, description: description || "", startPrice: parseFloat(startPrice), currentBid: parseFloat(startPrice), highestBidder: null, endTime: null, status: "pending" };
      items.push(item);
      return resJSON(res, 201, item);
    });
  }

  const editMatch = p.match(/^\/admin\/edit-item\/(\d+)$/);
  if (method === "PUT" && editMatch) {
    if (!adminSession) return res401(res);
    return bodyJSON(req, body => {
      const item = items.find(i => i.id === parseInt(editMatch[1]));
      if (!item) return res404(res);
      if (body.name) item.name = body.name;
      if (body.description !== undefined) item.description = body.description;
      if (!isNaN(parseFloat(body.startPrice))) { item.startPrice = parseFloat(body.startPrice); if (item.status === "pending") item.currentBid = item.startPrice; }
      return resJSON(res, 200, item);
    });
  }

  const delMatch = p.match(/^\/admin\/delete-item\/(\d+)$/);
  if (method === "DELETE" && delMatch) {
    if (!adminSession) return res401(res);
    const idx = items.findIndex(i => i.id === parseInt(delMatch[1]));
    if (idx === -1) return res404(res);
    items.splice(idx, 1);
    return resJSON(res, 200, { message: "Deleted" });
  }

  const startMatch = p.match(/^\/admin\/start\/(\d+)$/);
  if (method === "POST" && startMatch) {
    if (!adminSession) return res401(res);
    return bodyJSON(req, body => {
      const item = items.find(i => i.id === parseInt(startMatch[1]));
      if (!item) return res404(res);
      const duration = parseInt(body.duration) || 60;
      item.status = "active";
      item.endTime = Date.now() + duration * 1000;
      item.currentBid = item.startPrice;
      item.highestBidder = null;
      return resJSON(res, 200, item);
    });
  }

  const stopMatch = p.match(/^\/admin\/stop\/(\d+)$/);
  if (method === "POST" && stopMatch) {
    if (!adminSession) return res401(res);
    const item = items.find(i => i.id === parseInt(stopMatch[1]));
    if (!item) return res404(res);
    item.status = "ended";
    item.endTime = Date.now();
    return resJSON(res, 200, item);
  }

  if (method === "POST" && p === "/admin/reset") {
    if (!adminSession) return res401(res);
    items = []; bids = []; nextId = 1;
    return resJSON(res, 200, { message: "Reset done" });
  }

  const bidsMatch = p.match(/^\/bids\/(\d+)$/);
  if (method === "GET" && bidsMatch) {
    const itemBids = bids.filter(b => b.itemId === parseInt(bidsMatch[1]));
    return resJSON(res, 200, itemBids);
  }

  res404(res);
});

server.listen(3000, () => console.log("Server running at http://localhost:3000"));