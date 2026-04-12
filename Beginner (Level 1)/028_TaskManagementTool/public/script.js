/* ============================================
   TaskFlow — Frontend Logic (Vanilla JS)
   ============================================ */

const API = 'http://localhost:3000/tasks';

let allTasks = [];
let currentFilter = 'all';
let searchQuery = '';
let editingId = null;

// ---- DOM refs ----
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const filterTabs = document.querySelectorAll('.filter-tab');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const submitBtn = document.getElementById('submit-btn');
const toggleFormBtn = document.getElementById('toggle-form');
const taskFormEl = document.getElementById('task-form');

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  fetchTasks();
  bindEvents();
  setMinDate();
});

function setMinDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('task-due').setAttribute('min', today);
  document.getElementById('edit-due').setAttribute('min', today);
}

// ---- FETCH ----
async function fetchTasks() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error('Failed to fetch');
    allTasks = await res.json();
    renderTasks();
    updateStats();
  } catch (err) {
    showToast('Could not connect to server.', 'error', '⚠');
  }
}

// ---- ADD TASK ----
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('task-title').value.trim();
  if (!title) { showToast('Task title is required.', 'error', '⚠'); return; }

  const payload = {
    title,
    description: document.getElementById('task-desc').value.trim(),
    dueDate: document.getElementById('task-due').value || null,
    priority: document.getElementById('task-priority').value,
    category: document.getElementById('task-category').value.trim(),
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Adding…';

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error();
    const newTask = await res.json();

    allTasks.unshift(newTask);
    taskForm.reset();
    renderTasks();
    updateStats();
    showToast('Task added successfully!', 'success', '✓');
  } catch {
    showToast('Failed to add task.', 'error', '✕');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span class="btn-icon">+</span> Add Task';
  }
});

// ---- DELETE TASK ----
async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    allTasks = allTasks.filter(t => t.id !== id);
    renderTasks();
    updateStats();
    showToast('Task deleted.', 'warning', '🗑');
  } catch {
    showToast('Failed to delete task.', 'error', '✕');
  }
}

// ---- TOGGLE COMPLETE ----
async function toggleComplete(id) {
  const task = allTasks.find(t => t.id === id);
  if (!task) return;

  const updated = { ...task, completed: !task.completed };
  try {
    const res = await fetch(`${API}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (!res.ok) throw new Error();
    const result = await res.json();
    const idx = allTasks.findIndex(t => t.id === id);
    allTasks[idx] = result;
    renderTasks();
    updateStats();
    showToast(result.completed ? 'Task completed! 🎉' : 'Task marked as pending.', 'success', result.completed ? '🎉' : '↩');
  } catch {
    showToast('Failed to update task.', 'error', '✕');
  }
}

// ---- OPEN EDIT MODAL ----
function openEditModal(id) {
  const task = allTasks.find(t => t.id === id);
  if (!task) return;
  editingId = id;

  document.getElementById('edit-id').value = id;
  document.getElementById('edit-title').value = task.title;
  document.getElementById('edit-desc').value = task.description || '';
  document.getElementById('edit-due').value = task.dueDate || '';
  document.getElementById('edit-priority').value = task.priority;
  document.getElementById('edit-category').value = task.category || '';

  editModal.style.display = 'flex';
  document.getElementById('edit-title').focus();
}

function closeEditModal() {
  editModal.style.display = 'none';
  editingId = null;
}

// ---- SAVE EDIT ----
editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!editingId) return;

  const task = allTasks.find(t => t.id === editingId);
  const updated = {
    ...task,
    title: document.getElementById('edit-title').value.trim(),
    description: document.getElementById('edit-desc').value.trim(),
    dueDate: document.getElementById('edit-due').value || null,
    priority: document.getElementById('edit-priority').value,
    category: document.getElementById('edit-category').value.trim(),
  };

  if (!updated.title) { showToast('Title is required.', 'error', '⚠'); return; }

  try {
    const res = await fetch(`${API}/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (!res.ok) throw new Error();
    const result = await res.json();
    const idx = allTasks.findIndex(t => t.id === editingId);
    allTasks[idx] = result;
    closeEditModal();
    renderTasks();
    showToast('Task updated!', 'success', '✓');
  } catch {
    showToast('Failed to update task.', 'error', '✕');
  }
});

// ---- RENDER ----
function renderTasks() {
  const filtered = getFilteredTasks();
  taskList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  filtered.forEach((task, i) => {
    const card = createTaskCard(task, i);
    taskList.appendChild(card);
  });
}

function getFilteredTasks() {
  let tasks = [...allTasks];

  // Filter
  switch (currentFilter) {
    case 'pending': tasks = tasks.filter(t => !t.completed); break;
    case 'completed': tasks = tasks.filter(t => t.completed); break;
    case 'high': tasks = tasks.filter(t => t.priority === 'high'); break;
  }

  // Search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    tasks = tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q))
    );
  }

  return tasks;
}

function createTaskCard(task, index) {
  const card = document.createElement('div');
  card.className = `task-card${task.completed ? ' completed' : ''}`;
  card.dataset.priority = task.priority;
  card.style.animationDelay = `${index * 0.04}s`;

  // Due date logic
  let dueChipClass = 'chip-due';
  let dueLabel = '';
  if (task.dueDate) {
    const due = new Date(task.dueDate + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due - today) / 86400000);
    if (diff < 0) { dueChipClass += ' overdue'; dueLabel = `⚠ Overdue`; }
    else if (diff === 0) dueLabel = '📅 Today';
    else if (diff === 1) dueLabel = '📅 Tomorrow';
    else dueLabel = `📅 ${formatDate(task.dueDate)}`;
  }

  const priorityLabel = { high: 'High', medium: 'Medium', low: 'Low' }[task.priority];

  card.innerHTML = `
    <button class="task-check" onclick="toggleComplete('${task.id}')" title="${task.completed ? 'Mark pending' : 'Mark complete'}">
      ${task.completed ? '✓' : ''}
    </button>
    <div class="task-body">
      <div class="task-title">${escapeHtml(task.title)}</div>
      ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
      <div class="task-meta">
        <span class="meta-chip chip-priority ${task.priority}">${priorityLabel}</span>
        ${task.dueDate ? `<span class="meta-chip ${dueChipClass}">${dueLabel}</span>` : ''}
        ${task.category ? `<span class="meta-chip chip-category"># ${escapeHtml(task.category)}</span>` : ''}
      </div>
    </div>
    <div class="task-actions">
      <button class="action-btn edit" onclick="openEditModal('${task.id}')" title="Edit task">✎</button>
      <button class="action-btn delete" onclick="deleteTask('${task.id}')" title="Delete task">✕</button>
    </div>
  `;

  return card;
}

// ---- STATS ----
function updateStats() {
  document.getElementById('stat-total').textContent = allTasks.length;
  document.getElementById('stat-done').textContent = allTasks.filter(t => t.completed).length;
  document.getElementById('stat-pending').textContent = allTasks.filter(t => !t.completed).length;
}

// ---- EVENTS ----
function bindEvents() {
  // Filter tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderTasks();
    });
  });

  // Search
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
    renderTasks();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderTasks();
    searchInput.focus();
  });

  // Modal close
  modalClose.addEventListener('click', closeEditModal);
  modalCancel.addEventListener('click', closeEditModal);
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editModal.style.display !== 'none') closeEditModal();
  });

  // Collapse sidebar form
  let formVisible = true;
  toggleFormBtn.addEventListener('click', () => {
    formVisible = !formVisible;
    taskFormEl.style.display = formVisible ? '' : 'none';
    toggleFormBtn.textContent = formVisible ? '−' : '+';
  });
}

// ---- TOAST ----
function showToast(message, type = 'success', icon = '✓') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3200);
}

// ---- UTILS ----
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}