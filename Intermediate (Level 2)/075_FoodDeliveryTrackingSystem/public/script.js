let token = null;
const STATUSES = ["Order Placed","Preparing Food","Out for Delivery","Delivered"];

function show(s) {
  document.querySelectorAll('.section').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(x => x.classList.remove('active'));
  document.getElementById(s === 'login' || s === 'dash' ? s + 'Section' : s + 'Section').classList.add('active');
  if (s === 'order' || s === 'track') {
    document.querySelectorAll('.nav-btn')[s === 'order' ? 0 : 1].classList.add('active');
  }
  if (s === 'dash') loadOrders();
}

async function placeOrder() {
  const name = document.getElementById('oName').value.trim();
  const phone = document.getElementById('oPhone').value.trim();
  const address = document.getElementById('oAddress').value.trim();
  const item = document.getElementById('oItem').value.trim();
  const quantity = document.getElementById('oQty').value.trim();
  const res = document.getElementById('orderResult');
  res.innerHTML = '';
  const r = await fetch('/order', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,phone,address,item,quantity})});
  const d = await r.json();
  if (!r.ok) { res.innerHTML = `<div class="err">${d.error}</div>`; return; }
  res.innerHTML = `<div class="result-box"><div class="label">Order Confirmed</div><div class="oid">${d.orderId}</div><div style="color:var(--muted);font-size:.8rem;margin-top:8px">Save this ID to track your order</div></div>`;
  ['oName','oPhone','oAddress','oItem','oQty'].forEach(id => document.getElementById(id).value = '');
}

async function trackOrder() {
  const id = document.getElementById('trackId').value.trim();
  const res = document.getElementById('trackResult');
  if (!id) { res.innerHTML = '<div class="err">Enter an Order ID</div>'; return; }
  const r = await fetch('/track/' + id);
  const d = await r.json();
  if (!r.ok) { res.innerHTML = `<div class="err">${d.error}</div>`; return; }
  const si = STATUSES.indexOf(d.status);
  const dots = STATUSES.map((s, i) => {
    const cls = i < si ? 'done' : i === si ? 'active' : '';
    const line = i < STATUSES.length - 1 ? `<div class="step-line${i < si ? ' done' : ''}"></div>` : '';
    return `<div class="step"><div class="step-dot ${cls}">${i < si ? '✓' : i + 1}</div><div class="step-label ${cls}">${s}</div></div>${line}`;
  }).join('');
  res.innerHTML = `<div class="result-box"><div class="label">Order ID</div><div class="oid">${id}</div><div style="margin:4px 0 16px;color:var(--muted);font-size:.8rem">${d.item} × ${d.quantity} · ${d.name}</div><div class="steps">${dots}</div><div style="font-size:.8rem;color:var(--muted)">Delivering to: ${d.address}</div></div>`;
}

async function adminLogin() {
  const username = document.getElementById('aUser').value;
  const password = document.getElementById('aPass').value;
  const r = await fetch('/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
  const d = await r.json();
  if (!r.ok) { document.getElementById('loginErr').innerHTML = `<div class="err">${d.error}</div>`; return; }
  token = d.token;
  show('dash');
}

function adminLogout() { token = null; show('order'); }

async function loadOrders() {
  if (!token) return;
  const r = await fetch('/orders', {headers:{auth: token}});
  if (!r.ok) { adminLogout(); return; }
  const orders = await r.json();
  const search = (document.getElementById('searchId')?.value || '').toUpperCase();
  const entries = Object.entries(orders).filter(([id]) => !search || id.includes(search));
  const el = document.getElementById('ordersTable');
  if (!entries.length) { el.innerHTML = '<div class="empty">No orders found</div>'; return; }
  el.innerHTML = `<table><thead><tr><th>Order ID</th><th>Name</th><th>Item</th><th>Qty</th><th>Address</th><th>Status</th><th>Action</th></tr></thead><tbody>${entries.map(([id, o]) => `<tr><td><span style="color:var(--accent);font-weight:500">${id}</span></td><td>${o.name}<br><span style="color:var(--muted);font-size:.7rem">${o.phone}</span></td><td>${o.item}</td><td>${o.quantity}</td><td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${o.address}</td><td><span class="badge ${badgeCls(o.status)}">${o.status}</span></td><td style="display:flex;gap:6px;align-items:center"><select onchange="updateStatus('${id}',this.value)">${STATUSES.map(s=>`<option${s===o.status?' selected':''}>${s}</option>`).join('')}</select><button class="del-btn" onclick="deleteOrder('${id}')">✕</button></td></tr>`).join('')}</tbody></table>`;
}

function badgeCls(s) {
  if (s === 'Order Placed') return 'badge-placed';
  if (s === 'Preparing Food') return 'badge-preparing';
  if (s === 'Out for Delivery') return 'badge-out';
  return 'badge-delivered';
}

async function updateStatus(id, status) {
  await fetch('/update/' + id, {method:'PUT',headers:{'Content-Type':'application/json',auth:token},body:JSON.stringify({status})});
  loadOrders();
}

async function deleteOrder(id) {
  if (!confirm('Delete order ' + id + '?')) return;
  await fetch('/delete/' + id, {method:'DELETE',headers:{auth:token}});
  loadOrders();
}