const ADMIN_USER="admin",ADMIN_PASS="admin123";
let reservations=[],maxTablesPerSlot=5,loggedIn=false,idCounter=1;

function toggleAdminLogin(){
  const s=document.getElementById("adminLoginSection");
  s.classList.toggle("hidden");
  document.getElementById("loginError").textContent="";
}

function adminLogin(){
  const u=document.getElementById("adminUser").value.trim();
  const p=document.getElementById("adminPass").value.trim();
  if(u===ADMIN_USER&&p===ADMIN_PASS){
    loggedIn=true;
    document.getElementById("adminLoginSection").classList.add("hidden");
    document.getElementById("adminDashboard").classList.remove("hidden");
    document.getElementById("maxTablesInput").value=maxTablesPerSlot;
    renderTable();
  }else{
    document.getElementById("loginError").textContent="Invalid credentials.";
  }
}

function adminLogout(){
  loggedIn=false;
  document.getElementById("adminDashboard").classList.add("hidden");
  document.getElementById("adminUser").value="";
  document.getElementById("adminPass").value="";
}

function updateMaxTables(){
  const v=parseInt(document.getElementById("maxTablesInput").value);
  if(v>=1){maxTablesPerSlot=v;alert("Max tables per slot updated to "+v);}
  else alert("Enter a valid number.");
}

function getSlotCount(date,time){
  return reservations.filter(r=>r.date===date&&r.time===time).length;
}

document.getElementById("reservationForm").addEventListener("submit",function(e){
  e.preventDefault();
  const name=document.getElementById("custName").value.trim();
  const phone=document.getElementById("custPhone").value.trim();
  const date=document.getElementById("custDate").value;
  const time=document.getElementById("custTime").value;
  const guests=parseInt(document.getElementById("custGuests").value);
  const err=document.getElementById("formError");
  const confirm=document.getElementById("confirmMsg");
  confirm.style.display="none";
  err.textContent="";

  if(!name){err.textContent="Please enter your name.";return;}
  if(!/^\d{10}$/.test(phone)){err.textContent="Phone must be exactly 10 digits.";return;}
  if(!date){err.textContent="Please select a date.";return;}
  const today=new Date();today.setHours(0,0,0,0);
  if(new Date(date)<today){err.textContent="Date cannot be in the past.";return;}
  if(!time){err.textContent="Please select a time slot.";return;}
  if(!guests||guests<1||guests>10){err.textContent="Guests must be between 1 and 10.";return;}
  if(getSlotCount(date,time)>=maxTablesPerSlot){err.textContent="No tables available for this slot. Please choose another.";return;}

  const res={id:idCounter++,name,phone,date,time,guests,status:"Booked"};
  reservations.push(res);
  confirm.textContent="Reservation confirmed! ID #"+res.id+" — "+name+", "+date+" at "+time+" for "+guests+" guest(s).";
  confirm.style.display="block";
  document.getElementById("reservationForm").reset();
});

function renderTable(){
  const tbody=document.getElementById("reservationsBody");
  const empty=document.getElementById("noReservations");
  tbody.innerHTML="";
  if(reservations.length===0){empty.style.display="block";return;}
  empty.style.display="none";
  reservations.forEach(function(r,i){
    const tr=document.createElement("tr");
    tr.innerHTML=
      "<td>"+(i+1)+"</td>"+
      "<td>"+r.name+"</td>"+
      "<td>"+r.phone+"</td>"+
      "<td>"+r.date+"</td>"+
      "<td>"+r.time+"</td>"+
      "<td>"+r.guests+"</td>"+
      "<td><span class='status-"+(r.status==="Booked"?"booked":"completed")+"'>"+r.status+"</span></td>"+
      "<td><div class='action-btns'>"+
        (r.status==="Booked"?"<button class='btn-complete' onclick='markComplete("+r.id+")'>Complete</button>":"")+
        "<button class='btn-delete' onclick='deleteReservation("+r.id+")'>Delete</button>"+
      "</div></td>";
    tbody.appendChild(tr);
  });
}

function markComplete(id){
  const r=reservations.find(x=>x.id===id);
  if(r)r.status="Completed";
  renderTable();
}

function deleteReservation(id){
  reservations=reservations.filter(x=>x.id!==id);
  renderTable();
}