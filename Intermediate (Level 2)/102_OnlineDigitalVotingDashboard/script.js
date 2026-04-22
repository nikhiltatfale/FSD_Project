let currentVoterId = '';
let isAdmin = false;
let pollInterval = null;

function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }
function msg(id, text, type) { const el = document.getElementById(id); el.textContent = text; el.className = type === 'err' ? 'msg-err' : 'msg-ok'; }

async function api(method, endpoint, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(endpoint, opts);
  return res.json();
}

async function checkVoter() {
  const id = document.getElementById('voter-id').value.trim();
  if (!id) { msg('voter-msg', 'Please enter your Voter ID', 'err'); return; }
  const data = await api('GET', '/candidates');
  if (!data.electionStatus) { msg('voter-msg', 'Election is currently not active', 'err'); return; }
  currentVoterId = id;
  renderCandidates(data.candidates);
  hide('voter-section');
  show('candidate-section');
  document.getElementById('voting-voter-id').textContent = 'VOTER ID: ' + id;
}

function renderCandidates(candidates) {
  const list = document.getElementById('candidate-list');
  list.innerHTML = candidates.map(c => `
    <div class="candidate-card">
      <div class="c-name">${c.name}</div>
      <div class="c-party">${c.party}</div>
      <button class="vote-btn" onclick="castVote(${c.id},'${c.name}')">VOTE →</button>
    </div>`).join('');
}

async function castVote(candidateId, candidateName) {
  const data = await api('POST', '/vote', { voterId: currentVoterId, candidateId });
  if (data.error) { alert(data.error); return; }
  hide('candidate-section');
  show('success-section');
  document.getElementById('success-msg').textContent = 'You voted for ' + candidateName;
}

function backToHome() {
  currentVoterId = '';
  document.getElementById('voter-id').value = '';
  document.getElementById('voter-msg').textContent = '';
  hide('candidate-section');
  hide('success-section');
  show('voter-section');
}

function showAdminModal() { show('admin-modal'); }
function closeAdminModal() { hide('admin-modal'); document.getElementById('login-msg').textContent = ''; }

async function adminLogin() {
  const username = document.getElementById('admin-user').value;
  const password = document.getElementById('admin-pass').value;
  const data = await api('POST', '/admin/login', { username, password });
  if (data.error) { msg('login-msg', data.error, 'err'); return; }
  isAdmin = true;
  closeAdminModal();
  hide('voter-section');
  show('admin-section');
  loadAdminData();
  pollInterval = setInterval(loadAdminData, 3000);
}

async function loadAdminData() {
  const [results, logs] = await Promise.all([api('GET', '/results'), api('GET', '/admin/logs')]);
  const total = results.total || 0;
  document.getElementById('total-voters').textContent = total;
  document.getElementById('total-candidates').textContent = results.results.length;
  const on = results.electionStatus;
  const badge = document.getElementById('election-badge');
  badge.textContent = on ? '● ELECTION ON' : '● ELECTION OFF';
  badge.className = on ? 'badge-on' : 'badge-off';
  const statusBox = document.getElementById('status-box');
  document.getElementById('status-text').textContent = on ? 'ON' : 'OFF';
  statusBox.className = 'stat-box' + (on ? ' on' : '');
  const toggleBtn = document.getElementById('toggle-btn');
  toggleBtn.textContent = on ? 'STOP ELECTION' : 'START ELECTION';
  toggleBtn.className = on ? 'active' : '';
  const maxVotes = Math.max(...results.results.map(r => r.votes), 1);
  document.getElementById('results-list').innerHTML = results.results.map(r => `
    <div class="result-row">
      <div class="result-meta">
        <span class="result-name">${r.name}</span>
        <span class="result-count">${r.votes} VOTES</span>
      </div>
      <div class="result-bar-bg"><div class="result-bar" style="width:${(r.votes/maxVotes)*100}%"></div></div>
      <button class="result-delete" onclick="deleteCandidate(${r.id})">DELETE</button>
    </div>`).join('') || '<p class="log-empty">No candidates</p>';
  const logList = document.getElementById('log-list');
  if (logs.logs.length === 0) { logList.innerHTML = '<p class="log-empty">No votes yet</p>'; return; }
  logList.innerHTML = logs.logs.slice().reverse().map(l => `
    <div class="log-entry"><span>${l.voterId}</span> → ${l.candidateName}<br>${new Date(l.time).toLocaleTimeString()}</div>`).join('');
}

async function toggleElection() {
  await api('POST', '/admin/toggle');
  loadAdminData();
}

async function resetElection() {
  if (!confirm('Reset all votes and logs?')) return;
  await api('POST', '/admin/reset');
  loadAdminData();
}

async function addCandidate() {
  const name = document.getElementById('new-name').value.trim();
  const party = document.getElementById('new-party').value.trim();
  if (!name || !party) { msg('add-msg', 'Both fields required', 'err'); return; }
  const data = await api('POST', '/admin/add', { name, party });
  if (data.error) { msg('add-msg', data.error, 'err'); return; }
  document.getElementById('new-name').value = '';
  document.getElementById('new-party').value = '';
  msg('add-msg', 'Candidate added', 'ok');
  loadAdminData();
}

async function deleteCandidate(id) {
  if (!confirm('Delete this candidate?')) return;
  await api('DELETE', '/admin/delete', { id });
  loadAdminData();
}

async function downloadResults() {
  const data = await api('GET', '/results');
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'election-results.json';
  a.click();
}

function adminLogout() {
  isAdmin = false;
  if (pollInterval) clearInterval(pollInterval);
  hide('admin-section');
  show('voter-section');
}

(async () => {
  const data = await api('GET', '/candidates');
  const badge = document.getElementById('election-badge');
  badge.textContent = data.electionStatus ? '● ELECTION ON' : '● ELECTION OFF';
  badge.className = data.electionStatus ? 'badge-on' : 'badge-off';
})();

document.getElementById('voter-id').addEventListener('keydown', e => { if (e.key === 'Enter') checkVoter(); });
document.getElementById('admin-pass').addEventListener('keydown', e => { if (e.key === 'Enter') adminLogin(); });