let TOKEN = localStorage.getItem('ngo_token') || '';

function show(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'events') loadEvents();
  if (id === 'admin') {
    if (!TOKEN) { show('login'); return; }
    loadAdmin();
  }
}

function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast-show toast-${type}`;
  setTimeout(() => t.className = '', 3000);
}

function setAmt(n) { document.getElementById('d-amount').value = n; }

async function submitDonate(e) {
  e.preventDefault();
  const body = { name: document.getElementById('d-name').value, email: document.getElementById('d-email').value, phone: document.getElementById('d-phone').value, amount: document.getElementById('d-amount').value, campaign: document.getElementById('d-campaign').value };
  const r = await fetch('/donate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (r.ok) { toast('Donation received! Thank you 🙏'); e.target.reset(); } else toast('Error submitting donation', 'error');
}

async function submitVolunteer(e) {
  e.preventDefault();
  const body = { name: document.getElementById('v-name').value, email: document.getElementById('v-email').value, phone: document.getElementById('v-phone').value, skills: document.getElementById('v-skills').value, availability: document.getElementById('v-avail').value };
  const r = await fetch('/volunteer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (r.ok) { toast('Registration submitted! We\'ll contact you soon.'); e.target.reset(); } else toast('Error submitting registration', 'error');
}

async function submitLogin(e) {
  e.preventDefault();
  const body = { username: document.getElementById('a-user').value, password: document.getElementById('a-pass').value };
  const r = await fetch('/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (r.ok) {
    const d = await r.json();
    TOKEN = d.token;
    localStorage.setItem('ngo_token', TOKEN);
    show('admin');
    e.target.reset();
  } else toast('Invalid credentials', 'error');
}

function logout() {
  TOKEN = '';
  localStorage.removeItem('ngo_token');
  show('home');
  toast('Logged out successfully');
}

async function loadEvents() {
  const r = await fetch('/events');
  const events = await r.json();
  const g = document.getElementById('events-grid');
  if (!events.length) { g.innerHTML = '<p style="color:var(--muted);padding:2rem">No events currently scheduled.</p>'; return; }
  g.innerHTML = events.map(ev => `<div class="event-card"><div class="ev-campaign">${ev.campaign || 'General'}</div><h3>${ev.title}</h3><p class="ev-desc">${ev.description || ''}</p><div class="ev-meta"><span><strong>📅</strong> ${ev.date}</span><span><strong>📍</strong> ${ev.location || 'TBD'}</span></div></div>`).join('');
}

async function loadAdmin() {
  const h = { 'x-token': TOKEN };
  const [statsR, donR, volR] = await Promise.all([fetch('/admin/stats', { headers: h }), fetch('/admin/donations', { headers: h }), fetch('/admin/volunteers', { headers: h })]);
  if (!statsR.ok) { TOKEN = ''; localStorage.removeItem('ngo_token'); show('login'); return; }
  const stats = await statsR.json();
  const donations = await donR.json();
  const volunteers = await volR.json();
  document.getElementById('admin-stats').innerHTML = `<div class="stat-card"><div class="sc-label">Total Donations</div><div class="sc-value">${stats.totalDonations}</div></div><div class="stat-card"><div class="sc-label">Funds Collected</div><div class="sc-value">₹${stats.totalFunds.toLocaleString()}</div></div><div class="stat-card"><div class="sc-label">Volunteers</div><div class="sc-value">${stats.totalVolunteers}</div></div><div class="stat-card"><div class="sc-label">Events</div><div class="sc-value">${stats.totalEvents}</div></div>`;
  const donTable = donations.length ? `<table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Amount</th><th>Campaign</th><th>Date</th><th>Action</th></tr></thead><tbody>${donations.map(d => `<tr><td>${d.name}</td><td>${d.email}</td><td>₹${d.amount}</td><td>${d.campaign}</td><td>${d.date}</td><td><button class="tbl-btn danger" onclick="delDonation(${d.id})">Delete</button></td></tr>`).join('')}</tbody></table>` : '<p style="color:var(--muted);padding:1rem">No donations yet.</p>';
  document.getElementById('donations-tab').innerHTML = donTable;
  const volTable = volunteers.length ? `<table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Skills</th><th>Availability</th><th>Status</th><th>Actions</th></tr></thead><tbody>${volunteers.map(v => `<tr><td>${v.name}</td><td>${v.email}</td><td>${v.skills}</td><td>${v.availability}</td><td><span class="badge ${v.status.toLowerCase()}">${v.status}</span></td><td>${v.status === 'Pending' ? `<button class="tbl-btn" onclick="approveVol(${v.id},'Approved')">Approve</button><button class="tbl-btn danger" onclick="approveVol(${v.id},'Rejected')">Reject</button>` : ''}<button class="tbl-btn danger" onclick="delVol(${v.id})">Delete</button></td></tr>`).join('')}</tbody></table>` : '<p style="color:var(--muted);padding:1rem">No volunteers yet.</p>';
  document.getElementById('volunteers-tab').innerHTML = volTable;
  loadEventsAdmin();
}

async function loadEventsAdmin() {
  const r = await fetch('/events');
  const events = await r.json();
  const t = events.length ? `<table class="data-table"><thead><tr><th>Title</th><th>Date</th><th>Location</th><th>Campaign</th><th>Action</th></tr></thead><tbody>${events.map(ev => `<tr><td>${ev.title}</td><td>${ev.date}</td><td>${ev.location || '-'}</td><td>${ev.campaign || '-'}</td><td><button class="tbl-btn danger" onclick="delEvent(${ev.id})">Delete</button></td></tr>`).join('')}</tbody></table>` : '<p style="color:var(--muted);padding:1rem">No events yet.</p>';
  document.getElementById('events-table').innerHTML = t;
}

async function addEvent() {
  const body = { title: document.getElementById('e-title').value, date: document.getElementById('e-date').value, location: document.getElementById('e-loc').value, campaign: document.getElementById('e-camp').value, description: document.getElementById('e-desc').value };
  if (!body.title || !body.date) { toast('Title and date required', 'error'); return; }
  const r = await fetch('/admin/event', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-token': TOKEN }, body: JSON.stringify(body) });
  if (r.ok) { toast('Event added!'); ['e-title','e-date','e-loc','e-camp','e-desc'].forEach(id => document.getElementById(id).value = ''); loadEventsAdmin(); loadAdmin(); } else toast('Error adding event', 'error');
}

async function delEvent(id) {
  if (!confirm('Delete this event?')) return;
  await fetch(`/admin/event/${id}`, { method: 'DELETE', headers: { 'x-token': TOKEN } });
  toast('Event deleted'); loadAdmin();
}

async function delDonation(id) {
  if (!confirm('Delete this donation record?')) return;
  await fetch(`/admin/donation/${id}`, { method: 'DELETE', headers: { 'x-token': TOKEN } });
  toast('Donation record deleted'); loadAdmin();
}

async function approveVol(id, status) {
  await fetch(`/admin/volunteer/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-token': TOKEN }, body: JSON.stringify({ status }) });
  toast(`Volunteer ${status.toLowerCase()}!`); loadAdmin();
}

async function delVol(id) {
  if (!confirm('Delete this volunteer?')) return;
  await fetch(`/admin/volunteer/${id}`, { method: 'DELETE', headers: { 'x-token': TOKEN } });
  toast('Volunteer deleted'); loadAdmin();
}

function adminTab(name) {
  document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', ['donations','volunteers','events-admin'][i] === name));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById(`${name}-tab`).classList.add('active');
}

if (TOKEN) show('home');