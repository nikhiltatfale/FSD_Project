const API = '';
let currentUser = null;
let currentDate = new Date().toISOString().split('T')[0];
let allTasks = [];
let currentFilter = 'all';
let editingTaskId = null;
let adminToken = null;

// ── Init ──────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const savedName = localStorage.getItem('plannerUser');
  document.getElementById('datePicker').value = currentDate;

  if (savedName) {
    initUser(savedName);
  } else {
    document.getElementById('nameModal').classList.remove('hidden');
  }

  document.getElementById('nameSubmitBtn').addEventListener('click', handleNameSubmit);
  document.getElementById('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') handleNameSubmit(); });
  document.getElementById('datePicker').addEventListener('change', e => { currentDate = e.target.value; loadTasks(); });
  document.getElementById('addTaskBtn').addEventListener('click', handleAddTask);
  document.getElementById('cancelEditBtn').addEventListener('click', cancelEdit);
  document.getElementById('adminAccessBtn').addEventListener('click', () => toggleModal('adminModal', true));
  document.getElementById('adminModalClose').addEventListener('click', () => toggleModal('adminModal', false));
  document.getElementById('adminLoginBtn').addEventListener('click', handleAdminLogin);
  document.getElementById('adminLogoutBtn').addEventListener('click', adminLogout);
  document.getElementById('adminFilterBtn').addEventListener('click', loadAdminTasks);
  document.getElementById('adminFilterClear').addEventListener('click', () => {
    document.getElementById('adminFilterUser').value = '';
    document.getElementById('adminFilterDate').value = '';
    loadAdminTasks();
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });
});

function toggleModal(id, show) {
  document.getElementById(id).classList.toggle('hidden', !show);
}

// ── User ──────────────────────────────────────────────────────────────────────
async function handleNameSubmit() {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) { document.getElementById('nameError').textContent = 'Please enter your name'; return; }
  await initUser(name);
}

async function initUser(name) {
  try {
    const res = await fetch(`${API}/api/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (!res.ok) throw new Error('Failed');
    currentUser = await res.json();
    localStorage.setItem('plannerUser', currentUser.name);
    document.getElementById('nameModal').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    document.getElementById('greetUser').textContent = `Hello, ${currentUser.name}!`;
    loadTasks();
  } catch (e) {
    document.getElementById('nameError').textContent = 'Error connecting to server.';
  }
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
async function loadTasks() {
  try {
    const res = await fetch(`${API}/api/tasks?user=${encodeURIComponent(currentUser.name)}&date=${currentDate}`);
    allTasks = await res.json();
    renderTasks();
    updateProgress();
  } catch (e) {
    console.error('Load tasks error', e);
  }
}

function renderTasks() {
  const list = document.getElementById('taskList');
  let tasks = allTasks;
  if (currentFilter === 'completed') tasks = tasks.filter(t => t.completed);
  if (currentFilter === 'pending') tasks = tasks.filter(t => !t.completed);

  if (!tasks.length) {
    list.innerHTML = '<div class="empty-state">No tasks found. Add one above!</div>';
    return;
  }

  // Sort: High > Medium > Low, then by time
  const prioOrder = { High: 0, Medium: 1, Low: 2 };
  tasks = [...tasks].sort((a, b) => {
    if (prioOrder[a.priority] !== prioOrder[b.priority]) return prioOrder[a.priority] - prioOrder[b.priority];
    return (a.time || '').localeCompare(b.time || '');
  });

  list.innerHTML = tasks.map(t => `
    <div class="task-card ${t.priority} ${t.completed ? 'done' : ''}">
      <div class="task-top">
        <div>
          <div class="task-title ${t.completed ? 'done-text' : ''}">${escHtml(t.title)}</div>
          <div class="task-meta">
            ${t.time ? `<span>🕐 ${t.time}</span>` : ''}
            <span class="priority-badge ${t.priority}">${t.priority}</span>
          </div>
        </div>
      </div>
      ${t.description ? `<div style="font-size:13px;color:#555">${escHtml(t.description)}</div>` : ''}
      <div class="task-actions">
        <button class="${t.completed ? 'btn-uncomplete' : 'btn-complete'}" onclick="toggleComplete(${t.id}, ${t.completed})">
          ${t.completed ? '↩ Undo' : '✓ Done'}
        </button>
        <button class="btn-edit" onclick="startEdit(${t.id})">✏ Edit</button>
        <button class="btn-delete" onclick="deleteTask(${t.id})">🗑 Delete</button>
      </div>
    </div>
  `).join('');
}

function updateProgress() {
  const total = allTasks.length;
  const done = allTasks.filter(t => t.completed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progressLabel').textContent = `Progress: ${pct}%`;
  document.getElementById('taskCount').textContent = `${done}/${total} tasks`;
  document.getElementById('progressFill').style.width = pct + '%';
}

async function handleAddTask() {
  const title = document.getElementById('taskTitle').value.trim();
  const description = document.getElementById('taskDesc').value.trim();
  const time = document.getElementById('taskTime').value;
  const priority = document.getElementById('taskPriority').value;
  const errEl = document.getElementById('taskError');

  if (!title) { errEl.textContent = 'Task title is required.'; return; }
  errEl.textContent = '';

  try {
    if (editingTaskId) {
      await fetch(`${API}/api/tasks/${editingTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, time, priority })
      });
      cancelEdit();
    } else {
      await fetch(`${API}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: currentUser.name, date: currentDate, title, description, time, priority })
      });
    }
    clearForm();
    loadTasks();
  } catch (e) {
    errEl.textContent = 'Failed to save task.';
  }
}

function startEdit(id) {
  const task = allTasks.find(t => t.id === id);
  if (!task) return;
  editingTaskId = id;
  document.getElementById('taskTitle').value = task.title;
  document.getElementById('taskDesc').value = task.description;
  document.getElementById('taskTime').value = task.time;
  document.getElementById('taskPriority').value = task.priority;
  document.getElementById('formTitle').textContent = 'Edit Task';
  document.getElementById('addTaskBtn').textContent = 'Save Changes';
  document.getElementById('cancelEditBtn').classList.remove('hidden');
  document.getElementById('taskTitle').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
  editingTaskId = null;
  clearForm();
  document.getElementById('formTitle').textContent = 'Add New Task';
  document.getElementById('addTaskBtn').textContent = 'Add Task';
  document.getElementById('cancelEditBtn').classList.add('hidden');
}

function clearForm() {
  document.getElementById('taskTitle').value = '';
  document.getElementById('taskDesc').value = '';
  document.getElementById('taskTime').value = '';
  document.getElementById('taskPriority').value = 'Low';
  document.getElementById('taskError').textContent = '';
}

async function toggleComplete(id, current) {
  try {
    await fetch(`${API}/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !current })
    });
    loadTasks();
  } catch (e) { console.error(e); }
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    await fetch(`${API}/api/tasks/${id}`, { method: 'DELETE' });
    loadTasks();
  } catch (e) { console.error(e); }
}

// ── Admin ─────────────────────────────────────────────────────────────────────
async function handleAdminLogin() {
  const username = document.getElementById('adminUser').value.trim();
  const password = document.getElementById('adminPass').value.trim();
  const errEl = document.getElementById('adminError');
  if (!username || !password) { errEl.textContent = 'Fill all fields.'; return; }
  try {
    const res = await fetch(`${API}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Login failed'; return; }
    adminToken = data.token;
    toggleModal('adminModal', false);
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');
    loadAdminData();
  } catch (e) {
    errEl.textContent = 'Connection error.';
  }
}

function adminLogout() {
  adminToken = null;
  document.getElementById('adminDashboard').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
}

async function loadAdminData() {
  await loadAdminUsers();
  await loadAdminTasks();
}

async function loadAdminUsers() {
  try {
    const res = await fetch(`${API}/api/admin/users`, { headers: { token: adminToken } });
    const users = await res.json();
    const statsEl = document.getElementById('adminStats');
    const tasksRes = await fetch(`${API}/api/admin/tasks`, { headers: { token: adminToken } });
    const tasks = await tasksRes.json();
    const completed = tasks.filter(t => t.completed).length;

    statsEl.innerHTML = `
      <div class="stat-card"><div class="stat-num">${users.length}</div><div class="stat-label">Total Users</div></div>
      <div class="stat-card"><div class="stat-num">${tasks.length}</div><div class="stat-label">Total Tasks</div></div>
      <div class="stat-card"><div class="stat-num">${completed}</div><div class="stat-label">Completed</div></div>
      <div class="stat-card"><div class="stat-num">${tasks.length - completed}</div><div class="stat-label">Pending</div></div>
    `;

    const usersEl = document.getElementById('adminUsers');
    if (!users.length) { usersEl.innerHTML = '<div class="empty-state">No users yet.</div>'; return; }
    usersEl.innerHTML = `<table>
      <thead><tr><th>Name</th><th>Joined</th><th>Tasks</th></tr></thead>
      <tbody>${users.map(u => `
        <tr>
          <td>${escHtml(u.name)}</td>
          <td>${new Date(u.createdAt).toLocaleDateString()}</td>
          <td>${tasks.filter(t => t.user.toLowerCase() === u.name.toLowerCase()).length}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  } catch (e) { console.error(e); }
}

async function loadAdminTasks() {
  try {
    const res = await fetch(`${API}/api/admin/tasks`, { headers: { token: adminToken } });
    let tasks = await res.json();

    const filterUser = document.getElementById('adminFilterUser').value.trim().toLowerCase();
    const filterDate = document.getElementById('adminFilterDate').value;
    if (filterUser) tasks = tasks.filter(t => t.user.toLowerCase().includes(filterUser));
    if (filterDate) tasks = tasks.filter(t => t.date === filterDate);

    const tasksEl = document.getElementById('adminTasks');
    if (!tasks.length) { tasksEl.innerHTML = '<div class="empty-state">No tasks found.</div>'; return; }
    tasksEl.innerHTML = `<table>
      <thead><tr><th>User</th><th>Date</th><th>Title</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>${tasks.map(t => `
        <tr>
          <td>${escHtml(t.user)}</td>
          <td>${t.date}</td>
          <td>${escHtml(t.title)}</td>
          <td><span class="priority-badge ${t.priority}">${t.priority}</span></td>
          <td>${t.completed ? '✅ Done' : '⏳ Pending'}</td>
          <td><button class="btn-delete" style="padding:4px 10px;font-size:12px" onclick="adminDeleteTask(${t.id})">Delete</button></td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  } catch (e) { console.error(e); }
}

async function adminDeleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    await fetch(`${API}/api/admin/task/${id}`, { method: 'DELETE', headers: { token: adminToken } });
    loadAdminData();
  } catch (e) { console.error(e); }
}

// ── Util ──────────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}