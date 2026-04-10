// ===== STATE =====
const API = 'http://localhost:3000/api';
let allItems = [];
let cart = [];
let activeCategory = 'All';
let searchQuery = '';

// ===== DOM REFS =====
const menuGrid    = document.getElementById('menuGrid');
const cartBtn     = document.getElementById('cartBtn');
const cartClose   = document.getElementById('cartClose');
const cartOverlay = document.getElementById('cartOverlay');
const cartSidebar = document.getElementById('cartSidebar');
const cartCount   = document.getElementById('cartCount');
const cartBody    = document.getElementById('cartBody');
const cartList    = document.getElementById('cartList');
const cartEmpty   = document.getElementById('cartEmpty');
const cartTotal   = document.getElementById('cartTotal');
const cartFooter  = document.getElementById('cartFooter');
const orderBtn    = document.getElementById('orderBtn');
const noResults   = document.getElementById('noResults');
const itemCount   = document.getElementById('itemCount');
const sectionTitle= document.getElementById('sectionTitle');
const searchInput = document.getElementById('searchInput');
const filterBtns  = document.querySelectorAll('.filter-btn');
const popupOverlay= document.getElementById('popupOverlay');
const popupMsg    = document.getElementById('popupMsg');
const popupClose  = document.getElementById('popupClose');
const header      = document.getElementById('header');

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  fetchMenu();
  setupEventListeners();
});

// ===== FETCH MENU =====
async function fetchMenu() {
  try {
    const res = await fetch(`${API}/menu`);
    if (!res.ok) throw new Error('Failed to load menu');
    allItems = await res.json();
    renderMenu();
  } catch (err) {
    menuGrid.innerHTML = `<div class="loading-state" style="color:#e05555">
      <p>⚠️ Could not load menu. Is the server running?</p>
      <button onclick="fetchMenu()" style="margin-top:12px;padding:10px 24px;background:var(--gold);color:var(--bg);border:none;border-radius:50px;cursor:pointer;font-weight:600;">Retry</button>
    </div>`;
  }
}

// ===== RENDER MENU =====
function renderMenu() {
  let items = allItems;

  if (activeCategory !== 'All') {
    items = items.filter(i => i.category === activeCategory);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
    );
  }

  menuGrid.innerHTML = '';
  noResults.classList.add('hidden');

  if (items.length === 0) {
    noResults.classList.remove('hidden');
    itemCount.textContent = '';
    return;
  }

  itemCount.textContent = `${items.length} dish${items.length !== 1 ? 'es' : ''}`;

  items.forEach((item, idx) => {
    const inCart = cart.some(c => c.id === item.id);
    const card = document.createElement('div');
    card.className = 'dish-card';
    card.style.animationDelay = `${idx * 0.05}s`;
    card.innerHTML = `
      <div class="card-img-wrap">
        <img class="card-img" src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'" />
        <span class="card-category">${item.category}</span>
      </div>
      <div class="card-body">
        <h3 class="card-name">${item.name}</h3>
        <p class="card-desc">${item.description}</p>
        <div class="card-footer">
          <span class="card-price"><small>₹</small>${item.price}</span>
          <button class="add-btn ${inCart ? 'in-cart' : ''}" data-id="${item.id}">
            ${inCart ? 'In Cart ✓' : 'Add to Cart'}
          </button>
        </div>
      </div>`;
    menuGrid.appendChild(card);
  });

  // Add-to-cart listeners
  menuGrid.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', () => addToCart(parseInt(btn.dataset.id)));
  });
}

// ===== CART OPERATIONS =====
function addToCart(id) {
  const item = allItems.find(i => i.id === id);
  if (!item) return;
  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  updateCartUI();
  renderMenu();
  // Brief cart bounce
  cartBtn.animate([{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 300 });
}

function changeQty(id, delta) {
  const idx = cart.findIndex(c => c.id === id);
  if (idx === -1) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) {
    cart.splice(idx, 1);
    renderMenu();
  }
  updateCartUI();
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  updateCartUI();
  renderMenu();
}

function updateCartUI() {
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);

  // Count badge
  cartCount.textContent = totalQty;
  cartCount.classList.toggle('visible', totalQty > 0);

  // Total
  cartTotal.textContent = `₹${total}`;

  // Order button
  orderBtn.disabled = cart.length === 0;

  // Empty state
  if (cart.length === 0) {
    cartEmpty.style.display = 'flex';
    cartList.style.display = 'none';
  } else {
    cartEmpty.style.display = 'none';
    cartList.style.display = 'flex';
  }

  // Render cart items
  cartList.innerHTML = '';
  cart.forEach(item => {
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `
      <img class="cart-item-img" src="${item.image}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'" />
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${item.price} × ${item.qty} = ₹${item.price * item.qty}</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" data-action="dec" data-id="${item.id}">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" data-action="inc" data-id="${item.id}">+</button>
        <button class="remove-btn" data-id="${item.id}">🗑</button>
      </div>`;
    cartList.appendChild(li);
  });

  cartList.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      changeQty(id, btn.dataset.action === 'inc' ? 1 : -1);
    });
  });

  cartList.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(parseInt(btn.dataset.id)));
  });
}

// ===== PLACE ORDER =====
async function placeOrder() {
  if (cart.length === 0) return;
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  try {
    orderBtn.disabled = true;
    orderBtn.textContent = 'Placing Order…';
    const res = await fetch(`${API}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart.map(c => ({ id: c.id, name: c.name, qty: c.qty, price: c.price })), total })
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    closeCart();
    cart = [];
    updateCartUI();
    renderMenu();
    popupMsg.textContent = `Order #${data.orderId} received! Your food is being prepared with love. 🍽️`;
    popupOverlay.classList.add('open');
  } catch {
    alert('⚠️ Failed to place order. Please try again.');
  } finally {
    orderBtn.disabled = false;
    orderBtn.textContent = 'Place Order';
  }
}

// ===== CART OPEN / CLOSE =====
function openCart() {
  cartSidebar.classList.add('open');
  cartOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartSidebar.classList.remove('open');
  cartOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Cart
  cartBtn.addEventListener('click', openCart);
  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  // Order
  orderBtn.addEventListener('click', placeOrder);

  // Popup
  popupClose.addEventListener('click', () => popupOverlay.classList.remove('open'));

  // Filters
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;
      sectionTitle.textContent = activeCategory === 'All' ? 'Our Menu' : activeCategory;
      renderMenu();
    });
  });

  // Search
  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = searchInput.value.trim();
      renderMenu();
    }, 250);
  });

  // Sticky header class
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  });
}