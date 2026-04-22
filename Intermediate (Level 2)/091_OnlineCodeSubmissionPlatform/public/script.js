let currentUser = null;
let adminToken = null;
let editingProblemId = null;

const $ = id => document.getElementById(id);

function show(id) { $(id).classList.remove('hidden'); }
function hide(id) { $(id).classList.add('hidden'); }

$('btn-start').onclick = () => {
  const name = $('inp-name').value.trim();
  const email = $('inp-email').value.trim();
  if (!name || !email) return alert('Please enter name and email');
  currentUser = { name, email };
  hide('login-section');
  show('coding-section');
  $('user-info').textContent = `${name} | ${email}`;
  show('user-info');
  loadProblem();
};

async function loadProblem() {
  const res = await fetch('/problem');
  const p = await res.json();
  $('prob-title').textContent = p.title;
  $('prob-desc').textContent = p.description;
  $('prob-si').textContent = p.sampleInput;
  $('prob-so').textContent = p.sampleOutput;
  $('prob-con').textContent = p.constraints;
}

$('btn-submit').onclick = async () => {
  const code = $('code-area').value.trim();
  if (!code) return alert('Please write some code');
  $('btn-submit').textContent = 'Judging...';
  $('btn-submit').disabled = true;
  const res = await fetch('/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: currentUser.name, email: currentUser.email, code, language: $('lang-select').value })
  });
  const data = await res.json();
  $('btn-submit').textContent = 'Submit Code';
  $('btn-submit').disabled = false;
  showResult(data);
};

function showResult(data) {
  show('result-box');
  const statusEl = $('result-status');
  statusEl.textContent = data.status;
  statusEl.className = data.status === 'Accepted' ? 'pass' : 'fail';
  $('result-score').textContent = `Passed: ${data.passed} / ${data.total}`;
  const tbody = $('result-body');
  tbody.innerHTML = '';
  data.results.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.input}</td><td>${r.expected}</td><td>${r.got}</td><td class="${r.passed ? 'pass' : 'fail'}">${r.passed ? '✓' : '✗'}</td>`;
    tbody.appendChild(tr);
  });
}

document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    show('admin-modal');
    $('adm-user').focus();
  }
});

$('modal-close').onclick = () => hide('admin-modal');
$('.modal-overlay').onclick = () => hide('admin-modal');

$('btn-admin-login').onclick = async () => {
  const res = await fetch('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: $('adm-user').value, password: $('adm-pass').value })
  });
  const data = await res.json();
  if (data.success) {
    adminToken = data.token;
    hide('admin-modal');
    hide('login-section');
    hide('coding-section');
    show('admin-section');
    loadAdmin();
  } else {
    show('admin-err');
    $('admin-err').textContent = data.error;
  }
};

$('btn-logout').onclick = () => {
  adminToken = null;
  hide('admin-section');
  show('login-section');
};

function adminFetch(url, opts = {}) {
  opts.headers = { ...opts.headers, 'x-admin-token': adminToken, 'Content-Type': 'application/json' };
  return fetch(url, opts);
}

async function loadAdmin() {
  const [stats, problems, subs] = await Promise.all([
    adminFetch('/admin/stats').then(r => r.json()),
    adminFetch('/admin/problems').then(r => r.json()),
    adminFetch('/admin/submissions').then(r => r.json())
  ]);
  $('st-users').textContent = stats.totalUsers;
  $('st-subs').textContent = stats.totalSubmissions;
  $('st-rate').textContent = stats.successRate + '%';
  renderProblems(problems);
  renderSubmissions(subs);
}

function renderProblems(problems) {
  const el = $('problems-list');
  el.innerHTML = '';
  problems.forEach(p => {
    const d = document.createElement('div');
    d.className = 'prob-card';
    d.innerHTML = `<div><h4>${p.title}</h4><p>${p.description.substring(0, 80)}...</p></div><div class="prob-actions"><button class="btn-edit" onclick="editProblem(${p.id})">Edit</button><button class="btn-del" onclick="deleteProblem(${p.id})">Delete</button></div>`;
    el.appendChild(d);
  });
}

function renderSubmissions(subs) {
  const tbody = $('sub-body');
  tbody.innerHTML = '';
  subs.forEach(s => {
    const tr = document.createElement('tr');
    const t = new Date(s.timestamp).toLocaleString();
    tr.innerHTML = `<td>${s.id}</td><td>${s.name}</td><td>${s.email}</td><td>${s.problemTitle}</td><td>${s.language}</td><td class="${s.status === 'Accepted' ? 'pass' : 'fail'}">${s.status}</td><td>${s.passed}/${s.total}</td><td>${t}</td><td><code title="${s.code}" onclick="alert(this.title)">${s.code.substring(0, 40)}...</code></td>`;
    tbody.appendChild(tr);
  });
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    $('tab-problems').classList.toggle('hidden', target !== 'problems');
    $('tab-submissions').classList.toggle('hidden', target !== 'submissions');
  };
});

$('btn-add-problem').onclick = () => {
  editingProblemId = null;
  ['pf-title','pf-desc','pf-si','pf-so','pf-con','pf-tc'].forEach(id => $(id).value = '');
  show('problem-form');
};

$('btn-cancel-problem').onclick = () => hide('problem-form');

$('btn-save-problem').onclick = async () => {
  let tc;
  try { tc = JSON.parse($('pf-tc').value || '[]'); } catch { return alert('Invalid test cases JSON'); }
  const body = { title: $('pf-title').value, description: $('pf-desc').value, sampleInput: $('pf-si').value, sampleOutput: $('pf-so').value, constraints: $('pf-con').value, testCases: tc };
  if (editingProblemId) {
    await adminFetch(`/admin/problem/${editingProblemId}`, { method: 'PUT', body: JSON.stringify(body) });
  } else {
    await adminFetch('/admin/problem', { method: 'POST', body: JSON.stringify(body) });
  }
  hide('problem-form');
  loadAdmin();
};

async function editProblem(id) {
  const res = await adminFetch('/admin/problems');
  const problems = await res.json();
  const p = problems.find(x => x.id === id);
  if (!p) return;
  editingProblemId = id;
  $('pf-title').value = p.title;
  $('pf-desc').value = p.description;
  $('pf-si').value = p.sampleInput;
  $('pf-so').value = p.sampleOutput;
  $('pf-con').value = p.constraints;
  $('pf-tc').value = JSON.stringify(p.testCases || []);
  show('problem-form');
}

async function deleteProblem(id) {
  if (!confirm('Delete this problem?')) return;
  await adminFetch(`/admin/problem/${id}`, { method: 'DELETE' });
  loadAdmin();
}