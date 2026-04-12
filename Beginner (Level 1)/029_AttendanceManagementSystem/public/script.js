// ============================================================
// Attendance Management System - Frontend (script.js)
// ============================================================

// ---- App State ----
const state = {
  token: localStorage.getItem('ams_token') || null,
  role:  localStorage.getItem('ams_role')  || null,
  name:  localStorage.getItem('ams_name')  || null,
  studentId: localStorage.getItem('ams_sid') || null,
  editingStudentId: null,   // for edit modal
  lastFilterParams: {}       // for CSV download
};

// ============================================================
// UTILITY
// ============================================================

// Show a toast notification
function toast(msg, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type}`;
  el.classList.remove('hidden');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => el.classList.add('hidden'), 3500);
}

// Centralized API call
async function api(method, url, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'x-session-token': state.token || '' }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Format date nicely
function fmtDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${day} ${months[parseInt(m)-1]} ${y}`;
}

// Show/hide pages
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.classList.add('hidden');
  });
  const el = document.getElementById(id);
  el.classList.remove('hidden');
  el.classList.add('active');
}

// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  // Set today's date as default for attendance form
  const today = new Date().toISOString().split('T')[0];
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach(i => { i.value = today; i.max = today; });

  // If already logged in, restore session
  if (state.token && state.role) {
    if (state.role === 'admin') initAdmin();
    else initStudent();
  } else {
    showPage('loginPage');
  }
});

// ============================================================
// LOGIN
// ============================================================

function switchLoginTab(role) {
  state.tempLoginRole = role;
  document.getElementById('loginRole').value = role;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');

  const label = document.getElementById('loginIdLabel');
  const hint  = document.getElementById('loginHint');
  if (role === 'admin') {
    label.textContent = 'Admin ID';
    hint.innerHTML = '<strong>Demo:</strong> ID: <code>admin1</code> | Pass: <code>admin123</code>';
  } else {
    label.textContent = 'Student ID';
    hint.innerHTML = '<strong>Demo:</strong> ID: <code>S101</code> | Pass: <code>alice123</code>';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const id       = document.getElementById('loginId').value.trim();
  const password = document.getElementById('loginPassword').value;
  const role     = document.getElementById('loginRole').value;
  const btn      = document.getElementById('loginBtn');

  btn.textContent = 'Logging in...';
  btn.disabled = true;

  try {
    const data = await api('POST', '/login', { id, password, role });

    // Persist session
    state.token = data.token;
    state.role  = data.role;
    state.name  = data.name;
    state.studentId = data.studentId || null;

    localStorage.setItem('ams_token', data.token);
    localStorage.setItem('ams_role',  data.role);
    localStorage.setItem('ams_name',  data.name);
    if (data.studentId) localStorage.setItem('ams_sid', data.studentId);

    toast(`Welcome, ${data.name}!`, 'success');

    if (role === 'admin') initAdmin();
    else initStudent();

  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.textContent = 'Login';
    btn.disabled = false;
  }
}

// ============================================================
// LOGOUT
// ============================================================
async function logout() {
  try { await api('POST', '/logout'); } catch (_) {}
  ['ams_token','ams_role','ams_name','ams_sid'].forEach(k => localStorage.removeItem(k));
  Object.assign(state, { token: null, role: null, name: null, studentId: null });
  showPage('loginPage');
  toast('Logged out.', 'info');
}

// ============================================================
// ADMIN INIT
// ============================================================
async function initAdmin() {
  document.getElementById('adminName').textContent = state.name;
  showPage('adminPage');
  showAdminTab('tabStudents');
  await loadStudents();
  await loadSubjectsIntoSelects();
}

// Switch admin tabs
function showAdminTab(tabId) {
  document.querySelectorAll('.dtab-content').forEach(t => {
    t.classList.remove('active');
    t.classList.add('hidden');
  });
  document.querySelectorAll('#adminPage .dtab').forEach((b, i) => b.classList.remove('active'));

  const tabEl = document.getElementById(tabId);
  tabEl.classList.remove('hidden');
  tabEl.classList.add('active');

  // Highlight the correct tab button
  const tabs = ['tabStudents','tabAttendance','tabReports','tabSubjects'];
  const idx = tabs.indexOf(tabId);
  document.querySelectorAll('#adminPage .dtab')[idx]?.classList.add('active');

  if (tabId === 'tabSubjects') loadSubjectsList();
}

// ============================================================
// STUDENTS
// ============================================================

async function loadStudents() {
  const wrapper = document.getElementById('studentsTable');
  wrapper.innerHTML = '<p class="loading">Loading...</p>';
  try {
    const students = await api('GET', '/students');
    if (!students.length) {
      wrapper.innerHTML = '<p class="empty">No students added yet.</p>';
      return;
    }
    wrapper.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Email</th><th>Class</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(s => `
            <tr>
              <td><strong>${s.id}</strong></td>
              <td>${s.name}</td>
              <td>${s.email}</td>
              <td>${s.className}</td>
              <td>
                <div class="action-cell">
                  <button class="btn btn-sm btn-warning" onclick="openEditModal('${s.id}','${s.name}','${s.email}','${s.className}')">Edit</button>
                  <button class="btn btn-sm btn-danger"  onclick="deleteStudent('${s.id}','${s.name}')">Delete</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    wrapper.innerHTML = `<p class="empty">Error: ${err.message}</p>`;
  }
}

// Load subjects into all select dropdowns
async function loadSubjectsIntoSelects() {
  try {
    const subjects = await api('GET', '/subjects');
    ['attendSubject','filterSubject'].forEach(id => {
      const sel = document.getElementById(id);
      const keep = sel.options[0]; // preserve "All" or "Select" option
      sel.innerHTML = '';
      sel.appendChild(keep);
      subjects.forEach(s => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = s;
        sel.appendChild(opt);
      });
    });

    // Also load students into filter
    const students = await api('GET', '/students');
    const filterStu = document.getElementById('filterStudent');
    const keepStu = filterStu.options[0];
    filterStu.innerHTML = '';
    filterStu.appendChild(keepStu);
    students.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.id} - ${s.name}`;
      filterStu.appendChild(opt);
    });
  } catch (err) {
    console.error('loadSubjectsIntoSelects:', err);
  }
}

// ---- ADD STUDENT MODAL ----
function openStudentModal() {
  state.editingStudentId = null;
  document.getElementById('modalTitle').textContent = 'Add Student';
  document.getElementById('modalSaveBtn').textContent = 'Add Student';
  document.getElementById('modalStudentId').disabled = false;
  ['modalStudentId','modalStudentName','modalStudentEmail','modalStudentPassword'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('studentModal').classList.remove('hidden');
}

function openEditModal(id, name, email, className) {
  state.editingStudentId = id;
  document.getElementById('modalTitle').textContent = 'Edit Student';
  document.getElementById('modalSaveBtn').textContent = 'Save Changes';
  document.getElementById('modalStudentId').value = id;
  document.getElementById('modalStudentId').disabled = true;
  document.getElementById('modalStudentName').value = name;
  document.getElementById('modalStudentEmail').value = email;
  document.getElementById('modalStudentPassword').value = '';
  document.getElementById('modalStudentClass').value = className;
  document.getElementById('studentModal').classList.remove('hidden');
}

function closeStudentModal() {
  document.getElementById('studentModal').classList.add('hidden');
}

async function saveStudent(e) {
  e.preventDefault();
  const btn = document.getElementById('modalSaveBtn');
  btn.disabled = true;

  const payload = {
    id:        document.getElementById('modalStudentId').value.trim(),
    name:      document.getElementById('modalStudentName').value.trim(),
    email:     document.getElementById('modalStudentEmail').value.trim(),
    password:  document.getElementById('modalStudentPassword').value,
    className: document.getElementById('modalStudentClass').value
  };

  try {
    if (state.editingStudentId) {
      await api('PUT', `/edit-student/${state.editingStudentId}`, payload);
      toast('Student updated!', 'success');
    } else {
      await api('POST', '/add-student', payload);
      toast('Student added!', 'success');
    }
    closeStudentModal();
    await loadStudents();
    await loadSubjectsIntoSelects(); // refresh student filter
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function deleteStudent(id, name) {
  if (!confirm(`Delete student "${name}" (${id})? Their attendance records will also be removed.`)) return;
  try {
    await api('DELETE', `/delete-student/${id}`);
    toast('Student deleted.', 'success');
    await loadStudents();
    await loadSubjectsIntoSelects();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ============================================================
// TAKE ATTENDANCE
// ============================================================

async function loadAttendanceSheet() {
  const date    = document.getElementById('attendDate').value;
  const subject = document.getElementById('attendSubject').value;

  if (!date)    return toast('Please select a date.', 'error');
  if (!subject) return toast('Please select a subject.', 'error');

  try {
    const students = await api('GET', '/students');
    if (!students.length) return toast('No students found. Add students first.', 'error');

    // Get existing attendance for this date+subject
    const report = await api('GET', `/attendance/all?date=${date}&subject=${encodeURIComponent(subject)}`);
    const existingMap = {};
    report.records.forEach(r => { existingMap[r.studentId] = r.status; });

    document.getElementById('attendSheetTitle').textContent =
      `${subject} — ${fmtDate(date)}`;

    const list = document.getElementById('attendanceList');
    list.innerHTML = students.map(s => {
      const status = existingMap[s.id] || 'Present';
      return `
        <div class="attend-row" id="ar_${s.id}">
          <div class="student-info">
            <strong>${s.name}</strong>
            <span>${s.id} | ${s.className}</span>
          </div>
          <div class="attend-toggle">
            <button class="present-btn ${status==='Present'?'selected':''}"
              onclick="setAttend('${s.id}','Present')">✓ Present</button>
            <button class="absent-btn ${status==='Absent'?'selected':''}"
              onclick="setAttend('${s.id}','Absent')">✗ Absent</button>
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('attendanceSheet').classList.remove('hidden');
  } catch (err) {
    toast(err.message, 'error');
  }
}

function setAttend(studentId, status) {
  const row = document.getElementById(`ar_${studentId}`);
  row.querySelector('.present-btn').classList.toggle('selected', status === 'Present');
  row.querySelector('.absent-btn').classList.toggle('selected',  status === 'Absent');
}

function markAll(status) {
  document.querySelectorAll('.attend-row').forEach(row => {
    const id = row.id.replace('ar_', '');
    setAttend(id, status);
  });
}

async function submitAttendance() {
  const date    = document.getElementById('attendDate').value;
  const subject = document.getElementById('attendSubject').value;

  const rows = document.querySelectorAll('.attend-row');
  if (!rows.length) return toast('No students loaded.', 'error');

  const records = [];
  rows.forEach(row => {
    const studentId = row.id.replace('ar_', '');
    const isPresent = row.querySelector('.present-btn').classList.contains('selected');
    records.push({ studentId, status: isPresent ? 'Present' : 'Absent' });
  });

  try {
    const res = await api('POST', '/mark-attendance', { date, subject, records });
    toast(res.message, 'success');
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ============================================================
// REPORTS
// ============================================================

async function loadReport() {
  const date      = document.getElementById('filterDate').value;
  const subject   = document.getElementById('filterSubject').value;
  const studentId = document.getElementById('filterStudent').value;

  const params = new URLSearchParams();
  if (date)      params.append('date', date);
  if (subject)   params.append('subject', subject);
  if (studentId) params.append('studentId', studentId);

  state.lastFilterParams = params.toString();

  const summaryEl = document.getElementById('reportSummary');
  const tableEl   = document.getElementById('reportTable');
  const dlSection = document.getElementById('downloadSection');

  tableEl.innerHTML = '<p class="loading">Loading...</p>';
  summaryEl.classList.remove('hidden');
  dlSection.classList.remove('hidden');

  try {
    const data = await api('GET', `/attendance/all?${params.toString()}`);
    const { records, summary } = data;

    // Summary cards
    summaryEl.innerHTML = `
      <div class="stat-card"><div class="stat-num">${summary.total}</div><div class="stat-label">Total Records</div></div>
      <div class="stat-card green"><div class="stat-num">${summary.present}</div><div class="stat-label">Present</div></div>
      <div class="stat-card red"><div class="stat-num">${summary.absent}</div><div class="stat-label">Absent</div></div>
      <div class="stat-card orange">
        <div class="stat-num">${summary.total > 0 ? ((summary.present/summary.total)*100).toFixed(1) : 0}%</div>
        <div class="stat-label">Attendance %</div>
      </div>
    `;

    if (!records.length) {
      tableEl.innerHTML = '<p class="empty">No records found for selected filters.</p>';
      return;
    }

    tableEl.innerHTML = `
      <table>
        <thead>
          <tr><th>Date</th><th>Subject</th><th>Student ID</th><th>Student Name</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${records.map(r => `
            <tr>
              <td>${fmtDate(r.date)}</td>
              <td>${r.subject}</td>
              <td>${r.studentId}</td>
              <td>${r.studentName}</td>
              <td><span class="status status-${r.status.toLowerCase()}">${r.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    toast(err.message, 'error');
    tableEl.innerHTML = `<p class="empty">Error: ${err.message}</p>`;
  }
}

function downloadCSV() {
  const url = `/download?${state.lastFilterParams}&token=${state.token}`;
  // Use fetch to download with auth header
  fetch(url, { headers: { 'x-session-token': state.token } })
    .then(res => {
      if (!res.ok) throw new Error('Download failed');
      return res.blob();
    })
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'attendance.csv';
      a.click();
      toast('CSV downloaded!', 'success');
    })
    .catch(err => toast(err.message, 'error'));
}

// ============================================================
// SUBJECTS
// ============================================================

async function loadSubjectsList() {
  const container = document.getElementById('subjectsList');
  try {
    const subjects = await api('GET', '/subjects');
    container.innerHTML = subjects.map(s => `<span class="chip">📚 ${s}</span>`).join('');
  } catch (err) {
    container.innerHTML = '<p>Error loading subjects.</p>';
  }
}

async function addSubject() {
  const input = document.getElementById('newSubjectInput');
  const subject = input.value.trim();
  if (!subject) return toast('Enter a subject name.', 'error');

  try {
    await api('POST', '/add-subject', { subject });
    toast(`Subject "${subject}" added!`, 'success');
    input.value = '';
    loadSubjectsList();
    loadSubjectsIntoSelects();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ============================================================
// STUDENT INIT
// ============================================================

async function initStudent() {
  document.getElementById('studentName').textContent = state.name;
  showPage('studentPage');
  showStudentTab('tabMyStats');
  await loadStudentData();
}

function showStudentTab(tabId) {
  document.querySelectorAll('#studentPage .dtab-content').forEach(t => {
    t.classList.remove('active');
    t.classList.add('hidden');
  });
  document.querySelectorAll('#studentPage .dtab').forEach(b => b.classList.remove('active'));

  const tabEl = document.getElementById(tabId);
  tabEl.classList.remove('hidden');
  tabEl.classList.add('active');

  const tabs = ['tabMyStats','tabMyHistory'];
  const idx = tabs.indexOf(tabId);
  document.querySelectorAll('#studentPage .dtab')[idx]?.classList.add('active');
}

async function loadStudentData() {
  const id = state.studentId;
  if (!id) return;

  try {
    const data = await api('GET', `/attendance/student/${id}`);
    const { records, summary, bySubject } = data;

    // Summary cards
    const pct = parseFloat(summary.percentage);
    const pctColor = pct >= 75 ? 'green' : pct >= 50 ? 'orange' : 'red';

    document.getElementById('studentSummaryCards').innerHTML = `
      <div class="stat-card"><div class="stat-num">${summary.total}</div><div class="stat-label">Total Classes</div></div>
      <div class="stat-card green"><div class="stat-num">${summary.present}</div><div class="stat-label">Present</div></div>
      <div class="stat-card red"><div class="stat-num">${summary.absent}</div><div class="stat-label">Absent</div></div>
      <div class="stat-card ${pctColor}"><div class="stat-num">${summary.percentage}%</div><div class="stat-label">Overall %</div></div>
    `;

    // Subject breakdown table
    const subKeys = Object.keys(bySubject);
    if (subKeys.length) {
      document.getElementById('subjectBreakdown').innerHTML = `
        <table>
          <thead><tr><th>Subject</th><th>Total</th><th>Present</th><th>Absent</th><th>Percentage</th></tr></thead>
          <tbody>
            ${subKeys.map(sub => {
              const sb = bySubject[sub];
              const pctCls = parseFloat(sb.percentage) >= 75 ? 'status-present' : 'status-absent';
              return `
                <tr>
                  <td>${sub}</td>
                  <td>${sb.total}</td>
                  <td>${sb.present}</td>
                  <td>${sb.total - sb.present}</td>
                  <td><span class="status ${pctCls}">${sb.percentage}%</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } else {
      document.getElementById('subjectBreakdown').innerHTML = '<p class="empty">No attendance data yet.</p>';
    }

    // History table
    if (records.length) {
      document.getElementById('historyTable').innerHTML = `
        <table>
          <thead><tr><th>Date</th><th>Subject</th><th>Status</th></tr></thead>
          <tbody>
            ${records.map(r => `
              <tr>
                <td>${fmtDate(r.date)}</td>
                <td>${r.subject}</td>
                <td><span class="status status-${r.status.toLowerCase()}">${r.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      document.getElementById('historyTable').innerHTML = '<p class="empty">No attendance records found.</p>';
    }

  } catch (err) {
    toast(err.message, 'error');
  }
}