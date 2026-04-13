/* =====================================================
   ONLINE SURVEY PLATFORM — script.js
   Author: Senior Full-Stack Dev
   All data stored in localStorage.
   Admin: username=admin  password=admin123
===================================================== */

/* ===== CONSTANTS ===== */
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';
const LS_QUESTIONS = 'surveyQuestions';
const LS_RESPONSES = 'surveyResponses';

/* ===== STATE ===== */
let currentQuestionIndex = 0;
let participantAnswers = {};
let participantInfo = {};
let deleteTargetId = null;
let isAdminLoggedIn = false;

/* ===== LOCALSTORAGE HELPERS ===== */
function getQuestions() {
  try { return JSON.parse(localStorage.getItem(LS_QUESTIONS)) || []; }
  catch { return []; }
}
function saveQuestions(qs) {
  localStorage.setItem(LS_QUESTIONS, JSON.stringify(qs));
}
function getResponses() {
  try { return JSON.parse(localStorage.getItem(LS_RESPONSES)) || []; }
  catch { return []; }
}
function saveResponses(rs) {
  localStorage.setItem(LS_RESPONSES, JSON.stringify(rs));
}
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* ===== DARK MODE ===== */
document.getElementById('dark-mode-toggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  document.getElementById('dark-mode-toggle').textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('darkMode', isDark ? '1' : '0');
});
// Restore dark mode preference
if (localStorage.getItem('darkMode') === '1') {
  document.body.classList.add('dark');
  document.getElementById('dark-mode-toggle').textContent = '☀️';
}

/* ===== TOAST ===== */
let toastTimer = null;
function showToast(msg, duration = 2800) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), duration);
}

/* ===== SCREEN HELPERS ===== */
function showScreen(id) {
  document.querySelectorAll('#participant-section .screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

/* =====================================================
   PARTICIPANT FLOW
===================================================== */

/* --- Welcome Screen: Start Survey --- */
document.getElementById('start-survey-btn').addEventListener('click', () => {
  const name = document.getElementById('participant-name').value.trim();
  const email = document.getElementById('participant-email').value.trim();
  if (!name) { showToast('⚠️ Please enter your name.'); return; }
  if (!email || !email.includes('@')) { showToast('⚠️ Please enter a valid email.'); return; }

  const questions = getQuestions();
  if (questions.length === 0) {
    showScreen('no-questions-screen');
    return;
  }

  participantInfo = { name, email };
  participantAnswers = {};
  currentQuestionIndex = 0;
  showScreen('survey-screen');
  renderQuestion();
});

/* --- Render a Question --- */
function renderQuestion() {
  const questions = getQuestions();
  const q = questions[currentQuestionIndex];
  const total = questions.length;

  // Progress
  document.getElementById('progress-label').textContent =
    `Question ${currentQuestionIndex + 1} of ${total}`;
  const pct = ((currentQuestionIndex + 1) / total) * 100;
  document.getElementById('progress-bar-inner').style.width = pct + '%';

  // Question HTML
  const container = document.getElementById('question-container');
  container.innerHTML = '';

  const h3 = document.createElement('h3');
  h3.textContent = `${currentQuestionIndex + 1}. ${q.questionText}`;
  container.appendChild(h3);

  if (q.type === 'mcq') {
    (q.options || []).forEach((opt, i) => {
      const div = document.createElement('div');
      div.className = 'mcq-option';
      if (participantAnswers[q.id] === opt) div.classList.add('selected');

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = `q_${q.id}`;
      radio.value = opt;
      radio.id = `opt_${q.id}_${i}`;
      if (participantAnswers[q.id] === opt) radio.checked = true;

      const label = document.createElement('label');
      label.htmlFor = radio.id;
      label.textContent = opt;
      label.style.cursor = 'pointer';
      label.style.flex = '1';

      div.appendChild(radio);
      div.appendChild(label);

      div.addEventListener('click', () => {
        participantAnswers[q.id] = opt;
        document.querySelectorAll(`#question-container .mcq-option`).forEach(d => d.classList.remove('selected'));
        div.classList.add('selected');
        radio.checked = true;
      });

      container.appendChild(div);
    });
  } else {
    // Paragraph
    const ta = document.createElement('textarea');
    ta.className = 'paragraph-answer';
    ta.placeholder = 'Type your answer here...';
    ta.value = participantAnswers[q.id] || '';
    ta.addEventListener('input', () => { participantAnswers[q.id] = ta.value; });
    container.appendChild(ta);
  }

  // Nav buttons
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const submitBtn = document.getElementById('submit-btn');

  prevBtn.classList.toggle('hidden', currentQuestionIndex === 0);
  nextBtn.classList.toggle('hidden', currentQuestionIndex === total - 1);
  submitBtn.classList.toggle('hidden', currentQuestionIndex !== total - 1);
}

/* --- Previous Button --- */
document.getElementById('prev-btn').addEventListener('click', () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuestion();
  }
});

/* --- Next Button --- */
document.getElementById('next-btn').addEventListener('click', () => {
  const questions = getQuestions();
  const q = questions[currentQuestionIndex];
  if (!validateAnswer(q)) return;
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
  }
});

/* --- Submit Button --- */
document.getElementById('submit-btn').addEventListener('click', () => {
  const questions = getQuestions();
  const q = questions[currentQuestionIndex];
  if (!validateAnswer(q)) return;

  // Build response object
  const responseObj = {
    id: generateId(),
    submittedAt: new Date().toLocaleString(),
    participant: participantInfo,
    answers: questions.map(q2 => ({
      questionId: q2.id,
      questionText: q2.questionText,
      type: q2.type,
      answer: participantAnswers[q2.id] || ''
    }))
  };

  const responses = getResponses();
  responses.push(responseObj);
  saveResponses(responses);

  showScreen('thankyou-screen');
  showToast('✅ Survey submitted successfully!');
});

/* --- Validate current answer --- */
function validateAnswer(q) {
  if (q.type === 'mcq') {
    if (!participantAnswers[q.id]) {
      showToast('⚠️ Please select an option.');
      return false;
    }
  } else {
    // Paragraph: optional, allow empty
  }
  return true;
}

/* --- Take Another Survey --- */
document.getElementById('take-another-btn').addEventListener('click', () => {
  document.getElementById('participant-name').value = '';
  document.getElementById('participant-email').value = '';
  participantInfo = {};
  participantAnswers = {};
  currentQuestionIndex = 0;
  showScreen('welcome-screen');
});

/* =====================================================
   ADMIN FLOW
===================================================== */

/* --- Gear button opens admin section/login --- */
document.getElementById('admin-gear-btn').addEventListener('click', () => {
  if (isAdminLoggedIn) {
    // Already logged in: toggle visibility
    const adminSection = document.getElementById('admin-section');
    if (adminSection.classList.contains('hidden')) {
      adminSection.classList.remove('hidden');
      document.getElementById('participant-section').classList.add('hidden');
    } else {
      adminSection.classList.add('hidden');
      document.getElementById('participant-section').classList.remove('hidden');
    }
    return;
  }
  // Show admin section with login modal
  document.getElementById('admin-section').classList.remove('hidden');
  document.getElementById('participant-section').classList.add('hidden');
  document.getElementById('admin-login-modal').classList.remove('hidden');
  document.getElementById('admin-dashboard').classList.add('hidden');
  document.getElementById('admin-username').value = '';
  document.getElementById('admin-password').value = '';
  document.getElementById('admin-login-error').classList.add('hidden');
});

/* --- Admin Login --- */
document.getElementById('admin-login-btn').addEventListener('click', attemptAdminLogin);
document.getElementById('admin-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') attemptAdminLogin();
});

function attemptAdminLogin() {
  const u = document.getElementById('admin-username').value.trim();
  const p = document.getElementById('admin-password').value.trim();
  if (u === ADMIN_USER && p === ADMIN_PASS) {
    isAdminLoggedIn = true;
    document.getElementById('admin-login-modal').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    document.getElementById('admin-login-error').classList.add('hidden');
    renderAdminQuestions();
    showToast('✅ Logged in as Admin');
  } else {
    document.getElementById('admin-login-error').classList.remove('hidden');
  }
}

/* --- Cancel Login --- */
document.getElementById('admin-login-cancel').addEventListener('click', () => {
  document.getElementById('admin-section').classList.add('hidden');
  document.getElementById('participant-section').classList.remove('hidden');
});

/* --- Admin Logout --- */
document.getElementById('admin-logout-btn').addEventListener('click', () => {
  isAdminLoggedIn = false;
  document.getElementById('admin-section').classList.add('hidden');
  document.getElementById('participant-section').classList.remove('hidden');
  showToast('👋 Logged out.');
});

/* --- Preview Survey (admin) --- */
document.getElementById('preview-survey-btn').addEventListener('click', () => {
  const questions = getQuestions();
  if (questions.length === 0) {
    showToast('⚠️ No questions to preview.'); return;
  }
  participantInfo = { name: 'Admin Preview', email: 'admin@preview.com' };
  participantAnswers = {};
  currentQuestionIndex = 0;
  document.getElementById('admin-section').classList.add('hidden');
  document.getElementById('participant-section').classList.remove('hidden');
  showScreen('survey-screen');
  renderQuestion();
  showToast('👁 Previewing as participant...');
});

/* --- Tabs --- */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => { t.classList.remove('active'); t.classList.add('hidden'); });
    btn.classList.add('active');
    const targetId = btn.getAttribute('data-tab');
    const target = document.getElementById(targetId);
    target.classList.remove('hidden');
    target.classList.add('active');
    if (targetId === 'responses-tab') renderResponses();
    if (targetId === 'questions-tab') renderAdminQuestions();
  });
});

/* ===== RENDER ADMIN QUESTIONS ===== */
function renderAdminQuestions() {
  const questions = getQuestions();
  const list = document.getElementById('questions-list');
  list.innerHTML = '';

  if (questions.length === 0) {
    list.innerHTML = '<div class="empty-state">No questions yet. Click "+ Add Question" to begin.</div>';
    return;
  }

  questions.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'question-card';

    const left = document.createElement('div');
    left.className = 'question-card-left';
    left.innerHTML = `
      <div class="q-num">Q${idx + 1}</div>
      <div class="q-text">${escapeHtml(q.questionText)}</div>
      <div class="q-type">${q.type === 'mcq' ? `🔘 MCQ (${q.options.length} options)` : '📝 Paragraph'}</div>
    `;

    const actions = document.createElement('div');
    actions.className = 'question-card-actions';

    const upBtn = createBtn('⬆', 'btn-secondary', () => moveQuestion(idx, -1));
    const downBtn = createBtn('⬇', 'btn-secondary', () => moveQuestion(idx, 1));
    const editBtn = createBtn('✏️ Edit', 'btn-primary', () => openEditModal(q.id));
    const delBtn = createBtn('🗑 Delete', 'btn-danger', () => openDeleteModal(q.id));

    upBtn.disabled = idx === 0;
    downBtn.disabled = idx === questions.length - 1;
    upBtn.style.opacity = idx === 0 ? '0.4' : '1';
    downBtn.style.opacity = idx === questions.length - 1 ? '0.4' : '1';

    [upBtn, downBtn, editBtn, delBtn].forEach(b => actions.appendChild(b));
    card.appendChild(left);
    card.appendChild(actions);
    list.appendChild(card);
  });
}

function createBtn(text, cls, fn) {
  const b = document.createElement('button');
  b.className = `btn ${cls}`;
  b.innerHTML = text;
  b.addEventListener('click', fn);
  return b;
}

/* --- Move Question Up/Down --- */
function moveQuestion(idx, dir) {
  const qs = getQuestions();
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= qs.length) return;
  [qs[idx], qs[newIdx]] = [qs[newIdx], qs[idx]];
  saveQuestions(qs);
  renderAdminQuestions();
  showToast('↕️ Question reordered.');
}

/* ===== ADD QUESTION MODAL ===== */
document.getElementById('add-question-btn').addEventListener('click', () => {
  openAddModal();
});

function openAddModal() {
  document.getElementById('modal-title').textContent = 'Add Question';
  document.getElementById('edit-question-id').value = '';
  document.getElementById('modal-question-text').value = '';
  document.getElementById('modal-question-type').value = 'mcq';
  renderModalOptions([]);
  toggleMcqSection('mcq');
  document.getElementById('question-modal').classList.remove('hidden');
}

function openEditModal(id) {
  const qs = getQuestions();
  const q = qs.find(x => x.id === id);
  if (!q) return;
  document.getElementById('modal-title').textContent = 'Edit Question';
  document.getElementById('edit-question-id').value = q.id;
  document.getElementById('modal-question-text').value = q.questionText;
  document.getElementById('modal-question-type').value = q.type;
  renderModalOptions(q.type === 'mcq' ? q.options : []);
  toggleMcqSection(q.type);
  document.getElementById('question-modal').classList.remove('hidden');
}

document.getElementById('modal-question-type').addEventListener('change', function() {
  toggleMcqSection(this.value);
});

function toggleMcqSection(type) {
  const sec = document.getElementById('mcq-options-section');
  if (type === 'mcq') {
    sec.style.display = 'block';
    const opts = getModalOptions();
    if (opts.length === 0) renderModalOptions(['', '']); // start with 2 blank
  } else {
    sec.style.display = 'none';
  }
}

function renderModalOptions(options) {
  const list = document.getElementById('options-list');
  list.innerHTML = '';
  options.forEach(opt => addOptionRow(opt));
}

function addOptionRow(value = '') {
  const list = document.getElementById('options-list');
  const row = document.createElement('div');
  row.className = 'option-row';
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Option text...';
  input.value = value;
  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-option-btn';
  removeBtn.textContent = '✕';
  removeBtn.addEventListener('click', () => {
    if (getModalOptions().length <= 1) { showToast('⚠️ Need at least 1 option.'); return; }
    row.remove();
  });
  row.appendChild(input);
  row.appendChild(removeBtn);
  list.appendChild(row);
}

document.getElementById('add-option-btn').addEventListener('click', () => {
  addOptionRow('');
});

function getModalOptions() {
  return Array.from(document.querySelectorAll('#options-list .option-row input')).map(i => i.value);
}

/* --- Save Question --- */
document.getElementById('save-question-btn').addEventListener('click', () => {
  const text = document.getElementById('modal-question-text').value.trim();
  const type = document.getElementById('modal-question-type').value;
  if (!text) { showToast('⚠️ Question text is required.'); return; }

  let options = [];
  if (type === 'mcq') {
    options = getModalOptions().map(o => o.trim()).filter(o => o !== '');
    if (options.length < 2) { showToast('⚠️ MCQ needs at least 2 options.'); return; }
  }

  const editId = document.getElementById('edit-question-id').value;
  const qs = getQuestions();

  if (editId) {
    // Edit existing
    const idx = qs.findIndex(q => q.id === editId);
    if (idx > -1) {
      qs[idx].questionText = text;
      qs[idx].type = type;
      qs[idx].options = options;
    }
    showToast('✅ Question updated.');
  } else {
    // Add new
    qs.push({ id: generateId(), questionText: text, type, options });
    showToast('✅ Question added.');
  }

  saveQuestions(qs);
  document.getElementById('question-modal').classList.add('hidden');
  renderAdminQuestions();
});

/* --- Cancel Question Modal --- */
document.getElementById('cancel-question-btn').addEventListener('click', () => {
  document.getElementById('question-modal').classList.add('hidden');
});

/* ===== DELETE MODAL ===== */
function openDeleteModal(id) {
  deleteTargetId = id;
  document.getElementById('delete-modal').classList.remove('hidden');
}

document.getElementById('confirm-delete-btn').addEventListener('click', () => {
  if (!deleteTargetId) return;
  let qs = getQuestions();
  qs = qs.filter(q => q.id !== deleteTargetId);
  saveQuestions(qs);
  deleteTargetId = null;
  document.getElementById('delete-modal').classList.add('hidden');
  renderAdminQuestions();
  showToast('🗑 Question deleted.');
});

document.getElementById('cancel-delete-btn').addEventListener('click', () => {
  deleteTargetId = null;
  document.getElementById('delete-modal').classList.add('hidden');
});

/* ===== RESPONSES TAB ===== */
function renderResponses() {
  const responses = getResponses();
  const container = document.getElementById('responses-container');
  container.innerHTML = '';

  if (responses.length === 0) {
    container.innerHTML = '<div class="empty-state">No responses submitted yet.</div>';
    return;
  }

  const questions = getQuestions();

  const wrapper = document.createElement('div');
  wrapper.className = 'responses-table-wrapper';

  const table = document.createElement('table');

  // Build header row
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['#', 'Name', 'Email', 'Submitted At', ...questions.map((q, i) => `Q${i+1}`)].forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Build body rows
  const tbody = document.createElement('tbody');
  responses.forEach((resp, rowIdx) => {
    const tr = document.createElement('tr');
    const cells = [
      rowIdx + 1,
      resp.participant.name,
      resp.participant.email,
      resp.submittedAt
    ];

    cells.forEach(c => {
      const td = document.createElement('td');
      td.textContent = c;
      tr.appendChild(td);
    });

    // Answers per question (match by question order)
    questions.forEach(q => {
      const td = document.createElement('td');
      const ans = resp.answers.find(a => a.questionId === q.id);
      td.textContent = ans ? (ans.answer || '—') : '—';
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrapper.appendChild(table);
  container.appendChild(wrapper);
}

/* --- Export Responses as JSON --- */
document.getElementById('export-responses-btn').addEventListener('click', () => {
  const responses = getResponses();
  if (responses.length === 0) { showToast('⚠️ No responses to export.'); return; }
  const blob = new Blob([JSON.stringify(responses, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `survey_responses_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('⬇️ Responses exported as JSON.');
});

/* --- Clear All Responses --- */
document.getElementById('clear-responses-btn').addEventListener('click', () => {
  if (getResponses().length === 0) { showToast('⚠️ No responses to clear.'); return; }
  if (!confirm('Are you sure you want to delete ALL responses? This cannot be undone.')) return;
  saveResponses([]);
  renderResponses();
  showToast('🗑 All responses cleared.');
});

/* ===== UTILITY ===== */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/* ===== CLOSE MODALS ON OVERLAY CLICK ===== */
document.getElementById('question-modal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.add('hidden');
});
document.getElementById('delete-modal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.add('hidden');
});

/* ===== INIT ===== */
// Seed with sample questions if localStorage is empty
(function init() {
  const qs = getQuestions();
  if (qs.length === 0) {
    const sampleQuestions = [
      {
        id: generateId(),
        questionText: 'How would you rate your overall experience?',
        type: 'mcq',
        options: ['Excellent', 'Good', 'Average', 'Poor']
      },
      {
        id: generateId(),
        questionText: 'What is your preferred mode of communication?',
        type: 'mcq',
        options: ['Email', 'Phone', 'Chat', 'In-person']
      },
      {
        id: generateId(),
        questionText: 'Please share any additional feedback or suggestions.',
        type: 'paragraph',
        options: []
      }
    ];
    saveQuestions(sampleQuestions);
  }
  showScreen('welcome-screen');
})();