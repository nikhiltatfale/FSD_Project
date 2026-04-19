let TOKEN = localStorage.getItem('token');
let ROLE = localStorage.getItem('role');
let editCustId = null, editLeadId = null;

function api(method, url, body) {
  return fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN },
    body: body ? JSON.stringify(body) : undefined
  }).then(r => r.json());
}

function showSection(name) {
  ['dashboard','customers','leads','followups','admin'].forEach(s => {
    document.getElementById(s+'Section').style.display = s === name ? '' : 'none';
  });
  if (name === 'dashboard') loadDashboard();
  if (name === 'customers') loadCustomers();
  if (name === 'leads') loadLeads();
  if (name === 'followups') loadFollowups();
  if (name === 'admin') loadAdmin();
}

function logout() {
  localStorage.clear();
  location.reload();
}

async function doLogin() {
  const username = document.getElementById('loginUser').value;
  const password = document.getElementById('loginPass').value;
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  }).then(r => r.json());
  if (res.token) {
    TOKEN = res.token; ROLE = res.role;
    localStorage.setItem('token', TOKEN);
    localStorage.setItem('role', ROLE);
    initApp();
  } else {
    document.getElementById('loginErr').textContent = res.error || 'Login failed';
  }
}

function initApp() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('appSection').style.display = '';
  const u = localStorage.getItem('role');
  document.getElementById('navUser').textContent = (localStorage.getItem('username') || '') + ' [' + ROLE + ']';
  if (ROLE === 'admin') document.getElementById('adminNavBtn').style.display = '';
  showSection('dashboard');
}

if (TOKEN) initApp();

async function loadDashboard() {
  const [customers, leads, today] = await Promise.all([
    api('GET', '/api/customers'),
    api('GET', '/api/leads'),
    api('GET', '/api/followups/today')
  ]);
  document.getElementById('dashStats').innerHTML =
    statBox('Customers', customers.length) +
    statBox('Leads', leads.length) +
    statBox("Today's Follow-ups", today.length);
  document.getElementById('todayFollowupsBody').innerHTML =
    today.map(f => `<tr><td>${f.refName}</td><td>${fmtDate(f.date)}</td><td>${f.remarks}</td><td>${f.status}</td></tr>`).join('') || '<tr><td colspan="4">None</td></tr>';
}

function statBox(label, val) {
  return `<div class="stat-box"><b>${val}</b>${label}</div>`;
}

function fmtDate(d) { return d ? new Date(d).toLocaleDateString() : ''; }

async function loadCustomers() {
  const q = document.getElementById('custSearch')?.value || '';
  const data = await api('GET', '/api/customers' + (q ? '?q=' + encodeURIComponent(q) : ''));
  document.getElementById('custBody').innerHTML = data.map(c =>
    `<tr><td>${c.name}</td><td>${c.phone}</td><td>${c.email}</td><td>${c.company}</td><td>${c.status}</td><td>${c.notes}</td><td>${fmtDate(c.date)}</td>
    <td><button onclick="openCustModal('${c._id}')">Edit</button> <button onclick="delCustomer('${c._id}')">Del</button></td></tr>`
  ).join('') || '<tr><td colspan="8">No records</td></tr>';
}

function openCustModal(id) {
  editCustId = id || null;
  document.getElementById('custModalTitle').textContent = id ? 'Edit Customer' : 'Add Customer';
  if (!id) { ['cName','cPhone','cEmail','cCompany','cNotes'].forEach(f => document.getElementById(f).value = ''); document.getElementById('cStatus').value = 'active'; }
  else {
    api('GET', '/api/customers').then(data => {
      const c = data.find(x => x._id === id);
      if (!c) return;
      document.getElementById('cName').value = c.name;
      document.getElementById('cPhone').value = c.phone;
      document.getElementById('cEmail').value = c.email;
      document.getElementById('cCompany').value = c.company;
      document.getElementById('cStatus').value = c.status;
      document.getElementById('cNotes').value = c.notes;
    });
  }
  document.getElementById('custModal').style.display = '';
}

async function saveCustomer() {
  const body = {
    name: document.getElementById('cName').value,
    phone: document.getElementById('cPhone').value,
    email: document.getElementById('cEmail').value,
    company: document.getElementById('cCompany').value,
    status: document.getElementById('cStatus').value,
    notes: document.getElementById('cNotes').value
  };
  if (editCustId) await api('PUT', '/api/customers/' + editCustId, body);
  else await api('POST', '/api/customers', body);
  closeModal('custModal');
  loadCustomers();
}

async function delCustomer(id) {
  if (!confirm('Delete?')) return;
  await api('DELETE', '/api/customers/' + id);
  loadCustomers();
}

async function loadLeads() {
  const data = await api('GET', '/api/leads');
  document.getElementById('leadBody').innerHTML = data.map(l =>
    `<tr><td>${l.name}</td><td>${l.phone}</td><td>${l.source}</td><td>${l.product}</td><td>${l.status}</td><td>${l.assignedTo}</td><td>${fmtDate(l.date)}</td>
    <td><button onclick="openLeadModal('${l._id}')">Edit</button> <button onclick="convertLead('${l._id}')">Convert</button> <button onclick="delLead('${l._id}')">Del</button></td></tr>`
  ).join('') || '<tr><td colspan="8">No records</td></tr>';
}

function openLeadModal(id) {
  editLeadId = id || null;
  document.getElementById('leadModalTitle').textContent = id ? 'Edit Lead' : 'Add Lead';
  if (!id) { ['lName','lPhone','lSource','lProduct','lAssigned'].forEach(f => document.getElementById(f).value = ''); document.getElementById('lStatus').value = 'new'; }
  else {
    api('GET', '/api/leads').then(data => {
      const l = data.find(x => x._id === id);
      if (!l) return;
      document.getElementById('lName').value = l.name;
      document.getElementById('lPhone').value = l.phone;
      document.getElementById('lSource').value = l.source;
      document.getElementById('lProduct').value = l.product;
      document.getElementById('lStatus').value = l.status;
      document.getElementById('lAssigned').value = l.assignedTo;
    });
  }
  document.getElementById('leadModal').style.display = '';
}

async function saveLead() {
  const body = {
    name: document.getElementById('lName').value,
    phone: document.getElementById('lPhone').value,
    source: document.getElementById('lSource').value,
    product: document.getElementById('lProduct').value,
    status: document.getElementById('lStatus').value,
    assignedTo: document.getElementById('lAssigned').value
  };
  if (editLeadId) await api('PUT', '/api/leads/' + editLeadId, body);
  else await api('POST', '/api/leads', body);
  closeModal('leadModal');
  loadLeads();
}

async function convertLead(id) {
  if (!confirm('Convert lead to customer?')) return;
  await api('POST', '/api/leads/' + id + '/convert');
  loadLeads();
  alert('Converted to customer!');
}

async function delLead(id) {
  if (!confirm('Delete?')) return;
  await api('DELETE', '/api/leads/' + id);
  loadLeads();
}

async function loadFollowups() {
  const data = await api('GET', '/api/followups');
  document.getElementById('followupBody').innerHTML = data.map(f =>
    `<tr><td>${f.refName}</td><td>${fmtDate(f.date)}</td><td>${f.remarks}</td><td>${f.status}</td>
    <td>${f.status !== 'done' ? `<button onclick="markDone('${f._id}')">Mark Done</button>` : 'Done'}</td></tr>`
  ).join('') || '<tr><td colspan="5">No records</td></tr>';
}

function openFollowupModal() {
  document.getElementById('fRef').value = '';
  document.getElementById('fDate').value = '';
  document.getElementById('fRemarks').value = '';
  document.getElementById('followupModal').style.display = '';
}

async function saveFollowup() {
  await api('POST', '/api/followups', {
    refName: document.getElementById('fRef').value,
    date: document.getElementById('fDate').value,
    remarks: document.getElementById('fRemarks').value,
    status: 'pending'
  });
  closeModal('followupModal');
  loadFollowups();
}

async function markDone(id) {
  await api('PUT', '/api/followups/' + id, { status: 'done' });
  loadFollowups();
}

async function loadAdmin() {
  const [stats, users] = await Promise.all([api('GET', '/api/admin/stats'), api('GET', '/api/admin/users')]);
  document.getElementById('adminStats').innerHTML =
    statBox('Customers', stats.customers) +
    statBox('Leads', stats.leads) +
    statBox('Follow-ups', stats.followups) +
    statBox('Users', stats.users);
  document.getElementById('usersBody').innerHTML = users.map(u =>
    `<tr><td>${u.username}</td><td>${u.role}</td><td><button onclick="delUser('${u._id}')">Del</button></td></tr>`
  ).join('');
}

async function addUser() {
  const username = document.getElementById('newUsername').value;
  const password = document.getElementById('newPassword').value;
  const role = document.getElementById('newRole').value;
  if (!username || !password) return alert('Fill all fields');
  await api('POST', '/api/admin/user', { username, password, role });
  document.getElementById('newUsername').value = '';
  document.getElementById('newPassword').value = '';
  loadAdmin();
}

async function delUser(id) {
  if (!confirm('Delete user?')) return;
  await api('DELETE', '/api/admin/user/' + id);
  loadAdmin();
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }