// ---- State ----
let alarms = [];
let is24Hour = false;
let clickCount = 0;
let clickTimer = null;
let ringingAlarmId = null;
let snoozeTimeout = null;

const ADMIN_USER = 'admin';
const ADMIN_PASS = '1234';

// ---- DOM ----
const clockTime = document.getElementById('clock-time');
const clockDate = document.getElementById('clock-date');
const clockDay = document.getElementById('clock-day');
const toggleFormatBtn = document.getElementById('toggle-format');
const clockDisplay = document.getElementById('clock-display');
const alarmList = document.getElementById('alarm-list');
const alarmHour = document.getElementById('alarm-hour');
const alarmMinute = document.getElementById('alarm-minute');
const alarmAmpm = document.getElementById('alarm-ampm');
const alarmLabelInp = document.getElementById('alarm-label');
const alarmToneInp = document.getElementById('alarm-tone');
const addAlarmBtn = document.getElementById('add-alarm-btn');
const ringingOverlay = document.getElementById('ringing-overlay');
const ringLabel = document.getElementById('ring-label');
const ringTime = document.getElementById('ring-time');
const snoozeBtn = document.getElementById('snooze-btn');
const dismissBtn = document.getElementById('dismiss-btn');
const adminLoginModal = document.getElementById('admin-login-modal');
const adminDashboardModal = document.getElementById('admin-dashboard-modal');
const adminUser = document.getElementById('admin-user');
const adminPass = document.getElementById('admin-pass');
const adminLoginBtn = document.getElementById('admin-login-btn');
const adminCancelBtn = document.getElementById('admin-cancel-btn');
const adminLoginErr = document.getElementById('admin-login-err');
const adminStats = document.getElementById('admin-stats');
const adminAlarmList = document.getElementById('admin-alarm-list');
const adminResetBtn = document.getElementById('admin-reset-btn');
const adminLogoutBtn = document.getElementById('admin-logout-btn');
const alarmAudio = document.getElementById('alarm-audio');

// ---- Init Hour/Minute dropdowns ----
function initDropdowns() {
  for (let h = 1; h <= 12; h++) {
    const o = document.createElement('option');
    o.value = String(h).padStart(2, '0');
    o.textContent = String(h).padStart(2, '0');
    alarmHour.appendChild(o);
  }
  for (let m = 0; m < 60; m++) {
    const o = document.createElement('option');
    o.value = String(m).padStart(2, '0');
    o.textContent = String(m).padStart(2, '0');
    alarmMinute.appendChild(o);
  }
}

// ---- Clock ----
function updateClock() {
  const now = new Date();
  let h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  let timeStr;
  if (is24Hour) {
    timeStr = `${String(h).padStart(2, '0')}:${m}:${s}`;
  } else {
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    timeStr = `${String(h).padStart(2, '0')}:${m}:${s} ${ampm}`;
  }
  clockTime.textContent = timeStr;

  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  clockDate.textContent = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  clockDay.textContent = days[now.getDay()];

  checkAlarms(now);
}

toggleFormatBtn.addEventListener('click', () => {
  is24Hour = !is24Hour;
  toggleFormatBtn.textContent = is24Hour ? 'Switch to 12H' : 'Switch to 24H';
});

// ---- Alarm Logic ----
function loadAlarms() {
  try {
    alarms = JSON.parse(localStorage.getItem('alarms')) || [];
  } catch { alarms = []; }
}

function saveAlarms() {
  localStorage.setItem('alarms', JSON.stringify(alarms));
}

function renderAlarms() {
  alarmList.innerHTML = '';
  if (alarms.length === 0) {
    alarmList.innerHTML = '<div class="empty-msg">No alarms set.</div>';
    return;
  }
  alarms.forEach(alarm => {
    const card = document.createElement('div');
    card.className = 'alarm-card' + (alarm.enabled ? '' : ' disabled');
    card.dataset.id = alarm.id;
    card.innerHTML = `
      <div class="alarm-info">
        <div class="alarm-time-label">${alarm.time}</div>
        <div class="alarm-label-text">${alarm.label || 'Alarm'}</div>
      </div>
      <div class="alarm-actions">
        <label class="toggle-switch" title="${alarm.enabled ? 'Enabled' : 'Disabled'}">
          <input type="checkbox" class="alarm-toggle" ${alarm.enabled ? 'checked' : ''}/>
          <span class="toggle-slider"></span>
        </label>
        <button class="btn-delete">Delete</button>
      </div>
    `;
    card.querySelector('.alarm-toggle').addEventListener('change', (e) => {
      alarm.enabled = e.target.checked;
      card.className = 'alarm-card' + (alarm.enabled ? '' : ' disabled');
      saveAlarms();
    });
    card.querySelector('.btn-delete').addEventListener('click', () => {
      if (confirm(`Delete alarm "${alarm.label || alarm.time}"?`)) {
        alarms = alarms.filter(a => a.id !== alarm.id);
        saveAlarms();
        renderAlarms();
        showToast('Alarm deleted.', 'error');
      }
    });
    alarmList.appendChild(card);
  });
}

addAlarmBtn.addEventListener('click', () => {
  const h = alarmHour.value;
  const m = alarmMinute.value;
  const ap = alarmAmpm.value;
  const label = alarmLabelInp.value.trim() || 'Alarm';
  const tone = alarmToneInp.value;
  if (!h || !m) { showToast('Please set a valid time.', 'error'); return; }
  const alarm = {
    id: Date.now().toString(),
    time: `${h}:${m} ${ap}`,
    label,
    tone,
    enabled: true,
    snoozed: false
  };
  alarms.push(alarm);
  saveAlarms();
  renderAlarms();
  alarmLabelInp.value = '';
  showToast(`Alarm "${label}" added for ${alarm.time}`, 'success');
});

// ---- Alarm Checking ----
function checkAlarms(now) {
  if (ringingAlarmId) return;
  const h12 = now.getHours() % 12 || 12;
  const m = String(now.getMinutes()).padStart(2, '0');
  const ap = now.getHours() >= 12 ? 'PM' : 'AM';
  const currentTime = `${String(h12).padStart(2, '0')}:${m} ${ap}`;
  const s = now.getSeconds();
  if (s !== 0) return;

  alarms.forEach(alarm => {
    if (alarm.enabled && alarm.time === currentTime) {
      triggerAlarm(alarm);
    }
  });
}

function triggerAlarm(alarm) {
  ringingAlarmId = alarm.id;
  ringLabel.textContent = alarm.label || 'Alarm';
  ringTime.textContent = alarm.time;
  ringingOverlay.classList.remove('hidden');
  document.body.classList.add('modal-open');
  if (alarm.tone) {
    alarmAudio.src = alarm.tone;
    alarmAudio.play().catch(() => {});
  }
}

snoozeBtn.addEventListener('click', () => {
  stopRinging();
  if (!ringingAlarmId) return;
  const alarm = alarms.find(a => a.id === ringingAlarmId);
  if (alarm) {
    // Set alarm 5 minutes from now
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    const h12 = now.getHours() % 12 || 12;
    const m = String(now.getMinutes()).padStart(2, '0');
    const ap = now.getHours() >= 12 ? 'PM' : 'AM';
    alarm.time = `${String(h12).padStart(2, '0')}:${m} ${ap}`;
    saveAlarms();
    renderAlarms();
    showToast(`Snoozed until ${alarm.time}`, 'success');
  }
  ringingAlarmId = null;
});

dismissBtn.addEventListener('click', () => {
  stopRinging();
  ringingAlarmId = null;
  showToast('Alarm dismissed.', '');
});

function stopRinging() {
  ringingOverlay.classList.add('hidden');
  document.body.classList.remove('modal-open');
  alarmAudio.pause();
  alarmAudio.currentTime = 0;
}

// ---- Admin Panel ----
clockDisplay.addEventListener('click', () => {
  clickCount++;
  clearTimeout(clickTimer);
  if (clickCount >= 5) {
    clickCount = 0;
    openAdminLogin();
  } else {
    clickTimer = setTimeout(() => { clickCount = 0; }, 2000);
  }
});

function openAdminLogin() {
  adminUser.value = '';
  adminPass.value = '';
  adminLoginErr.textContent = '';
  adminLoginModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

adminCancelBtn.addEventListener('click', () => {
  adminLoginModal.classList.add('hidden');
  document.body.classList.remove('modal-open');
});

adminLoginBtn.addEventListener('click', () => {
  if (adminUser.value === ADMIN_USER && adminPass.value === ADMIN_PASS) {
    adminLoginModal.classList.add('hidden');
    openAdminDashboard();
  } else {
    adminLoginErr.textContent = 'Invalid credentials.';
  }
});

adminPass.addEventListener('keydown', e => { if (e.key === 'Enter') adminLoginBtn.click(); });

function openAdminDashboard() {
  const total = alarms.length;
  const active = alarms.filter(a => a.enabled).length;
  adminStats.innerHTML = `
    <b>Total Alarms:</b> ${total}<br>
    <b>Active Alarms:</b> ${active}<br>
    <b>Inactive Alarms:</b> ${total - active}
  `;
  adminAlarmList.innerHTML = '';
  if (total === 0) {
    adminAlarmList.innerHTML = '<div class="empty-msg">No alarms.</div>';
  } else {
    alarms.forEach(alarm => {
      const item = document.createElement('div');
      item.className = 'admin-alarm-item';
      item.innerHTML = `
        <span><b>${alarm.time}</b> — ${alarm.label || 'Alarm'} [${alarm.enabled ? '✅ ON' : '❌ OFF'}]</span>
        <button data-id="${alarm.id}">Delete</button>
      `;
      item.querySelector('button').addEventListener('click', () => {
        if (confirm(`Delete alarm "${alarm.label || alarm.time}"?`)) {
          alarms = alarms.filter(a => a.id !== alarm.id);
          saveAlarms();
          renderAlarms();
          openAdminDashboard();
          showToast('Alarm deleted by admin.', 'error');
        }
      });
      adminAlarmList.appendChild(item);
    });
  }
  adminDashboardModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

adminResetBtn.addEventListener('click', () => {
  if (confirm('Reset ALL alarms? This cannot be undone.')) {
    alarms = [];
    saveAlarms();
    renderAlarms();
    openAdminDashboard();
    showToast('All alarms reset.', 'error');
  }
});

adminLogoutBtn.addEventListener('click', () => {
  adminDashboardModal.classList.add('hidden');
  document.body.classList.remove('modal-open');
  showToast('Logged out of admin panel.', '');
});

// ---- Toast ----
function showToast(msg, type = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ---- Startup ----
initDropdowns();
loadAlarms();
renderAlarms();
updateClock();
setInterval(updateClock, 1000);