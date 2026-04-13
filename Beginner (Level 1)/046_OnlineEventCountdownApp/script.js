/**
 * Event Countdown App - script.js
 * All logic: countdown, admin auth, localStorage, image base64, toasts, triggers
 */

/* ==============================
   STATE
============================== */
let countdownInterval = null;   // main user countdown timer
let previewInterval   = null;   // admin live-preview timer
let footerClickCount  = 0;
let footerClickTimer  = null;
let isAdminLoggedIn   = false;

/* ==============================
   DOM REFERENCES
============================== */
const loader            = document.getElementById('loader');
const mainView          = document.getElementById('main-view');
const adminPanel        = document.getElementById('admin-panel');
const adminLoginModal   = document.getElementById('admin-login-modal');

// User side
const evtTitle          = document.getElementById('event-title');
const evtDesc           = document.getElementById('event-desc');
const evtDatetime       = document.getElementById('event-datetime');
const evtBanner         = document.getElementById('event-banner');
const evtStarted        = document.getElementById('event-started');
const noEvent           = document.getElementById('no-event');
const countdownEl       = document.getElementById('countdown');

// Countdown digit spans
const daysEl    = document.getElementById('days');
const hoursEl   = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');

// Admin login
const adminUserInput = document.getElementById('admin-user');
const adminPassInput = document.getElementById('admin-pass');
const loginBtn       = document.getElementById('login-btn');
const closeLoginBtn  = document.getElementById('close-login-btn');

// Admin form
const aTitle    = document.getElementById('a-title');
const aDesc     = document.getElementById('a-desc');
const aDatetime = document.getElementById('a-datetime');
const aImage    = document.getElementById('a-image');
const aPreview  = document.getElementById('a-preview');
const saveBtn   = document.getElementById('save-btn');
const resetBtn  = document.getElementById('reset-btn');
const logoutBtn = document.getElementById('logout-btn');

// Preview panel
const pBanner   = document.getElementById('p-banner');
const pTitle    = document.getElementById('p-title');
const pDesc     = document.getElementById('p-desc');
const pDatetime = document.getElementById('p-datetime');
const pDays     = document.getElementById('p-days');
const pHours    = document.getElementById('p-hours');
const pMinutes  = document.getElementById('p-minutes');
const pSeconds  = document.getElementById('p-seconds');

// Footer
const footerText = document.getElementById('footer-text');

/* ==============================
   INIT
============================== */
window.addEventListener('DOMContentLoaded', () => {
  // Show loader briefly then init
  setTimeout(() => {
    loader.classList.add('fade-out');
    setTimeout(() => {
      loader.classList.add('hidden');
      initApp();
    }, 500);
  }, 800);
});

function initApp() {
  mainView.classList.remove('hidden');
  loadAndDisplayEvent();
  registerTriggers();
}

/* ==============================
   LOCAL STORAGE HELPERS
============================== */
function saveEvent(data) {
  localStorage.setItem('countdown_event', JSON.stringify(data));
}

function loadEvent() {
  try {
    const raw = localStorage.getItem('countdown_event');
    return raw ? JSON.parse(raw) : null;
  } catch(e) {
    return null;
  }
}

function clearEvent() {
  localStorage.removeItem('countdown_event');
}

/* ==============================
   USER VIEW: LOAD & DISPLAY
============================== */
function loadAndDisplayEvent() {
  clearInterval(countdownInterval);
  const event = loadEvent();

  // Reset UI
  countdownEl.classList.add('hidden');
  evtStarted.classList.add('hidden');
  noEvent.classList.add('hidden');
  evtBanner.classList.add('hidden');

  if (!event || !event.title || !event.datetime) {
    noEvent.classList.remove('hidden');
    evtTitle.textContent = 'Event Countdown';
    evtDesc.textContent  = '';
    evtDatetime.textContent = '';
    return;
  }

  evtTitle.textContent = event.title;
  evtDesc.textContent  = event.description || '';
  evtDatetime.textContent = 'Scheduled: ' + formatDateTime(event.datetime);

  if (event.image) {
    evtBanner.src = event.image;
    evtBanner.classList.remove('hidden');
  }

  const target = new Date(event.datetime).getTime();
  if (isNaN(target)) {
    noEvent.classList.remove('hidden');
    return;
  }

  // Start countdown
  countdownEl.classList.remove('hidden');
  runCountdown(target, daysEl, hoursEl, minutesEl, secondsEl, countdownEl, evtStarted);
  countdownInterval = setInterval(() => {
    runCountdown(target, daysEl, hoursEl, minutesEl, secondsEl, countdownEl, evtStarted);
  }, 1000);
}

/* ==============================
   COUNTDOWN ENGINE
============================== */
function runCountdown(target, dEl, hEl, mEl, sEl, gridEl, startedEl) {
  const now  = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    // Event started
    dEl.textContent = hEl.textContent = mEl.textContent = sEl.textContent = '00';
    gridEl.classList.add('hidden');
    startedEl.classList.remove('hidden');
    return;
  }

  startedEl.classList.add('hidden');
  gridEl.classList.remove('hidden');

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  dEl.textContent = pad(days);
  hEl.textContent = pad(hours);
  mEl.textContent = pad(minutes);
  sEl.textContent = pad(seconds);
}

function pad(n) { return String(n).padStart(2, '0'); }

function formatDateTime(dtStr) {
  try {
    const d = new Date(dtStr);
    return d.toLocaleString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short',
      day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch(e) { return dtStr; }
}

/* ==============================
   HIDDEN ADMIN TRIGGERS
============================== */
function registerTriggers() {
  // Footer: 5 clicks within 3 seconds
  footerText.addEventListener('click', () => {
    footerClickCount++;
    clearTimeout(footerClickTimer);
    if (footerClickCount >= 5) {
      footerClickCount = 0;
      openAdminLogin();
      return;
    }
    footerClickTimer = setTimeout(() => { footerClickCount = 0; }, 3000);
  });

  // Keyboard: Ctrl + Shift + A
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      openAdminLogin();
    }
  });
}

/* ==============================
   ADMIN LOGIN
============================== */
function openAdminLogin() {
  if (isAdminLoggedIn) {
    // Already logged in — go to admin panel
    switchToAdmin();
    return;
  }
  adminLoginModal.classList.remove('hidden');
  adminUserInput.value = '';
  adminPassInput.value = '';
  adminUserInput.focus();
}

function closeAdminLogin() {
  adminLoginModal.classList.add('hidden');
}

loginBtn.addEventListener('click', attemptLogin);
adminPassInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') attemptLogin(); });
closeLoginBtn.addEventListener('click', closeAdminLogin);

function attemptLogin() {
  const user = adminUserInput.value.trim();
  const pass = adminPassInput.value;
  if (user === 'admin' && pass === 'admin123') {
    isAdminLoggedIn = true;
    closeAdminLogin();
    switchToAdmin();
    showToast('Welcome, Admin!', 'success');
  } else {
    showToast('Invalid credentials.', 'error');
    adminPassInput.value = '';
    adminPassInput.focus();
  }
}

/* ==============================
   SWITCH VIEWS
============================== */
function switchToAdmin() {
  mainView.classList.add('hidden');
  adminPanel.classList.remove('hidden');
  populateAdminForm();
  startPreviewCountdown();
}

function switchToMain() {
  adminPanel.classList.add('hidden');
  mainView.classList.remove('hidden');
  clearInterval(previewInterval);
  loadAndDisplayEvent();
}

/* ==============================
   ADMIN: LOGOUT / RESET
============================== */
logoutBtn.addEventListener('click', () => {
  isAdminLoggedIn = false;
  switchToMain();
  showToast('Logged out.', 'info');
});

resetBtn.addEventListener('click', () => {
  if (!confirm('Clear the current event? This cannot be undone.')) return;
  clearEvent();
  clearAdminForm();
  showToast('Event reset.', 'info');
  loadAndDisplayEvent();
});

function clearAdminForm() {
  aTitle.value = '';
  aDesc.value  = '';
  aDatetime.value = '';
  aImage.value = '';
  aPreview.src = '';
  aPreview.classList.add('hidden');
  updatePreview();
}

/* ==============================
   ADMIN: POPULATE FORM FROM STORAGE
============================== */
function populateAdminForm() {
  const event = loadEvent();
  if (!event) return;
  aTitle.value    = event.title    || '';
  aDesc.value     = event.description || '';
  aDatetime.value = toLocalDatetimeInput(event.datetime);
  if (event.image) {
    aPreview.src = event.image;
    aPreview.classList.remove('hidden');
  }
  updatePreview();
}

// Convert ISO string → datetime-local value (YYYY-MM-DDTHH:MM)
function toLocalDatetimeInput(iso) {
  try {
    const d = new Date(iso);
    const pad2 = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  } catch(e) { return ''; }
}

/* ==============================
   ADMIN: LIVE PREVIEW
============================== */
// Update preview text/image on any input change
[aTitle, aDesc, aDatetime].forEach(el => el.addEventListener('input', updatePreview));

function updatePreview() {
  pTitle.textContent   = aTitle.value   || 'Event Title';
  pDesc.textContent    = aDesc.value    || 'Description here...';
  pDatetime.textContent = aDatetime.value ? 'Scheduled: ' + formatDateTime(aDatetime.value) : '';

  // Restart preview countdown
  clearInterval(previewInterval);
  startPreviewCountdown();
}

function startPreviewCountdown() {
  const val = aDatetime.value;
  if (!val) {
    pDays.textContent = pHours.textContent = pMinutes.textContent = pSeconds.textContent = '00';
    return;
  }
  const target = new Date(val).getTime();
  if (isNaN(target)) return;

  runCountdown(target, pDays, pHours, pMinutes, pSeconds, document.querySelector('.admin-preview .countdown-grid'), { classList: { remove: ()=>{}, add: ()=>{} } });
  previewInterval = setInterval(() => {
    runCountdown(target, pDays, pHours, pMinutes, pSeconds, document.querySelector('.admin-preview .countdown-grid'), { classList: { remove: ()=>{}, add: ()=>{} } });
  }, 1000);
}

/* ==============================
   ADMIN: IMAGE UPLOAD → BASE64
============================== */
aImage.addEventListener('change', () => {
  const file = aImage.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file.', 'error');
    aImage.value = '';
    return;
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    showToast('Image too large. Max 5MB.', 'error');
    aImage.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result;
    aPreview.src = base64;
    aPreview.classList.remove('hidden');
    pBanner.src = base64;
    pBanner.classList.remove('hidden');
  };
  reader.onerror = () => showToast('Failed to read image.', 'error');
  reader.readAsDataURL(file);
});

/* ==============================
   ADMIN: SAVE EVENT
============================== */
saveBtn.addEventListener('click', saveEventHandler);

function saveEventHandler() {
  // Validation
  const title = aTitle.value.trim();
  if (!title) {
    showToast('Event title is required.', 'error');
    aTitle.focus();
    return;
  }

  const datetimeVal = aDatetime.value;
  if (!datetimeVal) {
    showToast('Event date & time is required.', 'error');
    aDatetime.focus();
    return;
  }

  const eventDate = new Date(datetimeVal);
  if (isNaN(eventDate.getTime())) {
    showToast('Invalid date/time.', 'error');
    return;
  }

  if (eventDate.getTime() <= Date.now()) {
    showToast('Event date must be in the future.', 'error');
    aDatetime.focus();
    return;
  }

  const eventData = {
    title:       title,
    description: aDesc.value.trim(),
    datetime:    eventDate.toISOString(),
    image:       aPreview.src && !aPreview.classList.contains('hidden') ? aPreview.src : ''
  };

  saveEvent(eventData);
  showToast('Event saved successfully!', 'success');

  // Refresh user-side in background
  loadAndDisplayEvent();
}

/* ==============================
   TOAST NOTIFICATIONS
============================== */
const toastContainer = document.getElementById('toast-container');

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  // Remove after 3.5 seconds
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

/* ==============================
   PREVENT PAST DATE IN ADMIN
============================== */
// Set min to current datetime-local
aDatetime.addEventListener('focus', () => {
  const now = new Date();
  const pad2 = n => String(n).padStart(2,'0');
  const minVal = `${now.getFullYear()}-${pad2(now.getMonth()+1)}-${pad2(now.getDate())}T${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  aDatetime.min = minVal;
});