let selectedTravel=null;
let footerClicks=0;
let isAdmin=false;

function showPage(p){
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  document.getElementById('page-'+p).classList.add('active');
  if(p==='admin') loadAdminListings();
}

function doSearch(){
  const from=document.getElementById('h-from')||document.getElementById('s-from');
  const to=document.getElementById('h-to')||document.getElementById('s-to');
  const date=document.getElementById('h-date')||document.getElementById('s-date');
  const type=document.getElementById('h-type')||document.getElementById('s-type');
  const f=document.getElementById('s-from')?document.getElementById('s-from').value:document.getElementById('h-from').value;
  const t=document.getElementById('s-to')?document.getElementById('s-to').value:document.getElementById('h-to').value;
  const d=document.getElementById('s-date')?document.getElementById('s-date').value:document.getElementById('h-date').value;
  const ty=document.getElementById('s-type')?document.getElementById('s-type').value:document.getElementById('h-type').value;
  showPage('search');
  const params=new URLSearchParams({from:f,to:t,date:d,type:ty});
  fetch('/api/travel?'+params).then(r=>r.json()).then(data=>{
    const el=document.getElementById('results');
    if(!data.length){el.innerHTML='<div class="no-results">No travel options found. Try different filters.</div>';return;}
    el.innerHTML=data.map(t=>`
      <div class="travel-card">
        <div class="travel-card-info">
          <span class="badge badge-${t.type.toLowerCase()}">${t.type}</span>
          <h3>${t.from} → ${t.to}</h3>
          <p>📅 ${t.date} &nbsp; 🕐 ${t.time}</p>
          <p style="color:#999;font-size:.82rem">ID: ${t.id}</p>
        </div>
        <div class="travel-card-price">
          <div class="price">₹${Number(t.price).toLocaleString()}</div>
          <button class="book-btn" onclick='openBookModal(${JSON.stringify(t)})'>Book Now</button>
        </div>
      </div>`).join('');
  });
}

function openBookModal(travel){
  selectedTravel=travel;
  document.getElementById('book-travel-info').innerHTML=`
    <div class="book-info">
      <strong>${travel.type}: ${travel.from} → ${travel.to}</strong><br>
      📅 ${travel.date} &nbsp; 🕐 ${travel.time} &nbsp; ₹${Number(travel.price).toLocaleString()}
    </div>`;
  document.getElementById('b-name').value='';
  document.getElementById('b-email').value='';
  document.getElementById('b-phone').value='';
  document.getElementById('book-error').textContent='';
  document.getElementById('modal-book').classList.add('open');
}

function closeBookModal(){document.getElementById('modal-book').classList.remove('open');}

function confirmBooking(){
  const name=document.getElementById('b-name').value.trim();
  const email=document.getElementById('b-email').value.trim();
  const phone=document.getElementById('b-phone').value.trim();
  const err=document.getElementById('book-error');
  if(!name||!email||!phone){err.textContent='All fields are required.';return;}
  if(!/^[^@]+@[^@]+\.[^@]+$/.test(email)){err.textContent='Invalid email format.';return;}
  err.textContent='';
  fetch('/api/book',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,phone,travelId:selectedTravel.id})})
    .then(r=>r.json()).then(data=>{
      if(data.error){err.textContent=data.error;return;}
      closeBookModal();
      document.getElementById('success-details').innerHTML=`
        <p><strong>Booking ID:</strong> ${data.bookingId}</p>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Travel:</strong> ${data.travel.type} - ${data.travel.from} → ${data.travel.to}</p>
        <p><strong>Date:</strong> ${data.travel.date} | ${data.travel.time}</p>
        <p><strong>Amount:</strong> ₹${Number(data.travel.price).toLocaleString()}</p>`;
      document.getElementById('modal-success').classList.add('open');
    });
}

function closeSuccessModal(){document.getElementById('modal-success').classList.remove('open');}

function fetchBookings(){
  const email=document.getElementById('lookup-email').value.trim();
  if(!email){return;}
  fetch('/api/bookings/'+encodeURIComponent(email)).then(r=>r.json()).then(data=>{
    const el=document.getElementById('my-bookings-list');
    if(!data.length){el.innerHTML='<div class="no-results">No bookings found for this email.</div>';return;}
    el.innerHTML=data.map(b=>`
      <div class="booking-card">
        <span class="booking-id">${b.bookingId}</span>
        <h3>${b.travel.type}: ${b.travel.from} → ${b.travel.to}</h3>
        <p>📅 ${b.travel.date} &nbsp; 🕐 ${b.travel.time}</p>
        <p>💰 ₹${Number(b.travel.price).toLocaleString()}</p>
        <p>👤 ${b.name} | 📧 ${b.email} | 📱 ${b.phone}</p>
      </div>`).join('');
  });
}

function footerClick(){
  footerClicks++;
  if(footerClicks>=5){
    footerClicks=0;
    if(isAdmin){showPage('admin');}
    else{document.getElementById('admin-user').value='';document.getElementById('admin-pass').value='';document.getElementById('login-error').textContent='';document.getElementById('modal-admin-login').classList.add('open');}
  }
}

function adminLogin(){
  const username=document.getElementById('admin-user').value;
  const password=document.getElementById('admin-pass').value;
  fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})})
    .then(r=>r.json()).then(data=>{
      if(data.ok){isAdmin=true;document.getElementById('modal-admin-login').classList.remove('open');showPage('admin');}
      else{document.getElementById('login-error').textContent='Invalid username or password.';}
    });
}

function closeAdminModal(){document.getElementById('modal-admin-login').classList.remove('open');}

function adminLogout(){isAdmin=false;showPage('home');}

function adminTab(tab){
  document.querySelectorAll('.admin-section').forEach(s=>s.style.display='none');
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('admin-'+tab).style.display='block';
  event.target.classList.add('active');
  if(tab==='listings') loadAdminListings();
  if(tab==='bookings') loadAllBookings();
  if(tab==='users') loadUsers();
}

function loadAdminListings(){
  fetch('/api/travel').then(r=>r.json()).then(data=>{
    document.getElementById('listings-table').innerHTML=`
      <table><thead><tr><th>ID</th><th>Type</th><th>From</th><th>To</th><th>Date</th><th>Time</th><th>Price</th><th>Action</th></tr></thead>
      <tbody>${data.map(t=>`<tr><td>${t.id}</td><td>${t.type}</td><td>${t.from}</td><td>${t.to}</td><td>${t.date}</td><td>${t.time}</td><td>₹${Number(t.price).toLocaleString()}</td><td><button class="del-btn" onclick="deleteListing('${t.id}')">Delete</button></td></tr>`).join('')}</tbody></table>`;
  });
}

function addListing(){
  const type=document.getElementById('a-type').value;
  const from=document.getElementById('a-from').value.trim();
  const to=document.getElementById('a-to').value.trim();
  const date=document.getElementById('a-date').value;
  const time=document.getElementById('a-time').value.trim();
  const price=document.getElementById('a-price').value;
  if(!from||!to||!date||!time||!price){alert('All fields required.');return;}
  fetch('/api/travel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,from,to,date,time,price})})
    .then(r=>r.json()).then(()=>{
      document.getElementById('a-from').value='';document.getElementById('a-to').value='';
      document.getElementById('a-date').value='';document.getElementById('a-time').value='';document.getElementById('a-price').value='';
      loadAdminListings();
    });
}

function deleteListing(id){
  if(!confirm('Delete this listing?')) return;
  fetch('/api/travel/'+id,{method:'DELETE'}).then(()=>loadAdminListings());
}

function loadAllBookings(){
  fetch('/api/allbookings').then(r=>r.json()).then(data=>{
    document.getElementById('all-bookings-table').innerHTML=data.length?`
      <table><thead><tr><th>Booking ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Travel</th><th>Date</th><th>Price</th></tr></thead>
      <tbody>${data.map(b=>`<tr><td>${b.bookingId}</td><td>${b.name}</td><td>${b.email}</td><td>${b.phone}</td><td>${b.travel.type}: ${b.travel.from}→${b.travel.to}</td><td>${b.travel.date}</td><td>₹${Number(b.travel.price).toLocaleString()}</td></tr>`).join('')}</tbody></table>`
      :'<div class="no-results">No bookings yet.</div>';
  });
}

function loadUsers(){
  fetch('/api/allbookings').then(r=>r.json()).then(data=>{
    const seen=new Set();
    const users=data.filter(b=>{if(seen.has(b.email)){return false;}seen.add(b.email);return true;});
    document.getElementById('users-table').innerHTML=users.length?`
      <table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Bookings</th></tr></thead>
      <tbody>${users.map(u=>`<tr><td>${u.name}</td><td>${u.email}</td><td>${u.phone}</td><td>${data.filter(b=>b.email===u.email).length}</td></tr>`).join('')}</tbody></table>`
      :'<div class="no-results">No users yet.</div>';
  });
}