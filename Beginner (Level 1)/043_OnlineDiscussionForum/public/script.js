let currentUser = null;
let currentPostId = null;

// ── TOAST ──────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── TIME FORMATTER ─────────────────────────────────────────────────────────
function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return diff + 's ago';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

// ── INIT ───────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  if (location.pathname === '/admin') {
    document.getElementById('join-screen').style.display = 'none';
    document.getElementById('admin-screen').style.display = 'block';
    loadAdmin();
  }
});

// ── JOIN ───────────────────────────────────────────────────────────────────
async function joinForum() {
  const name = document.getElementById('join-name').value.trim();
  if (!name) { showToast('Please enter your name'); return; }

  const res = await fetch('/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) { showToast('Error joining'); return; }

  currentUser = name;
  document.getElementById('join-screen').style.display = 'none';
  document.getElementById('forum-screen').style.display = 'block';
  document.getElementById('welcome-msg').textContent = 'Hi, ' + name;
  loadPosts();
}

// Allow Enter key on join input
document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('join-name');
  if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') joinForum(); });
});

// ── POSTS ──────────────────────────────────────────────────────────────────
async function loadPosts() {
  const res = await fetch('/posts');
  const posts = await res.json();
  const container = document.getElementById('posts-container');
  if (!posts.length) {
    container.innerHTML = '<p style="text-align:center;color:#888;margin-top:40px">No posts yet. Be the first!</p>';
    return;
  }
  container.innerHTML = posts.map(p => `
    <div class="post-card" onclick="openPost(${p.id})">
      <h2>${escHtml(p.title)}</h2>
      <div class="meta">by <strong>${escHtml(p.author)}</strong> · ${timeAgo(p.time)}</div>
      <div class="excerpt">${escHtml(p.content.substring(0, 150))}${p.content.length > 150 ? '...' : ''}</div>
      <div class="actions">
        <span onclick="likePost(event,${p.id},this)">❤️ ${p.likes}</span>
        <span>💬 ${p.comments.length}</span>
      </div>
    </div>
  `).join('');
}

async function likePost(e, id, el) {
  e.stopPropagation();
  if (!currentUser) return;
  const res = await fetch(`/posts/${id}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: currentUser })
  });
  const data = await res.json();
  el.textContent = `❤️ ${data.likes}`;
  showToast(data.liked ? 'Liked!' : 'Unliked');
}

// ── CREATE POST MODAL ──────────────────────────────────────────────────────
function openCreateModal() {
  document.getElementById('create-modal').style.display = 'flex';
  document.getElementById('post-title').focus();
}
function closeCreateModal() {
  document.getElementById('create-modal').style.display = 'none';
  document.getElementById('post-title').value = '';
  document.getElementById('post-content').value = '';
}

async function submitPost() {
  const title = document.getElementById('post-title').value.trim();
  const content = document.getElementById('post-content').value.trim();
  if (!title || !content) { showToast('Please fill both fields'); return; }

  const res = await fetch('/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, author: currentUser })
  });
  if (!res.ok) { showToast('Error creating post'); return; }
  closeCreateModal();
  showToast('Post created!');
  loadPosts();
}

// ── POST DETAIL MODAL ──────────────────────────────────────────────────────
async function openPost(id) {
  currentPostId = id;
  const res = await fetch(`/posts/${id}`);
  const post = await res.json();

  document.getElementById('detail-content').innerHTML = `
    <h2>${escHtml(post.title)}</h2>
    <div class="meta">by <strong>${escHtml(post.author)}</strong> · ${timeAgo(post.time)} · ❤️ ${post.likes}</div>
    <div class="content">${escHtml(post.content)}</div>
  `;

  renderComments(post.comments);
  document.getElementById('detail-modal').style.display = 'flex';
}

function renderComments(comments) {
  const list = document.getElementById('comments-list');
  if (!comments.length) {
    list.innerHTML = '<p style="color:#aaa;font-size:.85rem">No comments yet.</p>';
    return;
  }
  list.innerHTML = comments.map(c => `
    <div class="comment">
      <div class="cmeta"><strong>${escHtml(c.author)}</strong> · ${timeAgo(c.time)}</div>
      <div>${escHtml(c.text)}</div>
    </div>
  `).join('');
}

function closeDetailModal() {
  document.getElementById('detail-modal').style.display = 'none';
  currentPostId = null;
  loadPosts();
}

async function submitComment() {
  const text = document.getElementById('comment-text').value.trim();
  if (!text) { showToast('Comment cannot be empty'); return; }
  if (!currentPostId) return;

  const res = await fetch(`/posts/${currentPostId}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, author: currentUser })
  });
  if (!res.ok) { showToast('Error posting comment'); return; }
  document.getElementById('comment-text').value = '';
  showToast('Comment added!');

  const post = await (await fetch(`/posts/${currentPostId}`)).json();
  renderComments(post.comments);
}

// Close modal on backdrop click
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('create-modal').addEventListener('click', function(e) {
    if (e.target === this) closeCreateModal();
  });
  document.getElementById('detail-modal').addEventListener('click', function(e) {
    if (e.target === this) closeDetailModal();
  });
});

// ── ADMIN ──────────────────────────────────────────────────────────────────
async function loadAdmin() {
  // Stats
  const statsRes = await fetch('/admin/stats');
  const stats = await statsRes.json();
  document.getElementById('admin-stats').innerHTML = `
    <div class="stat-box"><div class="num">${stats.totalUsers}</div><div class="lbl">Users</div></div>
    <div class="stat-box"><div class="num">${stats.totalPosts}</div><div class="lbl">Posts</div></div>
    <div class="stat-box"><div class="num">${stats.totalComments}</div><div class="lbl">Comments</div></div>
  `;

  // Posts
  const postsRes = await fetch('/posts');
  const posts = await postsRes.json();
  const container = document.getElementById('admin-posts');
  if (!posts.length) { container.innerHTML = '<p>No posts yet.</p>'; return; }

  container.innerHTML = posts.map(p => `
    <div class="admin-post" id="admin-post-${p.id}">
      <h3>${escHtml(p.title)}</h3>
      <div class="meta">by ${escHtml(p.author)} · ${timeAgo(p.time)} · ❤️ ${p.likes}</div>
      <button class="del-btn" onclick="adminDeletePost(${p.id})">Delete Post</button>
      <div style="margin-top:10px">
        ${p.comments.length ? p.comments.map(c => `
          <div class="admin-comment" id="admin-comment-${c.id}">
            <span><strong>${escHtml(c.author)}:</strong> ${escHtml(c.text.substring(0, 80))}</span>
            <button class="del-btn" onclick="adminDeleteComment(${p.id},${c.id})">Del</button>
          </div>
        `).join('') : '<p style="font-size:.82rem;color:#aaa">No comments</p>'}
      </div>
    </div>
  `).join('');
}

async function adminDeletePost(id) {
  if (!confirm('Delete this post?')) return;
  const res = await fetch(`/admin/post/${id}`, { method: 'DELETE' });
  if (res.ok) { document.getElementById('admin-post-' + id)?.remove(); showToast('Post deleted'); loadAdmin(); }
  else showToast('Error');
}

async function adminDeleteComment(postId, commentId) {
  if (!confirm('Delete this comment?')) return;
  const res = await fetch(`/admin/comment/${postId}/${commentId}`, { method: 'DELETE' });
  if (res.ok) { document.getElementById('admin-comment-' + commentId)?.remove(); showToast('Comment deleted'); loadAdmin(); }
  else showToast('Error');
}

// ── UTIL ───────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}