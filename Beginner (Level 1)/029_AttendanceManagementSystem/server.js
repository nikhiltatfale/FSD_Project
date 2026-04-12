// ============================================================
// Attendance Management System - Backend (server.js)
// ============================================================

const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// IN-MEMORY DATA STORE
// ============================================================

// Sessions: { sessionToken: { userId, role } }
const sessions = {};

// Students: [{ id, name, email, password, className }]
const students = [
  { id: 'S101', name: 'Alice Johnson', email: 'alice@school.com', password: 'alice123', className: 'Class 10A' },
  { id: 'S102', name: 'Bob Smith',     email: 'bob@school.com',   password: 'bob123',   className: 'Class 10A' },
  { id: 'S103', name: 'Carol White',   email: 'carol@school.com', password: 'carol123', className: 'Class 10B' },
];

// Subjects
const subjects = ['Mathematics', 'Science', 'English', 'History', 'Computer'];

// Classes
const classes = ['Class 10A', 'Class 10B', 'Class 11A', 'Class 11B'];

// Attendance: [{ date, subject, studentId, status }]
const attendance = [
  { date: '2025-04-01', subject: 'Mathematics', studentId: 'S101', status: 'Present' },
  { date: '2025-04-01', subject: 'Mathematics', studentId: 'S102', status: 'Absent'  },
  { date: '2025-04-01', subject: 'Mathematics', studentId: 'S103', status: 'Present' },
  { date: '2025-04-02', subject: 'Science',     studentId: 'S101', status: 'Present' },
  { date: '2025-04-02', subject: 'Science',     studentId: 'S102', status: 'Present' },
  { date: '2025-04-02', subject: 'Science',     studentId: 'S103', status: 'Absent'  },
  { date: '2025-04-03', subject: 'English',     studentId: 'S101', status: 'Absent'  },
  { date: '2025-04-03', subject: 'English',     studentId: 'S102', status: 'Present' },
  { date: '2025-04-03', subject: 'English',     studentId: 'S103', status: 'Present' },
];

// Admin credentials
const admins = [
  { id: 'admin1', name: 'Prof. Kumar', password: 'admin123', role: 'admin' }
];

// Utility: Generate session token
function generateToken() {
  return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

// Utility: Authenticate request
function authenticate(req, res) {
  const token = req.headers['x-session-token'];
  if (!token || !sessions[token]) {
    res.status(401).json({ error: 'Unauthorized. Please login.' });
    return null;
  }
  return sessions[token];
}

// ============================================================
// AUTH ROUTES
// ============================================================

// POST /login
app.post('/login', (req, res) => {
  const { id, password, role } = req.body;

  if (!id || !password || !role) {
    return res.status(400).json({ error: 'ID, password, and role are required.' });
  }

  if (role === 'admin') {
    const admin = admins.find(a => a.id === id && a.password === password);
    if (!admin) return res.status(401).json({ error: 'Invalid admin credentials.' });

    const token = generateToken();
    sessions[token] = { userId: admin.id, name: admin.name, role: 'admin' };
    return res.json({ token, name: admin.name, role: 'admin' });
  }

  if (role === 'student') {
    const student = students.find(s => s.id === id && s.password === password);
    if (!student) return res.status(401).json({ error: 'Invalid student credentials.' });

    const token = generateToken();
    sessions[token] = { userId: student.id, name: student.name, role: 'student' };
    return res.json({ token, name: student.name, role: 'student', studentId: student.id });
  }

  return res.status(400).json({ error: 'Invalid role.' });
});

// POST /logout
app.post('/logout', (req, res) => {
  const token = req.headers['x-session-token'];
  if (token && sessions[token]) delete sessions[token];
  res.json({ message: 'Logged out successfully.' });
});

// ============================================================
// STUDENT ROUTES
// ============================================================

// GET /students - Get all students (admin only)
app.get('/students', (req, res) => {
  const session = authenticate(req, res);
  if (!session) return;
  if (session.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });

  res.json(students);
});

// POST /add-student - Add a student (admin only)
app.post('/add-student', (req, res) => {
  const session = authenticate(req, res);
  if (!session) return;
  if (session.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });

  const { id, name, email, password, className } = req.body;

  if (!id || !name || !email || !password || !className) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (students.find(s => s.id === id)) {
    return res.status(409).json({ error: `Student ID ${id} already exists.` });
  }

  const newStudent = { id, name, email, password, className };
  students.push(newStudent);
  res.status(201).json({ message: 'Student added successfully.', student: newStudent });
});

// PUT /edit-student/:id - Edit a student (admin only)
app.put('/edit-student/:id', (req, res) => {
  const session = authenticate(req, res);
  if (!session) return;
  if (session.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });

  const idx = students.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Student not found.' });

  const { name, email, password, className } = req.body;
  if (name) students[idx].name = name;
  if (email) students[idx].email = email;
  if (password) students[idx].password = password;
  if (className) students[idx].className = className;

  res.json({ message: 'Student updated successfully.', student: students[idx] });
});

// DELETE /delete-student/:id - Delete a student (admin only)
app.delete('/delete-student/:id', (req, res) => {
  const session = authenticate(req, res);
  if (!session) return;
  if (session.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });

  const idx = students.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Student not found.' });

  students.splice(idx, 1);
  // Also remove attendance for this student
  const removed = attendance.filter(a => a.studentId === req.params.id).length;
  attendance.splice(0, attendance.length, ...attendance.filter(a => a.studentId !== req.params.id));

  res.json({ message: `Student deleted. ${removed} attendance records also removed.` });
});

// ============================================================
// ATTENDANCE ROUTES
// ============================================================

// POST /mark-attendance - Mark attendance for multiple students (admin only)
app.post('/mark-attendance', (req, res) => {
  const session = authenticate(req, res);
  if (!session) return;
  if (session.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });

  const { date, subject, records } = req.body;
  // records: [{ studentId, status }]

  if (!date || !subject || !records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'date, subject, and records[] are required.' });
  }

  let updated = 0, added = 0;

  records.forEach(({ studentId, status }) => {
    if (!studentId || !['Present', 'Absent'].includes(status)) return;

    const existing = attendance.findIndex(
      a => a.date === date && a.subject === subject && a.studentId === studentId
    );

    if (existing !== -1) {
      attendance[existing].status = status;
      updated++;
    } else {
      attendance.push({ date, subject, studentId, status });
      added++;
    }
  });

  res.json({ message: `Attendance saved. Added: ${added}, Updated: ${updated}.` });
});

// GET /attendance/student/:id - Get attendance for a specific student
app.get('/attendance/student/:id', (req, res) => {
  const session = authenticate(req, res);
  if (!session) return;

  // Students can only view their own attendance
  if (session.role === 'student' && session.userId !== req.params.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const studentAttendance = attendance.filter(a => a.studentId === req.params.id);
  const total = studentAttendance.length;
  const present = studentAttendance.filter(a => a.status === 'Present').length;
  const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';

  // Group by subject
  const bySubject = {};
  studentAttendance.forEach(a => {
    if (!bySubject[a.subject]) bySubject[a.subject] = { total: 0, present: 0 };
    bySubject[a.subject].total++;
    if (a.status === 'Present') bySubject[a.subject].present++;
  });

  Object.keys(bySubject).forEach(sub => {
    bySubject[sub].percentage = ((bySubject[sub].present / bySubject[sub].total) * 100).toFixed(1);
  });

  res.json({
    records: studentAttendance.sort((a, b) => b.date.localeCompare(a.date)),
    summary: { total, present, absent: total - present, percentage },
    bySubject
  });
});

// GET /attendance/all - Get all attendance records (admin only)
app.get('/attendance/all', (req, res) => {
  const session = authenticate(req, res);
  if (!session) return;
  if (session.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });

  const { date, subject, studentId } = req.query;
  let filtered = [...attendance];

  if (date)      filtered = filtered.filter(a => a.date === date);
  if (subject)   filtered = filtered.filter(a => a.subject === subject);
  if (studentId) filtered = filtered.filter(a => a.studentId === studentId);

  // Enrich with student names
  const enriched = filtered.map(a => {
    const student = students.find(s => s.id === a.studentId);
    return { ...a, studentName: student ? student.name : 'Unknown' };
  });

  // Summary stats
  const total = enriched.length;
  const present = enriched.filter(a => a.status === 'Present').length;

  res.json({
    records: enriched.sort((a, b) => b.date.localeCompare(a.date)),
    summary: { total, present, absent: total - present }
  });
});

// GET /subjects - Get all subjects
app.get('/subjects', (req, res) => {
  const session = authenticate(req, res);
  if (!session) return;
  res.json(subjects);
});

// GET /classes - Get all classes
app.get('/classes', (req, res) => {
  const session = authenticate(req, res);
  if (!session) return;
  res.json(classes);
});

// POST /add-subject
app.post('/add-subject', (req, res) => {
  const session = authenticate(req, res);
  if (!session) return;
  if (session.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });

  const { subject } = req.body;
  if (!subject) return res.status(400).json({ error: 'Subject name required.' });
  if (subjects.includes(subject)) return res.status(409).json({ error: 'Subject already exists.' });

  subjects.push(subject);
  res.json({ message: 'Subject added.', subjects });
});

// GET /download - Download attendance as CSV (admin only)
app.get('/download', (req, res) => {
  const session = authenticate(req, res);
  if (!session) return;
  if (session.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });

  const { date, subject, studentId } = req.query;
  let filtered = [...attendance];

  if (date)      filtered = filtered.filter(a => a.date === date);
  if (subject)   filtered = filtered.filter(a => a.subject === subject);
  if (studentId) filtered = filtered.filter(a => a.studentId === studentId);

  const enriched = filtered.map(a => {
    const student = students.find(s => s.id === a.studentId);
    return { ...a, studentName: student ? student.name : 'Unknown' };
  });

  // Build CSV
  const csvHeader = 'Date,Subject,Student ID,Student Name,Status\n';
  const csvRows = enriched
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(a => `${a.date},${a.subject},${a.studentId},"${a.studentName}",${a.status}`)
    .join('\n');

  const csv = csvHeader + csvRows;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="attendance.csv"');
  res.send(csv);
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`\n✅ Attendance Management System running at http://localhost:${PORT}`);
  console.log('\n📋 Default Credentials:');
  console.log('   Admin  → ID: admin1   | Password: admin123');
  console.log('   Student→ ID: S101     | Password: alice123');
  console.log('   Student→ ID: S102     | Password: bob123');
  console.log('   Student→ ID: S103     | Password: carol123\n');
});