let adminToken = null;
let currentUserEmail = null;

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'plans') loadPlans();
  if (id === 'admin') loadAdmin();
}

function toast(msg, ok = true) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show ' + (ok ? 'ok' : 'err');
  setTimeout(() => t.className = '', 3000);
}

async function api(method, url, body, headers = {}) {
  if (adminToken) headers['x-admin-token'] = adminToken;
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
}

async function loadPlans() {
  const plans = await api('GET', '/plans');
  document.getElementById('plans-grid').innerHTML = plans.map(p => `
    <div class="plan-card">
      <h3>${p.name}</h3>
      <div class="plan-price">$${p.price}<span>/plan</span></div>
      <div class="plan-duration">${p.duration} days access</div>
      <button onclick="subscribeToPlan(${p.id})">Subscribe</button>
    </div>`).join('') || '<p style="color:var(--muted)">No plans available.</p>';
}

async function subscribeToPlan(planId) {
  const email = prompt('Enter your registered email:');
  if (!email) return;
  const data = await api('POST', '/subscribe', { email, planId });
  if (data.error) return toast(data.error, false);
  toast('Subscribed successfully!');
  currentUserEmail = email;
}

async function register() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  if (!name || !email) return toast('Fill all fields', false);
  const data = await api('POST', '/register', { name, email });
  if (data.error) return toast(data.error, false);
  toast('Registered! You can now subscribe.');
  document.getElementById('reg-name').value = '';
  document.getElementById('reg-email').value = '';
}

async function checkStatus() {
  const email = document.getElementById('status-email').value.trim();
  if (!email) return toast('Enter your email', false);
  currentUserEmail = email;
  const data = await api('GET', `/user-status?email=${encodeURIComponent(email)}`);
  if (data.error) return toast(data.error, false);
  renderStatus(data);
}

function renderStatus(user) {
  const status = user.expiryDate ? (new Date(user.expiryDate) > new Date() ? 'Active' : 'Expired') : 'None';
  document.getElementById('status-result').innerHTML = `
    <div class="status-card">
      <h3>Subscription Details</h3>
      <div class="status-row"><span>Email</span><span>${user.email}</span></div>
      <div class="status-row"><span>Plan</span><span>${user.planName || '—'}</span></div>
      <div class="status-row"><span>Status</span><span class="badge ${status.toLowerCase()}">${status}</span></div>
      <div class="status-row"><span>Start Date</span><span>${user.startDate ? new Date(user.startDate).toLocaleDateString() : '—'}</span></div>
      <div class="status-row"><span>Expiry Date</span><span>${user.expiryDate ? new Date(user.expiryDate).toLocaleDateString() : '—'}</span></div>
      ${user.planId ? `<button class="unsub-btn" onclick="unsubscribe()">Unsubscribe</button>` : ''}
    </div>`;
}

async function unsubscribe() {
  if (!currentUserEmail) return toast('No user session', false);
  const data = await api('POST', '/unsubscribe', { email: currentUserEmail });
  if (data.error) return toast(data.error, false);
  toast('Unsubscribed successfully');
  checkStatus();
}

async function adminLogin() {
  const username = document.getElementById('admin-user').value.trim();
  const password = document.getElementById('admin-pass').value.trim();
  const data = await api('POST', '/admin-login', { username, password });
  if (data.error) return toast('Invalid credentials', false);
  adminToken = data.token;
  toast('Admin logged in');
  showSection('admin');
}

async function loadAdmin() {
  if (!adminToken) return;
  const [users, plans] = await Promise.all([api('GET', '/users'), api('GET', '/plans')]);
  const active = users.filter(u => u.status === 'Active').length;
  const expired = users.filter(u => u.status === 'Expired').length;
  document.getElementById('admin-stats').innerHTML = `
    <div class="stat-box"><div class="num">${users.length}</div><div class="lbl">Total Users</div></div>
    <div class="stat-box"><div class="num">${active}</div><div class="lbl">Active</div></div>
    <div class="stat-box"><div class="num">${expired}</div><div class="lbl">Expired</div></div>`;
  document.getElementById('admin-plans-list').innerHTML = plans.map(p => `
    <div class="plan-item">
      <div class="plan-item-info">
        <div class="name">${p.name}</div>
        <div class="meta">$${p.price} · ${p.duration} days</div>
      </div>
      <button class="del-btn" onclick="deletePlan(${p.id})">Delete</button>
    </div>`).join('') || '<p style="color:var(--muted);font-size:.9rem">No plans yet.</p>';
  document.getElementById('admin-users-table').innerHTML = users.length ? `
    <table>
      <thead><tr><th>Name</th><th>Email</th><th>Plan</th><th>Status</th><th>Expiry</th></tr></thead>
      <tbody>${users.map(u => `
        <tr>
          <td>${u.name}</td>
          <td style="font-family:var(--mono);font-size:.82rem">${u.email}</td>
          <td>${u.planName || '—'}</td>
          <td><span class="badge ${(u.status || 'none').toLowerCase()}">${u.status || 'None'}</span></td>
          <td style="font-family:var(--mono);font-size:.82rem">${u.expiryDate ? new Date(u.expiryDate).toLocaleDateString() : '—'}</td>
        </tr>`).join('')}</tbody>
    </table>` : '<p style="color:var(--muted);font-size:.9rem">No users registered yet.</p>';
}

async function addPlan() {
  const name = document.getElementById('plan-name').value.trim();
  const price = document.getElementById('plan-price').value;
  const duration = document.getElementById('plan-duration').value;
  if (!name || !price || !duration) return toast('Fill all fields', false);
  const data = await api('POST', '/add-plan', { name, price, duration });
  if (data.error) return toast(data.error, false);
  toast('Plan added!');
  document.getElementById('plan-name').value = '';
  document.getElementById('plan-price').value = '';
  document.getElementById('plan-duration').value = '';
  loadAdmin();
}

async function deletePlan(id) {
  const data = await api('DELETE', `/delete-plan/${id}`);
  if (data.error) return toast(data.error, false);
  toast('Plan deleted');
  loadAdmin();
}

async function checkStatusFromPlans(email) {
  const data = await api('GET', '/users');
  if (!data.find) return null;
  return data.find(u => u.email === email);
}

showSection('plans');