const DEFAULTS = ["Education","Medical Help","Animal Care","Disaster Relief"];
const ICONS = {"Education":"📚","Medical Help":"🏥","Animal Care":"🐾","Disaster Relief":"🆘"};
const ADMIN = {user:"admin",pass:"admin123"};

function getCauses(){return JSON.parse(localStorage.getItem("causes")||"null")||DEFAULTS;}
function getDonations(){return JSON.parse(localStorage.getItem("donations")||"[]");}
function saveCauses(c){localStorage.setItem("causes",JSON.stringify(c));}
function saveDonations(d){localStorage.setItem("donations",JSON.stringify(d));}

function renderCauses(){
  const causes=getCauses();
  const grid=document.getElementById("causesGrid");
  grid.innerHTML=causes.map(c=>`<div class="cause-card"><div class="cause-icon">${ICONS[c]||"💛"}</div>${c}</div>`).join("");
  const sel=document.getElementById("dCause");
  sel.innerHTML=`<option value="">Select Cause</option>`+causes.map(c=>`<option value="${c}">${c}</option>`).join("");
}

function renderAdminCauses(){
  const causes=getCauses();
  document.getElementById("causesList").innerHTML=causes.map((c,i)=>
    `<span class="cause-tag">${c}<button onclick="deleteCause(${i})">×</button></span>`
  ).join("");
  document.getElementById("totalCauses").textContent=causes.length;
}

function renderDonations(){
  const donations=getDonations();
  const tbody=document.getElementById("donationsTbody");
  const none=document.getElementById("noDonations");
  const table=document.getElementById("donationsTable");
  if(!donations.length){none.classList.remove("hidden");table.classList.add("hidden");return;}
  none.classList.add("hidden");table.classList.remove("hidden");
  tbody.innerHTML=donations.map(d=>
    `<tr><td>${d.name}</td><td>${d.email}</td><td>₹${d.amount}</td><td>${d.cause}</td><td>${d.date}</td><td>${d.message||"—"}</td><td><button onclick="deleteDonation('${d.id}')">Delete</button></td></tr>`
  ).join("");
  const total=donations.reduce((s,d)=>s+Number(d.amount),0);
  document.getElementById("totalDonations").textContent=donations.length;
  document.getElementById("totalAmount").textContent="₹"+total.toLocaleString("en-IN");
}

document.getElementById("donationForm").addEventListener("submit",function(e){
  e.preventDefault();
  const name=document.getElementById("dName").value.trim();
  const email=document.getElementById("dEmail").value.trim();
  const amount=Number(document.getElementById("dAmount").value);
  const cause=document.getElementById("dCause").value;
  const message=document.getElementById("dMessage").value.trim();
  if(!name||!email||!amount||!cause)return;
  const emailReg=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if(!emailReg.test(email))return alert("Enter a valid email.");
  if(amount<=0)return alert("Amount must be greater than 0.");
  const donations=getDonations();
  donations.push({id:Date.now().toString(),name,email,amount,cause,message,date:new Date().toISOString().split("T")[0]});
  saveDonations(donations);
  this.reset();
  const msg=document.getElementById("successMsg");
  msg.classList.remove("hidden");
  setTimeout(()=>msg.classList.add("hidden"),3500);
});

function toggleAdminLogin(){
  const box=document.getElementById("adminLoginBox");
  box.classList.toggle("hidden");
  document.getElementById("loginErr").classList.add("hidden");
  document.getElementById("aUser").value="";
  document.getElementById("aPass").value="";
}

function adminLogin(){
  const u=document.getElementById("aUser").value.trim();
  const p=document.getElementById("aPass").value;
  if(u===ADMIN.user&&p===ADMIN.pass){
    document.getElementById("adminLoginBox").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("hidden");
    document.getElementById("adminToggleBtn").classList.add("hidden");
    renderAdminCauses();
    renderDonations();
  }else{
    document.getElementById("loginErr").classList.remove("hidden");
  }
}

function adminLogout(){
  document.getElementById("adminPanel").classList.add("hidden");
  document.getElementById("adminToggleBtn").classList.remove("hidden");
}

function addCause(){
  const inp=document.getElementById("newCause");
  const val=inp.value.trim();
  if(!val)return;
  const causes=getCauses();
  if(causes.includes(val))return alert("Cause already exists.");
  causes.push(val);
  saveCauses(causes);
  inp.value="";
  renderCauses();
  renderAdminCauses();
}

function deleteCause(i){
  const causes=getCauses();
  causes.splice(i,1);
  saveCauses(causes);
  renderCauses();
  renderAdminCauses();
}

function deleteDonation(id){
  let donations=getDonations();
  donations=donations.filter(d=>d.id!==id);
  saveDonations(donations);
  renderDonations();
}

renderCauses();