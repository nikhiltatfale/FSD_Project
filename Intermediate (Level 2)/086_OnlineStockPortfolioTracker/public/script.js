let adminLoggedIn = false;

async function loadStocks() {
  const res = await fetch('/stocks');
  const data = await res.json();
  renderTable(data);
  renderSummary(data);
}

function fmt(n) { return '₹' + (+n).toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2}); }

function renderTable(stocks) {
  const tb = document.getElementById('tbody');
  const empty = document.getElementById('empty');
  const tbl = document.getElementById('tbl');
  if (!stocks.length) { empty.style.display='block'; tbl.style.display='none'; return; }
  empty.style.display='none'; tbl.style.display='table';
  tb.innerHTML = stocks.map(s => {
    const inv = s.qty * s.buyPrice;
    const val = s.qty * s.currentPrice;
    const pl = val - inv;
    const cls = pl >= 0 ? 'profit' : 'loss';
    const sign = pl >= 0 ? '+' : '';
    return `<tr>
      <td><span class="badge">${s.name}</span></td>
      <td>${s.user}</td>
      <td>${s.qty}</td>
      <td>${fmt(s.buyPrice)}</td>
      <td>${fmt(s.currentPrice)}</td>
      <td>${fmt(inv)}</td>
      <td>${fmt(val)}</td>
      <td class="${cls}">${sign}${fmt(pl)}</td>
      <td>${s.date}</td>
      <td><button class="del-btn" onclick="deleteStock(${s.id})">✕</button></td>
    </tr>`;
  }).join('');
}

function renderSummary(stocks) {
  const inv = stocks.reduce((a,s) => a + s.qty*s.buyPrice, 0);
  const val = stocks.reduce((a,s) => a + s.qty*s.currentPrice, 0);
  const pl = val - inv;
  document.getElementById('s-invested').textContent = fmt(inv);
  document.getElementById('s-current').textContent = fmt(val);
  const pel = document.getElementById('s-pl');
  pel.textContent = (pl>=0?'+':'') + fmt(pl);
  pel.style.color = pl>=0 ? 'var(--green)' : 'var(--red)';
  document.getElementById('s-count').textContent = stocks.length;
}

async function addStock() {
  const name = document.getElementById('f-name').value.trim();
  const qty = document.getElementById('f-qty').value;
  const buyPrice = document.getElementById('f-buy').value;
  const currentPrice = document.getElementById('f-cur').value;
  const date = document.getElementById('f-date').value;
  const user = document.getElementById('f-user').value.trim() || 'User';
  const err = document.getElementById('form-err');
  if (!name||!qty||!buyPrice||!currentPrice) { err.textContent='Please fill all required fields.'; return; }
  err.textContent='';
  const res = await fetch('/addStock', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,qty,buyPrice,currentPrice,date,user})});
  if (res.ok) {
    ['f-name','f-qty','f-buy','f-cur','f-date'].forEach(id => document.getElementById(id).value='');
    loadStocks();
  } else {
    const d = await res.json();
    err.textContent = d.error;
  }
}

async function deleteStock(id) {
  await fetch('/delete/'+id, {method:'DELETE'});
  loadStocks();
}

function showAdmin() { document.getElementById('admin-modal').classList.remove('hidden'); }
function closeAdmin() { document.getElementById('admin-modal').classList.add('hidden'); }

async function adminLogin() {
  const u = document.getElementById('a-user').value;
  const p = document.getElementById('a-pass').value;
  const res = await fetch('/admin/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});
  if (res.ok) {
    adminLoggedIn = true;
    document.getElementById('admin-login').classList.add('hidden');
    document.getElementById('admin-panel').classList.remove('hidden');
    loadAdmin();
  } else {
    document.getElementById('a-err').textContent = 'Invalid credentials.';
  }
}

async function loadAdmin() {
  const res = await fetch('/admin/stocks');
  const {stocks, logs} = await res.json();
  const tb = document.getElementById('a-tbody');
  tb.innerHTML = stocks.map(s => {
    const pl = s.qty*s.currentPrice - s.qty*s.buyPrice;
    const cls = pl>=0?'profit':'loss';
    return `<tr>
      <td><span class="badge">${s.name}</span></td>
      <td>${s.user}</td>
      <td>${s.qty}</td>
      <td>${fmt(s.buyPrice)}</td>
      <td>${fmt(s.currentPrice)}</td>
      <td class="${cls}">${(pl>=0?'+':'')+fmt(pl)}</td>
      <td>${s.date}</td>
      <td><button class="del-btn" onclick="adminDelete(${s.id})">✕</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--muted)">No data</td></tr>';
  document.getElementById('logs').innerHTML = logs.slice().reverse().map(l=>`<div>${l}</div>`).join('') || 'No logs yet.';
}

async function adminDelete(id) {
  await fetch('/delete/'+id, {method:'DELETE'});
  loadAdmin(); loadStocks();
}

async function resetAll() {
  if (!confirm('Reset all portfolio data?')) return;
  await fetch('/admin/reset', {method:'DELETE'});
  loadAdmin(); loadStocks();
}

loadStocks();