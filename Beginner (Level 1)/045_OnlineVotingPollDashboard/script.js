// ==================== DEFAULT DATA ====================
const DEFAULT_CANDIDATES = [
  { id: 1, name: "Arjun Sharma", party: "National Progress Party", photo: "https://i.pravatar.cc/150?img=11" },
  { id: 2, name: "Priya Mehta", party: "United Democratic Front", photo: "https://i.pravatar.cc/150?img=47" },
  { id: 3, name: "Rahul Desai", party: "People's Alliance", photo: "https://i.pravatar.cc/150?img=12" },
  { id: 4, name: "Sunita Rao", party: "Green Future Movement", photo: "https://i.pravatar.cc/150?img=45" }
];

// ==================== STORAGE HELPERS ====================
function getData(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}
function setData(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ==================== INIT ====================
function init() {
  if (!localStorage.getItem('candidates')) {
    setData('candidates', DEFAULT_CANDIDATES);
  }
  if (!localStorage.getItem('votes')) setData('votes', {});
  if (!localStorage.getItem('voters')) setData('voters', []);
  if (!localStorage.getItem('voteLogs')) setData('voteLogs', []);
}
init();

// ==================== STATE ====================
let currentVoterName = '';
let currentVoterID = '';
let pendingCandidateId = null;

// ==================== ADMIN GEAR ====================
document.getElementById('adminGearBtn').addEventListener('click', () => {
  openModal('adminLoginModal');
  document.getElementById('adminUser').value = '';
  document.getElementById('adminPass').value = '';
  document.getElementById('adminLoginError').textContent = '';
});

// ==================== MODAL HELPERS ====================
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });
});

// ==================== ADMIN LOGIN ====================
function adminLogin() {
  const u = document.getElementById('adminUser').value.trim();
  const p = document.getElementById('adminPass').value.trim();
  if (u === 'admin' && p === '1234') {
    closeModal('adminLoginModal');
    showAdminDashboard();
  } else {
    document.getElementById('adminLoginError').textContent = 'Invalid username or password.';
  }
}

document.getElementById('adminPass').addEventListener('keydown', e => {
  if (e.key === 'Enter') adminLogin();
});

function showAdminDashboard() {
  document.getElementById('voterSection').classList.add('hidden');
  document.getElementById('adminDashboard').classList.remove('hidden');
  showTab('candidates');
}

function adminLogout() {
  document.getElementById('adminDashboard').classList.add('hidden');
  document.getElementById('voterSection').classList.remove('hidden');
}

// ==================== TABS ====================
function showTab(tab) {
  ['candidates','results','logs'].forEach(t => {
    document.getElementById('tab-' + t).classList.add('hidden');
  });
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.remove('hidden');
  document.querySelectorAll('.tab-btn').forEach(b => {
    if (b.textContent.toLowerCase().includes(tab === 'candidates' ? 'candidat' : tab === 'results' ? 'result' : 'log')) {
      b.classList.add('active');
    }
  });
  if (tab === 'candidates') renderAdminCandidates();
  if (tab === 'results') renderResults();
  if (tab === 'logs') renderLogs();
}

// ==================== CHECK VOTER ====================
function checkVoter() {
  const name = document.getElementById('voterName').value.trim();
  const id = document.getElementById('voterID').value.trim();
  const errEl = document.getElementById('voterFormError');
  errEl.textContent = '';

  if (!name) { errEl.textContent = 'Please enter your full name.'; return; }
  if (!id) { errEl.textContent = 'Please enter your Voter ID.'; return; }

  const voters = getData('voters');
  if (voters.includes(id)) {
    // Already voted
    document.getElementById('voterForm').classList.add('hidden');
    const screen = document.getElementById('alreadyVotedScreen');
    document.getElementById('alreadyVotedMsg').textContent =
      `Voter ID "${id}" has already cast a vote. Each ID can only vote once.`;
    screen.classList.remove('hidden');
    return;
  }

  currentVoterName = name;
  currentVoterID = id;

  document.getElementById('voterForm').classList.add('hidden');
  document.getElementById('voterGreeting').textContent = `Welcome, ${name} (ID: ${id})`;
  document.getElementById('candidatesSection').classList.remove('hidden');
  renderCandidates();
}

// ==================== RENDER CANDIDATES (Voter) ====================
function renderCandidates() {
  const candidates = getData('candidates');
  const container = document.getElementById('candidatesList');
  container.innerHTML = '';

  if (candidates.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#888;">No candidates available.</p>';
    return;
  }

  candidates.forEach(c => {
    const div = document.createElement('div');
    div.className = 'candidate-card';
    div.innerHTML = `
      <img src="${c.photo || 'https://via.placeholder.com/80'}" alt="${c.name}" onerror="this.src='https://via.placeholder.com/80'">
      <h4>${c.name}</h4>
      <p class="party">${c.party}</p>
      <button class="btn btn-primary" onclick="voteCandidate(${c.id})">Vote</button>
    `;
    container.appendChild(div);
  });
}

// ==================== VOTE CANDIDATE ====================
function voteCandidate(candidateId) {
  const candidates = getData('candidates');
  const c = candidates.find(x => x.id === candidateId);
  if (!c) return;
  pendingCandidateId = candidateId;
  document.getElementById('voteConfirmText').textContent =
    `You are about to vote for ${c.name} (${c.party}). This action cannot be undone.`;
  openModal('voteConfirmModal');
}

function confirmVote() {
  closeModal('voteConfirmModal');
  if (!pendingCandidateId) return;

  const candidates = getData('candidates');
  const c = candidates.find(x => x.id === pendingCandidateId);
  if (!c) return;

  // Record vote
  const votes = getData('votes');
  votes[pendingCandidateId] = (votes[pendingCandidateId] || 0) + 1;
  setData('votes', votes);

  // Record voter
  const voters = getData('voters');
  voters.push(currentVoterID);
  setData('voters', voters);

  // Record log
  const logs = getData('voteLogs');
  logs.push({
    voterName: currentVoterName,
    voterID: currentVoterID,
    candidate: c.name,
    time: new Date().toLocaleString()
  });
  setData('voteLogs', logs);

  // Show thank you
  document.getElementById('candidatesSection').classList.add('hidden');
  document.getElementById('thankYouMsg').textContent =
    `You voted for ${c.name} (${c.party}). Thank you, ${currentVoterName}!`;
  document.getElementById('thankYouScreen').classList.remove('hidden');

  pendingCandidateId = null;
}

// ==================== ADMIN: RENDER CANDIDATES ====================
function renderAdminCandidates() {
  const candidates = getData('candidates');
  const votes = getData('votes');
  const container = document.getElementById('adminCandidatesList');
  container.innerHTML = '';

  if (candidates.length === 0) {
    container.innerHTML = '<p style="color:#888;">No candidates. Add one above.</p>';
    return;
  }

  candidates.forEach(c => {
    const div = document.createElement('div');
    div.className = 'admin-cand-card';
    div.innerHTML = `
      <img src="${c.photo || 'https://via.placeholder.com/60'}" alt="${c.name}" onerror="this.src='https://via.placeholder.com/60'">
      <h4>${c.name}</h4>
      <p class="party">${c.party}</p>
      <p style="font-size:.8rem;margin-bottom:8px;">Votes: <b>${votes[c.id] || 0}</b></p>
      <div class="card-btns">
        <button class="btn btn-warning sm" onclick="editCandidate(${c.id})">Edit</button>
        <button class="btn btn-danger sm" onclick="deleteCandidate(${c.id})">Delete</button>
      </div>
    `;
    container.appendChild(div);
  });
}

// ==================== ADD CANDIDATE MODAL ====================
function openAddCandidateModal() {
  document.getElementById('candidateModalTitle').textContent = 'Add Candidate';
  document.getElementById('cName').value = '';
  document.getElementById('cParty').value = '';
  document.getElementById('cPhoto').value = '';
  document.getElementById('cEditId').value = '';
  document.getElementById('candidateModalError').textContent = '';
  openModal('candidateModal');
}

function editCandidate(id) {
  const candidates = getData('candidates');
  const c = candidates.find(x => x.id === id);
  if (!c) return;
  document.getElementById('candidateModalTitle').textContent = 'Edit Candidate';
  document.getElementById('cName').value = c.name;
  document.getElementById('cParty').value = c.party;
  document.getElementById('cPhoto').value = c.photo;
  document.getElementById('cEditId').value = id;
  document.getElementById('candidateModalError').textContent = '';
  openModal('candidateModal');
}

function saveCandidate() {
  const name = document.getElementById('cName').value.trim();
  const party = document.getElementById('cParty').value.trim();
  const photo = document.getElementById('cPhoto').value.trim();
  const editId = document.getElementById('cEditId').value;
  const errEl = document.getElementById('candidateModalError');
  errEl.textContent = '';

  if (!name) { errEl.textContent = 'Name is required.'; return; }
  if (!party) { errEl.textContent = 'Party is required.'; return; }

  const candidates = getData('candidates');

  if (editId) {
    const idx = candidates.findIndex(x => x.id == editId);
    if (idx !== -1) {
      candidates[idx].name = name;
      candidates[idx].party = party;
      candidates[idx].photo = photo;
    }
  } else {
    const newId = Date.now();
    candidates.push({ id: newId, name, party, photo });
  }

  setData('candidates', candidates);
  closeModal('candidateModal');
  renderAdminCandidates();
}

// ==================== DELETE CANDIDATE ====================
function deleteCandidate(id) {
  if (!confirm('Delete this candidate? Their votes will also be removed.')) return;
  let candidates = getData('candidates');
  candidates = candidates.filter(x => x.id !== id);
  setData('candidates', candidates);

  const votes = getData('votes');
  delete votes[id];
  setData('votes', votes);

  renderAdminCandidates();
}

// ==================== RENDER RESULTS ====================
function renderResults() {
  const candidates = getData('candidates');
  const votes = getData('votes');
  const container = document.getElementById('resultsContainer');
  container.innerHTML = '';

  if (candidates.length === 0) {
    container.innerHTML = '<p style="color:#888;">No candidates yet.</p>';
    return;
  }

  const totalVotes = candidates.reduce((sum, c) => sum + (votes[c.id] || 0), 0);

  candidates.forEach(c => {
    const v = votes[c.id] || 0;
    const pct = totalVotes > 0 ? ((v / totalVotes) * 100).toFixed(1) : 0;
    const row = document.createElement('div');
    row.className = 'result-row';
    row.innerHTML = `
      <span class="result-name">${c.name}</span>
      <div class="result-bar-wrap">
        <div class="result-bar" style="width:${pct}%"></div>
      </div>
      <span class="result-count">${v} votes (${pct}%)</span>
    `;
    container.appendChild(row);
  });

  if (totalVotes === 0) {
    const note = document.createElement('p');
    note.style.color = '#888';
    note.style.marginTop = '12px';
    note.textContent = 'No votes cast yet.';
    container.appendChild(note);
  }
}

// ==================== RENDER LOGS ====================
function renderLogs() {
  const logs = getData('voteLogs');
  const tbody = document.getElementById('logsBody');
  tbody.innerHTML = '';

  if (logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="color:#888;text-align:center;">No votes recorded yet.</td></tr>';
    return;
  }

  logs.slice().reverse().forEach(log => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${log.voterName}</td>
      <td>${log.voterID}</td>
      <td>${log.candidate}</td>
      <td>${log.time}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ==================== RESET ELECTION ====================
function resetElection() {
  if (!confirm('Reset election? All votes and logs will be cleared. Candidates will remain.')) return;
  setData('votes', {});
  setData('voters', []);
  setData('voteLogs', []);
  renderLogs();
  alert('Election has been reset. All votes cleared.');
}