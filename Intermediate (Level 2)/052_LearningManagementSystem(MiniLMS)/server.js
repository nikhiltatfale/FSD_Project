// server.js - Mini LMS Backend
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── In-memory data store ───────────────────────────────────────────────────
let students = [];
let courses = [
  {
    id: 1, title: 'JavaScript Fundamentals', description: 'Learn JS from scratch',
    instructor: 'Alice Smith', category: 'Programming',
    lessons: [
      { id: 1, title: 'Variables & Types', content: 'In JavaScript, variables can be declared using var, let, or const...', videoUrl: '' },
      { id: 2, title: 'Functions', content: 'Functions are reusable blocks of code...', videoUrl: '' },
      { id: 3, title: 'DOM Manipulation', content: 'The Document Object Model allows JS to interact with HTML...', videoUrl: '' }
    ],
    quiz: [
      { id: 1, question: 'Which keyword is used for block-scoped variables?', options: ['var', 'let', 'const', 'int'], answer: 1 },
      { id: 2, question: 'What does DOM stand for?', options: ['Data Object Model', 'Document Object Model', 'Direct Object Mode', 'Data Oriented Module'], answer: 1 },
      { id: 3, question: 'Which method adds an element to end of an array?', options: ['push()', 'pop()', 'shift()', 'unshift()'], answer: 0 }
    ]
  },
  {
    id: 2, title: 'HTML & CSS Basics', description: 'Build your first web pages',
    instructor: 'Bob Jones', category: 'Web Design',
    lessons: [
      { id: 1, title: 'HTML Structure', content: 'HTML documents have a head and body section...', videoUrl: '' },
      { id: 2, title: 'CSS Selectors', content: 'CSS selectors target HTML elements for styling...', videoUrl: '' }
    ],
    quiz: [
      { id: 1, question: 'What does HTML stand for?', options: ['HyperText Markup Language', 'High Text Machine Learning', 'HyperText Machine Language', 'High Text Markup Language'], answer: 0 },
      { id: 2, question: 'Which CSS property changes text color?', options: ['font-color', 'text-color', 'color', 'foreground'], answer: 2 }
    ]
  }
];
let enrollments = [];
let quizResults = [];
let progress = []; // { studentId, courseId, completedLessons: [] }

// Simple ID counters
let studentIdCounter = 1;
let courseIdCounter = 3;

// Admin credentials
const ADMIN = { username: 'admin', password: 'admin123' };

// ─── Helper: find student by token (we use studentId as token for simplicity) ───
function getStudentByToken(req) {
  const token = req.headers['x-auth-token'];
  return students.find(s => String(s.id) === String(token));
}

// ─── Auth: Admin token ────────────────────────────────────────────────────────
function isAdmin(req) {
  return req.headers['x-auth-token'] === 'admin-token-secret';
}

// ════════════════════════════════════════════════════════════
// STUDENT ROUTES
// ════════════════════════════════════════════════════════════

// POST /register
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (students.find(s => s.email === email)) return res.status(400).json({ error: 'Email already exists' });
  const student = { id: studentIdCounter++, name, email, password, createdAt: new Date().toISOString() };
  students.push(student);
  res.json({ message: 'Registration successful', studentId: student.id, name: student.name });
});

// POST /login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const student = students.find(s => s.email === email && s.password === password);
  if (!student) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ message: 'Login successful', token: String(student.id), name: student.name, studentId: student.id });
});

// GET /courses - list all courses (public)
app.get('/courses', (req, res) => {
  const list = courses.map(c => ({
    id: c.id, title: c.title, description: c.description,
    instructor: c.instructor, category: c.category,
    lessonCount: c.lessons.length, hasQuiz: c.quiz.length > 0
  }));
  res.json(list);
});

// GET /course/:id - get full course with lessons
app.get('/course/:id', (req, res) => {
  const course = courses.find(c => c.id === parseInt(req.params.id));
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(course);
});

// POST /enroll
app.post('/enroll', (req, res) => {
  const student = getStudentByToken(req);
  if (!student) return res.status(401).json({ error: 'Unauthorized' });
  const { courseId } = req.body;
  const course = courses.find(c => c.id === parseInt(courseId));
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const exists = enrollments.find(e => e.studentId === student.id && e.courseId === parseInt(courseId));
  if (exists) return res.status(400).json({ error: 'Already enrolled' });
  enrollments.push({ studentId: student.id, courseId: parseInt(courseId), enrolledAt: new Date().toISOString() });
  progress.push({ studentId: student.id, courseId: parseInt(courseId), completedLessons: [] });
  res.json({ message: 'Enrolled successfully' });
});

// GET /my-enrollments
app.get('/my-enrollments', (req, res) => {
  const student = getStudentByToken(req);
  if (!student) return res.status(401).json({ error: 'Unauthorized' });
  const enrolled = enrollments.filter(e => e.studentId === student.id);
  const result = enrolled.map(e => {
    const course = courses.find(c => c.id === e.courseId);
    const prog = progress.find(p => p.studentId === student.id && p.courseId === e.courseId);
    const completed = prog ? prog.completedLessons.length : 0;
    const total = course ? course.lessons.length : 1;
    const pct = Math.round((completed / total) * 100);
    const qr = quizResults.find(q => q.studentId === student.id && q.courseId === e.courseId);
    return {
      courseId: e.courseId,
      title: course ? course.title : 'Unknown',
      instructor: course ? course.instructor : '',
      lessonCount: total,
      completedLessons: completed,
      progressPct: pct,
      quizScore: qr ? qr.score : null,
      quizTotal: qr ? qr.total : null,
      enrolledAt: e.enrolledAt
    };
  });
  res.json(result);
});

// POST /progress - mark lesson complete
app.post('/progress', (req, res) => {
  const student = getStudentByToken(req);
  if (!student) return res.status(401).json({ error: 'Unauthorized' });
  const { courseId, lessonId } = req.body;
  let prog = progress.find(p => p.studentId === student.id && p.courseId === parseInt(courseId));
  if (!prog) return res.status(400).json({ error: 'Not enrolled in this course' });
  if (!prog.completedLessons.includes(parseInt(lessonId))) {
    prog.completedLessons.push(parseInt(lessonId));
  }
  const course = courses.find(c => c.id === parseInt(courseId));
  const pct = Math.round((prog.completedLessons.length / course.lessons.length) * 100);
  res.json({ message: 'Progress updated', progressPct: pct, completedLessons: prog.completedLessons });
});

// GET /my-progress/:courseId
app.get('/my-progress/:courseId', (req, res) => {
  const student = getStudentByToken(req);
  if (!student) return res.status(401).json({ error: 'Unauthorized' });
  const prog = progress.find(p => p.studentId === student.id && p.courseId === parseInt(req.params.courseId));
  res.json({ completedLessons: prog ? prog.completedLessons : [] });
});

// POST /quiz-submit
app.post('/quiz-submit', (req, res) => {
  const student = getStudentByToken(req);
  if (!student) return res.status(401).json({ error: 'Unauthorized' });
  const { courseId, answers } = req.body; // answers: array of selected option indices
  const course = courses.find(c => c.id === parseInt(courseId));
  if (!course) return res.status(404).json({ error: 'Course not found' });
  let score = 0;
  const details = course.quiz.map((q, i) => {
    const correct = answers[i] === q.answer;
    if (correct) score++;
    return { question: q.question, selected: answers[i], correctAnswer: q.answer, correct };
  });
  const existing = quizResults.findIndex(q => q.studentId === student.id && q.courseId === parseInt(courseId));
  const result = { studentId: student.id, studentName: student.name, courseId: parseInt(courseId), courseTitle: course.title, score, total: course.quiz.length, details, submittedAt: new Date().toISOString() };
  if (existing >= 0) quizResults[existing] = result;
  else quizResults.push(result);
  res.json({ score, total: course.quiz.length, details });
});

// GET /my-quiz-results
app.get('/my-quiz-results', (req, res) => {
  const student = getStudentByToken(req);
  if (!student) return res.status(401).json({ error: 'Unauthorized' });
  res.json(quizResults.filter(q => q.studentId === student.id));
});

// ════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ════════════════════════════════════════════════════════════

// POST /admin/login
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) {
    res.json({ message: 'Admin login successful', token: 'admin-token-secret' });
  } else {
    res.status(401).json({ error: 'Invalid admin credentials' });
  }
});

// Middleware check for admin
function adminOnly(req, res, next) {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' });
  next();
}

// GET /admin/stats
app.get('/admin/stats', adminOnly, (req, res) => {
  const avgScore = quizResults.length
    ? (quizResults.reduce((sum, q) => sum + (q.score / q.total) * 100, 0) / quizResults.length).toFixed(1)
    : 0;
  res.json({
    totalStudents: students.length,
    totalCourses: courses.length,
    totalEnrollments: enrollments.length,
    totalQuizAttempts: quizResults.length,
    averageQuizScore: avgScore
  });
});

// GET /admin/students
app.get('/admin/students', adminOnly, (req, res) => {
  const list = students.map(s => {
    const myEnrollments = enrollments.filter(e => e.studentId === s.id);
    const myQuizzes = quizResults.filter(q => q.studentId === s.id);
    return {
      id: s.id, name: s.name, email: s.email, createdAt: s.createdAt,
      enrolledCourses: myEnrollments.map(e => {
        const c = courses.find(c => c.id === e.courseId);
        return c ? c.title : 'Unknown';
      }),
      quizResults: myQuizzes.map(q => ({ course: q.courseTitle, score: `${q.score}/${q.total}` }))
    };
  });
  res.json(list);
});

// GET /admin/courses
app.get('/admin/courses', adminOnly, (req, res) => {
  res.json(courses);
});

// POST /admin/course - add course
app.post('/admin/course', adminOnly, (req, res) => {
  const { title, description, instructor, category } = req.body;
  if (!title || !description || !instructor) return res.status(400).json({ error: 'title, description, instructor required' });
  const course = { id: courseIdCounter++, title, description, instructor, category: category || 'General', lessons: [], quiz: [] };
  courses.push(course);
  res.json({ message: 'Course created', course });
});

// PUT /admin/course/:id - edit course
app.put('/admin/course/:id', adminOnly, (req, res) => {
  const idx = courses.findIndex(c => c.id === parseInt(req.params.id));
  if (idx < 0) return res.status(404).json({ error: 'Course not found' });
  const { title, description, instructor, category } = req.body;
  if (title) courses[idx].title = title;
  if (description) courses[idx].description = description;
  if (instructor) courses[idx].instructor = instructor;
  if (category) courses[idx].category = category;
  res.json({ message: 'Course updated', course: courses[idx] });
});

// DELETE /admin/course/:id
app.delete('/admin/course/:id', adminOnly, (req, res) => {
  const idx = courses.findIndex(c => c.id === parseInt(req.params.id));
  if (idx < 0) return res.status(404).json({ error: 'Course not found' });
  courses.splice(idx, 1);
  res.json({ message: 'Course deleted' });
});

// POST /admin/course/:id/lesson - add lesson
app.post('/admin/course/:id/lesson', adminOnly, (req, res) => {
  const course = courses.find(c => c.id === parseInt(req.params.id));
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const { title, content, videoUrl } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'title and content required' });
  const lessonId = course.lessons.length ? Math.max(...course.lessons.map(l => l.id)) + 1 : 1;
  course.lessons.push({ id: lessonId, title, content, videoUrl: videoUrl || '' });
  res.json({ message: 'Lesson added', course });
});

// POST /admin/course/:id/quiz - add quiz question
app.post('/admin/course/:id/quiz', adminOnly, (req, res) => {
  const course = courses.find(c => c.id === parseInt(req.params.id));
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const { question, options, answer } = req.body;
  if (!question || !options || options.length < 2 || answer === undefined) {
    return res.status(400).json({ error: 'question, options[], answer index required' });
  }
  const qId = course.quiz.length ? Math.max(...course.quiz.map(q => q.id)) + 1 : 1;
  course.quiz.push({ id: qId, question, options, answer: parseInt(answer) });
  res.json({ message: 'Quiz question added', course });
});

// GET /admin/quiz-results
app.get('/admin/quiz-results', adminOnly, (req, res) => {
  res.json(quizResults);
});

// GET /admin/enrollments
app.get('/admin/enrollments', adminOnly, (req, res) => {
  const list = enrollments.map(e => {
    const s = students.find(st => st.id === e.studentId);
    const c = courses.find(co => co.id === e.courseId);
    const prog = progress.find(p => p.studentId === e.studentId && p.courseId === e.courseId);
    const completed = prog ? prog.completedLessons.length : 0;
    const total = c ? c.lessons.length : 0;
    return {
      student: s ? s.name : 'Unknown',
      email: s ? s.email : '',
      course: c ? c.title : 'Unknown',
      progress: total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%',
      enrolledAt: e.enrolledAt
    };
  });
  res.json(list);
});

// GET /admin/download-data
app.get('/admin/download-data', adminOnly, (req, res) => {
  const data = { students, courses, enrollments, quizResults, progress, exportedAt: new Date().toISOString() };
  res.setHeader('Content-Disposition', 'attachment; filename="lms-data.json"');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(data, null, 2));
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Mini LMS running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
  console.log(`Admin credentials: admin / admin123`);
});