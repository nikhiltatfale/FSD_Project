let movies=[],currentMovie=null,currentShow=null,selectedSeats=[];

async function loadMovies(){
  const r=await fetch('/movies');
  movies=await r.json();
  const g=document.getElementById('movie-grid');
  g.innerHTML=movies.map(m=>`
    <div class="card" onclick="openMovie(${m.id})">
      <img src="${m.poster}" alt="${m.title}" onerror="this.src='https://via.placeholder.com/220x330/13131a/e8b400?text=No+Poster'">
      <div class="card-info">
        <h3>${m.title}</h3>
        <p>${m.language} • ${m.duration}</p>
        <button class="btn">Book Now</button>
      </div>
    </div>`).join('');
}

function openMovie(id){
  currentMovie=movies.find(m=>m.id===id);
  currentShow=null;selectedSeats=[];
  document.getElementById('detail-title').textContent=currentMovie.title;
  document.getElementById('detail-meta').textContent=`${currentMovie.language} • ${currentMovie.duration}`;
  document.getElementById('detail-poster').src=currentMovie.poster;
  document.getElementById('page-home').style.display='none';
  document.getElementById('page-seats').style.display='block';
  document.getElementById('seat-grid').innerHTML='';
  document.querySelectorAll('.show-btn').forEach(b=>b.classList.remove('active'));
  updateSelInfo();
}

function showHome(){
  document.getElementById('page-home').style.display='block';
  document.getElementById('page-seats').style.display='none';
}

async function selectShow(time,btn){
  currentShow=time;selectedSeats=[];
  document.querySelectorAll('.show-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const r=await fetch(`/seats/${currentMovie.id}/${time}`);
  const seats=await r.json();
  renderSeats(seats);
}

function renderSeats(seats){
  const g=document.getElementById('seat-grid');
  g.innerHTML='<div class="screen"></div><div class="screen-label">SCREEN</div>';
  seats.forEach((booked,i)=>{
    const b=document.createElement('button');
    b.className='seat '+(booked?'booked':(selectedSeats.includes(i)?'selected':'available'));
    b.textContent=i+1;
    if(!booked)b.onclick=()=>toggleSeat(i,seats);
    g.appendChild(b);
  });
  updateSelInfo();
}

function toggleSeat(i,seats){
  const idx=selectedSeats.indexOf(i);
  if(idx===-1)selectedSeats.push(i);
  else selectedSeats.splice(idx,1);
  renderSeats(seats);
}

function updateSelInfo(){
  document.getElementById('sel-count').textContent=selectedSeats.length;
  document.getElementById('sel-seats').textContent=selectedSeats.length?selectedSeats.map(i=>i+1).join(', '):'None';
}

async function bookSeats(e){
  e.preventDefault();
  if(!currentShow)return toast('Please select a show time','err');
  if(!selectedSeats.length)return toast('Please select at least one seat','err');
  const name=document.getElementById('inp-name').value.trim();
  const phone=document.getElementById('inp-phone').value.trim();
  const r=await fetch('/book',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({movieId:currentMovie.id,showTime:currentShow,seats:selectedSeats,name,phone})});
  const d=await r.json();
  if(d.success){
    toast(`Booked seats ${selectedSeats.map(i=>i+1).join(', ')} successfully!`);
    selectedSeats=[];
    const sr=await fetch(`/seats/${currentMovie.id}/${currentShow}`);
    renderSeats(await sr.json());
    document.getElementById('inp-name').value='';
    document.getElementById('inp-phone').value='';
  }else toast(d.error,'err');
}

function toast(msg,type=''){
  const t=document.getElementById('toast');
  t.textContent=msg;t.className='toast '+(type==='err'?'err':'')+' show';
  setTimeout(()=>t.classList.remove('show'),3000);
}

loadMovies();