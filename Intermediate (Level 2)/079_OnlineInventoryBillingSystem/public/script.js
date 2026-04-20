let cart = [];
let isAdmin = false;
let logoClicks = 0;
let logoTimer = null;
let allProducts = [];

async function api(method, url, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
}

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (id === 'billing') { loadProducts(); document.querySelectorAll('.nav-btn')[0].classList.add('active'); }
  if (id === 'dashboard') loadDashboard();
  if (id === 'inventory') loadInventory();
  if (id === 'history') loadHistory();
}

document.getElementById('logoClick').addEventListener('click', () => {
  logoClicks++;
  clearTimeout(logoTimer);
  if (logoClicks >= 5) { logoClicks = 0; if (!isAdmin) document.getElementById('loginModal').style.display = 'flex'; }
  else logoTimer = setTimeout(() => logoClicks = 0, 1500);
});

document.getElementById('taxInput').addEventListener('input', updateCart);

async function loadProducts() {
  const q = document.getElementById('searchInput').value;
  const url = q ? `/search-product?q=${encodeURIComponent(q)}` : '/products';
  allProducts = await api('GET', url);
  renderProductList(allProducts);
}

function renderProductList(prods) {
  const el = document.getElementById('productList');
  if (!prods.length) { el.innerHTML = '<p class="empty">No products found</p>'; return; }
  el.innerHTML = prods.map(p => `
    <div class="prod-card${p.quantity < 5 ? ' low' : ''}" onclick="addToCart(${p.id})">
      <div class="p-name">${p.name}</div>
      <div class="p-cat">${p.category}</div>
      <div class="p-price">₹${p.price.toFixed(2)}</div>
      <div class="p-qty${p.quantity < 5 ? ' low-txt' : ''}">Stock: ${p.quantity}${p.quantity < 5 ? ' ⚠' : ''}</div>
      <button class="add-btn" onclick="event.stopPropagation();addToCart(${p.id})">+</button>
    </div>`).join('');
}

function searchProducts() { loadProducts(); }

function addToCart(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  if (p.quantity <= 0) return;
  const existing = cart.find(x => x.id === id);
  if (existing) {
    if (existing.quantity >= p.quantity) return;
    existing.quantity++;
  } else {
    cart.push({ id: p.id, name: p.name, price: p.price, quantity: 1, maxQty: p.quantity });
  }
  renderCart();
}

function changeQty(id, delta) {
  const item = cart.find(x => x.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) cart = cart.filter(x => x.id !== id);
  else if (item.quantity > item.maxQty) item.quantity = item.maxQty;
  renderCart();
}

function removeFromCart(id) { cart = cart.filter(x => x.id !== id); renderCart(); }

function renderCart() {
  const el = document.getElementById('cartItems');
  if (!cart.length) { el.innerHTML = '<p class="empty">Cart is empty</p>'; updateSummary(0, 0, 0); document.getElementById('genBillBtn').disabled = true; return; }
  el.innerHTML = cart.map(i => `
    <div class="cart-item">
      <div class="cart-item-top">
        <span class="cart-item-name">${i.name}</span>
        <span class="cart-item-price">₹${(i.price * i.quantity).toFixed(2)}</span>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="changeQty(${i.id},-1)">−</button>
        <span class="qty-display">${i.quantity}</span>
        <button class="qty-btn" onclick="changeQty(${i.id},1)">+</button>
        <span style="font-size:.78rem;color:var(--text2)">@ ₹${i.price}</span>
        <button class="remove-btn" onclick="removeFromCart(${i.id})">✕</button>
      </div>
    </div>`).join('');
  updateCart();
  document.getElementById('genBillBtn').disabled = false;
}

function updateCart() {
  const tax = parseFloat(document.getElementById('taxInput').value) || 0;
  const sub = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const taxAmt = sub * tax / 100;
  updateSummary(sub, taxAmt, sub + taxAmt);
  document.getElementById('taxPct').textContent = tax;
}

function updateSummary(sub, tax, grand) {
  document.getElementById('subtotalVal').textContent = '₹' + sub.toFixed(2);
  document.getElementById('taxVal').textContent = '₹' + tax.toFixed(2);
  document.getElementById('grandVal').textContent = '₹' + grand.toFixed(2);
}

async function generateBill() {
  const tax = parseFloat(document.getElementById('taxInput').value) || 0;
  const items = cart.map(i => ({ id: i.id, quantity: i.quantity }));
  const bill = await api('POST', '/create-bill', { items, tax });
  if (bill.error) { alert(bill.error); return; }
  printBill(bill);
  cart = [];
  renderCart();
  await loadProducts();
}

function printBill(bill) {
  const rows = bill.items.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>₹${i.price.toFixed(2)}</td><td>₹${i.subtotal.toFixed(2)}</td></tr>`).join('');
  const html = `<div style="font-family:monospace;max-width:400px;margin:0 auto;padding:20px">
    <h2 style="text-align:center;margin-bottom:4px">BillMaster Pro</h2>
    <p style="text-align:center;font-size:12px;margin-bottom:12px">${new Date(bill.date).toLocaleString()}</p>
    <p style="font-size:12px"><b>Bill No:</b> ${bill.billNumber}</p>
    <hr>
    <table style="width:100%;font-size:12px;border-collapse:collapse">
      <thead><tr><th style="text-align:left">Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <hr>
    <p style="text-align:right;font-size:12px">Subtotal: ₹${bill.subtotal.toFixed(2)}</p>
    <p style="text-align:right;font-size:12px">Tax (${bill.tax}%): ₹${bill.taxAmount.toFixed(2)}</p>
    <p style="text-align:right;font-size:14px"><b>Grand Total: ₹${bill.grandTotal.toFixed(2)}</b></p>
    <p style="text-align:center;font-size:11px;margin-top:16px">Thank you for your purchase!</p>
  </div>`;
  const w = window.open('', '_blank', 'width=500,height=600');
  w.document.write(`<html><body>${html}<script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`);
  w.document.close();
}

async function doLogin() {
  const username = document.getElementById('adminUser').value;
  const password = document.getElementById('adminPass').value;
  const res = await api('POST', '/admin-login', { username, password });
  if (res.success) {
    isAdmin = true;
    closeModal();
    document.getElementById('adminNav').style.display = 'flex';
    showSection('dashboard');
  } else {
    document.getElementById('loginErr').textContent = 'Invalid credentials';
  }
}

function adminLogout() {
  isAdmin = false;
  document.getElementById('adminNav').style.display = 'none';
  showSection('billing');
}

function closeModal() {
  document.getElementById('loginModal').style.display = 'none';
  document.getElementById('adminUser').value = '';
  document.getElementById('adminPass').value = '';
  document.getElementById('loginErr').textContent = '';
}

async function loadDashboard() {
  const d = await api('GET', '/dashboard');
  document.getElementById('dashGrid').innerHTML = `
    <div class="dash-card"><div class="dash-val">${d.totalProducts}</div><div class="dash-label">Total Products</div></div>
    <div class="dash-card"><div class="dash-val">${d.totalStock}</div><div class="dash-label">Total Stock Items</div></div>
    <div class="dash-card"><div class="dash-val">₹${d.salesToday.toFixed(2)}</div><div class="dash-label">Sales Today</div></div>
    <div class="dash-card"><div class="dash-val">${d.billsToday}</div><div class="dash-label">Bills Today</div></div>
    <div class="dash-card"><div class="dash-val" style="color:var(--warn)">${d.lowStock.length}</div><div class="dash-label">Low Stock Products</div></div>`;
  const tbody = document.querySelector('#lowStockTable tbody');
  tbody.innerHTML = d.lowStock.length ? d.lowStock.map(p => `<tr><td>${p.id}</td><td>${p.name}</td><td>${p.category}</td><td><span class="badge badge-warn">${p.quantity}</span></td></tr>`).join('') : '<tr><td colspan="4" class="empty">No low stock items</td></tr>';
}

async function loadInventory() {
  const q = document.getElementById('invSearch').value;
  const url = q ? `/search-product?q=${encodeURIComponent(q)}` : '/products';
  const prods = await api('GET', url);
  const tbody = document.querySelector('#inventoryTable tbody');
  tbody.innerHTML = prods.length ? prods.map(p => `
    <tr>
      <td>${p.id}</td><td>${p.name}</td><td>${p.category}</td>
      <td>₹${p.price.toFixed(2)}</td>
      <td>${p.quantity < 5 ? `<span class="badge badge-warn">${p.quantity} ⚠</span>` : p.quantity}</td>
      <td>
        <button class="tbl-btn edit" onclick="editProduct(${p.id},'${p.name.replace(/'/g,"\\'")}','${p.category}',${p.price},${p.quantity})">Edit</button>
        <button class="tbl-btn del" onclick="deleteProduct(${p.id})">Delete</button>
      </td>
    </tr>`).join('') : '<tr><td colspan="6" class="empty">No products found</td></tr>';
}

function openAddProduct() {
  document.getElementById('addProductForm').style.display = 'grid';
  document.getElementById('formTitle').textContent = 'Add Product';
  document.getElementById('editProductId').value = '';
  ['pName','pCategory','pPrice','pQty'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('prodErr').textContent = '';
}

function editProduct(id, name, cat, price, qty) {
  document.getElementById('addProductForm').style.display = 'grid';
  document.getElementById('formTitle').textContent = 'Edit Product';
  document.getElementById('editProductId').value = id;
  document.getElementById('pName').value = name;
  document.getElementById('pCategory').value = cat;
  document.getElementById('pPrice').value = price;
  document.getElementById('pQty').value = qty;
  document.getElementById('prodErr').textContent = '';
}

async function saveProduct() {
  const id = document.getElementById('editProductId').value;
  const name = document.getElementById('pName').value.trim();
  const category = document.getElementById('pCategory').value.trim();
  const price = document.getElementById('pPrice').value;
  const quantity = document.getElementById('pQty').value;
  if (!name || !price || quantity === '') { document.getElementById('prodErr').textContent = 'All fields required'; return; }
  const body = { name, category, price: Number(price), quantity: Number(quantity) };
  const res = id ? await api('PUT', `/edit-product/${id}`, body) : await api('POST', '/add-product', body);
  if (res.error) { document.getElementById('prodErr').textContent = res.error; return; }
  cancelForm();
  loadInventory();
}

function cancelForm() { document.getElementById('addProductForm').style.display = 'none'; }

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  await api('DELETE', `/delete-product/${id}`);
  loadInventory();
}

async function loadHistory() {
  const q = document.getElementById('billSearch').value;
  const url = q ? `/bills?q=${encodeURIComponent(q)}` : '/bills';
  const bills = await api('GET', url);
  const total = bills.reduce((s, b) => s + b.grandTotal, 0);
  document.getElementById('historyStats').innerHTML = `
    <div class="stat">Total Bills <span>${bills.length}</span></div>
    <div class="stat">Total Revenue <span>₹${total.toFixed(2)}</span></div>`;
  const tbody = document.querySelector('#historyTable tbody');
  tbody.innerHTML = bills.length ? [...bills].reverse().map(b => `
    <tr>
      <td><b>${b.billNumber}</b></td>
      <td>${new Date(b.date).toLocaleString()}</td>
      <td>${b.items.length} item(s)</td>
      <td>₹${b.subtotal.toFixed(2)}</td>
      <td>${b.tax}% (₹${b.taxAmount.toFixed(2)})</td>
      <td><b>₹${b.grandTotal.toFixed(2)}</b></td>
    </tr>`).join('') : '<tr><td colspan="6" class="empty">No bills found</td></tr>';
}

loadProducts();