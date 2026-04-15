// ============================================================
// script.js - Customer Frontend Logic
// ============================================================

// ---- STATE ----
let menuItems = [];   // All menu items from backend
let cart = [];        // Cart: [{id, name, price, quantity}]
let activeCategory = 'All';

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  loadMenu();
  setupCategoryTabs();
});

// ============================================================
// LOAD MENU FROM BACKEND
// ============================================================
async function loadMenu() {
  try {
    const res = await fetch('/menu');
    const data = await res.json();
    if (!data.success) throw new Error('Failed to load menu');
    menuItems = data.menu;
    renderMenu(menuItems);
  } catch (err) {
    document.getElementById('menuGrid').innerHTML =
      `<div class="loader" style="color:#e63946">Failed to load menu. Is the server running?</div>`;
    console.error('Menu load error:', err);
  }
}

// ============================================================
// RENDER MENU CARDS
// ============================================================
function renderMenu(items) {
  const grid = document.getElementById('menuGrid');
  if (!items.length) {
    grid.innerHTML = `<div class="loader">No items in this category.</div>`;
    return;
  }

  grid.innerHTML = items.map(item => {
    const catClass = {
      'Veg': 'cat-veg', 'Non-Veg': 'cat-nonveg',
      'Drinks': 'cat-drinks', 'Desserts': 'cat-desserts'
    }[item.category] || '';

    const catIcon = {
      'Veg': '🥦', 'Non-Veg': '🍗', 'Drinks': '🥤', 'Desserts': '🍮'
    }[item.category] || '';

    return `
      <div class="menu-card">
        <img class="menu-card-img" src="${item.image}" alt="${item.name}"
             onerror="this.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=60'" />
        <div class="menu-card-body">
          <div class="menu-card-cat ${catClass}">${catIcon} ${item.category}</div>
          <div class="menu-card-name">${item.name}</div>
          <div class="menu-card-desc">${item.description}</div>
          <div class="menu-card-footer">
            <span class="menu-card-price">₹${item.price}</span>
            <button class="add-btn" onclick="addToCart('${item.id}')" id="addbtn-${item.id}">
              Add +
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// CATEGORY FILTER TABS
// ============================================================
function setupCategoryTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCategory = tab.dataset.cat;

      const filtered = activeCategory === 'All'
        ? menuItems
        : menuItems.filter(i => i.category === activeCategory);
      renderMenu(filtered);
    });
  });
}

// ============================================================
// CART MANAGEMENT
// ============================================================

// Add item to cart
function addToCart(itemId) {
  const menuItem = menuItems.find(m => m.id === itemId);
  if (!menuItem) return;

  const existing = cart.find(c => c.id === itemId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: itemId, name: menuItem.name, price: menuItem.price, quantity: 1 });
  }

  // Visual feedback on button
  const btn = document.getElementById(`addbtn-${itemId}`);
  if (btn) {
    btn.textContent = '✓ Added';
    btn.classList.add('added');
    setTimeout(() => {
      btn.textContent = 'Add +';
      btn.classList.remove('added');
    }, 1000);
  }

  updateCartUI();
}

// Remove item from cart
function removeFromCart(itemId) {
  cart = cart.filter(c => c.id !== itemId);
  updateCartUI();
}

// Change quantity
function changeQty(itemId, delta) {
  const item = cart.find(c => c.id === itemId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(itemId);
    return;
  }
  updateCartUI();
}

// Calculate total
function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Update cart badge and sidebar
function updateCartUI() {
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  document.getElementById('cartCount').textContent = totalItems;

  const cartItemsEl = document.getElementById('cartItems');
  const cartFooter = document.getElementById('cartFooter');

  if (!cart.length) {
    cartItemsEl.innerHTML = `<p class="cart-empty">Your cart is empty</p>`;
    cartFooter.style.display = 'none';
    return;
  }

  cartItemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div>
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${item.price} × ${item.quantity} = <strong>₹${item.price * item.quantity}</strong></div>
      </div>
      <div class="qty-controls">
        <button class="qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
        <span class="qty-value">${item.quantity}</span>
        <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
      </div>
    </div>
  `).join('');

  cartFooter.style.display = 'block';
  document.getElementById('cartTotal').textContent = `₹${getCartTotal()}`;
}

// Toggle cart sidebar
function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
}

// ============================================================
// CHECKOUT
// ============================================================

function showCheckout() {
  if (!cart.length) return;

  // Build summary
  const summaryEl = document.getElementById('summaryItems');
  summaryEl.innerHTML = cart.map(item => `
    <div class="summary-item">
      <span>${item.name} × ${item.quantity}</span>
      <span>₹${item.price * item.quantity}</span>
    </div>
  `).join('');
  document.getElementById('summaryTotal').textContent = `₹${getCartTotal()}`;

  document.getElementById('formError').textContent = '';
  document.getElementById('checkoutOverlay').classList.add('open');
  toggleCart(); // close cart sidebar
}

function closeCheckout() {
  document.getElementById('checkoutOverlay').classList.remove('open');
}

// ============================================================
// PLACE ORDER
// ============================================================
async function placeOrder() {
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
  const errorEl = document.getElementById('formError');

  // Client-side validation
  if (!name || name.length < 2) {
    errorEl.textContent = 'Please enter your full name.'; return;
  }
  if (!phone || !/^\d{10}$/.test(phone)) {
    errorEl.textContent = 'Enter a valid 10-digit phone number.'; return;
  }
  if (!address || address.length < 5) {
    errorEl.textContent = 'Please enter a complete delivery address.'; return;
  }
  if (!cart.length) {
    errorEl.textContent = 'Your cart is empty.'; return;
  }

  errorEl.textContent = '';

  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.textContent = 'Placing Order…';

  const payload = {
    customerName: name,
    phone,
    address,
    paymentMethod,
    items: cart.map(i => ({ id: i.id, quantity: i.quantity }))
  };

  try {
    const res = await fetch('/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      errorEl.textContent = data.errors ? data.errors.join(' ') : 'Order failed. Please try again.';
      btn.disabled = false;
      btn.textContent = 'Place Order 🚀';
      return;
    }

    // Success
    closeCheckout();
    cart = [];
    updateCartUI();
    clearCheckoutForm();

    document.getElementById('successOrderId').textContent = data.orderId;
    document.getElementById('successOverlay').classList.add('open');

  } catch (err) {
    errorEl.textContent = 'Network error. Please check your connection.';
    console.error('Order error:', err);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Place Order 🚀';
  }
}

function clearCheckoutForm() {
  document.getElementById('custName').value = '';
  document.getElementById('custPhone').value = '';
  document.getElementById('custAddress').value = '';
  document.querySelector('input[name="payment"][value="COD"]').checked = true;
}

// ============================================================
// SUCCESS MODAL
// ============================================================
function closeSuccess() {
  document.getElementById('successOverlay').classList.remove('open');
}