// ===== STATE =====
const state = {
  voter: null,          // { name, voterId, department, age }
  candidates: [],
  selectedCandidate: null,
  logoClickCount: 0,
  logoClickTimer: null,
  hasVoted: false,
};

// ===== SECTION SWITCHING =====
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('section-' + id);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ===== TOAST =====
function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, duration);
}

// ===== ERROR HELPERS =====
function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.remove('hidden');
}
function hideError(id) {
  const el = document.getElementById(id);
  el.classList.add('hidden');
}

// ===== LOGO CLICK (admin trigger) =====
document.getElementById('logoClick').addEventListener('click', () => {
  state.logoClickCount++;
  clearTimeout(state.logoClickTimer);
  state.logoClickTimer = setTimeout(() => { state.logoClickCount = 0; }, 2000);

  if (state.logoClickCount >= 5) {
    state.logoClickCount = 0;
    document.getElementById('adminModal').classList.remove('hidden');
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPassword').focus();
    hideError('adminError');
  }
});

// ===== VALIDATE & PROCEED TO VOTE =====
function validateAndProceed() {
  hideError('registerError');

  const name = document.getElementById('voterName').value.trim();
  const voterId = document.getElementById('voterId').value.trim();
  const age = parseInt(document.getElementById('voterAge').value);
  const dept = document.getElementById('voterDept').value.trim();

  if (!name || !voterId || !dept || !document.getElementById('voterAge').value) {
    showError('registerError', '⚠️ All fields are required.');
    return;
  }
  if (name.length < 2) {
    showError('registerError', '⚠️ Please enter a valid full name.');
    return;
  }
  if (voterId.length < 3) {
    showError('registerError', '⚠️ Please enter a valid Voter ID.');
    return;
  }
  if (isNaN(age) || age < 18) {
    showError('registerError', '⚠️ You must be at least 18 years old to vote.');
    return;
  }
  if (age > 120) {
    showError('registerError', '⚠️ Please enter a valid age.');
    return;
  }

  state.voter = { name, voterId, department: dept, age };

  // Update voter badge
  document.getElementById('voterBadge').textContent = `👤 ${name}`;

  // Load candidates and show vote screen
  loadCandidates();
  showSection('vote');
}

// ===== LOAD CANDIDATES =====
async function loadCandidates() {
  try {
    const res = await fetch('/candidates');
    const candidates = await res.json();
    state.candidates = candidates;
    renderCandidates(candidates);
  } catch (err) {
    showError('voteError', '❌ Failed to load candidates. Is the server running?');
  }
}

function renderCandidates(candidates) {
  const grid = document.getElementById('candidatesGrid');
  grid.innerHTML = '';

  candidates.forEach(c => {
    const card = document.createElement('div');
    card.className = 'candidate-card';
    card.style.setProperty('--c-color', c.color);
    card.dataset.id = c.id;

    card.innerHTML = `
      <span class="cand-symbol">${c.symbol}</span>
      <div class="cand-name">${escapeHtml(c.name)}</div>
      <div class="cand-party">
        <span class="cand-party-dot" style="background:${c.color}"></span>
        ${escapeHtml(c.party)}
      </div>
      <button class="vote-btn" onclick="openVoteModal('${c.id}')">Vote</button>
    `;

    grid.appendChild(card);
  });
}

// ===== VOTE MODAL =====
function openVoteModal(candidateId) {
  if (state.hasVoted) return;

  const candidate = state.candidates.find(c => c.id === candidateId);
  if (!candidate) return;

  state.selectedCandidate = candidate;

  document.getElementById('modalCandidateSymbol').textContent = candidate.symbol;
  document.getElementById('modalCandidateName').textContent = candidate.name;
  document.getElementById('modalCandidateParty').textContent = candidate.party;

  // Highlight selected card
  document.querySelectorAll('.candidate-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.id === candidateId);
  });

  document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  state.selectedCandidate = null;
  document.querySelectorAll('.candidate-card').forEach(c => c.classList.remove('selected'));
}

// ===== SUBMIT VOTE =====
async function submitVote() {
  if (!state.voter || !state.selectedCandidate) return;

  const confirmBtn = document.getElementById('confirmVoteBtn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Recording...';

  try {
    const res = await fetch('/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: state.voter.name,
        voterId: state.voter.voterId,
        department: state.voter.department,
        age: state.voter.age,
        candidate: state.selectedCandidate.id,
      }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      state.hasVoted = true;
      closeModal();

      // Fill success screen
      document.getElementById('successVoterName').textContent = state.voter.name;
      document.getElementById('successCandidateName').textContent =
        `${state.selectedCandidate.symbol} ${state.selectedCandidate.name}`;

      showSection('success');
    } else {
      closeModal();
      showError('voteError', `❌ ${data.error || 'Vote failed. Please try again.'}`);
    }
  } catch (err) {
    closeModal();
    showError('voteError', '❌ Network error. Is the server running?');
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm Vote';
  }
}

// ===== LOAD RESULTS =====
async function loadResults() {
  const container = document.getElementById('resultsContainer');
  const label = document.getElementById('totalVotesLabel');
  container.innerHTML = '<div style="color:var(--text-muted);padding:20px 0">Loading results...</div>';

  try {
    const res = await fetch('/results');
    const data = await res.json();

    const { results, totalVotes } = data;
    label.textContent = `${totalVotes} total vote${totalVotes !== 1 ? 's' : ''} cast`;

    const sorted = [...results].sort((a, b) => b.votes - a.votes);
    const maxVotes = sorted[0]?.votes || 1;

    container.innerHTML = '';
    sorted.forEach((c, i) => {
      const pct = totalVotes > 0 ? Math.round((c.votes / totalVotes) * 100) : 0;
      const barWidth = maxVotes > 0 ? Math.round((c.votes / maxVotes) * 100) : 0;

      const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      const rankLabel = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;

      const item = document.createElement('div');
      item.className = 'result-item';
      item.style.animationDelay = `${i * 0.06}s`;
      item.innerHTML = `
        <div class="result-rank ${rankClass}">${rankLabel}</div>
        <div class="result-info">
          <div class="result-name">${c.symbol} ${escapeHtml(c.name)}</div>
          <div class="result-party">${escapeHtml(c.party)}</div>
          <div class="result-bar-wrap" style="margin-top:8px">
            <div class="result-bar-bg">
              <div class="result-bar" style="width:0%;background:${c.color}" data-width="${barWidth}"></div>
            </div>
          </div>
        </div>
        <div>
          <div class="result-count">${c.votes}</div>
          <div class="result-percent">${pct}%</div>
        </div>
      `;
      container.appendChild(item);
    });

    // Animate bars after render
    requestAnimationFrame(() => {
      document.querySelectorAll('.result-bar').forEach(bar => {
        bar.style.width = bar.dataset.width + '%';
      });
    });

  } catch (err) {
    container.innerHTML = '<div class="error-msg">❌ Could not load results. Is the server running?</div>';
    label.textContent = 'Error loading results';
  }
}

// ===== ADMIN LOGIN =====
function adminLogin() {
  hideError('adminError');
  const pwd = document.getElementById('adminPassword').value;

  if (pwd === 'admin123') {
    closeAdminModal();
    loadAdminResults();
    showSection('admin');
  } else {
    showError('adminError', '❌ Incorrect password.');
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPassword').focus();
  }
}

function closeAdminModal() {
  document.getElementById('adminModal').classList.add('hidden');
}

// Admin password input: Enter key support
document.getElementById('adminPassword').addEventListener('keydown', e => {
  if (e.key === 'Enter') adminLogin();
});

// ===== LOAD ADMIN RESULTS =====
async function loadAdminResults() {
  const container = document.getElementById('adminResults');
  const totalLabel = document.getElementById('adminTotalLabel');
  const tbody = document.getElementById('voterLogBody');

  container.innerHTML = '<div style="color:var(--text-muted);padding:20px 0">Loading...</div>';

  try {
    const res = await fetch('/admin/results');
    const data = await res.json();

    const { results, totalVotes, voterLog } = data;
    totalLabel.textContent = `${totalVotes} total vote${totalVotes !== 1 ? 's' : ''} cast`;

    const sorted = [...results].sort((a, b) => b.votes - a.votes);
    const maxVotes = sorted[0]?.votes || 1;

    container.innerHTML = '';
    sorted.forEach((c, i) => {
      const pct = totalVotes > 0 ? Math.round((c.votes / totalVotes) * 100) : 0;
      const barWidth = maxVotes > 0 ? Math.round((c.votes / maxVotes) * 100) : 0;
      const rankLabel = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
      const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';

      const item = document.createElement('div');
      item.className = 'result-item';
      item.style.animationDelay = `${i * 0.06}s`;
      item.innerHTML = `
        <div class="result-rank ${rankClass}">${rankLabel}</div>
        <div class="result-info">
          <div class="result-name">${c.symbol} ${escapeHtml(c.name)}</div>
          <div class="result-party">${escapeHtml(c.party)}</div>
          <div class="result-bar-wrap" style="margin-top:8px">
            <div class="result-bar-bg">
              <div class="result-bar" style="width:0%;background:${c.color}" data-width="${barWidth}"></div>
            </div>
          </div>
        </div>
        <div>
          <div class="result-count">${c.votes}</div>
          <div class="result-percent">${pct}%</div>
        </div>
      `;
      container.appendChild(item);
    });

    // Bars
    requestAnimationFrame(() => {
      document.querySelectorAll('#adminResults .result-bar').forEach(bar => {
        bar.style.width = bar.dataset.width + '%';
      });
    });

    // Voter log table
    tbody.innerHTML = '';
    if (voterLog.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="color:var(--text-muted);text-align:center">No votes cast yet.</td></tr>';
    } else {
      voterLog.forEach((v, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td><code style="font-size:12px;color:var(--accent-light)">${escapeHtml(v.voterId)}</code></td>
          <td>${escapeHtml(v.voterName)}</td>
          <td>${escapeHtml(v.department)}</td>
          <td>${v.age}</td>
          <td style="font-weight:600">${escapeHtml(v.votedFor)}</td>
        `;
        tbody.appendChild(tr);
      });
    }

  } catch (err) {
    container.innerHTML = '<div class="error-msg">❌ Could not load admin data.</div>';
  }
}

// ===== UTILITY: XSS-safe escape =====
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  showSection('register');

  // Handle hash navigation
  if (window.location.hash === '#results') {
    loadResults();
    showSection('results');
  }
});