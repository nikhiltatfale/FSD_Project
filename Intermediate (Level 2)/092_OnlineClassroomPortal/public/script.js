let currentStudentId = null;
let currentClassCode = null;
let currentStudent = null;
let isAdminLoggedIn = false;
let currentQuizId = null;
let allData = {
  announcements: [],
  materials: [],
  assignments: [],
  quizzes: [],
  classes: [],
  submissions: [],
  quizResults: []
};

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    const modal = document.getElementById('adminModal');
    modal.classList.toggle('hidden');
  }
});

function closeAdminModal() {
  document.getElementById('adminModal').classList.add('hidden');
}

async function adminLogin() {
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;
  if (!username || !password) { alert('Please enter credentials'); return; }
  try {
    const response = await fetch('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.success) {
      isAdminLoggedIn = true;
      closeAdminModal();
      showPage('adminDashboard');
      loadAdminDashboard();
      document.getElementById('studentLoginPage').style.display = 'none';
    } else {
      alert(data.message);
    }
  } catch (error) { alert('Login failed'); }
}

function logoutAdmin() {
  isAdminLoggedIn = false;
  showPage('studentLoginPage');
  document.getElementById('studentLoginPage').style.display = 'block';
}

async function joinClass(event) {
  event.preventDefault();
  const name = document.getElementById('studentName').value;
  const email = document.getElementById('studentEmail').value;
  const classCode = document.getElementById('classCode').value;
  if (!name || !email || !classCode) { alert('Please fill all fields'); return; }
  try {
    const response = await fetch('/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, classCode })
    });
    const data = await response.json();
    if (data.success) {
      currentStudentId = data.studentId;
      currentClassCode = data.classCode;
      currentStudent = { id: currentStudentId, name, email, classCode };
      document.getElementById('studentName').value = '';
      document.getElementById('studentEmail').value = '';
      document.getElementById('classCode').value = '';
      showPage('studentDashboard');
      loadStudentDashboard();
    } else {
      alert(data.message);
    }
  } catch (error) { alert('Failed to join class'); }
}

function logout() {
  currentStudentId = null;
  currentClassCode = null;
  currentStudent = null;
  showPage('studentLoginPage');
}

function showPage(pageName) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const page = document.getElementById(pageName);
  if (page) page.classList.remove('hidden');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
}

async function loadAllData() {
  try {
    const [annRes, matRes, assRes, quizRes] = await Promise.all([
      fetch('/announcements'),
      fetch('/materials'),
      fetch('/assignments'),
      fetch('/quizzes')
    ]);
    allData.announcements = (await annRes.json()).announcements || [];
    allData.materials = (await matRes.json()).materials || [];
    allData.assignments = (await assRes.json()).assignments || [];
    allData.quizzes = (await quizRes.json()).quizzes || [];
  } catch (error) { console.error('Error loading data:', error); }
}

async function loadStudentDashboard() {
  await loadAllData();
  document.getElementById('assignmentCount').textContent = allData.assignments.length;
  document.getElementById('quizCount').textContent = allData.quizzes.length;
  renderAnnouncements('announcementsList');
}

function renderAnnouncements(elementId) {
  const container = document.getElementById(elementId);
  if (allData.announcements.length === 0) {
    container.innerHTML = '<p style="color: #999;">No announcements yet</p>';
    return;
  }
  container.innerHTML = allData.announcements.map(ann => {
    let html = '<div class="announcement-item"><div><p><strong>Pin ' + ann.text + '</strong></p></div>';
    if (elementId === 'adminAnnouncementsList') {
      html += '<button class="delete-btn" onclick="deleteAnnouncement(' + ann.id + ')">Delete</button>';
    }
    html += '</div>';
    return html;
  }).join('');
}

async function addAnnouncement() {
  const text = document.getElementById('announcementText').value;
  if (!text) { alert('Please enter an announcement'); return; }
  try {
    const response = await fetch('/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await response.json();
    if (data.success) {
      document.getElementById('announcementText').value = '';
      await loadAllData();
      renderAnnouncements('adminAnnouncementsList');
      alert('Announcement posted!');
    }
  } catch (error) { console.error('Error:', error); }
}

async function deleteAnnouncement(id) {
  if (!confirm('Delete this announcement?')) return;
  try {
    await fetch('/announcements/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await loadAllData();
    renderAnnouncements('adminAnnouncementsList');
  } catch (error) { console.error('Error:', error); }
}

function renderMaterials(elementId) {
  const container = document.getElementById(elementId);
  if (allData.materials.length === 0) {
    container.innerHTML = '<p style="color: #999;">No materials uploaded yet</p>';
    return;
  }
  container.innerHTML = allData.materials.map(mat => {
    let html = '<div class="material-card"><h3>' + mat.title + '</h3><p>' + mat.content + '</p>';
    if (elementId === 'adminMaterialsList') {
      html += '<button class="delete-btn" onclick="deleteMaterial(' + mat.id + ')">Delete</button>';
    }
    html += '</div>';
    return html;
  }).join('');
}

async function addMaterial() {
  const title = document.getElementById('materialTitle').value;
  const content = document.getElementById('materialContent').value;
  if (!title || !content) { alert('Please fill all fields'); return; }
  try {
    const response = await fetch('/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });
    const data = await response.json();
    if (data.success) {
      document.getElementById('materialTitle').value = '';
      document.getElementById('materialContent').value = '';
      await loadAllData();
      renderMaterials('adminMaterialsList');
      alert('Material uploaded!');
    }
  } catch (error) { console.error('Error:', error); }
}

async function deleteMaterial(id) {
  if (!confirm('Delete this material?')) return;
  try {
    await fetch('/materials/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await loadAllData();
    renderMaterials('adminMaterialsList');
  } catch (error) { console.error('Error:', error); }
}

function renderAssignments(elementId) {
  const container = document.getElementById(elementId);
  if (allData.assignments.length === 0) {
    container.innerHTML = '<p style="color: #999;">No assignments yet</p>';
    return;
  }
  container.innerHTML = allData.assignments.map(ass => {
    let html = '<div class="assignment-card"><h3>Assignment ' + ass.id + '</h3><p><strong>Question:</strong></p><p>' + ass.question + '</p>';
    if (elementId === 'adminAssignmentsList') {
      html += '<button class="delete-btn" onclick="deleteAssignment(' + ass.id + ')">Delete</button>';
    } else {
      html += '<textarea id="answer_' + ass.id + '" placeholder="Type your answer here..." rows="4"></textarea><button class="btn-submit" onclick="submitAssignment(' + ass.id + ')">Submit</button>';
    }
    html += '</div>';
    return html;
  }).join('');
}

async function addAssignment() {
  const question = document.getElementById('assignmentQuestion').value;
  if (!question) { alert('Please enter an assignment question'); return; }
  try {
    const response = await fetch('/assignment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    const data = await response.json();
    if (data.success) {
      document.getElementById('assignmentQuestion').value = '';
      await loadAllData();
      renderAssignments('adminAssignmentsList');
      alert('Assignment created!');
    }
  } catch (error) { console.error('Error:', error); }
}

async function submitAssignment(assignmentId) {
  const answer = document.getElementById('answer_' + assignmentId).value;
  if (!answer) { alert('Please enter an answer'); return; }
  try {
    const response = await fetch('/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: currentStudentId, assignmentId, answer })
    });
    const data = await response.json();
    if (data.success) {
      document.getElementById('answer_' + assignmentId).value = '';
      alert('Assignment submitted successfully!');
    }
  } catch (error) { console.error('Error:', error); }
}

async function deleteAssignment(id) {
  if (!confirm('Delete this assignment?')) return;
  try {
    await fetch('/assignment/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await loadAllData();
    renderAssignments('adminAssignmentsList');
  } catch (error) { console.error('Error:', error); }
}

function renderQuizzes(elementId) {
  const container = document.getElementById(elementId);
  if (allData.quizzes.length === 0) {
    container.innerHTML = '<p style="color: #999;">No quizzes yet</p>';
    return;
  }
  container.innerHTML = allData.quizzes.map(quiz => {
    let html = '<div class="quiz-card"><h3>' + quiz.title + '</h3><p><strong>Questions:</strong> ' + (quiz.questions ? quiz.questions.length : 0) + '</p><p><strong>Timer:</strong> ' + quiz.timer + ' seconds</p>';
    if (elementId === 'adminQuizzesList') {
      html += '<button class="delete-btn" onclick="deleteQuiz(' + quiz.id + ')">Delete</button>';
    } else {
      html += '<button class="btn-start" onclick="startQuiz(' + quiz.id + ')">Start Quiz</button>';
    }
    html += '</div>';
    return html;
  }).join('');
}

function startQuiz(quizId) {
  const quiz = allData.quizzes.find(q => q.id === quizId);
  if (!quiz) { alert('Quiz not found'); return; }
  currentQuizId = quizId;
  showPage('quizScreen');
  document.getElementById('quizTitle').textContent = quiz.title;
  const container = document.getElementById('questionsContainer');
  container.innerHTML = quiz.questions.map((q, idx) => {
    let html = '<div class="question-item"><h4>Question ' + (idx + 1) + ': ' + q.question + '</h4><div class="options">';
    q.options.forEach((opt, optIdx) => {
      html += '<div class="option"><input type="radio" id="q' + idx + '_' + optIdx + '" name="q' + idx + '" value="' + optIdx + '"><label for="q' + idx + '_' + optIdx + '">' + opt + '</label></div>';
    });
    html += '</div></div>';
    return html;
  }).join('');
}

async function submitQuiz() {
  if (!currentQuizId) return;
  const quiz = allData.quizzes.find(q => q.id === currentQuizId);
  if (!quiz) return;
  const answers = [];
  let score = 0;
  quiz.questions.forEach((q, idx) => {
    const selected = document.querySelector('input[name="q' + idx + '"]:checked');
    if (selected) {
      const answer = parseInt(selected.value);
      answers.push(answer);
      if (answer === q.correctAnswer) score++;
    } else {
      answers.push(-1);
    }
  });
  try {
    const response = await fetch('/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: currentStudentId, quizId: currentQuizId, answers, score })
    });
    const data = await response.json();
    if (data.success) {
      alert('Quiz submitted! Your score: ' + score + '/' + quiz.questions.length);
      showPage('quizzesPage');
      loadAllData();
      renderQuizzes('quizzesList');
    }
  } catch (error) { console.error('Error:', error); }
}

async function deleteQuiz(id) {
  if (!confirm('Delete this quiz?')) return;
  try {
    await fetch('/quiz/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await loadAllData();
    renderQuizzes('adminQuizzesList');
  } catch (error) { console.error('Error:', error); }
}

let questionCount = 0;

function addQuestionField() {
  const container = document.getElementById('questionsForm');
  const questionDiv = document.createElement('div');
  questionDiv.className = 'question-input-group';
  questionDiv.id = 'q' + questionCount;
  questionDiv.innerHTML = '<input type="text" class="q-text" placeholder="Question text"><div class="options-group"><div class="option-input-group"><input type="text" class="q-option" placeholder="Option 1"><input type="radio" class="q-correct" name="q' + questionCount + '"><label>Correct</label></div><div class="option-input-group"><input type="text" class="q-option" placeholder="Option 2"><input type="radio" class="q-correct" name="q' + questionCount + '"><label>Correct</label></div><div class="option-input-group"><input type="text" class="q-option" placeholder="Option 3"><input type="radio" class="q-correct" name="q' + questionCount + '"><label>Correct</label></div><div class="option-input-group"><input type="text" class="q-option" placeholder="Option 4"><input type="radio" class="q-correct" name="q' + questionCount + '"><label>Correct</label></div></div><button type="button" class="remove-btn" onclick="removeQuestion(\'q' + questionCount + '\')">Remove Question</button>';
  container.appendChild(questionDiv);
  questionCount++;
}

function removeQuestion(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

async function addQuiz() {
  const title = document.getElementById('quizTitle').value;
  const timer = parseInt(document.getElementById('quizTimer').value) || 30;
  if (!title) { alert('Please enter quiz title'); return; }
  const questions = [];
  document.querySelectorAll('.question-input-group').forEach(div => {
    const questionText = div.querySelector('.q-text').value;
    if (!questionText) return;
    const options = Array.from(div.querySelectorAll('.q-option')).map(opt => opt.value).filter(v => v);
    const correctRadios = Array.from(div.querySelectorAll('.q-correct'));
    let correctAnswer = 0;
    correctRadios.forEach((radio, idx) => {
      if (radio.checked) correctAnswer = idx;
    });
    if (options.length >= 2) {
      questions.push({ question: questionText, options, correctAnswer });
    }
  });
  if (questions.length === 0) { alert('Please add at least one complete question'); return; }
  try {
    const response = await fetch('/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, questions, timer })
    });
    const data = await response.json();
    if (data.success) {
      document.getElementById('quizTitle').value = '';
      document.getElementById('quizTimer').value = '30';
      document.getElementById('questionsForm').innerHTML = '';
      questionCount = 0;
      await loadAllData();
      renderQuizzes('adminQuizzesList');
      alert('Quiz created!');
    }
  } catch (error) { console.error('Error:', error); }
}

async function createClass() {
  try {
    const response = await fetch('/class/create', { method: 'POST' });
    const data = await response.json();
    if (data.success) {
      await loadAdminDashboard();
      alert('Class created! Code: ' + data.classCode);
    }
  } catch (error) { console.error('Error:', error); }
}

async function loadAdminDashboard() {
  try {
    const response = await fetch('/admin/dashboard');
    const data = await response.json();
    if (data.success) {
      document.getElementById('adminTotalStudents').textContent = data.stats.totalStudents;
      document.getElementById('adminTotalClasses').textContent = data.stats.classesCount;
      document.getElementById('adminTotalAssignments').textContent = data.stats.totalAssignments;
      document.getElementById('adminTotalSubmissions').textContent = data.stats.totalSubmissions;
      document.getElementById('adminTotalQuizzes').textContent = data.stats.totalQuizzes;
      document.getElementById('adminTotalResults').textContent = data.stats.totalResults;
    }
  } catch (error) { console.error('Error:', error); }
  await loadAllData();
  renderClasses();
}

async function loadClasses() {
  try {
    const response = await fetch('/classes');
    allData.classes = (await response.json()).classes || [];
  } catch (error) { console.error('Error:', error); }
}

async function renderClasses() {
  await loadClasses();
  const container = document.getElementById('classesList');
  container.innerHTML = allData.classes.length === 0
    ? '<p style="color: #999;">No classes created yet</p>'
    : allData.classes.map(cls => '<div class="class-card"><h3>Class ' + cls.id + '</h3><div class="class-code">Code: ' + cls.code + '</div><p><strong>Students:</strong> ' + cls.studentCount + '</p><button onclick="viewClassStudents(\'' + cls.code + '\')" class="btn-primary">View Students</button></div>').join('');
}

async function viewClassStudents(classCode) {
  try {
    const response = await fetch('/class/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classCode })
    });
    const data = await response.json();
    const studentList = data.students.length === 0 
      ? 'No students yet'
      : data.students.map(s => s.name + ' (' + s.email + ')').join('\n');
    alert('Students in ' + classCode + ':\n' + studentList);
  } catch (error) { console.error('Error:', error); }
}

async function loadSubmissions() {
  try {
    const response = await fetch('/submissions');
    allData.submissions = (await response.json()).submissions || [];
  } catch (error) { console.error('Error:', error); }
}

async function renderSubmissions() {
  await loadSubmissions();
  const container = document.getElementById('submissionsList');
  container.innerHTML = allData.submissions.length === 0
    ? '<p style="color: #999;">No submissions yet</p>'
    : allData.submissions.map(sub => '<div class="submission-item"><h4>' + sub.studentName + ' - Assignment ' + sub.assignmentId + '</h4><p><strong>Email:</strong> ' + sub.studentEmail + '</p><p><strong>Question:</strong> ' + sub.assignmentQuestion + '</p><div class="answer-box"><strong>Answer:</strong><br>' + sub.answer + '</div><p><small>Submitted: ' + new Date(sub.submittedAt).toLocaleString() + '</small></p></div>').join('');
}

async function loadQuizResults() {
  try {
    const response = await fetch('/quiz/results');
    allData.quizResults = (await response.json()).results || [];
  } catch (error) { console.error('Error:', error); }
}

async function renderQuizResults() {
  await loadQuizResults();
  const container = document.getElementById('resultsList');
  container.innerHTML = allData.quizResults.length === 0
    ? '<p style="color: #999;">No quiz results yet</p>'
    : allData.quizResults.map(res => '<div class="result-item"><h4>' + res.studentName + ' - ' + res.quizTitle + '</h4><p><strong>Email:</strong> ' + res.studentEmail + '</p><p><strong>Score:</strong> ' + res.score + '/' + res.answers.length + '</p><p><small>Submitted: ' + new Date(res.submittedAt).toLocaleString() + '</small></p></div>').join('');
}

async function loadProfileInfo() {
  if (!currentStudentId) return;
  try {
    const response = await fetch('/student/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: currentStudentId })
    });
    const data = await response.json();
    if (data.success) {
      const student = data.student;
      document.getElementById('profileInfo').innerHTML = '<h2>Student Profile</h2><h3>' + student.name + '</h3><p><strong>Email:</strong> ' + student.email + '</p><p><strong>Class Code:</strong> ' + student.classCode + '</p><p><strong>Joined:</strong> ' + new Date(student.joinedAt).toLocaleString() + '</p>';
    }
  } catch (error) { console.error('Error:', error); }
}

const originalShowPage = showPage;
window.showPage = function(pageName) {
  originalShowPage(pageName);
  setTimeout(() => {
    if (pageName === 'materialsPage') {
      loadAllData().then(() => renderMaterials('materialsList'));
    } else if (pageName === 'assignmentsPage') {
      loadAllData().then(() => renderAssignments('assignmentsList'));
    } else if (pageName === 'quizzesPage') {
      loadAllData().then(() => renderQuizzes('quizzesList'));
    } else if (pageName === 'profilePage') {
      loadProfileInfo();
    } else if (pageName === 'classesPage') {
      renderClasses();
    } else if (pageName === 'announcementsPage') {
      loadAllData().then(() => renderAnnouncements('adminAnnouncementsList'));
    } else if (pageName === 'materialsAdminPage') {
      loadAllData().then(() => renderMaterials('adminMaterialsList'));
    } else if (pageName === 'assignmentsAdminPage') {
      loadAllData().then(() => renderAssignments('adminAssignmentsList'));
    } else if (pageName === 'quizzesAdminPage') {
      loadAllData().then(() => renderQuizzes('adminQuizzesList'));
    } else if (pageName === 'submissionsPage') {
      renderSubmissions();
    } else if (pageName === 'resultsPage') {
      renderQuizResults();
    }
  }, 0);
};
