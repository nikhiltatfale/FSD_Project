// ============================================================
//  BloodLink - Blood Donation Management System
//  All logic, LocalStorage, validation, admin functions
// ============================================================

// ===== CONSTANTS =====
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };
const DONATION_GAP_DAYS = 90; // Minimum days between donations

// ===== STATE =====
let currentUser = null;      // logged-in donor object
let isAdminLoggedIn = false;

// ===== LOCALSTORAGE HELPERS =====
function getDonors()   { return JSON.parse(localStorage.getItem('bl_donors') || '[]'); }
function getRequests() { return JSON.parse(localStorage.getItem('bl_requests') || '[]'); }
function saveDonors(d)   { localStorage.setItem('bl_donors', JSON.stringify(d)); }
function saveRequests(r) { localStorage.setItem('bl_requests', JSON.stringify(r)); }

// ===== NAVIGATION =====
function showSection(id) {
  // Guard: dashboard requires login
  if (id === 'dashboard' && !currentUser) {
    showAlert('Please login to access your dashboard.', 'warning');
    openModal('loginModal');
    return;
  }
  // Guard: admin requires admin login
  if (id === 'admin' && !isAdminLoggedIn) {
    showAlert('Admin access required.', 'danger');
    openAdminLogin();
    return;
  }

  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');

  closeMenu();

  // Refresh content on section load
  if (id === 'home') updateHomeStats();
  if (id === 'dashboard') loadDashboard();
  if (id === 'admin') loadAdminPanel();
  if (id === 'search') searchDonors();
}

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}
function closeMenu() {
  document.getElementById('navLinks').classList.remove('open');
}

// ===== MODALS =====
function openModal(id) {
  document.getElementById(id).classList.add('active');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Close modal on backdrop click
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// ===== ALERT / CONFIRM HELPERS =====
function showAlert(msg, type = 'info') {
  const icons = { success: '✅', danger: '❌', warning: '⚠️', info: 'ℹ️' };
  document.getElementById('alertIcon').textContent = icons[type] || 'ℹ️';
  document.getElementById('alertMsg').textContent = msg;
  openModal('alertModal');
}

function showConfirm(msg, onYes) {
  document.getElementById('confirmMsg').textContent = msg;
  const btn = document.getElementById('confirmYesBtn');
  btn.onclick = function() {
    closeModal('confirmModal');
    onYes();
  };
  openModal('confirmModal');
}

// ===== LOADING SPINNER =====
function showLoading() {
  const el = document.getElementById('loadingOverlay');
  el.style.display = 'flex';
}
function hideLoading() {
  const el = document.getElementById('loadingOverlay');
  el.style.display = 'none';
}

// ===== UTILITY FUNCTIONS =====

// Calculate days between two dates
function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  const then = new Date(dateStr);
  const now = new Date();
  const diff = (now - then) / (1000 * 60 * 60 * 24);
  return Math.floor(diff);
}

// Check if donor is eligible to donate
function isEligible(donor) {
  if (!donor.lastDonation) return true;
  return daysSince(donor.lastDonation) >= DONATION_GAP_DAYS;
}

// Format date nicely
function fmtDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Generate unique ID
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Badge HTML
function badge(text, type) {
  return `<span class="badge badge-${type}">${text}</span>`;
}

// Urgency badge
function urgencyBadge(u) {
  const map = { Normal: 'info', Urgent: 'warning', Emergency: 'danger' };
  return badge(u, map[u] || 'secondary');
}

// Status badge for requests
function statusBadge(s) {
  const map = { Pending: 'warning', Approved: 'success', Rejected: 'danger' };
  return badge(s, map[s] || 'secondary');
}

// Eligibility badge
function eligiBadge(donor) {
  return isEligible(donor)
    ? badge('Eligible', 'success')
    : badge('Not Eligible', 'danger');
}

// ===== PHONE / EMAIL VALIDATION =====
function validPhone(p) { return /^[6-9]\d{9}$/.test(p.trim()); }
function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }

// ===== DONOR REGISTRATION =====
function registerDonor(e) {
  e.preventDefault();

  const name        = document.getElementById('regName').value.trim();
  const age         = parseInt(document.getElementById('regAge').value);
  const gender      = document.getElementById('regGender').value;
  const bloodGroup  = document.getElementById('regBloodGroup').value;
  const phone       = document.getElementById('regPhone').value.trim();
  const email       = document.getElementById('regEmail').value.trim().toLowerCase();
  const address     = document.getElementById('regAddress').value.trim();
  const lastDon     = document.getElementById('regLastDonation').value;
  const password    = document.getElementById('regPassword').value;
  const health      = document.getElementById('regHealth').checked;
  const consent     = document.getElementById('regConsent').checked;

  // Validations
  if (!name || name.length < 2) { showAlert('Please enter a valid full name.', 'warning'); return; }
  if (age < 18 || age > 65) { showAlert('Age must be between 18 and 65.', 'warning'); return; }
  if (!gender) { showAlert('Please select gender.', 'warning'); return; }
  if (!bloodGroup) { showAlert('Please select blood group.', 'warning'); return; }
  if (!validPhone(phone)) { showAlert('Enter a valid 10-digit phone number.', 'warning'); return; }
  if (!validEmail(email)) { showAlert('Enter a valid email address.', 'warning'); return; }
  if (!address) { showAlert('Please enter your address.', 'warning'); return; }
  if (password.length < 6) { showAlert('Password must be at least 6 characters.', 'warning'); return; }
  if (!health) { showAlert('Please confirm your health condition.', 'warning'); return; }
  if (!consent) { showAlert('Please accept the terms and conditions.', 'warning'); return; }

  // Check duplicate phone/email
  const donors = getDonors();
  const dup = donors.find(d => d.phone === phone || d.email === email);
  if (dup) {
    showAlert('A donor with this phone or email already exists. Please login.', 'danger');
    return;
  }

  showLoading();
  setTimeout(() => {
    const donor = {
      id: uid(),
      name, age, gender, bloodGroup, phone, email, address,
      lastDonation: lastDon || null,
      password,
      registeredAt: new Date().toISOString(),
      donationHistory: lastDon ? [{ date: lastDon, note: 'Recorded on registration' }] : []
    };

    donors.push(donor);
    saveDonors(donors);
    hideLoading();

    document.getElementById('registerForm').reset();
    showAlert(`Registration successful! Welcome, ${name}! You can now login.`, 'success');
    updateHomeStats();
  }, 800);
}

// ===== LOGIN / LOGOUT =====
function switchLoginTab(tab) {
  const isDonor = tab === 'donor';
  document.getElementById('donorLoginTab').style.display = isDonor ? 'block' : 'none';
  document.getElementById('adminLoginTab').style.display = isDonor ? 'none' : 'block';
  document.getElementById('tabDonorBtn').classList.toggle('active', isDonor);
  document.getElementById('tabAdminBtn').classList.toggle('active', !isDonor);
}

function loginDonor() {
  const identifier = document.getElementById('loginIdentifier').value.trim().toLowerCase();
  const password   = document.getElementById('loginPassword').value;

  if (!identifier || !password) {
    showAlert('Please enter phone/email and password.', 'warning');
    return;
  }

  const donors = getDonors();
  const donor = donors.find(d =>
    (d.phone === identifier || d.email.toLowerCase() === identifier) &&
    d.password === password
  );

  if (!donor) {
    showAlert('Invalid credentials. Please check and try again.', 'danger');
    return;
  }

  currentUser = donor;
  sessionStorage.setItem('bl_currentUser', donor.id);
  closeModal('loginModal');
  updateNavForLogin();
  showSection('dashboard');
  showAlert(`Welcome back, ${donor.name}!`, 'success');
  document.getElementById('loginIdentifier').value = '';
  document.getElementById('loginPassword').value = '';
}

function loginAdmin() {
  const username = document.getElementById('adminUsername').value.trim();
  const password = document.getElementById('adminPassword').value;

  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    isAdminLoggedIn = true;
    sessionStorage.setItem('bl_adminLoggedIn', '1');
    closeModal('loginModal');
    updateNavForLogin();
    showSection('admin');
    showAlert('Admin login successful!', 'success');
  } else {
    showAlert('Invalid admin credentials.', 'danger');
  }
}

function logout() {
  showConfirm('Are you sure you want to logout?', () => {
    currentUser = null;
    isAdminLoggedIn = false;
    sessionStorage.removeItem('bl_currentUser');
    sessionStorage.removeItem('bl_adminLoggedIn');
    updateNavForLogin();
    showSection('home');
    showAlert('Logged out successfully.', 'info');
  });
}

function updateNavForLogin() {
  const loggedIn = currentUser || isAdminLoggedIn;
  document.getElementById('navLoginLi').style.display    = loggedIn ? 'none' : 'block';
  document.getElementById('navRegisterLi').style.display = loggedIn ? 'none' : 'block';
  document.getElementById('navLogoutLi').style.display   = loggedIn ? 'block' : 'none';
  document.getElementById('navDashboardLi').style.display = currentUser ? 'block' : 'none';
  document.getElementById('navAdminLi').style.display     = isAdminLoggedIn ? 'block' : 'none';
}

function openAdminLogin() {
  openModal('loginModal');
  switchLoginTab('admin');
}

// ===== HOME STATS =====
function updateHomeStats() {
  const donors   = getDonors();
  const requests = getRequests();
  const approved = requests.filter(r => r.status === 'Approved').length;

  document.getElementById('statDonors').textContent   = donors.length;
  document.getElementById('statRequests').textContent = requests.length;
  document.getElementById('statApproved').textContent = approved;

  renderBloodAvailGrid('bloodAvailGrid', donors);
  renderRecentRequests();
}

function renderBloodAvailGrid(containerId, donors) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const counts = {};
  BLOOD_GROUPS.forEach(g => counts[g] = 0);
  donors.forEach(d => { if (counts[d.bloodGroup] !== undefined) counts[d.bloodGroup]++; });

  container.innerHTML = BLOOD_GROUPS.map(g => `
    <div class="blood-card" onclick="filterByGroup('${g}')">
      <div class="bg-type">${g}</div>
      <div class="bg-count">${counts[g]} donor${counts[g] !== 1 ? 's' : ''}</div>
    </div>
  `).join('');
}

function filterByGroup(group) {
  document.getElementById('searchBloodGroup').value = group;
  showSection('search');
  searchDonors();
}

function renderRecentRequests() {
  const container = document.getElementById('recentRequestsHome');
  if (!container) return;
  const requests = getRequests().slice(-5).reverse();
  if (!requests.length) {
    container.innerHTML = '<div class="empty-state"><div class="icon">📋</div><p>No blood requests yet.</p></div>';
    return;
  }
  container.innerHTML = requests.map(r => `
    <div class="req-item">
      <span><strong>${r.patientName}</strong> needs <strong>${r.bloodGroup}</strong> (${r.units} units)</span>
      <span>${r.hospital}</span>
      ${urgencyBadge(r.urgency)}
      ${statusBadge(r.status)}
    </div>
  `).join('');
}

// ===== SEARCH / FIND DONORS =====
function searchDonors() {
  const bloodGroup = document.getElementById('searchBloodGroup').value;
  const query      = (document.getElementById('searchName').value || '').trim().toLowerCase();

  let donors = getDonors();

  if (bloodGroup) donors = donors.filter(d => d.bloodGroup === bloodGroup);
  if (query) donors = donors.filter(d =>
    d.name.toLowerCase().includes(query) ||
    d.address.toLowerCase().includes(query)
  );

  const container = document.getElementById('searchResults');
  if (!container) return;

  if (!donors.length) {
    container.innerHTML = `<div class="empty-state"><div class="icon">🔍</div><p>No donors found${bloodGroup ? ' for blood group ' + bloodGroup : ''}.</p></div>`;
    return;
  }

  container.innerHTML = `<p style="margin-bottom:12px; color:#666;">${donors.length} donor(s) found:</p>` +
    donors.map(d => {
      const eligible = isEligible(d);
      return `
        <div class="donor-card">
          <div class="donor-info">
            <h4>${escHtml(d.name)}</h4>
            <p>📍 ${escHtml(d.address)}</p>
            <p>📞 ${d.phone} &nbsp;|&nbsp; ✉️ ${d.email}</p>
            <p>Gender: ${d.gender} | Age: ${d.age}</p>
            <p>Last Donation: ${fmtDate(d.lastDonation)}</p>
          </div>
          <div style="text-align:center;">
            <div class="donor-blood">${d.bloodGroup}</div>
            <div style="margin-top:6px;">${eligiBadge(d)}</div>
          </div>
        </div>
      `;
    }).join('');
}

function clearSearch() {
  document.getElementById('searchBloodGroup').value = '';
  document.getElementById('searchName').value = '';
  searchDonors();
}

// ===== BLOOD REQUEST =====
function submitBloodRequest(e) {
  e.preventDefault();

  const patientName = document.getElementById('reqPatient').value.trim();
  const bloodGroup  = document.getElementById('reqBloodGroup').value;
  const units       = parseInt(document.getElementById('reqUnits').value);
  const urgency     = document.getElementById('reqUrgency').value;
  const hospital    = document.getElementById('reqHospital').value.trim();
  const contact     = document.getElementById('reqContact').value.trim();
  const notes       = document.getElementById('reqNotes').value.trim();

  // Validations
  if (!patientName) { showAlert('Please enter patient name.', 'warning'); return; }
  if (!bloodGroup)  { showAlert('Please select blood group.', 'warning'); return; }
  if (!units || units < 1) { showAlert('Please enter valid units required.', 'warning'); return; }
  if (!urgency)     { showAlert('Please select urgency level.', 'warning'); return; }
  if (!hospital)    { showAlert('Please enter hospital name.', 'warning'); return; }
  if (!contact || contact.length < 6) { showAlert('Please enter a valid contact number.', 'warning'); return; }

  showLoading();
  setTimeout(() => {
    const req = {
      id: uid(),
      patientName, bloodGroup, units, urgency, hospital, contact, notes,
      status: 'Pending',
      requestedAt: new Date().toISOString()
    };

    const requests = getRequests();
    requests.push(req);
    saveRequests(requests);

    document.getElementById('requestForm').reset();
    hideLoading();
    showAlert(`Blood request submitted successfully! Request ID: ${req.id}. Track status using your contact number.`, 'success');
    updateHomeStats();
  }, 800);
}

// ===== TRACK REQUEST =====
function trackRequest() {
  const contact = document.getElementById('trackContact').value.trim();
  if (!contact) { showAlert('Please enter your contact number.', 'warning'); return; }

  const requests = getRequests().filter(r => r.contact === contact);
  const container = document.getElementById('trackResults');

  if (!requests.length) {
    container.innerHTML = `<div class="alert alert-info">No requests found for contact: <strong>${escHtml(contact)}</strong></div>`;
    return;
  }

  container.innerHTML = requests.map(r => `
    <div class="card" style="margin-top:10px;">
      <div class="req-item" style="flex-wrap:wrap;">
        <div>
          <strong>Patient:</strong> ${escHtml(r.patientName)}<br>
          <strong>Blood Group:</strong> ${r.bloodGroup} &nbsp;|&nbsp; <strong>Units:</strong> ${r.units}<br>
          <strong>Hospital:</strong> ${escHtml(r.hospital)}<br>
          <strong>Requested:</strong> ${fmtDate(r.requestedAt)}
        </div>
        <div style="text-align:right;">
          ${urgencyBadge(r.urgency)}<br>
          <div style="margin-top:5px;">${statusBadge(r.status)}</div>
        </div>
      </div>
    </div>
  `).join('');
}

// ===== DONOR DASHBOARD =====
function loadDashboard() {
  if (!currentUser) return;

  // Refresh user data from localStorage
  const donors = getDonors();
  const fresh = donors.find(d => d.id === currentUser.id);
  if (fresh) currentUser = fresh;

  renderProfileCard();
  renderEligibility();
  renderDonationHistory();
}

function renderProfileCard() {
  const d = currentUser;
  document.getElementById('profileInfo').innerHTML = `
    <div class="profile-row"><span class="label">Name</span><span class="val">${escHtml(d.name)}</span></div>
    <div class="profile-row"><span class="label">Blood Group</span><span class="val">${d.bloodGroup}</span></div>
    <div class="profile-row"><span class="label">Age</span><span class="val">${d.age} yrs</span></div>
    <div class="profile-row"><span class="label">Gender</span><span class="val">${d.gender}</span></div>
    <div class="profile-row"><span class="label">Phone</span><span class="val">${d.phone}</span></div>
    <div class="profile-row"><span class="label">Email</span><span class="val">${d.email}</span></div>
    <div class="profile-row"><span class="label">Address</span><span class="val">${escHtml(d.address)}</span></div>
    <div class="profile-row"><span class="label">Last Donation</span><span class="val">${fmtDate(d.lastDonation)}</span></div>
    <div class="profile-row"><span class="label">Registered</span><span class="val">${fmtDate(d.registeredAt)}</span></div>
  `;
}

function renderEligibility() {
  const d = currentUser;
  const eligible = isEligible(d);
  const daysPassed = d.lastDonation ? daysSince(d.lastDonation) : null;
  const daysLeft   = daysPassed !== null ? Math.max(0, DONATION_GAP_DAYS - daysPassed) : 0;

  let html = '';
  if (eligible) {
    html = `
      <div class="alert alert-success">
        ✅ <strong>You are eligible to donate!</strong><br>
        ${daysPassed !== null ? `${daysPassed} days since last donation.` : 'No previous donation recorded.'}
      </div>
      <p>You can visit your nearest blood bank and donate today.</p>
      <button class="btn btn-primary" style="margin-top:10px;" onclick="recordDonation()">Record New Donation</button>
    `;
  } else {
    html = `
      <div class="alert alert-warning">
        ⏳ <strong>Not eligible yet.</strong><br>
        You need to wait <strong>${daysLeft} more days</strong> before you can donate again.
      </div>
      <p>Last donation: ${fmtDate(d.lastDonation)}<br>
      Days passed: ${daysPassed} / ${DONATION_GAP_DAYS} required</p>
      <div style="margin-top:10px; background:#eee; border-radius:5px; height:12px; overflow:hidden;">
        <div style="width:${Math.min(100, Math.round((daysPassed/DONATION_GAP_DAYS)*100))}%; background:#c0392b; height:100%; transition:width 0.5s;"></div>
      </div>
      <p style="font-size:0.8rem; color:#888; margin-top:4px;">${Math.min(100, Math.round((daysPassed/DONATION_GAP_DAYS)*100))}% of waiting period completed</p>
    `;
  }
  document.getElementById('eligibilityInfo').innerHTML = html;
}

function recordDonation() {
  const today = new Date().toISOString().split('T')[0];
  const donors = getDonors();
  const idx = donors.findIndex(d => d.id === currentUser.id);
  if (idx === -1) return;

  const note = prompt('Add a note for this donation (optional):') || 'Blood donated';
  donors[idx].lastDonation = today;
  if (!donors[idx].donationHistory) donors[idx].donationHistory = [];
  donors[idx].donationHistory.push({ date: today, note });

  saveDonors(donors);
  currentUser = donors[idx];
  loadDashboard();
  showAlert('Donation recorded successfully! Thank you for saving a life! 🩸', 'success');
}

function renderDonationHistory() {
  const d = currentUser;
  const history = d.donationHistory || [];

  if (!history.length) {
    document.getElementById('donationHistory').innerHTML = `<div class="empty-state"><div class="icon">📅</div><p>No donation history recorded yet.</p></div>`;
    return;
  }

  const sorted = [...history].reverse();
  document.getElementById('donationHistory').innerHTML = `
    <table class="data-table">
      <thead><tr><th>#</th><th>Date</th><th>Note</th></tr></thead>
      <tbody>
        ${sorted.map((h, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${fmtDate(h.date)}</td>
            <td>${escHtml(h.note || '')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ===== EDIT PROFILE =====
function openEditProfile() {
  if (!currentUser) return;
  const d = currentUser;
  document.getElementById('editName').value         = d.name;
  document.getElementById('editAge').value          = d.age;
  document.getElementById('editPhone').value        = d.phone;
  document.getElementById('editEmail').value        = d.email;
  document.getElementById('editAddress').value      = d.address;
  document.getElementById('editLastDonation').value = d.lastDonation || '';
  openModal('editProfileModal');
}

function saveProfile(e) {
  e.preventDefault();

  const name         = document.getElementById('editName').value.trim();
  const age          = parseInt(document.getElementById('editAge').value);
  const phone        = document.getElementById('editPhone').value.trim();
  const email        = document.getElementById('editEmail').value.trim().toLowerCase();
  const address      = document.getElementById('editAddress').value.trim();
  const lastDonation = document.getElementById('editLastDonation').value;

  if (!name)                { showAlert('Name is required.', 'warning'); return; }
  if (age < 18 || age > 65) { showAlert('Age must be 18-65.', 'warning'); return; }
  if (!validPhone(phone))   { showAlert('Enter a valid phone number.', 'warning'); return; }
  if (!validEmail(email))   { showAlert('Enter a valid email.', 'warning'); return; }
  if (!address)             { showAlert('Address is required.', 'warning'); return; }

  const donors = getDonors();
  const idx = donors.findIndex(d => d.id === currentUser.id);
  if (idx === -1) { showAlert('User not found.', 'danger'); return; }

  // Check phone/email conflict with OTHER donors
  const conflict = donors.find((d, i) => i !== idx && (d.phone === phone || d.email === email));
  if (conflict) { showAlert('Phone or email already used by another donor.', 'danger'); return; }

  donors[idx] = { ...donors[idx], name, age, phone, email, address, lastDonation: lastDonation || null };

  // Update donation history if lastDonation changed
  if (lastDonation && lastDonation !== currentUser.lastDonation) {
    if (!donors[idx].donationHistory) donors[idx].donationHistory = [];
    // Don't add duplicate date
    if (!donors[idx].donationHistory.find(h => h.date === lastDonation)) {
      donors[idx].donationHistory.push({ date: lastDonation, note: 'Updated from profile' });
    }
  }

  saveDonors(donors);
  currentUser = donors[idx];
  sessionStorage.setItem('bl_currentUser', currentUser.id);
  closeModal('editProfileModal');
  loadDashboard();
  showAlert('Profile updated successfully!', 'success');
}

// ===== ADMIN PANEL =====
function loadAdminPanel() {
  if (!isAdminLoggedIn) return;
  loadAdminStats();
  loadAdminDonors();
  loadAdminRequests();
  renderBloodAvailGrid('adminBloodStock', getDonors());
}

function loadAdminStats() {
  const donors   = getDonors();
  const requests = getRequests();
  const approved = requests.filter(r => r.status === 'Approved').length;
  const rejected = requests.filter(r => r.status === 'Rejected').length;

  document.getElementById('adminStatDonors').textContent   = donors.length;
  document.getElementById('adminStatRequests').textContent = requests.length;
  document.getElementById('adminStatApproved').textContent = approved;
  document.getElementById('adminStatRejected').textContent = rejected;

  // Also update home stats
  document.getElementById('statDonors').textContent   = donors.length;
  document.getElementById('statRequests').textContent = requests.length;
  document.getElementById('statApproved').textContent = approved;
}

function loadAdminDonors() {
  const filterBG = document.getElementById('adminFilterBlood').value;
  const searchQ  = (document.getElementById('adminSearchDonor').value || '').trim().toLowerCase();

  let donors = getDonors();
  if (filterBG) donors = donors.filter(d => d.bloodGroup === filterBG);
  if (searchQ)  donors = donors.filter(d =>
    d.name.toLowerCase().includes(searchQ) ||
    d.email.toLowerCase().includes(searchQ) ||
    d.phone.includes(searchQ)
  );

  const tbody = document.getElementById('donorsTableBody');
  if (!donors.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#999; padding:30px;">No donors found.</td></tr>`;
    return;
  }

  tbody.innerHTML = donors.map((d, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escHtml(d.name)}</td>
      <td><strong style="color:#c0392b;">${d.bloodGroup}</strong></td>
      <td>${d.phone}</td>
      <td>${d.email}</td>
      <td>${d.age}</td>
      <td>${fmtDate(d.lastDonation)}</td>
      <td>${eligiBadge(d)}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="adminDeleteDonor('${d.id}')">🗑 Delete</button>
      </td>
    </tr>
  `).join('');
}

function loadAdminRequests() {
  const requests = getRequests();
  const tbody = document.getElementById('requestsTableBody');

  if (!requests.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#999; padding:30px;">No blood requests found.</td></tr>`;
    return;
  }

  // Show newest first
  const sorted = [...requests].reverse();

  tbody.innerHTML = sorted.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escHtml(r.patientName)}</td>
      <td><strong style="color:#c0392b;">${r.bloodGroup}</strong></td>
      <td>${r.units}</td>
      <td>${escHtml(r.hospital)}</td>
      <td>${r.contact}</td>
      <td>${urgencyBadge(r.urgency)}</td>
      <td>${statusBadge(r.status)}</td>
      <td>
        ${r.status === 'Pending' ? `
          <button class="btn btn-sm btn-success" onclick="adminUpdateRequest('${r.id}', 'Approved')">✅ Approve</button>
          <button class="btn btn-sm btn-danger" onclick="adminUpdateRequest('${r.id}', 'Rejected')">❌ Reject</button>
        ` : `
          <button class="btn btn-sm btn-outline" onclick="adminUpdateRequest('${r.id}', 'Pending')">↩ Reset</button>
        `}
      </td>
    </tr>
  `).join('');
}

function adminDeleteDonor(id) {
  showConfirm('Are you sure you want to delete this donor? This action cannot be undone.', () => {
    let donors = getDonors();
    donors = donors.filter(d => d.id !== id);
    saveDonors(donors);
    loadAdminPanel();
    showAlert('Donor deleted successfully.', 'success');
  });
}

function adminUpdateRequest(id, newStatus) {
  const requests = getRequests();
  const idx = requests.findIndex(r => r.id === id);
  if (idx === -1) return;

  requests[idx].status = newStatus;
  requests[idx].updatedAt = new Date().toISOString();
  saveRequests(requests);
  loadAdminPanel();

  const msg = newStatus === 'Approved'
    ? 'Request approved successfully!'
    : newStatus === 'Rejected'
    ? 'Request rejected.'
    : 'Request reset to Pending.';
  showAlert(msg, newStatus === 'Approved' ? 'success' : 'info');
}

// ===== CSV EXPORT =====
function exportCSV() {
  const filterBG = document.getElementById('adminFilterBlood').value;
  let donors = getDonors();
  if (filterBG) donors = donors.filter(d => d.bloodGroup === filterBG);

  if (!donors.length) {
    showAlert('No donors to export.', 'warning');
    return;
  }

  const headers = ['Name', 'Age', 'Gender', 'Blood Group', 'Phone', 'Email', 'Address', 'Last Donation', 'Eligible', 'Registered At'];
  const rows = donors.map(d => [
    `"${d.name}"`,
    d.age,
    d.gender,
    d.bloodGroup,
    d.phone,
    d.email,
    `"${d.address.replace(/"/g, '""')}"`,
    d.lastDonation || '',
    isEligible(d) ? 'Yes' : 'No',
    d.registeredAt ? new Date(d.registeredAt).toLocaleDateString() : ''
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `bloodlink_donors_${new Date().toISOString().split('T')[0]}${filterBG ? '_' + filterBG.replace('+','pos').replace('-','neg') : ''}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showAlert(`Exported ${donors.length} donor(s) to CSV.`, 'success');
}

// ===== XSS PROTECTION =====
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ===== SESSION RESTORE =====
function restoreSession() {
  // Restore admin session
  if (sessionStorage.getItem('bl_adminLoggedIn') === '1') {
    isAdminLoggedIn = true;
    updateNavForLogin();
  }

  // Restore donor session
  const userId = sessionStorage.getItem('bl_currentUser');
  if (userId) {
    const donors = getDonors();
    const donor = donors.find(d => d.id === userId);
    if (donor) {
      currentUser = donor;
      updateNavForLogin();
    }
  }
}

// ===== SEED DEMO DATA (if empty) =====
function seedDemoData() {
  if (getDonors().length > 0) return; // Don't seed if data exists

  const demoDonors = [
    { id: uid(), name: 'Rahul Sharma', age: 28, gender: 'Male', bloodGroup: 'A+', phone: '9876543210', email: 'rahul@demo.com', address: 'Mumbai, Maharashtra', lastDonation: '2024-01-15', password: 'demo123', registeredAt: new Date().toISOString(), donationHistory: [{ date: '2024-01-15', note: 'City Blood Bank' }] },
    { id: uid(), name: 'Priya Patel', age: 24, gender: 'Female', bloodGroup: 'B+', phone: '9876543211', email: 'priya@demo.com', address: 'Pune, Maharashtra', lastDonation: '2023-10-10', password: 'demo123', registeredAt: new Date().toISOString(), donationHistory: [{ date: '2023-10-10', note: 'Donated at camp' }] },
    { id: uid(), name: 'Amit Joshi', age: 35, gender: 'Male', bloodGroup: 'O+', phone: '9876543212', email: 'amit@demo.com', address: 'Nashik, Maharashtra', lastDonation: null, password: 'demo123', registeredAt: new Date().toISOString(), donationHistory: [] },
    { id: uid(), name: 'Sneha Kulkarni', age: 22, gender: 'Female', bloodGroup: 'AB-', phone: '9876543213', email: 'sneha@demo.com', address: 'Nagpur, Maharashtra', lastDonation: '2023-12-20', password: 'demo123', registeredAt: new Date().toISOString(), donationHistory: [{ date: '2023-12-20', note: 'Accident emergency' }] },
    { id: uid(), name: 'Vikram Singh', age: 30, gender: 'Male', bloodGroup: 'B-', phone: '9876543214', email: 'vikram@demo.com', address: 'Delhi', lastDonation: '2024-02-01', password: 'demo123', registeredAt: new Date().toISOString(), donationHistory: [{ date: '2024-02-01', note: 'Regular donation' }] },
    { id: uid(), name: 'Anita Desai', age: 27, gender: 'Female', bloodGroup: 'O-', phone: '9876543215', email: 'anita@demo.com', address: 'Ahmedabad, Gujarat', lastDonation: null, password: 'demo123', registeredAt: new Date().toISOString(), donationHistory: [] },
  ];

  const demoRequests = [
    { id: uid(), patientName: 'Suresh Kumar', bloodGroup: 'A+', units: 2, urgency: 'Urgent', hospital: 'City Hospital', contact: '9111111111', notes: '', status: 'Pending', requestedAt: new Date().toISOString() },
    { id: uid(), patientName: 'Meena Devi', bloodGroup: 'O+', units: 1, urgency: 'Emergency', hospital: 'Apollo Hospital', contact: '9222222222', notes: 'Accident victim', status: 'Approved', requestedAt: new Date().toISOString() },
    { id: uid(), patientName: 'Ravi Teja', bloodGroup: 'B+', units: 3, urgency: 'Normal', hospital: 'Government Hospital', contact: '9333333333', notes: '', status: 'Rejected', requestedAt: new Date().toISOString() },
  ];

  saveDonors(demoDonors);
  saveRequests(demoRequests);
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    // Close any open modal
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
  }
  // Enter key in donor login
  if (e.key === 'Enter' && document.getElementById('loginModal').classList.contains('active')) {
    if (document.getElementById('donorLoginTab').style.display !== 'none') {
      loginDonor();
    }
  }
});

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  seedDemoData();        // Seed demo data on first load
  restoreSession();      // Restore session if any
  updateHomeStats();     // Populate home page stats
  showSection('home');   // Show home section

  // If session was admin, go to admin
  if (isAdminLoggedIn) {
    showSection('admin');
  }
  // If session was donor, show dashboard
  else if (currentUser) {
    showSection('dashboard');
  }
});