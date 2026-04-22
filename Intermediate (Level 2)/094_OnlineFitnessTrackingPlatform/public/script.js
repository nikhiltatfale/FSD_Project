const API = "";
let currentUser = null;
let editingLogId = null;
let allUsers = [];

function $(id){return document.getElementById(id)}

function switchTab(t){
  ["login","register","admin"].forEach(x=>{
    $("tab-"+x).classList.toggle("hidden",x!==t);
  });
  document.querySelectorAll(".tab").forEach((b,i)=>{
    b.classList.toggle("active",["login","register","admin"][i]===t);
  });
}

async function api(method,path,data){
  const opts={method,headers:{"Content-Type":"application/json"}};
  if(data)opts.body=JSON.stringify(data);
  const r=await fetch(API+path,opts);
  return r.json();
}

function showSection(s){
  ["dashboard","add-log","profile"].forEach(x=>$(x).classList.toggle("hidden",x!==s));
  if(s==="dashboard")loadLogs();
  if(s==="profile")fillProfile();
  if(s==="add-log"){editingLogId=null;clearLogForm();$("log-form-title").textContent="Add Log";$("cancel-btn")&&($("cancel-btn").style.display="none")}
}

function logout(){
  currentUser=null;
  localStorage.removeItem("fituser");
  localStorage.removeItem("fitadmin");
  $("auth-section").classList.remove("hidden");
  $("user-section").classList.add("hidden");
  $("admin-section").classList.add("hidden");
  $("navbar").classList.add("hidden");
}

async function doLogin(){
  const email=$("l-email").value.trim(),pass=$("l-pass").value;
  if(!email||!pass){$("l-err").textContent="Fill all fields";return;}
  const d=await api("POST","/login",{email,password:pass});
  if(d.error){$("l-err").textContent=d.error;return;}
  currentUser=d;
  localStorage.setItem("fituser",JSON.stringify(d));
  showUser();
}

async function doRegister(){
  const name=$("r-name").value.trim(),email=$("r-email").value.trim(),pass=$("r-pass").value;
  if(!name||!email||!pass){$("r-err").textContent="Fill required fields";return;}
  if(!/\S+@\S+\.\S+/.test(email)){$("r-err").textContent="Invalid email";return;}
  if(pass.length<6){$("r-err").textContent="Password min 6 chars";return;}
  const d=await api("POST","/register",{name,email,password:pass,age:$("r-age").value,height:$("r-height").value,currentWeight:$("r-cw").value,targetWeight:$("r-tw").value});
  if(d.error){$("r-err").textContent=d.error;return;}
  currentUser=d;
  localStorage.setItem("fituser",JSON.stringify(d));
  showUser();
}

async function doAdminLogin(){
  const email=$("a-email").value.trim(),pass=$("a-pass").value;
  const d=await api("POST","/admin-login",{email,password:pass});
  if(d.error){$("a-err").textContent=d.error;return;}
  localStorage.setItem("fitadmin","1");
  $("auth-section").classList.add("hidden");
  $("admin-section").classList.remove("hidden");
  loadAdminData();
}

function showUser(){
  $("auth-section").classList.add("hidden");
  $("user-section").classList.remove("hidden");
  $("navbar").classList.remove("hidden");
  $("nav-name").textContent=currentUser.name;
  showSection("dashboard");
}

async function loadLogs(){
  const logs=await api("GET","/logs/"+currentUser.id);
  const tbody=$("logs-body");
  tbody.innerHTML="";
  let ts=0,tc=0;
  logs.forEach(l=>{
    ts+=Number(l.steps);tc+=Number(l.calories);
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${l.date}</td><td>${l.steps}</td><td>${l.calories}</td><td>${l.workoutType}</td><td>${l.duration}m</td><td>${l.weight}kg</td><td><button class="btn-edit" onclick="editLog(${l.id})">Edit</button><button class="btn-del" onclick="deleteLog(${l.id})">Del</button></td>`;
    tbody.appendChild(tr);
  });
  const wts=logs.filter(l=>l.weight>0).map(l=>l.weight);
  const wtChange=wts.length>1?(wts[wts.length-1]-wts[0]).toFixed(1):0;
  $("stats-cards").innerHTML=`
    <div class="card"><div class="val">${logs.length}</div><div class="lbl">Total Logs</div></div>
    <div class="card"><div class="val">${ts.toLocaleString()}</div><div class="lbl">Total Steps</div></div>
    <div class="card"><div class="val">${tc.toLocaleString()}</div><div class="lbl">Calories Burned</div></div>
    <div class="card"><div class="val">${wtChange>0?"+"+wtChange:wtChange}kg</div><div class="lbl">Weight Change</div></div>`;
}

async function submitLog(){
  const date=$("log-date").value,steps=$("log-steps").value,calories=$("log-cal").value;
  if(!date){$("log-err").textContent="Date is required";return;}
  if(steps&&isNaN(steps)){$("log-err").textContent="Steps must be a number";return;}
  if(calories&&isNaN(calories)){$("log-err").textContent="Calories must be a number";return;}
  const payload={userId:currentUser.id,date,steps:Number(steps)||0,calories:Number(calories)||0,workoutType:$("log-type").value,duration:Number($("log-dur").value)||0,weight:Number($("log-wt").value)||0};
  let d;
  if(editingLogId){d=await api("PUT","/log/"+editingLogId,payload);}
  else{d=await api("POST","/log",payload);}
  if(d.error){$("log-err").textContent=d.error;return;}
  editingLogId=null;clearLogForm();showSection("dashboard");
}

function clearLogForm(){
  ["log-date","log-steps","log-cal","log-dur","log-wt"].forEach(id=>{$(id).value="";});
  $("log-type").value="";$("log-err").textContent="";
}

async function editLog(id){
  const logs=await api("GET","/logs/"+currentUser.id);
  const l=logs.find(x=>x.id===id);
  if(!l)return;
  editingLogId=id;
  $("log-date").value=l.date;$("log-steps").value=l.steps;$("log-cal").value=l.calories;
  $("log-type").value=l.workoutType;$("log-dur").value=l.duration;$("log-wt").value=l.weight;
  $("log-form-title").textContent="Edit Log";
  showSection("add-log");
}

function cancelEdit(){editingLogId=null;showSection("dashboard");}

async function deleteLog(id){
  if(!confirm("Delete this log?"))return;
  await api("DELETE","/log/"+id);
  loadLogs();
}

function fillProfile(){
  $("p-name").value=currentUser.name||"";
  $("p-email").value=currentUser.email||"";
  $("p-age").value=currentUser.age||"";
  $("p-height").value=currentUser.height||"";
  $("p-cw").value=currentUser.currentWeight||"";
  $("p-tw").value=currentUser.targetWeight||"";
}

async function saveProfile(){
  const updated={...currentUser,name:$("p-name").value,age:$("p-age").value,height:$("p-height").value,currentWeight:$("p-cw").value,targetWeight:$("p-tw").value};
  const d=await api("PUT","/user/"+currentUser.id,updated);
  if(d&&!d.error){currentUser=d;localStorage.setItem("fituser",JSON.stringify(d));$("nav-name").textContent=d.name;}
  $("p-msg").textContent="Profile saved!";setTimeout(()=>{$("p-msg").textContent="";},2000);
}

function adminTab(t){
  ["a-overview","a-users","a-logs"].forEach(x=>$(x).classList.toggle("hidden",x!==t));
  if(t==="a-users")loadAdminUsers();
  if(t==="a-logs")loadAdminLogs();
  if(t==="a-overview")loadAdminStats();
}

async function loadAdminData(){loadAdminStats();}

async function loadAdminStats(){
  const s=await api("GET","/stats");
  $("admin-stats").innerHTML=`
    <div class="card"><div class="val">${s.totalUsers}</div><div class="lbl">Total Users</div></div>
    <div class="card"><div class="val">${s.totalLogs}</div><div class="lbl">Total Logs</div></div>
    <div class="card"><div class="val">${(s.totalCalories||0).toLocaleString()}</div><div class="lbl">Total Calories</div></div>
    <div class="card"><div class="val">${(s.totalSteps||0).toLocaleString()}</div><div class="lbl">Total Steps</div></div>
    <div class="card"><div class="val" style="font-size:1rem">${s.mostActiveUser}</div><div class="lbl">Most Active</div></div>`;
}

async function loadAdminUsers(){
  allUsers=await api("GET","/users");
  const tbody=$("admin-users-body");
  tbody.innerHTML="";
  allUsers.forEach(u=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${u.id}</td><td>${u.name}</td><td>${u.email}</td><td>${u.age||"-"}</td><td>${u.height||"-"}</td><td>${u.currentWeight||"-"}</td><td>${u.targetWeight||"-"}</td><td><button class="btn-del" onclick="adminDeleteUser(${u.id})">Delete</button></td>`;
    tbody.appendChild(tr);
  });
}

async function loadAdminLogs(){
  allUsers=await api("GET","/users");
  const logs=await api("GET","/logs");
  const tbody=$("admin-logs-body");
  tbody.innerHTML="";
  logs.forEach(l=>{
    const u=allUsers.find(x=>x.id===l.userId);
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${l.id}</td><td>${u?u.name:l.userId}</td><td>${l.date}</td><td>${l.steps}</td><td>${l.calories}</td><td>${l.workoutType}</td><td>${l.duration}m</td><td>${l.weight}kg</td><td><button class="btn-del" onclick="adminDeleteLog(${l.id})">Delete</button></td>`;
    tbody.appendChild(tr);
  });
}

async function adminDeleteUser(id){
  if(!confirm("Delete user and all their logs?"))return;
  await api("DELETE","/user/"+id);
  loadAdminUsers();loadAdminStats();
}

async function adminDeleteLog(id){
  if(!confirm("Delete this log?"))return;
  await api("DELETE","/log/"+id);
  loadAdminLogs();loadAdminStats();
}

(function init(){
  const u=localStorage.getItem("fituser");
  const a=localStorage.getItem("fitadmin");
  if(u){currentUser=JSON.parse(u);showUser();}
  else if(a){$("auth-section").classList.add("hidden");$("admin-section").classList.remove("hidden");loadAdminData();}
})();