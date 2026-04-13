// ============================================================
// VIRTUAL NOTICE BOARD - script.js
// All application logic, LocalStorage, Auth, CRUD, Search/Filter
// ============================================================

// ---- ADMIN CREDENTIALS (hardcoded) ----
const ADMIN_USER = 'admin';
const ADMIN_PASS = '1234';

// ---- STATE ----
let isAdminLoggedIn = false;
let editingId = null;
let currentSearch = '';
let currentCategory = 'all';

// ---- DOM REFS ----
const userView = document.getElementById('user-view');
const adminView = document.getElementById('admin-view');
const loginModal = document.getElementById('login-modal');
const adminStatusBar = document.getElementById('admin-status-bar');
const noticesContainer = document.getElementById('notices-container');
const adminNoticesContainer = document.getElementById('admin-notices-container');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const adminToggleBtn = document.getElementById('admin-toggle-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginSubmitBtn = document.getElementById('login-submit-btn');
const loginCancelBtn = document.getElementById('login-cancel-btn');
const loginUsernameInput = document.getElementById('login-username');
const loginPasswordInput = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const saveNoticeBtn = document.getElementById('save-notice-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const formHeading = document.getElementById('form-heading');
const editIdInput = document.getElementById('edit-id');
const noticeTitleInput = document.getElementById('notice-title');
const noticeDescInput = document.getElementById('notice-desc');
const noticeCategoryInput = document.getElementById('notice-category');
const noticeAttachmentInput = document.getElementById('notice-attachment');
const noticePinInput = document.getElementById('notice-pin');
const toast = document.getElementById('toast');

// ============================================================
// LOCALSTORAGE HELPERS
// ============================================================

/** Get all notices from LocalStorage */
function getNotices() {
  return JSON.parse(localStorage.getItem('vnb_notices') || '[]');
}

/** Save notices array to LocalStorage */
function saveNotices(notices) {
  localStorage.setItem('vnb_notices', JSON.stringify(notices));
}

/** Generate a unique ID */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================

let toastTimer = null;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================================
// SORTING LOGIC: Pinned first, then newest first
// ============================================================

function sortNotices(notices) {
  return [...notices].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ============================================================
// RENDER USER NOTICES
// ============================================================

function renderUserNotices() {
  let notices = sortNotices(getNotices());

  // Apply search filter
  if (currentSearch.trim()) {
    const q = currentSearch.toLowerCase();
    notices = notices.filter(n => n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q));
  }

  // Apply category filter
  if (currentCategory !== 'all') {
    notices = notices.filter(n => n.category === currentCategory);
  }

  noticesContainer.innerHTML = '';

  if (notices.length === 0) {
    noticesContainer.innerHTML = `
      <div id="empty-state">
        <div class="empty-icon">📭</div>
        <p>No notices found.</p>
      </div>`;
    return;
  }

  notices.forEach(n => {
    const card = document.createElement('div');
    card.className = 'notice-card' + (n.pinned ? ' pinned' : '');
    card.innerHTML = `
      ${n.pinned ? '<span class="pin-badge">📌 Pinned</span>' : ''}
      <div class="notice-title">${escapeHTML(n.title)}</div>
      <span class="notice-category cat-${n.category}">${n.category}</span>
      <div class="notice-desc">${escapeHTML(n.description)}</div>
      <div class="notice-meta">🕒 ${formatDate(n.createdAt)}</div>
      ${n.attachment ? `<a class="notice-attachment" href="${escapeHTML(n.attachment)}" target="_blank" rel="noopener">📎 View Attachment</a>` : ''}
    `;
    noticesContainer.appendChild(card);
  });
}

// ============================================================
// RENDER ADMIN NOTICES
// ============================================================

function renderAdminNotices() {
  const notices = sortNotices(getNotices());
  adminNoticesContainer.innerHTML = '';

  if (notices.length === 0) {
    adminNoticesContainer.innerHTML = `
      <div id="empty-state">
        <div class="empty-icon">📭</div>
        <p>No notices yet. Add one above!</p>
      </div>`;
    return;
  }

  notices.forEach(n => {
    const card = document.createElement('div');
    card.className = 'notice-card' + (n.pinned ? ' pinned' : '');
    card.innerHTML = `
      ${n.pinned ? '<span class="pin-badge">📌 Pinned</span>' : ''}
      <div class="notice-title">${escapeHTML(n.title)}</div>
      <span class="notice-category cat-${n.category}">${n.category}</span>
      <div class="notice-desc">${escapeHTML(n.description)}</div>
      <div class="notice-meta">🕒 ${formatDate(n.createdAt)}</div>
      ${n.attachment ? `<a class="notice-attachment" href="${escapeHTML(n.attachment)}" target="_blank" rel="noopener">📎 Attachment</a>` : ''}
      <div class="admin-card-btns">
        <button class="btn-edit" data-id="${n.id}">✏️ Edit</button>
        <button class="btn-delete" data-id="${n.id}">🗑️ Delete</button>
        <button class="btn-pin" data-id="${n.id}">${n.pinned ? '📌 Unpin' : '📌 Pin'}</button>
      </div>
    `;
    adminNoticesContainer.appendChild(card);
  });

  // Bind edit buttons
  adminNoticesContainer.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => startEdit(btn.dataset.id));
  });

  // Bind delete buttons
  adminNoticesContainer.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteNotice(btn.dataset.id));
  });

  // Bind pin buttons
  adminNoticesContainer.querySelectorAll('.btn-pin').forEach(btn => {
    btn.addEventListener('click', () => togglePin(btn.dataset.id));
  });
}

// ============================================================
// ADMIN AUTH
// ============================================================

/** Show admin login modal */
adminToggleBtn.addEventListener('click', () => {
  if (isAdminLoggedIn) {
    // Already logged in — just toggle admin view
    toggleAdminView();
  } else {
    loginModal.style.display = 'flex';
    loginUsernameInput.value = '';
    loginPasswordInput.value = '';
    loginError.style.display = 'none';
    loginUsernameInput.focus();
  }
});

/** Login submit */
loginSubmitBtn.addEventListener('click', doLogin);
loginPasswordInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

function doLogin() {
  const u = loginUsernameInput.value.trim();
  const p = loginPasswordInput.value;
  if (u === ADMIN_USER && p === ADMIN_PASS) {
    isAdminLoggedIn = true;
    loginModal.style.display = 'none';
    loginError.style.display = 'none';
    showAdminView();
    showToast('✅ Logged in as Admin');
  } else {
    loginError.style.display = 'block';
    loginPasswordInput.value = '';
    loginPasswordInput.focus();
  }
}

/** Cancel login */
loginCancelBtn.addEventListener('click', () => {
  loginModal.style.display = 'none';
  loginError.style.display = 'none';
});

/** Logout */
logoutBtn.addEventListener('click', () => {
  isAdminLoggedIn = false;
  showUserView();
  showToast('👋 Logged out');
});

// ============================================================
// VIEW TOGGLE HELPERS
// ============================================================

function showAdminView() {
  userView.style.display = 'none';
  adminView.style.display = 'block';
  adminStatusBar.style.display = 'flex';
  resetForm();
  renderAdminNotices();
}

function showUserView() {
  adminView.style.display = 'none';
  userView.style.display = 'block';
  adminStatusBar.style.display = 'none';
  renderUserNotices();
}

function toggleAdminView() {
  if (adminView.style.display === 'none' || adminView.style.display === '') {
    showAdminView();
  } else {
    showUserView();
  }
}

// ============================================================
// ADD / EDIT NOTICE
// ============================================================

saveNoticeBtn.addEventListener('click', saveNotice);

function saveNotice() {
  const title = noticeTitleInput.value.trim();
  const desc = noticeDescInput.value.trim();
  const category = noticeCategoryInput.value;
  const attachment = noticeAttachmentInput.value.trim();
  const pinned = noticePinInput.checked;

  // Form validation
  if (!title) { showToast('⚠️ Please enter a notice title.'); noticeTitleInput.focus(); return; }
  if (!desc) { showToast('⚠️ Please enter a description.'); noticeDescInput.focus(); return; }

  const notices = getNotices();

  if (editingId) {
    // Edit existing
    const idx = notices.findIndex(n => n.id === editingId);
    if (idx !== -1) {
      notices[idx] = { ...notices[idx], title, description: desc, category, attachment, pinned };
      saveNotices(notices);
      showToast('✅ Notice updated successfully!');
    }
    resetForm();
  } else {
    // Add new
    const newNotice = {
      id: generateId(),
      title,
      description: desc,
      category,
      attachment,
      pinned,
      createdAt: new Date().toISOString()
    };
    notices.unshift(newNotice);
    saveNotices(notices);
    showToast('✅ Notice added successfully!');
    resetForm();
  }

  renderAdminNotices();
}

// ============================================================
// START EDIT
// ============================================================

function startEdit(id) {
  const notices = getNotices();
  const notice = notices.find(n => n.id === id);
  if (!notice) return;

  editingId = id;
  formHeading.textContent = 'Edit Notice';
  noticeTitleInput.value = notice.title;
  noticeDescInput.value = notice.description;
  noticeCategoryInput.value = notice.category;
  noticeAttachmentInput.value = notice.attachment || '';
  noticePinInput.checked = notice.pinned;
  cancelEditBtn.style.display = 'inline-block';

  // Scroll to form
  document.getElementById('notice-form-section').scrollIntoView({ behavior: 'smooth' });
}

/** Cancel edit */
cancelEditBtn.addEventListener('click', resetForm);

function resetForm() {
  editingId = null;
  formHeading.textContent = 'Add New Notice';
  editIdInput.value = '';
  noticeTitleInput.value = '';
  noticeDescInput.value = '';
  noticeCategoryInput.value = 'General';
  noticeAttachmentInput.value = '';
  noticePinInput.checked = false;
  cancelEditBtn.style.display = 'none';
}

// ============================================================
// DELETE NOTICE
// ============================================================

function deleteNotice(id) {
  if (!confirm('Are you sure you want to delete this notice? This action cannot be undone.')) return;
  let notices = getNotices();
  notices = notices.filter(n => n.id !== id);
  saveNotices(notices);
  showToast('🗑️ Notice deleted.');
  renderAdminNotices();
}

// ============================================================
// TOGGLE PIN
// ============================================================

function togglePin(id) {
  const notices = getNotices();
  const idx = notices.findIndex(n => n.id === id);
  if (idx !== -1) {
    notices[idx].pinned = !notices[idx].pinned;
    saveNotices(notices);
    showToast(notices[idx].pinned ? '📌 Notice pinned!' : '📌 Notice unpinned!');
    renderAdminNotices();
  }
}

// ============================================================
// SEARCH & FILTER (User View)
// ============================================================

searchInput.addEventListener('input', () => {
  currentSearch = searchInput.value;
  renderUserNotices();
});

categoryFilter.addEventListener('change', () => {
  currentCategory = categoryFilter.value;
  renderUserNotices();
});

// ============================================================
// SECURITY: Escape HTML to prevent XSS
// ============================================================

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
}

// ============================================================
// SEED SAMPLE DATA (only if no notices exist yet)
// ============================================================

function seedSampleData() {
  if (getNotices().length > 0) return;
  const samples = [
    {
      id: generateId(),
      title: 'Mid-Term Examination Schedule Released',
      description: 'Mid-term exams will begin from 20th April 2025. Timetable has been published on the official portal. Students must carry their hall tickets.',
      category: 'Exam',
      attachment: '',
      pinned: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    },
    {
      id: generateId(),
      title: 'Annual Cultural Fest - TechFiesta 2025',
      description: 'The annual cultural fest will be held on 25th April. Register before 18th April to participate in various events including music, dance, and coding contests.',
      category: 'Event',
      attachment: 'https://example.com/techfiesta',
      pinned: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    },
    {
      id: generateId(),
      title: 'Eid Holiday - College Closed',
      description: 'College will remain closed on 31st March on account of Eid-ul-Fitr. Regular classes will resume from 1st April.',
      category: 'Holiday',
      attachment: '',
      pinned: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
    },
    {
      id: generateId(),
      title: 'Important: Fee Payment Deadline',
      description: 'Last date to pay the semester fee is 15th April 2025. Late payment will attract a fine of Rs. 100 per day. Pay online via the student portal.',
      category: 'Important',
      attachment: '',
      pinned: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
    },
    {
      id: generateId(),
      title: 'Library Timings Updated',
      description: 'The central library will now remain open from 8:00 AM to 9:00 PM on all working days. Saturday timings: 9:00 AM to 5:00 PM.',
      category: 'General',
      attachment: '',
      pinned: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString()
    }
  ];
  saveNotices(samples);
}

// ============================================================
// INIT
// ============================================================

function init() {
  seedSampleData();
  renderUserNotices();
}

init();