let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');
let pendingAction = null;
let selectedFile = null;

function api(method, url, body, isForm) {
  const opts = { method, headers: { 'x-token': token || '' } };
  if (isForm) opts.body = body;
  else if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  return fetch(url, opts).then(r => r.json());
}

function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }
function alert$(id, msg, type) {
  const el = document.getElementById(id);
  if (!msg) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}

function init() {
  if (token && currentUser) {
    hide('loginSection');
    show('navbar');
    document.getElementById('navUser').textContent = currentUser.name;
    if (currentUser.isAdmin) { show('adminSection'); loadAdminDocs(); }
    else { show('userSection'); loadUserDocs(); }
  }
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  if (tab === 'login') { show('loginForm'); hide('registerForm'); }
  else { hide('loginForm'); show('registerForm'); }
}

function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  if (!email) return alert$('loginAlert', 'Email required', 'error');
  api('POST', '/login', { email }).then(r => {
    if (r.error) return alert$('loginAlert', r.error, 'error');
    saveSession(r);
  });
}

function doRegister() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  if (!name || !email) return alert$('regAlert', 'Name and email required', 'error');
  api('POST', '/login', { name, email }).then(r => {
    if (r.error) return alert$('regAlert', r.error, 'error');
    saveSession(r);
  });
}

function doAdminLogin() {
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value.trim();
  if (!email || !password) return alert$('adminAlert', 'All fields required', 'error');
  api('POST', '/login', { email, password, isAdmin: true }).then(r => {
    if (r.error) return alert$('adminAlert', r.error, 'error');
    closeAdminModal();
    saveSession(r);
  });
}

function saveSession(r) {
  token = r.token;
  currentUser = { name: r.name, isAdmin: r.isAdmin };
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(currentUser));
  hide('loginSection');
  show('navbar');
  document.getElementById('navUser').textContent = r.name;
  if (r.isAdmin) { show('adminSection'); loadAdminDocs(); }
  else { show('userSection'); loadUserDocs(); }
}

function logout() {
  api('POST', '/logout').then(() => {
    token = null; currentUser = null;
    localStorage.clear();
    hide('navbar'); hide('userSection'); hide('adminSection');
    show('loginSection');
  });
}

function toggleUpload() {
  const c = document.getElementById('uploadCard');
  c.classList.toggle('hidden');
  if (!c.classList.contains('hidden')) { alert$('uploadAlert', '', ''); selectedFile = null; document.getElementById('fileName').textContent = ''; document.getElementById('docTitle').value = ''; document.getElementById('docDesc').value = ''; }
}

function fileSelected(input) { selectedFile = input.files[0]; document.getElementById('fileName').textContent = selectedFile ? selectedFile.name : ''; }

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('fileDrop').classList.remove('drag');
  const f = e.dataTransfer.files[0];
  if (f) { selectedFile = f; document.getElementById('fileName').textContent = f.name; }
}

function doUpload() {
  const title = document.getElementById('docTitle').value.trim();
  const description = document.getElementById('docDesc').value.trim();
  if (!title) return alert$('uploadAlert', 'Title required', 'error');
  if (!selectedFile) return alert$('uploadAlert', 'Please select a file', 'error');
  const fd = new FormData();
  fd.append('title', title);
  fd.append('description', description);
  fd.append('file', selectedFile);
  api('POST', '/upload', fd, true).then(r => {
    if (r.error) return alert$('uploadAlert', r.error, 'error');
    toggleUpload();
    loadUserDocs();
  });
}

function loadUserDocs() {
  api('GET', '/documents').then(docs => {
    const el = document.getElementById('userDocsBody');
    if (!docs.length) { el.innerHTML = '<div class="empty">No documents yet. Upload your first document.</div>'; return; }
    el.innerHTML = `<table><thead><tr><th>Title</th><th>Description</th><th>File</th><th>Status</th><th>Remark</th><th>Date</th></tr></thead><tbody>${docs.map(d => `<tr><td><strong>${esc(d.title)}</strong></td><td style="color:var(--muted)">${esc(d.description)}</td><td style="font-family:'DM Mono',monospace;font-size:11px">${esc(d.fileName)}</td><td>${badge(d.status)}</td><td class="remark">${esc(d.adminRemark) || '—'}</td><td style="font-family:'DM Mono',monospace;font-size:11px;color:var(--muted)">${fmtDate(d.date)}</td></tr>`).join('')}</tbody></table>`;
  });
}

function loadAdminDocs() {
  const q = document.getElementById('searchInput') ? document.getElementById('searchInput').value : '';
  api('GET', `/admin/documents${q ? '?q=' + encodeURIComponent(q) : ''}`).then(docs => {
    const el = document.getElementById('adminDocsBody');
    if (!docs.length) { el.innerHTML = '<div class="empty">No documents found.</div>'; return; }
    el.innerHTML = `<table><thead><tr><th>User</th><th>Title</th><th>File</th><th>Status</th><th>Remark</th><th>Date</th><th>Actions</th></tr></thead><tbody>${docs.map(d => `<tr><td><div>${esc(d.userName)}</div><div style="font-size:11px;color:var(--muted);font-family:'DM Mono',monospace">${esc(d.userEmail)}</div></td><td><strong>${esc(d.title)}</strong><div style="font-size:11px;color:var(--muted)">${esc(d.description)}</div></td><td><a href="/admin/file/${d.id}" style="color:var(--accent);font-family:'DM Mono',monospace;font-size:11px" onclick="dlFile(event,${d.id})">${esc(d.fileName)}</a></td><td>${badge(d.status)}</td><td class="remark">${esc(d.adminRemark) || '—'}</td><td style="font-family:'DM Mono',monospace;font-size:11px;color:var(--muted)">${fmtDate(d.date)}</td><td><div class="actions"><button class="btn btn-sm btn-approve" onclick="openRemark(${d.id},'approve')">Approve</button><button class="btn btn-sm btn-reject" onclick="openRemark(${d.id},'reject')">Reject</button><button class="btn btn-sm btn-danger" onclick="delDoc(${d.id})">Delete</button></div></td></tr>`).join('')}</tbody></table>`;
  });
}

function dlFile(e, id) { e.preventDefault(); window.open(`/admin/file/${id}?t=${token}`, '_blank'); }

function openRemark(id, action) {
  pendingAction = { id, action };
  document.getElementById('remarkTitle').textContent = action === 'approve' ? 'Approve Document' : 'Reject Document';
  document.getElementById('remarkInput').value = '';
  show('remarkModal');
}

function closeRemarkModal() { hide('remarkModal'); pendingAction = null; }

function submitAction() {
  if (!pendingAction) return;
  const remark = document.getElementById('remarkInput').value.trim();
  api('POST', '/admin/action', { id: pendingAction.id, action: pendingAction.action, remark }).then(() => {
    closeRemarkModal();
    loadAdminDocs();
  });
}

function delDoc(id) {
  if (!confirm('Delete this document?')) return;
  api('DELETE', `/admin/delete/${id}`).then(() => loadAdminDocs());
}

function showAdminModal() { show('adminModal'); alert$('adminAlert', '', ''); }
function closeAdminModal() { hide('adminModal'); }

function badge(s) { return `<span class="badge badge-${s.toLowerCase()}">${s}</span>`; }
function esc(s) { return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function fmtDate(d) { const dt = new Date(d); return dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); }

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAdminModal(); closeRemarkModal(); } });

init();