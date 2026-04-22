let allCandidates = [];

async function loadJobs() {
  const jobs = await fetch("/jobs").then(r => r.json());
  const sel = document.getElementById("role");
  sel.innerHTML = jobs.map(j => `<option>${j.role}</option>`).join("");
  const fr = document.getElementById("filter-role");
  if (fr) fr.innerHTML = `<option value="">All Roles</option>` + jobs.map(j => `<option>${j.role}</option>`).join("");
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    if (file.type === "application/pdf") {
      reader.onload = e => {
        let text = "";
        const bytes = new Uint8Array(e.target.result);
        for (let i = 0; i < bytes.length; i++) {
          const c = bytes[i];
          if (c >= 32 && c < 127) text += String.fromCharCode(c);
          else if (c === 10 || c === 13) text += " ";
        }
        resolve(text);
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = e => resolve(e.target.result);
      reader.readAsText(file);
    }
    reader.onerror = reject;
  });
}

async function submitResume() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const role = document.getElementById("role").value;
  const file = document.getElementById("resume").files[0];
  if (!name || !email || !phone || !file) return alert("Please fill all fields and upload a resume.");
  const btn = document.getElementById("submit-btn");
  btn.textContent = "Screening...";
  btn.disabled = true;
  try {
    const resumeText = await readFile(file);
    const res = await fetch("/submit-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, role, resumeText })
    });
    const data = await res.json();
    showResult(data);
  } catch (e) {
    alert("Error processing resume.");
  }
  btn.textContent = "Screen My Resume";
  btn.disabled = false;
}

function showResult(data) {
  const el = document.getElementById("result");
  const cls = data.status === "Selected" ? "selected" : data.status === "Review" ? "review" : "rejected";
  const badgeCls = `badge-${cls}`;
  el.className = `result ${cls}`;
  el.innerHTML = `
    <div class="score-big">${data.score}<span style="font-size:1.2rem;font-weight:400">%</span></div>
    <span class="status-badge ${badgeCls}">${data.status}</span>
    <p style="margin:.5rem 0 .3rem;font-size:.85rem;color:var(--muted)">Matched Skills</p>
    <div class="skill-list">${data.matched.map(s => `<span class="skill">${s}</span>`).join("") || "<span style='color:var(--muted);font-size:.85rem'>None</span>"}</div>
    <p style="margin:.7rem 0 .3rem;font-size:.85rem;color:var(--muted)">Missing Skills</p>
    <div class="skill-list">${data.missing.map(s => `<span class="skill missing">${s}</span>`).join("") || "<span style='color:var(--muted);font-size:.85rem'>None</span>"}</div>
  `;
  el.classList.remove("hidden");
}

let adminLoggedIn = false;
let clickCount = 0;

function toggleAdmin() {
  clickCount++;
  if (clickCount >= 3) {
    clickCount = 0;
    document.getElementById("candidate-section").classList.toggle("hidden");
    document.getElementById("admin-section").classList.toggle("hidden");
    if (adminLoggedIn) showDashboard();
  }
}

async function adminLogin() {
  const username = document.getElementById("admin-user").value;
  const password = document.getElementById("admin-pass").value;
  const res = await fetch("/admin-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (data.success) {
    adminLoggedIn = true;
    document.getElementById("login-error").classList.add("hidden");
    showDashboard();
  } else {
    document.getElementById("login-error").classList.remove("hidden");
  }
}

async function showDashboard() {
  document.getElementById("login-card").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  await loadJobs();
  await loadJobsTable();
  await loadCandidatesTable();
}

function logout() {
  adminLoggedIn = false;
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("login-card").classList.remove("hidden");
  document.getElementById("admin-section").classList.add("hidden");
  document.getElementById("candidate-section").classList.remove("hidden");
  document.getElementById("admin-user").value = "";
  document.getElementById("admin-pass").value = "";
}

async function loadJobsTable() {
  const jobs = await fetch("/jobs").then(r => r.json());
  const tbody = document.querySelector("#jobs-table tbody");
  tbody.innerHTML = jobs.map(j => `
    <tr>
      <td>${j.id}</td>
      <td>${j.role}</td>
      <td>${j.keywords.join(", ")}</td>
      <td><button class="del-btn" onclick="deleteJob(${j.id})">Delete</button></td>
    </tr>`).join("");
}

async function addJob() {
  const role = document.getElementById("new-role").value.trim();
  const kw = document.getElementById("new-keywords").value.trim();
  if (!role || !kw) return alert("Enter role and keywords.");
  const keywords = kw.split(",").map(k => k.trim()).filter(Boolean);
  await fetch("/add-job", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, keywords })
  });
  document.getElementById("new-role").value = "";
  document.getElementById("new-keywords").value = "";
  await loadJobsTable();
  await loadJobs();
}

async function deleteJob(id) {
  if (!confirm("Delete this role?")) return;
  await fetch(`/delete-job/${id}`, { method: "DELETE" });
  await loadJobsTable();
  await loadJobs();
}

async function loadCandidatesTable(role = "", status = "") {
  allCandidates = await fetch("/candidates").then(r => r.json());
  let data = allCandidates;
  if (role) data = data.filter(c => c.role === role);
  if (status) data = data.filter(c => c.status === status);
  const tbody = document.querySelector("#candidates-table tbody");
  if (!data.length) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted)">No candidates found</td></tr>`; return; }
  tbody.innerHTML = data.map(c => {
    const cls = c.status === "Selected" ? "badge-selected" : c.status === "Review" ? "badge-review" : "badge-rejected";
    return `<tr>
      <td>${c.name}</td>
      <td>${c.email}</td>
      <td>${c.role}</td>
      <td>${c.score}%</td>
      <td><span class="status-badge ${cls}" style="margin:0">${c.status}</span></td>
      <td><button class="view-btn" onclick="viewResume(${c.id})">View</button></td>
    </tr>`;
  }).join("");
}

function filterCandidates() {
  const role = document.getElementById("filter-role").value;
  const status = document.getElementById("filter-status").value;
  loadCandidatesTable(role, status);
}

function exportCandidates() {
  const data = JSON.stringify(allCandidates, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "candidates.json"; a.click();
  URL.revokeObjectURL(url);
}

function viewResume(id) {
  const c = allCandidates.find(x => x.id === id);
  if (!c) return;
  document.getElementById("modal-text").textContent = c.resumeText || "No text available.";
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

function showTab(id, btn) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.add("hidden"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(id).classList.remove("hidden");
  btn.classList.add("active");
}

loadJobs();