// script.js - Feedback Analyzer Frontend Logic

const API = 'http://localhost:3000';

// =====================
// STAR RATING LOGIC
// =====================
let selectedRating = 0;
const stars = document.querySelectorAll('.star');

stars.forEach(star => {
  // Hover effect
  star.addEventListener('mouseover', () => {
    const val = parseInt(star.dataset.value);
    highlightStars(val);
  });

  // Mouse out - revert to selected
  star.addEventListener('mouseout', () => {
    highlightStars(selectedRating);
  });

  // Click to select rating
  star.addEventListener('click', () => {
    selectedRating = parseInt(star.dataset.value);
    document.getElementById('rating').value = selectedRating;
    highlightStars(selectedRating);
  });
});

function highlightStars(count) {
  stars.forEach(s => {
    const v = parseInt(s.dataset.value);
    s.classList.toggle('selected', v <= count);
  });
}

// =====================
// FEEDBACK FORM SUBMIT
// =====================
document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const rating = document.getElementById('rating').value;
  const feedback = document.getElementById('feedbackText').value.trim();
  const resultMsg = document.getElementById('resultMsg');
  const spinner = document.getElementById('spinner');

  // Validate star rating selected
  if (!rating) {
    showResult('Please select a star rating.', 'error');
    return;
  }

  // Show spinner
  spinner.style.display = 'block';
  resultMsg.style.display = 'none';
  document.getElementById('submitBtn').disabled = true;

  try {
    const res = await fetch(`${API}/submit-feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, rating, feedback })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Submission failed.');
    }

    // Show success message with sentiment
    showResult(
      `✅ Thank you! Your feedback is: ${data.sentiment} (Score: ${data.score})`,
      'success'
    );

    // Reset form
    document.getElementById('feedbackForm').reset();
    selectedRating = 0;
    highlightStars(0);
    document.getElementById('rating').value = '';

  } catch (err) {
    showResult(`❌ Error: ${err.message}`, 'error');
  } finally {
    spinner.style.display = 'none';
    document.getElementById('submitBtn').disabled = false;
  }
});

function showResult(msg, type) {
  const el = document.getElementById('resultMsg');
  el.textContent = msg;
  el.className = type; // 'success' or 'error'
  el.style.display = 'block';
}

// =====================
// ADMIN LOGIN MODAL
// =====================
function openAdminModal() {
  document.getElementById('adminModal').style.display = 'flex';
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('adminUser').value = '';
  document.getElementById('adminPass').value = '';
}

function closeAdminModal() {
  document.getElementById('adminModal').style.display = 'none';
}

function doAdminLogin() {
  const user = document.getElementById('adminUser').value;
  const pass = document.getElementById('adminPass').value;

  // Hardcoded admin credentials
  if (user === 'admin' && pass === 'admin123') {
    closeAdminModal();
    document.getElementById('adminLoginBtn').style.display = 'none';
    document.getElementById('adminLogoutBtn').style.display = 'inline-block';
    document.getElementById('adminDashboard').style.display = 'block';
    loadDashboard();
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
}

function adminLogout() {
  document.getElementById('adminLoginBtn').style.display = 'inline-block';
  document.getElementById('adminLogoutBtn').style.display = 'none';
  document.getElementById('adminDashboard').style.display = 'none';
}

// =====================
// LOAD DASHBOARD DATA
// =====================
let allFeedbacks = [];
let chartInstance = null;

async function loadDashboard() {
  try {
    // Fetch stats
    const statsRes = await fetch(`${API}/stats`);
    const stats = await statsRes.json();
    document.getElementById('totalCount').textContent = stats.total;
    document.getElementById('positiveCount').textContent = stats.positive;
    document.getElementById('neutralCount').textContent = stats.neutral;
    document.getElementById('negativeCount').textContent = stats.negative;

    // Fetch all feedbacks
    const fbRes = await fetch(`${API}/all-feedbacks`);
    allFeedbacks = await fbRes.json();

    // Render table
    renderTable(allFeedbacks);

    // Render chart
    renderChart(stats);

  } catch (err) {
    alert('Failed to load dashboard: ' + err.message);
  }
}

// =====================
// RENDER FEEDBACK TABLE
// =====================
function renderTable(data) {
  const tbody = document.getElementById('feedbackTableBody');
  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center">No feedbacks found.</td></tr>';
    return;
  }

  data.forEach((f, i) => {
    const date = new Date(f.timestamp).toLocaleDateString();
    const stars = '★'.repeat(f.rating) + '☆'.repeat(5 - f.rating);
    const row = `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(f.name)}</td>
        <td>${escapeHtml(f.email)}</td>
        <td title="${f.rating}/5">${stars}</td>
        <td>${escapeHtml(f.feedback)}</td>
        <td><span class="badge ${f.sentiment}">${f.sentiment}</span></td>
        <td>${f.score}</td>
        <td>${date}</td>
      </tr>
    `;
    tbody.insertAdjacentHTML('beforeend', row);
  });
}

// =====================
// FILTER FEEDBACKS
// =====================
function filterFeedbacks() {
  const filter = document.getElementById('filterSelect').value;
  if (filter === 'all') {
    renderTable(allFeedbacks);
  } else {
    const filtered = allFeedbacks.filter(f => f.sentiment === filter);
    renderTable(filtered);
  }
}

// =====================
// RENDER CHART
// =====================
function renderChart(stats) {
  const ctx = document.getElementById('sentimentChart').getContext('2d');

  // Destroy existing chart if any
  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [{
        data: [stats.positive, stats.neutral, stats.negative],
        backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        title: {
          display: true,
          text: 'Sentiment Distribution'
        }
      }
    }
  });
}

// =====================
// UTILITY: Escape HTML
// =====================
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}