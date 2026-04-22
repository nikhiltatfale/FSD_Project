let isAdmin = false;
let editId = null;
let pollInterval = null;
let adminPollInterval = null;
let viewingBidsFor = null;

function showView(v) {
  document.getElementById("viewUser").style.display = v === "user" ? "" : "none";
  document.getElementById("viewAdminLogin").style.display = v === "adminLogin" ? "" : "none";
  document.getElementById("viewAdmin").style.display = v === "admin" ? "" : "none";
}

async function fetchItems() {
  try {
    const r = await fetch("/items");
    const items = await r.json();
    renderItems(items);
  } catch {}
}

function fmtTimer(endTime) {
  const left = Math.max(0, endTime - Date.now());
  const s = Math.floor(left / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m + "m " + String(sec).padStart(2, "0") + "s";
}

function renderItems(items) {
  const grid = document.getElementById("itemsGrid");
  const active = items.filter(i => i.status === "active").length;
  document.getElementById("liveCount").textContent = active + " Live";
  if (!items.length) { grid.innerHTML = '<div style="color:var(--muted);padding:40px 0;grid-column:1/-1">No auction items yet.</div>'; return; }
  grid.innerHTML = items.map(item => {
    const badge = item.status === "active" ? "badge-active" : item.status === "ended" ? "badge-ended" : "badge-pending";
    const label = item.status === "active" ? "Live" : item.status === "ended" ? "Ended" : "Pending";
    const timer = item.status === "active" ? `<div class="timer" id="timer-${item.id}">${fmtTimer(item.endTime)}</div>` : "";
    const winner = item.status === "ended" && item.highestBidder ? `<div class="winner-box">🏆 Winner: <strong>${item.highestBidder}</strong> — $${item.currentBid.toFixed(2)}</div>` : item.status === "ended" ? `<div class="winner-box" style="color:var(--muted)">No bids placed</div>` : "";
    const bidInput = item.status === "active" ? `<div class="card-footer"><input type="number" id="bid-${item.id}" placeholder="Enter bid"><button class="btn-primary btn-sm" onclick="placeBid(${item.id})">Bid</button></div><div id="msg-${item.id}"></div>` : "";
    return `<div class="item-card">
      <div class="card-head"><h3>${item.name}</h3><span class="status-badge ${badge}">${label}</span></div>
      <div class="card-body">
        <div class="card-desc">${item.description || "No description"}</div>
        <div class="bid-row"><span class="bid-label">Start Price</span><span class="bid-value">$${item.startPrice.toFixed(2)}</span></div>
        <div class="bid-row"><span class="bid-label">Current Bid</span><span class="bid-value highlight">$${item.currentBid.toFixed(2)}</span></div>
        ${item.highestBidder && item.status === "active" ? `<div class="bid-row"><span class="bid-label">Top Bidder</span><span class="bid-value">${item.highestBidder}</span></div>` : ""}
        ${timer}${winner}
      </div>
      ${bidInput}
    </div>`;
  }).join("");
  items.filter(i => i.status === "active").forEach(item => {
    const el = document.getElementById("timer-" + item.id);
    if (el) {
      clearInterval(el._t);
      el._t = setInterval(() => {
        const left = item.endTime - Date.now();
        if (left <= 0) { el.textContent = "0m 00s"; clearInterval(el._t); fetchItems(); }
        else el.textContent = fmtTimer(item.endTime);
      }, 1000);
    }
  });
}

async function placeBid(id) {
  const bidder = prompt("Your name:");
  if (!bidder) return;
  const amt = document.getElementById("bid-" + id).value;
  const msg = document.getElementById("msg-" + id);
  try {
    const r = await fetch("/bid", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: id, bidderName: bidder.trim(), bidAmount: parseFloat(amt) }) });
    const d = await r.json();
    msg.className = "msg " + (r.ok ? "ok" : "fail");
    msg.textContent = r.ok ? "✓ Bid placed successfully!" : "✗ " + d.error;
    if (r.ok) { fetchItems(); document.getElementById("bid-" + id) && (document.getElementById("bid-" + id).value = ""); }
  } catch { msg.className = "msg fail"; msg.textContent = "Network error"; }
}

async function adminLogin() {
  const u = document.getElementById("loginUser").value;
  const p = document.getElementById("loginPass").value;
  const err = document.getElementById("loginErr");
  try {
    const r = await fetch("/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: u, password: p }) });
    if (r.ok) {
      isAdmin = true;
      document.getElementById("navLogout").style.display = "";
      showView("admin");
      loadAdminItems();
      adminPollInterval = setInterval(loadAdminItems, 3000);
    } else {
      const d = await r.json();
      err.textContent = d.error;
    }
  } catch { err.textContent = "Network error"; }
}

async function adminLogout() {
  await fetch("/admin/logout", { method: "POST" });
  isAdmin = false;
  clearInterval(adminPollInterval);
  document.getElementById("navLogout").style.display = "none";
  showView("user");
}

async function loadAdminItems() {
  const r = await fetch("/items");
  const items = await r.json();
  renderAdminItems(items);
  if (viewingBidsFor !== null) loadBids(viewingBidsFor);
}

function renderAdminItems(items) {
  const el = document.getElementById("adminItemsList");
  if (!items.length) { el.innerHTML = '<div style="color:var(--muted);font-size:13px">No items added yet.</div>'; return; }
  el.innerHTML = items.map(item => {
    const badge = item.status === "active" ? "badge-active" : item.status === "ended" ? "badge-ended" : "badge-pending";
    const label = item.status === "active" ? "Live" : item.status === "ended" ? "Ended" : "Pending";
    return `<div class="admin-item">
      <div class="admin-item-head">
        <strong>${item.name}</strong>
        <span class="status-badge ${badge}">${label}</span>
      </div>
      <div style="font-size:12px;color:var(--muted)">Start: $${item.startPrice.toFixed(2)} | Current: <strong style="color:var(--accent)">$${item.currentBid.toFixed(2)}</strong>${item.highestBidder ? " | Top: " + item.highestBidder : ""}</div>
      <div class="admin-item-actions">
        ${item.status !== "active" ? `<input type="number" id="dur-${item.id}" value="60" title="Duration (sec)"><button class="btn-outline btn-sm" onclick="startAuction(${item.id})">▶ Start</button>` : ""}
        ${item.status === "active" ? `<button class="btn-sm" style="background:var(--accent2);color:#fff" onclick="stopAuction(${item.id})">■ Stop</button>` : ""}
        <button class="btn-outline btn-sm" onclick="openEdit(${item.id},'${escStr(item.name)}','${escStr(item.description || "")}',${item.startPrice})">Edit</button>
        <button class="danger btn-sm" onclick="deleteItem(${item.id})">Delete</button>
        <button class="btn-outline btn-sm" onclick="loadBids(${item.id})">Bids</button>
      </div>
    </div>`;
  }).join("");
}

function escStr(s) { return s.replace(/'/g, "\\'").replace(/"/g, '\\"'); }

async function addItem() {
  const name = document.getElementById("aName").value.trim();
  const desc = document.getElementById("aDesc").value.trim();
  const price = document.getElementById("aPrice").value;
  if (!name || isNaN(parseFloat(price))) return alert("Item name and valid price required");
  await fetch("/admin/add-item", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description: desc, startPrice: price }) });
  document.getElementById("aName").value = "";
  document.getElementById("aDesc").value = "";
  document.getElementById("aPrice").value = "";
  loadAdminItems();
}

async function deleteItem(id) {
  if (!confirm("Delete this item?")) return;
  await fetch("/admin/delete-item/" + id, { method: "DELETE" });
  loadAdminItems();
}

async function startAuction(id) {
  const dur = document.getElementById("dur-" + id)?.value || 60;
  await fetch("/admin/start/" + id, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ duration: parseInt(dur) }) });
  loadAdminItems();
}

async function stopAuction(id) {
  await fetch("/admin/stop/" + id, { method: "POST" });
  loadAdminItems();
}

async function resetSystem() {
  if (!confirm("Reset entire system? This deletes all items and bids.")) return;
  await fetch("/admin/reset", { method: "POST" });
  viewingBidsFor = null;
  document.getElementById("bidsList").innerHTML = "";
  document.getElementById("bidsFor").textContent = "";
  loadAdminItems();
}

function openEdit(id, name, desc, price) {
  editId = id;
  document.getElementById("modalTitle").textContent = "Edit Item";
  document.getElementById("modalName").value = name;
  document.getElementById("modalDesc").value = desc;
  document.getElementById("modalPrice").value = price;
  document.getElementById("modal").style.display = "flex";
}

function closeModal() { document.getElementById("modal").style.display = "none"; editId = null; }

async function saveEdit() {
  if (!editId) return;
  const name = document.getElementById("modalName").value.trim();
  const desc = document.getElementById("modalDesc").value.trim();
  const price = document.getElementById("modalPrice").value;
  if (!name) return alert("Name required");
  await fetch("/admin/edit-item/" + editId, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description: desc, startPrice: price }) });
  closeModal();
  loadAdminItems();
}

async function loadBids(id) {
  viewingBidsFor = id;
  const r = await fetch("/bids/" + id);
  const bids = await r.json();
  document.getElementById("bidsFor").textContent = "#" + id;
  const el = document.getElementById("bidsList");
  if (!bids.length) { el.innerHTML = '<div style="color:var(--muted);font-size:12px">No bids yet.</div>'; return; }
  el.innerHTML = bids.slice().reverse().map(b =>
    `<div class="bid-entry"><strong>$${b.bidAmount.toFixed(2)} — ${b.bidderName}</strong><span>${new Date(b.time).toLocaleTimeString()}</span></div>`
  ).join("");
}

pollInterval = setInterval(fetchItems, 4000);
fetchItems();