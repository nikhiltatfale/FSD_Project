/* ============================================================
   ExamPortal – script.js
   Full application logic: routing, exam engine, admin, CSV,
   LocalStorage management, security, question management.
   ============================================================ */

// ─── CONSTANTS & STATE ───────────────────────────────────────
const ADMIN_ACCOUNTS = [
  { username: 'superadmin', password: 'super123', role: 'Super Admin' },
  { username: 'manager',    password: 'exam456',  role: 'Exam Manager' },
  { username: 'viewer',     password: 'view789',  role: 'Viewer'       }
];

const PASS_PERCENTAGE = 40; // Passing threshold

// Default questions preloaded on first run
const DEFAULT_QUESTIONS = [
  { id:'q1', text:'What does CPU stand for?', a:'Central Processing Unit', b:'Computer Personal Unit', c:'Central Power Unit', d:'Core Processing Unit', correct:'A' },
  { id:'q2', text:'Which data structure uses LIFO order?', a:'Queue', b:'Stack', c:'Array', d:'Tree', correct:'B' },
  { id:'q3', text:'What is the binary representation of decimal 10?', a:'1010', b:'1100', c:'0110', d:'1001', correct:'A' },
  { id:'q4', text:'Which language is primarily used for styling web pages?', a:'JavaScript', b:'HTML', c:'CSS', d:'Python', correct:'C' },
  { id:'q5', text:'What does RAM stand for?', a:'Read Access Memory', b:'Random Access Memory', c:'Rapid Access Module', d:'Read Anywhere Memory', correct:'B' },
  { id:'q6', text:'Which sorting algorithm has the best average time complexity?', a:'Bubble Sort', b:'Insertion Sort', c:'Quick Sort', d:'Selection Sort', correct:'C' },
  { id:'q7', text:'In HTML, which tag is used to create a hyperlink?', a:'<link>', b:'<a>', c:'<href>', d:'<url>', correct:'B' },
  { id:'q8', text:'What does OOP stand for in programming?', a:'Open Object Programming', b:'Ordered Object Protocol', c:'Object Oriented Programming', d:'Optimal Output Processing', correct:'C' },
  { id:'q9', text:'Which of the following is NOT a programming language?', a:'Python', b:'Java', c:'Linux', d:'Ruby', correct:'C' },
  { id:'q10', text:'What is the output of 2^8 in binary shift operations?', a:'128', b:'256', c:'512', d:'64', correct:'B' }
];

// Exam state
let state = {
  student: null,
  questions: [],
  answers: {},          // { qIndex: 'A'|'B'|'C'|'D' }
  currentQ: 0,
  timer: null,
  timeLeft: 60,
  examStarted: false,
  adminRole: null
};

// ─── LOCALSTORAGE HELPERS ─────────────────────────────────────
const LS = {
  get:    (k)    => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set:    (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  remove: (k)    => localStorage.removeItem(k),
  clear:  ()     => {
    // Clear only app data, not questions
    localStorage.removeItem('ep_results');
    localStorage.removeItem('ep_session');
  }
};

function getQuestions()  { return LS.get('ep_questions') || []; }
function getResults()    { return LS.get('ep_results')   || []; }
function getSession()    { return LS.get('ep_session');          }

function saveQuestions(q) { LS.set('ep_questions', q); }
function saveResults(r)   { LS.set('ep_results',   r); }
function saveSession(s)   { LS.set('ep_session',   s); }

// ─── INIT ────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Preload default questions if none exist
  if (!LS.get('ep_questions') || getQuestions().length === 0) {
    saveQuestions(DEFAULT_QUESTIONS);
  }

  // Check admin session
  const sess = getSession();
  if (sess && sess.loggedIn) {
    state.adminRole = sess.role;
    showScreen('admin-screen');
    renderAdminDashboard();
    return;
  }

  // Simulate loading
  setTimeout(() => {
    showScreen('registration-screen');
  }, 1200);
});

// ─── SCREEN ROUTER ────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

// ─── TOAST ────────────────────────────────────────────────────
function toast(msg, type = '') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.4s'; setTimeout(() => t.remove(), 400); }, 3000);
}

// ─── CONFIRM MODAL ────────────────────────────────────────────
let _confirmCallback = null;
function confirm(title, msg, cb) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent   = msg;
  document.getElementById('confirm-modal').classList.remove('hidden');
  document.getElementById('confirm-ok-btn').onclick = () => { closeConfirm(); cb(); };
  _confirmCallback = cb;
}
function closeConfirm() {
  document.getElementById('confirm-modal').classList.add('hidden');
}

// ─── REGISTRATION ─────────────────────────────────────────────
function registerStudent() {
  const name    = document.getElementById('reg-name').value.trim();
  const roll    = document.getElementById('reg-roll').value.trim().toUpperCase();
  const dept    = document.getElementById('reg-dept').value;
  const college = document.getElementById('reg-college').value.trim();

  if (!name)    return toast('Please enter your full name.', 'error');
  if (!roll)    return toast('Please enter your roll number.', 'error');
  if (!dept)    return toast('Please select your department.', 'error');
  if (!college) return toast('Please enter your college name.', 'error');

  // Check duplicate roll number
  const results = getResults();
  const dup = results.find(r => r.roll.toUpperCase() === roll);
  if (dup) return toast(`Roll number ${roll} has already appeared. Multiple attempts not allowed.`, 'error');

  state.student = { name, roll, dept, college };
  state.answers  = {};
  state.currentQ = 0;

  // Load and shuffle questions
  const allQ = getQuestions();
  if (allQ.length === 0) return toast('No questions available. Contact admin.', 'error');
  state.questions = shuffleArray([...allQ]);

  // Persist temp answers in LocalStorage
  LS.set('ep_temp_answers', {});
  LS.set('ep_temp_student', state.student);

  toast('Registration successful! Starting exam...', 'success');
  setTimeout(startExam, 800);
}

// ─── EXAM ENGINE ──────────────────────────────────────────────
function startExam() {
  state.examStarted = true;
  showScreen('exam-screen');

  // Header info
  document.getElementById('exam-student-name').textContent = state.student.name;
  document.getElementById('exam-roll-badge').textContent    = 'Roll: ' + state.student.roll;

  renderQuestion();
  buildPalette();
  startTimer();

  // Prevent page refresh warning
  window.onbeforeunload = () => 'Your exam is in progress. Are you sure you want to leave?';

  // Disable right-click
  document.addEventListener('contextmenu', blockRightClick);
}

function blockRightClick(e) {
  if (state.examStarted) { e.preventDefault(); toast('Right-click is disabled during the exam.', 'warning'); }
}

function renderQuestion() {
  const q   = state.questions[state.currentQ];
  const idx = state.currentQ;
  const tot = state.questions.length;

  document.getElementById('exam-q-count').textContent = `Q ${idx + 1}/${tot}`;
  document.getElementById('question-text').textContent = `Q${idx + 1}. ${q.text}`;

  const options = [
    { key: 'A', val: q.a }, { key: 'B', val: q.b },
    { key: 'C', val: q.c }, { key: 'D', val: q.d }
  ];

  const container = document.getElementById('options-container');
  container.innerHTML = '';
  options.forEach(opt => {
    const lbl = document.createElement('label');
    lbl.className = 'option-label' + (state.answers[idx] === opt.key ? ' selected' : '');
    lbl.innerHTML = `
      <input type="radio" name="opt" value="${opt.key}" ${state.answers[idx] === opt.key ? 'checked' : ''}/>
      <span><strong>${opt.key}.</strong> ${opt.val}</span>`;
    lbl.addEventListener('click', () => selectAnswer(opt.key));
    container.appendChild(lbl);
  });

  updatePalette();

  // Reset timer for new question
  resetTimer();
}

function selectAnswer(key) {
  state.answers[state.currentQ] = key;
  LS.set('ep_temp_answers', state.answers);
  renderQuestion();
}

function nextQuestion() {
  if (state.currentQ < state.questions.length - 1) {
    state.currentQ++;
    renderQuestion();
    resetTimer();
  } else {
    confirmSubmit();
  }
}

function prevQuestion() {
  if (state.currentQ > 0) {
    state.currentQ--;
    renderQuestion();
    resetTimer();
  }
}

// ─── PALETTE ─────────────────────────────────────────────────
function buildPalette() {
  const p = document.getElementById('question-palette');
  p.innerHTML = '';
  state.questions.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'palette-btn';
    btn.textContent = i + 1;
    btn.id = `pq-${i}`;
    btn.onclick = () => { state.currentQ = i; renderQuestion(); resetTimer(); };
    p.appendChild(btn);
  });
  updatePalette();
}

function updatePalette() {
  state.questions.forEach((_, i) => {
    const btn = document.getElementById(`pq-${i}`);
    if (!btn) return;
    btn.className = 'palette-btn';
    if (i === state.currentQ) btn.classList.add('current');
    else if (state.answers[i]) btn.classList.add('answered');
  });
}

// ─── TIMER ────────────────────────────────────────────────────
function startTimer() {
  state.timeLeft = 60;
  updateTimerDisplay();
  state.timer = setInterval(timerTick, 1000);
}

function resetTimer() {
  clearInterval(state.timer);
  state.timeLeft = 60;
  document.getElementById('timer-box').classList.remove('danger');
  updateTimerDisplay();
  state.timer = setInterval(timerTick, 1000);
}

function timerTick() {
  state.timeLeft--;
  updateTimerDisplay();
  if (state.timeLeft <= 10) document.getElementById('timer-box').classList.add('danger');
  if (state.timeLeft <= 0) {
    clearInterval(state.timer);
    toast('Time up! Moving to next question.', 'warning');
    if (state.currentQ < state.questions.length - 1) {
      state.currentQ++;
      renderQuestion();
      resetTimer();
    } else {
      submitExam();
    }
  }
}

function updateTimerDisplay() {
  document.getElementById('timer-value').textContent = state.timeLeft;
}

// ─── SUBMIT ───────────────────────────────────────────────────
function confirmSubmit() {
  const attempted = Object.keys(state.answers).length;
  const total     = state.questions.length;
  confirm(
    'Submit Exam',
    `You have answered ${attempted} of ${total} questions. Submit now?`,
    submitExam
  );
}

function submitExam() {
  clearInterval(state.timer);
  state.examStarted = false;
  window.onbeforeunload = null;
  document.removeEventListener('contextmenu', blockRightClick);

  const questions = state.questions;
  let correct = 0, wrong = 0, attempted = 0;
  const qStats = {}; // { qId: bool correct }

  questions.forEach((q, i) => {
    const ans = state.answers[i];
    if (ans !== undefined) {
      attempted++;
      if (ans === q.correct) { correct++; qStats[q.id] = true; }
      else { wrong++; qStats[q.id] = false; }
    } else {
      qStats[q.id] = false;
    }
  });

  const percent = Math.round((correct / questions.length) * 100);
  const passed  = percent >= PASS_PERCENTAGE;

  const result = {
    ...state.student,
    total:     questions.length,
    attempted,
    correct,
    wrong,
    percent,
    passed,
    qStats,
    date: new Date().toLocaleString()
  };

  // Save result
  const results = getResults();
  results.push(result);
  saveResults(results);

  // Cleanup temp data
  LS.remove('ep_temp_answers');
  LS.remove('ep_temp_student');

  showResult(result);
}

// ─── RESULT PAGE ──────────────────────────────────────────────
function showResult(r) {
  showScreen('result-screen');
  document.getElementById('result-date').textContent   = r.date;
  document.getElementById('r-name').textContent        = r.name;
  document.getElementById('r-roll').textContent        = r.roll;
  document.getElementById('r-dept').textContent        = r.dept;
  document.getElementById('r-college').textContent     = r.college;
  document.getElementById('r-total').textContent       = r.total;
  document.getElementById('r-attempted').textContent   = r.attempted;
  document.getElementById('r-correct').textContent     = r.correct;
  document.getElementById('r-wrong').textContent       = r.wrong;
  document.getElementById('r-percent').textContent     = r.percent + '%';

  const badge = document.getElementById('result-status-badge');
  badge.className = 'status-badge ' + (r.passed ? 'pass' : 'fail');
  badge.textContent = r.passed ? '✅ PASS' : '❌ FAIL';
}

function goHome() {
  state.student  = null;
  state.answers  = {};
  state.currentQ = 0;
  // Clear form
  ['reg-name','reg-roll','reg-college'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('reg-dept').value = '';
  showScreen('registration-screen');
}

// ─── ADMIN AUTH ───────────────────────────────────────────────
// Hidden trigger: click the ⚙ icon in the top bar
function openAdminModal() {
  document.getElementById('admin-login-modal').classList.remove('hidden');
  document.getElementById('admin-user').value = '';
  document.getElementById('admin-pass').value = '';
}

function closeAdminModal() {
  document.getElementById('admin-login-modal').classList.add('hidden');
}

function adminLogin() {
  const user = document.getElementById('admin-user').value.trim();
  const pass = document.getElementById('admin-pass').value;
  const account = ADMIN_ACCOUNTS.find(a => a.username === user && a.password === pass);
  if (!account) return toast('Invalid credentials.', 'error');

  state.adminRole = account.role;
  saveSession({ loggedIn: true, role: account.role });
  closeAdminModal();
  toast(`Welcome, ${account.role}!`, 'success');
  showScreen('admin-screen');
  renderAdminDashboard();
}

function adminLogout() {
  LS.remove('ep_session');
  state.adminRole = null;
  showScreen('registration-screen');
  toast('Logged out.', '');
}

// ─── ADMIN TABS ───────────────────────────────────────────────
function adminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  event.currentTarget.classList.add('active');

  if (tab === 'dashboard') renderAdminDashboard();
  if (tab === 'results')   renderResultsTable();
  if (tab === 'questions') renderQuestionsTab();

  // Close sidebar on mobile
  document.getElementById('admin-sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('admin-sidebar').classList.toggle('open');
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────
function renderAdminDashboard() {
  document.getElementById('admin-role-label').textContent = state.adminRole || '';
  const results = getResults();

  document.getElementById('stat-total').textContent = results.length;

  if (results.length === 0) {
    document.getElementById('stat-pass').textContent  = 0;
    document.getElementById('stat-fail').textContent  = 0;
    document.getElementById('stat-avg').textContent   = '0%';
    document.getElementById('stat-top').textContent   = '--';
    document.getElementById('q-stats-container').innerHTML = '<p style="color:#888;font-size:13px">No results yet.</p>';
    return;
  }

  const passed  = results.filter(r => r.passed).length;
  const avg     = Math.round(results.reduce((s, r) => s + r.percent, 0) / results.length);
  const top     = results.reduce((a, b) => a.percent > b.percent ? a : b);

  document.getElementById('stat-pass').textContent = passed;
  document.getElementById('stat-fail').textContent = results.length - passed;
  document.getElementById('stat-avg').textContent  = avg + '%';
  document.getElementById('stat-top').textContent  = `${top.name} (${top.percent}%)`;

  // Question statistics
  const questions = getQuestions();
  const qContainer = document.getElementById('q-stats-container');
  qContainer.innerHTML = '';

  questions.forEach((q, i) => {
    const totalAttempted = results.filter(r => r.qStats && r.qStats[q.id] !== undefined).length;
    const gotCorrect     = results.filter(r => r.qStats && r.qStats[q.id] === true).length;
    const pct = totalAttempted > 0 ? Math.round((gotCorrect / totalAttempted) * 100) : 0;

    const row = document.createElement('div');
    row.className = 'q-stat-row';
    row.innerHTML = `
      <span style="width:28px;font-weight:bold;color:#1a237e">${i+1}</span>
      <span style="flex:2;font-size:12px;color:#444;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${q.text}">${q.text.substring(0,60)}${q.text.length>60?'...':''}</span>
      <div class="q-bar-wrap"><div class="q-stat-bar" style="width:${pct}%"></div></div>
      <span class="q-stat-pct">${pct}%</span>
      <span style="font-size:11px;color:#888;width:60px">${gotCorrect}/${totalAttempted}</span>`;
    qContainer.appendChild(row);
  });
}

// ─── RESULTS TABLE ────────────────────────────────────────────
function renderResultsTable() {
  let results = getResults();
  const search  = document.getElementById('search-input').value.toLowerCase();
  const dept    = document.getElementById('filter-dept').value;
  const sortBy  = document.getElementById('sort-by').value;

  if (search) results = results.filter(r =>
    r.name.toLowerCase().includes(search) || r.roll.toLowerCase().includes(search));
  if (dept)   results = results.filter(r => r.dept === dept);

  if (sortBy === 'score_desc') results.sort((a,b) => b.percent - a.percent);
  if (sortBy === 'score_asc')  results.sort((a,b) => a.percent - b.percent);
  if (sortBy === 'name')       results.sort((a,b) => a.name.localeCompare(b.name));

  const tbody = document.getElementById('results-tbody');
  tbody.innerHTML = '';
  if (results.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#999;padding:20px">No results found.</td></tr>';
    return;
  }
  results.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${esc(r.name)}</td>
      <td>${esc(r.roll)}</td>
      <td>${esc(r.dept)}</td>
      <td>${esc(r.college)}</td>
      <td>${r.correct}/${r.total}</td>
      <td>${r.percent}%</td>
      <td><span class="badge-${r.passed?'pass':'fail'}">${r.passed?'PASS':'FAIL'}</span></td>
      <td style="white-space:nowrap;font-size:12px">${r.date}</td>`;
    tbody.appendChild(tr);
  });
}

// ─── CSV EXPORT ───────────────────────────────────────────────
function exportCSV() {
  const results = getResults();
  if (results.length === 0) return toast('No results to export.', 'warning');
  const header = ['Name','Roll','Department','College','Total','Attempted','Correct','Wrong','Percent','Status','Date'];
  const rows   = results.map(r => [
    r.name, r.roll, r.dept, r.college,
    r.total, r.attempted, r.correct, r.wrong,
    r.percent + '%', r.passed ? 'PASS' : 'FAIL', r.date
  ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));

  const csv  = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `exam_results_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV downloaded.', 'success');
}

// ─── CLEAR ALL DATA ───────────────────────────────────────────
function clearAllData() {
  if (state.adminRole === 'Viewer') return toast('Viewers cannot clear data.', 'error');
  confirm('Clear All Data', 'This will permanently delete ALL student results. Questions will be preserved. Continue?', () => {
    LS.remove('ep_results');
    toast('All results cleared.', 'success');
    renderAdminDashboard();
    renderResultsTable();
  });
}

// ─── QUESTION MANAGEMENT ──────────────────────────────────────
function renderQuestionsTab() {
  const isViewer = state.adminRole === 'Viewer';
  document.getElementById('viewer-notice').classList.toggle('hidden', !isViewer);
  document.getElementById('q-form-section').style.display = isViewer ? 'none' : 'block';

  const questions = getQuestions();
  const list = document.getElementById('questions-list');
  list.innerHTML = '';

  if (questions.length === 0) {
    list.innerHTML = '<p style="color:#888">No questions. Add some above.</p>';
    return;
  }

  questions.forEach((q, i) => {
    const div = document.createElement('div');
    div.className = 'q-item';
    div.innerHTML = `
      <div class="q-item-text">
        <p>Q${i+1}. ${esc(q.text)}</p>
        <small>A: ${esc(q.a)} | B: ${esc(q.b)} | C: ${esc(q.c)} | D: ${esc(q.d)} | ✅ <strong>${q.correct}</strong></small>
      </div>
      ${!isViewer ? `<div class="q-item-actions">
        <button class="btn btn-secondary" onclick="editQuestion('${q.id}')">✏ Edit</button>
        <button class="btn btn-danger" onclick="deleteQuestion('${q.id}')">🗑</button>
      </div>` : ''}`;
    list.appendChild(div);
  });
}

function saveQuestion() {
  if (state.adminRole === 'Viewer') return toast('Viewers cannot modify questions.', 'error');

  const text    = document.getElementById('q-text').value.trim();
  const a       = document.getElementById('q-a').value.trim();
  const b       = document.getElementById('q-b').value.trim();
  const c       = document.getElementById('q-c').value.trim();
  const d       = document.getElementById('q-d').value.trim();
  const correct = document.getElementById('q-correct').value;
  const editId  = document.getElementById('editing-q-id').value;

  if (!text || !a || !b || !c || !d) return toast('All fields are required.', 'error');

  const questions = getQuestions();

  if (editId) {
    // Update existing
    const idx = questions.findIndex(q => q.id === editId);
    if (idx > -1) { questions[idx] = { id: editId, text, a, b, c, d, correct }; }
    toast('Question updated.', 'success');
  } else {
    // Add new
    const newQ = { id: 'q' + Date.now(), text, a, b, c, d, correct };
    questions.push(newQ);
    toast('Question added.', 'success');
  }

  saveQuestions(questions);
  cancelEditQ();
  renderQuestionsTab();
}

function editQuestion(id) {
  const q = getQuestions().find(q => q.id === id);
  if (!q) return;
  document.getElementById('q-form-title').textContent     = 'Edit Question';
  document.getElementById('editing-q-id').value           = q.id;
  document.getElementById('q-text').value                  = q.text;
  document.getElementById('q-a').value                     = q.a;
  document.getElementById('q-b').value                     = q.b;
  document.getElementById('q-c').value                     = q.c;
  document.getElementById('q-d').value                     = q.d;
  document.getElementById('q-correct').value               = q.correct;
  document.getElementById('q-form-section').scrollIntoView({ behavior:'smooth' });
}

function cancelEditQ() {
  document.getElementById('q-form-title').textContent = 'Add New Question';
  document.getElementById('editing-q-id').value       = '';
  ['q-text','q-a','q-b','q-c','q-d'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('q-correct').value = 'A';
}

function deleteQuestion(id) {
  if (state.adminRole === 'Viewer') return toast('Viewers cannot delete questions.', 'error');
  confirm('Delete Question', 'Are you sure you want to delete this question?', () => {
    const questions = getQuestions().filter(q => q.id !== id);
    saveQuestions(questions);
    toast('Question deleted.', 'success');
    renderQuestionsTab();
  });
}

// ─── WIRE UP ADMIN TRIGGER ────────────────────────────────────
document.getElementById('admin-trigger').addEventListener('click', openAdminModal);

// ─── UTILITIES ────────────────────────────────────────────────
// Shuffle array (Fisher-Yates)
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// HTML escape
function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// Allow Enter key in admin login
document.getElementById('admin-pass').addEventListener('keydown', e => {
  if (e.key === 'Enter') adminLogin();
});