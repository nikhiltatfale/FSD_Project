let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let activeBidJobId = null;

function getUsers(){return JSON.parse(localStorage.getItem('users')||'[]')}
function getJobs(){return JSON.parse(localStorage.getItem('jobs')||'[]')}
function getBids(){return JSON.parse(localStorage.getItem('bids')||'[]')}
function saveUsers(d){localStorage.setItem('users',JSON.stringify(d))}
function saveJobs(d){localStorage.setItem('jobs',JSON.stringify(d))}
function saveBids(d){localStorage.setItem('bids',JSON.stringify(d))}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2)}

function showSection(id){
  ['authSection','jobsSection','clientDashboard','freelancerDashboard','adminPanel'].forEach(s=>{
    document.getElementById(s).style.display='none';
  });
  document.getElementById(id).style.display='block';
  if(id==='jobsSection') loadJobs();
  if(id==='clientDashboard') loadMyJobs();
  if(id==='freelancerDashboard') loadMyBids();
  if(id==='adminPanel') adminLoadData();
}

function updateNav(){
  const nu=document.getElementById('navUser');
  const lb=document.getElementById('logoutBtn');
  const ln=document.getElementById('loginNavBtn');
  if(currentUser){
    nu.textContent=currentUser.name+' ('+currentUser.role+')';
    lb.style.display='inline-block';
    ln.style.display='none';
  } else {
    nu.textContent='';
    lb.style.display='none';
    ln.style.display='inline-block';
  }
}

function switchTab(t){
  document.getElementById('loginForm').style.display=t==='login'?'block':'none';
  document.getElementById('registerForm').style.display=t==='register'?'block':'none';
  document.querySelectorAll('.tab').forEach((b,i)=>{
    b.classList.toggle('active',(i===0&&t==='login')||(i===1&&t==='register'));
  });
  setMsg('authMsg','','');
}

function setMsg(id,text,type){
  const el=document.getElementById(id);
  el.textContent=text;
  el.className='msg '+(type||'');
}

function registerUser(){
  const name=document.getElementById('regName').value.trim();
  const email=document.getElementById('regEmail').value.trim().toLowerCase();
  const pass=document.getElementById('regPass').value;
  const role=document.getElementById('regRole').value;
  if(!name||!email||!pass) return setMsg('authMsg','Fill all fields','error');
  const users=getUsers();
  if(users.find(u=>u.email===email)) return setMsg('authMsg','Email already exists','error');
  users.push({id:uid(),name,email,password:pass,role});
  saveUsers(users);
  setMsg('authMsg','Registered! Please login.','success');
  switchTab('login');
}

function loginUser(){
  const email=document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass=document.getElementById('loginPass').value;
  if(email==='admin@mail.com'&&pass==='admin123'){
    currentUser={id:'admin',name:'Admin',email,role:'admin'};
    localStorage.setItem('currentUser',JSON.stringify(currentUser));
    updateNav();
    showSection('adminPanel');
    return;
  }
  const users=getUsers();
  const user=users.find(u=>u.email===email&&u.password===pass);
  if(!user) return setMsg('authMsg','Invalid credentials','error');
  currentUser=user;
  localStorage.setItem('currentUser',JSON.stringify(currentUser));
  updateNav();
  if(user.role==='client') showSection('clientDashboard');
  else showSection('freelancerDashboard');
}

function logoutUser(){
  currentUser=null;
  localStorage.removeItem('currentUser');
  updateNav();
  showSection('jobsSection');
}

function postJob(){
  if(!currentUser||currentUser.role!=='client') return;
  const title=document.getElementById('jobTitle').value.trim();
  const desc=document.getElementById('jobDesc').value.trim();
  const budget=parseFloat(document.getElementById('jobBudget').value);
  if(!title||!desc||!budget) return setMsg('jobMsg','Fill all fields','error');
  const jobs=getJobs();
  jobs.push({id:uid(),title,desc,budget,clientId:currentUser.id,status:'open'});
  saveJobs(jobs);
  document.getElementById('jobTitle').value='';
  document.getElementById('jobDesc').value='';
  document.getElementById('jobBudget').value='';
  setMsg('jobMsg','Job posted!','success');
  loadMyJobs();
}

function loadJobs(){
  const search=(document.getElementById('searchInput')||{value:''}).value.toLowerCase();
  const maxB=parseFloat((document.getElementById('filterBudget')||{value:''}).value)||Infinity;
  const jobs=getJobs().filter(j=>j.status==='open'&&j.title.toLowerCase().includes(search)&&j.budget<=maxB);
  const bids=getBids();
  const el=document.getElementById('jobsList');
  if(!jobs.length){el.innerHTML='<p class="no-data">No jobs found.</p>';return;}
  el.innerHTML=jobs.map(j=>{
    const jbids=bids.filter(b=>b.jobId===j.id);
    const canBid=currentUser&&currentUser.role==='freelancer'&&!jbids.find(b=>b.freelancerId===currentUser.id);
    return `<div class="job-card">
      <div class="job-info">
        <h4>${j.title}</h4>
        <p>${j.desc}</p>
        <div class="job-meta">
          <span class="budget">$${j.budget}</span>
          <span class="badge open">Open</span>
          <span style="font-size:.78rem;color:#999">${jbids.length} bid(s)</span>
        </div>
      </div>
      <div class="job-actions">
        ${canBid?`<button class="btn-primary" onclick="openBidModal('${j.id}')">Bid</button>`:''}
        ${currentUser&&currentUser.role==='freelancer'&&jbids.find(b=>b.freelancerId===currentUser.id)?'<span style="font-size:.78rem;color:#27ae60">✓ Bid placed</span>':''}
      </div>
    </div>`;
  }).join('');
}

function loadMyJobs(){
  if(!currentUser) return;
  const jobs=getJobs().filter(j=>j.clientId===currentUser.id);
  const bids=getBids();
  const el=document.getElementById('myJobs');
  if(!jobs.length){el.innerHTML='<p class="no-data">No jobs posted yet.</p>';return;}
  el.innerHTML='<h3 style="margin-bottom:12px">My Jobs</h3>'+jobs.map(j=>{
    const jbids=bids.filter(b=>b.jobId===j.id);
    return `<div class="job-card">
      <div class="job-info">
        <h4>${j.title}</h4>
        <p>${j.desc}</p>
        <div class="job-meta">
          <span class="budget">$${j.budget}</span>
          <span class="badge ${j.status}">${j.status}</span>
          <span style="font-size:.78rem;color:#999">${jbids.length} bid(s)</span>
        </div>
      </div>
      <div class="job-actions">
        ${j.status==='open'?`<button onclick="viewBids('${j.id}')">View Bids</button>`:'<span style="font-size:.78rem;color:#f39c12">Assigned</span>'}
      </div>
    </div>`;
  }).join('');
}

function loadMyBids(){
  if(!currentUser) return;
  const bids=getBids().filter(b=>b.freelancerId===currentUser.id);
  const jobs=getJobs();
  const el=document.getElementById('myBids');
  if(!bids.length){el.innerHTML='<p class="no-data">No bids placed yet.</p>';return;}
  el.innerHTML=bids.map(b=>{
    const job=jobs.find(j=>j.id===b.jobId);
    if(!job) return '';
    return `<div class="job-card">
      <div class="job-info">
        <h4>${job.title}</h4>
        <p>${b.proposal}</p>
        <div class="job-meta">
          <span class="budget">Your bid: $${b.amount}</span>
          <span class="badge ${job.status}">${job.status}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

function openBidModal(jobId){
  if(!currentUser||currentUser.role!=='freelancer'){showSection('authSection');return;}
  activeBidJobId=jobId;
  document.getElementById('bidAmount').value='';
  document.getElementById('bidProposal').value='';
  setMsg('bidMsg','','');
  document.getElementById('bidModal').style.display='flex';
}

function closeModal(){
  document.getElementById('bidModal').style.display='none';
  activeBidJobId=null;
}

function submitBid(){
  const amount=parseFloat(document.getElementById('bidAmount').value);
  const proposal=document.getElementById('bidProposal').value.trim();
  if(!amount||!proposal) return setMsg('bidMsg','Fill all fields','error');
  const bids=getBids();
  if(bids.find(b=>b.jobId===activeBidJobId&&b.freelancerId===currentUser.id))
    return setMsg('bidMsg','Already bid on this job','error');
  bids.push({id:uid(),jobId:activeBidJobId,freelancerId:currentUser.id,amount,proposal});
  saveBids(bids);
  setMsg('bidMsg','Bid placed!','success');
  setTimeout(()=>{closeModal();loadJobs();},800);
}

function viewBids(jobId){
  const bids=getBids().filter(b=>b.jobId===jobId);
  const users=getUsers();
  const el=document.getElementById('bidsViewList');
  if(!bids.length){el.innerHTML='<p class="no-data">No bids yet.</p>';}
  else {
    el.innerHTML=bids.map(b=>{
      const fr=users.find(u=>u.id===b.freelancerId);
      const job=getJobs().find(j=>j.id===jobId);
      const canHire=job&&job.status==='open';
      return `<div class="bid-item">
        <strong>${fr?fr.name:'Unknown'}</strong> — $${b.amount}<br>
        <span>${b.proposal}</span><br>
        ${canHire?`<button class="hire-btn" onclick="hireFreelancer('${jobId}','${b.freelancerId}')">Hire</button>`:''}
      </div>`;
    }).join('');
  }
  document.getElementById('bidsViewModal').style.display='flex';
}

function closeBidsModal(){
  document.getElementById('bidsViewModal').style.display='none';
}

function hireFreelancer(jobId,freelancerId){
  const jobs=getJobs();
  const job=jobs.find(j=>j.id===jobId);
  if(!job) return;
  job.status='assigned';
  job.hiredId=freelancerId;
  saveJobs(jobs);
  closeBidsModal();
  loadMyJobs();
  alert('Freelancer hired successfully!');
}

function adminLoadData(){
  const users=getUsers();
  const jobs=getJobs();
  const bids=getBids();
  document.getElementById('adminUsers').innerHTML=users.length?users.map(u=>`
    <div class="admin-row">
      <span>${u.name} <em style="color:#aaa">(${u.role})</em></span>
      <button class="del-btn" onclick="deleteItem('user','${u.id}')">Delete</button>
    </div>`).join(''):'<p class="no-data">No users.</p>';
  document.getElementById('adminJobs').innerHTML=jobs.length?jobs.map(j=>`
    <div class="admin-row">
      <span>${j.title} <em style="color:#aaa">($${j.budget})</em></span>
      <button class="del-btn" onclick="deleteItem('job','${j.id}')">Delete</button>
    </div>`).join(''):'<p class="no-data">No jobs.</p>';
  document.getElementById('adminBids').innerHTML=bids.length?bids.map(b=>`
    <div class="admin-row">
      <span>Bid $${b.amount}</span>
      <button class="del-btn" onclick="deleteItem('bid','${b.id}')">Delete</button>
    </div>`).join(''):'<p class="no-data">No bids.</p>';
}

function deleteItem(type,id){
  if(!confirm('Delete this '+type+'?')) return;
  if(type==='user'){const d=getUsers().filter(u=>u.id!==id);saveUsers(d);}
  if(type==='job'){const d=getJobs().filter(j=>j.id!==id);saveJobs(d);}
  if(type==='bid'){const d=getBids().filter(b=>b.id!==id);saveBids(d);}
  adminLoadData();
}

window.onclick=function(e){
  if(e.target.id==='bidModal') closeModal();
  if(e.target.id==='bidsViewModal') closeBidsModal();
};

updateNav();
if(currentUser){
  if(currentUser.role==='admin') showSection('adminPanel');
  else if(currentUser.role==='client') showSection('clientDashboard');
  else showSection('freelancerDashboard');
} else {
  showSection('jobsSection');
}