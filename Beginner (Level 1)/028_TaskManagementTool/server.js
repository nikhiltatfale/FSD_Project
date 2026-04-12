const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const TASKS_FILE = path.join(__dirname, 'tasks.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Read tasks from file
function readTasks() {
  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, JSON.stringify([]));
    return [];
  }
  try {
    const data = fs.readFileSync(TASKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Helper: Write tasks to file
function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

// GET /tasks - Get all tasks
app.get('/tasks', (req, res) => {
  const tasks = readTasks();
  res.json(tasks);
});

// POST /tasks - Add new task
app.post('/tasks', (req, res) => {
  const { title, description, dueDate, priority, category } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  const tasks = readTasks();
  const newTask = {
    id: Date.now().toString(),
    title: title.trim(),
    description: description ? description.trim() : '',
    dueDate: dueDate || null,
    priority: priority || 'medium',
    category: category ? category.trim() : '',
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(newTask);
  writeTasks(tasks);
  res.status(201).json(newTask);
});

// PUT /tasks/:id - Update task
app.put('/tasks/:id', (req, res) => {
  const { id } = req.params;
  const tasks = readTasks();
  const index = tasks.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const updatedTask = { ...tasks[index], ...req.body, id };
  tasks[index] = updatedTask;
  writeTasks(tasks);
  res.json(updatedTask);
});

// DELETE /tasks/:id - Delete task
app.delete('/tasks/:id', (req, res) => {
  const { id } = req.params;
  const tasks = readTasks();
  const index = tasks.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  tasks.splice(index, 1);
  writeTasks(tasks);
  res.json({ message: 'Task deleted successfully' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 TaskFlow server running at http://localhost:${PORT}\n`);
});