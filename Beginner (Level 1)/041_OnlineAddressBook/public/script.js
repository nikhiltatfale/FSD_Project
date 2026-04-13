const API = '/api/contacts';
let allContacts = [];
let editingId = null;

const form = document.getElementById('contact-form');
const nameInput = document.getElementById('name');
const phoneInput = document.getElementById('phone');
const emailInput = document.getElementById('email');
const addressInput = document.getElementById('address');
const notesInput = document.getElementById('notes');
const editIdInput = document.getElementById('edit-id');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const searchInput = document.getElementById('search');
const contactsList = document.getElementById('contacts-list');
const contactCount = document.getElementById('contact-count');
const loadingEl = document.getElementById('loading');
const emptyState = document.getElementById('empty-state');
const toastEl = document.getElementById('toast');
const formTitle = document.getElementById('form-title');

function showToast(msg, type = 'success') {
  toastEl.textContent = msg;
  toastEl.className = 'toast ' + type;
  toastEl.style.display = 'block';
  setTimeout(() => { toastEl.style.display = 'none'; }, 3000);
}

function validateForm(name, phone, email, address) {
  if (!name.trim() || !phone.trim() || !email.trim() || !address.trim()) {
    showToast('Name, phone, email, and address are required.', 'error');
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('Please enter a valid email address.', 'error');
    return false;
  }
  const phoneRegex = /^[0-9+\-\s().]{7,20}$/;
  if (!phoneRegex.test(phone)) {
    showToast('Please enter a valid phone number (7-20 digits).', 'error');
    return false;
  }
  return true;
}

async function loadContacts() {
  loadingEl.style.display = 'block';
  contactsList.innerHTML = '';
  emptyState.style.display = 'none';
  try {
    const res = await fetch(API);
    allContacts = await res.json();
    renderContacts(allContacts);
  } catch (e) {
    showToast('Failed to load contacts.', 'error');
  } finally {
    loadingEl.style.display = 'none';
  }
}

function renderContacts(list) {
  contactsList.innerHTML = '';
  contactCount.textContent = list.length;
  if (list.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';
  list.forEach(c => {
    const card = document.createElement('div');
    card.className = 'contact-card';
    card.innerHTML = `
      <h3>${escapeHtml(c.name)}</h3>
      <p><span>📞</span> ${escapeHtml(c.phone)}</p>
      <p><span>✉️</span> ${escapeHtml(c.email)}</p>
      <p><span>📍</span> ${escapeHtml(c.address)}</p>
      ${c.notes ? `<p><span>📝</span> ${escapeHtml(c.notes)}</p>` : ''}
      <div class="card-actions">
        <button class="edit-btn" onclick="startEdit(${c.id})">Edit</button>
        <button class="delete-btn" onclick="deleteContact(${c.id})">Delete</button>
      </div>
    `;
    contactsList.appendChild(card);
  });
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = nameInput.value;
  const phone = phoneInput.value;
  const email = emailInput.value;
  const address = addressInput.value;
  const notes = notesInput.value;

  if (!validateForm(name, phone, email, address)) return;

  const payload = { name, phone, email, address, notes };

  try {
    let res, data;
    if (editingId) {
      res = await fetch(`${API}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Operation failed.', 'error');
      return;
    }
    showToast(editingId ? 'Contact updated!' : 'Contact added!', 'success');
    resetForm();
    loadContacts();
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
  }
});

function resetForm() {
  form.reset();
  editingId = null;
  editIdInput.value = '';
  formTitle.textContent = 'Add New Contact';
  submitBtn.textContent = 'Add Contact';
  cancelBtn.style.display = 'none';
}

cancelBtn.addEventListener('click', resetForm);

function startEdit(id) {
  const c = allContacts.find(x => x.id === id);
  if (!c) return;
  editingId = id;
  nameInput.value = c.name;
  phoneInput.value = c.phone;
  emailInput.value = c.email;
  addressInput.value = c.address;
  notesInput.value = c.notes || '';
  formTitle.textContent = 'Edit Contact';
  submitBtn.textContent = 'Update Contact';
  cancelBtn.style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteContact(id) {
  if (!confirm('Are you sure you want to delete this contact?')) return;
  try {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Delete failed.', 'error');
      return;
    }
    showToast('Contact deleted.', 'success');
    loadContacts();
  } catch (err) {
    showToast('Network error.', 'error');
  }
}

searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase().trim();
  if (!q) {
    renderContacts(allContacts);
    return;
  }
  const filtered = allContacts.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.email.toLowerCase().includes(q) ||
    c.phone.toLowerCase().includes(q) ||
    c.address.toLowerCase().includes(q)
  );
  renderContacts(filtered);
});

// Initial load
loadContacts();