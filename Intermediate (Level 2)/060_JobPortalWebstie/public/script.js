let currentUser = null;

const navConfig = {
  seeker: [
    { label: 'Browse Jobs', section: 'jobListSection', fn: loadJobs },
    { label: 'My Applications', section: 'myAppsSection', fn: loadMyApps }
  ],
  recruiter: [
    { label: 'Post Job', section: 'postJobSection', fn: null },
    { label: 'My Jobs', section: 'myJobsSection', fn: loadMyJobs }
  ],
  admin: [
    { label: 'Dashboard', section: 'adminSection', fn: loadAdmin }
  ]
};

function showSection(id) {
  document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('nav button').forEach(b => {
    b.classList.toggle('active', b.dataset.section === id);
  });
}

function buildNav(role) {
  const nav = document.getElementById('mainNav');
  nav.innerHTML = '';
  nav.style.display = 'flex';
  navConfig[role].forEach(item => {
    const btn = document.createElement('button');
    btn.textContent = item.label;
    btn.dataset.section = item.section;
    btn.onclick = () => { if (item.fn) item.fn(); showSection(item.section); };
    nav.appendChild(btn);
  });
}

function setMsg(id, text, type) {
  const el = document.getElementById(id);
  el.innerHTML = text ? `<div class="msg ${type}">${text}</div>` : '';
}

async function api(method, url, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
}

async function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPass').value.trim();
  if (!email || !password) return setMsg('loginMsg', 'Fill all fields', 'error');
  const data = await api('POST', '/login', { email, password });
  if (data.error) return setMsg('loginMsg', data.error, 'error');
  currentUser = data;
  onLogin();
}

async function register() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPass').value.trim();
  const role = document.getElementById('regRole').value;
  if (!name || !email || !password) return setMsg('registerMsg', 'Fill all fields', 'error');
  const data = await api('POST', '/register', { name, email, password, role });
  if (data.error) return setMsg('registerMsg', data.error, 'error');
  setMsg('registerMsg', 'Registered! Please login.', 'success');
  setTimeout(() => showSection('loginSection'), 1000);
}

function onLogin() {
  document.getElementById('userInfo').style.display = 'flex';
  document.getElementById('headerName').textContent = `${currentUser.name} (${currentUser.role})`;
  document.getElementById('loginSection').classList.remove('active');
  document.getElementById('registerSection').classList.remove('active');
  buildNav(currentUser.role);
  const first = navConfig[currentUser.role][0];
  if (first.fn) first.fn();
  showSection(first.section);
}

function logout() {
  currentUser = null;
  document.getElementById('userInfo').style.display = 'none';
  document.getElementById('mainNav').style.display = 'none';
  document.getElementById('mainNav').innerHTML = '';
  showSection('loginSection');
}

async function loadJobs() {
  const jobs = await api('GET', '/jobs');
  const c = document.getElementById('jobListContainer');
  if (!jobs.length) { c.innerHTML = '<p>No jobs posted yet.</p>'; return; }
  c.innerHTML = jobs.map(j => `
    <div class="card">
      <h3>${j.title}</h3>
      <p><strong>${j.company}</strong> &nbsp;|&nbsp; Posted by: ${j.recruiterName}</p>
      <p>${j.description}</p>
      <button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="applyJob('${j.id}')">Apply</button>
    </div>`).join('');
}

async function applyJob(jobId) {
  const data = await api('POST', '/apply', { jobId, userId: currentUser.id });
  alert(data.error || 'Applied successfully!');
}

async function postJob() {
  const title = document.getElementById('jobTitle').value.trim();
  const company = document.getElementById('jobCompany').value.trim();
  const description = document.getElementById('jobDesc').value.trim();
  if (!title || !company || !description) return setMsg('postJobMsg', 'Fill all fields', 'error');
  const data = await api('POST', '/jobs', { title, company, description, recruiterId: currentUser.id });
  if (data.error) return setMsg('postJobMsg', data.error, 'error');
  setMsg('postJobMsg', 'Job posted!', 'success');
  document.getElementById('jobTitle').value = '';
  document.getElementById('jobCompany').value = '';
  document.getElementById('jobDesc').value = '';
}

async function loadMyJobs() {
  const jobs = await api('GET', '/jobs');
  const mine = jobs.filter(j => j.recruiterId === currentUser.id);
  const c = document.getElementById('myJobsContainer');
  if (!mine.length) { c.innerHTML = '<p>You have not posted any jobs yet.</p>'; return; }
  c.innerHTML = '';
  for (const j of mine) {
    const applicants = await api('GET', `/applicants/${j.id}`);
    const appList = applicants.length
      ? applicants.map(a => `<li>${a.name} — ${a.email}</li>`).join('')
      : '<li>No applicants yet</li>';
    c.innerHTML += `
      <div class="card">
        <h3>${j.title} — ${j.company}</h3>
        <p>${j.description}</p>
        <p style="margin-top:8px"><strong>Applicants (${applicants.length}):</strong></p>
        <ul style="margin-left:18px;font-size:.85rem;color:#444">${appList}</ul>
      </div>`;
  }
}

async function loadMyApps() {
  const jobs = await api('GET', `/applications/${currentUser.id}`);
  const c = document.getElementById('myAppsContainer');
  if (!jobs.length) { c.innerHTML = '<p>You have not applied to any jobs yet.</p>'; return; }
  c.innerHTML = jobs.map(j => `
    <div class="card">
      <h3>${j.title}</h3>
      <p><strong>${j.company}</strong></p>
      <p>${j.description}</p>
    </div>`).join('');
}

async function loadAdmin() {
  const [users, jobs, apps] = await Promise.all([
    api('GET', '/users'), api('GET', '/jobs'), api('GET', '/applications')
  ]);
  document.getElementById('statUsers').textContent = users.length;
  document.getElementById('statJobs').textContent = jobs.length;
  document.getElementById('statApps').textContent = apps.length;

  const uTbody = document.querySelector('#usersTable tbody');
  uTbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.name}</td><td>${u.email}</td>
      <td><span class="badge badge-${u.role}">${u.role}</span></td>
      <td>${u.id === 'admin' ? '—' : `<button class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}')">Delete</button>`}</td>
    </tr>`).join('');

  const jTbody = document.querySelector('#jobsTable tbody');
  jTbody.innerHTML = jobs.map(j => `
    <tr>
      <td>${j.title}</td><td>${j.company}</td><td>${j.recruiterName}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteJob('${j.id}')">Delete</button></td>
    </tr>`).join('');

  const aTbody = document.querySelector('#appsTable tbody');
  aTbody.innerHTML = apps.map(a => `
    <tr><td>${a.applicantName}</td><td>${a.applicantEmail}</td><td>${a.jobTitle}</td><td>${a.company}</td></tr>`).join('');
}

async function deleteJob(id) {
  if (!confirm('Delete this job?')) return;
  await api('DELETE', `/jobs/${id}`);
  loadAdmin();
}

async function deleteUser(id) {
  if (!confirm('Delete this user?')) return;
  await api('DELETE', `/users/${id}`);
  loadAdmin();
}