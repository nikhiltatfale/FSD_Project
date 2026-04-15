// ============================================================
// admin.js - Admin Panel Logic
// ============================================================

// ============================================================
// INIT - Check session on load
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/admin/check');
    const data = await res.json();
    if (data.loggedIn) {
      showDashboard();
    } else {
      showLoginScreen();
    }
  } catch (e) {
    showLoginScreen();
  }
});

// ============================================================
// SHOW / HIDE SCREENS
// ============================================================
function showLoginScreen() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminDashboard').style.display = 'none';
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminDashboard').style.display = 'flex';
  loadStats();
  loadOrders();
  loadMenuAdmin();
}

// ============================================================
// ADMIN LOGIN
// ============================================================
async function doLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value.trim();
  const errorEl = document.getElementById('loginError');

  if (!username || !password) {
    errorEl.textContent = 'Please enter username and password.';
    return;
  }

  try {
    const res = await fetch('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.success) {
      showDashboard();
    } else {
      errorEl.textContent = data.message || 'Invalid credentials.';
    }
  } catch (e) {
    errorEl.textContent = 'Server error. Please try again.';
  }
}

// ============================================================
// ADMIN LOGOUT
// ============================================================
async function doLogout() {
  await fetch('/admin/logout', { method: 'POST' });
  showLoginScreen();
}

// ============================================================
// SECTION NAVIGATION
// ============================================================
function showSection(section, el) {
  // Hide all sections
  document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
  // Remove active from all links
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

  // Show target section
  document.getElementById(`sec-${section}`).style.display = 'block';
  if (el) el.classList.add('active');

  // Refresh data
  if (section === 'dashboard') loadStats();
  if (section === 'orders') loadOrders();
  if (section === 'menu') loadMenuAdmin();
}

// ============================================================
// LOAD STATS
// ============================================================
async function loadStats() {
  try {
    const res = await fetch('/admin/stats');
    const data = await res.json();
    if (!data.success) return;
    const s = data.stats;

    document.getElementById('statTotal').textContent = s.totalOrders;
    document.getElementById('statRevenue').textContent = `₹${s.totalRevenue.toLocaleString()}`;
    document.getElementById('statPending').textContent = s.pendingOrders;
    document.getElementById('statDelivered').textContent = s.deliveredOrders;
    document.getElementById('mostOrderedItem').textContent =
      s.mostOrdered ? `${s.mostOrdered.name} (×${s.mostOrdered.count})` : '—';
  } catch (e) {
    console.error('Stats load error:', e);
  }
}

// ============================================================
// LOAD ORDERS TABLE
// ============================================================
async function loadOrders() {
  try {
    const res = await fetch('/orders');
    const data = await res.json();
    if (!data.success) return;

    const tbody = document.getElementById('ordersBody');
    if (!data.orders.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="no-data">No orders yet</td></tr>`;
      return;
    }

    tbody.innerHTML = data.orders.slice().reverse().map(order => {
      // Format items
      const itemsText = order.items.map(i => `${i.name} ×${i.quantity}`).join(', ');
      // Format timestamp
      const ts = new Date(order.timestamp);
      const timeStr = ts.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

      return `
        <tr>
          <td><strong>${order.orderId}</strong></td>
          <td>${order.customerName}</td>
          <td>${order.phone}</td>
          <td style="max-width:200px;white-space:normal;font-size:0.82rem">${itemsText}</td>
          <td><strong>₹${order.total}</strong></td>
          <td>${order.paymentMethod}</td>
          <td style="white-space:nowrap;font-size:0.82rem">${timeStr}</td>
          <td>
            <span class="badge-${order.status === 'Delivered' ? 'delivered' : 'pending'}">
              ${order.status}
            </span>
          </td>
          <td>
            ${order.status === 'Pending'
              ? `<button class="btn-success" onclick="updateOrderStatus('${order.orderId}', 'Delivered')">✓ Deliver</button>`
              : `<button class="btn-danger" onclick="updateOrderStatus('${order.orderId}', 'Pending')">↩ Pending</button>`
            }
          </td>
        </tr>
      `;
    }).join('');
  } catch (e) {
    console.error('Orders load error:', e);
  }
}

// ============================================================
// UPDATE ORDER STATUS
// ============================================================
async function updateOrderStatus(orderId, status) {
  try {
    const res = await fetch(`/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      loadOrders();
      loadStats();
    }
  } catch (e) {
    alert('Failed to update order status.');
  }
}

// ============================================================
// DOWNLOAD ORDERS JSON
// ============================================================
function downloadOrders() {
  window.location.href = '/admin/download';
}

// ============================================================
// ADMIN MENU MANAGEMENT
// ============================================================

let adminMenu = []; // local copy for editing

async function loadMenuAdmin() {
  try {
    const res = await fetch('/admin/menu');
    const data = await res.json();
    if (!data.success) return;
    adminMenu = data.menu;
    renderMenuTable(adminMenu);
  } catch (e) {
    console.error('Menu load error:', e);
  }
}

function renderMenuTable(items) {
  const tbody = document.getElementById('menuBody');
  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="no-data">No menu items found</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => `
    <tr>
      <td>
        <img class="menu-thumb" src="${item.image}"
          onerror="this.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&q=50'"
          alt="${item.name}" />
      </td>
      <td><strong>${item.name}</strong></td>
      <td>${item.category}</td>
      <td>₹${item.price}</td>
      <td style="max-width:200px;font-size:0.85rem">${item.description}</td>
      <td>
        <button class="btn-secondary" style="margin-right:6px" onclick="editMenuItem('${item.id}')">Edit</button>
        <button class="btn-danger" onclick="deleteMenuItem('${item.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

// ---- Show Add Form ----
function showMenuForm() {
  document.getElementById('menuFormTitle').textContent = 'Add New Item';
  document.getElementById('editItemId').value = '';
  clearMenuForm();
  document.getElementById('menuFormCard').style.display = 'block';
  document.getElementById('menuFormCard').scrollIntoView({ behavior: 'smooth' });
}

function hideMenuForm() {
  document.getElementById('menuFormCard').style.display = 'none';
  clearMenuForm();
}

function clearMenuForm() {
  document.getElementById('mName').value = '';
  document.getElementById('mCategory').value = '';
  document.getElementById('mPrice').value = '';
  document.getElementById('mImage').value = '';
  document.getElementById('mDesc').value = '';
  document.getElementById('menuFormError').textContent = '';
}

// ---- Edit Item - Prefill form ----
function editMenuItem(itemId) {
  const item = adminMenu.find(m => m.id === itemId);
  if (!item) return;

  document.getElementById('menuFormTitle').textContent = 'Edit Item';
  document.getElementById('editItemId').value = item.id;
  document.getElementById('mName').value = item.name;
  document.getElementById('mCategory').value = item.category;
  document.getElementById('mPrice').value = item.price;
  document.getElementById('mImage').value = item.image || '';
  document.getElementById('mDesc').value = item.description;
  document.getElementById('menuFormCard').style.display = 'block';
  document.getElementById('menuFormCard').scrollIntoView({ behavior: 'smooth' });
}

// ---- Save (Add or Edit) ----
async function saveMenuItem() {
  const editId = document.getElementById('editItemId').value;
  const name = document.getElementById('mName').value.trim();
  const category = document.getElementById('mCategory').value;
  const price = document.getElementById('mPrice').value;
  const image = document.getElementById('mImage').value.trim();
  const description = document.getElementById('mDesc').value.trim();
  const errorEl = document.getElementById('menuFormError');

  // Validate
  if (!name) { errorEl.textContent = 'Item name is required.'; return; }
  if (!category) { errorEl.textContent = 'Please select a category.'; return; }
  if (!price || isNaN(price) || parseFloat(price) <= 0) { errorEl.textContent = 'Enter a valid price.'; return; }
  if (!description) { errorEl.textContent = 'Description is required.'; return; }
  errorEl.textContent = '';

  const payload = { name, category, price: parseFloat(price), image, description };

  try {
    let res, data;
    if (editId) {
      // Edit existing
      res = await fetch(`/admin/menu/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      // Add new
      res = await fetch('/admin/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    data = await res.json();
    if (data.success) {
      hideMenuForm();
      loadMenuAdmin();
    } else {
      errorEl.textContent = data.message || 'Save failed.';
    }
  } catch (e) {
    errorEl.textContent = 'Server error. Please try again.';
  }
}

// ---- Delete Item ----
async function deleteMenuItem(itemId) {
  if (!confirm('Delete this menu item? This cannot be undone.')) return;

  try {
    const res = await fetch(`/admin/menu/${itemId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      loadMenuAdmin();
    } else {
      alert('Failed to delete item: ' + data.message);
    }
  } catch (e) {
    alert('Server error while deleting.');
  }
}