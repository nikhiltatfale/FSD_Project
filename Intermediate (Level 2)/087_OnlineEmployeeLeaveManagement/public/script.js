async function applyLeave() {
  const body = {
    name: document.getElementById("name").value.trim(),
    empId: document.getElementById("empId").value.trim(),
    department: document.getElementById("department").value.trim(),
    leaveType: document.getElementById("leaveType").value,
    fromDate: document.getElementById("fromDate").value,
    toDate: document.getElementById("toDate").value,
    reason: document.getElementById("reason").value.trim()
  };
  const msg = document.getElementById("submitMsg");
  const res = await fetch("/apply-leave", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json();
  msg.style.color = res.ok ? "green" : "red";
  msg.textContent = res.ok ? "Leave submitted successfully! ID: " + data.leave.id : data.error;
}
async function checkStatus() {
  const empId = document.getElementById("checkEmpId").value.trim();
  if (!empId) return;
  const res = await fetch("/employee/" + empId);
  const data = await res.json();
  const div = document.getElementById("statusResult");
  if (!data.length) { div.textContent = "No records found."; return; }
  div.innerHTML = buildTable(data);
}
function toggleAdminLogin() {
  document.getElementById("adminLoginBox").classList.toggle("hidden");
}
async function adminLogin() {
  const username = document.getElementById("adminUser").value.trim();
  const password = document.getElementById("adminPass").value.trim();
  const res = await fetch("/admin-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
  const data = await res.json();
  const msg = document.getElementById("loginMsg");
  if (res.ok) {
    document.getElementById("adminLoginBox").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("hidden");
    loadLeaves();
  } else {
    msg.style.color = "red";
    msg.textContent = data.error;
  }
}
async function loadLeaves() {
  const res = await fetch("/all-leaves");
  const data = await res.json();
  document.getElementById("adminTable").innerHTML = buildAdminTable(data);
}
async function searchLeaves() {
  const empId = document.getElementById("searchEmpId").value.trim();
  const url = empId ? "/all-leaves?empId=" + empId : "/all-leaves";
  const res = await fetch(url);
  const data = await res.json();
  document.getElementById("adminTable").innerHTML = buildAdminTable(data);
}
async function updateStatus(id, status) {
  await fetch("/update-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
  loadLeaves();
}
async function deleteLeave(id) {
  await fetch("/delete/" + id, { method: "DELETE" });
  loadLeaves();
}
function buildTable(data) {
  return `<table><tr><th>ID</th><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th></tr>${data.map(l => `<tr><td>${l.id}</td><td>${l.leaveType}</td><td>${l.fromDate}</td><td>${l.toDate}</td><td>${l.reason}</td><td class="status-${l.status}">${l.status}</td></tr>`).join("")}</table>`;
}
function buildAdminTable(data) {
  if (!data.length) return "<p>No records found.</p>";
  return `<table><tr><th>ID</th><th>Name</th><th>EmpID</th><th>Dept</th><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th><th>Actions</th></tr>${data.map(l => `<tr><td>${l.id}</td><td>${l.name}</td><td>${l.empId}</td><td>${l.department}</td><td>${l.leaveType}</td><td>${l.fromDate}</td><td>${l.toDate}</td><td>${l.reason}</td><td class="status-${l.status}">${l.status}</td><td><button class="btn-approve" onclick="updateStatus(${l.id},'Approved')">✓</button><button class="btn-reject" onclick="updateStatus(${l.id},'Rejected')">✗</button><button class="btn-delete" onclick="deleteLeave(${l.id})">🗑</button></td></tr>`).join("")}</table>`;
}