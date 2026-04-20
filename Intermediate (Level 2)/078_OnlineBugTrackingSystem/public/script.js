let bugs = [];
let isAdmin = false;
async function load() {
const r = await fetch('/api/bugs');
bugs = await r.json();
renderBugs();
if (isAdmin) loadStats();
}
function renderBugs() {
const search = document.getElementById('search').value.toLowerCase();
const sev = document.getElementById('filterSeverity').value;
const st = document.getElementById('filterStatus').value;
let filtered = bugs.filter(b => {
return (!search || b.title.toLowerCase().includes(search)) &&
(!sev || b.severity === sev) &&
(!st || b.status === st);
});
const tb = document.getElementById('bugTable');
const ah = document.getElementById('actionHead');
if (isAdmin) ah.style.display = '';
else ah.style.display = 'none';
if (!filtered.length) {
tb.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:32px">No bugs found.</td></tr>';
return;
}
tb.innerHTML = filtered.map(b => `
<tr>
<td style="font-family:'JetBrains Mono',monospace;color:var(--muted)">#${b.id}</td>
<td><button class="link-btn" onclick="showDetail(${b.id})">${b.title}</button></td>
<td><span class="badge sev-${b.severity.toLowerCase()}">${b.severity}</span></td>
<td><span class="badge st-${b.status === 'In Progress' ? 'progress' : b.status.toLowerCase()}">${b.status}</span></td>
<td>${b.name}</td>
<td style="font-family:'JetBrains Mono',monospace;font-size:0.78rem;color:var(--muted)">${new Date(b.createdAt).toLocaleDateString()}</td>
<td>${isAdmin ? `<button class="act-btn" onclick="nextStatus(${b.id})">${b.status === 'Open' ? '→ In Progress' : b.status === 'In Progress' ? '→ Resolved' : '✓ Done'}</button><button class="del-btn" onclick="deleteBug(${b.id})">Delete</button>` : ''}</td>
</tr>`).join('');
}
async function submitBug() {
const name = document.getElementById('name').value.trim();
const email = document.getElementById('email').value.trim();
const title = document.getElementById('title').value.trim();
const description = document.getElementById('description').value.trim();
const severity = document.getElementById('severity').value;
const msg = document.getElementById('formMsg');
if (!name || !email || !title || !description || !severity) {
msg.style.color = 'var(--accent2)'; msg.textContent = 'All fields are required.'; return;
}
const r = await fetch('/api/bugs', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name,email,title,description,severity}) });
const data = await r.json();
if (!r.ok) { msg.style.color = 'var(--accent2)'; msg.textContent = data.error; return; }
msg.style.color = 'var(--res)'; msg.textContent = `Bug #${data.id} submitted successfully!`;
['name','email','title','description'].forEach(id => document.getElementById(id).value = '');
document.getElementById('severity').value = '';
load();
}
async function nextStatus(id) {
const bug = bugs.find(b => b.id === id);
if (!bug || bug.status === 'Resolved') return;
const next = bug.status === 'Open' ? 'In Progress' : 'Resolved';
await fetch(`/api/bugs/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({status: next}) });
load();
}
async function deleteBug(id) {
if (!confirm('Delete this bug?')) return;
await fetch(`/api/bugs/${id}`, { method: 'DELETE' });
load();
}
async function loadStats() {
const r = await fetch('/api/stats');
const s = await r.json();
document.getElementById('statTotal').textContent = s.total;
document.getElementById('statOpen').textContent = s.open;
document.getElementById('statProgress').textContent = s.inProgress;
document.getElementById('statResolved').textContent = s.resolved;
}
function showAdminModal() {
document.getElementById('adminModal').style.display = 'flex';
document.getElementById('loginMsg').textContent = '';
}
function closeModal() { document.getElementById('adminModal').style.display = 'none'; }
async function adminLogin() {
const username = document.getElementById('adminUser').value;
const password = document.getElementById('adminPass').value;
const r = await fetch('/api/admin/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({username,password}) });
const data = await r.json();
if (!r.ok) { document.getElementById('loginMsg').style.color = 'var(--accent2)'; document.getElementById('loginMsg').textContent = data.error; return; }
isAdmin = true;
closeModal();
document.getElementById('adminBtn').style.display = 'none';
document.getElementById('logoutBtn').style.display = '';
document.getElementById('adminPanel').style.display = '';
showSection('bugs');
load();
}
function logout() {
isAdmin = false;
document.getElementById('adminBtn').style.display = '';
document.getElementById('logoutBtn').style.display = 'none';
document.getElementById('adminPanel').style.display = 'none';
renderBugs();
}
function showSection(s) {
document.getElementById('reportSection').style.display = s === 'report' ? '' : 'none';
document.getElementById('bugsSection').style.display = s === 'bugs' ? '' : 'none';
if (s === 'bugs') load();
}
function showDetail(id) {
const b = bugs.find(x => x.id === id);
if (!b) return;
document.getElementById('detailTitle').textContent = b.title;
document.getElementById('detailBody').innerHTML = `
<div class="detail-row"><strong>Bug ID</strong> #${b.id}</div>
<div class="detail-row"><strong>Severity</strong><span class="badge sev-${b.severity.toLowerCase()}">${b.severity}</span></div>
<div class="detail-row"><strong>Status</strong><span class="badge st-${b.status === 'In Progress' ? 'progress' : b.status.toLowerCase()}">${b.status}</span></div>
<div class="detail-row"><strong>Reporter</strong> ${b.name} (${b.email})</div>
<div class="detail-row"><strong>Date</strong> ${new Date(b.createdAt).toLocaleString()}</div>
<div class="detail-row" style="flex-direction:column"><strong style="margin-bottom:6px">Description</strong><div style="color:var(--text);line-height:1.6">${b.description}</div></div>`;
document.getElementById('detailModal').style.display = 'flex';
}
function closeDetailModal() { document.getElementById('detailModal').style.display = 'none'; }
load();