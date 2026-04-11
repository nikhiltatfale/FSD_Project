// ─── Candidates ───────────────────────────────────────────────
const CANDIDATES = [
  { id: 1, name: "Alice Johnson" },
  { id: 2, name: "Bob Martinez" },
  { id: 3, name: "Clara Singh" },
  { id: 4, name: "David Chen" }
];

const ADMIN_USER = "admin";
const ADMIN_PASS = "1234";

// All pages
const PAGES = ["voter", "settings", "admin"];

// ─── Page navigation ──────────────────────────────────────────
function showPage(name) {
  PAGES.forEach(p => {
    document.getElementById("page-" + p).classList.add("hidden");
  });
  document.getElementById("page-" + name).classList.remove("hidden");

  // Clear admin fields and error every time settings page opens
  if (name === "settings") {
    document.getElementById("adminUser").value = "";
    document.getElementById("adminPass").value = "";
    document.getElementById("adminError").textContent = "";
  }

  // Refresh dashboard data every time admin page is shown
  if (name === "admin") {
    renderDashboard();
  }
}

// ─── LocalStorage helpers ─────────────────────────────────────
function loadVotes()    { return JSON.parse(localStorage.getItem("votes")    || "{}"); }
function loadVoters()   { return JSON.parse(localStorage.getItem("voters")   || "[]"); }
function loadVotedIDs() { return JSON.parse(localStorage.getItem("votedIDs") || "[]"); }

function saveAll(votes, voters, votedIDs) {
  localStorage.setItem("votes",    JSON.stringify(votes));
  localStorage.setItem("voters",   JSON.stringify(voters));
  localStorage.setItem("votedIDs", JSON.stringify(votedIDs));
}

// ─── Render candidate buttons ──────────────────────────────────
function renderCandidates() {
  const container = document.getElementById("candidateList");
  container.innerHTML = "<p><strong>Select a candidate:</strong></p>";

  CANDIDATES.forEach(c => {
    const div = document.createElement("div");
    div.className = "candidate-btn";
    div.innerHTML = `
      <span>${c.name}</span>
      <button onclick="castVote(${c.id}, '${c.name}')">Vote</button>
    `;
    container.appendChild(div);
  });
}

// ─── Cast vote ────────────────────────────────────────────────
function castVote(candidateId, candidateName) {
  const name    = document.getElementById("voterName").value.trim();
  const voterID = document.getElementById("voterID").value.trim();
  const errEl   = document.getElementById("formError");
  const msgEl   = document.getElementById("voteMessage");

  errEl.textContent = "";
  msgEl.textContent = "";

  if (!name || !voterID) {
    errEl.textContent = "Please enter your Full Name and Voter ID.";
    return;
  }

  const votedIDs = loadVotedIDs();

  if (votedIDs.includes(voterID)) {
    errEl.textContent = "You have already voted. Each Voter ID can only vote once.";
    return;
  }

  const votes  = loadVotes();
  const voters = loadVoters();

  votes[candidateId] = (votes[candidateId] || 0) + 1;
  voters.push({ name, voterId: voterID, candidate: candidateName });
  votedIDs.push(voterID);

  saveAll(votes, voters, votedIDs);

  document.getElementById("voteForm").style.display = "none";
  msgEl.textContent = `✅ Thank you, ${name}! Your vote for "${candidateName}" has been recorded.`;
}

// ─── Admin login (called from Settings page) ──────────────────
function adminLogin() {
  const user = document.getElementById("adminUser").value.trim();
  const pass = document.getElementById("adminPass").value;

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    showPage("admin"); // go straight to dashboard, settings page hides
  } else {
    document.getElementById("adminError").textContent = "Wrong username or password.";
  }
}

// ─── Render admin dashboard ───────────────────────────────────
function renderDashboard() {
  const votes  = loadVotes();
  const voters = loadVoters();
  const total  = Object.values(votes).reduce((a, b) => a + b, 0);

  document.getElementById("totalVotes").textContent = total;

  // Bar chart
  const barsDiv = document.getElementById("resultBars");
  barsDiv.innerHTML = "";

  CANDIDATES.forEach(c => {
    const count = votes[c.id] || 0;
    const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
    barsDiv.innerHTML += `
      <div class="bar-row">
        <div class="bar-label">${c.name} — ${count} vote(s) (${pct}%)</div>
        <div class="bar-bg"><div class="bar-fill" style="width:${pct}%"></div></div>
      </div>
    `;
  });

  // Voter log table
  const tbody = document.getElementById("logBody");
  tbody.innerHTML = "";

  if (voters.length === 0) {
    tbody.innerHTML = "<tr><td colspan='3'>No votes yet.</td></tr>";
  } else {
    voters.forEach(v => {
      tbody.innerHTML += `<tr><td>${v.name}</td><td>${v.voterId}</td><td>${v.candidate}</td></tr>`;
    });
  }
}

// ─── Reset all votes ──────────────────────────────────────────
function resetVotes() {
  if (!confirm("Reset ALL votes? This cannot be undone.")) return;
  localStorage.removeItem("votes");
  localStorage.removeItem("voters");
  localStorage.removeItem("votedIDs");
  renderDashboard();
  alert("All votes have been reset.");
}

// ─── Logout ───────────────────────────────────────────────────
function logout() {
  // Reset voter page state
  document.getElementById("voteForm").style.display = "block";
  document.getElementById("voterName").value = "";
  document.getElementById("voterID").value   = "";
  document.getElementById("voteMessage").textContent = "";
  document.getElementById("formError").textContent   = "";
  showPage("voter");
}

// ─── Init ─────────────────────────────────────────────────────
renderCandidates();
showPage("voter"); // start on voter page