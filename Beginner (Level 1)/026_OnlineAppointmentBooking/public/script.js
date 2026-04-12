// ── Sections ──────────────────────────────────────────────
const sections = {
  booking:    document.getElementById('bookingSection'),
  adminLogin: document.getElementById('adminLoginSection'),
  dashboard:  document.getElementById('adminDashboard'),
};

function showSection(key) {
  Object.values(sections).forEach(s => s.classList.add('hidden'));
  sections[key].classList.remove('hidden');
}

// ── Time slots ────────────────────────────────────────────
(function generateSlots() {
  const sel = document.getElementById('time');
  for (let h = 9; h < 17; h++) {
    ['00', '30'].forEach(m => {
      const hour12 = h > 12 ? h - 12 : h;
      const ampm   = h < 12 ? 'AM' : 'PM';
      const label  = `${hour12}:${m} ${ampm}`;
      const value  = `${String(h).padStart(2,'0')}:${m}`;
      const opt    = new Option(label, value);
      sel.appendChild(opt);
    });
  }
})();

// Set min date to today
document.getElementById('date').min = new Date().toISOString().split('T')[0];

// ── Booking form ──────────────────────────────────────────
document.getElementById('bookingForm').addEventListener('submit', async e => {
  e.preventDefault();
  const msg = document.getElementById('bookMsg');
  msg.className = 'msg';
  msg.textContent = '';

  const body = {
    name:   document.getElementById('name').value.trim(),
    email:  document.getElementById('email').value.trim(),
    phone:  document.getElementById('phone').value.trim(),
    date:   document.getElementById('date').value,
    time:   document.getElementById('time').value,
    reason: document.getElementById('reason').value.trim(),
  };

  try {
    const res  = await fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (res.ok) {
      msg.className = 'msg success';
      msg.textContent = '✅ ' + data.message;
      document.getElementById('bookingForm').reset();
    } else {
      msg.className = 'msg error';
      msg.textContent = '❌ ' + data.error;
    }
  } catch {
    msg.className = 'msg error';
    msg.textContent = '❌ Network error. Try again.';
  }
});

// ── Admin login ───────────────────────────────────────────
async function adminLogin() {
  const msg  = document.getElementById('loginMsg');
  msg.className = 'msg';
  const username = document.getElementById('adminUser').value.trim();
  const password = document.getElementById('adminPass').value;

  try {
    const res  = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (res.ok) {
      showSection('dashboard');
      loadAppointments();
    } else {
      msg.className = 'msg error';
      msg.textContent = '❌ ' + data.error;
    }
  } catch {
    msg.className = 'msg error';
    msg.textContent = '❌ Network error.';
  }
}

// ── Load appointments ─────────────────────────────────────
async function loadAppointments() {
  const tbody = document.getElementById('apptBody');
  const count = document.getElementById('apptCount');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#999">Loading...</td></tr>';

  try {
    const res   = await fetch('/api/appointments');
    const data  = await res.json();
    count.textContent = `Total appointments: ${data.length}`;

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#999">No appointments yet.</td></tr>';
      return;
    }

    tbody.innerHTML = data.map((a, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${esc(a.name)}</td>
        <td>${esc(a.email)}</td>
        <td>${esc(a.phone)}</td>
        <td>${a.date}</td>
        <td>${fmtTime(a.time)}</td>
        <td>${esc(a.reason)}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteAppt(${a.id})">Delete</button></td>
      </tr>
    `).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="8" style="color:red;text-align:center">Failed to load.</td></tr>';
  }
}

// ── Delete appointment ────────────────────────────────────
async function deleteAppt(id) {
  if (!confirm('Delete this appointment?')) return;
  try {
    const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
    if (res.ok) loadAppointments();
    else alert('Failed to delete.');
  } catch {
    alert('Network error.');
  }
}

// ── Logout ────────────────────────────────────────────────
function logout() {
  document.getElementById('adminUser').value = '';
  document.getElementById('adminPass').value = '';
  showSection('booking');
}

// ── Helpers ───────────────────────────────────────────────
function esc(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function fmtTime(val) {
  const [h, m] = val.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12  = h > 12 ? h - 12 : h || 12;
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}