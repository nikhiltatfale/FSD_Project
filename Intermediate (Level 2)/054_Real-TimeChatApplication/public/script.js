const socket = io();

let myUsername = '';
let isAdmin = false;
let allUsers = [];
let allMessages = []; // local mirror for admin panel

// DOM refs
const joinScreen = document.getElementById('joinScreen');
const chatScreen = document.getElementById('chatScreen');
const usernameInput = document.getElementById('usernameInput');
const joinBtn = document.getElementById('joinBtn');
const joinError = document.getElementById('joinError');

const messages = document.getElementById('messages');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');
const leaveBtn = document.getElementById('leaveBtn');
const userListEl = document.getElementById('userList');

const adminToggleBtn = document.getElementById('adminToggleBtn');
const adminLoginBox = document.getElementById('adminLoginBox');
const adminPassInput = document.getElementById('adminPassInput');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLoginMsg = document.getElementById('adminLoginMsg');
const adminPanel = document.getElementById('adminPanel');
const adminUserList = document.getElementById('adminUserList');
const adminMsgList = document.getElementById('adminMsgList');
const clearChatBtn = document.getElementById('clearChatBtn');
const activityLogList = document.getElementById('activityLogList');

// ── JOIN ──────────────────────────────────────────
joinBtn.addEventListener('click', doJoin);
usernameInput.addEventListener('keydown', e => { if (e.key === 'Enter') doJoin(); });

function doJoin() {
  const username = usernameInput.value.trim();
  if (!username) { joinError.textContent = 'Enter a username'; return; }
  socket.emit('join', { username });
}

socket.on('joinError', msg => { joinError.textContent = msg; });

socket.on('joinSuccess', ({ username, chatHistory, activityLog }) => {
  myUsername = username;
  joinScreen.style.display = 'none';
  chatScreen.style.display = 'flex';

  // Render history
  chatHistory.forEach(renderMessage);
  allMessages = [...chatHistory];
  renderActivityLog(activityLog);
  scrollToBottom();
});

// ── MESSAGES ──────────────────────────────────────
socket.on('message', (msg) => {
  allMessages.push(msg);
  renderMessage(msg);
  scrollToBottom();
  if (isAdmin) renderAdminMessages();
});

socket.on('messageDeleted', (msgId) => {
  allMessages = allMessages.filter(m => m.id != msgId);
  // Remove from chat view
  const el = document.querySelector(`[data-id="${msgId}"]`);
  if (el) el.remove();
  if (isAdmin) renderAdminMessages();
});

socket.on('chatCleared', () => {
  allMessages = [];
  messages.innerHTML = '';
  if (isAdmin) renderAdminMessages();
});

sendBtn.addEventListener('click', sendMessage);
msgInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

function sendMessage() {
  const msg = msgInput.value.trim();
  if (!msg) return;
  socket.emit('message', { message: msg });
  msgInput.value = '';
}

function renderMessage(msg) {
  const div = document.createElement('div');
  div.dataset.id = msg.id;
  if (msg.system) {
    div.className = 'msg system';
    div.innerHTML = `<span class="text">${escHtml(msg.message)} <span style="font-size:10px">${msg.time}</span></span>`;
  } else {
    const ismine = msg.username === myUsername;
    div.className = 'msg ' + (ismine ? 'mine' : 'other');
    div.innerHTML = `<div class="meta">${escHtml(msg.username)} · ${msg.time}</div><div class="text">${escHtml(msg.message)}</div>`;
  }
  messages.appendChild(div);
}

function scrollToBottom() {
  messages.scrollTop = messages.scrollHeight;
}

// ── USER LIST ─────────────────────────────────────
socket.on('userList', (users) => {
  allUsers = users;
  userListEl.innerHTML = '';
  users.forEach(u => {
    const li = document.createElement('li');
    li.textContent = u.username + (u.isAdmin ? ' 🛡️' : '');
    userListEl.appendChild(li);
  });
  if (isAdmin) renderAdminUsers();
});

// ── LEAVE ─────────────────────────────────────────
leaveBtn.addEventListener('click', () => {
  socket.disconnect();
  location.reload();
});

// ── KICKED ────────────────────────────────────────
socket.on('kicked', (msg) => {
  alert(msg);
  location.reload();
});

// ── ADMIN LOGIN ───────────────────────────────────
adminToggleBtn.addEventListener('click', () => {
  adminLoginBox.style.display = adminLoginBox.style.display === 'none' ? 'block' : 'none';
});

adminLoginBtn.addEventListener('click', () => {
  socket.emit('adminLogin', { password: adminPassInput.value });
});

adminPassInput.addEventListener('keydown', e => { if (e.key === 'Enter') adminLoginBtn.click(); });

socket.on('adminLoginSuccess', () => {
  isAdmin = true;
  adminLoginMsg.style.color = '#4f4';
  adminLoginMsg.textContent = 'Logged in as Admin';
  adminPanel.style.display = 'flex';
  adminToggleBtn.textContent = '🛡️ Admin';
  renderAdminUsers();
  renderAdminMessages();
});

socket.on('adminLoginFail', (msg) => {
  adminLoginMsg.style.color = '#f66';
  adminLoginMsg.textContent = msg;
});

// ── ADMIN: USERS ──────────────────────────────────
function renderAdminUsers() {
  adminUserList.innerHTML = '';
  allUsers.forEach(u => {
    if (u.username === myUsername) return; // don't kick self
    const li = document.createElement('li');
    li.innerHTML = `<span>${escHtml(u.username)}</span>`;
    const btn = document.createElement('button');
    btn.className = 'kickBtn';
    btn.textContent = 'Kick';
    btn.onclick = () => {
      if (confirm(`Kick ${u.username}?`)) socket.emit('kickUser', { targetId: u.id });
    };
    li.appendChild(btn);
    adminUserList.appendChild(li);
  });
}

// ── ADMIN: MESSAGES ───────────────────────────────
function renderAdminMessages() {
  adminMsgList.innerHTML = '';
  [...allMessages].reverse().forEach(msg => {
    if (msg.system) return;
    const li = document.createElement('li');
    li.innerHTML = `<span><b>${escHtml(msg.username)}:</b> ${escHtml(msg.message.substring(0,40))}${msg.message.length>40?'…':''}</span>`;
    const btn = document.createElement('button');
    btn.className = 'delBtn';
    btn.textContent = 'Del';
    btn.onclick = () => socket.emit('deleteMessage', { msgId: msg.id });
    li.appendChild(btn);
    adminMsgList.appendChild(li);
  });
}

// ── ADMIN: CLEAR ──────────────────────────────────
clearChatBtn.addEventListener('click', () => {
  if (confirm('Clear all chat for everyone?')) socket.emit('clearChat');
});

// ── ACTIVITY LOG ──────────────────────────────────
socket.on('activityLog', (log) => {
  renderActivityLog(log);
});

function renderActivityLog(log) {
  activityLogList.innerHTML = '';
  [...log].reverse().slice(0, 30).forEach(entry => {
    const li = document.createElement('li');
    li.textContent = `[${entry.time}] ${entry.username} ${entry.event}`;
    activityLogList.appendChild(li);
  });
}

// ── UTIL ──────────────────────────────────────────
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}