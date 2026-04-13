const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const refreshBtn = document.getElementById('refresh-btn');
const adminTbody = document.getElementById('admin-tbody');
const totalContactsEl = document.getElementById('total-contacts');
const adminEmpty = document.getElementById('admin-empty');
const adminLoading = document.getElementById('admin-loading');
const toastEl = document.getElementById('toast');

let adminToken = sessionStorage.getItem('adminToken') || null;

function showToast(msg, type = 'success') {
  toastEl.textContent = msg;
  toastEl.className = 'toast ' + type;
  toastEl.style.display = 'block';
  setTimeout(() => { toastEl.style.display = 'none'; }, 3000);
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showDashboard() {
  loginSection.style.display = 'none';
  dashboardSection.style.display = 'block';
  logoutBtn.style.display = 'inline-block';
  loadAdminContacts();
}

function showLogin() {
  loginSection.style.display = 'block';
  dashboardSection.style.display = 'none';
  logoutBtn.style.display = 'none';
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.style.display = 'none';
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!username || !password) {
    loginError.textContent = 'Please enter username and password.';
    loginError.style.display = 'block';
    return;
  }
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      loginError.textContent = data.error || 'Login failed.';
      loginError.style.display = 'block';
      return;
    }
    adminToken = data.token;
    sessionStorage.setItem('adminToken', adminToken);
    showDashboard();
  } catch (err) {
    loginError.textContent = 'Network error. Please try again.';
    loginError.style.display = 'block';
  }
});

logoutBtn.addEventListener('click', () => {
  adminToken = null;
  sessionStorage.removeItem('adminToken');
  showLogin();
});

refreshBtn.addEventListener('click', loadAdminContacts);

async function loadAdminContacts() {
  adminLoading.style.display = 'block';
  adminTbody.innerHTML = '';
  adminEmpty.style.display = 'none';
  try {
    const res = await fetch('/api/contacts');
    const contacts = await res.json();
    totalContactsEl.textContent = contacts.length;
    adminLoading.style.display = 'none';
    if (contacts.length === 0) {
      adminEmpty.style.display = 'block';
      return;
    }
    contacts.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.id}</td>
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.phone)}</td>
        <td>${escapeHtml(c.email)}</td>
        <td>${escapeHtml(c.address)}</td>
        <td>${escapeHtml(c.notes || '')}</td>
        <td>${new Date(c.createdAt).toLocaleString()}</td>
        <td><button class="delete-btn" onclick="adminDelete(${c.id})">Delete</button></td>
      `;
      adminTbody.appendChild(tr);
    });
  } catch (err) {
    adminLoading.style.display = 'none';
    showToast('Failed to load contacts.', 'error');
  }
}

async function adminDelete(id) {
  if (!confirm('Delete this contact permanently?')) return;
  try {
    const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Delete failed.', 'error');
      return;
    }
    showToast('Contact deleted.', 'success');
    loadAdminContacts();
  } catch (err) {
    showToast('Network error.', 'error');
  }
}

// Check if already logged in
if (adminToken) {
  showDashboard();
} else {
  showLogin();
}