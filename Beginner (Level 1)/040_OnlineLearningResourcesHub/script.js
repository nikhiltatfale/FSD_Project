// ===================== STATE =====================
const ADMIN_CREDS = { username: 'admin', password: 'admin123' };
let currentUser = null;
let isAdmin = false;
let currentSection = 'home';
let currentCategory = 'all';
let searchQuery = '';
let confirmCallback = null;
let adminActiveTab = 'resources';

// ===================== LOCALSTORAGE HELPERS =====================
const ls = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

// ===================== INIT DATA =====================
const DEFAULT_CATEGORIES = ['Programming', 'Design', 'AI & ML', 'Mathematics', 'Science', 'Business'];

const DEFAULT_RESOURCES = [
  { id: 'r1', title: 'JavaScript Full Course', description: 'Complete beginner to advanced JavaScript course covering ES6+, async/await, and DOM manipulation.', category: 'Programming', type: 'Video', url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg' },
  { id: 'r2', title: 'Python for Beginners', description: 'Learn Python programming from scratch with hands-on exercises and projects.', category: 'Programming', type: 'Video', url: 'https://www.youtube.com/watch?v=rfscVS0vtbw' },
  { id: 'r3', title: 'CSS Grid & Flexbox Guide', description: 'Master modern CSS layout techniques with Grid and Flexbox in this comprehensive guide.', category: 'Design', type: 'Link', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/' },
  { id: 'r4', title: 'Intro to Machine Learning', description: 'Google\'s foundational course on machine learning concepts, algorithms, and applications.', category: 'AI & ML', type: 'Link', url: 'https://developers.google.com/machine-learning/crash-course' },
  { id: 'r5', title: 'Design Principles PDF', description: 'Comprehensive PDF covering fundamental design principles: balance, contrast, hierarchy, and more.', category: 'Design', type: 'PDF', url: 'https://www.smashingmagazine.com/ebooks/' },
  { id: 'r6', title: 'React Documentation', description: 'Official React documentation with examples, hooks reference, and advanced patterns.', category: 'Programming', type: 'Link', url: 'https://react.dev' },
  { id: 'r7', title: 'Calculus Made Easy', description: 'A step-by-step approach to calculus, covering limits, derivatives, and integrals with examples.', category: 'Mathematics', type: 'PDF', url: 'https://www.gutenberg.org/files/33283/33283-pdf.pdf' },
  { id: 'r8', title: 'Deep Learning Explained', description: 'Neural networks, CNNs, RNNs, and transformers explained with diagrams and code examples.', category: 'AI & ML', type: 'Video', url: 'https://www.youtube.com/watch?v=aircAruvnKk' },
  { id: 'r9', title: 'UI/UX Design Notes', description: 'Comprehensive notes covering user research, wireframing, prototyping, and usability testing.', category: 'Design', type: 'Notes', url: '#' },
  { id: 'r10', title: 'Business Model Canvas', description: 'Learn how to use the business model canvas to plan and validate your startup idea.', category: 'Business', type: 'Link', url: 'https://www.strategyzer.com/canvas' },
];

function initData() {
  if (!ls.get('lh_initialized')) {
    ls.set('categories', DEFAULT_CATEGORIES);
    ls.set('resources', DEFAULT_RESOURCES);
    ls.set('users', []);
    ls.set('lh_initialized', true);
  }
}

// ===================== UTILITY FUNCTIONS =====================
function genId() { return 'r' + Date.now() + Math.floor(Math.random() * 1000); }

function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

function showConfirm(msg, cb) {
  confirmCallback = cb;
  document.getElementById('confirm-msg').textContent = msg;
  document.getElementById('confirm-overlay').classList.remove('hidden');
}

document.getElementById('confirm-yes').onclick = () => {
  document.getElementById('confirm-overlay').classList.add('hidden');
  if (confirmCallback) confirmCallback();
};
document.getElementById('confirm-no').onclick = () => {
  document.getElementById('confirm-overlay').classList.add('hidden');
  confirmCallback = null;
};

// ===================== NAVBAR & SECTIONS =====================
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
  document.getElementById(name).classList.remove('hidden');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const active = document.querySelector(`[data-section="${name}"]`);
  if (active) active.classList.add('active');
  currentSection = name;
  closeMenu();
  if (name === 'home') renderResources();
  if (name === 'favorites') renderFavorites();
  if (name === 'progress') renderProgress();
}

function toggleMenu() {
  document.getElementById('nav-links').classList.toggle('open');
}
function closeMenu() {
  document.getElementById('nav-links').classList.remove('open');
}

// ===================== AUTH =====================
function switchTab(tab) {
  const loginDiv = document.getElementById('login-form-div');
  const regDiv = document.getElementById('register-form-div');
  const tabs = document.querySelectorAll('#login-modal .tab-btn');
  if (tab === 'login') {
    loginDiv.classList.remove('hidden');
    regDiv.classList.add('hidden');
    tabs[0].classList.add('active'); tabs[1].classList.remove('active');
  } else {
    loginDiv.classList.add('hidden');
    regDiv.classList.remove('hidden');
    tabs[0].classList.remove('active'); tabs[1].classList.add('active');
  }
}

function registerUser() {
  const name = document.getElementById('reg-name').value.trim();
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  if (!name || !username || !email || !password) return showToast('All fields required', 'error');
  if (password.length < 6) return showToast('Password must be 6+ characters', 'error');
  const users = ls.get('users') || [];
  if (users.find(u => u.username === username)) return showToast('Username already taken', 'error');
  const newUser = { id: 'u' + Date.now(), name, username, email, password, joined: new Date().toLocaleDateString() };
  users.push(newUser);
  ls.set('users', users);
  showToast('Registered successfully! Please login.', 'success');
  switchTab('login');
}

function loginUser() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  if (!username || !password) return showToast('Fill all fields', 'error');
  const users = ls.get('users') || [];
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return showToast('Invalid credentials', 'error');
  currentUser = user;
  updateNavForUser();
  closeModal('login-modal');
  showToast(`Welcome back, ${user.name}!`, 'success');
  renderResources();
}

function logoutUser() {
  currentUser = null;
  isAdmin = false;
  updateNavForUser();
  showSection('home');
  showToast('Logged out successfully', 'info');
}

function loginAdmin() {
  const u = document.getElementById('admin-username').value.trim();
  const p = document.getElementById('admin-password').value;
  if (u === ADMIN_CREDS.username && p === ADMIN_CREDS.password) {
    isAdmin = true;
    closeModal('admin-login-modal');
    openAdminDashboard();
    showToast('Admin access granted', 'success');
  } else {
    showToast('Invalid admin credentials', 'error');
  }
}

function updateNavForUser() {
  const loginBtn = document.getElementById('nav-login-btn');
  const logoutBtn = document.getElementById('nav-logout-btn');
  const userInfo = document.getElementById('nav-user-info');
  if (currentUser) {
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    userInfo.classList.remove('hidden');
    userInfo.textContent = `👤 ${currentUser.name}`;
  } else {
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    userInfo.classList.add('hidden');
  }
}

// ===================== MODALS =====================
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}
// Close modal on backdrop click
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.add('hidden'); });
});

// ===================== CATEGORIES =====================
function getCategories() { return ls.get('categories') || DEFAULT_CATEGORIES; }

function renderCategoryFilters() {
  const cats = getCategories();
  const cont = document.getElementById('category-filter-btns');
  cont.innerHTML = cats.map(c =>
    `<button class="filter-btn" onclick="filterByCategory('${c}', this)">${c}</button>`
  ).join('');
}

function renderAdminCategorySelect() {
  const sel = document.getElementById('res-category');
  const cats = getCategories();
  sel.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

// ===================== RESOURCES - RENDER =====================
function getResources() { return ls.get('resources') || []; }

function renderResources() {
  const resources = getResources();
  const grid = document.getElementById('resource-grid');
  const empty = document.getElementById('home-empty');
  let filtered = resources;
  if (currentCategory !== 'all') filtered = filtered.filter(r => r.category === currentCategory);
  if (searchQuery) filtered = filtered.filter(r =>
    r.title.toLowerCase().includes(searchQuery) ||
    r.description.toLowerCase().includes(searchQuery) ||
    r.category.toLowerCase().includes(searchQuery)
  );
  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    grid.innerHTML = filtered.map(r => resourceCard(r)).join('');
  }
}

function resourceCard(r) {
  const favs = currentUser ? (ls.get(`favs_${currentUser.id}`) || []) : [];
  const done = currentUser ? (ls.get(`done_${currentUser.id}`) || []) : [];
  const isFav = favs.includes(r.id);
  const isDone = done.includes(r.id);
  return `
  <div class="resource-card">
    <div class="card-body">
      <div class="card-category">${r.category}</div>
      <span class="card-badge badge-${r.type}">${r.type}</span>
      <div class="card-title">${r.title}</div>
      <div class="card-desc">${r.description}</div>
    </div>
    <div class="card-actions">
      <button class="btn-open" onclick="openResource('${r.url}')">&#128279; Open</button>
      <button class="btn-fav ${isFav ? 'active' : ''}" onclick="addToFavorites('${r.id}', this)">${isFav ? '★' : '☆'} Fav</button>
      <button class="btn-done ${isDone ? 'active' : ''}" onclick="markCompleted('${r.id}', this)">${isDone ? '✅' : '○'} Done</button>
    </div>
  </div>`;
}

function openResource(url) {
  if (!url || url === '#') return showToast('No URL available for this resource', 'error');
  window.open(url, '_blank');
}

// ===================== SEARCH & FILTER =====================
function searchResources() {
  searchQuery = document.getElementById('search-input').value.trim().toLowerCase();
  renderResources();
}

function filterByCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderResources();
}

// ===================== FAVORITES =====================
function addToFavorites(id, btn) {
  if (!currentUser) return showToast('Please login to use favorites', 'error');
  const key = `favs_${currentUser.id}`;
  const favs = ls.get(key) || [];
  const idx = favs.indexOf(id);
  if (idx === -1) {
    favs.push(id);
    showToast('Added to favorites ⭐', 'success');
    if (btn) { btn.classList.add('active'); btn.textContent = '★ Fav'; }
  } else {
    favs.splice(idx, 1);
    showToast('Removed from favorites', 'info');
    if (btn) { btn.classList.remove('active'); btn.textContent = '☆ Fav'; }
  }
  ls.set(key, favs);
  if (currentSection === 'favorites') renderFavorites();
}

function renderFavorites() {
  const grid = document.getElementById('favorites-grid');
  const empty = document.getElementById('favorites-empty');
  if (!currentUser) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    empty.querySelector('h3').textContent = 'Login to see your favorites';
    return;
  }
  const favs = ls.get(`favs_${currentUser.id}`) || [];
  const resources = getResources().filter(r => favs.includes(r.id));
  if (resources.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    grid.innerHTML = resources.map(r => resourceCard(r)).join('');
  }
}

// ===================== PROGRESS =====================
function markCompleted(id, btn) {
  if (!currentUser) return showToast('Please login to track progress', 'error');
  const key = `done_${currentUser.id}`;
  const done = ls.get(key) || [];
  const idx = done.indexOf(id);
  if (idx === -1) {
    done.push(id);
    showToast('Marked as completed ✅', 'success');
    if (btn) { btn.classList.add('active'); btn.textContent = '✅ Done'; }
  } else {
    done.splice(idx, 1);
    showToast('Unmarked as completed', 'info');
    if (btn) { btn.classList.remove('active'); btn.textContent = '○ Done'; }
  }
  ls.set(key, done);
  if (currentSection === 'progress') renderProgress();
}

function renderProgress() {
  const grid = document.getElementById('progress-grid');
  const empty = document.getElementById('progress-empty');
  const statsDiv = document.getElementById('progress-stats');
  if (!currentUser) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    empty.querySelector('h3').textContent = 'Login to track your progress';
    statsDiv.innerHTML = '';
    return;
  }
  const done = ls.get(`done_${currentUser.id}`) || [];
  const total = getResources().length;
  const pct = total ? Math.round((done.length / total) * 100) : 0;
  statsDiv.innerHTML = `
    <div class="stat-card"><div class="stat-num">${done.length}</div><div class="stat-label">Completed</div></div>
    <div class="stat-card"><div class="stat-num">${total - done.length}</div><div class="stat-label">Remaining</div></div>
    <div class="stat-card"><div class="stat-num">${pct}%</div><div class="stat-label">Progress</div></div>
  `;
  const resources = getResources().filter(r => done.includes(r.id));
  if (resources.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    grid.innerHTML = resources.map(r => resourceCard(r)).join('');
  }
}

// ===================== ADMIN =====================
function openAdminDashboard() {
  loadDashboardStats();
  renderAdminResources();
  renderAdminCategorySelect();
  renderAdminCategories();
  renderAdminUsers();
  openModal('admin-modal');
}

function loadDashboardStats() {
  const resources = getResources();
  const users = ls.get('users') || [];
  const cats = getCategories();
  document.getElementById('admin-stats').innerHTML = `
    <div class="admin-stat"><div class="num">${resources.length}</div><div class="lbl">Resources</div></div>
    <div class="admin-stat"><div class="num">${users.length}</div><div class="lbl">Users</div></div>
    <div class="admin-stat"><div class="num">${cats.length}</div><div class="lbl">Categories</div></div>
  `;
}

function switchAdminTab(tab) {
  const tabs = ['resources', 'add-resource', 'categories', 'users'];
  tabs.forEach(t => {
    const el = document.getElementById(`admin-${t}-tab`);
    if (el) el.classList.add('hidden');
  });
  document.getElementById(`admin-${tab}-tab`).classList.remove('hidden');
  document.querySelectorAll('.admin-tabs .tab-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  adminActiveTab = tab;
  if (tab === 'resources') renderAdminResources();
  if (tab === 'categories') renderAdminCategories();
  if (tab === 'users') renderAdminUsers();
  if (tab === 'add-resource') { clearResourceForm(); renderAdminCategorySelect(); }
}

// ADMIN: Resource CRUD
function renderAdminResources() {
  const resources = getResources();
  const list = document.getElementById('admin-resource-list');
  if (resources.length === 0) {
    list.innerHTML = '<p style="color:#888;text-align:center;padding:20px">No resources yet.</p>';
    return;
  }
  list.innerHTML = resources.map(r => `
    <div class="admin-item">
      <div class="admin-item-info">
        <strong title="${r.title}">${r.title}</strong>
        <span>${r.category} · ${r.type}</span>
      </div>
      <div class="admin-item-actions">
        <button class="btn-edit" onclick="editResource('${r.id}')">✏️ Edit</button>
        <button class="btn-delete" onclick="deleteResource('${r.id}')">🗑️ Del</button>
      </div>
    </div>`).join('');
}

function saveResource() {
  const id = document.getElementById('edit-resource-id').value;
  const title = document.getElementById('res-title').value.trim();
  const desc = document.getElementById('res-desc').value.trim();
  const category = document.getElementById('res-category').value;
  const type = document.getElementById('res-type').value;
  const url = document.getElementById('res-url').value.trim();
  if (!title || !desc || !category || !url) return showToast('All fields required', 'error');
  const resources = getResources();
  if (id) {
    const idx = resources.findIndex(r => r.id === id);
    if (idx !== -1) resources[idx] = { id, title, description: desc, category, type, url };
    showToast('Resource updated!', 'success');
  } else {
    resources.push({ id: genId(), title, description: desc, category, type, url });
    showToast('Resource added!', 'success');
  }
  ls.set('resources', resources);
  clearResourceForm();
  loadDashboardStats();
  renderResources();
}

function addResource() { saveResource(); }

function editResource(id) {
  const r = getResources().find(x => x.id === id);
  if (!r) return;
  renderAdminCategorySelect();
  document.getElementById('edit-resource-id').value = r.id;
  document.getElementById('res-title').value = r.title;
  document.getElementById('res-desc').value = r.description;
  document.getElementById('res-category').value = r.category;
  document.getElementById('res-type').value = r.type;
  document.getElementById('res-url').value = r.url;
  // Switch to add-resource tab
  document.querySelectorAll('.admin-tabs .tab-btn').forEach((b, i) => {
    b.classList.remove('active');
    if (i === 1) b.classList.add('active');
  });
  ['resources', 'add-resource', 'categories', 'users'].forEach(t => {
    const el = document.getElementById(`admin-${t}-tab`);
    if (el) el.classList.add('hidden');
  });
  document.getElementById('admin-add-resource-tab').classList.remove('hidden');
}

function deleteResource(id) {
  showConfirm('Delete this resource? This cannot be undone.', () => {
    let resources = getResources().filter(r => r.id !== id);
    ls.set('resources', resources);
    showToast('Resource deleted', 'info');
    renderAdminResources();
    loadDashboardStats();
    renderResources();
  });
}

function clearResourceForm() {
  document.getElementById('edit-resource-id').value = '';
  document.getElementById('res-title').value = '';
  document.getElementById('res-desc').value = '';
  document.getElementById('res-url').value = '';
  const sel = document.getElementById('res-category');
  if (sel.options.length) sel.selectedIndex = 0;
  document.getElementById('res-type').selectedIndex = 0;
}

// ADMIN: Categories
function renderAdminCategories() {
  const cats = getCategories();
  const list = document.getElementById('admin-category-list');
  list.innerHTML = cats.map(c => `
    <div class="admin-item">
      <div class="admin-item-info"><strong>${c}</strong></div>
      <div class="admin-item-actions">
        <button class="btn-delete" onclick="deleteCategory('${c}')">🗑️ Delete</button>
      </div>
    </div>`).join('');
}

function addCategory() {
  const input = document.getElementById('new-category-input');
  const name = input.value.trim();
  if (!name) return showToast('Enter a category name', 'error');
  const cats = getCategories();
  if (cats.includes(name)) return showToast('Category already exists', 'error');
  cats.push(name);
  ls.set('categories', cats);
  input.value = '';
  showToast('Category added', 'success');
  renderAdminCategories();
  renderCategoryFilters();
  renderAdminCategorySelect();
  loadDashboardStats();
}

function deleteCategory(name) {
  showConfirm(`Delete category "${name}"?`, () => {
    let cats = getCategories().filter(c => c !== name);
    ls.set('categories', cats);
    showToast('Category deleted', 'info');
    renderAdminCategories();
    renderCategoryFilters();
    loadDashboardStats();
  });
}

// ADMIN: Users
function renderAdminUsers() {
  const users = ls.get('users') || [];
  const list = document.getElementById('admin-user-list');
  if (users.length === 0) {
    list.innerHTML = '<p style="color:#888;text-align:center;padding:20px">No registered users yet.</p>';
    return;
  }
  list.innerHTML = users.map(u => `
    <div class="user-item">
      <div class="user-avatar">${u.name.charAt(0).toUpperCase()}</div>
      <div class="user-info">
        <strong>${u.name} (@${u.username})</strong>
        <span>${u.email} · Joined: ${u.joined}</span>
      </div>
    </div>`).join('');
}

// ===================== PAGE LOAD =====================
window.addEventListener('load', () => {
  initData();
  renderCategoryFilters();
  renderResources();
  updateNavForUser();
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
  }, 800);
});