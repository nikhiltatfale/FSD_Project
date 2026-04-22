const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

let classes = {};
let students = {};
let announcements = [];
let materials = [];
let assignments = [];
let submissions = [];
let quizzes = [];
let quizResults = [];
let adminUser = { username: 'admin', password: 'admin123' };

let nextClassId = 1;
let nextMaterialId = 1;
let nextAssignmentId = 1;
let nextQuizId = 1;

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === adminUser.username && password === adminUser.password) {
    res.json({ success: true, message: 'Admin logged in successfully' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/join', (req, res) => {
  const { name, email, classCode } = req.body;
  if (!classes[classCode]) {
    return res.status(400).json({ success: false, message: 'Invalid class code' });
  }
  const studentId = 'student_' + Date.now();
  students[studentId] = {
    id: studentId,
    name,
    email,
    classCode,
    joinedAt: new Date()
  };
  classes[classCode].students.push(studentId);
  res.json({ success: true, studentId, classCode });
});

app.get('/announcements', (req, res) => {
  res.json({ success: true, announcements });
});

app.post('/announcements', (req, res) => {
  const { text } = req.body;
  const announcement = {
    id: Date.now(),
    text,
    createdAt: new Date()
  };
  announcements.push(announcement);
  res.json({ success: true, announcement });
});

app.post('/announcements/delete', (req, res) => {
  const { id } = req.body;
  announcements = announcements.filter(a => a.id !== id);
  res.json({ success: true, message: 'Announcement deleted' });
});

app.get('/materials', (req, res) => {
  res.json({ success: true, materials });
});

app.post('/materials', (req, res) => {
  const { title, content } = req.body;
  const material = {
    id: nextMaterialId++,
    title,
    content,
    uploadedAt: new Date()
  };
  materials.push(material);
  res.json({ success: true, material });
});

app.post('/materials/delete', (req, res) => {
  const { id } = req.body;
  materials = materials.filter(m => m.id !== id);
  res.json({ success: true, message: 'Material deleted' });
});

app.post('/assignment', (req, res) => {
  const { question } = req.body;
  const assignment = {
    id: nextAssignmentId++,
    question,
    createdAt: new Date()
  };
  assignments.push(assignment);
  res.json({ success: true, assignment });
});

app.get('/assignments', (req, res) => {
  res.json({ success: true, assignments });
});

app.post('/submit', (req, res) => {
  const { studentId, assignmentId, answer } = req.body;
  const submission = {
    id: Date.now(),
    studentId,
    assignmentId,
    answer,
    submittedAt: new Date()
  };
  submissions.push(submission);
  res.json({ success: true, submission });
});

app.get('/submissions', (req, res) => {
  const submissionsWithDetails = submissions.map(sub => ({
    ...sub,
    studentName: students[sub.studentId]?.name || 'Unknown',
    studentEmail: students[sub.studentId]?.email || 'Unknown',
    assignmentQuestion: assignments.find(a => a.id === sub.assignmentId)?.question || 'Unknown'
  }));
  res.json({ success: true, submissions: submissionsWithDetails });
});

app.post('/assignment/delete', (req, res) => {
  const { id } = req.body;
  assignments = assignments.filter(a => a.id !== id);
  submissions = submissions.filter(s => s.assignmentId !== id);
  res.json({ success: true, message: 'Assignment deleted' });
});

app.post('/quiz', (req, res) => {
  const { title, questions, timer } = req.body;
  const quiz = {
    id: nextQuizId++,
    title,
    questions,
    timer,
    createdAt: new Date()
  };
  quizzes.push(quiz);
  res.json({ success: true, quiz });
});

app.get('/quizzes', (req, res) => {
  res.json({ success: true, quizzes });
});

app.get('/quiz/:id', (req, res) => {
  const quiz = quizzes.find(q => q.id === parseInt(req.params.id));
  if (!quiz) {
    return res.status(404).json({ success: false, message: 'Quiz not found' });
  }
  res.json({ success: true, quiz });
});

app.post('/quiz/submit', (req, res) => {
  const { studentId, quizId, answers, score } = req.body;
  const result = {
    id: Date.now(),
    studentId,
    quizId,
    answers,
    score,
    submittedAt: new Date()
  };
  quizResults.push(result);
  res.json({ success: true, result });
});

app.get('/quiz/results', (req, res) => {
  const resultsWithDetails = quizResults.map(res => ({
    ...res,
    studentName: students[res.studentId]?.name || 'Unknown',
    studentEmail: students[res.studentId]?.email || 'Unknown',
    quizTitle: quizzes.find(q => q.id === res.quizId)?.title || 'Unknown'
  }));
  res.json({ success: true, results: resultsWithDetails });
});

app.post('/quiz/delete', (req, res) => {
  const { id } = req.body;
  quizzes = quizzes.filter(q => q.id !== id);
  quizResults = quizResults.filter(r => r.quizId !== id);
  res.json({ success: true, message: 'Quiz deleted' });
});

app.post('/class/create', (req, res) => {
  const classCode = Math.random().toString(36).substr(2, 9).toUpperCase();
  const classObj = {
    id: nextClassId++,
    code: classCode,
    students: [],
    createdAt: new Date()
  };
  classes[classCode] = classObj;
  res.json({ success: true, classCode });
});

app.get('/classes', (req, res) => {
  const classesArray = Object.values(classes).map(c => ({
    ...c,
    studentCount: c.students.length
  }));
  res.json({ success: true, classes: classesArray });
});

app.post('/class/students', (req, res) => {
  const { classCode } = req.body;
  const classObj = classes[classCode];
  if (!classObj) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }
  const classStudents = classObj.students.map(sId => students[sId]);
  res.json({ success: true, students: classStudents });
});

app.get('/admin/dashboard', (req, res) => {
  const totalStudents = Object.keys(students).length;
  const totalAssignments = assignments.length;
  const totalSubmissions = submissions.length;
  const totalQuizzes = quizzes.length;
  const totalResults = quizResults.length;
  res.json({
    success: true,
    stats: {
      totalStudents,
      totalAssignments,
      totalSubmissions,
      totalQuizzes,
      totalResults,
      classesCount: Object.keys(classes).length
    }
  });
});

app.post('/student/profile', (req, res) => {
  const { studentId } = req.body;
  const student = students[studentId];
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }
  res.json({ success: true, student });
});

app.listen(PORT, () => {
  console.log('Online Classroom Portal running at http://localhost:3000');
});
