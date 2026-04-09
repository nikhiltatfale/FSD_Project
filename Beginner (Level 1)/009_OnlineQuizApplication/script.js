/**
 * Online Quiz Application Logic
 * Modular implementation without frameworks
 */

// --- Constants & Defaults ---
const STORAGE_KEYS = {
    QUESTIONS: 'quiz_questions',
    RESULTS: 'quiz_results'
};

const DEFAULT_QUESTIONS = [
    { id: 1, text: "What is the correct way to declare a variable in ES6?", options: ["var x", "int x", "let x", "variable x"], correct: 2 },
    { id: 2, text: "Which method adds one or more elements to the end of an array?", options: ["push()", "pop()", "shift()", "unshift()"], correct: 0 },
    { id: 3, text: "How do you write 'Hello World' in an alert box?", options: ["msg('Hello World');", "alertBox('Hello World');", "alert('Hello World');", "console.log('Hello World');"], correct: 2 },
    { id: 4, text: "What does DOM stand for?", options: ["Document Object Model", "Data Object Manager", "Dynamic Orion Mode", "Desktop Optimization Module"], correct: 0 },
    { id: 5, text: "Which built-in method returns the length of the string?", options: ["length()", "size()", "index()", "length"], correct: 3 },
    { id: 6, text: "How do you create a function in JavaScript?", options: ["function = myFunction()", "function myFunction()", "function:myFunction()", "create myFunction()"], correct: 1 },
    { id: 7, text: "How to write an IF statement in JavaScript?", options: ["if i = 5 then", "if (i == 5)", "if i == 5 then", "if i = 5"], correct: 1 },
    { id: 8, text: "Which operator is used to assign a value to a variable?", options: ["*", "-", "=", "x"], correct: 2 },
    { id: 9, text: "What will Boolean(10 > 9) evaluate to?", options: ["NaN", "false", "true", "undefined"], correct: 2 },
    { id: 10, text: "Is JavaScript case-sensitive?", options: ["Yes", "No", "Only in strict mode", "Only for variables"], correct: 0 }
];

// --- State Management ---
let state = {
    questions: [],
    results: [],
    currentStudent: null,
    quiz: {
        currentIndex: 0,
        score: 0,
        selectedAnswers: [], // stores index of selected option per question
        timerInterval: null,
        timeLeft: 0
    }
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initLocalData();
    setupEventListeners();
});

function initLocalData() {
    // Load Questions
    const storedQs = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    if (!storedQs) {
        state.questions = [...DEFAULT_QUESTIONS];
        saveQuestions();
    } else {
        state.questions = JSON.parse(storedQs);
    }

    // Load Results
    const storedRs = localStorage.getItem(STORAGE_KEYS.RESULTS);
    if (storedRs) {
        state.results = JSON.parse(storedRs);
    }
}

function saveQuestions() {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(state.questions));
}

function saveResults() {
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(state.results));
}

// --- UI Navigation ---
function showView(viewId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Trigger reflow & show
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    // Student Form
    document.getElementById('student-form').addEventListener('submit', handleStudentForm);

    // Quiz Navigation
    document.getElementById('next-btn').addEventListener('click', handleNextQuestion);
    document.getElementById('prev-btn').addEventListener('click', handlePrevQuestion);
    document.getElementById('submit-quiz-btn').addEventListener('click', finishQuiz);

    // Results Actions
    document.getElementById('restart-btn').addEventListener('click', () => {
        location.reload(); // reset everything
    });
    document.getElementById('download-cert-btn').addEventListener('click', openCertificate);
    document.getElementById('close-cert-btn').addEventListener('click', () => {
        showView('result-section');
    });

    // Admin Toggle
    document.getElementById('admin-settings-link').addEventListener('click', (e) => {
        e.preventDefault();
        showView('admin-login-section');
    });

    // Admin Login
    document.getElementById('admin-login-form').addEventListener('submit', handleAdminLogin);
    document.getElementById('cancel-admin-btn').addEventListener('click', () => {
        showView('student-form-section');
    });
    document.getElementById('logout-btn').addEventListener('click', () => {
        showView('student-form-section');
        showToast('Logged out securely');
    });

    // Admin Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

            const targetId = e.target.getAttribute('data-tab');
            e.target.classList.add('active');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Admin Question Management
    document.getElementById('add-new-q-btn').addEventListener('click', () => {
        document.getElementById('manage-question-form').reset();
        document.getElementById('edit-q-id').value = '';
        document.getElementById('q-form-title').textContent = "Add New Question";
        document.getElementById('question-form-container').classList.remove('d-none');
    });

    document.getElementById('cancel-q-btn').addEventListener('click', () => {
        document.getElementById('question-form-container').classList.add('d-none');
    });

    document.getElementById('manage-question-form').addEventListener('submit', handleSaveQuestion);

    document.getElementById('reset-default-q-btn').addEventListener('click', () => {
        if (confirm("Are you sure? This will delete all custom questions and restore defaults.")) {
            state.questions = [...DEFAULT_QUESTIONS];
            saveQuestions();
            renderAdminQuestions();
            showToast('Questions reset to defaults');
        }
    });

    // Export Data
    document.getElementById('export-csv-btn').addEventListener('click', exportCSV);
}

// --- Student Flow ---
function handleStudentForm(e) {
    e.preventDefault();
    state.currentStudent = {
        name: document.getElementById('studentName').value,
        rollNo: document.getElementById('rollNumber').value,
        department: document.getElementById('department').value,
        college: document.getElementById('collegeName').value,
        date: new Date().toLocaleDateString()
    };

    if (state.questions.length === 0) {
        showToast('No questions available in the database. Please contact admin.', 'error');
        return;
    }

    startQuiz();
}

// --- Quiz Engine ---
function startQuiz() {
    state.quiz.currentIndex = 0;
    state.quiz.score = 0;
    state.quiz.selectedAnswers = new Array(state.questions.length).fill(null);
    state.quiz.timeLeft = state.questions.length * 60; // 1 min per question

    showView('quiz-section');
    renderQuestion();
    startTimer();
}

function startTimer() {
    const timerDisplay = document.getElementById('time-remaining');

    clearInterval(state.quiz.timerInterval);
    state.quiz.timerInterval = setInterval(() => {
        if (state.quiz.timeLeft <= 0) {
            clearInterval(state.quiz.timerInterval);
            finishQuiz(); // auto submit
        } else {
            state.quiz.timeLeft--;
            const m = Math.floor(state.quiz.timeLeft / 60).toString().padStart(2, '0');
            const s = (state.quiz.timeLeft % 60).toString().padStart(2, '0');
            timerDisplay.textContent = `${m}:${s}`;

            if (state.quiz.timeLeft <= 30) {
                timerDisplay.parentElement.style.color = 'var(--danger)';
            }
        }
    }, 1000);
}

function renderQuestion() {
    const index = state.quiz.currentIndex;
    const qData = state.questions[index];

    document.getElementById('question-tracker').textContent = `Question ${index + 1} of ${state.questions.length}`;
    document.getElementById('question-text').textContent = qData.text;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    qData.options.forEach((opt, optIndex) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        if (state.quiz.selectedAnswers[index] === optIndex) {
            btn.classList.add('selected');
        }
        btn.textContent = opt;
        btn.onclick = () => selectOption(optIndex);
        optionsContainer.appendChild(btn);
    });

    // Buttons visibility
    document.getElementById('prev-btn').disabled = (index === 0);

    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-quiz-btn');

    if (index === state.questions.length - 1) {
        nextBtn.classList.add('d-none');
        submitBtn.classList.remove('d-none');
    } else {
        nextBtn.classList.remove('d-none');
        submitBtn.classList.add('d-none');
    }
}

function selectOption(optIndex) {
    state.quiz.selectedAnswers[state.quiz.currentIndex] = optIndex;
    renderQuestion(); // re-render to update UI selection
}

function handleNextQuestion() {
    if (state.quiz.currentIndex < state.questions.length - 1) {
        state.quiz.currentIndex++;
        renderQuestion();
    }
}

function handlePrevQuestion() {
    if (state.quiz.currentIndex > 0) {
        state.quiz.currentIndex--;
        renderQuestion();
    }
}

function finishQuiz() {
    clearInterval(state.quiz.timerInterval);

    // Calculate Score
    let score = 0;
    state.quiz.selectedAnswers.forEach((ans, index) => {
        if (ans !== null && ans === state.questions[index].correct) {
            score++;
        }
    });

    // Save to results
    const pct = ((score / state.questions.length) * 100).toFixed(2);
    const resultRecord = {
        id: Date.now(),
        ...state.currentStudent,
        marks: score,
        total: state.questions.length,
        percentage: pct
    };

    state.results.push(resultRecord);
    saveResults();

    // Render Results View
    document.getElementById('result-name').textContent = state.currentStudent.name;
    document.getElementById('res-total').textContent = state.questions.length;
    document.getElementById('res-correct').textContent = score;
    document.getElementById('res-marks').textContent = score;
    document.getElementById('res-percentage').textContent = `${pct}%`;

    showView('result-section');
}

// --- Certificate Logic ---
function openCertificate() {
    const recentRecord = state.results[state.results.length - 1]; // Current session

    document.getElementById('cert-name').textContent = recentRecord.name;
    document.getElementById('cert-roll').textContent = recentRecord.rollNo;
    document.getElementById('cert-dept').textContent = recentRecord.department;
    document.getElementById('cert-college').textContent = recentRecord.college;
    document.getElementById('cert-score').textContent = recentRecord.marks;
    document.getElementById('cert-out-of').textContent = recentRecord.total;
    document.getElementById('cert-perc').textContent = recentRecord.percentage;
    document.getElementById('cert-date-val').textContent = recentRecord.date;

    showView('certificate-section');

    // Automatically open the print dialog for downloading as PDF
    setTimeout(() => {
        window.print();
    }, 500);
}

// --- Admin Logic ---
function handleAdminLogin(e) {
    e.preventDefault();
    const u = document.getElementById('adminUsername').value;
    const p = document.getElementById('adminPassword').value;

    if (u === 'admin' && p === 'admin123') { // Simple hardcoded auth
        document.getElementById('admin-login-form').reset();
        initAdminDashboard();
        showView('admin-dashboard-section');
        showToast('Admin access granted');
    } else {
        showToast('Invalid credentials', 'error');
    }
}

function initAdminDashboard() {
    renderStudentsTable();
    renderAdminQuestions();
}

function renderStudentsTable() {
    const tbody = document.getElementById('students-table-body');
    const noMsg = document.getElementById('no-students-msg');

    tbody.innerHTML = '';
    if (state.results.length === 0) {
        noMsg.classList.remove('d-none');
    } else {
        noMsg.classList.add('d-none');
        state.results.forEach(res => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${res.date}</td>
                <td><strong>${res.name}</strong></td>
                <td>${res.rollNo}</td>
                <td>${res.department}</td>
                <td>${res.college}</td>
                <td class="text-primary font-weight-bold">${res.marks}/${res.total}</td>
                <td>${res.percentage}%</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function renderAdminQuestions() {
    const list = document.getElementById('admin-questions-list');
    document.getElementById('total-q-count').textContent = state.questions.length;
    list.innerHTML = '';

    state.questions.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'q-admin-card';
        card.innerHTML = `
            <div style="flex:1">
                <div class="q-admin-header mb-2">Q${idx + 1}: <span class="text-main">${q.text}</span></div>
                <div class="q-admin-options">
                    ${q.options.map((opt, i) => i === q.correct ? `<span class="text-success">[✓] ${opt}</span>` : `[ ] ${opt}`).join('<br>')}
                </div>
            </div>
            <div class="d-flex flex-column gap-10">
                <button class="btn btn-outline btn-sm" onclick="editQuestion(${q.id})">Edit</button>
                <button class="btn btn-outline btn-sm text-danger" onclick="deleteQuestion(${q.id})">Del</button>
            </div>
        `;
        list.appendChild(card);
    });
}

// Global scope for onclick handlers
window.editQuestion = function (id) {
    const q = state.questions.find(x => x.id === id);
    if (q) {
        document.getElementById('edit-q-id').value = q.id;
        document.getElementById('q-form-title').textContent = "Edit Question";
        document.getElementById('q-text').value = q.text;
        document.getElementById('q-opt1').value = q.options[0];
        document.getElementById('q-opt2').value = q.options[1];
        document.getElementById('q-opt3').value = q.options[2];
        document.getElementById('q-opt4').value = q.options[3];
        document.getElementById('q-correct').value = q.correct;

        document.getElementById('question-form-container').classList.remove('d-none');
    }
}

window.deleteQuestion = function (id) {
    if (confirm('Delete this question?')) {
        state.questions = state.questions.filter(x => x.id !== id);
        saveQuestions();
        renderAdminQuestions();
        showToast('Question deleted');
    }
}

function handleSaveQuestion(e) {
    e.preventDefault();
    const idField = document.getElementById('edit-q-id').value;

    const newQ = {
        id: idField ? parseInt(idField) : Date.now(),
        text: document.getElementById('q-text').value,
        options: [
            document.getElementById('q-opt1').value,
            document.getElementById('q-opt2').value,
            document.getElementById('q-opt3').value,
            document.getElementById('q-opt4').value
        ],
        correct: parseInt(document.getElementById('q-correct').value)
    };

    if (idField) {
        // Edit mode
        const idx = state.questions.findIndex(x => x.id === parseInt(idField));
        if (idx !== -1) state.questions[idx] = newQ;
        showToast('Question updated!');
    } else {
        // Add mode
        state.questions.push(newQ);
        showToast('New question added!');
    }

    saveQuestions();
    renderAdminQuestions();
    document.getElementById('question-form-container').classList.add('d-none');
}

// --- CSV Export ---
function exportCSV() {
    if (state.results.length === 0) {
        showToast('No data to export', 'error');
        return;
    }

    const headers = ['Date', 'Name', 'Roll Number', 'Department', 'College', 'Marks', 'Total Questions', 'Percentage(%)'];
    const rows = state.results.map(r => [
        `"${r.date}"`,
        `"${r.name}"`,
        `"${r.rollNo}"`,
        `"${r.department}"`,
        `"${r.college}"`,
        r.marks,
        r.total,
        r.percentage
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `quiz_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
