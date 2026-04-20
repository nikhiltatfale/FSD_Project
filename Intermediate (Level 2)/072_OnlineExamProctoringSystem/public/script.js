let studentId = null;
let questions = [];
let currentQ = 0;
let answers = [];
let timerInterval = null;
let timeLeft = 30;
let violations = 0;
let violationLimit = 5;
let stream = null;
let audioCtx = null;
let analyser = null;
let faceCheckInterval = null;
let audioCheckInterval = null;
let adminToken = null;

function showView(id) {
  document.querySelectorAll('.view,.admin-layout').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

window.onload = () => {
  const path = window.location.hash;
  if (path === '#admin') { showView('adminLoginView'); return; }
  showView('registerView');
};

async function startRegistration() {
  const name = document.getElementById('rName').value.trim();
  const rollNo = document.getElementById('rRoll').value.trim();
  const department = document.getElementById('rDept').value.trim();
  const college = document.getElementById('rCollege').value.trim();
  if (!name || !rollNo || !department || !college) { alert('All fields required'); return; }
  const res = await fetch('/start-exam', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, rollNo, department, college }) });
  const data = await res.json();
  if (data.error) { alert(data.error); return; }
  studentId = data.studentId;
  document.getElementById('studentNameDisplay').textContent = name + ' · ' + rollNo;
  showView('permView');
}

async function requestPermissions() {
  const errEl = document.getElementById('permError');
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById('webcamPreview').srcObject = stream;
    const res = await fetch('/questions');
    questions = await res.json();
    answers = new Array(questions.length).fill(-1);
    await enterFullscreen();
    initProctoring();
    loadQuestion(0);
    showView('examView');
  } catch (e) {
    errEl.style.display = 'block';
    errEl.textContent = 'Camera/mic access denied. Cannot proceed.';
  }
}

async function enterFullscreen() {
  try { await document.documentElement.requestFullscreen(); } catch (e) {}
}

function initProctoring() {
  setDot('dotCam', 'green');
  setDot('dotMic', 'green');
  setDot('dotTab', 'green');
  setDot('dotFS', 'green');
  setDot('dotFace', 'warn');

  document.addEventListener('visibilitychange', onTabSwitch);
  document.addEventListener('fullscreenchange', onFullscreenChange);

  const tracks = stream.getTracks();
  tracks.forEach(t => { t.onended = () => { logViolation('media_off', t.kind + ' track ended'); autoSubmit(); }; });

  setupAudio();
  setupFaceDetection();
}

function setDot(id, cls) {
  const d = document.getElementById(id);
  d.className = 'dot ' + cls;
}

function onTabSwitch() {
  if (document.hidden) {
    setDot('dotTab', 'red');
    logViolation('tab_switch', 'Student switched tab or minimized window');
    showToast('⚠ TAB SWITCH DETECTED');
  } else {
    setDot('dotTab', 'green');
  }
}

function onFullscreenChange() {
  if (!document.fullscreenElement) {
    setDot('dotFS', 'red');
    logViolation('exit_fullscreen', 'Student exited fullscreen');
    showToast('⚠ FULLSCREEN EXIT DETECTED');
    setTimeout(() => enterFullscreen(), 1000);
  } else {
    setDot('dotFS', 'green');
  }
}

function setupAudio() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    audioCheckInterval = setInterval(() => {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      if (avg > 40) {
        setDot('dotMic', 'warn');
        logViolation('noise_detected', 'High audio level: ' + avg.toFixed(1));
      } else {
        setDot('dotMic', 'green');
      }
    }, 3000);
  } catch (e) {}
}

function setupFaceDetection() {
  if (!('FaceDetector' in window)) { setDot('dotFace', 'warn'); return; }
  const detector = new FaceDetector({ fastMode: true });
  const video = document.getElementById('webcamPreview');
  faceCheckInterval = setInterval(async () => {
    try {
      const faces = await detector.detect(video);
      if (faces.length === 0) {
        setDot('dotFace', 'red');
        logViolation('no_face', 'No face detected in camera');
        showToast('⚠ NO FACE DETECTED');
      } else if (faces.length > 1) {
        setDot('dotFace', 'red');
        logViolation('multiple_faces', 'Multiple faces detected: ' + faces.length);
        showToast('⚠ MULTIPLE FACES DETECTED');
      } else {
        setDot('dotFace', 'green');
      }
    } catch (e) {}
  }, 4000);
}

async function logViolation(event, detail) {
  violations++;
  document.getElementById('violationCount').textContent = violations;
  try {
    const res = await fetch('/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, event, detail }) });
    const data = await res.json();
    violationLimit = data.limit;
    if (violations >= violationLimit) { showToast('AUTO-SUBMITTING: VIOLATION LIMIT REACHED'); setTimeout(autoSubmit, 2000); }
  } catch (e) {}
}

function showToast(msg) {
  const t = document.getElementById('violationToast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3000);
}

function loadQuestion(idx) {
  if (idx >= questions.length) { submitExam(); return; }
  currentQ = idx;
  const q = questions[idx];
  document.getElementById('qCounter').textContent = 'QUESTION ' + (idx + 1) + ' OF ' + questions.length;
  document.getElementById('qText').textContent = q.text;
  document.getElementById('qProgressDisplay').textContent = (idx + 1) + '/' + questions.length;
  document.getElementById('progressFill').style.width = ((idx / questions.length) * 100) + '%';
  const container = document.getElementById('optionsContainer');
  container.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option' + (answers[idx] === i ? ' selected' : '');
    btn.textContent = String.fromCharCode(65 + i) + '. ' + opt;
    btn.onclick = () => selectOption(i);
    container.appendChild(btn);
  });
  const nextBtn = document.getElementById('nextBtn');
  nextBtn.textContent = idx === questions.length - 1 ? 'SUBMIT EXAM ✓' : 'NEXT QUESTION →';
  startTimer();
}

function selectOption(i) {
  answers[currentQ] = i;
  document.querySelectorAll('.option').forEach((btn, idx) => {
    btn.classList.toggle('selected', idx === i);
  });
}

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 30;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) { clearInterval(timerInterval); nextQuestion(); }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById('timerDisplay');
  el.textContent = timeLeft + 's';
  el.className = timeLeft <= 10 ? (timeLeft <= 5 ? 'danger' : 'warn') : '';
}

function nextQuestion() {
  clearInterval(timerInterval);
  loadQuestion(currentQ + 1);
}

async function submitExam() {
  clearInterval(timerInterval);
  clearInterval(faceCheckInterval);
  clearInterval(audioCheckInterval);
  document.removeEventListener('visibilitychange', onTabSwitch);
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  if (stream) stream.getTracks().forEach(t => t.stop());
  if (audioCtx) audioCtx.close();
  if (document.fullscreenElement) document.exitFullscreen();
  try {
    const res = await fetch('/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, answers }) });
    const data = await res.json();
    showResult(data);
  } catch (e) { alert('Submission failed'); }
}

function autoSubmit() { submitExam(); }

function showResult(data) {
  document.getElementById('scoreBig').textContent = data.score;
  document.getElementById('scoreTotal').textContent = data.total;
  const detail = document.getElementById('resultDetail');
  detail.innerHTML = data.detail.map((d, i) => `<div class="result-row"><span>Q${d.q}</span><span class="${d.got ? 'correct' : 'wrong'}">${d.got ? '✓ CORRECT' : '✗ WRONG'}</span></div>`).join('');
  showView('resultView');
}

async function adminLogin() {
  const pass = document.getElementById('adminPass').value;
  const errEl = document.getElementById('adminError');
  const res = await fetch('/admin-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pass }) });
  const data = await res.json();
  if (data.success) {
    adminToken = data.token;
    showView('adminDashboard');
    document.getElementById('adminDashboard').classList.add('active');
    loadAdminData();
    setInterval(loadAdminData, 10000);
  } else {
    errEl.style.display = 'block';
    errEl.textContent = 'Invalid password';
  }
}

function adminLogout() { adminToken = null; showView('adminLoginView'); }

function adminTab(name) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  loadAdminData();
}

async function loadAdminData() {
  const [sRes, lRes, rRes] = await Promise.all([fetch('/admin/students'), fetch('/admin/logs'), fetch('/admin/results')]);
  const students = await sRes.json();
  const logs = await lRes.json();
  const results = await rRes.json();

  document.getElementById('statRow').innerHTML = `
    <div class="stat"><div class="val">${students.length}</div><div class="lbl">Total Students</div></div>
    <div class="stat"><div class="val">${students.filter(s => s.active).length}</div><div class="lbl">Active Now</div></div>
    <div class="stat"><div class="val">${logs.length}</div><div class="lbl">Total Violations</div></div>
    <div class="stat"><div class="val">${results.length}</div><div class="lbl">Submitted</div></div>
  `;

  document.getElementById('recentLogs').innerHTML = logs.slice(-10).reverse().map(l =>
    `<tr><td>${l.name || l.studentId}</td><td><span class="badge danger">${l.event}</span></td><td style="color:var(--muted)">${l.detail}</td><td style="color:var(--muted)">${new Date(l.time).toLocaleTimeString()}</td></tr>`
  ).join('');

  document.getElementById('studentsTable').innerHTML = students.map(s =>
    `<tr><td>${s.name}</td><td>${s.rollNo}</td><td>${s.department}</td><td style="color:var(--accent2)">${s.violations}</td><td><span class="badge ${s.active ? 'active' : 'done'}">${s.active ? 'ACTIVE' : 'DONE'}</span></td></tr>`
  ).join('');

  document.getElementById('logsTable').innerHTML = logs.map(l =>
    `<tr><td>${l.name || l.studentId}</td><td><span class="badge danger">${l.event}</span></td><td style="color:var(--muted)">${l.detail}</td><td style="color:var(--muted)">${new Date(l.time).toLocaleTimeString()}</td></tr>`
  ).join('');

  document.getElementById('resultsTable').innerHTML = results.map(r =>
    `<tr><td>${r.name}</td><td>${r.rollNo}</td><td>${r.score}/${r.total}</td><td><span class="badge ${r.score / r.total >= 0.5 ? 'active' : 'danger'}">${((r.score / r.total) * 100).toFixed(0)}%</span></td><td style="color:var(--muted)">${new Date(r.time).toLocaleTimeString()}</td></tr>`
  ).join('');
}

async function addQuestion() {
  const text = document.getElementById('qFormText').value.trim();
  const options = [0, 1, 2, 3].map(i => document.getElementById('qOpt' + i).value.trim());
  const answer = parseInt(document.getElementById('qCorrect').value);
  if (!text || options.some(o => !o)) { alert('Fill all fields'); return; }
  await fetch('/admin/exam', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add', question: { text, options, answer } }) });
  document.getElementById('qFormText').value = '';
  [0, 1, 2, 3].forEach(i => { document.getElementById('qOpt' + i).value = ''; });
  alert('Question added!');
}

async function saveConfig() {
  const violationLimit = parseInt(document.getElementById('cfgViolLimit').value);
  const examActive = document.getElementById('cfgExamActive').value === 'true';
  await fetch('/admin/exam', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'config', violationLimit, examActive }) });
  alert('Config saved!');
}

async function downloadResults(format) {
  const res = await fetch('/admin/results');
  const data = await res.json();
  let content, mime, ext;
  if (format === 'json') {
    content = JSON.stringify(data, null, 2);
    mime = 'application/json'; ext = 'json';
  } else {
    const rows = [['Name', 'Roll No', 'Score', 'Total', 'Percentage', 'Time']];
    data.forEach(r => rows.push([r.name, r.rollNo, r.score, r.total, ((r.score / r.total) * 100).toFixed(0) + '%', r.time]));
    content = rows.map(r => r.join(',')).join('\n');
    mime = 'text/csv'; ext = 'csv';
  }
  const blob = new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'results.' + ext;
  a.click();
}