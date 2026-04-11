/* ============================================
   CIVICVOICE – script.js
   All JS logic: localStorage, forms, modals
   ============================================ */

// ── STORAGE HELPERS ────────────────────────────
const STORAGE_KEY = 'civicvoice_complaints';

function getComplaints() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveComplaints(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function generateId() {
  return 'CMP-' + Date.now();
}

// ── TOAST ──────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

// ── MODAL ──────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  document.body.style.overflow = '';
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

// ── NAVBAR ─────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
  highlightNavLink();
});

function highlightNavLink() {
  const sections = ['home', 'register', 'track', 'mycomplaints'];
  let current = '';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 100) current = id;
  });
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
}

// ── HERO STATS ─────────────────────────────────
function updateStats() {
  const list = getComplaints();
  document.getElementById('statTotal').textContent = list.length;
  document.getElementById('statPending').textContent = list.filter(c => c.status === 'Pending').length;
  document.getElementById('statResolved').textContent = list.filter(c => c.status === 'Resolved').length;
}

// ── FORM VALIDATION ─────────────────────────────
function setErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}
function clearErrors() {
  ['errName', 'errEmail', 'errPhone', 'errCategory', 'errDesc', 'errPriority'].forEach(id => setErr(id, ''));
  document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
}
function markInvalid(fieldId) {
  const el = document.getElementById(fieldId);
  if (el) el.classList.add('invalid');
}

function validateForm() {
  clearErrors();
  let valid = true;
  const name = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const category = document.getElementById('category').value;
  const desc = document.getElementById('description').value.trim();
  const priority = document.querySelector('input[name="priority"]:checked');

  if (!name) { setErr('errName', 'Full name is required.'); markInvalid('fullName'); valid = false; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setErr('errEmail', 'Enter a valid email address.'); markInvalid('email'); valid = false;
  }
  if (phone && !/^\d{10}$/.test(phone)) {
    setErr('errPhone', 'Phone must be 10 digits.'); markInvalid('phone'); valid = false;
  }
  if (!category) { setErr('errCategory', 'Please select a category.'); markInvalid('category'); valid = false; }
  if (desc.length < 20) { setErr('errDesc', 'Description must be at least 20 characters.'); markInvalid('description'); valid = false; }
  if (!priority) { setErr('errPriority', 'Please select a priority.'); valid = false; }
  return valid;
}

// ── DESCRIPTION CHAR COUNTER ────────────────────
document.getElementById('description').addEventListener('input', function () {
  const len = this.value.trim().length;
  const counter = document.getElementById('charCount');
  counter.textContent = len + ' / 20 min';
  counter.style.color = len >= 20 ? 'var(--success)' : 'var(--text-light)';
});

// ── IMAGE UPLOAD PREVIEW ────────────────────────
document.getElementById('imageUpload').addEventListener('change', function () {
  const file = this.files[0];
  const preview = document.getElementById('imagePreview');
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  } else {
    preview.classList.add('hidden');
  }
});

// ── REGISTER COMPLAINT ──────────────────────────
document.getElementById('complaintForm').addEventListener('submit', function (e) {
  e.preventDefault();
  if (!validateForm()) return;

  const fileInput = document.getElementById('imageUpload');
  const file = fileInput.files[0];

  function saveComplaint(imageData) {
    const complaint = {
      id: generateId(),
      name: document.getElementById('fullName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      category: document.getElementById('category').value,
      description: document.getElementById('description').value.trim(),
      priority: document.querySelector('input[name="priority"]:checked').value,
      image: imageData || null,
      status: 'Pending',
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    const list = getComplaints();
    list.unshift(complaint);
    saveComplaints(list);

    // Show success modal
    document.getElementById('generatedId').textContent = complaint.id;
    openModal('successModal');

    // Reset
    document.getElementById('complaintForm').reset();
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('charCount').textContent = '0 / 20 min';
    clearErrors();

    renderMyComplaints();
    updateStats();
  }

  if (file) {
    const reader = new FileReader();
    reader.onload = e => saveComplaint(e.target.result);
    reader.readAsDataURL(file);
  } else {
    saveComplaint(null);
  }
});

// ── TRACK COMPLAINT ─────────────────────────────
function trackComplaint() {
  const id = document.getElementById('trackInput').value.trim();
  const resultEl = document.getElementById('trackResult');
  if (!id) { showToast('Please enter a Complaint ID', 'error'); return; }

  const list = getComplaints();
  const c = list.find(x => x.id === id);

  if (!c) {
    resultEl.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <h3>Complaint Not Found</h3>
        <p>No complaint found with ID <strong>${id}</strong>. Check the ID and try again.</p>
      </div>`;
    return;
  }

  resultEl.innerHTML = `
    <div class="detail-card">
      <div class="detail-row"><span class="detail-label">ID</span><span class="detail-value" style="font-weight:700;color:var(--primary)">${c.id}</span></div>
      <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">${c.name}</span></div>
      <div class="detail-row"><span class="detail-label">Category</span><span class="detail-value">${c.category}</span></div>
      <div class="detail-row"><span class="detail-label">Description</span><span class="detail-value">${c.description}</span></div>
      <div class="detail-row"><span class="detail-label">Priority</span><span class="detail-value priority-${c.priority.toLowerCase()}">${c.priority}</span></div>
      <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${statusBadge(c.status)}</span></div>
      <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${c.date}</span></div>
      ${c.image ? `<div class="detail-row"><span class="detail-label">Image</span><span class="detail-value"><img src="${c.image}" style="max-width:200px;border-radius:8px;" /></span></div>` : ''}
    </div>`;
}

document.getElementById('trackInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') trackComplaint();
});

// ── MY COMPLAINTS ───────────────────────────────
function renderMyComplaints() {
  const list = getComplaints();
  const container = document.getElementById('myComplaintsList');

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <h3>No Complaints Yet</h3>
        <p>Submit a complaint to see it here.</p>
      </div>`;
    return;
  }

  container.innerHTML = list.map(c => `
    <div class="complaint-card">
      <div class="card-top">
        <span class="card-id">${c.id}</span>
        ${statusBadge(c.status)}
      </div>
      <div class="card-category">${c.category}</div>
      <div class="card-desc">${c.description}</div>
      <div class="card-footer">
        <span style="font-size:12px;color:var(--text-muted)">${c.date}</span>
        <button class="btn btn-outline btn-sm" onclick="viewDetails('${c.id}')">View Details</button>
      </div>
    </div>
  `).join('');
}

// ── STATUS BADGE HELPER ─────────────────────────
function statusBadge(status) {
  const cls = status === 'Pending' ? 'pending' : status === 'In Progress' ? 'in-progress' : 'resolved';
  return `<span class="status-badge ${cls}">${status}</span>`;
}

// ── VIEW DETAILS MODAL ──────────────────────────
function viewDetails(id) {
  const list = getComplaints();
  const c = list.find(x => x.id === id);
  if (!c) return;

  document.getElementById('detailsContent').innerHTML = `
    <div class="detail-card">
      <div class="detail-row"><span class="detail-label">ID</span><span class="detail-value" style="font-weight:700;color:var(--primary)">${c.id}</span></div>
      <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">${c.name}</span></div>
      <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${c.email}</span></div>
      <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${c.phone || '—'}</span></div>
      <div class="detail-row"><span class="detail-label">Category</span><span class="detail-value">${c.category}</span></div>
      <div class="detail-row"><span class="detail-label">Description</span><span class="detail-value">${c.description}</span></div>
      <div class="detail-row"><span class="detail-label">Priority</span><span class="detail-value priority-${c.priority.toLowerCase()}">${c.priority}</span></div>
      <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${statusBadge(c.status)}</span></div>
      <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${c.date}</span></div>
      ${c.image ? `<div class="detail-row"><span class="detail-label">Image</span><span class="detail-value"><img src="${c.image}" style="max-width:100%;border-radius:8px;" /></span></div>` : ''}
    </div>`;
  openModal('detailsModal');
}

// ── ADMIN LOGIN ─────────────────────────────────
function openAdminLogin() {
  document.getElementById('adminUser').value = '';
  document.getElementById('adminPass').value = '';
  document.getElementById('adminErr').textContent = '';
  openModal('adminLoginModal');
}

function adminLogin() {
  const user = document.getElementById('adminUser').value.trim();
  const pass = document.getElementById('adminPass').value;
  if (user === 'admin' && pass === '1234') {
    closeModal('adminLoginModal');
    renderAdminTable();
    openModal('adminPanel');
  } else {
    document.getElementById('adminErr').textContent = 'Incorrect username or password.';
  }
}

document.getElementById('adminPass').addEventListener('keydown', e => {
  if (e.key === 'Enter') adminLogin();
});

// ── ADMIN TABLE ─────────────────────────────────
function renderAdminTable() {
  const search = document.getElementById('adminSearch').value.trim().toLowerCase();
  const filterStatus = document.getElementById('adminFilter').value;
  let list = getComplaints();

  if (search) list = list.filter(c => c.id.toLowerCase().includes(search) || c.name.toLowerCase().includes(search));
  if (filterStatus) list = list.filter(c => c.status === filterStatus);

  const tbody = document.getElementById('adminTableBody');

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">No complaints found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(c => `
    <tr>
      <td style="font-weight:600;color:var(--primary);font-size:12px">${c.id}</td>
      <td>${c.name}</td>
      <td>${c.category}</td>
      <td><span class="priority-${c.priority.toLowerCase()}">${c.priority}</span></td>
      <td>
        <select onchange="updateStatus('${c.id}', this.value)" style="border-color:var(--border)">
          <option ${c.status==='Pending'?'selected':''}>Pending</option>
          <option ${c.status==='In Progress'?'selected':''}>In Progress</option>
          <option ${c.status==='Resolved'?'selected':''}>Resolved</option>
        </select>
      </td>
      <td style="font-size:12px;color:var(--text-muted)">${c.date}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteComplaint('${c.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function updateStatus(id, newStatus) {
  const list = getComplaints();
  const idx = list.findIndex(c => c.id === id);
  if (idx !== -1) {
    list[idx].status = newStatus;
    saveComplaints(list);
    showToast('Status updated to ' + newStatus, 'success');
    renderMyComplaints();
    updateStats();
    renderAdminTable();
  }
}

function deleteComplaint(id) {
  if (!confirm('Delete this complaint? This cannot be undone.')) return;
  const list = getComplaints().filter(c => c.id !== id);
  saveComplaints(list);
  showToast('Complaint deleted.', '');
  renderAdminTable();
  renderMyComplaints();
  updateStats();
}

// ── INIT ────────────────────────────────────────
renderMyComplaints();
updateStats();
highlightNavLink();