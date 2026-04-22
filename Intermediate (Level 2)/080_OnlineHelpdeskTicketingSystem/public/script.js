let isAdmin = false;
let allTickets = [];

function show(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(view).classList.add('active');
  if (view === 'admin' && isAdmin) loadAdminTickets();
}

function msg(id, text, type) {
  const el = document.getElementById(id);
  el.innerHTML = `<div class="msg ${type}">${text}</div>`;
  setTimeout(() => el.innerHTML = '', 4000);
}

async function submitTicket() {
  const name = document.getElementById('sName').value.trim();
  const email = document.getElementById('sEmail').value.trim();
  const title = document.getElementById('sTitle').value.trim();
  const description = document.getElementById('sDesc').value.trim();
  const priority = document.getElementById('sPriority').value;
  if (!name || !email || !title || !description || !priority) return msg('submitMsg', 'All fields are required.', 'error');
  const res = await fetch('/api/ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, title, description, priority }) });
  const data = await res.json();
  if (!res.ok) return msg('submitMsg', data.error, 'error');
  msg('submitMsg', `Ticket created! Your ID: <strong>${data.id}</strong> — Save this to track your ticket.`, 'success');
  ['sName','sEmail','sTitle','sDesc'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('sPriority').value = '';
}

async function checkStatus() {
  const id = document.getElementById('tId').value.trim();
  const email = document.getElementById('tEmail').value.trim();
  if (!id || !email) return msg('statusMsg', 'Enter both Ticket ID and email.', 'error');
  const res = await fetch('/api/ticket/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, email }) });
  const data = await res.json();
  if (!res.ok) return msg('statusMsg', data.error, 'error');
  const badgeClass = 'badge-' + data.status.replace(' ', '');
  const replies = data.replies.length ? data.replies.map(r => `<div class="reply-item"><div>${r.text}</div><div class="time">${r.time}</div></div>`).join('') : '<div class="reply-item" style="color:var(--muted)">No replies yet.</div>';
  document.getElementById('ticketResult').innerHTML = `
    <div class="ticket-result">
      <h3>${data.title}</h3>
      <p>Status: <span><span class="badge ${badgeClass}">${data.status}</span></span></p>
      <p>Priority: <span class="priority-${data.priority}">${data.priority}</span></p>
      <p>Submitted: <span>${data.createdAt}</span></p>
      <p>Description: <span>${data.description}</span></p>
      <div style="margin-top:1rem;font-weight:600;font-size:0.85rem">Admin Replies:</div>
      ${replies}
    </div>`;
}

async function adminLogin() {
  const username = document.getElementById('aUser').value.trim();
  const password = document.getElementById('aPass').value.trim();
  if (!username || !password) return msg('loginMsg', 'Enter credentials.', 'error');
  const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
  const data = await res.json();
  if (!res.ok) return msg('loginMsg', data.error, 'error');
  isAdmin = true;
  show('admin');
}

function adminLogout() {
  isAdmin = false;
  show('submit');
}

async function loadAdminTickets() {
  const res = await fetch('/api/admin/tickets');
  allTickets = await res.json();
  renderTickets();
}

function renderTickets() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allTickets.filter(t =>
    t.id.toLowerCase().includes(q) ||
    t.email.toLowerCase().includes(q) ||
    t.status.toLowerCase().includes(q) ||
    t.title.toLowerCase().includes(q)
  );
  const el = document.getElementById('ticketsList');
  if (!filtered.length) { el.innerHTML = '<div class="empty">No tickets found.</div>'; return; }
  el.innerHTML = filtered.map(t => {
    const badgeClass = 'badge-' + t.status.replace(' ', '');
    const replies = t.replies.length ? t.replies.map(r => `<div class="admin-reply">${r.text}<div class="rtime">${r.time}</div></div>`).join('') : '';
    return `<div class="ticket-card" id="card-${t.id}">
      <div class="ticket-card-header">
        <div>
          <div class="ticket-title">${t.title}</div>
          <div class="ticket-id">${t.id}</div>
        </div>
        <div class="ticket-meta">
          <span class="badge ${badgeClass}">${t.status}</span>
          <span class="badge priority-${t.priority}" style="background:transparent;border:none">${t.priority}</span>
        </div>
      </div>
      <div class="ticket-desc">${t.description}</div>
      <div class="ticket-info">From: <span>${t.name} &lt;${t.email}&gt;</span> &nbsp;|&nbsp; Created: <span>${t.createdAt}</span></div>
      <div class="ticket-actions">
        <select id="st-${t.id}">
          ${['Open','In Progress','Resolved','Closed'].map(s => `<option${s===t.status?' selected':''}>${s}</option>`).join('')}
        </select>
        <button class="btn-update" onclick="updateStatus('${t.id}')">Update Status</button>
        <button class="btn-delete" onclick="deleteTicket('${t.id}')">Delete</button>
      </div>
      <div class="reply-section">
        <div class="replies-list">${replies}</div>
        <textarea id="rep-${t.id}" placeholder="Write a reply..."></textarea>
        <button class="btn-reply" onclick="sendReply('${t.id}')">Send Reply</button>
      </div>
    </div>`;
  }).join('');
}

async function updateStatus(id) {
  const status = document.getElementById('st-' + id).value;
  const res = await fetch('/api/admin/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
  if (res.ok) { await loadAdminTickets(); }
}

async function deleteTicket(id) {
  if (!confirm('Delete this ticket?')) return;
  const res = await fetch('/api/admin/delete/' + id, { method: 'DELETE' });
  if (res.ok) { await loadAdminTickets(); }
}

async function sendReply(id) {
  const reply = document.getElementById('rep-' + id).value.trim();
  if (!reply) return;
  const res = await fetch('/api/admin/reply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, reply }) });
  if (res.ok) { await loadAdminTickets(); }
}let isAdmin = false;
let allTickets = [];

function show(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'adminDash' && isAdmin) loadAdminTickets();
}

function badgeClass(val) {
  const map = { 'Open': 'badge-open', 'In Progress': 'badge-inprogress', 'Resolved': 'badge-resolved', 'Closed': 'badge-closed', 'Low': 'badge-low', 'Medium': 'badge-medium', 'High': 'badge-high' };
  return map[val] || 'badge-low';
}

function setMsg(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'msg ' + type;
}

document.getElementById('ticketForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const priority = document.querySelector('input[name="priority"]:checked')?.value;
  const body = { name: document.getElementById('tName').value.trim(), email: document.getElementById('tEmail').value.trim(), title: document.getElementById('tTitle').value.trim(), description: document.getElementById('tDesc').value.trim(), priority };
  try {
    const r = await fetch('/api/ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) return setMsg('submitMsg', d.error, 'err');
    setMsg('submitMsg', `Ticket created! Your ID: ${d.id}`, 'ok');
    e.target.reset();
  } catch { setMsg('submitMsg', 'Server error', 'err'); }
});

async function trackTicket() {
  const id = document.getElementById('trackId').value.trim();
  const email = document.getElementById('trackEmail').value.trim();
  if (!id || !email) return setMsg('trackMsg', 'Enter both fields', 'err');
  try {
    const r = await fetch('/api/ticket/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, email }) });
    const t = await r.json();
    if (!r.ok) return setMsg('trackMsg', t.error, 'err');
    setMsg('trackMsg', '', '');
    document.getElementById('trackResult').innerHTML = `
      <div class="track-result-card">
        <h3>${t.title}</h3>
        <div class="meta-row"><span class="meta-label">Ticket ID</span><span>${t.id}</span></div>
        <div class="meta-row"><span class="meta-label">Status</span><span class="badge ${badgeClass(t.status)}">${t.status}</span></div>
        <div class="meta-row"><span class="meta-label">Priority</span><span class="badge ${badgeClass(t.priority)}">${t.priority}</span></div>
        <div class="meta-row"><span class="meta-label">Created</span><span>${t.createdAt}</span></div>
        <div class="meta-row" style="border-bottom:none"><span class="meta-label">Description</span><span style="max-width:60%;text-align:right">${t.description}</span></div>
        ${t.replies.length ? `<div class="replies-section"><div class="meta-label" style="margin-bottom:.75rem">Admin Replies</div>${t.replies.map(r => `<div class="reply-item">${r.text}<div class="reply-time">${r.time}</div></div>`).join('')}</div>` : ''}
      </div>`;
  } catch { setMsg('trackMsg', 'Server error', 'err'); }
}

async function adminLogin() {
  const username = document.getElementById('aUser').value.trim();
  const password = document.getElementById('aPass').value;
  if (!username || !password) return setMsg('loginMsg', 'Enter credentials', 'err');
  try {
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    const d = await r.json();
    if (!r.ok) return setMsg('loginMsg', d.error, 'err');
    isAdmin = true;
    show('adminDash');
  } catch { setMsg('loginMsg', 'Server error', 'err'); }
}

function adminLogout() {
  isAdmin = false;
  show('submit');
}

async function loadAdminTickets() {
  try {
    const r = await fetch('/api/admin/tickets');
    allTickets = await r.json();
    renderTickets();
  } catch {}
}

function renderTickets() {
  const q = document.getElementById('searchBox').value.toLowerCase();
  const filtered = allTickets.filter(t => !q || t.id.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.status.toLowerCase().includes(q) || t.title.toLowerCase().includes(q));
  const el = document.getElementById('ticketList');
  if (!filtered.length) { el.innerHTML = '<div class="empty-state">No tickets found.</div>'; return; }
  el.innerHTML = filtered.map(t => `
    <div class="ticket-card" id="card-${t.id}">
      <div class="ticket-top">
        <div>
          <div class="ticket-id">${t.id}</div>
          <div class="ticket-title">${t.title}</div>
          <div class="ticket-meta">${t.name} · ${t.email} · ${t.createdAt}</div>
        </div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <span class="badge ${badgeClass(t.status)}">${t.status}</span>
          <span class="badge ${badgeClass(t.priority)}">${t.priority}</span>
        </div>
      </div>
      <div style="font-size:.85rem;color:var(--muted);margin-bottom:1rem">${t.description}</div>
      ${t.replies.length ? `<div style="margin-bottom:1rem">${t.replies.map(r => `<div class="reply-item">${r.text}<div class="reply-time">${r.time}</div></div>`).join('')}</div>` : ''}
      <div class="ticket-actions">
        <select onchange="updateStatus('${t.id}', this.value)">
          ${['Open','In Progress','Resolved','Closed'].map(s => `<option value="${s}"${t.status===s?' selected':''}>${s}</option>`).join('')}
        </select>
        <button class="btn-sm" onclick="openReplyModal('${t.id}')">Reply</button>
        <button class="btn-sm btn-danger" onclick="deleteTicket('${t.id}')">Delete</button>
      </div>
    </div>`).join('');
}

async function updateStatus(id, status) {
  await fetch('/api/admin/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
  const t = allTickets.find(t => t.id === id);
  if (t) { t.status = status; renderTickets(); }
}

async function deleteTicket(id) {
  if (!confirm('Delete this ticket?')) return;
  await fetch('/api/admin/delete/' + id, { method: 'DELETE' });
  allTickets = allTickets.filter(t => t.id !== id);
  renderTickets();
}

function openReplyModal(id) {
  const t = allTickets.find(t => t.id === id);
  const modal = document.getElementById('modal');
  document.getElementById('modalBox').innerHTML = `
    <h2>Reply to ${id}</h2>
    <div class="field"><label>Message</label><textarea id="replyText" rows="4" placeholder="Type your reply..."></textarea></div>
    <div class="modal-actions">
      <button class="btn-primary" onclick="submitReply('${id}')">Send Reply</button>
      <button class="btn-outline" onclick="closeModal()">Cancel</button>
    </div>
    <div id="replyMsg" class="msg"></div>`;
  modal.classList.add('open');
}

async function submitReply(id) {
  const reply = document.getElementById('replyText').value.trim();
  if (!reply) return setMsg('replyMsg', 'Enter a reply', 'err');
  const r = await fetch('/api/admin/reply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, reply }) });
  if (r.ok) {
    const t = allTickets.find(t => t.id === id);
    if (t) t.replies.push({ text: reply, time: new Date().toLocaleString() });
    closeModal();
    renderTickets();
  }
}

function closeModal(e) {
  if (!e || e.target === document.getElementById('modal')) {
    document.getElementById('modal').classList.remove('open');
  }
}