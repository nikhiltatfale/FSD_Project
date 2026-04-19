const isAdmin = window.location.pathname === '/admin';
if (isAdmin) document.getElementById('adminPanel').style.display = 'block';

async function fetchPosts() {
  const res = await fetch('/posts');
  const posts = await res.json();
  renderPosts(posts);
  if (isAdmin) renderAdminPosts(posts);
}

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
}

function renderPosts(posts) {
  const el = document.getElementById('posts');
  if (!posts.length) { el.innerHTML = '<p style="color:#888">No posts yet.</p>'; return; }
  el.innerHTML = posts.map(p => `
    <div class="post" id="post-${p.id}">
      <div class="post-meta"><b>${p.username}</b> · ${timeAgo(p.time)}</div>
      <div class="post-content">${p.content}</div>
      <div class="post-actions">
        <button class="btn-like" onclick="likePost(${p.id})">👍 <span id="likes-${p.id}">${p.likes}</span></button>
        <button class="btn-delete" onclick="deletePost(${p.id}, '${p.username}')">Delete</button>
      </div>
    </div>`).join('');
}

function renderAdminPosts(posts) {
  const el = document.getElementById('adminPosts');
  el.innerHTML = '<h3 style="margin:10px 0 8px">All Posts</h3>' + (posts.length ? posts.map(p => `
    <div class="post">
      <div class="post-meta"><b>${p.username}</b> · ${timeAgo(p.time)} · 👍 ${p.likes}</div>
      <div class="post-content">${p.content}</div>
      <button class="btn-delete" onclick="adminDelete(${p.id})">Admin Delete</button>
    </div>`).join('') : '<p style="color:#888">No posts.</p>');
}

async function likePost(id) {
  const res = await fetch(`/like/${id}`, { method: 'POST' });
  const post = await res.json();
  document.getElementById(`likes-${id}`).textContent = post.likes;
}

async function deletePost(id, username) {
  const entered = prompt('Enter your username to confirm delete:');
  if (!entered) return;
  const res = await fetch(`/delete/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: entered }) });
  const data = await res.json();
  if (data.error) return alert(data.error);
  document.getElementById(`post-${id}`)?.remove();
}

async function adminDelete(id) {
  if (!confirm('Delete this post as admin?')) return;
  const res = await fetch(`/admin/delete/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (data.success) fetchPosts();
}

async function fetchStats() {
  const res = await fetch('/admin/stats');
  const s = await res.json();
  document.getElementById('stats').textContent = `Total Posts: ${s.total} | Total Likes: ${s.totalLikes}`;
}

document.getElementById('submitPost').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const content = document.getElementById('content').value.trim();
  const err = document.getElementById('formError');
  if (!username || !content) { err.textContent = 'Name and content are required.'; return; }
  err.textContent = '';
  const res = await fetch('/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, content }) });
  if (res.ok) { document.getElementById('content').value = ''; fetchPosts(); }
});

document.getElementById('toggleAdmin').addEventListener('click', () => {
  const panel = document.getElementById('adminPanel');
  const visible = panel.style.display !== 'none';
  panel.style.display = visible ? 'none' : 'block';
  if (!visible) { fetchStats(); fetchPosts(); }
});

document.getElementById('refreshStats').addEventListener('click', fetchStats);

fetchPosts();
if (isAdmin) fetchStats();