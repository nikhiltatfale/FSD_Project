let token = null;
let logoClicks = 0;
let logoTimer = null;

const chatWindow = document.getElementById("chatWindow");
const msgInput = document.getElementById("msgInput");
const overlay = document.getElementById("overlay");
const adminModal = document.getElementById("adminModal");
const loginBox = document.getElementById("loginBox");
const dashboard = document.getElementById("dashboard");

function addMsg(text, type) {
  const d = document.createElement("div");
  d.className = "msg " + type;
  d.textContent = text;
  chatWindow.appendChild(d);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showTyping() {
  const d = document.createElement("div");
  d.className = "typing";
  d.id = "typing";
  d.textContent = "Bot is typing...";
  chatWindow.appendChild(d);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById("typing");
  if (t) t.remove();
}

async function sendMessage() {
  const msg = msgInput.value.trim();
  if (!msg) return;
  addMsg(msg, "user");
  msgInput.value = "";
  showTyping();
  try {
    const res = await fetch("/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg }) });
    const data = await res.json();
    removeTyping();
    addMsg(data.reply, "bot");
  } catch {
    removeTyping();
    addMsg("Connection error. Please try again.", "bot");
  }
}

msgInput.addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });
document.getElementById("sendBtn").addEventListener("click", sendMessage);

document.getElementById("logo").addEventListener("click", () => {
  logoClicks++;
  clearTimeout(logoTimer);
  logoTimer = setTimeout(() => { logoClicks = 0; }, 2000);
  if (logoClicks >= 5) {
    logoClicks = 0;
    openAdminModal();
  }
});

function openAdminModal() {
  overlay.classList.add("show");
  adminModal.classList.add("show");
  loginBox.style.display = "";
  dashboard.style.display = "none";
}

function closeAdminModal() {
  overlay.classList.remove("show");
  adminModal.classList.remove("show");
}

overlay.addEventListener("click", closeAdminModal);
document.getElementById("closeModal").addEventListener("click", closeAdminModal);

document.getElementById("loginBtn").addEventListener("click", async () => {
  const username = document.getElementById("adminUser").value;
  const password = document.getElementById("adminPass").value;
  const err = document.getElementById("loginErr");
  try {
    const res = await fetch("/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
    const data = await res.json();
    if (data.token) {
      token = data.token;
      err.textContent = "";
      loginBox.style.display = "none";
      dashboard.style.display = "";
      loadLogs();
    } else {
      err.textContent = "Invalid credentials.";
    }
  } catch {
    err.textContent = "Server error.";
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  token = null;
  closeAdminModal();
});

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.dataset.tab;
    document.getElementById("logsTab").style.display = target === "logs" ? "" : "none";
    document.getElementById("responsesTab").style.display = target === "responses" ? "" : "none";
    if (target === "logs") loadLogs();
    if (target === "responses") loadResponses();
  });
});

async function loadLogs() {
  const res = await fetch("/admin/logs", { headers: { Authorization: token } });
  const logs = await res.json();
  const el = document.getElementById("logsList");
  if (!logs.length) { el.innerHTML = "<p style='color:#555;font-size:13px'>No logs yet.</p>"; return; }
  el.innerHTML = logs.map(l => `<div class="log-item"><div class="log-user">User: ${l.user}</div><div class="log-bot">Bot: ${l.bot}</div><div class="log-time">${new Date(l.time).toLocaleString()}</div></div>`).join("");
}

document.getElementById("clearLogs").addEventListener("click", async () => {
  await fetch("/admin/clear", { method: "DELETE", headers: { Authorization: token } });
  loadLogs();
});

async function loadResponses() {
  const res = await fetch("/admin/responses", { headers: { Authorization: token } });
  const data = await res.json();
  const el = document.getElementById("responsesList");
  el.innerHTML = Object.entries(data).map(([k, v]) => `<div class="response-item"><span class="kw">${k}</span><span class="rp">${v}</span><button onclick="editResponse('${k}','${v.replace(/'/g,"\\'")}')">Edit</button><button class="del-btn" onclick="deleteResponse('${k}')">Delete</button></div>`).join("");
}

document.getElementById("addResponse").addEventListener("click", async () => {
  const keyword = document.getElementById("newKeyword").value.trim();
  const reply = document.getElementById("newReply").value.trim();
  if (!keyword || !reply) return;
  await fetch("/admin/add", { method: "POST", headers: { "Content-Type": "application/json", Authorization: token }, body: JSON.stringify({ keyword, reply }) });
  document.getElementById("newKeyword").value = "";
  document.getElementById("newReply").value = "";
  loadResponses();
});

async function deleteResponse(keyword) {
  await fetch("/admin/delete", { method: "DELETE", headers: { "Content-Type": "application/json", Authorization: token }, body: JSON.stringify({ keyword }) });
  loadResponses();
}

function editResponse(keyword, reply) {
  const newReply = prompt("Edit reply for '" + keyword + "':", reply);
  if (newReply === null) return;
  fetch("/admin/edit", { method: "PUT", headers: { "Content-Type": "application/json", Authorization: token }, body: JSON.stringify({ keyword, reply: newReply }) }).then(loadResponses);
}

addMsg("Hello! I'm SupportBot. How can I help you today?", "bot");