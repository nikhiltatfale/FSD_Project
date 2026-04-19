const API = '';

async function req(method, url, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(API + url, opts);
  return r.json();
}

function msg(elId, text, ok) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = text;
  el.className = 'msg ' + (ok ? 'msg-ok' : 'msg-err');
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 3000);
}

function fmtDate(d) {
  return new Date(d).toLocaleString();
}

// ─── INDEX PAGE ───────────────────────────────────────────────────────────────

async function initIndex() {
  await loadUserProducts();
  document.getElementById('stock-in-form').addEventListener('submit', async e => {
    e.preventDefault();
    const productId = document.getElementById('si-product').value;
    const quantity = +document.getElementById('si-qty').value;
    const data = await req('POST', '/stock-in', { productId, quantity });
    if (data.error) return msg('user-msg', data.error, false);
    msg('user-msg', `Stock IN recorded. New qty: ${data.quantity}`, true);
    loadUserProducts();
  });
  document.getElementById('stock-out-form').addEventListener('submit', async e => {
    e.preventDefault();
    const productId = document.getElementById('so-product').value;
    const quantity = +document.getElementById('so-qty').value;
    const data = await req('POST', '/stock-out', { productId, quantity });
    if (data.error) return msg('user-msg', data.error, false);
    msg('user-msg', `Stock OUT recorded. New qty: ${data.quantity}`, true);
    loadUserProducts();
  });
}

async function loadUserProducts() {
  const products = await req('GET', '/products');
  renderUserTable(products);
  populateSelects(products);
}

function populateSelects(products) {
  ['si-product', 'so-product'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const val = el.value;
    el.innerHTML = products.map(p => `<option value="${p.id}">${p.name} (${p.category})</option>`).join('');
    if (val) el.value = val;
  });
}

function renderUserTable(products) {
  const tb = document.getElementById('inv-table');
  if (!tb) return;
  tb.innerHTML = products.length ? products.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>₹${p.price}</td>
      <td>${p.quantity <= 5 ? `<span class="badge badge-low">${p.quantity} LOW</span>` : p.quantity}</td>
      <td>${fmtDate(p.lastUpdated)}</td>
    </tr>`).join('') : '<tr><td colspan="6" style="color:#555;text-align:center">No products</td></tr>';
}

// ─── ADMIN PAGE ───────────────────────────────────────────────────────────────

const ADMIN_PASS = 'admin123';
let editId = null;

async function initAdmin() {
  const pass = prompt('Enter admin password:');
  if (pass !== ADMIN_PASS) {
    document.body.innerHTML = '<div style="padding:40px;color:#ff3344;font-family:monospace">ACCESS DENIED</div>';
    return;
  }
  loadAdminProducts();
  loadLogs();

  document.getElementById('add-form').addEventListener('submit', async e => {
    e.preventDefault();
    const body = getFormData();
    const data = await req('POST', '/add-product', body);
    if (data.error) return msg('admin-msg', data.error, false);
    msg('admin-msg', `Product "${data.name}" added.`, true);
    e.target.reset();
    loadAdminProducts();
  });

  document.getElementById('edit-save').addEventListener('click', async () => {
    const body = {
      name: document.getElementById('e-name').value,
      category: document.getElementById('e-category').value,
      price: +document.getElementById('e-price').value,
      quantity: +document.getElementById('e-quantity').value
    };
    const data = await req('PUT', `/update-product/${editId}`, body);
    if (data.error) return msg('admin-msg', data.error, false);
    msg('admin-msg', `Product updated.`, true);
    closeModal();
    loadAdminProducts();
  });

  document.getElementById('edit-cancel').addEventListener('click', closeModal);
}

function getFormData() {
  return {
    name: document.getElementById('a-name').value,
    category: document.getElementById('a-category').value,
    price: +document.getElementById('a-price').value,
    quantity: +document.getElementById('a-quantity').value
  };
}

async function loadAdminProducts() {
  const products = await req('GET', '/products');
  const tb = document.getElementById('admin-table');
  tb.innerHTML = products.length ? products.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>₹${p.price}</td>
      <td>${p.quantity <= 5 ? `<span class="badge badge-low">${p.quantity} LOW</span>` : p.quantity}</td>
      <td>${fmtDate(p.lastUpdated)}</td>
      <td>
        <button class="btn btn-blue btn-sm" onclick="openEdit(${p.id},'${p.name}','${p.category}',${p.price},${p.quantity})">Edit</button>
        <button class="btn btn-red btn-sm" onclick="deleteProduct(${p.id})">Del</button>
      </td>
    </tr>`).join('') : '<tr><td colspan="7" style="color:#555;text-align:center">No products</td></tr>';
}

function openEdit(id, name, category, price, quantity) {
  editId = id;
  document.getElementById('e-name').value = name;
  document.getElementById('e-category').value = category;
  document.getElementById('e-price').value = price;
  document.getElementById('e-quantity').value = quantity;
  document.getElementById('edit-modal').classList.add('open');
}

function closeModal() {
  document.getElementById('edit-modal').classList.remove('open');
}

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  const data = await req('DELETE', `/delete-product/${id}`);
  if (data.error) return msg('admin-msg', data.error, false);
  msg('admin-msg', 'Product deleted.', true);
  loadAdminProducts();
}

async function loadLogs() {
  const logs = await req('GET', '/logs');
  const tb = document.getElementById('logs-table');
  tb.innerHTML = logs.length ? [...logs].reverse().map(l => `
    <tr>
      <td>${l.productName}</td>
      <td><span class="badge ${l.action === 'IN' ? 'badge-in' : 'badge-out'}">${l.action}</span></td>
      <td>${l.quantity}</td>
      <td>${fmtDate(l.date)}</td>
    </tr>`).join('') : '<tr><td colspan="4" style="color:#555;text-align:center">No logs yet</td></tr>';
}

window.openEdit = openEdit;
window.deleteProduct = deleteProduct;