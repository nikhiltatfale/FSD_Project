// =============================================
//  Student Result Management System - script.js
// =============================================

// ---- LocalStorage key ----
const STORAGE_KEY = 'srms_students';

// ---- Admin credentials ----
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

// ---- Hidden admin trigger counter ----
let footerClicks = 0;

// ---- Subject names (order matches stored marks array) ----
const SUBJECTS = ['Math', 'Science', 'English', 'History', 'Computer'];

// =============================================
//  UTILITY: get / save students from localStorage
// =============================================

function getStudents() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveStudents(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

// =============================================
//  RESULT CALCULATION LOGIC
// =============================================

function calcResult(marks) {
  // marks = array of 5 numbers
  const total = marks.reduce((s, m) => s + Number(m), 0);
  const percent = (total / 5).toFixed(2);
  const failed = marks.some(m => Number(m) < 40);

  let grade, status;
  if (failed) {
    grade = 'F';
    status = 'Fail';
  } else if (percent >= 80) {
    grade = 'A';
    status = 'Pass';
  } else if (percent >= 60) {
    grade = 'B';
    status = 'Pass';
  } else if (percent >= 40) {
    grade = 'C';
    status = 'Pass';
  } else {
    grade = 'F';
    status = 'Fail';
  }
  return { total, percent, grade, status };
}

// =============================================
//  STUDENT SIDE: View Result
// =============================================

function viewResult() {
  const roll = document.getElementById('rollInput').value.trim();
  const dob  = document.getElementById('dobInput').value;
  const err  = document.getElementById('loginError');
  err.textContent = '';

  if (!roll || !dob) {
    err.textContent = 'Please enter Roll Number and Date of Birth.';
    return;
  }

  const students = getStudents();
  const student  = students.find(
    s => s.roll.toLowerCase() === roll.toLowerCase() && s.dob === dob
  );

  if (!student) {
    err.textContent = 'No result found. Check Roll Number or Date of Birth.';
    return;
  }

  displayResult(student);
}

function displayResult(student) {
  const { total, percent, grade, status } = calcResult(student.marks);

  // Fill student info
  document.getElementById('resName').textContent  = student.name;
  document.getElementById('resRoll').textContent  = student.roll;
  document.getElementById('resDOB').textContent   = student.dob;
  document.getElementById('resClass').textContent = 'Class: ' + student.cls;

  // Subject rows
  const tbody = document.getElementById('subjectRows');
  tbody.innerHTML = '';
  SUBJECTS.forEach((sub, i) => {
    const m = Number(student.marks[i]);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${sub}</td>
      <td>${m}</td>
      <td class="${m >= 40 ? 'sub-pass' : 'sub-fail'}">${m >= 40 ? 'Pass' : 'Fail'}</td>
    `;
    tbody.appendChild(tr);
  });

  // Total and percent
  document.getElementById('resTotal').textContent   = total + ' / 500';
  document.getElementById('resPercent').textContent = percent + '%';

  // Grade box
  const gradeBox = document.getElementById('gradeBox');
  gradeBox.textContent = 'Grade: ' + grade;
  gradeBox.className = 'grade-box grade-' + grade;

  // Status box
  const statusBox = document.getElementById('statusBox');
  statusBox.textContent = status.toUpperCase();
  statusBox.className = 'status-box ' + (status === 'Pass' ? 'pass' : 'fail');

  // Show result card, hide login card
  document.getElementById('loginCard').classList.add('hidden');
  document.getElementById('resultCard').classList.remove('hidden');
}

function goBack() {
  document.getElementById('resultCard').classList.add('hidden');
  document.getElementById('loginCard').classList.remove('hidden');
  document.getElementById('loginError').textContent = '';
}

// =============================================
//  PDF DOWNLOAD (print to PDF)
// =============================================

function downloadPDF() {
  window.print();
}

// =============================================
//  HIDDEN ADMIN TRIGGER (footer 5 clicks)
// =============================================

function triggerAdmin() {
  footerClicks++;
  if (footerClicks >= 5) {
    footerClicks = 0;
    // If already logged in, show dashboard directly
    if (localStorage.getItem('srms_admin_logged') === '1') {
      showDashboard();
    } else {
      document.getElementById('adminLoginModal').classList.remove('hidden');
    }
  }
}

function closeAdminModal() {
  document.getElementById('adminLoginModal').classList.add('hidden');
  document.getElementById('adminLoginError').textContent = '';
  document.getElementById('adminUser').value = '';
  document.getElementById('adminPass').value = '';
}

// =============================================
//  ADMIN LOGIN / LOGOUT
// =============================================

function adminLogin() {
  const user = document.getElementById('adminUser').value.trim();
  const pass = document.getElementById('adminPass').value.trim();
  const err  = document.getElementById('adminLoginError');

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    localStorage.setItem('srms_admin_logged', '1');
    closeAdminModal();
    showDashboard();
  } else {
    err.textContent = 'Invalid credentials.';
  }
}

function logoutAdmin() {
  localStorage.removeItem('srms_admin_logged');
  document.getElementById('adminDashboard').classList.add('hidden');
  document.getElementById('studentSection').classList.remove('hidden');
  clearForm();
}

function showDashboard() {
  document.getElementById('studentSection').classList.add('hidden');
  document.getElementById('adminDashboard').classList.remove('hidden');
  renderAdminTable();
}

// =============================================
//  ADMIN FORM: Save (Add / Edit)
// =============================================

function saveStudent() {
  const name     = document.getElementById('fName').value.trim();
  const roll     = document.getElementById('fRoll').value.trim();
  const dob      = document.getElementById('fDOB').value;
  const cls      = document.getElementById('fClass').value.trim();
  const math     = document.getElementById('fMath').value;
  const science  = document.getElementById('fScience').value;
  const english  = document.getElementById('fEnglish').value;
  const history  = document.getElementById('fHistory').value;
  const computer = document.getElementById('fComputer').value;
  const editKey  = document.getElementById('editRollKey').value;
  const msg      = document.getElementById('formMsg');

  msg.textContent = '';

  // Validation
  if (!name || !roll || !dob || !cls) {
    msg.textContent = 'Please fill all fields.';
    return;
  }
  const marks = [math, science, english, history, computer];
  for (let i = 0; i < marks.length; i++) {
    const v = Number(marks[i]);
    if (marks[i] === '' || isNaN(v) || v < 0 || v > 100) {
      msg.textContent = `Enter valid marks (0-100) for ${SUBJECTS[i]}.`;
      return;
    }
  }

  let students = getStudents();

  if (editKey) {
    // Editing existing record
    const idx = students.findIndex(s => s.roll === editKey);
    if (idx === -1) { msg.textContent = 'Student not found.'; return; }
    students[idx] = { name, roll, dob, cls, marks };
  } else {
    // Adding new record - check duplicate roll
    if (students.find(s => s.roll.toLowerCase() === roll.toLowerCase())) {
      msg.textContent = 'Roll Number already exists.';
      return;
    }
    students.push({ name, roll, dob, cls, marks });
  }

  saveStudents(students);
  clearForm();
  renderAdminTable();
  msg.style.color = 'green';
  msg.textContent = 'Saved successfully!';
  setTimeout(() => { msg.textContent = ''; msg.style.color = 'red'; }, 2000);
}

// =============================================
//  ADMIN FORM: Clear
// =============================================

function clearForm() {
  ['fName','fRoll','fDOB','fClass','fMath','fScience','fEnglish','fHistory','fComputer'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('editRollKey').value = '';
  document.getElementById('formTitle').textContent = 'Add Student Result';
  document.getElementById('formMsg').textContent = '';
}

// =============================================
//  ADMIN TABLE: Render All
// =============================================

function renderAdminTable() {
  const students = getStudents();
  const tbody    = document.getElementById('adminTableBody');
  tbody.innerHTML = '';

  if (students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#888;">No records found.</td></tr>';
    return;
  }

  students.forEach(s => {
    const { total, percent, grade, status } = calcResult(s.marks);
    const gradeClass = 'grade-' + grade;
    const statusClass = status === 'Pass' ? 'sub-pass' : 'sub-fail';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.roll}</td>
      <td>${s.name}</td>
      <td>${s.cls}</td>
      <td>${total}/500</td>
      <td>${percent}%</td>
      <td><span class="${gradeClass}" style="padding:2px 8px;border-radius:4px;">${grade}</span></td>
      <td class="${statusClass}">${status}</td>
      <td>
        <button class="btn-secondary" style="padding:5px 10px;font-size:0.8rem;margin-right:5px;" onclick="editStudent('${s.roll}')">Edit</button>
        <button class="btn-primary" style="padding:5px 10px;font-size:0.8rem;background:#e53935;" onclick="deleteStudent('${s.roll}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// =============================================
//  ADMIN: Edit Student
// =============================================

function editStudent(roll) {
  const students = getStudents();
  const s = students.find(st => st.roll === roll);
  if (!s) return;

  document.getElementById('fName').value    = s.name;
  document.getElementById('fRoll').value    = s.roll;
  document.getElementById('fDOB').value     = s.dob;
  document.getElementById('fClass').value   = s.cls;
  document.getElementById('fMath').value    = s.marks[0];
  document.getElementById('fScience').value = s.marks[1];
  document.getElementById('fEnglish').value = s.marks[2];
  document.getElementById('fHistory').value = s.marks[3];
  document.getElementById('fComputer').value= s.marks[4];
  document.getElementById('editRollKey').value = s.roll;
  document.getElementById('formTitle').textContent = 'Edit Student Result';
  // Scroll to form
  document.getElementById('adminDashboard').scrollTop = 0;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =============================================
//  ADMIN: Delete Student
// =============================================

function deleteStudent(roll) {
  if (!confirm('Delete result for Roll No: ' + roll + '?')) return;
  let students = getStudents();
  students = students.filter(s => s.roll !== roll);
  saveStudents(students);
  renderAdminTable();
}

// =============================================
//  ON PAGE LOAD: check if admin was logged in
// =============================================

window.addEventListener('DOMContentLoaded', () => {
  // If admin session exists (simple flag in localStorage), auto-show dashboard
  if (localStorage.getItem('srms_admin_logged') === '1') {
    showDashboard();
  }

  // Seed some demo data if localStorage is empty
  if (getStudents().length === 0) {
    const demo = [
      { name: 'Rahul Sharma',  roll: '101', dob: '2005-06-15', cls: '10-A', marks: [85, 90, 78, 82, 88] },
      { name: 'Priya Verma',   roll: '102', dob: '2005-03-22', cls: '10-A', marks: [72, 65, 70, 68, 75] },
      { name: 'Amit Kumar',    roll: '103', dob: '2005-09-10', cls: '10-B', marks: [45, 38, 50, 42, 55] },
      { name: 'Sneha Patil',   roll: '104', dob: '2006-01-05', cls: '10-B', marks: [92, 95, 88, 91, 94] },
    ];
    saveStudents(demo);
  }
});