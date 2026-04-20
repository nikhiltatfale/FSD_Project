let currentStudent = null;

function show(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('login-error').textContent = '';
}

async function adminLogin() {
  const username = document.getElementById('adm-user').value;
  const password = document.getElementById('adm-pass').value;
  const res = await fetch('/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
  const data = await res.json();
  if (data.success) { show('page-admin'); loadAdminDashboard(); }
  else document.getElementById('login-error').textContent = 'Invalid credentials';
}

async function studentLogin() {
  const id = document.getElementById('stu-id').value;
  const name = document.getElementById('stu-name').value;
  const res = await fetch('/student/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, name }) });
  const data = await res.json();
  if (data.success) { currentStudent = data.student; show('page-student'); loadStudentProfile(); }
  else document.getElementById('login-error').textContent = 'Invalid ID or name';
}

function logout() { currentStudent = null; show('page-login'); }

function adminNav(section) {
  document.querySelectorAll('#page-admin .section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('#page-admin .nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById('admin-' + section).classList.add('active');
  event.target.classList.add('active');
  if (section === 'dashboard') loadAdminDashboard();
  if (section === 'students') loadStudents();
  if (section === 'attendance') loadAttendanceAdmin();
  if (section === 'marks') loadMarksAdmin();
  if (section === 'notices') loadNoticesAdmin();
}

function stuNav(section) {
  document.querySelectorAll('#page-student .section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('#page-student .nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById('stu-' + section).classList.add('active');
  event.target.classList.add('active');
  if (section === 'profile') loadStudentProfile();
  if (section === 'attendance') loadStudentAttendance();
  if (section === 'marks') loadStudentMarks();
  if (section === 'notices') loadStudentNotices();
}

async function loadAdminDashboard() {
  const [students, notices] = await Promise.all([fetch('/students').then(r => r.json()), fetch('/notices').then(r => r.json())]);
  document.getElementById('stat-students').textContent = students.length;
  document.getElementById('stat-notices').textContent = notices.length;
}

async function loadStudents() {
  const students = await fetch('/students').then(r => r.json());
  const tbody = document.getElementById('students-body');
  tbody.innerHTML = students.map(s => `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.department}</td><td>${s.year}</td><td><button class="btn-danger" onclick="deleteStudent('${s.id}')">Delete</button></td></tr>`).join('');
}

async function addStudent() {
  const id = document.getElementById('new-id').value;
  const name = document.getElementById('new-name').value;
  const department = document.getElementById('new-dept').value;
  const year = document.getElementById('new-year').value;
  if (!id || !name || !department || !year) return;
  await fetch('/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, name, department, year }) });
  document.getElementById('new-id').value = ''; document.getElementById('new-name').value = '';
  document.getElementById('new-dept').value = ''; document.getElementById('new-year').value = '';
  loadStudents();
}

async function deleteStudent(id) {
  await fetch('/students/' + id, { method: 'DELETE' });
  loadStudents();
}

async function loadAttendanceAdmin() {
  const students = await fetch('/students').then(r => r.json());
  const sel = document.getElementById('att-student');
  sel.innerHTML = students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  document.getElementById('att-date').value = new Date().toISOString().split('T')[0];
  sel.onchange = showAttHistory;
  showAttHistory();
}

async function showAttHistory() {
  const id = document.getElementById('att-student').value;
  if (!id) return;
  const records = await fetch('/attendance/' + id).then(r => r.json());
  const html = records.length ? `<table class="att-table"><thead><tr><th>Date</th><th>Status</th></tr></thead><tbody>${records.map(r => `<tr><td>${r.date}</td><td class="${r.status === 'Present' ? 'badge-present' : 'badge-absent'}">${r.status}</td></tr>`).join('')}</tbody></table>` : '<p style="color:#64748b">No records</p>';
  document.getElementById('att-history').innerHTML = html;
}

async function markAttendance() {
  const id = document.getElementById('att-student').value;
  const date = document.getElementById('att-date').value;
  const status = document.getElementById('att-status').value;
  if (!id || !date) return;
  await fetch('/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, date, status }) });
  showAttHistory();
}

async function loadMarksAdmin() {
  const students = await fetch('/students').then(r => r.json());
  const sel = document.getElementById('marks-student');
  sel.innerHTML = students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  sel.onchange = showMarksDisplay;
  showMarksDisplay();
}

async function showMarksDisplay() {
  const id = document.getElementById('marks-student').value;
  if (!id) return;
  const data = await fetch('/marks/' + id).then(r => r.json());
  const subjects = Object.keys(data);
  const html = subjects.length ? `<table class="marks-table"><thead><tr><th>Subject</th><th>Score</th></tr></thead><tbody>${subjects.map(s => `<tr><td>${s}</td><td>${data[s]}</td></tr>`).join('')}</tbody></table>` : '<p style="color:#64748b">No marks</p>';
  document.getElementById('marks-display').innerHTML = html;
}

async function addMarks() {
  const id = document.getElementById('marks-student').value;
  const subject = document.getElementById('marks-subject').value;
  const score = parseInt(document.getElementById('marks-score').value);
  if (!id || !subject || isNaN(score)) return;
  await fetch('/marks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, subject, score }) });
  document.getElementById('marks-score').value = '';
  showMarksDisplay();
}

async function loadNoticesAdmin() {
  const notices = await fetch('/notices').then(r => r.json());
  document.getElementById('notices-list').innerHTML = notices.map(n => `<div class="notice-card"><div><h4>${n.title}</h4><p>${n.body}</p><div class="notice-date">${n.date}</div></div><button class="btn-danger" onclick="deleteNotice(${n.id})">Delete</button></div>`).join('');
}

async function postNotice() {
  const title = document.getElementById('notice-title').value;
  const body = document.getElementById('notice-body').value;
  if (!title || !body) return;
  await fetch('/notices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, body }) });
  document.getElementById('notice-title').value = ''; document.getElementById('notice-body').value = '';
  loadNoticesAdmin();
}

async function deleteNotice(id) {
  await fetch('/notices/' + id, { method: 'DELETE' });
  loadNoticesAdmin();
}

function loadStudentProfile() {
  if (!currentStudent) return;
  document.getElementById('profile-info').innerHTML = `<div>Name: <span>${currentStudent.name}</span></div><div>ID: <span>${currentStudent.id}</span></div><div>Department: <span>${currentStudent.department}</span></div><div>Year: <span>${currentStudent.year}</span></div>`;
}

async function loadStudentAttendance() {
  const records = await fetch('/attendance/' + currentStudent.id).then(r => r.json());
  const total = records.length;
  const present = records.filter(r => r.status === 'Present').length;
  const pct = total ? Math.round((present / total) * 100) : 0;
  document.getElementById('att-percent').textContent = `Attendance: ${pct}% (${present}/${total})`;
  document.getElementById('att-records').innerHTML = total ? `<table class="att-table"><thead><tr><th>Date</th><th>Status</th></tr></thead><tbody>${records.map(r => `<tr><td>${r.date}</td><td class="${r.status === 'Present' ? 'badge-present' : 'badge-absent'}">${r.status}</td></tr>`).join('')}</tbody></table>` : '<p style="color:#64748b">No records</p>';
}

async function loadStudentMarks() {
  const data = await fetch('/marks/' + currentStudent.id).then(r => r.json());
  const subjects = Object.keys(data);
  document.getElementById('marks-records').innerHTML = subjects.length ? `<table class="marks-table"><thead><tr><th>Subject</th><th>Score</th></tr></thead><tbody>${subjects.map(s => `<tr><td>${s}</td><td>${data[s]}</td></tr>`).join('')}</tbody></table>` : '<p style="color:#64748b">No marks</p>';
}

async function loadStudentNotices() {
  const notices = await fetch('/notices').then(r => r.json());
  document.getElementById('stu-notices-list').innerHTML = notices.map(n => `<div class="notice-card"><div><h4>${n.title}</h4><p>${n.body}</p><div class="notice-date">${n.date}</div></div></div>`).join('');
}