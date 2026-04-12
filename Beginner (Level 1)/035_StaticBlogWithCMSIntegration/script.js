/**
 * BlogCMS - script.js
 * Full blog + CMS logic using LocalStorage
 * Secret admin key: Ctrl + Shift + A
 * Default admin: username = "admin", password = "admin123"
 */

// ===================================================
// CONSTANTS & STATE
// ===================================================

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';
const STORAGE_KEY = 'blogcms_posts';

let isAdminLoggedIn = false;
let currentImageBase64 = ''; // holds uploaded image as base64
let toastTimer = null;

// ===================================================
// LOCALSTORAGE HELPERS
// ===================================================

/** Get all posts from LocalStorage */
function getPosts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

/** Save all posts to LocalStorage */
function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

/** Generate a simple unique ID */
function genId() {
  return '_' + Math.random().toString(36).substr(2, 9) + Date.now();
}

// ===================================================
// SEED DEFAULT POSTS (first-time load)
// ===================================================
/* ================================
   BlogCMS — LocalStorage Helpers
================================ */

// Generate unique ID for posts
function genId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// Get posts from LocalStorage
function getPosts() {
  return JSON.parse(localStorage.getItem('blogPosts')) || [];
}

// Save posts to LocalStorage
function savePosts(posts) {
  localStorage.setItem('blogPosts', JSON.stringify(posts));
}

/* ================================
   Seed Default Posts (First Load)
================================ */

function seedDefaultPosts() {
  if (getPosts().length > 0) return;

  const defaults = [
    {
      id: genId(),
      title: 'Welcome to BlogCMS!',
      author: 'Admin',
      category: 'General',
      tags: ['welcome', 'intro'],
      image: '',
      description: 'This is your first blog post. Use Ctrl+Shift+A to open the hidden CMS and start writing!',
      content: '<h2>Hello, World! 👋</h2><p>Welcome to <strong>BlogCMS</strong> — a fully client-side blog powered by LocalStorage.</p><p>To manage your blog:</p><ul><li>Press <strong>Ctrl+Shift+A</strong></li><li>Login with: <code>admin / admin123</code></li><li>Add, edit, and delete posts</li></ul><p>Happy blogging! ✍️</p>',
      dateCreated: new Date().toISOString()
    },
    {
      id: genId(),
      title: 'How to Use the CMS Dashboard',
      author: 'Admin',
      category: 'Tutorial',
      tags: ['cms', 'guide', 'howto'],
      image: '',
      description: 'Learn how to manage your blog content using the hidden admin CMS panel.',
      content: '<h2>CMS Guide</h2><p>The CMS lets you manage your blog without touching any code.</p><h3>Features:</h3><ul><li>➕ Add new posts with rich text</li><li>✏️ Edit any existing post</li><li>❌ Delete posts (with confirmation)</li><li>🖼️ Upload featured images (stored as Base64)</li><li>🔍 Search & filter on the public side</li></ul><p>All data is stored in your browser LocalStorage.</p>',
      dateCreated: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: genId(),
      title: 'Dark Mode & Search Tips',
      author: 'Admin',
      category: 'Tips',
      tags: ['darkmode', 'search', 'ux'],
      image: '',
      description: 'Discover the dark mode toggle and powerful search & filter features built into this blog.',
      content: '<h2>Productivity Tips</h2><p>Here are some features you might have missed:</p><ul><li>🌙 <strong>Dark Mode</strong> — click the moon icon in the navbar</li><li>🔍 <strong>Search</strong> — type in the search bar to filter by title in real-time</li><li>📂 <strong>Category Filter</strong> — select a category to narrow posts</li><li>📅 <strong>Sort</strong> — sort by newest or oldest</li></ul>',
      dateCreated: new Date(Date.now() - 172800000).toISOString()
    }
  ];

  savePosts(defaults);
}

/* ================================
   Initialize on First Load
================================ */

seedDefaultPosts();

// ===================================================
// RENDER POSTS (Public Side)
// ===================================================

/** Render post cards filtered by search, category, and sort */
function applyFilters() {
  const search = document.getElementById('searchInput').value.toLowerCase().trim();
  const cat = document.getElementById('categoryFilter').value;
  const sort = document.getElementById('sortOrder').value;

  let posts = getPosts();

  // Filter by search
  if (search) {
    posts = posts.filter(p =>
      p.title.toLowerCase().includes(search) ||
      (p.description || '').toLowerCase().includes(search)
    );
  }

  // Filter by category
  if (cat) {
    posts = posts.filter(p => p.category === cat);
  }

  // Sort
  posts.sort((a, b) => {
    const da = new Date(a.dateCreated), db = new Date(b.dateCreated);
    return sort === 'newest' ? db - da : da - db;
  });

  renderPostGrid(posts);
}

/** Render posts into the grid */
function renderPostGrid(posts) {
  const grid = document.getElementById('postGrid');
  const empty = document.getElementById('emptyState');

  if (!posts || posts.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = posts.map((post, i) => `
    <div class="post-card" style="animation-delay:${i * 0.06}s">
      ${post.image
        ? `<img class="card-img" src="${post.image}" alt="${escapeHtml(post.title)}" loading="lazy"/>`
        : `<div class="card-img-placeholder">📝</div>`
      }
      <div class="card-body">
        <span class="card-category">${escapeHtml(post.category || 'General')}</span>
        <div class="card-title">${escapeHtml(post.title)}</div>
        <div class="card-desc">${escapeHtml((post.description || '').substring(0, 120))}${(post.description||'').length > 120 ? '…' : ''}</div>
        <div class="card-meta">✍️ ${escapeHtml(post.author || 'Anonymous')} · 📅 ${formatDate(post.dateCreated)}</div>
        <button onclick="showPost('${post.id}')">Read More →</button>
      </div>
    </div>
  `).join('');
}

/** Populate the category dropdown from existing posts */
function populateCategoryFilter() {
  const posts = getPosts();
  const cats = [...new Set(posts.map(p => p.category).filter(Boolean))];
  const sel = document.getElementById('categoryFilter');
  const current = sel.value;
  sel.innerHTML = '<option value="">All Categories</option>' +
    cats.map(c => `<option value="${escapeHtml(c)}" ${c === current ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
}

// ===================================================
// SINGLE POST VIEW
// ===================================================

/** Show a single post by ID */
function showPost(id) {
  const posts = getPosts();
  const post = posts.find(p => p.id === id);
  if (!post) { showToast('Post not found!'); return; }

  document.getElementById('homeView').style.display = 'none';
  document.getElementById('postView').style.display = 'block';

  const tagsHtml = (post.tags || []).map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join('');

  document.getElementById('postContent').innerHTML = `
    <button class="back-btn" onclick="showHome()">← Back to Posts</button>
    ${post.image ? `<img class="post-full-img" src="${post.image}" alt="${escapeHtml(post.title)}"/>` : ''}
    <div class="card-category">${escapeHtml(post.category || 'General')}</div>
    <h1 class="post-full-title">${escapeHtml(post.title)}</h1>
    <div class="post-full-meta">
      <span>✍️ ${escapeHtml(post.author || 'Anonymous')}</span>
      <span>📅 ${formatDate(post.dateCreated)}</span>
    </div>
    <div class="post-full-body">${post.content || ''}</div>
    ${tagsHtml ? `<div class="tags">${tagsHtml}</div>` : ''}
    <br/><button class="back-btn" onclick="showHome()">← Back to Posts</button>
  `;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** Return to home/list view */
function showHome() {
  document.getElementById('homeView').style.display = 'block';
  document.getElementById('postView').style.display = 'none';
  populateCategoryFilter();
  applyFilters();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===================================================
// ADMIN AUTHENTICATION
// ===================================================

/** Open admin overlay (shows login or dashboard) */
function openAdminOverlay() {
  document.getElementById('adminOverlay').style.display = 'block';
  if (isAdminLoggedIn) {
    showAdminDash();
  } else {
    document.getElementById('adminLogin').style.display = 'block';
    document.getElementById('adminDash').style.display = 'none';
    document.getElementById('loginError').textContent = '';
    document.getElementById('adminUser').value = '';
    document.getElementById('adminPass').value = '';
    setTimeout(() => document.getElementById('adminUser').focus(), 100);
  }
}

/** Handle admin login */
function adminLogin() {
  const u = document.getElementById('adminUser').value.trim();
  const p = document.getElementById('adminPass').value;
  if (u === ADMIN_USER && p === ADMIN_PASS) {
    isAdminLoggedIn = true;
    document.getElementById('loginError').textContent = '';
    showAdminDash();
    showToast('Welcome, Admin! 👋');
  } else {
    document.getElementById('loginError').textContent = '❌ Invalid credentials. Try admin / admin123';
  }
}

/** Close admin overlay and logout */
function closeAdmin() {
  isAdminLoggedIn = false;
  document.getElementById('adminOverlay').style.display = 'none';
  document.getElementById('adminLogin').style.display = 'none';
  document.getElementById('adminDash').style.display = 'none';
  closePostForm();
}

/** Show admin dashboard */
function showAdminDash() {
  document.getElementById('adminLogin').style.display = 'none';
  document.getElementById('adminDash').style.display = 'block';
  renderAdminTable();
}

// ===================================================
// ADMIN POST FORM
// ===================================================

/** Open post form for add or edit */
function openPostForm(id) {
  currentImageBase64 = '';
  document.getElementById('postForm').style.display = 'block';
  document.getElementById('previewPane').style.display = 'none';
  document.getElementById('imagePreview').innerHTML = '';

  if (id) {
    // EDIT mode
    const post = getPosts().find(p => p.id === id);
    if (!post) return;
    document.getElementById('formTitle').textContent = '✏️ Edit Post';
    document.getElementById('editId').value = id;
    document.getElementById('fTitle').value = post.title || '';
    document.getElementById('fAuthor').value = post.author || '';
    document.getElementById('fCategory').value = post.category || '';
    document.getElementById('fTags').value = (post.tags || []).join(', ');
    document.getElementById('fDesc').value = post.description || '';
    document.getElementById('fContent').value = post.content || '';
    if (post.image) {
      currentImageBase64 = post.image;
      document.getElementById('imagePreview').innerHTML = `<img src="${post.image}" alt="preview"/>`;
    }
  } else {
    // ADD mode
    document.getElementById('formTitle').textContent = '➕ New Post';
    document.getElementById('editId').value = '';
    document.getElementById('fTitle').value = '';
    document.getElementById('fAuthor').value = '';
    document.getElementById('fCategory').value = '';
    document.getElementById('fTags').value = '';
    document.getElementById('fDesc').value = '';
    document.getElementById('fContent').value = '';
  }

  document.getElementById('fTitle').focus();
}

/** Close post form */
function closePostForm() {
  document.getElementById('postForm').style.display = 'none';
  document.getElementById('previewPane').style.display = 'none';
  currentImageBase64 = '';
}

/** Handle image file upload → convert to base64 */
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate type
  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file.');
    return;
  }

  // Warn if too large (>2MB)
  if (file.size > 2 * 1024 * 1024) {
    showToast('⚠️ Image is large (>2MB). Storing anyway, but consider compressing it.');
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    currentImageBase64 = e.target.result;
    document.getElementById('imagePreview').innerHTML = `<img src="${currentImageBase64}" alt="preview"/>`;
    showToast('Image loaded ✅');
  };
  reader.readAsDataURL(file);
}

/** Save (add or update) a post */
function savePost() {
  const id = document.getElementById('editId').value;
  const title = document.getElementById('fTitle').value.trim();
  const author = document.getElementById('fAuthor').value.trim();
  const category = document.getElementById('fCategory').value.trim();
  const tagsRaw = document.getElementById('fTags').value.trim();
  const description = document.getElementById('fDesc').value.trim();
  const content = document.getElementById('fContent').value.trim();

  if (!title) { showToast('❌ Title is required!'); document.getElementById('fTitle').focus(); return; }
  if (!content) { showToast('❌ Content is required!'); document.getElementById('fContent').focus(); return; }

  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

  let posts = getPosts();

  if (id) {
    // UPDATE existing
    const idx = posts.findIndex(p => p.id === id);
    if (idx === -1) { showToast('Post not found!'); return; }
    posts[idx] = {
      ...posts[idx],
      title, author, category, tags, description, content,
      image: currentImageBase64 || posts[idx].image || ''
    };
    showToast('✅ Post updated!');
  } else {
    // CREATE new
    const newPost = {
      id: genId(),
      title, author, category, tags, description, content,
      image: currentImageBase64,
      dateCreated: new Date().toISOString()
    };
    posts.unshift(newPost);
    showToast('✅ Post created!');
  }

  savePosts(posts);
  closePostForm();
  renderAdminTable();
  populateCategoryFilter();
}

/** Preview post before saving */
function previewPost() {
  const title = document.getElementById('fTitle').value.trim() || 'Untitled';
  const author = document.getElementById('fAuthor').value.trim() || 'Anonymous';
  const content = document.getElementById('fContent').value || '';
  const category = document.getElementById('fCategory').value.trim() || 'General';

  document.getElementById('previewContent').innerHTML = `
    ${currentImageBase64 ? `<img class="post-full-img" src="${currentImageBase64}" alt="preview"/>` : ''}
    <div class="card-category">${escapeHtml(category)}</div>
    <h1 class="post-full-title">${escapeHtml(title)}</h1>
    <div class="post-full-meta"><span>✍️ ${escapeHtml(author)}</span> <span>📅 ${formatDate(new Date().toISOString())}</span></div>
    <div class="post-full-body">${content}</div>
  `;

  const pane = document.getElementById('previewPane');
  pane.style.display = pane.style.display === 'none' ? 'block' : 'none';
}

// ===================================================
// ADMIN TABLE
// ===================================================

/** Render the admin posts table */
function renderAdminTable() {
  const posts = getPosts();
  const tbody = document.getElementById('adminTableBody');
  const empty = document.getElementById('adminEmpty');
  const table = document.getElementById('adminTable');

  if (posts.length === 0) {
    table.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  table.style.display = 'table';
  empty.style.display = 'none';

  tbody.innerHTML = posts.map(p => `
    <tr>
      <td><strong>${escapeHtml(p.title)}</strong></td>
      <td>${escapeHtml(p.author || '-')}</td>
      <td>${escapeHtml(p.category || '-')}</td>
      <td>${formatDate(p.dateCreated)}</td>
      <td>
        <button class="edit-btn" onclick="openPostForm('${p.id}')">✏️ Edit</button>
        <button class="del-btn" onclick="deletePost('${p.id}')">❌ Delete</button>
      </td>
    </tr>
  `).join('');
}

/** Delete a post with confirmation */
function deletePost(id) {
  const posts = getPosts();
  const post = posts.find(p => p.id === id);
  if (!post) return;

  if (!confirm(`Are you sure you want to delete:\n"${post.title}"?\n\nThis cannot be undone.`)) return;

  const updated = posts.filter(p => p.id !== id);
  savePosts(updated);
  renderAdminTable();
  populateCategoryFilter();
  applyFilters();
  showToast('🗑️ Post deleted.');
}

// ===================================================
// DARK MODE
// ===================================================

function initDarkMode() {
  const saved = localStorage.getItem('blogcms_theme') || 'light';
  setTheme(saved);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('blogcms_theme', theme);
  document.getElementById('darkToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleDark() {
  const current = document.documentElement.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
}

// ===================================================
// TOAST NOTIFICATION
// ===================================================

function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

// ===================================================
// UTILITY
// ===================================================

/** Escape HTML to prevent XSS in user-generated text */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Format ISO date string to readable form */
function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

// ===================================================
// SCROLL TO TOP
// ===================================================

function initScrollTop() {
  const btn = document.getElementById('scrollTop');
  window.addEventListener('scroll', () => {
    btn.style.display = window.scrollY > 300 ? 'block' : 'none';
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ===================================================
// KEYBOARD SHORTCUT: Ctrl + Shift + A
// ===================================================

document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    openAdminOverlay();
  }
  // Close admin on Escape
  if (e.key === 'Escape') {
    const overlay = document.getElementById('adminOverlay');
    if (overlay.style.display !== 'none') closeAdmin();
  }
});

// Also allow Enter key in admin login
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('adminPass').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') adminLogin();
  });
  document.getElementById('adminUser').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('adminPass').focus();
  });
});

// Wire dark toggle button
document.getElementById('darkToggle').addEventListener('click', toggleDark);

// ===================================================
// INIT
// ===================================================

function init() {
  // Show loader briefly
  const loader = document.getElementById('loader');

  setTimeout(() => {
    loader.classList.add('hide');

    // Seed default posts if first visit
    seedDefaultPosts();

    // Init theme
    initDarkMode();

    // Init scroll to top
    initScrollTop();

    // Populate category dropdown and render grid
    populateCategoryFilter();
    applyFilters();

  }, 600);
}

// Start everything
init();