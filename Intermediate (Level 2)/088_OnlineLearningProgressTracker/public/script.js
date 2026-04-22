let token=null,logoClicks=0,timerInterval=null,timerStart=null,dashData=null;
const api=async(url,method='GET',body=null,extra={})=>{
const h={'Content-Type':'application/json',...extra};
if(token)h['x-token']=token;
const r=await fetch(url,{method,headers:h,body:body?JSON.stringify(body):null});
return r.json();
};
document.getElementById('logo').addEventListener('click',()=>{
logoClicks++;
if(logoClicks>=5){logoClicks=0;document.getElementById('admin-modal').classList.remove('hidden');}
setTimeout(()=>{if(logoClicks<5)logoClicks=0;},2000);
});
function switchTab(t){
document.getElementById('login-form').classList.toggle('hidden',t!=='login');
document.getElementById('register-form').classList.toggle('hidden',t!=='register');
document.querySelectorAll('.tabs .tab').forEach((b,i)=>b.classList.toggle('active',(t==='login'&&i===0)||(t==='register'&&i===1)));
}
async function login(){
const email=document.getElementById('l-email').value.trim();
const password=document.getElementById('l-pass').value;
const r=await api('/api/login','POST',{email,password});
if(r.error)return showErr('login-err',r.error);
token=r.token;
document.getElementById('nav-name').textContent=r.name;
document.getElementById('nav-user').classList.remove('hidden');
document.getElementById('auth-section').classList.add('hidden');
document.getElementById('dashboard-section').classList.remove('hidden');
loadDashboard();
}
async function register(){
const name=document.getElementById('r-name').value.trim();
const email=document.getElementById('r-email').value.trim();
const password=document.getElementById('r-pass').value;
const r=await api('/api/register','POST',{name,email,password});
if(r.error)return showErr('register-err',r.error);
showErr('register-err','Registered! Please login.',true);
switchTab('login');
}
async function logout(){
await api('/api/logout','POST');
token=null;
if(timerInterval){clearInterval(timerInterval);timerInterval=null;}
document.getElementById('auth-section').classList.remove('hidden');
document.getElementById('dashboard-section').classList.add('hidden');
document.getElementById('nav-user').classList.add('hidden');
}
function showErr(id,msg,success=false){
const el=document.getElementById(id);
el.innerHTML=`<div class="${success?'success-msg':'error'}">${msg}</div>`;
}
function fmtTime(s){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return h?`${h}h ${m}m`:`${m}m ${sec}s`;}
async function loadDashboard(){
dashData=await api('/api/dashboard');
const sg=document.getElementById('stats-grid');
sg.innerHTML=`
<div class="stat-box"><h3>${dashData.courses.length}</h3><p>Courses</p></div>
<div class="stat-box"><h3>${dashData.completedTopics}</h3><p>Topics Done</p></div>
<div class="stat-box"><h3>${dashData.progress}%</h3><p>Progress</p></div>
<div class="stat-box"><h3>${fmtTime(dashData.totalTime)}</h3><p>Time Spent</p></div>`;
document.getElementById('overall-progress').style.width=dashData.progress+'%';
document.getElementById('overall-pct').textContent=dashData.progress+'% completed';
const sel=document.getElementById('timer-course');
sel.innerHTML='<option value="">No course</option>'+dashData.courses.map(c=>`<option value="${c.id}">${c.courseName}</option>`).join('');
renderCourses();
}
function renderCourses(){
if(!dashData)return;
const el=document.getElementById('courses-list');
if(!dashData.courses.length){el.innerHTML='<div class="card" style="text-align:center;color:#999">No courses yet. Add one above!</div>';return;}
el.innerHTML=dashData.courses.map(c=>{
const pct=Math.round(c.completedTopics/c.totalTopics*100);
const topics=Array.from({length:c.totalTopics},(_,i)=>`<button class="topic-btn ${c.topics[i]?'done':''}" onclick="markTopic(${c.id},${i})" ${c.topics[i]?'disabled':''}>Topic ${i+1}</button>`).join('');
return `<div class="course-card">
<div class="course-header">
<h3>${c.courseName}</h3>
<button class="btn-danger btn-sm" onclick="deleteCourse(${c.id})">Delete</button>
</div>
<div style="font-size:.8rem;color:#777;margin-bottom:6px">${c.completedTopics}/${c.totalTopics} topics · ${fmtTime(c.timeSpent)} studied</div>
<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
<div class="topics-grid">${topics}</div>
</div>`;
}).join('');
}
function showView(v){
document.getElementById('view-home').classList.toggle('hidden',v!=='home');
document.getElementById('view-courses').classList.toggle('hidden',v!=='courses');
document.querySelectorAll('#main-tabs .tab').forEach((b,i)=>b.classList.toggle('active',(v==='home'&&i===0)||(v==='courses'&&i===1)));
}
async function addCourse(){
const courseName=document.getElementById('new-course-name').value.trim();
const totalTopics=parseInt(document.getElementById('new-course-topics').value);
const r=await api('/api/add-course','POST',{courseName,totalTopics});
if(r.error)return showErr('course-err',r.error);
document.getElementById('new-course-name').value='';
document.getElementById('new-course-topics').value='';
document.getElementById('course-err').innerHTML='';
loadDashboard();
}
async function markTopic(courseId,topicIndex){
const r=await api('/api/mark-topic','POST',{courseId,topicIndex});
if(!r.error)loadDashboard();
}
async function deleteCourse(courseId){
if(!confirm('Delete this course?'))return;
await api('/api/delete-course','DELETE',{courseId});
loadDashboard();
}
function startTimer(){
if(timerInterval)return;
timerStart=Date.now();
timerInterval=setInterval(()=>{
const s=Math.floor((Date.now()-timerStart)/1000);
const m=Math.floor(s/60).toString().padStart(2,'0');
const sec=(s%60).toString().padStart(2,'0');
document.getElementById('timer-display').textContent=m+':'+sec;
},1000);
document.getElementById('start-btn').classList.add('hidden');
document.getElementById('stop-btn').classList.remove('hidden');
api('/api/start-timer','POST');
}
async function stopTimer(){
if(!timerInterval)return;
clearInterval(timerInterval);timerInterval=null;
document.getElementById('timer-display').textContent='00:00';
document.getElementById('start-btn').classList.remove('hidden');
document.getElementById('stop-btn').classList.add('hidden');
const courseId=parseInt(document.getElementById('timer-course').value)||null;
await api('/api/stop-timer','POST',{courseId});
loadDashboard();
}
async function adminLogin(){
const username=document.getElementById('a-user').value.trim();
const password=document.getElementById('a-pass').value;
const r=await api('/api/admin-login','POST',{username,password});
if(r.error)return showErr('admin-err',r.error);
document.getElementById('admin-modal').classList.add('hidden');
loadAdminPanel();
}
function closeAdmin(){document.getElementById('admin-modal').classList.add('hidden');logoClicks=0;}
async function loadAdminPanel(){
const r=await fetch('/api/admin/users',{headers:{'x-admin':'admin123'}});
const data=await r.json();
document.getElementById('admin-panel').classList.remove('hidden');
const s=data.stats;
document.getElementById('admin-stats').innerHTML=`
<div class="stat-box"><h3>${s.totalUsers}</h3><p>Users</p></div>
<div class="stat-box"><h3>${s.totalCourses}</h3><p>Courses</p></div>
<div class="stat-box"><h3>${s.totalCompleted}</h3><p>Topics Done</p></div>`;
document.getElementById('admin-users-table').innerHTML=data.users.map(u=>`<tr>
<td>${u.name}</td><td>${u.email}</td>
<td><span class="badge">${u.courses}</span></td>
<td>${u.progress}%</td>
<td>${fmtTime(u.totalTime)}</td>
<td><button class="btn-danger btn-sm" onclick="deleteUser('${u.email}')">Delete</button></td>
</tr>`).join('');
}
async function deleteUser(email){
if(!confirm(`Delete user ${email}?`))return;
await fetch(`/api/admin/user/${email}`,{method:'DELETE',headers:{'x-admin':'admin123'}});
loadAdminPanel();
}
async function resetAll(){
if(!confirm('Reset ALL data? This cannot be undone.'))return;
await fetch('/api/admin/reset',{method:'POST',headers:{'x-admin':'admin123'}});
loadAdminPanel();
}