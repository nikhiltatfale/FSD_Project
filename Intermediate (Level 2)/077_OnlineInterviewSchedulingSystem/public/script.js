function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  if (name === 'candidate') loadSlots();
  if (name === 'dashboard') { loadAdminSlots(); loadBookings(); }
}

function msg(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'msg ' + type;
}

async function loadSlots() {
  const res = await fetch('/slots');
  const slots = await res.json();
  const sel = document.getElementById('b-slot');
  sel.innerHTML = '<option value="">-- Choose a slot --</option>';
  const free = slots.filter(s => !s.isBooked);
  if (!free.length) { sel.innerHTML = '<option value="">No slots available</option>'; return; }
  free.forEach(s => {
    const o = document.createElement('option');
    o.value = s.id;
    o.textContent = s.date + ' at ' + s.time;
    sel.appendChild(o);
  });
}

async function bookSlot() {
  const name = document.getElementById('b-name').value.trim();
  const email = document.getElementById('b-email').value.trim();
  const phone = document.getElementById('b-phone').value.trim();
  const position = document.getElementById('b-position').value.trim();
  const slotId = document.getElementById('b-slot').value;
  if (!name || !email || !phone || !position || !slotId) return msg('book-msg', 'Please fill all fields.', 'err');
  const res = await fetch('/book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, phone, position, slotId }) });
  const data = await res.json();
  if (!res.ok) return msg('book-msg', data.error, 'err');
  msg('book-msg', '✓ Booking confirmed! We will contact you shortly.', 'ok');
  document.getElementById('booking-form').reset();
  loadSlots();
}

async function adminLogin() {
  const username = document.getElementById('a-user').value;
  const password = document.getElementById('a-pass').value;
  const res = await fetch('/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
  const data = await res.json();
  if (!res.ok) return msg('login-msg', data.error, 'err');
  showPage('dashboard');
}

async function adminLogout() {
  await fetch('/admin/logout', { method: 'POST' });
  showPage('candidate');
}

async function addSlot() {
  const date = document.getElementById('s-date').value;
  const time = document.getElementById('s-time').value;
  if (!date || !time) return msg('add-msg', 'Date and time required.', 'err');
  const res = await fetch('/admin/add-slot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, time }) });
  const data = await res.json();
  if (!res.ok) return msg('add-msg', data.error, 'err');
  msg('add-msg', '✓ Slot added.', 'ok');
  document.getElementById('s-date').value = '';
  document.getElementById('s-time').value = '';
  loadAdminSlots();
}

async function loadAdminSlots() {
  const res = await fetch('/slots');
  const slots = await res.json();
  const el = document.getElementById('slots-list');
  if (!slots.length) { el.innerHTML = '<div class="empty">No slots created yet.</div>'; return; }
  el.innerHTML = slots.map(s => `
    <div class="slot-item">
      <span>${s.date} &nbsp; ${s.time}</span>
      <span class="tag ${s.isBooked ? 'booked' : 'free'}">${s.isBooked ? 'Booked' : 'Free'}</span>
      ${!s.isBooked ? `<button class="del-btn" onclick="deleteSlot('${s.id}')">Delete</button>` : '<span style="font-size:.75rem;color:var(--muted)">Cannot delete</span>'}
    </div>`).join('');
}

async function deleteSlot(id) {
  const res = await fetch('/admin/delete-slot', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
  const data = await res.json();
  if (!res.ok) return alert(data.error);
  loadAdminSlots();
}

async function loadBookings() {
  const date = document.getElementById('filter-date').value;
  const url = '/admin/bookings' + (date ? '?date=' + date : '');
  const res = await fetch(url);
  const bookings = await res.json();
  const el = document.getElementById('bookings-list');
  if (!bookings.length) { el.innerHTML = '<div class="empty">No bookings found.</div>'; return; }
  el.innerHTML = bookings.map(b => `
    <div class="booking-item">
      <div>
        <div style="font-weight:500">${b.name}</div>
        <div style="color:var(--muted);font-size:.78rem">${b.email} · ${b.phone} · ${b.position}</div>
        <div style="color:var(--muted);font-size:.78rem">${b.date} at ${b.time}</div>
      </div>
      <button class="del-btn" onclick="cancelBooking('${b.id}')">Cancel</button>
    </div>`).join('');
}

async function cancelBooking(id) {
  const res = await fetch('/admin/cancel-booking', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
  const data = await res.json();
  if (!res.ok) return alert(data.error);
  loadBookings(); loadAdminSlots();
}

loadSlots();