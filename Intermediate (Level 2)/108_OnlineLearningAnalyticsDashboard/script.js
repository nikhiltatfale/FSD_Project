const ADMIN = { user: 'admin', pass: 'admin123' };
const COURSES = ['Web Development','Data Science','UI/UX Design','Machine Learning','Cybersecurity','Cloud Computing'];
const COLORS = ['#f5c542','#4ecdc4','#a29bfe','#fd79a8','#55efc4','#74b9ff'];

let students = [];
let editId = null;

function seed() {
  const names = ['Alex Morgan','Jamie Lee','Sam Patel','Chris Yoon','Taylor Brown','Riley Kim','Jordan Davis','Casey Wong','Morgan Hill','Drew Chen','Blake Torres','Quinn Adams'];
  const emails = ['alex','jamie','sam','chris','taylor','riley','jordan','casey','morgan','drew','blake','quinn'];
  return names.map((n,i) => ({
    id: Date.now()+i,
    name: n,
    email: emails[i]+'@student.edu',
    course: COURSES[i % COURSES.length],
    progress: Math.floor(Math.random()*101),
    score: Math.floor(Math.random()*41)+60
  }));
}

function getStatus(p) {
  if(p===100) return 'Completed';
  if(p===0) return 'Not Started';
  return 'In Progress';
}

function save() { localStorage.setItem('edu_students', JSON.stringify(students)); }
function load() {
  const d = localStorage.getItem('edu_students');
  students = d ? JSON.parse(d) : seed();
  if(!d) save();
}

function doLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value;
  const err = document.getElementById('login-error');
  if(u===ADMIN.user && p===ADMIN.pass) {
    localStorage.setItem('edu_session','1');
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    initApp();
  } else {
    err.textContent = 'Invalid credentials.';
  }
}

document.addEventListener('keydown', e => {
  if(e.key==='Enter' && !document.getElementById('login-screen').classList.contains('hidden')) doLogin();
});

function doLogout() {
  localStorage.removeItem('edu_session');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-user').value='';
  document.getElementById('login-pass').value='';
  document.getElementById('login-error').textContent='';
}

function initApp() {
  load();
  const d = new Date();
  document.getElementById('current-date').textContent = d.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  populateCourseFilter();
  renderDashboard();
  renderStudentTable();
  renderAnalytics();
}

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  document.querySelector('[data-page="'+page+'"]').classList.add('active');
  if(page==='analytics') renderAnalytics();
}

function renderDashboard() {
  const total = students.length;
  const courses = new Set(students.map(s=>s.course)).size;
  const avgComp = total ? Math.round(students.reduce((a,s)=>a+s.progress,0)/total) : 0;
  const avgScore = total ? Math.round(students.reduce((a,s)=>a+s.score,0)/total) : 0;

  document.getElementById('stat-students').textContent = total;
  document.getElementById('stat-courses').textContent = courses;
  document.getElementById('stat-completion').textContent = avgComp+'%';
  document.getElementById('stat-score').textContent = avgScore;

  const courseMap = {};
  students.forEach(s => {
    if(!courseMap[s.course]) courseMap[s.course]={total:0,sum:0};
    courseMap[s.course].total++;
    courseMap[s.course].sum+=s.progress;
  });
  let barsHtml = '';
  COURSES.forEach((c,i) => {
    if(!courseMap[c]) return;
    const avg = Math.round(courseMap[c].sum/courseMap[c].total);
    barsHtml += `<div class="course-bar-row"><div class="course-bar-label"><span>${c}</span><span>${avg}%</span></div><div class="bar-track"><div class="bar-fill" style="width:${avg}%;background:${COLORS[i]}"></div></div></div>`;
  });
  document.getElementById('course-bars').innerHTML = barsHtml || '<span style="color:var(--text2);font-size:13px">No data</span>';

  const done = students.filter(s=>s.progress===100).length;
  const prog = students.filter(s=>s.progress>0&&s.progress<100).length;
  const none = students.filter(s=>s.progress===0).length;
  const statuses = [{label:'Completed',count:done,color:'#4ecdc4'},{label:'In Progress',count:prog,color:'#f5c542'},{label:'Not Started',count:none,color:'#7a8399'}];
  let sHtml = '<div class="status-rows">';
  statuses.forEach(st => {
    const pct = total ? Math.round(st.count/total*100) : 0;
    sHtml += `<div class="status-row"><div class="status-dot" style="background:${st.color}"></div><div class="status-info"><div class="status-name">${st.label}</div><div class="status-count">${st.count} student${st.count!==1?'s':''}</div></div><div class="status-pct">${pct}%</div></div>`;
  });
  sHtml += '</div>';
  document.getElementById('status-chart').innerHTML = sHtml;

  const recent = [...students].slice(-5).reverse();
  let rHtml = '';
  recent.forEach(s => {
    const st = getStatus(s.progress);
    rHtml += `<tr><td>${s.name}</td><td>${s.course}</td><td><div class="progress-cell"><div class="mini-bar"><div class="mini-fill" style="width:${s.progress}%"></div></div><span class="pct-text">${s.progress}%</span></div></td><td>${badgeHtml(st)}</td></tr>`;
  });
  document.getElementById('recent-tbody').innerHTML = rHtml || '<tr><td colspan="4" style="text-align:center;color:var(--text2);padding:20px">No students</td></tr>';
}

function badgeHtml(st) {
  const cls = st==='Completed'?'badge-done':st==='In Progress'?'badge-prog':'badge-none';
  return `<span class="badge ${cls}">${st}</span>`;
}

function populateCourseFilter() {
  const sel = document.getElementById('filter-course');
  sel.innerHTML = '<option value="">All Courses</option>';
  COURSES.forEach(c => { sel.innerHTML += `<option value="${c}">${c}</option>`; });
}

function renderStudentTable() {
  const q = document.getElementById('search-input').value.toLowerCase();
  const fc = document.getElementById('filter-course').value;
  const fs = document.getElementById('filter-status').value;
  let filtered = students.filter(s => {
    const matchQ = s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    const matchC = !fc || s.course===fc;
    const matchS = !fs || getStatus(s.progress)===fs;
    return matchQ && matchC && matchS;
  });
  let html = '';
  filtered.forEach(s => {
    const st = getStatus(s.progress);
    html += `<tr>
      <td>${s.name}</td>
      <td style="font-family:var(--mono);font-size:12px;color:var(--text2)">${s.email}</td>
      <td>${s.course}</td>
      <td><div class="progress-cell"><div class="mini-bar"><div class="mini-fill" style="width:${s.progress}%"></div></div><span class="pct-text">${s.progress}%</span></div></td>
      <td style="font-family:var(--mono)">${s.score}</td>
      <td>${badgeHtml(st)}</td>
      <td>
        <button class="action-btn edit-btn" onclick="openModal(${s.id})">Edit</button>
        <button class="action-btn del-btn" onclick="deleteStudent(${s.id})">Del</button>
      </td>
    </tr>`;
  });
  document.getElementById('students-tbody').innerHTML = html || '<tr><td colspan="7" style="text-align:center;color:var(--text2);padding:24px">No students found</td></tr>';
}

function openModal(id) {
  editId = id || null;
  document.getElementById('modal-error').textContent = '';
  if(id) {
    const s = students.find(x=>x.id===id);
    document.getElementById('modal-title').textContent = 'Edit Student';
    document.getElementById('f-name').value = s.name;
    document.getElementById('f-email').value = s.email;
    document.getElementById('f-course').value = s.course;
    document.getElementById('f-progress').value = s.progress;
    document.getElementById('f-score').value = s.score;
  } else {
    document.getElementById('modal-title').textContent = 'Add Student';
    document.getElementById('f-name').value='';
    document.getElementById('f-email').value='';
    document.getElementById('f-course').value=COURSES[0];
    document.getElementById('f-progress').value='';
    document.getElementById('f-score').value='';
  }
  document.getElementById('modal').classList.remove('hidden');
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function closeModalOutside(e) { if(e.target.id==='modal') closeModal(); }

function saveStudent() {
  const name = document.getElementById('f-name').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const course = document.getElementById('f-course').value;
  const progress = parseInt(document.getElementById('f-progress').value);
  const score = parseInt(document.getElementById('f-score').value);
  const err = document.getElementById('modal-error');

  if(!name || !email) { err.textContent='Name and email are required.'; return; }
  if(isNaN(progress)||progress<0||progress>100) { err.textContent='Progress must be 0–100.'; return; }
  if(isNaN(score)||score<0||score>100) { err.textContent='Score must be 0–100.'; return; }

  if(editId) {
    const idx = students.findIndex(x=>x.id===editId);
    students[idx] = {...students[idx], name, email, course, progress, score};
  } else {
    students.push({id:Date.now(), name, email, course, progress, score});
  }
  save();
  closeModal();
  renderDashboard();
  renderStudentTable();
  if(document.getElementById('page-analytics').classList.contains('active')) renderAnalytics();
}

function deleteStudent(id) {
  if(!confirm('Delete this student?')) return;
  students = students.filter(s=>s.id!==id);
  save();
  renderDashboard();
  renderStudentTable();
}

function renderAnalytics() {
  drawBar('progress-canvas', 'Progress Distribution', getBuckets(students.map(s=>s.progress),[0,25,50,75,100],['0–24%','25–49%','50–74%','75–99%','100%']), COLORS);
  drawBar('score-canvas', 'Score Distribution', getBuckets(students.map(s=>s.score),[0,60,70,80,90,100],['<60','60s','70s','80s','90+'],true), COLORS.slice(2));

  const courseMap = {};
  students.forEach(s => {
    if(!courseMap[s.course]) courseMap[s.course]={count:0,pSum:0,sSum:0};
    courseMap[s.course].count++;
    courseMap[s.course].pSum+=s.progress;
    courseMap[s.course].sSum+=s.score;
  });
  let html = '';
  COURSES.forEach((c,i) => {
    if(!courseMap[c]) return;
    const d = courseMap[c];
    const avgP = Math.round(d.pSum/d.count);
    const avgS = Math.round(d.sSum/d.count);
    html += `<div class="breakdown-row">
      <div><div class="breakdown-name">${c}</div><div class="breakdown-stats">${d.count} student${d.count!==1?'s':''} · ${avgP}% avg progress</div></div>
      <div class="bar-track"><div class="bar-fill" style="width:${avgP}%;background:${COLORS[i]}"></div></div>
      <div class="breakdown-score" style="color:${COLORS[i]}">${avgS}</div>
    </div>`;
  });
  document.getElementById('course-breakdown').innerHTML = html || '<span style="color:var(--text2);font-size:13px">No data</span>';
}

function getBuckets(vals, edges, labels, strict) {
  const counts = new Array(labels.length).fill(0);
  vals.forEach(v => {
    for(let i=0;i<edges.length-1;i++) {
      if(v>=edges[i] && (strict ? v<edges[i+1] : v<=edges[i+1])) { counts[i]++; break; }
      if(i===edges.length-2) counts[i]++;
    }
  });
  return {labels, counts};
}

function drawBar(id, title, data, colors) {
  const canvas = document.getElementById(id);
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = {t:16,r:16,b:40,l:36};
  const max = Math.max(...data.counts, 1);
  const bw = Math.floor((W-pad.l-pad.r)/data.labels.length);
  const gap = Math.floor(bw*0.2);
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#161b24';
  ctx.fillRect(0,0,W,H);
  const gridLines = 4;
  for(let i=0;i<=gridLines;i++) {
    const y = pad.t + (H-pad.t-pad.b)/gridLines*i;
    ctx.strokeStyle='#252d3d'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(W-pad.r,y); ctx.stroke();
    const val = Math.round(max*(1-i/gridLines));
    ctx.fillStyle='#7a8399'; ctx.font='10px DM Mono,monospace'; ctx.textAlign='right';
    ctx.fillText(val, pad.l-4, y+4);
  }
  data.labels.forEach((lbl,i) => {
    const x = pad.l + i*bw + gap/2;
    const barH = data.counts[i]/max * (H-pad.t-pad.b);
    const y = H - pad.b - barH;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.roundRect(x, y, bw-gap, barH, [4,4,0,0]);
    ctx.fill();
    ctx.fillStyle='#7a8399'; ctx.font='10px DM Mono,monospace'; ctx.textAlign='center';
    ctx.fillText(lbl, x+(bw-gap)/2, H-pad.b+14);
    if(data.counts[i]>0) {
      ctx.fillStyle='#e8eaf0'; ctx.font='bold 11px Syne,sans-serif'; ctx.textAlign='center';
      ctx.fillText(data.counts[i], x+(bw-gap)/2, y-5);
    }
  });
}

(function() {
  if(localStorage.getItem('edu_session')==='1') {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    initApp();
  }
})();