async function load(){
  const[mr,br]=await Promise.all([fetch('/movies'),fetch('/bookings')]);
  const[movies,bookings]=await Promise.all([mr.json(),br.json()]);
  document.getElementById('movie-count').textContent=`(${movies.length})`;
  document.getElementById('admin-movie-list').innerHTML=`
    <div style="overflow-x:auto"><table>
      <thead><tr><th>Poster</th><th>Title</th><th>Lang</th><th>Duration</th><th>Action</th></tr></thead>
      <tbody>${movies.map(m=>`
        <tr>
          <td><img src="${m.poster}" style="width:40px;height:56px;object-fit:cover;border-radius:3px" onerror="this.style.display='none'"></td>
          <td>${m.title}</td><td>${m.language}</td><td>${m.duration}</td>
          <td><button class="btn btn-red" style="width:auto;padding:6px 12px;font-size:.78rem" onclick="deleteMovie(${m.id})">Delete</button></td>
        </tr>`).join('')}
      </tbody>
    </table></div>`;
  document.getElementById('bookings-body').innerHTML=bookings.length
    ?bookings.map(b=>`<tr><td>${b.id}</td><td>${b.movieTitle}</td><td>${b.showTime}</td><td>${b.seats.join(', ')}</td><td>${b.name}</td><td>${b.phone}</td><td>${b.time}</td></tr>`).join('')
    :'<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px">No bookings yet</td></tr>';
}

async function addMovie(){
  const title=document.getElementById('a-title').value.trim();
  if(!title)return toast('Title is required','err');
  const r=await fetch('/addMovie',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    title,
    poster:document.getElementById('a-poster').value.trim(),
    duration:document.getElementById('a-duration').value.trim(),
    language:document.getElementById('a-lang').value.trim()||'Hindi'
  })});
  const d=await r.json();
  if(d.id){
    toast('Movie added!');
    ['a-title','a-poster','a-duration','a-lang'].forEach(id=>document.getElementById(id).value='');
    load();
  }else toast(d.error,'err');
}

async function deleteMovie(id){
  if(!confirm('Delete this movie?'))return;
  const r=await fetch(`/deleteMovie/${id}`,{method:'DELETE'});
  const d=await r.json();
  d.success?toast('Movie deleted')&&load():toast(d.error,'err');
  load();
}

async function resetAll(){
  if(!confirm('This will clear ALL seat bookings and booking records. Continue?'))return;
  const r=await fetch('/reset',{method:'POST'});
  const d=await r.json();
  d.success?toast('All data reset!'):toast('Reset failed','err');
  load();
}

function toast(msg,type=''){
  const t=document.getElementById('toast');
  t.textContent=msg;t.className='toast '+(type==='err'?'err':'')+' show';
  setTimeout(()=>t.classList.remove('show'),3000);
  return true;
}

load();