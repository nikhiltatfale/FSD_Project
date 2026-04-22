const DB = {
  get users() { return JSON.parse(localStorage.getItem('sp_users') || '[]') },
  set users(v) { localStorage.setItem('sp_users', JSON.stringify(v)) },
  get slots() { return JSON.parse(localStorage.getItem('sp_slots') || '[]') },
  set slots(v) { localStorage.setItem('sp_slots', JSON.stringify(v)) },
  get bookings() { return JSON.parse(localStorage.getItem('sp_bookings') || '[]') },
  set bookings(v) { localStorage.setItem('sp_bookings', JSON.stringify(v)) },
  get pricing() { return JSON.parse(localStorage.getItem('sp_pricing') || '{"perHour":50}') },
  set pricing(v) { localStorage.setItem('sp_pricing', JSON.stringify(v)) },
  get session() { return JSON.parse(localStorage.getItem('sp_session') || 'null') },
  set session(v) { localStorage.setItem('sp_session', JSON.stringify(v)) }
};

const ADMIN = { username: 'admin', password: 'admin123' };

function init() {
  if (!DB.slots.length) {
    DB.slots = Array.from({ length: 12 }, (_, i) => ({ id: 'S' + String(i + 1).padStart(2, '0'), status: 'available' }));
  }
  autoCancelExpired();
  const s = DB.session;
  if (s) { s.role === 'admin' ? showAdminDashboard() : showUserDashboard(); }
}

function autoCancelExpired() {
  const now = Date.now();
  const bookings = DB.bookings.map(b => {
    if (b.status === 'booked' && now - new Date(b.bookedAt).getTime() > 30 * 60 * 1000) {
      releaseSlot(b.slotId);
      return { ...b, status: 'cancelled' };
    }
    return b;
  });
  DB.bookings = bookings;
}

function releaseSlot(slotId) {
  DB.slots = DB.slots.map(s => s.id === slotId ? { ...s, status: 'available' } : s);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showAdminLogin() { showScreen('screen-admin-login'); }

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('tab-login').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('tab-register').style.display = tab === 'register' ? 'block' : 'none';
}

function setMsg(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'msg ' + type;
}

function userRegister() {
  const u = document.getElementById('reg-user').value.trim();
  const p = document.getElementById('reg-pass').value.trim();
  const v = document.getElementById('reg-vehicle').value.trim();
  if (!u || !p || !v) return setMsg('auth-msg', 'All fields required', 'error');
  const users = DB.users;
  if (users.find(x => x.username === u)) return setMsg('auth-msg', 'Username already exists', 'error');
  DB.users = [...users, { username: u, password: p, vehicleNo: v }];
  setMsg('auth-msg', 'Registered! Please login.', 'success');
}

function userLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value.trim();
  const user = DB.users.find(x => x.username === u && x.password === p);
  if (!user) return setMsg('auth-msg', 'Invalid credentials', 'error');
  DB.session = { role: 'user', username: u };
  showUserDashboard();
}

function adminLogin() {
  const u = document.getElementById('adm-user').value.trim();
  const p = document.getElementById('adm-pass').value.trim();
  if (u !== ADMIN.username || p !== ADMIN.password) return setMsg('adm-msg', 'Invalid admin credentials', 'error');
  DB.session = { role: 'admin', username: 'admin' };
  showAdminDashboard();
}

function logout() {
  DB.session = null;
  showScreen('screen-auth');
}

function showUserDashboard() {
  showScreen('screen-user');
  userNav('slots');
}

function userNav(section) {
  ['slots', 'history', 'booking', 'checkin'].forEach(s => {
    document.getElementById('user-' + s).style.display = s === section ? 'block' : 'none';
  });
  document.querySelectorAll('#screen-user .nav-btn').forEach(b => b.classList.remove('active'));
  if (section === 'slots') { document.querySelector('#screen-user .nav-btn').classList.add('active'); renderSlots(); }
  if (section === 'history') { document.querySelectorAll('#screen-user .nav-btn')[1].classList.add('active'); renderHistory(); }
}

function renderSlots() {
  autoCancelExpired();
  const slots = DB.slots;
  const session = DB.session;
  const bookings = DB.bookings;
  const activeBooking = bookings.find(b => b.username === session.username && (b.status === 'booked' || b.status === 'occupied'));
  const grid = document.getElementById('slot-grid');
  grid.innerHTML = slots.map(slot => {
    let label = '', click = '';
    if (slot.status === 'available') {
      label = '<div class="slot-status">AVAILABLE</div>';
      click = activeBooking ? '' : `onclick="openBooking('${slot.id}')"`;
    } else if (slot.status === 'booked') {
      const b = bookings.find(bk => bk.slotId === slot.id && bk.status === 'booked');
      const isOwn = b && b.username === session.username;
      label = `<div class="slot-status">BOOKED${isOwn ? ' (YOURS)' : ''}</div>`;
      click = isOwn ? `onclick="openCheckin('${slot.id}')"` : '';
    } else {
      const b = bookings.find(bk => bk.slotId === slot.id && bk.status === 'occupied');
      const isOwn = b && b.username === session.username;
      label = `<div class="slot-status">OCCUPIED${isOwn ? ' (YOURS)' : ''}</div>`;
      click = isOwn ? `onclick="openCheckin('${slot.id}')"` : '';
    }
    return `<div class="slot ${slot.status}" ${click}>${slot.id}${label}</div>`;
  }).join('');
}

function openBooking(slotId) {
  const session = DB.session;
  const active = DB.bookings.find(b => b.username === session.username && (b.status === 'booked' || b.status === 'occupied'));
  if (active) return alert('You already have an active booking.');
  const user = DB.users.find(u => u.username === session.username);
  document.getElementById('book-vehicle').value = user ? user.vehicleNo : '';
  document.getElementById('booking-slot-label').textContent = '— ' + slotId;
  document.getElementById('book-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('book-time').value = new Date().toTimeString().slice(0, 5);
  document.getElementById('book-msg').textContent = '';
  document.getElementById('user-booking').dataset.slotId = slotId;
  userNav('booking');
}

function confirmBooking() {
  const slotId = document.getElementById('user-booking').dataset.slotId;
  const vehicle = document.getElementById('book-vehicle').value.trim();
  const date = document.getElementById('book-date').value;
  const time = document.getElementById('book-time').value;
  if (!vehicle || !date || !time) return setMsg('book-msg', 'All fields required', 'error');
  const session = DB.session;
  const bookingId = 'BK' + Date.now();
  const bookings = DB.bookings;
  bookings.push({ bookingId, username: session.username, slotId, vehicleNo: vehicle, startTime: date + 'T' + time, endTime: null, status: 'booked', amount: 0, bookedAt: new Date().toISOString() });
  DB.bookings = bookings;
  DB.slots = DB.slots.map(s => s.id === slotId ? { ...s, status: 'booked' } : s);
  document.getElementById('book-msg').innerHTML = '';
  userNav('slots');
  setTimeout(() => {
    document.getElementById('user-slots').insertAdjacentHTML('afterbegin', `<div class="confirm-box"><p>BOOKING CONFIRMED</p><div class="booking-id">${bookingId}</div><p>Slot: ${slotId} | Vehicle: ${vehicle}</p><p>Check in within 30 minutes.</p></div>`);
  }, 100);
}

function openCheckin(slotId) {
  const session = DB.session;
  const booking = DB.bookings.find(b => b.slotId === slotId && b.username === session.username && (b.status === 'booked' || b.status === 'occupied'));
  if (!booking) return;
  const info = document.getElementById('checkin-info');
  info.innerHTML = `<div class="confirm-box"><p>Booking ID: <strong>${booking.bookingId}</strong></p><p>Slot: ${booking.slotId} | Vehicle: ${booking.vehicleNo}</p><p>Status: <strong>${booking.status.toUpperCase()}</strong></p></div>`;
  document.getElementById('checkin-btn').style.display = booking.status === 'booked' ? 'block' : 'none';
  document.getElementById('checkout-btn').style.display = booking.status === 'occupied' ? 'block' : 'none';
  document.getElementById('checkin-msg').textContent = '';
  document.getElementById('user-checkin').dataset.bookingId = booking.bookingId;
  ['slots', 'history', 'booking'].forEach(s => document.getElementById('user-' + s).style.display = 'none');
  document.getElementById('user-checkin').style.display = 'block';
}

function doCheckin() {
  const bId = document.getElementById('user-checkin').dataset.bookingId;
  const bookings = DB.bookings.map(b => b.bookingId === bId ? { ...b, status: 'occupied', checkinTime: new Date().toISOString() } : b);
  DB.bookings = bookings;
  const booking = bookings.find(b => b.bookingId === bId);
  DB.slots = DB.slots.map(s => s.id === booking.slotId ? { ...s, status: 'occupied' } : s);
  setMsg('checkin-msg', 'Checked in successfully!', 'success');
  document.getElementById('checkin-btn').style.display = 'none';
  document.getElementById('checkout-btn').style.display = 'block';
}

function doCheckout() {
  const bId = document.getElementById('user-checkin').dataset.bookingId;
  const bookings = DB.bookings;
  const booking = bookings.find(b => b.bookingId === bId);
  const hours = Math.max(1, Math.ceil((Date.now() - new Date(booking.checkinTime).getTime()) / 3600000));
  const amount = hours * DB.pricing.perHour;
  DB.bookings = bookings.map(b => b.bookingId === bId ? { ...b, status: 'completed', checkoutTime: new Date().toISOString(), amount } : b);
  releaseSlot(booking.slotId);
  setMsg('checkin-msg', `Checked out! Bill: ₹${amount} for ${hours} hour(s).`, 'success');
  document.getElementById('checkout-btn').style.display = 'none';
  document.getElementById('checkin-info').innerHTML = `<div class="confirm-box"><p>CHECKOUT COMPLETE</p><p>Hours: ${hours} | Amount: ₹${amount}</p></div>`;
}

function renderHistory() {
  const session = DB.session;
  const bookings = DB.bookings.filter(b => b.username === session.username).reverse();
  const list = document.getElementById('history-list');
  if (!bookings.length) { list.innerHTML = '<p style="color:var(--muted);font-size:.8rem">No bookings yet.</p>'; return; }
  list.innerHTML = `<table class="table"><thead><tr><th>BOOKING ID</th><th>SLOT</th><th>VEHICLE</th><th>STATUS</th><th>AMOUNT</th></tr></thead><tbody>${bookings.map(b => `<tr><td>${b.bookingId}</td><td>${b.slotId}</td><td>${b.vehicleNo}</td><td><span class="badge ${b.status}">${b.status.toUpperCase()}</span></td><td>₹${b.amount || 0}</td></tr>`).join('')}</tbody></table>`;
}

function showAdminDashboard() {
  showScreen('screen-admin');
  adminNav('dashboard');
}

function adminNav(section) {
  ['dashboard', 'slots', 'bookings', 'users', 'reports'].forEach(s => {
    document.getElementById('admin-' + s).style.display = s === section ? 'block' : 'none';
  });
  document.querySelectorAll('#screen-admin .nav-btn').forEach((b, i) => {
    b.classList.remove('active');
    const sections = ['dashboard', 'slots', 'bookings', 'users', 'reports'];
    if (sections[i] === section) b.classList.add('active');
  });
  if (section === 'dashboard') renderAdminDashboard();
  if (section === 'slots') renderAdminSlots();
  if (section === 'bookings') renderAllBookings();
  if (section === 'users') renderAllUsers();
  if (section === 'reports') renderReports();
}

function renderAdminDashboard() {
  autoCancelExpired();
  const slots = DB.slots;
  document.getElementById('stat-total').textContent = slots.length;
  document.getElementById('stat-avail').textContent = slots.filter(s => s.status === 'available').length;
  document.getElementById('stat-booked').textContent = slots.filter(s => s.status === 'booked').length;
  document.getElementById('stat-occ').textContent = slots.filter(s => s.status === 'occupied').length;
  document.getElementById('price-input').value = DB.pricing.perHour;
}

function updatePricing() {
  const val = parseFloat(document.getElementById('price-input').value);
  if (!val || val <= 0) return setMsg('price-msg', 'Invalid price', 'error');
  DB.pricing = { perHour: val };
  setMsg('price-msg', 'Pricing updated to ₹' + val + '/hr', 'success');
}

function addSlot() {
  const slots = DB.slots;
  const num = slots.length + 1;
  DB.slots = [...slots, { id: 'S' + String(num).padStart(2, '0'), status: 'available' }];
  renderAdminSlots();
  renderAdminDashboard();
}

function removeSlot(slotId) {
  const slot = DB.slots.find(s => s.id === slotId);
  if (slot.status !== 'available') return alert('Can only remove available slots.');
  DB.slots = DB.slots.filter(s => s.id !== slotId);
  renderAdminSlots();
  renderAdminDashboard();
}

function forceRelease(slotId) {
  DB.bookings = DB.bookings.map(b => (b.slotId === slotId && (b.status === 'booked' || b.status === 'occupied')) ? { ...b, status: 'cancelled' } : b);
  releaseSlot(slotId);
  renderAdminSlots();
  renderAdminDashboard();
}

function renderAdminSlots() {
  const grid = document.getElementById('admin-slot-grid');
  grid.innerHTML = DB.slots.map(s => `<div class="admin-slot ${s.status}">${s.id}<div class="slot-status">${s.status.toUpperCase()}</div>${s.status === 'available' ? `<span class="admin-slot-remove" onclick="removeSlot('${s.id}')">✕ REMOVE</span>` : `<span class="admin-slot-force" onclick="forceRelease('${s.id}')">⚡ FORCE RELEASE</span>`}</div>`).join('');
}

function renderAllBookings() {
  const bookings = [...DB.bookings].reverse();
  const el = document.getElementById('all-bookings-list');
  if (!bookings.length) { el.innerHTML = '<p style="color:var(--muted);font-size:.8rem">No bookings yet.</p>'; return; }
  el.innerHTML = `<table class="table"><thead><tr><th>ID</th><th>USER</th><th>SLOT</th><th>VEHICLE</th><th>STATUS</th><th>AMOUNT</th></tr></thead><tbody>${bookings.map(b => `<tr><td>${b.bookingId}</td><td>${b.username}</td><td>${b.slotId}</td><td>${b.vehicleNo}</td><td><span class="badge ${b.status}">${b.status.toUpperCase()}</span></td><td>₹${b.amount || 0}</td></tr>`).join('')}</tbody></table>`;
}

function renderAllUsers() {
  const users = DB.users;
  const el = document.getElementById('all-users-list');
  if (!users.length) { el.innerHTML = '<p style="color:var(--muted);font-size:.8rem">No users registered.</p>'; return; }
  el.innerHTML = `<table class="table"><thead><tr><th>USERNAME</th><th>VEHICLE</th><th>TOTAL BOOKINGS</th></tr></thead><tbody>${users.map(u => `<tr><td>${u.username}</td><td>${u.vehicleNo}</td><td>${DB.bookings.filter(b => b.username === u.username).length}</td></tr>`).join('')}</tbody></table>`;
}

function renderReports() {
  const bookings = DB.bookings.filter(b => b.status === 'completed');
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const today = new Date().toDateString();
  const todayRev = bookings.filter(b => new Date(b.checkoutTime).toDateString() === today).reduce((sum, b) => sum + (b.amount || 0), 0);
  const slotUsage = {};
  DB.bookings.forEach(b => { slotUsage[b.slotId] = (slotUsage[b.slotId] || 0) + 1; });
  const el = document.getElementById('reports-content');
  el.innerHTML = `<div class="report-card"><h3>REVENUE</h3><div class="report-row"><span>Today's Revenue</span><span>₹${todayRev}</span></div><div class="report-row"><span>Total Revenue</span><span>₹${totalRevenue}</span></div><div class="report-row"><span>Total Completed Bookings</span><span>${bookings.length}</span></div></div><div class="report-card"><h3>SLOT USAGE</h3>${Object.entries(slotUsage).sort((a, b) => b[1] - a[1]).map(([id, count]) => `<div class="report-row"><span>${id}</span><span>${count} bookings</span></div>`).join('') || '<p style="color:var(--muted);font-size:.8rem">No data yet.</p>'}</div>`;
}

function resetSystem() {
  if (!confirm('Reset ALL data? This cannot be undone.')) return;
  localStorage.removeItem('sp_slots');
  localStorage.removeItem('sp_bookings');
  localStorage.removeItem('sp_users');
  localStorage.removeItem('sp_pricing');
  DB.slots = Array.from({ length: 12 }, (_, i) => ({ id: 'S' + String(i + 1).padStart(2, '0'), status: 'available' }));
  adminNav('dashboard');
}

init();