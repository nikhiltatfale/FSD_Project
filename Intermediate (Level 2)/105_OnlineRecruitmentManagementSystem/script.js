const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';
let editingJobId = null;

function getData(key) {
  return JSON.parse(localStorage.getItem(key) || '[]');
}
function setData(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function showSection(id) {
  if (id === 'adminDashboard' && !localStorage.getItem('adminSession')) {
    showSection('adminLogin');
    return;
  }
  document.querySelectorAll('section').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'block';
  if (id === 'home') renderJobs();
  if (id === 'adminDashboard') { renderStats(); renderAdminJobs(); renderAdminApps(); }
  if (id === 'track') { document.getElementById('trackEmail').value = ''; document.getElementById('trackResults').innerHTML = ''; }
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function renderJobs() {
  const jobs = getData('jobs');
  const search = document.getElementById('searchInput').value.toLowerCase();
  const loc = document.getElementById('locationFilter').value;
  const type = document.getElementById('typeFilter').value;
  const locSel = document.getElementById('locationFilter');
  const locs = [...new Set(jobs.map(j => j.location))];
  const cur = locSel.value;
  locSel.innerHTML = '<option value="">All Locations</option>' + locs.map(l => `<option${l === cur ? ' selected' : ''}>${l}</option>`).join('');
  const filtered = jobs.filter(j =>
    (!search || j.title.toLowerCase().includes(search) || j.description.toLowerCase().includes(search)) &&
    (!loc || j.location === loc) &&
    (!type || j.type === type)
  );
  const el = document.getElementById('jobList');
  if (!filtered.length) {
    el.innerHTML = '<div class="no-jobs"><h3>No jobs found.</h3><p style="margin-top:8px;color:var(--muted)">Try adjusting your filters.</p></div>';
    return;
  }
  el.innerHTML = filtered.map(j => `
    <div class="job-card" onclick="viewJob('${j.id}')">
      <div class="job-title">${j.title}</div>
      <div class="job-meta">
        <span class="badge">${j.location}</span>
        <span class="badge type">${j.type}</span>
      </div>
      <div class="job-desc-preview">${j.description}</div>
    </div>`).join('');
}

function viewJob(id) {
  const job = getData('jobs').find(j => j.id === id);
  if (!job) return;
  localStorage.setItem('currentJob', id);
  document.getElementById('jobDetailContent').innerHTML = `
    <div class="detail-card">
      <h2>${job.title}</h2>
      <div class="job-meta">
        <span class="badge">${job.location}</span>
        <span class="badge type">${job.type}</span>
      </div>
      <div class="desc">${job.description}</div>
      <button class="btn-primary" onclick="goApply('${job.id}','${job.title}')">Apply Now</button>
    </div>`;
  showSection('jobDetail');
}

function goApply(id, title) {
  localStorage.setItem('currentJob', id);
  document.getElementById('applyJobTitle').textContent = title;
  document.getElementById('applyMsg').className = 'msg';
  document.getElementById('applyMsg').style.display = 'none';
  ['appName','appEmail','appPhone','appResume'].forEach(f => document.getElementById(f).value = '');
  showSection('applyForm');
}

function submitApplication() {
  const jobId = localStorage.getItem('currentJob');
  const name = document.getElementById('appName').value.trim();
  const email = document.getElementById('appEmail').value.trim();
  const phone = document.getElementById('appPhone').value.trim();
  const resume = document.getElementById('appResume').value.trim();
  const msg = document.getElementById('applyMsg');
  if (!name || !email || !phone || !resume) {
    msg.textContent = 'All fields are required.';
    msg.className = 'msg error';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    msg.textContent = 'Enter a valid email address.';
    msg.className = 'msg error';
    return;
  }
  const apps = getData('applications');
  if (apps.find(a => a.email === email && a.jobId === jobId)) {
    msg.textContent = 'You have already applied for this job.';
    msg.className = 'msg error';
    return;
  }
  apps.push({ id: uid(), jobId, name, email, phone, resume, status: 'Applied' });
  setData('applications', apps);
  msg.textContent = 'Application submitted successfully! Track your status using your email.';
  msg.className = 'msg success';
  toast('Application submitted!');
}

function trackApplications() {
  const email = document.getElementById('trackEmail').value.trim();
  const el = document.getElementById('trackResults');
  if (!email) { el.innerHTML = '<p style="color:var(--danger);margin-top:12px;font-size:13px">Enter your email.</p>'; return; }
  const apps = getData('applications').filter(a => a.email.toLowerCase() === email.toLowerCase());
  const jobs = getData('jobs');
  if (!apps.length) { el.innerHTML = '<p style="color:var(--muted);margin-top:16px;font-size:13px">No applications found for this email.</p>'; return; }
  el.innerHTML = apps.map(a => {
    const job = jobs.find(j => j.id === a.jobId);
    return `<div class="track-result">
      <h4>${job ? job.title : 'Job Removed'}</h4>
      <p>${job ? job.location + ' · ' + job.type : ''}</p>
      <span class="status-badge status-${a.status}">${a.status}</span>
    </div>`;
  }).join('');
}

function adminLogin() {
  const u = document.getElementById('adminUser').value.trim();
  const p = document.getElementById('adminPass').value;
  const msg = document.getElementById('loginMsg');
  if (u === ADMIN_USER && p === ADMIN_PASS) {
    localStorage.setItem('adminSession', 'true');
    document.getElementById('adminLink').style.display = 'none';
    document.getElementById('logoutLink').style.display = 'inline';
    showSection('adminDashboard');
    switchTab('overview', document.querySelector('.tab-btn'));
  } else {
    msg.textContent = 'Invalid credentials.';
    msg.className = 'msg error';
  }
}

function adminLogout() {
  localStorage.removeItem('adminSession');
  document.getElementById('adminLink').style.display = 'inline';
  document.getElementById('logoutLink').style.display = 'none';
  showSection('home');
}

function renderStats() {
  const jobs = getData('jobs');
  const apps = getData('applications');
  document.getElementById('statJobs').textContent = jobs.length;
  document.getElementById('statApps').textContent = apps.length;
  document.getElementById('statShortlisted').textContent = apps.filter(a => a.status === 'Shortlisted').length;
  document.getElementById('statHired').textContent = apps.filter(a => a.status === 'Hired').length;
}

function switchTab(tab, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tab).style.display = 'block';
  btn.classList.add('active');
  if (tab === 'overview') renderStats();
  if (tab === 'manageJobs') renderAdminJobs();
  if (tab === 'manageApps') renderAdminApps();
}

function renderAdminJobs() {
  const jobs = getData('jobs');
  const el = document.getElementById('adminJobList');
  if (!jobs.length) { el.innerHTML = '<p style="color:var(--muted);text-align:center;padding:40px">No jobs posted yet.</p>'; return; }
  el.innerHTML = jobs.map(j => `
    <div class="admin-job-row">
      <div class="row-info"><h4>${j.title}</h4><p>${j.location} · ${j.type}</p></div>
      <div class="row-actions">
        <button class="btn-sm btn-edit" onclick="openJobModal('${j.id}')">Edit</button>
        <button class="btn-sm btn-del" onclick="deleteJob('${j.id}')">Delete</button>
      </div>
    </div>`).join('');
}

function renderAdminApps() {
  const apps = getData('applications');
  const jobs = getData('jobs');
  const q = (document.getElementById('appSearch')?.value || '').toLowerCase();
  const filtered = apps.filter(a => !q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q));
  const el = document.getElementById('adminAppList');
  if (!filtered.length) { el.innerHTML = '<p style="color:var(--muted);text-align:center;padding:40px">No applicants found.</p>'; return; }
  el.innerHTML = filtered.map(a => {
    const job = jobs.find(j => j.id === a.jobId);
    return `<div class="admin-app-row">
      <div class="row-info">
        <h4>${a.name} <span style="font-size:11px;color:var(--muted);font-weight:400">— ${job ? job.title : 'N/A'}</span></h4>
        <p>${a.email} · ${a.phone}</p>
        <p style="margin-top:4px;font-size:12px">Resume: ${a.resume}</p>
      </div>
      <div class="row-actions">
        <select class="status-select" onchange="updateStatus('${a.id}',this.value)">
          ${['Applied','Shortlisted','Hired','Rejected'].map(s => `<option${s===a.status?' selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>`;
  }).join('');
}

function openJobModal(id) {
  editingJobId = id || null;
  const modal = document.getElementById('jobModal');
  if (id) {
    const job = getData('jobs').find(j => j.id === id);
    document.getElementById('modalTitle').textContent = 'Edit Job';
    document.getElementById('jTitle').value = job.title;
    document.getElementById('jLocation').value = job.location;
    document.getElementById('jType').value = job.type;
    document.getElementById('jDesc').value = job.description;
  } else {
    document.getElementById('modalTitle').textContent = 'Add Job';
    ['jTitle','jLocation','jDesc'].forEach(f => document.getElementById(f).value = '');
    document.getElementById('jType').value = 'Full-time';
  }
  modal.style.display = 'flex';
}

function closeJobModal() {
  document.getElementById('jobModal').style.display = 'none';
  editingJobId = null;
}

function saveJob() {
  const title = document.getElementById('jTitle').value.trim();
  const location = document.getElementById('jLocation').value.trim();
  const type = document.getElementById('jType').value;
  const description = document.getElementById('jDesc').value.trim();
  if (!title || !location || !description) { toast('Fill all fields'); return; }
  const jobs = getData('jobs');
  if (editingJobId) {
    const idx = jobs.findIndex(j => j.id === editingJobId);
    if (idx > -1) jobs[idx] = { ...jobs[idx], title, location, type, description };
  } else {
    jobs.push({ id: uid(), title, location, type, description });
  }
  setData('jobs', jobs);
  closeJobModal();
  renderAdminJobs();
  renderStats();
  toast(editingJobId ? 'Job updated!' : 'Job added!');
}

function deleteJob(id) {
  if (!confirm('Delete this job? All related applications will also be removed.')) return;
  let jobs = getData('jobs').filter(j => j.id !== id);
  let apps = getData('applications').filter(a => a.jobId !== id);
  setData('jobs', jobs);
  setData('applications', apps);
  renderAdminJobs();
  renderStats();
  toast('Job deleted.');
}

function updateStatus(appId, status) {
  const apps = getData('applications');
  const idx = apps.findIndex(a => a.id === appId);
  if (idx > -1) apps[idx].status = status;
  setData('applications', apps);
  renderStats();
  toast('Status updated!');
}

window.addEventListener('click', e => {
  if (e.target === document.getElementById('jobModal')) closeJobModal();
});

if (localStorage.getItem('adminSession')) {
  document.getElementById('adminLink').style.display = 'none';
  document.getElementById('logoutLink').style.display = 'inline';
}

showSection('home');