// ============================================================
// STORAGE HELPERS
// ============================================================
const DB = {
  get: k => JSON.parse(localStorage.getItem(k) || '[]'),
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  getObj: k => JSON.parse(localStorage.getItem(k) || 'null'),
  setObj: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

// ============================================================
// SEED DEFAULT DATA
// ============================================================
function seedData() {
  if (!localStorage.getItem('seeded')) {
    DB.set('clubs', [
      { id: 'c1', name: 'Tech Club', desc: 'Explore the world of technology, coding, and innovation.', img: 'https://via.placeholder.com/400x150?text=Tech+Club', category: 'Technical' },
      { id: 'c2', name: 'Cultural Club', desc: 'Celebrate art, music, dance, and heritage events.', img: 'https://via.placeholder.com/400x150?text=Cultural+Club', category: 'Cultural' },
      { id: 'c3', name: 'Sports Club', desc: 'Join teams and participate in inter-college tournaments.', img: 'https://via.placeholder.com/400x150?text=Sports+Club', category: 'Sports' },
      { id: 'c4', name: 'Robotics Club', desc: 'Build robots, automate things, and compete in national fests.', img: 'https://via.placeholder.com/400x150?text=Robotics+Club', category: 'Technical' },
    ]);
    DB.set('events', [
      { id: 'e1', name: 'Hackathon 2025', desc: '24-hour coding challenge for all branches.', date: '2025-09-15', time: '09:00', club: 'Tech Club' },
      { id: 'e2', name: 'Annual Cultural Fest', desc: 'Dance, music, drama, and much more!', date: '2025-10-05', time: '11:00', club: 'Cultural Club' },
      { id: 'e3', name: 'Football Tournament', desc: 'Inter-college football championship.', date: '2025-09-25', time: '08:00', club: 'Sports Club' },
    ]);
    DB.set('announcements', [
      { id: 'a1', title: 'Welcome to New Academic Year!', body: 'All clubs are open for registration. Join now!', date: new Date().toLocaleDateString() },
      { id: 'a2', title: 'Club Registration Deadline', body: 'Last date to register for clubs is 31st August.', date: new Date().toLocaleDateString() },
    ]);
    DB.set('students', []);
    DB.set('memberships', []);
    DB.set('eventRegs', []);
    localStorage.setItem('seeded', '1');
  }
}

// ============================================================
// NAVIGATION
// ============================================================
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');

  if (id === 'clubs') renderClubs();
  if (id === 'events') renderEvents();
  if (id === 'announcements') renderAnnouncements();
  if (id === 'dashboard') renderDashboard();
  if (id === 'adminDash') { showAdminTab('aClubs'); renderAdminAll(); }

  // Close mobile menu
  document.getElementById('navLinks').classList.remove('open');
  window.scrollTo(0, 0);
}

// ============================================================
// ALERT
// ============================================================
function showAlert(msg, type = 'success') {
  const box = document.getElementById('alertBox');
  box.textContent = msg;
  box.className = 'alert ' + type;
  box.style.display = 'block';
  setTimeout(() => { box.style.display = 'none'; }, 3000);
}

// ============================================================
// MODALS
// ============================================================
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

window.addEventListener('click', e => {
  document.querySelectorAll('.modal').forEach(m => {
    if (e.target === m) m.style.display = 'none';
  });
});

// ============================================================
// AUTH TAB SWITCH
// ============================================================
function switchTab(tab) {
  document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('tabLogin').classList.toggle('active-tab', tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active-tab', tab === 'register');
}

// ============================================================
// STUDENT REGISTER
// ============================================================
function studentRegister() {
  const name = document.getElementById('regName').value.trim();
  const roll = document.getElementById('regRoll').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPassword').value;

  if (!name || !roll || !email || !pass) return showAlert('All fields required.', 'error');
  if (!/\S+@\S+\.\S+/.test(email)) return showAlert('Invalid email.', 'error');
  if (pass.length < 6) return showAlert('Password min 6 chars.', 'error');

  const students = DB.get('students');
  if (students.find(s => s.email === email)) return showAlert('Email already registered.', 'error');

  const student = { id: 's' + Date.now(), name, roll, email, pass };
  students.push(student);
  DB.set('students', students);
  showAlert('Registration successful! Please login.');
  switchTab('login');
  ['regName','regRoll','regEmail','regPassword'].forEach(id => document.getElementById(id).value = '');
}

// ============================================================
// STUDENT LOGIN
// ============================================================
function studentLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  if (!email || !pass) return showAlert('Enter email and password.', 'error');

  const students = DB.get('students');
  const student = students.find(s => s.email === email && s.pass === pass);
  if (!student) return showAlert('Invalid credentials.', 'error');

  DB.setObj('currentStudent', student);
  updateNavForStudent(student);
  showAlert(`Welcome, ${student.name}!`);
  showSection('dashboard');
}

function logoutStudent() {
  localStorage.removeItem('currentStudent');
  updateNavForStudent(null);
  showSection('home');
  showAlert('Logged out successfully.');
}

function updateNavForStudent(student) {
  document.getElementById('navLogin').style.display = student ? 'none' : 'list-item';
  document.getElementById('navDashboard').style.display = student ? 'list-item' : 'none';
  document.getElementById('navLogout').style.display = student ? 'list-item' : 'none';
}

// ============================================================
// ADMIN LOGIN / LOGOUT
// ============================================================
function adminLogin() {
  const u = document.getElementById('adminUser').value;
  const p = document.getElementById('adminPass').value;
  if (u === 'admin' && p === 'admin123') {
    localStorage.setItem('adminLoggedIn', '1');
    showSection('adminDash');
    showAlert('Admin logged in.');
  } else {
    showAlert('Invalid admin credentials.', 'error');
  }
}

function adminLogout() {
  localStorage.removeItem('adminLoggedIn');
  showSection('home');
  showAlert('Admin logged out.');
}

// ============================================================
// CLUBS - RENDER
// ============================================================
function renderClubs() {
  const clubs = DB.get('clubs');
  const query = (document.getElementById('clubSearch').value || '').toLowerCase();
  const student = DB.getObj('currentStudent');
  const memberships = DB.get('memberships');

  const filtered = clubs.filter(c =>
    c.name.toLowerCase().includes(query) || c.category.toLowerCase().includes(query) || c.desc.toLowerCase().includes(query)
  );

  const container = document.getElementById('clubsContainer');
  if (!filtered.length) { container.innerHTML = '<p>No clubs found.</p>'; return; }

  container.innerHTML = filtered.map(c => {
    const joined = student && memberships.find(m => m.studentId === student.id && m.clubId === c.id);
    return `<div class="card">
      <img src="${c.img || 'https://via.placeholder.com/400x150?text=' + encodeURIComponent(c.name)}" alt="${c.name}" onerror="this.src='https://via.placeholder.com/400x150?text=Club'"/>
      <h3>${c.name}</h3>
      <p>${c.desc}</p>
      <p class="meta">Category: ${c.category}</p>
      ${student
        ? joined
          ? `<button class="secondary" onclick="leaveClub('${c.id}')">Leave Club</button>`
          : `<button onclick="joinClub('${c.id}')">Join Club</button>`
        : `<button onclick="showSection('auth')">Login to Join</button>`}
    </div>`;
  }).join('');
}

function joinClub(clubId) {
  const student = DB.getObj('currentStudent');
  if (!student) return showAlert('Please login first.', 'error');
  const memberships = DB.get('memberships');
  if (memberships.find(m => m.studentId === student.id && m.clubId === clubId)) return showAlert('Already joined.', 'error');
  memberships.push({ studentId: student.id, clubId, date: new Date().toLocaleDateString() });
  DB.set('memberships', memberships);
  showAlert('Successfully joined the club!');
  renderClubs();
}

function leaveClub(clubId) {
  if (!confirm('Leave this club?')) return;
  const student = DB.getObj('currentStudent');
  let memberships = DB.get('memberships');
  memberships = memberships.filter(m => !(m.studentId === student.id && m.clubId === clubId));
  DB.set('memberships', memberships);
  showAlert('Left the club.');
  renderClubs();
}

// ============================================================
// EVENTS - RENDER
// ============================================================
function renderEvents() {
  const events = DB.get('events');
  const query = (document.getElementById('eventSearch').value || '').toLowerCase();
  const student = DB.getObj('currentStudent');
  const eventRegs = DB.get('eventRegs');

  const filtered = events.filter(e =>
    e.name.toLowerCase().includes(query) || e.club.toLowerCase().includes(query) || e.desc.toLowerCase().includes(query)
  );

  const container = document.getElementById('eventsContainer');
  if (!filtered.length) { container.innerHTML = '<p>No events found.</p>'; return; }

  container.innerHTML = filtered.map(e => {
    const registered = student && eventRegs.find(r => r.studentId === student.id && r.eventId === e.id);
    return `<div class="card">
      <h3>${e.name}</h3>
      <p>${e.desc}</p>
      <p class="meta">📅 ${e.date} | ⏰ ${e.time} | 🏷️ ${e.club}</p>
      ${student
        ? registered
          ? `<button class="secondary" onclick="unregisterEvent('${e.id}')">Unregister</button>`
          : `<button onclick="registerEvent('${e.id}')">Register</button>`
        : `<button onclick="showSection('auth')">Login to Register</button>`}
    </div>`;
  }).join('');
}

function registerEvent(eventId) {
  const student = DB.getObj('currentStudent');
  if (!student) return showAlert('Please login first.', 'error');
  const eventRegs = DB.get('eventRegs');
  if (eventRegs.find(r => r.studentId === student.id && r.eventId === eventId)) return showAlert('Already registered.', 'error');
  eventRegs.push({ studentId: student.id, eventId, date: new Date().toLocaleDateString() });
  DB.set('eventRegs', eventRegs);
  showAlert('Registered for event!');
  renderEvents();
}

function unregisterEvent(eventId) {
  if (!confirm('Unregister from this event?')) return;
  const student = DB.getObj('currentStudent');
  let eventRegs = DB.get('eventRegs');
  eventRegs = eventRegs.filter(r => !(r.studentId === student.id && r.eventId === eventId));
  DB.set('eventRegs', eventRegs);
  showAlert('Unregistered from event.');
  renderEvents();
}

// ============================================================
// ANNOUNCEMENTS - RENDER
// ============================================================
function renderAnnouncements() {
  const announcements = DB.get('announcements');
  const container = document.getElementById('announcementsContainer');
  if (!announcements.length) { container.innerHTML = '<p>No announcements.</p>'; return; }
  container.innerHTML = announcements.slice().reverse().map(a =>
    `<div class="ann-item">
      <h4>${a.title}</h4>
      <div class="meta">${a.date}</div>
      <p>${a.body}</p>
    </div>`
  ).join('');
}

// ============================================================
// STUDENT DASHBOARD
// ============================================================
function renderDashboard() {
  const student = DB.getObj('currentStudent');
  if (!student) { showSection('auth'); return; }

  document.getElementById('dashName').textContent = student.name + ' (' + student.roll + ')';

  const memberships = DB.get('memberships');
  const clubs = DB.get('clubs');
  const eventRegs = DB.get('eventRegs');
  const events = DB.get('events');

  const myClubIds = memberships.filter(m => m.studentId === student.id).map(m => m.clubId);
  const myEventIds = eventRegs.filter(r => r.studentId === student.id).map(r => r.eventId);

  const myClubs = clubs.filter(c => myClubIds.includes(c.id));
  const myEvents = events.filter(e => myEventIds.includes(e.id));

  document.getElementById('myClubs').innerHTML = myClubs.length
    ? myClubs.map(c => `<div class="card"><h3>${c.name}</h3><p>${c.desc}</p><p class="meta">${c.category}</p><button class="secondary" onclick="leaveClub('${c.id}');renderDashboard()">Leave</button></div>`).join('')
    : '<p>You have not joined any clubs yet.</p>';

  document.getElementById('myEvents').innerHTML = myEvents.length
    ? myEvents.map(e => `<div class="card"><h3>${e.name}</h3><p>${e.desc}</p><p class="meta">📅 ${e.date} | ⏰ ${e.time}</p><button class="secondary" onclick="unregisterEvent('${e.id}');renderDashboard()">Unregister</button></div>`).join('')
    : '<p>You have not registered for any events yet.</p>';
}

// ============================================================
// ADMIN TAB SWITCH
// ============================================================
function showAdminTab(tabId) {
  document.querySelectorAll('.admin-tab-content').forEach(t => t.style.display = 'none');
  document.getElementById(tabId).style.display = 'block';
}

// ============================================================
// ADMIN: RENDER ALL
// ============================================================
function renderAdminAll() {
  renderAdminClubs();
  renderAdminEvents();
  renderAdminAnnouncements();
  renderAdminStudents();
}

// ============================================================
// ADMIN: CLUBS
// ============================================================
function renderAdminClubs() {
  const clubs = DB.get('clubs');
  const memberships = DB.get('memberships');
  document.getElementById('adminClubsList').innerHTML = clubs.length
    ? clubs.map(c => `
      <div class="admin-row">
        <div class="info"><strong>${c.name}</strong> <em>(${c.category})</em><br/><small>${c.desc}</small></div>
        <div class="actions">
          <button class="view" onclick="viewMembers('${c.id}')">Members (${memberships.filter(m=>m.clubId===c.id).length})</button>
          <button class="edit" onclick="editClub('${c.id}')">Edit</button>
          <button class="danger" onclick="deleteClub('${c.id}')">Delete</button>
        </div>
      </div>`).join('')
    : '<p>No clubs.</p>';
}

function openClubModal(resetId = '') {
  document.getElementById('clubModalTitle').textContent = resetId ? 'Edit Club' : 'Add Club';
  document.getElementById('clubEditId').value = resetId;
  openModal('clubModal');
}

function editClub(id) {
  const club = DB.get('clubs').find(c => c.id === id);
  if (!club) return;
  document.getElementById('clubName').value = club.name;
  document.getElementById('clubDesc').value = club.desc;
  document.getElementById('clubImg').value = club.img || '';
  document.getElementById('clubCategory').value = club.category;
  document.getElementById('clubEditId').value = id;
  document.getElementById('clubModalTitle').textContent = 'Edit Club';
  openModal('clubModal');
}

function saveClub() {
  const name = document.getElementById('clubName').value.trim();
  const desc = document.getElementById('clubDesc').value.trim();
  const img = document.getElementById('clubImg').value.trim();
  const category = document.getElementById('clubCategory').value.trim();
  const editId = document.getElementById('clubEditId').value;

  if (!name || !desc || !category) return showAlert('Name, description, and category are required.', 'error');

  const clubs = DB.get('clubs');
  if (editId) {
    const idx = clubs.findIndex(c => c.id === editId);
    if (idx !== -1) clubs[idx] = { ...clubs[idx], name, desc, img, category };
  } else {
    clubs.push({ id: 'c' + Date.now(), name, desc, img, category });
  }
  DB.set('clubs', clubs);
  closeModal('clubModal');
  showAlert(editId ? 'Club updated.' : 'Club added.');
  renderAdminClubs();
  ['clubName','clubDesc','clubImg','clubCategory'].forEach(i => document.getElementById(i).value = '');
  document.getElementById('clubEditId').value = '';
}

function deleteClub(id) {
  if (!confirm('Delete this club? All memberships will be removed.')) return;
  DB.set('clubs', DB.get('clubs').filter(c => c.id !== id));
  DB.set('memberships', DB.get('memberships').filter(m => m.clubId !== id));
  showAlert('Club deleted.');
  renderAdminClubs();
}

function viewMembers(clubId) {
  const memberships = DB.get('memberships').filter(m => m.clubId === clubId);
  const students = DB.get('students');
  const list = document.getElementById('membersList');

  if (!memberships.length) {
    list.innerHTML = '<p>No members yet.</p>';
  } else {
    list.innerHTML = memberships.map(m => {
      const s = students.find(st => st.id === m.studentId);
      return s ? `<div class="admin-row">
        <div class="info"><strong>${s.name}</strong> | Roll: ${s.roll} | ${s.email}<br/><small>Joined: ${m.date}</small></div>
        <div class="actions"><button class="danger" onclick="removeMember('${s.id}','${clubId}')">Remove</button></div>
      </div>` : '';
    }).join('');
  }
  openModal('membersModal');
}

function removeMember(studentId, clubId) {
  if (!confirm('Remove this member?')) return;
  DB.set('memberships', DB.get('memberships').filter(m => !(m.studentId === studentId && m.clubId === clubId)));
  showAlert('Member removed.');
  viewMembers(clubId);
  renderAdminClubs();
}

// ============================================================
// ADMIN: EVENTS
// ============================================================
function renderAdminEvents() {
  const events = DB.get('events');
  const eventRegs = DB.get('eventRegs');
  document.getElementById('adminEventsList').innerHTML = events.length
    ? events.map(e => `
      <div class="admin-row">
        <div class="info"><strong>${e.name}</strong> | ${e.date} ${e.time} | ${e.club}<br/><small>${e.desc}</small><br/><small>Registrations: ${eventRegs.filter(r=>r.eventId===e.id).length}</small></div>
        <div class="actions">
          <button class="edit" onclick="editEvent('${e.id}')">Edit</button>
          <button class="danger" onclick="deleteEvent('${e.id}')">Delete</button>
        </div>
      </div>`).join('')
    : '<p>No events.</p>';
}

function editEvent(id) {
  const ev = DB.get('events').find(e => e.id === id);
  if (!ev) return;
  document.getElementById('eventName').value = ev.name;
  document.getElementById('eventDesc').value = ev.desc;
  document.getElementById('eventDate').value = ev.date;
  document.getElementById('eventTime').value = ev.time;
  document.getElementById('eventClub').value = ev.club;
  document.getElementById('eventEditId').value = id;
  document.getElementById('eventModalTitle').textContent = 'Edit Event';
  openModal('eventModal');
}

function saveEvent() {
  const name = document.getElementById('eventName').value.trim();
  const desc = document.getElementById('eventDesc').value.trim();
  const date = document.getElementById('eventDate').value;
  const time = document.getElementById('eventTime').value;
  const club = document.getElementById('eventClub').value.trim();
  const editId = document.getElementById('eventEditId').value;

  if (!name || !desc || !date || !time || !club) return showAlert('All fields required.', 'error');

  const events = DB.get('events');
  if (editId) {
    const idx = events.findIndex(e => e.id === editId);
    if (idx !== -1) events[idx] = { ...events[idx], name, desc, date, time, club };
  } else {
    events.push({ id: 'e' + Date.now(), name, desc, date, time, club });
  }
  DB.set('events', events);
  closeModal('eventModal');
  showAlert(editId ? 'Event updated.' : 'Event added.');
  renderAdminEvents();
  ['eventName','eventDesc','eventDate','eventTime','eventClub'].forEach(i => document.getElementById(i).value = '');
  document.getElementById('eventEditId').value = '';
  document.getElementById('eventModalTitle').textContent = 'Add Event';
}

function deleteEvent(id) {
  if (!confirm('Delete this event?')) return;
  DB.set('events', DB.get('events').filter(e => e.id !== id));
  DB.set('eventRegs', DB.get('eventRegs').filter(r => r.eventId !== id));
  showAlert('Event deleted.');
  renderAdminEvents();
}

// ============================================================
// ADMIN: ANNOUNCEMENTS
// ============================================================
function renderAdminAnnouncements() {
  const anns = DB.get('announcements');
  document.getElementById('adminAnnList').innerHTML = anns.length
    ? anns.slice().reverse().map(a => `
      <div class="admin-row">
        <div class="info"><strong>${a.title}</strong><br/><small>${a.date}</small><br/>${a.body}</div>
        <div class="actions"><button class="danger" onclick="deleteAnnouncement('${a.id}')">Delete</button></div>
      </div>`).join('')
    : '<p>No announcements.</p>';
}

function saveAnnouncement() {
  const title = document.getElementById('annTitle').value.trim();
  const body = document.getElementById('annBody').value.trim();
  if (!title || !body) return showAlert('Title and body required.', 'error');

  const anns = DB.get('announcements');
  anns.push({ id: 'a' + Date.now(), title, body, date: new Date().toLocaleDateString() });
  DB.set('announcements', anns);
  closeModal('annModal');
  showAlert('Announcement posted.');
  renderAdminAnnouncements();
  document.getElementById('annTitle').value = '';
  document.getElementById('annBody').value = '';
}

function deleteAnnouncement(id) {
  if (!confirm('Delete this announcement?')) return;
  DB.set('announcements', DB.get('announcements').filter(a => a.id !== id));
  showAlert('Announcement deleted.');
  renderAdminAnnouncements();
}

// ============================================================
// ADMIN: STUDENTS
// ============================================================
function renderAdminStudents() {
  const students = DB.get('students');
  const memberships = DB.get('memberships');
  const eventRegs = DB.get('eventRegs');

  document.getElementById('adminStudentsList').innerHTML = students.length
    ? students.map(s => `
      <div class="admin-row">
        <div class="info">
          <strong>${s.name}</strong> | Roll: ${s.roll} | ${s.email}<br/>
          <small>Clubs joined: ${memberships.filter(m=>m.studentId===s.id).length} | Events registered: ${eventRegs.filter(r=>r.studentId===s.id).length}</small>
        </div>
        <div class="actions">
          <button class="danger" onclick="deleteStudent('${s.id}')">Remove</button>
        </div>
      </div>`).join('')
    : '<p>No students registered yet.</p>';
}

function deleteStudent(id) {
  if (!confirm('Remove this student and all their memberships/registrations?')) return;
  DB.set('students', DB.get('students').filter(s => s.id !== id));
  DB.set('memberships', DB.get('memberships').filter(m => m.studentId !== id));
  DB.set('eventRegs', DB.get('eventRegs').filter(r => r.studentId !== id));
  // If current student is deleted
  const current = DB.getObj('currentStudent');
  if (current && current.id === id) {
    localStorage.removeItem('currentStudent');
    updateNavForStudent(null);
  }
  showAlert('Student removed.');
  renderAdminStudents();
}

// ============================================================
// HAMBURGER MENU
// ============================================================
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('open');
});

// ============================================================
// INIT
// ============================================================
function init() {
  seedData();
  const student = DB.getObj('currentStudent');
  if (student) updateNavForStudent(student);
  showSection('home');
}

init();