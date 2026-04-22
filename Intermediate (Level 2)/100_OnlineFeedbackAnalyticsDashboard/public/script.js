let allFeedbacks = [];
let selectedRating = 0;

document.querySelectorAll('.star').forEach(s => {
  s.addEventListener('mouseenter', () => highlightStars(+s.dataset.v));
  s.addEventListener('mouseleave', () => highlightStars(selectedRating));
  s.addEventListener('click', () => { selectedRating = +s.dataset.v; document.getElementById('fb-rating').value = selectedRating; highlightStars(selectedRating); });
});

function highlightStars(n) {
  document.querySelectorAll('.star').forEach(s => s.classList.toggle('active', +s.dataset.v <= n));
}

function showSection(s) {
  ['feedback','login','dashboard'].forEach(x => document.getElementById(x+'-section').classList.add('hidden'));
  document.getElementById(s+'-section').classList.remove('hidden');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('nav-'+s)?.classList.add('active');
}

function showMsg(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'msg ' + type;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3000);
}

async function submitFeedback() {
  const name = document.getElementById('fb-name').value.trim();
  const email = document.getElementById('fb-email').value.trim();
  const category = document.getElementById('fb-category').value;
  const rating = document.getElementById('fb-rating').value;
  const comment = document.getElementById('fb-comment').value.trim();
  if (!name || !email || !category || rating === '0' || !comment) return showMsg('fb-msg','All fields are required.','error');
  const res = await fetch('/submit-feedback', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name,email,category,rating,comment}) });
  const data = await res.json();
  if (data.success) {
    showMsg('fb-msg','Feedback submitted successfully!','success');
    ['fb-name','fb-email','fb-comment'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('fb-category').value = '';
    document.getElementById('fb-rating').value = '0';
    selectedRating = 0;
    highlightStars(0);
  } else showMsg('fb-msg', data.error || 'Error submitting.','error');
}

async function adminLogin() {
  const username = document.getElementById('admin-user').value.trim();
  const password = document.getElementById('admin-pass').value.trim();
  if (!username || !password) return showMsg('login-msg','Enter credentials.','error');
  const res = await fetch('/admin-login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username,password}) });
  const data = await res.json();
  if (data.success) {
    document.getElementById('nav-login').classList.add('hidden');
    document.getElementById('nav-logout').classList.remove('hidden');
    showSection('dashboard');
    document.getElementById('nav-dashboard') && document.getElementById('nav-dashboard').classList.add('active');
    loadDashboard();
  } else showMsg('login-msg', data.error || 'Login failed.','error');
}

function logout() {
  document.getElementById('nav-login').classList.remove('hidden');
  document.getElementById('nav-logout').classList.add('hidden');
  showSection('feedback');
  document.getElementById('nav-feedback').classList.add('active');
}

async function loadDashboard() {
  const res = await fetch('/feedbacks');
  allFeedbacks = await res.json();
  renderStats(allFeedbacks);
  renderCharts(allFeedbacks);
  applyFilters();
}

function renderStats(data) {
  document.getElementById('stat-total').textContent = data.length;
  const avg = data.length ? (data.reduce((s,f) => s+f.rating,0)/data.length).toFixed(1) : '0';
  document.getElementById('stat-avg').textContent = avg;
  const cats = {};
  data.forEach(f => cats[f.category] = (cats[f.category]||0)+1);
  const top = Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('stat-top-cat').textContent = top ? top[0] : '—';
  const today = new Date().toDateString();
  document.getElementById('stat-today').textContent = data.filter(f => new Date(f.date).toDateString() === today).length;
}

function renderCharts(data) {
  const rDist = {1:0,2:0,3:0,4:0,5:0};
  data.forEach(f => rDist[f.rating]++);
  const rMax = Math.max(...Object.values(rDist),1);
  document.getElementById('rating-chart').innerHTML = [5,4,3,2,1].map(r =>
    `<div class="bar-row"><div class="bar-label">${'★'.repeat(r)}</div><div class="bar-track"><div class="bar-fill" style="width:${(rDist[r]/rMax)*100}%"></div></div><div class="bar-count">${rDist[r]}</div></div>`
  ).join('');
  const cats = {};
  data.forEach(f => cats[f.category] = (cats[f.category]||0)+1);
  const cMax = Math.max(...Object.values(cats),1);
  document.getElementById('cat-chart').innerHTML = Object.keys(cats).length
    ? Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([c,n]) =>
        `<div class="bar-row"><div class="bar-label" style="width:70px">${c}</div><div class="bar-track"><div class="bar-fill" style="width:${(n/cMax)*100}%"></div></div><div class="bar-count">${n}</div></div>`
      ).join('')
    : '<p style="color:var(--muted);font-size:.85rem">No data</p>';
}

function applyFilters() {
  const search = document.getElementById('search').value.toLowerCase();
  const cat = document.getElementById('filter-cat').value;
  const rating = document.getElementById('filter-rating').value;
  const filtered = allFeedbacks.filter(f =>
    (!search || f.name.toLowerCase().includes(search) || f.email.toLowerCase().includes(search)) &&
    (!cat || f.category === cat) &&
    (!rating || f.rating === +rating)
  );
  renderTable(filtered);
}

function renderTable(data) {
  const tbody = document.getElementById('fb-tbody');
  const noData = document.getElementById('no-data');
  if (!data.length) { tbody.innerHTML = ''; noData.classList.remove('hidden'); return; }
  noData.classList.add('hidden');
  tbody.innerHTML = data.map(f =>
    `<tr>
      <td>${esc(f.name)}</td>
      <td>${esc(f.email)}</td>
      <td><span class="badge">${esc(f.category)}</span></td>
      <td class="rating-stars">${'★'.repeat(f.rating)}${'☆'.repeat(5-f.rating)}</td>
      <td>${esc(f.comment)}</td>
      <td>${new Date(f.date).toLocaleDateString()}</td>
      <td><button class="btn-del" onclick="deleteFeedback(${f.id})">Delete</button></td>
    </tr>`
  ).join('');
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

async function deleteFeedback(id) {
  await fetch('/feedback/'+id, { method:'DELETE' });
  await loadDashboard();
}