/* ============================================================
   ChatApp - Vanilla JS, localStorage-based 1-to-1 chat
   ============================================================ */

// ── State ────────────────────────────────────────────────────
let currentUser   = null;   // { id, username }
let chatPartner   = null;   // { id, username }
let pollInterval  = null;   // setInterval handle for chat polling
let lastMsgCount  = 0;      // used to detect new messages

// ── UUID Generator ───────────────────────────────────────────
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ── localStorage Helpers ─────────────────────────────────────
function saveUser(user) {
  localStorage.setItem('user_' + user.id, JSON.stringify(user));
}

function getUser(id) {
  const raw = localStorage.getItem('user_' + id);
  return raw ? JSON.parse(raw) : null;
}

function saveCurrentSession(user) {
  localStorage.setItem('currentSession', JSON.stringify(user));
}

function loadCurrentSession() {
  const raw = localStorage.getItem('currentSession');
  return raw ? JSON.parse(raw) : null;
}

function clearCurrentSession() {
  localStorage.removeItem('currentSession');
}

// ── Conversation Key (deterministic, order-independent) ──────
function getConvKey(idA, idB) {
  // smaller ID always first so key is same regardless of who opens it
  return idA < idB
    ? 'chat_' + idA + '_' + idB
    : 'chat_' + idB + '_' + idA;
}

function getMessages(idA, idB) {
  const raw = localStorage.getItem(getConvKey(idA, idB));
  return raw ? JSON.parse(raw) : [];
}

function saveMessages(idA, idB, msgs) {
  localStorage.setItem(getConvKey(idA, idB), JSON.stringify(msgs));
}

// ── Screen Navigation ────────────────────────────────────────
function showScreen(id) {
  ['loginScreen', 'homeScreen', 'chatScreen'].forEach(s => {
    document.getElementById(s).classList.add('hidden');
  });
  document.getElementById(id).classList.remove('hidden');
}

// ── Login / Register ─────────────────────────────────────────
function handleLogin() {
  const input = document.getElementById('usernameInput');
  const username = input.value.trim();
  if (!username) { alert('Please enter a username.'); return; }

  const user = { id: generateUUID(), username };
  currentUser = user;
  saveUser(user);          // save profile so others can find this user
  saveCurrentSession(user);
  renderHome();
}

// ── Home Screen ──────────────────────────────────────────────
function renderHome() {
  document.getElementById('welcomeText').textContent = 'Hi, ' + currentUser.username + ' 👋';
  document.getElementById('displayUserId').textContent = currentUser.id;
  document.getElementById('searchIdInput').value = '';
  document.getElementById('homeMsg').textContent = '';
  document.getElementById('confirmCard').classList.add('hidden');
  showScreen('homeScreen');
}

function copyUserId() {
  navigator.clipboard.writeText(currentUser.id)
    .then(() => alert('User ID copied to clipboard!'))
    .catch(() => {
      // fallback
      const el = document.createElement('textarea');
      el.value = currentUser.id;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      alert('User ID copied!');
    });
}

// ── Find User ────────────────────────────────────────────────
function findUser() {
  const searchId = document.getElementById('searchIdInput').value.trim();
  const msgEl    = document.getElementById('homeMsg');
  const confirmEl = document.getElementById('confirmCard');

  msgEl.textContent = '';
  confirmEl.classList.add('hidden');

  if (!searchId) { msgEl.textContent = 'Please paste a user ID.'; return; }
  if (searchId === currentUser.id) { msgEl.textContent = 'That\'s your own ID!'; return; }

  const found = getUser(searchId);
  if (!found) {
    msgEl.textContent = 'No user found with that ID.';
    return;
  }

  // Store found user temporarily
  chatPartner = found;

  // Show confirmation card
  document.getElementById('confirmText').textContent =
    'Start chat with ' + found.username + '?';
  confirmEl.classList.remove('hidden');
}

function startChat() {
  if (!chatPartner) return;
  openChat(chatPartner);
}

function cancelFind() {
  chatPartner = null;
  document.getElementById('confirmCard').classList.add('hidden');
  document.getElementById('searchIdInput').value = '';
}

// ── Chat Screen ──────────────────────────────────────────────
function openChat(partner) {
  chatPartner = partner;
  document.getElementById('chatWithName').textContent = '💬 ' + partner.username;
  showScreen('chatScreen');
  renderMessages();
  startPolling();
}

function backToHome() {
  stopPolling();
  chatPartner = null;
  renderHome();
}

// Render all messages in the conversation
function renderMessages() {
  const msgs = getMessages(currentUser.id, chatPartner.id);
  const container = document.getElementById('messagesContainer');
  const emptyState = document.getElementById('emptyState');

  // Clear all existing message rows (keep emptyState node)
  Array.from(container.querySelectorAll('.message-row')).forEach(el => el.remove());

  if (msgs.length === 0) {
    emptyState.style.display = 'block';
    lastMsgCount = 0;
    return;
  }

  emptyState.style.display = 'none';
  lastMsgCount = msgs.length;

  msgs.forEach(msg => {
    const isSent = msg.senderId === currentUser.id;
    const row = document.createElement('div');
    row.className = 'message-row ' + (isSent ? 'sent' : 'received');

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = msg.message;

    const ts = document.createElement('div');
    ts.className = 'ts';
    ts.textContent = formatTime(msg.timestamp);

    row.appendChild(bubble);
    row.appendChild(ts);
    container.appendChild(row);
  });

  scrollToBottom();
}

// Send a message
function sendMessage() {
  const input = document.getElementById('msgInput');
  const text  = input.value.trim();
  if (!text) return;

  const msgs = getMessages(currentUser.id, chatPartner.id);
  msgs.push({
    senderId : currentUser.id,
    message  : text,
    timestamp: Date.now()
  });
  saveMessages(currentUser.id, chatPartner.id, msgs);

  input.value = '';
  renderMessages();
}

// Enter key to send
function handleEnter(e) {
  if (e.key === 'Enter') sendMessage();
}

// Clear entire conversation
function clearChat() {
  if (!confirm('Clear all messages?')) return;
  saveMessages(currentUser.id, chatPartner.id, []);
  renderMessages();
}

// ── Polling (real-time simulation) ──────────────────────────
function startPolling() {
  stopPolling(); // clear any existing interval
  pollInterval = setInterval(() => {
    const msgs = getMessages(currentUser.id, chatPartner.id);
    // Only re-render if message count changed (new message arrived)
    if (msgs.length !== lastMsgCount) {
      renderMessages();
    }
  }, 1000);
}

function stopPolling() {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
}

// ── Logout ───────────────────────────────────────────────────
function handleLogout() {
  if (!confirm('Logout?')) return;
  stopPolling();
  currentUser = null;
  chatPartner = null;
  clearCurrentSession();
  document.getElementById('usernameInput').value = '';
  showScreen('loginScreen');
}

// ── Theme Toggle ─────────────────────────────────────────────
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  document.getElementById('themeToggle').textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function loadTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.body.classList.add('dark');
    document.getElementById('themeToggle').textContent = '☀️';
  }
}

// ── Utility ──────────────────────────────────────────────────
function scrollToBottom() {
  const c = document.getElementById('messagesContainer');
  c.scrollTop = c.scrollHeight;
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Init ─────────────────────────────────────────────────────
(function init() {
  loadTheme();
  // Auto-login if session exists
  const session = loadCurrentSession();
  if (session) {
    currentUser = session;
    renderHome();
  } else {
    showScreen('loginScreen');
  }
})();