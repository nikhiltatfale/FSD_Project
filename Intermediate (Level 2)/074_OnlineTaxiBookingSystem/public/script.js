let selectedCar = null;
let currentRideId = null;
let driverSession = null;
let activeDriverRideId = null;
let userHistory = [];

function showPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  const nb = document.getElementById('nav-' + name);
  if (nb) nb.classList.add('active');
  if (name === 'driver' && driverSession) loadDriverRides();
  if (name === 'admin' && document.getElementById('admin-dashboard').classList.contains('hidden') === false) loadAdminData();
}

function selectCar(type, el) {
  selectedCar = type;
  document.querySelectorAll('.car-opt').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  const rates = { Mini: [10, 50], Sedan: [15, 70], SUV: [20, 100] };
  const [r, b] = rates[type];
  document.getElementById('fare-preview').innerHTML = `Estimated: ₹${b} base + ₹${r}/km (distance assigned on booking)`;
  document.getElementById('fare-preview').classList.remove('hidden');
}

async function bookRide() {
  const name = document.getElementById('u-name').value.trim();
  const phone = document.getElementById('u-phone').value.trim();
  const pickup = document.getElementById('u-pickup').value.trim();
  const drop = document.getElementById('u-drop').value.trim();
  const msg = document.getElementById('booking-msg');
  if (!name || !phone || !pickup || !drop || !selectedCar) { showMsg(msg, 'Fill all fields and select car type', 'error'); return; }
  if (!/^\d{10}$/.test(phone)) { showMsg(msg, 'Phone must be 10 digits', 'error'); return; }
  const res = await fetch('/bookRide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userName: name, phone, pickup, drop, carType: selectedCar }) });
  const data = await res.json();
  if (!res.ok) { showMsg(msg, data.error, 'error'); return; }
  currentRideId = data.rideId;
  userHistory.push(data);
  showMsg(msg, 'Ride booked! ID: ' + data.rideId, 'success');
  showActiveRide(data);
  updateHistory();
  pollRideStatus();
}

function showActiveRide(ride) {
  document.getElementById('active-ride-card').classList.remove('hidden');
  renderRideStatus(ride);
}

function renderRideStatus(ride) {
  const icons = { Pending: '🔍', Accepted: '🚗', Started: '🚀', Completed: '✅', Cancelled: '❌' };
  const msgs = { Pending: 'Searching for driver...', Accepted: 'Driver on the way!', Started: 'Ride in progress', Completed: 'Ride completed!', Cancelled: 'Ride cancelled' };
  document.getElementById('ride-status-display').innerHTML = `
    <div class="status-card">
      <div class="status-icon">${icons[ride.status]}</div>
      <h3>${ride.status}</h3>
      <p>${msgs[ride.status]}</p>
      ${ride.driverName ? `<p style="margin-top:.5rem">Driver: <strong>${ride.driverName}</strong></p>` : ''}
      <div class="fare-big">₹${ride.fare}</div>
      <p style="color:var(--muted)">${ride.distance} km · ${ride.carType}</p>
      <p style="color:var(--muted);margin-top:.3rem">${ride.pickup} → ${ride.drop}</p>
    </div>`;
  const cb = document.getElementById('cancel-btn');
  if (['Completed', 'Cancelled', 'Accepted', 'Started'].includes(ride.status)) cb.classList.add('hidden');
  else cb.classList.remove('hidden');
}

async function cancelRide() {
  const res = await fetch('/cancelRide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rideId: currentRideId }) });
  const data = await res.json();
  if (!res.ok) { alert(data.error); return; }
  renderRideStatus(data);
  updateHistoryRide(data);
}

function pollRideStatus() {
  const interval = setInterval(async () => {
    if (!currentRideId) { clearInterval(interval); return; }
    const res = await fetch('/rides');
    const rides = await res.json();
    const ride = rides.find(r => r.rideId === currentRideId);
    if (!ride) { clearInterval(interval); return; }
    renderRideStatus(ride);
    updateHistoryRide(ride);
    if (['Completed', 'Cancelled'].includes(ride.status)) clearInterval(interval);
  }, 3000);
}

function updateHistory() {
  const sec = document.getElementById('history-section');
  const div = document.getElementById('ride-history');
  if (!userHistory.length) { sec.classList.add('hidden'); return; }
  sec.classList.remove('hidden');
  div.innerHTML = userHistory.map(r => `<div class="ride-row"><div class="ride-info"><strong>${r.pickup} → ${r.drop}</strong><span>${r.carType} · ₹${r.fare} · ${r.distance}km</span></div><span class="status-badge badge-${r.status}">${r.status}</span></div>`).join('');
}

function updateHistoryRide(ride) {
  const idx = userHistory.findIndex(r => r.rideId === ride.rideId);
  if (idx !== -1) { userHistory[idx] = ride; updateHistory(); }
}

function showMsg(el, text, type) { el.textContent = text; el.className = 'msg ' + type; }

function driverLogin() {
  const name = document.getElementById('d-name').value.trim();
  const phone = document.getElementById('d-phone').value.trim();
  if (!name || !phone) { alert('Enter name and phone'); return; }
  driverSession = { name, phone };
  document.getElementById('d-logged-name').textContent = name;
  document.querySelector('.card').classList.add('hidden');
  document.getElementById('driver-dashboard').classList.remove('hidden');
  loadDriverRides();
}

async function loadDriverRides() {
  const res = await fetch('/rides');
  const rides = await res.json();
  const myRide = rides.find(r => r.driverName === driverSession.name && ['Accepted', 'Started'].includes(r.status));
  const pending = rides.filter(r => r.status === 'Pending');
  document.getElementById('available-rides').innerHTML = pending.length
    ? pending.map(r => `<div class="ride-row"><div class="ride-info"><strong>${r.pickup} → ${r.drop}</strong><span>${r.carType} · ₹${r.fare} · ${r.distance}km · ${r.userName}</span></div><button onclick="acceptRide(${r.rideId})" class="btn-primary" style="width:auto;padding:.4rem 1rem">Accept</button></div>`).join('')
    : '<p style="color:var(--muted)">No pending rides</p>';
  const completed = rides.filter(r => r.driverName === driverSession.name && r.status === 'Completed');
  const earnings = completed.reduce((s, r) => s + r.fare, 0);
  document.getElementById('d-earnings').textContent = '₹' + earnings;
  document.getElementById('d-rides-done').textContent = completed.length;
  if (myRide) {
    activeDriverRideId = myRide.rideId;
    document.getElementById('active-driver-ride').classList.remove('hidden');
    document.getElementById('active-ride-info').innerHTML = `<div class="status-card"><div class="status-icon">${myRide.status === 'Accepted' ? '🚗' : '🚀'}</div><h3>${myRide.status}</h3><p>${myRide.pickup} → ${myRide.drop}</p><div class="fare-big">₹${myRide.fare}</div><p style="color:var(--muted)">${myRide.userName} · ${myRide.carType}</p></div>`;
    if (myRide.status === 'Accepted') { document.getElementById('start-btn').classList.remove('hidden'); document.getElementById('complete-btn').classList.add('hidden'); }
    else { document.getElementById('start-btn').classList.add('hidden'); document.getElementById('complete-btn').classList.remove('hidden'); }
  } else {
    document.getElementById('active-driver-ride').classList.add('hidden');
    activeDriverRideId = null;
  }
}

async function acceptRide(rideId) {
  const res = await fetch('/acceptRide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rideId, driverName: driverSession.name }) });
  const data = await res.json();
  if (!res.ok) { alert(data.error); return; }
  loadDriverRides();
}

async function startRide() {
  const res = await fetch('/startRide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rideId: activeDriverRideId, driverName: driverSession.name }) });
  const data = await res.json();
  if (!res.ok) { alert(data.error); return; }
  loadDriverRides();
}

async function completeRide() {
  const res = await fetch('/completeRide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rideId: activeDriverRideId, driverName: driverSession.name }) });
  const data = await res.json();
  if (!res.ok) { alert(data.error); return; }
  loadDriverRides();
}

function adminLogin() {
  const u = document.getElementById('a-user').value;
  const p = document.getElementById('a-pass').value;
  const msg = document.getElementById('admin-login-msg');
  if (u === 'admin' && p === 'admin123') {
    document.getElementById('admin-login-card').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    loadAdminData();
  } else showMsg(msg, 'Invalid credentials', 'error');
}

async function loadAdminData() {
  const res = await fetch('/adminData');
  const data = await res.json();
  document.getElementById('admin-stats').innerHTML = `
    <div class="stat"><div>${data.rides.length}</div><small>Total Rides</small></div>
    <div class="stat"><div>${data.users.length}</div><small>Users</small></div>
    <div class="stat"><div>${data.drivers.length}</div><small>Drivers</small></div>
    <div class="stat"><div>₹${data.totalEarnings}</div><small>Earnings</small></div>`;
  document.getElementById('admin-rides').innerHTML = data.rides.length
    ? data.rides.map(r => `<div class="ride-row"><div class="ride-info"><strong>${r.userName} · ${r.pickup} → ${r.drop}</strong><span>${r.carType} · ₹${r.fare} · ${r.driverName || 'No driver'}</span></div><div style="display:flex;align-items:center;gap:.5rem"><span class="status-badge badge-${r.status}">${r.status}</span><button onclick="deleteRide(${r.rideId})" class="del-btn">Del</button></div></div>`).join('')
    : '<p style="color:var(--muted)">No rides</p>';
  document.getElementById('admin-users').innerHTML = data.users.length
    ? data.users.map(u => `<div class="ride-row"><div class="ride-info"><strong>${u.name}</strong><span>${u.phone}</span></div></div>`).join('')
    : '<p style="color:var(--muted)">No users</p>';
  document.getElementById('admin-drivers').innerHTML = data.drivers.length
    ? data.drivers.map(d => `<div class="ride-row"><div class="ride-info"><strong>${d.name}</strong><span>${d.rides} rides · ₹${d.earnings} earned</span></div></div>`).join('')
    : '<p style="color:var(--muted)">No drivers</p>';
}

async function deleteRide(rideId) {
  await fetch('/deleteRide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rideId }) });
  loadAdminData();
}

async function resetSystem() {
  if (!confirm('Reset ALL data?')) return;
  await fetch('/reset', { method: 'POST' });
  loadAdminData();
}