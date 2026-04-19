let currentUser = null;
let editingId = null;

async function login() {
  const username = document.getElementById('username').value.trim();
  const role = document.getElementById('role').value;
  if (!username) return alert('Enter username');
  const res = await fetch('/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, role }) });
  currentUser = await res.json();
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('main').style.display = 'block';
  document.getElementById('user-info').textContent = `${currentUser.username} (${currentUser.role})`;
  setupNav();
  showTab('products');
}

function logout() {
  currentUser = null;
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('main').style.display = 'none';
}

function setupNav() {
  document.getElementById('btn-cart').style.display = currentUser.role === 'buyer' ? '' : 'none';
  document.getElementById('btn-orders').style.display = currentUser.role === 'buyer' ? '' : 'none';
  document.getElementById('btn-seller').style.display = currentUser.role === 'seller' ? '' : 'none';
  document.getElementById('btn-admin').style.display = currentUser.role === 'admin' ? '' : 'none';
}

function showTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  if (name === 'products') loadProducts();
  if (name === 'cart') loadCart();
  if (name === 'orders') loadOrders();
  if (name === 'seller') loadSellerProducts();
}

async function loadProducts() {
  const products = await fetch('/products').then(r => r.json());
  const div = document.getElementById('product-list');
  if (!products.length) { div.innerHTML = '<p>No products yet.</p>'; return; }
  div.innerHTML = products.map(p => `
    <div class="card">
      <h4>${p.name} - ₹${p.price}</h4>
      <p>${p.desc}</p>
      <small>Seller: ${p.seller}</small>
      ${currentUser.role === 'buyer' ? `<br><button class="btn-sm" onclick="addToCart(${p.id})">Add to Cart</button>` : ''}
    </div>`).join('');
}

async function addToCart(productId) {
  await fetch('/cart/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: currentUser.username, productId }) });
  alert('Added to cart');
}

async function loadCart() {
  const items = await fetch(`/cart/${currentUser.username}`).then(r => r.json());
  const div = document.getElementById('cart-list');
  if (!items.length) { div.innerHTML = '<p>Cart is empty.</p>'; return; }
  div.innerHTML = items.map((p, i) => `
    <div class="card">
      <h4>${p.name} - ₹${p.price}</h4>
      <button class="btn-sm btn-danger" onclick="removeFromCart(${i})">Remove</button>
    </div>`).join('');
}

async function removeFromCart(index) {
  await fetch('/cart/remove', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: currentUser.username, index }) });
  loadCart();
}

async function checkout() {
  const res = await fetch('/cart/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: currentUser.username }) });
  const data = await res.json();
  if (data.error) return alert(data.error);
  alert(`Order placed! Total: ₹${data.total}`);
  loadCart();
}

async function loadOrders() {
  const orders = await fetch(`/orders/${currentUser.username}`).then(r => r.json());
  const div = document.getElementById('orders-list');
  if (!orders.length) { div.innerHTML = '<p>No orders yet.</p>'; return; }
  div.innerHTML = orders.map(o => `
    <div class="card">
      <h4>Order #${o.id} - ₹${o.total}</h4>
      <p>${o.items.map(i => i.name).join(', ')}</p>
    </div>`).join('');
}

async function loadSellerProducts() {
  const all = await fetch('/products').then(r => r.json());
  const mine = all.filter(p => p.seller === currentUser.username);
  const div = document.getElementById('seller-products');
  editingId = null;
  document.getElementById('p-name').value = '';
  document.getElementById('p-price').value = '';
  document.getElementById('p-desc').value = '';
  document.querySelector('#tab-seller button').textContent = 'Add Product';
  if (!mine.length) { div.innerHTML = '<p>No products yet.</p>'; return; }
  div.innerHTML = mine.map(p => `
    <div class="card">
      <h4>${p.name} - ₹${p.price}</h4>
      <p>${p.desc}</p>
      <button class="btn-sm" onclick="editProduct(${p.id}, '${p.name}', ${p.price}, '${p.desc}')">Edit</button>
      <button class="btn-sm btn-danger" onclick="deleteProduct(${p.id})">Delete</button>
    </div>`).join('');
}

async function addProduct() {
  const name = document.getElementById('p-name').value.trim();
  const price = document.getElementById('p-price').value;
  const desc = document.getElementById('p-desc').value.trim();
  if (!name || !price) return alert('Name and price required');
  if (editingId) {
    await fetch(`/products/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, price, desc, seller: currentUser.username }) });
    editingId = null;
  } else {
    await fetch('/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, price, desc, seller: currentUser.username }) });
  }
  loadSellerProducts();
}

function editProduct(id, name, price, desc) {
  editingId = id;
  document.getElementById('p-name').value = name;
  document.getElementById('p-price').value = price;
  document.getElementById('p-desc').value = desc;
  document.querySelector('#tab-seller button').textContent = 'Update Product';
}

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  await fetch(`/products/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seller: currentUser.username }) });
  loadSellerProducts();
}

async function adminLoad(type) {
  const div = document.getElementById('admin-content');
  if (type === 'users') {
    const users = await fetch('/admin/users').then(r => r.json());
    div.innerHTML = `<table><tr><th>Username</th><th>Role</th></tr>${users.map(u => `<tr><td>${u.username}</td><td>${u.role}</td></tr>`).join('')}</table>`;
  } else if (type === 'products') {
    const products = await fetch('/admin/products').then(r => r.json());
    div.innerHTML = `<table><tr><th>Name</th><th>Price</th><th>Seller</th><th>Action</th></tr>${products.map(p => `<tr><td>${p.name}</td><td>₹${p.price}</td><td>${p.seller}</td><td><button class="btn-sm btn-danger" onclick="adminDeleteProduct(${p.id})">Delete</button></td></tr>`).join('')}</table>`;
  } else if (type === 'orders') {
    const orders = await fetch('/admin/orders').then(r => r.json());
    div.innerHTML = `<table><tr><th>Order#</th><th>Buyer</th><th>Items</th><th>Total</th></tr>${orders.map(o => `<tr><td>${o.id}</td><td>${o.buyer}</td><td>${o.items.map(i => i.name).join(', ')}</td><td>₹${o.total}</td></tr>`).join('')}</table>`;
  }
}

async function adminDeleteProduct(id) {
  if (!confirm('Delete product?')) return;
  await fetch(`/admin/product/${id}`, { method: 'DELETE' });
  adminLoad('products');
}