const API = '';
let currentUser = null;
let editingPostId = null;

function getToken() { return localStorage.getItem('token'); }
function setAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  currentUser = user;
  updateNav();
}
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentUser = null;
  updateNav();
  navigate('home');
}
function loadUser() {
  const u = localStorage.getItem('user');
  const t = localStorage.getItem('token');
  if (u && t) currentUser = JSON.parse(u);
}
function updateNav() {
  const loggedIn = !!currentUser;
  document.getElementById('nav-login').style.display = loggedIn ? 'none' : '';
  document.getElementById('nav-logout').style.display = loggedIn ? '' : 'none';
  document.getElementById('nav-write').style.display = loggedIn ? '' : 'none';
  document.getElementById('nav-myposts').style.display = loggedIn ? '' : 'none';
  document.getElementById('nav-admin').style.display = (loggedIn && currentUser.role === 'admin') ? '' : 'none';
}
function showToast(msg, err = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (err ? ' err' : '');
  setTimeout(() => t.className = 'toast', 3000);
}
async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  const token = getToken();
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error');
  return data;
}
function navigate(view, data = null) {
  ['home','write','myposts','admin','auth'].forEach(v => {
    const el = document.getElementById('nav-' + v);
    if (el) el.classList.toggle('active', v === view);
  });
  const app = document.getElementById('app');
  if (view === 'home') renderHome();
  else if (view === 'post') renderPost(data);
  else if (view === 'write') renderWrite(data);
  else if (view === 'myposts') renderMyPosts();
  else if (view === 'auth') renderAuth();
  else if (view === 'admin') renderAdmin();
}
function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
async function renderHome() {
  const app = document.getElementById('app');
  app.innerHTML = '<h1 class="page-title">Latest Posts</h1><div class="post-grid" id="posts-list"><div class="empty">Loading...</div></div>';
  try {
    const posts = await api('/api/posts');
    const list = document.getElementById('posts-list');
    if (!posts.length) { list.innerHTML = '<div class="empty">No posts yet. Be the first to write.</div>'; return; }
    list.innerHTML = posts.map(p => `
      <div class="post-card" onclick="navigate('post','${p._id}')">
        <div>
          <div class="post-card-title">${esc(p.title)}</div>
          <div class="post-card-meta">by ${esc(p.authorName)}</div>
          <div class="post-card-preview">${esc(p.content)}</div>
        </div>
        <div class="post-card-date">${fmt(p.createdAt)}</div>
      </div>`).join('');
  } catch { document.getElementById('posts-list').innerHTML = '<div class="empty">Failed to load posts.</div>'; }
}
async function renderPost(id) {
  const app = document.getElementById('app');
  app.innerHTML = '<button class="back-btn" onclick="navigate(\'home\')">← Back</button><div class="empty">Loading...</div>';
  try {
    const p = await api('/api/posts/' + id);
    const isOwn = currentUser && currentUser.id === p.authorId;
    app.innerHTML = `
      <button class="back-btn" onclick="navigate('home')">← Back to posts</button>
      <h1 class="post-detail-title">${esc(p.title)}</h1>
      <div class="post-detail-meta">By ${esc(p.authorName)} &nbsp;·&nbsp; ${fmt(p.createdAt)}</div>
      <div class="post-detail-content">${esc(p.content)}</div>
      ${isOwn ? `<div class="post-actions">
        <button class="btn btn-ghost" onclick="navigate('write','${p._id}')">Edit Post</button>
        <button class="btn btn-danger" onclick="deletePost('${p._id}')">Delete Post</button>
      </div>` : ''}`;
  } catch (e) { app.innerHTML = '<div class="empty">Post not found.</div>'; }
}
async function renderWrite(id = null) {
  if (!currentUser) { navigate('auth'); return; }
  editingPostId = id;
  const app = document.getElementById('app');
  let title = '', content = '';
  if (id) {
    try {
      const p = await api('/api/posts/' + id);
      if (currentUser.id !== p.authorId) { showToast('Not your post', true); navigate('home'); return; }
      title = p.title; content = p.content;
    } catch { showToast('Post not found', true); navigate('home'); return; }
  }
  app.innerHTML = `
    <h1 class="page-title">${id ? 'Edit Post' : 'Write a Post'}</h1>
    <form onsubmit="submitPost(event)">
      <div class="form-group">
        <label>Title</label>
        <input type="text" id="post-title" value="${esc(title)}" placeholder="Your post title..." required>
      </div>
      <div class="form-group">
        <label>Content</label>
        <textarea id="post-content" placeholder="Write your post here..." required>${esc(content)}</textarea>
      </div>
      <div style="display:flex;gap:.75rem">
        <button type="submit" class="btn btn-primary">${id ? 'Update Post' : 'Publish Post'}</button>
        <button type="button" class="btn btn-ghost" onclick="navigate('home')">Cancel</button>
      </div>
    </form>`;
}
async function submitPost(e) {
  e.preventDefault();
  const title = document.getElementById('post-title').value.trim();
  const content = document.getElementById('post-content').value.trim();
  try {
    if (editingPostId) {
      await api('/api/posts/' + editingPostId, 'PUT', { title, content });
      showToast('Post updated');
    } else {
      await api('/api/posts', 'POST', { title, content });
      showToast('Post published');
    }
    editingPostId = null;
    navigate('home');
  } catch (e) { showToast(e.message, true); }
}
async function deletePost(id) {
  if (!confirm('Delete this post?')) return;
  try {
    await api('/api/posts/' + id, 'DELETE');
    showToast('Post deleted');
    navigate('home');
  } catch (e) { showToast(e.message, true); }
}
async function renderMyPosts() {
  if (!currentUser) { navigate('auth'); return; }
  const app = document.getElementById('app');
  app.innerHTML = '<h1 class="page-title">My Posts</h1><div id="my-list"><div class="empty">Loading...</div></div>';
  try {
    const all = await api('/api/posts');
    const mine = all.filter(p => p.authorId === currentUser.id);
    const list = document.getElementById('my-list');
    if (!mine.length) { list.innerHTML = '<div class="empty">You haven\'t written anything yet.</div>'; return; }
    list.innerHTML = mine.map(p => `
      <div class="my-post-card">
        <div class="my-post-card-title" onclick="navigate('post','${p._id}')">${esc(p.title)}</div>
        <div class="my-post-card-meta">${fmt(p.createdAt)}</div>
        <div class="my-post-card-actions">
          <button class="btn btn-ghost" onclick="navigate('write','${p._id}')">Edit</button>
          <button class="btn btn-danger" onclick="deletePost('${p._id}')">Delete</button>
        </div>
      </div>`).join('');
  } catch { document.getElementById('my-list').innerHTML = '<div class="empty">Failed to load posts.</div>'; }
}
function renderAuth() {
  if (currentUser) { navigate('home'); return; }
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-tabs tab-group">
      <button class="tab active" id="tab-login" onclick="switchTab('login')">Login</button>
      <button class="tab" id="tab-register" onclick="switchTab('register')">Register</button>
    </div>
    <div id="auth-form"></div>`;
  switchTab('login');
}
function switchTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  const f = document.getElementById('auth-form');
  if (tab === 'login') {
    f.innerHTML = `<form onsubmit="doLogin(event)">
      <div class="form-group"><label>Email</label><input type="email" id="login-email" required placeholder="you@example.com"></div>
      <div class="form-group"><label>Password</label><input type="password" id="login-pass" required placeholder="Your password"></div>
      <button type="submit" class="btn btn-primary">Login</button>
    </form>`;
  } else {
    f.innerHTML = `<form onsubmit="doRegister(event)">
      <div class="form-group"><label>Name</label><input type="text" id="reg-name" required placeholder="Your name"></div>
      <div class="form-group"><label>Email</label><input type="email" id="reg-email" required placeholder="you@example.com"></div>
      <div class="form-group"><label>Password</label><input type="password" id="reg-pass" required placeholder="Create a password"></div>
      <button type="submit" class="btn btn-primary">Create Account</button>
    </form>`;
  }
}
async function doLogin(e) {
  e.preventDefault();
  try {
    const data = await api('/api/login', 'POST', {
      email: document.getElementById('login-email').value,
      password: document.getElementById('login-pass').value
    });
    setAuth(data.token, data.user);
    showToast('Welcome back, ' + data.user.name);
    navigate('home');
  } catch (e) { showToast(e.message, true); }
}
async function doRegister(e) {
  e.preventDefault();
  try {
    await api('/api/register', 'POST', {
      name: document.getElementById('reg-name').value,
      email: document.getElementById('reg-email').value,
      password: document.getElementById('reg-pass').value
    });
    showToast('Account created! Please login.');
    switchTab('login');
  } catch (e) { showToast(e.message, true); }
}
async function renderAdmin() {
  if (!currentUser || currentUser.role !== 'admin') { navigate('home'); return; }
  const app = document.getElementById('app');
  app.innerHTML = `<h1 class="page-title">Admin Panel</h1>
    <div class="stat-grid" id="stats"><div class="empty">Loading stats...</div></div>
    <div class="tab-group">
      <button class="tab active" id="atab-users" onclick="adminTab('users')">Users</button>
      <button class="tab" id="atab-posts" onclick="adminTab('posts')">Posts</button>
    </div>
    <div id="admin-content"></div>`;
  try {
    const stats = await api('/api/admin/stats');
    document.getElementById('stats').innerHTML = `
      <div class="stat-card"><div class="stat-num">${stats.totalUsers}</div><div class="stat-label">Users</div></div>
      <div class="stat-card"><div class="stat-num">${stats.totalPosts}</div><div class="stat-label">Posts</div></div>
      <div class="stat-card"><div class="stat-num">${stats.blockedUsers}</div><div class="stat-label">Blocked</div></div>`;
  } catch {}
  adminTab('users');
}
async function adminTab(tab) {
  document.getElementById('atab-users').classList.toggle('active', tab === 'users');
  document.getElementById('atab-posts').classList.toggle('active', tab === 'posts');
  const c = document.getElementById('admin-content');
  if (tab === 'users') {
    c.innerHTML = '<div class="empty">Loading...</div>';
    try {
      const users = await api('/api/admin/users');
      c.innerHTML = `<table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>${users.map(u => `<tr>
          <td>${esc(u.name)}</td>
          <td>${esc(u.email)}</td>
          <td><span class="badge badge-${u.role}">${u.role}</span></td>
          <td>${u.isBlocked ? '<span class="badge badge-blocked">Blocked</span>' : '<span style="color:#6fcf6f;font-family:var(--font-mono);font-size:.65rem">Active</span>'}</td>
          <td>${u.role !== 'admin' ? `<button class="btn ${u.isBlocked ? 'btn-ghost' : 'btn-danger'}" style="padding:.35rem .75rem;font-size:.65rem" onclick="toggleBlock('${u._id}',this)">${u.isBlocked ? 'Unblock' : 'Block'}</button>` : '—'}</td>
        </tr>`).join('')}</tbody>
      </table>`;
    } catch { c.innerHTML = '<div class="empty">Failed to load users.</div>'; }
  } else {
    c.innerHTML = '<div class="empty">Loading...</div>';
    try {
      const posts = await api('/api/posts');
      if (!posts.length) { c.innerHTML = '<div class="empty">No posts.</div>'; return; }
      c.innerHTML = `<table>
        <thead><tr><th>Title</th><th>Author</th><th>Date</th><th>Action</th></tr></thead>
        <tbody>${posts.map(p => `<tr>
          <td style="cursor:pointer;color:var(--text)" onclick="navigate('post','${p._id}')">${esc(p.title)}</td>
          <td>${esc(p.authorName)}</td>
          <td style="font-family:var(--font-mono);font-size:.7rem;color:var(--muted)">${fmt(p.createdAt)}</td>
          <td><button class="btn btn-danger" style="padding:.35rem .75rem;font-size:.65rem" onclick="adminDeletePost('${p._id}',this)">Delete</button></td>
        </tr>`).join('')}</tbody>
      </table>`;
    } catch { c.innerHTML = '<div class="empty">Failed to load posts.</div>'; }
  }
}
async function toggleBlock(id, btn) {
  try {
    const data = await api('/api/admin/block/' + id, 'PUT');
    showToast(data.message);
    const row = btn.closest('tr');
    const statusCell = row.cells[3];
    if (data.isBlocked) {
      statusCell.innerHTML = '<span class="badge badge-blocked">Blocked</span>';
      btn.textContent = 'Unblock'; btn.className = 'btn btn-ghost'; btn.style.cssText = 'padding:.35rem .75rem;font-size:.65rem';
    } else {
      statusCell.innerHTML = '<span style="color:#6fcf6f;font-family:var(--font-mono);font-size:.65rem">Active</span>';
      btn.textContent = 'Block'; btn.className = 'btn btn-danger'; btn.style.cssText = 'padding:.35rem .75rem;font-size:.65rem';
    }
  } catch (e) { showToast(e.message, true); }
}
async function adminDeletePost(id, btn) {
  if (!confirm('Delete this post?')) return;
  try {
    await api('/api/admin/post/' + id, 'DELETE');
    showToast('Post deleted');
    btn.closest('tr').remove();
  } catch (e) { showToast(e.message, true); }
}
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
loadUser();
updateNav();
navigate('home');