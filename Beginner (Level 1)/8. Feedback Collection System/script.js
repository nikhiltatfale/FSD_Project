// ===== DOM Elements =====
// Nav Buttons
const navHomeBtn = document.getElementById('nav-home-btn');
const navAdminBtn = document.getElementById('nav-admin-btn');
const navLogoutBtn = document.getElementById('nav-logout-btn');

// Sections
const viewFeedback = document.getElementById('view-feedback');
const viewLogin = document.getElementById('view-login');
const viewDashboard = document.getElementById('view-dashboard');

// Forms & Inputs
const feedbackForm = document.getElementById('feedback-form');
const starRating = document.getElementById('star-rating');
const ratingInput = document.getElementById('rating');
const loginForm = document.getElementById('login-form');

// Dashboard Elements
const feedbackTableBody = document.getElementById('feedback-table-body');
const emptyState = document.getElementById('empty-state');
const downloadCsvBtn = document.getElementById('download-csv-btn');
const dataTable = document.querySelector('.data-table');

// Toast Container
const toastContainer = document.getElementById('toast-container');

// ===== State Management =====
const STORAGE_KEY = 'feedbackData';
const ADMIN_SESSION_KEY = 'adminLoggedIn';

// Admin Credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

// Load initial state
let currentView = 'feedback';
let feedbackData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let isAdminLoggedIn = sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    initStarRating();
    checkAuthStatus();
    renderDashboard();
});

// ===== Navigation & Views =====
function switchView(viewName) {
    // Hide all
    viewFeedback.classList.remove('active');
    viewFeedback.classList.add('hidden');
    viewLogin.classList.remove('active');
    viewLogin.classList.add('hidden');
    viewDashboard.classList.remove('active');
    viewDashboard.classList.add('hidden');

    // Update Nav
    navHomeBtn.classList.remove('active');
    navAdminBtn.classList.remove('active');

    // Show requested
    if (viewName === 'feedback') {
        viewFeedback.classList.remove('hidden');
        viewFeedback.classList.add('active');
        navHomeBtn.classList.add('active');
    } else if (viewName === 'login') {
        viewLogin.classList.remove('hidden');
        viewLogin.classList.add('active');
        navAdminBtn.classList.add('active');
    } else if (viewName === 'dashboard') {
        viewDashboard.classList.remove('hidden');
        viewDashboard.classList.add('active');
        navAdminBtn.classList.add('active');
        renderDashboard();
    }
    currentView = viewName;
}

navHomeBtn.addEventListener('click', () => switchView('feedback'));
navAdminBtn.addEventListener('click', () => {
    if (isAdminLoggedIn) {
        switchView('dashboard');
    } else {
        switchView('login');
    }
});

navLogoutBtn.addEventListener('click', () => {
    isAdminLoggedIn = false;
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    checkAuthStatus();
    switchView('feedback');
    showToast('Logged out successfully', 'success');
});

function checkAuthStatus() {
    if (isAdminLoggedIn) {
        navAdminBtn.textContent = 'Dashboard';
        navLogoutBtn.classList.remove('hidden');
        if (currentView === 'login') switchView('dashboard');
    } else {
        navAdminBtn.textContent = 'Admin Portal';
        navLogoutBtn.classList.add('hidden');
        if (currentView === 'dashboard') switchView('login');
    }
}

// ===== Form: Star Rating =====
function initStarRating() {
    const stars = starRating.querySelectorAll('.star');

    stars.forEach((star, index) => {
        // Hover
        star.addEventListener('mouseenter', () => {
            resetStars();
            highlightStars(index, 'hover-active');
        });

        // Leave
        star.addEventListener('mouseleave', () => {
            resetStars();
            const currentRating = parseInt(ratingInput.value);
            if (currentRating > 0) {
                highlightStars(currentRating - 1, 'active');
            }
        });

        // Click
        star.addEventListener('click', () => {
            const value = star.getAttribute('data-value');
            ratingInput.value = value;
            resetStars();
            highlightStars(index, 'active');

            // Clear error if exists
            starRating.parentElement.classList.remove('error');
        });
    });
}

function resetStars() {
    const stars = starRating.querySelectorAll('.star');
    stars.forEach(s => {
        s.classList.remove('active');
        s.classList.remove('hover-active');
    });
}

function highlightStars(index, className) {
    const stars = starRating.querySelectorAll('.star');
    for (let i = 0; i <= index; i++) {
        stars[i].classList.add(className);
    }
}

// ===== Form: Validation & Submit =====
feedbackForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateFeedbackForm()) {
        saveFeedback();
    }
});

function validateFeedbackForm() {
    let isValid = true;

    // Clear previous errors
    document.querySelectorAll('.form-group').forEach(el => el.classList.remove('error'));

    // Get Fields
    const fullName = document.getElementById('fullName');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');
    const feedbackType = document.getElementById('feedbackType');
    const message = document.getElementById('message');

    // Validation rules
    if (!fullName.value.trim()) {
        setError(fullName);
        isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value.trim())) {
        setError(email);
        isValid = false;
    }

    if (phone.value.trim() && !/^[0-9]{10}$/.test(phone.value.trim())) {
        setError(phone);
        isValid = false;
    }

    if (!feedbackType.value) {
        setError(feedbackType);
        isValid = false;
    }

    if (!ratingInput.value) {
        starRating.parentElement.classList.add('error');
        isValid = false;
    }

    if (!message.value.trim()) {
        setError(message);
        isValid = false;
    }

    return isValid;
}

function setError(inputElement) {
    // Select-wrapper or regular input parent
    const parent = inputElement.closest('.form-group');
    if (parent) parent.classList.add('error');
}

// Clear error on input
document.querySelectorAll('#feedback-form input, #feedback-form select, #feedback-form textarea').forEach(input => {
    input.addEventListener('input', function () {
        const parent = this.closest('.form-group');
        if (parent) parent.classList.remove('error');
    });
});

function saveFeedback() {
    const newFeedback = {
        id: 'fb_' + Date.now(),
        date: new Date().toISOString(),
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim() || 'N/A',
        department: document.getElementById('department').value.trim() || 'N/A',
        type: document.getElementById('feedbackType').value,
        rating: parseInt(ratingInput.value),
        message: document.getElementById('message').value.trim()
    };

    feedbackData.unshift(newFeedback); // Add to beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbackData));

    // Reset Form
    feedbackForm.reset();
    ratingInput.value = '';
    resetStars();

    showToast('Feedback submitted successfully!', 'success');
}

// ===== Admin Auth =====
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    const errLogin = document.getElementById('err-login');

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        errLogin.style.display = 'none';
        isAdminLoggedIn = true;
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        loginForm.reset();
        checkAuthStatus();
        switchView('dashboard');
        showToast('Login successful', 'success');
    } else {
        errLogin.style.display = 'block';
    }
});

// Hide error on type
document.getElementById('username').addEventListener('input', () => {
    document.getElementById('err-login').style.display = 'none';
});
document.getElementById('password').addEventListener('input', () => {
    document.getElementById('err-login').style.display = 'none';
});

// ===== Dashboard Rendering =====
function renderDashboard() {
    feedbackTableBody.innerHTML = '';

    if (feedbackData.length === 0) {
        dataTable.classList.add('hidden');
        emptyState.classList.remove('hidden');
        downloadCsvBtn.disabled = true;
        downloadCsvBtn.style.opacity = '0.5';
        downloadCsvBtn.style.cursor = 'not-allowed';
        return;
    }

    dataTable.classList.remove('hidden');
    emptyState.classList.add('hidden');
    downloadCsvBtn.disabled = false;
    downloadCsvBtn.style.opacity = '1';
    downloadCsvBtn.style.cursor = 'pointer';

    feedbackData.forEach(item => {
        const row = document.createElement('tr');

        // Format Date
        const dateObj = new Date(item.date);
        const dateStr = dateObj.toLocaleDateString() + ' <br> <small style="color:var(--text-muted)">' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</small>';

        // Badge class
        let badgeClass = '';
        const typeLight = item.type.toLowerCase();
        if (typeLight === 'complaint') badgeClass = 'complaint';
        else if (typeLight === 'suggestion') badgeClass = 'suggestion';
        else if (typeLight === 'appreciation') badgeClass = 'appreciation';

        // Stars
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            starsHtml += i <= item.rating ? '<span style="color:var(--warning-color)">★</span>' : '<span style="color:#d1d5db">★</span>';
        }

        row.innerHTML = `
            <td>${dateStr}</td>
            <td class="td-user">
                <span class="td-user-name">${escapeHTML(item.fullName)}</span>
                <span class="td-user-contact">${escapeHTML(item.email)}</span>
                ${item.phone !== 'N/A' ? `<span class="td-user-contact">📞 ${escapeHTML(item.phone)}</span>` : ''}
            </td>
            <td>
                <span class="badge ${badgeClass}">${escapeHTML(item.type)}</span><br>
                <div style="margin-top:4px">${starsHtml}</div>
            </td>
            <td><div class="td-message">${escapeHTML(item.message)}</div></td>
            <td>
                <button class="btn-icon" onclick="deleteFeedback('${item.id}')" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </td>
        `;
        feedbackTableBody.appendChild(row);
    });
}

// Utility to escape HTML and prevent XSS
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== Delete Feedback =====
window.deleteFeedback = function (id) {
    if (confirm('Are you sure you want to delete this feedback?')) {
        feedbackData = feedbackData.filter(item => item.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbackData));
        renderDashboard();
        showToast('Feedback deleted', 'success');
    }
};

// ===== CSV Export =====
downloadCsvBtn.addEventListener('click', () => {
    if (feedbackData.length === 0) return;

    // Headers
    const headers = ['Date', 'Time', 'Full Name', 'Email', 'Phone', 'Department/Course', 'Feedback Type', 'Rating', 'Message'];

    // Rows
    const csvRows = [];
    csvRows.push(headers.join(','));

    feedbackData.forEach(item => {
        const d = new Date(item.date);

        const row = [
            d.toLocaleDateString(),
            d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            `"${item.fullName.replace(/"/g, '""')}"`, // Quote strings that might have commas
            item.email,
            item.phone,
            `"${item.department.replace(/"/g, '""')}"`,
            item.type,
            item.rating,
            `"${item.message.replace(/"/g, '""').replace(/\n/g, ' ')}"` // Remove newlines from message for CSV
        ];

        csvRows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);

    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'feedback_data.csv');
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);

    showToast('Download started', 'success');
});

// ===== Toast Notifications =====
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Icon based on type
    const icon = type === 'success'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

    toast.innerHTML = `${icon} <span>${message}</span>`;

    toastContainer.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('fadeOut');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}
