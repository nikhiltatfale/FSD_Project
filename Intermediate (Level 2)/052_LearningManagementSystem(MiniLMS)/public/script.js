let authToken = null;
let studentName = '';
let studentId = null;
let isAdminSession = false;
let currentCourseId = null;
let quizData = { questions: [], answers: [], current: 0, timer: null, courseId: null };
let prevPage = null;

// ─── Routing: check URL for /admin ──────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
    showAdminPanel();
  } else {
    show('auth-screen');
  }
});
function show(id) { document.getElementById(id)?.classList.remove('hidden'); }
/** Hide an element by id */
function hide(id) { document.getElementById(id)?.classList.add('hidden'); }
/** Set message in a msg div */
function setMsg(id, text, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = `msg ${type === 'ok' ? 'ok' : 'error'}`;
  el.classList.remove('hidden');
}
/** API helper */
async function api(method, url, body = null, token = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  const t = token || authToken;
  if (t) opts.headers['x-auth-token'] = t;
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Request failed');
  return data;
}
function showAuthTab(tab) {
  hide('tab-login'); hide('tab-register');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  show(`tab-${tab}`);
  document.querySelectorAll('.tab-btn')[tab === 'login' ? 0 : 1].classList.add('active');
}

async function registerStudent() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  if (!name || !email || !password) return setMsg('register-msg', 'All fields are required');
  try {
    const data = await api('POST', '/register', { name, email, password });
    setMsg('register-msg', 'Registration successful! Please login.', 'ok');
    setTimeout(() => showAuthTab('login'), 1200);
  } catch (e) { setMsg('register-msg', e.message); }
}

async function loginStudent() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) return setMsg('login-msg', 'Email and password required');
  try {
    const data = await api('POST', '/login', { email, password });
    authToken = data.token;
    studentName = data.name;
    studentId = data.studentId;
    startStudentApp();
  } catch (e) { setMsg('login-msg', e.message); }
}

function startStudentApp() {
  hide('auth-screen');
  show('student-app');
  document.getElementById('student-name-display').textContent = studentName;
  document.getElementById('dash-name').textContent = studentName;
  showPage('dashboard');
}

function logout() {
  authToken = null; studentName = ''; studentId = null;
  hide('student-app');
  // Reset sidebar on mobile
  document.getElementById('sidebar')?.classList.remove('open');
  show('auth-screen');
}
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('#main-content .page').forEach(p => {
    p.classList.remove('active');
  });
  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.add('active');

  // Update nav active state
  document.querySelectorAll('#sidebar .nav-link').forEach(l => l.classList.remove('active'));
  const activeLink = [...document.querySelectorAll('#sidebar .nav-link')]
    .find(l => l.getAttribute('onclick')?.includes(pageId));
  if (activeLink) activeLink.classList.add('active');

  // Close mobile sidebar
  document.getElementById('sidebar')?.classList.remove('open');

  // Load page content
  if (pageId === 'dashboard') loadDashboard();
  else if (pageId === 'catalog') loadCatalog();
  else if (pageId === 'my-courses') loadMyCourses();
  else if (pageId === 'quiz-history') loadQuizHistory();
}

function goBack() {
  if (prevPage) showPage(prevPage);
  else showPage('my-courses');
}

function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}
async function loadDashboard() {
  try {
    const enrollments = await api('GET', '/my-enrollments');
    const totalCourses = enrollments.length;
    const completed = enrollments.filter(e => e.progressPct === 100).length;
    const avgScore = enrollments.filter(e => e.quizScore !== null)
      .reduce((sum, e, _, arr) => sum + (e.quizScore / e.quizTotal * 100) / arr.length, 0);

    // Stats
    document.getElementById('dash-stats').innerHTML = `
      <div class="stat-card"><div class="stat-num">${totalCourses}</div><div class="stat-label">Enrolled Courses</div></div>
      <div class="stat-card"><div class="stat-num">${completed}</div><div class="stat-label">Completed</div></div>
      <div class="stat-card"><div class="stat-num">${enrollments.filter(e=>e.quizScore!==null).length}</div><div class="stat-label">Quizzes Taken</div></div>
      ${enrollments.filter(e=>e.quizScore!==null).length ? `<div class="stat-card"><div class="stat-num">${Math.round(avgScore)}%</div><div class="stat-label">Avg Quiz Score</div></div>` : ''}
    `;

    // Course cards
    const container = document.getElementById('dash-courses');
    if (!enrollments.length) {
      container.innerHTML = `<p style="color:var(--text-muted)">You haven't enrolled in any courses yet. <a href="#" onclick="showPage('catalog')">Browse catalog →</a></p>`;
      return;
    }
    container.innerHTML = enrollments.map(e => courseProgressCard(e)).join('');
  } catch (e) { console.error(e); }
}

function courseProgressCard(e) {
  return `
    <div class="course-card">
      <h3>${e.title}</h3>
      <div class="meta">👤 ${e.instructor}</div>
      <div class="progress-wrap">
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${e.progressPct}%"></div></div>
        <div class="progress-label">${e.completedLessons}/${e.lessonCount} lessons • ${e.progressPct}%</div>
      </div>
      ${e.quizScore !== null ? `<div class="tag">Quiz: ${e.quizScore}/${e.quizTotal}</div>` : ''}
      <div class="card-footer">
        <button class="btn btn-primary btn-sm" onclick="showCoursePage(${e.courseId})">Continue →</button>
      </div>
    </div>
  `;
}
async function loadCatalog() {
  try {
    const [courses, enrollments] = await Promise.all([
      api('GET', '/courses'),
      api('GET', '/my-enrollments')
    ]);
    const enrolledIds = enrollments.map(e => e.courseId);
    document.getElementById('catalog-courses').innerHTML = courses.map(c => `
      <div class="course-card">
        <h3>${c.title}</h3>
        <div class="meta">👤 ${c.instructor} &nbsp;•&nbsp; <span class="tag">${c.category}</span></div>
        <div class="desc">${c.description}</div>
        <div class="meta">📖 ${c.lessonCount} lessons &nbsp;${c.hasQuiz ? '&nbsp;📝 Quiz included' : ''}</div>
        <div class="card-footer">
          ${enrolledIds.includes(c.id)
            ? `<button class="btn btn-secondary btn-sm" onclick="showCoursePage(${c.id})">View Course</button><span class="tag">Enrolled</span>`
            : `<button class="btn btn-primary btn-sm" onclick="enrollCourse(${c.id})">Enroll</button>`
          }
        </div>
      </div>
    `).join('');
  } catch (e) { console.error(e); }
}

async function enrollCourse(courseId) {
  try {
    await api('POST', '/enroll', { courseId });
    alert('Enrolled successfully!');
    loadCatalog();
  } catch (e) { alert(e.message); }
}
async function loadMyCourses() {
  try {
    const enrollments = await api('GET', '/my-enrollments');
    const container = document.getElementById('my-courses-list');
    if (!enrollments.length) {
      container.innerHTML = `<p style="color:var(--text-muted)">No enrolled courses. <a href="#" onclick="showPage('catalog')">Browse catalog →</a></p>`;
      return;
    }
    container.innerHTML = enrollments.map(e => courseProgressCard(e)).join('');
  } catch (e) { console.error(e); }
}
async function showCoursePage(courseId) {
  currentCourseId = courseId;
  prevPage = 'my-courses';
  try {
    const [course, progData, enrollments] = await Promise.all([
      api('GET', `/course/${courseId}`),
      api('GET', `/my-progress/${courseId}`),
      api('GET', '/my-enrollments')
    ]);
    const completedLessons = progData.completedLessons || [];
    const enrollment = enrollments.find(e => e.courseId === courseId);
    const progressPct = enrollment ? enrollment.progressPct : 0;

    document.getElementById('course-detail-content').innerHTML = `
      <div class="course-detail-header">
        <h1>${course.title}</h1>
        <p style="color:var(--text-muted);margin-top:4px">👤 ${course.instructor} &nbsp;•&nbsp; <span class="tag">${course.category}</span></p>
        <p style="margin-top:8px">${course.description}</p>
        <div class="progress-wrap" style="margin-top:14px">
          <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${progressPct}%"></div></div>
          <div class="progress-label">${progressPct}% Complete</div>
        </div>
      </div>

      <h2 class="section-title">Lessons (${course.lessons.length})</h2>
      <ul class="lessons-list">
        ${course.lessons.map(l => `
          <li class="lesson-item" onclick="showLesson(${courseId}, ${l.id})">
            <span class="lesson-title">📄 ${l.title}</span>
            ${completedLessons.includes(l.id) ? '<span class="done-badge">✓ Done</span>' : '<span style="font-size:12px;color:var(--text-muted)">Start →</span>'}
          </li>
        `).join('')}
      </ul>

      ${course.quiz.length ? `
        <div style="margin-top:24px">
          <h2 class="section-title">Quiz (${course.quiz.length} questions)</h2>
          ${enrollment?.quizScore !== null && enrollment?.quizScore !== undefined
            ? `<p>Your score: <strong>${enrollment.quizScore}/${enrollment.quizTotal}</strong> &nbsp; <button class="btn btn-secondary btn-sm" onclick="startQuiz(${courseId})">Retake Quiz</button></p>`
            : `<button class="btn btn-primary" onclick="startQuiz(${courseId})">Take Quiz</button>`
          }
        </div>
      ` : ''}
    `;

    // Hide all pages, show course-detail
    document.querySelectorAll('#main-content .page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-course-detail').classList.add('active');
  } catch (e) { alert('Error loading course: ' + e.message); }
}
async function showLesson(courseId, lessonId) {
  currentCourseId = courseId;
  try {
    const course = await api('GET', `/course/${courseId}`);
    const lesson = course.lessons.find(l => l.id === lessonId);
    const progData = await api('GET', `/my-progress/${courseId}`);
    const isDone = progData.completedLessons.includes(lessonId);

    document.getElementById('lesson-content').innerHTML = `
      <div class="lesson-body">
        <h2>${lesson.title}</h2>
        ${lesson.videoUrl ? `<iframe src="${lesson.videoUrl}" allowfullscreen></iframe>` : ''}
        <p>${lesson.content}</p>
        <div class="lesson-actions">
          ${isDone
            ? `<button class="btn btn-success" disabled>✓ Completed</button>`
            : `<button class="btn btn-primary" onclick="markLessonDone(${courseId}, ${lessonId})">Mark as Completed</button>`
          }
          <button class="btn btn-secondary" onclick="showCoursePage(${courseId})">Back to Course</button>
        </div>
      </div>
    `;

    document.querySelectorAll('#main-content .page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-lesson').classList.add('active');
  } catch (e) { alert('Error loading lesson: ' + e.message); }
}

async function markLessonDone(courseId, lessonId) {
  try {
    await api('POST', '/progress', { courseId, lessonId });
    // Refresh lesson view to show completed
    showLesson(courseId, lessonId);
  } catch (e) { alert(e.message); }
}
async function startQuiz(courseId) {
  currentCourseId = courseId;
  try {
    const course = await api('GET', `/course/${courseId}`);
    quizData = {
      questions: course.quiz,
      answers: new Array(course.quiz.length).fill(null),
      current: 0,
      timer: null,
      courseId,
      timeLeft: 30
    };

    document.querySelectorAll('#main-content .page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-quiz').classList.add('active');
    renderQuestion();
  } catch (e) { alert('Error loading quiz: ' + e.message); }
}

function renderQuestion() {
  const q = quizData.questions[quizData.current];
  const total = quizData.questions.length;
  const idx = quizData.current;
  quizData.timeLeft = 30;

  document.getElementById('quiz-content').innerHTML = `
    <div class="quiz-wrap">
      <div class="quiz-header">
        <h2>Quiz – Question ${idx + 1} of ${total}</h2>
        <div class="quiz-progress-info">Answer all questions to submit</div>
      </div>
      <div class="question-card">
        <div class="timer-text" id="timer-text">⏱ Time left: <span id="timer-val">30</span>s</div>
        <div class="timer-bar-bg"><div class="timer-bar-fill" id="timer-bar" style="width:100%"></div></div>
        <h3>${q.question}</h3>
        <ul class="options-list">
          ${q.options.map((opt, i) => `
            <li>
              <button class="option-btn ${quizData.answers[idx] === i ? 'selected' : ''}"
                onclick="selectOption(${i})" id="opt-btn-${i}">
                ${String.fromCharCode(65 + i)}. ${opt}
              </button>
            </li>
          `).join('')}
        </ul>
        <div class="quiz-nav">
          ${idx > 0 ? `<button class="btn btn-secondary btn-sm" onclick="quizNav(-1)">← Prev</button>` : ''}
          ${idx < total - 1 ? `<button class="btn btn-primary btn-sm" onclick="quizNav(1)">Next →</button>` : ''}
          ${idx === total - 1 ? `<button class="btn btn-success btn-sm" onclick="submitQuiz()">Submit Quiz</button>` : ''}
          <span style="flex:1"></span>
          <span style="font-size:12px;color:var(--text-muted)">${quizData.answers.filter(a=>a!==null).length}/${total} answered</span>
        </div>
      </div>
    </div>
  `;

  // Start countdown timer
  clearInterval(quizData.timer);
  quizData.timer = setInterval(() => {
    quizData.timeLeft--;
    const tv = document.getElementById('timer-val');
    const tb = document.getElementById('timer-bar');
    if (tv) tv.textContent = quizData.timeLeft;
    if (tb) tb.style.width = `${(quizData.timeLeft / 30) * 100}%`;
    if (quizData.timeLeft <= 0) {
      clearInterval(quizData.timer);
      // Auto advance or submit
      if (quizData.current < quizData.questions.length - 1) quizNav(1);
      else submitQuiz();
    }
  }, 1000);
}

function selectOption(i) {
  quizData.answers[quizData.current] = i;
  // Highlight selected
  document.querySelectorAll('.option-btn').forEach((btn, idx) => {
    btn.classList.toggle('selected', idx === i);
  });
  // Update answered count
  const span = document.querySelector('.quiz-nav span:last-child');
  if (span) span.textContent = `${quizData.answers.filter(a=>a!==null).length}/${quizData.questions.length} answered`;
}

function quizNav(dir) {
  clearInterval(quizData.timer);
  quizData.current += dir;
  renderQuestion();
}

async function submitQuiz() {
  clearInterval(quizData.timer);
  const unanswered = quizData.answers.filter(a => a === null).length;
  if (unanswered > 0) {
    if (!confirm(`${unanswered} question(s) unanswered. Submit anyway?`)) { renderQuestion(); return; }
  }
  try {
    const result = await api('POST', '/quiz-submit', { courseId: quizData.courseId, answers: quizData.answers });
    renderQuizResult(result);
  } catch (e) { alert('Error submitting quiz: ' + e.message); }
}

function renderQuizResult(result) {
  const pct = Math.round((result.score / result.total) * 100);
  document.getElementById('quiz-content').innerHTML = `
    <div class="quiz-result-card">
      <div class="result-score">${pct}%</div>
      <div class="result-label">You scored ${result.score} out of ${result.total}</div>
      <div style="margin-top:16px">
        <button class="btn btn-primary btn-sm" onclick="showCoursePage(${quizData.courseId})">Back to Course</button>
        <button class="btn btn-secondary btn-sm" onclick="startQuiz(${quizData.courseId})">Retake</button>
      </div>
      <div class="result-details">
        <h3 style="margin:16px 0 8px;font-size:14px">Review:</h3>
        ${result.details.map((d, i) => `
          <div class="q-row ${d.correct ? 'correct-q' : 'wrong-q'}">
            ${d.correct ? '✓' : '✗'} Q${i+1}: ${d.question}
            ${!d.correct ? `<br><small>Your answer: ${quizData.questions[i].options[d.selected] || 'No answer'} | Correct: ${quizData.questions[i].options[d.correctAnswer]}</small>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
async function loadQuizHistory() {
  try {
    const results = await api('GET', '/my-quiz-results');
    const container = document.getElementById('quiz-history-list');
    if (!results.length) {
      container.innerHTML = `<p style="color:var(--text-muted)">No quiz attempts yet.</p>`;
      return;
    }
    container.innerHTML = results.map(r => `
      <div class="quiz-history-card">
        <h3>${r.courseTitle}</h3>
        <div style="font-size:13px;color:var(--text-muted)">Score: <strong>${r.score}/${r.total} (${Math.round(r.score/r.total*100)}%)</strong></div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Submitted: ${new Date(r.submittedAt).toLocaleString()}</div>
        <div class="progress-wrap" style="margin-top:8px">
          <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${Math.round(r.score/r.total*100)}%;background:${r.score/r.total>=0.7?'var(--success)':'var(--danger)'}"></div></div>
        </div>
      </div>
    `).join('');
  } catch (e) { console.error(e); }
}
function showAdminPanel() {
  hide('auth-screen');
  hide('student-app');
  show('admin-app');
  hide('admin-dashboard');
  show('admin-login-screen');
}

function showAuthScreen() {
  hide('admin-app');
  show('auth-screen');
  history.pushState({}, '', '/');
  return false;
}

async function adminLogin() {
  const username = document.getElementById('admin-user').value.trim();
  const password = document.getElementById('admin-pass').value;
  if (!username || !password) return setMsg('admin-login-msg', 'Enter credentials');
  try {
    const data = await api('POST', '/admin/login', { username, password });
    authToken = data.token;
    isAdminSession = true;
    hide('admin-login-screen');
    show('admin-dashboard');
    adminShowPage('admin-overview');
  } catch (e) { setMsg('admin-login-msg', e.message); }
}

function adminLogout() {
  authToken = null; isAdminSession = false;
  hide('admin-dashboard');
  show('admin-login-screen');
  document.getElementById('admin-user').value = '';
  document.getElementById('admin-pass').value = '';
}

function adminShowPage(pageId) {
  document.querySelectorAll('#admin-main .admin-page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId)?.classList.add('active');
  document.querySelectorAll('#admin-sidebar .nav-link').forEach(l => l.classList.remove('active'));
  const link = [...document.querySelectorAll('#admin-sidebar .nav-link')].find(l => l.getAttribute('onclick')?.includes(pageId));
  if (link) link.classList.add('active');
  document.getElementById('admin-sidebar')?.classList.remove('open');

  if (pageId === 'admin-overview') loadAdminOverview();
  else if (pageId === 'admin-courses') loadAdminCourses();
  else if (pageId === 'admin-students') loadAdminStudents();
  else if (pageId === 'admin-enrollments') loadAdminEnrollments();
  else if (pageId === 'admin-quiz-results') loadAdminQuizResults();
}

function toggleAdminSidebar() {
  document.getElementById('admin-sidebar')?.classList.toggle('open');
}

async function loadAdminOverview() {
  try {
    const stats = await api('GET', '/admin/stats');
    document.getElementById('admin-stats-cards').innerHTML = `
      <div class="stat-card"><div class="stat-num">${stats.totalStudents}</div><div class="stat-label">Total Students</div></div>
      <div class="stat-card"><div class="stat-num">${stats.totalCourses}</div><div class="stat-label">Total Courses</div></div>
      <div class="stat-card"><div class="stat-num">${stats.totalEnrollments}</div><div class="stat-label">Total Enrollments</div></div>
      <div class="stat-card"><div class="stat-num">${stats.totalQuizAttempts}</div><div class="stat-label">Quiz Attempts</div></div>
      <div class="stat-card"><div class="stat-num">${stats.averageQuizScore}%</div><div class="stat-label">Avg Quiz Score</div></div>
    `;

    // Charts
    const [courses, enrollmentsData] = await Promise.all([
      api('GET', '/admin/courses'),
      api('GET', '/admin/enrollments')
    ]);
    // Enrollment per course bar chart
    const enrollPerCourse = {};
    enrollmentsData.forEach(e => { enrollPerCourse[e.course] = (enrollPerCourse[e.course] || 0) + 1; });
    const maxEnroll = Math.max(1, ...Object.values(enrollPerCourse));

    document.getElementById('admin-chart-area').innerHTML = `
      <div class="chart-card">
        <h3>Enrollments per Course</h3>
        <div class="bar-chart">
          ${Object.entries(enrollPerCourse).map(([title, count]) => `
            <div class="bar-row">
              <span class="bar-label" title="${title}">${title}</span>
              <div class="bar-track"><div class="bar-fill" style="width:${Math.round(count/maxEnroll*100)}%"></div></div>
              <span class="bar-val">${count}</span>
            </div>
          `).join('') || '<p style="color:var(--text-muted);font-size:13px">No enrollments yet</p>'}
        </div>
      </div>
      <div class="chart-card">
        <h3>System Summary</h3>
        <div style="font-size:13px;display:flex;flex-direction:column;gap:10px">
          <div>📚 Courses: <strong>${stats.totalCourses}</strong></div>
          <div>👨‍🎓 Students: <strong>${stats.totalStudents}</strong></div>
          <div>📋 Enrollments: <strong>${stats.totalEnrollments}</strong></div>
          <div>📝 Quiz Attempts: <strong>${stats.totalQuizAttempts}</strong></div>
          <div>⭐ Avg Score: <strong>${stats.averageQuizScore}%</strong></div>
        </div>
      </div>
    `;
  } catch (e) { console.error(e); }
}

async function loadAdminCourses() {
  try {
    const courses = await api('GET', '/admin/courses');
    document.getElementById('admin-courses-list').innerHTML = courses.map(c => `
      <div class="admin-course-card">
        <h3>${c.title}</h3>
        <div class="meta">👤 ${c.instructor} &nbsp;•&nbsp; ${c.category} &nbsp;•&nbsp; ${c.lessons.length} lessons &nbsp;•&nbsp; ${c.quiz.length} quiz Qs</div>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:10px">${c.description}</p>
        <div class="action-row">
          <button class="btn btn-secondary btn-sm" onclick="openEditCourse(${c.id})">✏ Edit</button>
          <button class="btn btn-primary btn-sm" onclick="openAddLesson(${c.id})">+ Lesson</button>
          <button class="btn btn-secondary btn-sm" onclick="openAddQuiz(${c.id})">+ Quiz Q</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCourse(${c.id})">🗑 Delete</button>
        </div>
        ${c.lessons.length ? `
          <div style="margin-top:12px">
            <strong style="font-size:12px">Lessons:</strong>
            ${c.lessons.map(l => `<div style="font-size:12px;padding:4px 0;border-bottom:1px solid var(--border)">📄 ${l.title}</div>`).join('')}
          </div>` : ''}
        ${c.quiz.length ? `
          <div style="margin-top:12px">
            <strong style="font-size:12px">Quiz Questions:</strong>
            ${c.quiz.map(q => `<div style="font-size:12px;padding:4px 0;border-bottom:1px solid var(--border)">❓ ${q.question}</div>`).join('')}
          </div>` : ''}
      </div>
    `).join('') || '<p style="color:var(--text-muted)">No courses yet.</p>';
  } catch (e) { console.error(e); }
}

function openAddCourse() {
  document.getElementById('modal-course-title').textContent = 'Add Course';
  document.getElementById('edit-course-id').value = '';
  document.getElementById('course-title-input').value = '';
  document.getElementById('course-desc-input').value = '';
  document.getElementById('course-instructor-input').value = '';
  document.getElementById('course-category-input').value = '';
  openModal('modal-add-course');
}

function openEditCourse(courseId) {
  // Get course from DOM... or re-fetch
  api('GET', `/course/${courseId}`).then(c => {
    document.getElementById('modal-course-title').textContent = 'Edit Course';
    document.getElementById('edit-course-id').value = c.id;
    document.getElementById('course-title-input').value = c.title;
    document.getElementById('course-desc-input').value = c.description;
    document.getElementById('course-instructor-input').value = c.instructor;
    document.getElementById('course-category-input').value = c.category;
    openModal('modal-add-course');
  });
}

async function saveCourse() {
  const id = document.getElementById('edit-course-id').value;
  const body = {
    title: document.getElementById('course-title-input').value.trim(),
    description: document.getElementById('course-desc-input').value.trim(),
    instructor: document.getElementById('course-instructor-input').value.trim(),
    category: document.getElementById('course-category-input').value.trim()
  };
  if (!body.title || !body.description || !body.instructor) return setMsg('course-modal-msg', 'Title, description, instructor required');
  try {
    if (id) await api('PUT', `/admin/course/${id}`, body);
    else await api('POST', '/admin/course', body);
    setMsg('course-modal-msg', 'Saved!', 'ok');
    setTimeout(() => { closeModal('modal-add-course'); loadAdminCourses(); }, 900);
  } catch (e) { setMsg('course-modal-msg', e.message); }
}

async function deleteCourse(id) {
  if (!confirm('Delete this course? This cannot be undone.')) return;
  try {
    await api('DELETE', `/admin/course/${id}`);
    loadAdminCourses();
  } catch (e) { alert(e.message); }
}

function openAddLesson(courseId) {
  document.getElementById('lesson-course-id').value = courseId;
  document.getElementById('lesson-title-input').value = '';
  document.getElementById('lesson-content-input').value = '';
  document.getElementById('lesson-video-input').value = '';
  openModal('modal-add-lesson');
}

async function saveLesson() {
  const courseId = document.getElementById('lesson-course-id').value;
  const body = {
    title: document.getElementById('lesson-title-input').value.trim(),
    content: document.getElementById('lesson-content-input').value.trim(),
    videoUrl: document.getElementById('lesson-video-input').value.trim()
  };
  if (!body.title || !body.content) return setMsg('lesson-modal-msg', 'Title and content required');
  try {
    await api('POST', `/admin/course/${courseId}/lesson`, body);
    setMsg('lesson-modal-msg', 'Lesson added!', 'ok');
    setTimeout(() => { closeModal('modal-add-lesson'); loadAdminCourses(); }, 900);
  } catch (e) { setMsg('lesson-modal-msg', e.message); }
}

function openAddQuiz(courseId) {
  document.getElementById('quiz-course-id').value = courseId;
  ['quiz-question-input','quiz-opt0','quiz-opt1','quiz-opt2','quiz-opt3','quiz-answer-input'].forEach(id => document.getElementById(id).value = '');
  openModal('modal-add-quiz');
}

async function saveQuizQuestion() {
  const courseId = document.getElementById('quiz-course-id').value;
  const options = [0,1,2,3].map(i => document.getElementById(`quiz-opt${i}`).value.trim()).filter(Boolean);
  const body = {
    question: document.getElementById('quiz-question-input').value.trim(),
    options,
    answer: document.getElementById('quiz-answer-input').value
  };
  if (!body.question || options.length < 2 || body.answer === '') return setMsg('quiz-modal-msg', 'Question, at least 2 options, and answer index required');
  try {
    await api('POST', `/admin/course/${courseId}/quiz`, body);
    setMsg('quiz-modal-msg', 'Question added!', 'ok');
    setTimeout(() => { closeModal('modal-add-quiz'); loadAdminCourses(); }, 900);
  } catch (e) { setMsg('quiz-modal-msg', e.message); }
}

async function loadAdminStudents() {
  try {
    const students = await api('GET', '/admin/students');
    document.getElementById('admin-students-table').innerHTML = `
      <div class="table-wrap">
        <table class="admin-table">
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Enrolled Courses</th><th>Quiz Results</th><th>Joined</th></tr></thead>
          <tbody>
            ${students.map(s => `
              <tr>
                <td>${s.id}</td>
                <td>${s.name}</td>
                <td>${s.email}</td>
                <td>${s.enrolledCourses.join(', ') || '—'}</td>
                <td>${s.quizResults.map(q => `${q.course}: ${q.score}`).join('<br>') || '—'}</td>
                <td>${new Date(s.createdAt).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (e) { console.error(e); }
}

async function loadAdminEnrollments() {
  try {
    const data = await api('GET', '/admin/enrollments');
    document.getElementById('admin-enrollments-table').innerHTML = `
      <div class="table-wrap">
        <table class="admin-table">
          <thead><tr><th>Student</th><th>Email</th><th>Course</th><th>Progress</th><th>Enrolled On</th></tr></thead>
          <tbody>
            ${data.map(e => `
              <tr>
                <td>${e.student}</td>
                <td>${e.email}</td>
                <td>${e.course}</td>
                <td>${e.progress}</td>
                <td>${new Date(e.enrolledAt).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (e) { console.error(e); }
}

async function loadAdminQuizResults() {
  try {
    const results = await api('GET', '/admin/quiz-results');
    document.getElementById('admin-quiz-results-table').innerHTML = `
      <div class="table-wrap">
        <table class="admin-table">
          <thead><tr><th>Student</th><th>Course</th><th>Score</th><th>%</th><th>Submitted</th></tr></thead>
          <tbody>
            ${results.map(r => `
              <tr>
                <td>${r.studentName}</td>
                <td>${r.courseTitle}</td>
                <td>${r.score}/${r.total}</td>
                <td>${Math.round(r.score/r.total*100)}%</td>
                <td>${new Date(r.submittedAt).toLocaleString()}</td>
              </tr>
            `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No quiz results yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch (e) { console.error(e); }
}

async function downloadData() {
  try {
    const response = await fetch('/admin/download-data', {
      headers: { 'x-auth-token': authToken }
    });
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'lms-data.json'; a.click();
    URL.revokeObjectURL(url);
  } catch (e) { alert('Download failed: ' + e.message); }
}

function openModal(id) {
  show(id);
  show('modal-overlay');
}

function closeModal(id) {
  hide(id);
  hide('modal-overlay');
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  hide('modal-overlay');
}

// Override the Add Course button to use openAddCourse (not openModal directly)
document.addEventListener('DOMContentLoaded', () => {
  const addCourseBtn = document.querySelector('[onclick="openModal(\'modal-add-course\')"]');
  if (addCourseBtn) addCourseBtn.setAttribute('onclick', 'openAddCourse()');
});