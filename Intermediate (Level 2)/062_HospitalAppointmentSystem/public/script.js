async function bookAppointment() {
  const body = {
    name: document.getElementById('name').value,
    age: document.getElementById('age').value,
    problem: document.getElementById('problem').value,
    doctor: document.getElementById('doctor').value,
    date: document.getElementById('date').value,
    time: document.getElementById('time').value
  };
  const res = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  const msg = document.getElementById('bookMsg');
  msg.style.color = res.ok ? 'green' : 'red';
  msg.textContent = res.ok ? `✅ Booked! Your ID: ${data.id}` : `❌ ${data.error}`;
}

async function searchAppointment() {
  const name = document.getElementById('searchName').value;
  const res = await fetch(`/api/appointments/${encodeURIComponent(name)}`);
  const data = await res.json();
  const div = document.getElementById('searchResult');
  if (!res.ok) { div.innerHTML = `<p style="color:red">❌ ${data.error}</p>`; return; }
  div.innerHTML = data.map(a => `<p>ID: ${a.id} | Doctor: ${a.doctor} | Date: ${a.date} | Time: ${a.time} | Problem: ${a.problem}</p>`).join('');
}

async function loadAll() {
  const res = await fetch('/api/appointments');
  const data = await res.json();
  document.getElementById('totalCount').textContent = `Total: ${data.length}`;
  document.getElementById('adminBody').innerHTML = data.map(a =>
    `<tr><td>${a.id}</td><td>${a.name}</td><td>${a.age}</td><td>${a.problem}</td><td>${a.doctor}</td><td>${a.date}</td><td>${a.time}</td>
    <td><button class="del" onclick="deleteAppt(${a.id})">Delete</button></td></tr>`
  ).join('');
}

async function deleteAppt(id) {
  await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
  loadAll();
}