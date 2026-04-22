let currentEvent=null;let isAdmin=false;let footerClicks=0;let footerTimer=null;

const sections=['events','detail','booking','confirm','adminLogin','adminDash'];
function showSection(name){
sections.forEach(s=>document.getElementById('sec-'+s).style.display='none');
document.getElementById('sec-'+name).style.display='block';
if(name==='events')loadEvents();
if(name==='adminDash')loadAdminEvents();
}

async function loadEvents(){
const res=await fetch('/api/events');
const data=await res.json();
const grid=document.getElementById('eventsGrid');
grid.innerHTML=data.map(e=>`
<div class="card" onclick="showDetail(${e.id})">
<h3>${e.name}</h3>
<div class="meta">
<span>📅 ${new Date(e.date).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</span>
<span>📍 ${e.location}</span>
<span>💺 ${e.availableSeats===0?'<span class="soldout">Sold Out</span>':e.availableSeats+' seats left'}</span>
</div>
<div class="price">₹${e.price.toLocaleString('en-IN')}</div>
${e.availableSeats>0?`<button class="btnPrimary" onclick="event.stopPropagation();showBooking(${e.id})">Book Now</button>`:'<p class="soldout" style="margin-top:12px">Sold Out</p>'}
</div>`).join('');
}

async function showDetail(id){
const res=await fetch('/api/events/'+id);
const e=await res.json();
currentEvent=e;
document.getElementById('detailContent').innerHTML=`
<div class="detailBox">
<h2>${e.name}</h2>
<div class="meta">
<span class="badge">📅 ${new Date(e.date).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</span>
<span class="badge">📍 ${e.location}</span>
<span class="badge">💺 ${e.availableSeats} / ${e.totalSeats} seats</span>
<span class="badge">₹${e.price.toLocaleString('en-IN')}</span>
</div>
<p>${e.description}</p>
${e.availableSeats>0?`<button class="btnPrimary" onclick="showBooking(${e.id})">Book Tickets</button>`:'<p class="soldout">Sold Out</p>'}
</div>`;
showSection('detail');
}

async function showBooking(id){
if(!currentEvent||currentEvent.id!==id){const r=await fetch('/api/events/'+id);currentEvent=await r.json();}
document.getElementById('bookEventInfo').innerHTML=`<strong>${currentEvent.name}</strong><br>₹${currentEvent.price.toLocaleString('en-IN')} per ticket · ${currentEvent.availableSeats} seats available`;
document.getElementById('bName').value='';document.getElementById('bEmail').value='';document.getElementById('bPhone').value='';document.getElementById('bTickets').value='';
document.getElementById('bookErr').textContent='';
showSection('booking');
}

async function submitBooking(){
const name=document.getElementById('bName').value.trim();
const email=document.getElementById('bEmail').value.trim();
const phone=document.getElementById('bPhone').value.trim();
const tickets=parseInt(document.getElementById('bTickets').value);
const err=document.getElementById('bookErr');
if(!name||!email||!phone||!tickets){err.textContent='All fields are required.';return;}
if(tickets<1){err.textContent='Minimum 1 ticket required.';return;}
const res=await fetch('/api/book',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({eventId:currentEvent.id,name,email,phone,tickets})});
const data=await res.json();
if(!res.ok){err.textContent=data.error||'Booking failed.';return;}
document.getElementById('confirmDetails').innerHTML=`
<div class="confirmDetail">
<p>Booking ID <span>${data.bookingId}</span></p>
<p>Event <span>${data.eventName}</span></p>
<p>Name <span>${data.name}</span></p>
<p>Email <span>${data.email}</span></p>
<p>Phone <span>${data.phone}</span></p>
<p>Tickets <span>${data.tickets}</span></p>
<p>Total Paid <span>₹${(currentEvent.price*data.tickets).toLocaleString('en-IN')}</span></p>
</div>`;
showSection('confirm');
}

async function doAdminLogin(){
const username=document.getElementById('aUser').value.trim();
const password=document.getElementById('aPass').value.trim();
const err=document.getElementById('loginErr');
if(!username||!password){err.textContent='Enter credentials.';return;}
const res=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
const data=await res.json();
if(!res.ok){err.textContent=data.error||'Login failed.';return;}
isAdmin=true;
document.getElementById('adminNavBtn').style.display='inline';
showSection('adminDash');
}

function adminLogout(){isAdmin=false;document.getElementById('adminNavBtn').style.display='none';showSection('events');}

async function loadAdminEvents(){
const res=await fetch('/api/events');
const data=await res.json();
document.getElementById('adminEventsList').innerHTML=data.map(e=>`
<div class="adminRow">
<div class="info"><strong>${e.name}</strong><span>${new Date(e.date).toLocaleDateString('en-IN')} · ${e.location} · ₹${e.price} · ${e.availableSeats}/${e.totalSeats} seats</span></div>
<div>
<button class="btnSm btnEdit" onclick="editEvent(${e.id})">Edit</button>
<button class="btnSm btnDel" onclick="deleteEvent(${e.id})">Delete</button>
</div>
</div>`).join('')||'<p style="color:var(--muted)">No events found.</p>';
}

async function loadAdminBookings(){
const res=await fetch('/api/admin/bookings');
const data=await res.json();
document.getElementById('adminBookingsList').innerHTML=data.map(b=>`
<div class="adminRow">
<div class="info"><strong>${b.bookingId}</strong><span>${b.name} · ${b.eventName} · ${b.tickets} ticket(s) · ${b.email}</span></div>
<div><button class="btnSm btnDel" onclick="deleteBooking('${b.bookingId}')">Delete</button></div>
</div>`).join('')||'<p style="color:var(--muted)">No bookings yet.</p>';
}

async function editEvent(id){
const res=await fetch('/api/events/'+id);
const e=await res.json();
document.getElementById('eName').value=e.name;
document.getElementById('eDate').value=e.date;
document.getElementById('eLocation').value=e.location;
document.getElementById('ePrice').value=e.price;
document.getElementById('eSeats').value=e.totalSeats;
document.getElementById('eDesc').value=e.description;
document.getElementById('eEditId').value=e.id;
document.getElementById('addEditTitle').textContent='Edit Event';
document.getElementById('cancelEdit').style.display='inline';
dashTab('add');
}

function cancelEdit(){
document.getElementById('eEditId').value='';
document.getElementById('addEditTitle').textContent='Add New Event';
document.getElementById('cancelEdit').style.display='none';
['eName','eDate','eLocation','ePrice','eSeats','eDesc'].forEach(id=>document.getElementById(id).value='');
}

async function submitEvent(){
const name=document.getElementById('eName').value.trim();
const date=document.getElementById('eDate').value;
const location=document.getElementById('eLocation').value.trim();
const price=document.getElementById('ePrice').value;
const totalSeats=document.getElementById('eSeats').value;
const description=document.getElementById('eDesc').value.trim();
const editId=document.getElementById('eEditId').value;
const err=document.getElementById('addErr');
if(!name||!date||!location||!price||!totalSeats){err.textContent='All required fields must be filled.';return;}
const url=editId?'/api/admin/event/'+editId:'/api/admin/event';
const method=editId?'PUT':'POST';
const res=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify({name,date,location,price,totalSeats,description})});
const data=await res.json();
if(!res.ok){err.textContent=data.error||'Failed to save event.';return;}
cancelEdit();err.textContent='';
dashTab('events');
}

async function deleteEvent(id){
if(!confirm('Delete this event?'))return;
await fetch('/api/admin/event/'+id,{method:'DELETE'});
loadAdminEvents();
}

async function deleteBooking(id){
if(!confirm('Delete this booking?'))return;
await fetch('/api/admin/booking/'+id,{method:'DELETE'});
loadAdminBookings();
}

function dashTab(tab){
['events','bookings','add'].forEach(t=>{
document.getElementById('dash-'+t).style.display='none';
document.getElementById('tab-'+t).classList.remove('active');
});
document.getElementById('dash-'+tab).style.display='block';
document.getElementById('tab-'+tab).classList.add('active');
if(tab==='events')loadAdminEvents();
if(tab==='bookings')loadAdminBookings();
}

document.getElementById('footerTrigger').addEventListener('click',()=>{
footerClicks++;
clearTimeout(footerTimer);
footerTimer=setTimeout(()=>footerClicks=0,2000);
if(footerClicks>=5){footerClicks=0;showSection('adminLogin');}
});

document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.shiftKey&&e.key==='A'){e.preventDefault();showSection('adminLogin');}});

loadEvents();