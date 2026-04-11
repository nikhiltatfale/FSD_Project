// ── State ────────────────────────────────────────
let allCustomers = [];

// ── Navigation ───────────────────────────────────
const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.section');

function switchSection(name) {
  sections.forEach(s => s.classList.remove('active'));
  navBtns.forEach(b => b.classList.remove('active'));
  document.getElementById(`section-${name}`)?.classList.add('active');
  document.querySelectorAll(`[data-section="${name}"]`).forEach(b => b.classList.add('active'));

  if (name === 'dashboard') loadDashboard();
  if (name === 'customers') loadCustomers();
  if (name === 'milk-entry') { loadCustomerDropdowns(); setTodayDate(); }
  if (name === 'monthly') { loadCustomerDropdowns(); setCurrentMonth(); }
  if (name === 'payments') loadPayments();
}

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.dataset.section;
    switchSection(section);
    closeMobileNav();
  });
});

// Hamburger
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
hamburger.addEventListener('click', () => mobileNav.classList.toggle('open'));
function closeMobileNav() { mobileNav.classList.remove('open'); }

// ── Toast ────────────────────────────────────────
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  toast.style.display = 'block';
  setTimeout(() => toast.style.display = 'none', 3000);
}

// ── Helpers ──────────────────────────────────────
function setTodayDate() {
  const d = document.getElementById('milkDate');
  if (d) d.value = new Date().toISOString().split('T')[0];
}

function setCurrentMonth() {
  const now = new Date();
  const m = document.getElementById('monthlyMonth');
  const y = document.getElementById('monthlyYear');
  if (m) m.value = now.getMonth() + 1;
  if (y) y.value = now.getFullYear();
}

function fmt(n) { return parseFloat(n).toFixed(2); }
function fmtRs(n) { return '₹' + parseFloat(n).toFixed(2); }

// ── Customer Management ──────────────────────────
async function loadCustomers() {
  try {
    const res = await fetch('/customers');
    allCustomers = await res.json();
    renderCustomerTable(allCustomers);
    document.getElementById('customerCountBadge').textContent = allCustomers.length;
  } catch { showToast('Failed to load customers', 'error'); }
}

function renderCustomerTable(customers) {
  const body = document.getElementById('customerBody');
  if (!customers.length) {
    body.innerHTML = '<tr><td colspan="6" class="empty-state">No customers added yet</td></tr>';
    return;
  }
  body.innerHTML = customers.map((c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${c.name}</strong><br><small style="color:#5f6368">${c.address}</small></td>
      <td>${c.phone}</td>
      <td><span class="badge">${c.milkType === 'Cow' ? '🐄' : '🐃'} ${c.milkType}</span></td>
      <td>${fmtRs(c.rate)}/L</td>
      <td>
        <div class="action-btns">
          <button class="icon-btn edit" title="Edit" onclick="editCustomer(${c.id})"><i class="fas fa-edit"></i></button>
          <button class="icon-btn del" title="Delete" onclick="deleteCustomer(${c.id}, '${c.name}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Add / Edit Customer
document.getElementById('customerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const editId = document.getElementById('editCustomerId').value;
  const data = {
    name: document.getElementById('custName').value.trim(),
    phone: document.getElementById('custPhone').value.trim(),
    address: document.getElementById('custAddress').value.trim(),
    milkType: document.getElementById('custMilkType').value,
    rate: document.getElementById('custRate').value
  };

  if (!/^\d{10}$/.test(data.phone)) {
    showToast('Phone must be exactly 10 digits', 'error'); return;
  }
  if (parseFloat(data.rate) <= 0) {
    showToast('Rate must be greater than 0', 'error'); return;
  }

  try {
    const url = editId ? `/editCustomer/${editId}` : '/addCustomer';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const json = await res.json();
    if (!res.ok) { showToast(json.error, 'error'); return; }
    showToast(editId ? 'Customer updated!' : 'Customer added!', 'success');
    document.getElementById('customerForm').reset();
    cancelEdit();
    loadCustomers();
  } catch { showToast('Error saving customer', 'error'); }
});

function editCustomer(id) {
  const c = allCustomers.find(x => x.id === id);
  if (!c) return;
  document.getElementById('editCustomerId').value = c.id;
  document.getElementById('custName').value = c.name;
  document.getElementById('custPhone').value = c.phone;
  document.getElementById('custAddress').value = c.address;
  document.getElementById('custMilkType').value = c.milkType;
  document.getElementById('custRate').value = c.rate;
  document.getElementById('customerFormTitle').textContent = 'Edit Customer';
  document.getElementById('customerSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Update Customer';
  document.getElementById('cancelEditBtn').style.display = 'inline-flex';
  document.getElementById('customerForm').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
  document.getElementById('editCustomerId').value = '';
  document.getElementById('customerForm').reset();
  document.getElementById('customerFormTitle').textContent = 'Add Customer';
  document.getElementById('customerSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Save Customer';
  document.getElementById('cancelEditBtn').style.display = 'none';
}

async function deleteCustomer(id, name) {
  if (!confirm(`Delete customer "${name}"? This cannot be undone.`)) return;
  try {
    const res = await fetch(`/deleteCustomer/${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('Customer deleted', 'success'); loadCustomers(); }
    else showToast('Failed to delete', 'error');
  } catch { showToast('Error deleting customer', 'error'); }
}

// ── Customer Dropdowns ───────────────────────────
async function loadCustomerDropdowns() {
  try {
    const res = await fetch('/customers');
    allCustomers = await res.json();
    const opts = allCustomers.map(c => `<option value="${c.id}">${c.name} (${c.milkType})</option>`).join('');
    const emptyOpt = '<option value="">Select customer</option>';

    const milkSel = document.getElementById('milkCustomer');
    const monthlySel = document.getElementById('monthlyCustomer');
    if (milkSel) milkSel.innerHTML = emptyOpt + opts;
    if (monthlySel) monthlySel.innerHTML = emptyOpt + opts;
  } catch {}
}

// ── Milk Entry ───────────────────────────────────
const milkMorning = document.getElementById('milkMorning');
const milkEvening = document.getElementById('milkEvening');
const milkCustomerSel = document.getElementById('milkCustomer');

function updateCalcPreview() {
  const customerId = milkCustomerSel?.value;
  const morning = parseFloat(milkMorning?.value) || 0;
  const evening = parseFloat(milkEvening?.value) || 0;
  const total = morning + evening;
  const customer = allCustomers.find(c => c.id === parseInt(customerId));
  const amount = customer ? total * customer.rate : 0;
  document.getElementById('prevTotal').textContent = fmt(total) + ' L';
  document.getElementById('prevAmount').textContent = fmtRs(amount);
}

milkMorning?.addEventListener('input', updateCalcPreview);
milkEvening?.addEventListener('input', updateCalcPreview);
milkCustomerSel?.addEventListener('change', updateCalcPreview);

document.getElementById('milkForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const customerId = document.getElementById('milkCustomer').value;
  const morning = document.getElementById('milkMorning').value;
  const evening = document.getElementById('milkEvening').value;
  const date = document.getElementById('milkDate').value;

  if (!customerId) { showToast('Select a customer', 'error'); return; }
  if (parseFloat(morning) < 0 || parseFloat(evening) < 0) {
    showToast('Quantities cannot be negative', 'error'); return;
  }
  if (parseFloat(morning) === 0 && parseFloat(evening) === 0) {
    showToast('Enter at least morning or evening quantity', 'error'); return;
  }

  try {
    const res = await fetch('/addMilk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, morning, evening, date })
    });
    const json = await res.json();
    if (!res.ok) { showToast(json.error, 'error'); return; }
    showToast(`Entry added! Total: ${fmt(json.record.totalMilk)}L = ${fmtRs(json.record.totalAmount)}`, 'success');
    document.getElementById('milkForm').reset();
    setTodayDate();
    updateCalcPreview();
  } catch { showToast('Error adding milk entry', 'error'); }
});

// ── Dashboard ────────────────────────────────────
async function loadDashboard() {
  try {
    const [todayRes, customersRes, paymentsRes] = await Promise.all([
      fetch('/today'),
      fetch('/customers'),
      fetch('/payments')
    ]);
    const today = await todayRes.json();
    const customers = await customersRes.json();
    const payments = await paymentsRes.json();

    document.getElementById('statTotalMilk').textContent = fmt(today.totalMilk) + ' L';
    document.getElementById('statTotalAmount').textContent = fmtRs(today.totalAmount);
    document.getElementById('statCustomerCount').textContent = customers.length;

    const totalPending = payments.reduce((sum, p) => sum + Math.max(p.pending, 0), 0);
    document.getElementById('statPending').textContent = fmtRs(totalPending);

    const body = document.getElementById('todayBody');
    if (!today.records.length) {
      body.innerHTML = '<tr><td colspan="6" class="empty-state">No entries today</td></tr>';
      return;
    }
    body.innerHTML = today.records.map(r => `
      <tr>
        <td><strong>${r.customerName}</strong></td>
        <td>${r.milkType === 'Cow' ? '🐄' : '🐃'} ${r.milkType}</td>
        <td>${fmt(r.morning)} L</td>
        <td>${fmt(r.evening)} L</td>
        <td><strong>${fmt(r.totalMilk)} L</strong></td>
        <td style="color:var(--green);font-weight:600">${fmtRs(r.totalAmount)}</td>
      </tr>
    `).join('');
  } catch { showToast('Failed to load dashboard', 'error'); }
}

// ── Monthly Report ───────────────────────────────
async function loadMonthly() {
  const customerId = document.getElementById('monthlyCustomer').value;
  const month = document.getElementById('monthlyMonth').value;
  const year = document.getElementById('monthlyYear').value;

  if (!customerId) { showToast('Select a customer', 'error'); return; }

  try {
    const res = await fetch(`/monthly/${customerId}?month=${month}&year=${year}`);
    const data = await res.json();
    if (!res.ok) { showToast(data.error, 'error'); return; }

    const result = document.getElementById('monthlyResult');
    result.style.display = 'block';

    document.getElementById('monthlyStats').innerHTML = `
      <div class="stat-card blue">
        <div class="stat-icon"><i class="fas fa-tint"></i></div>
        <div class="stat-info">
          <span class="stat-value">${fmt(data.totalMilk)} L</span>
          <span class="stat-label">Total Milk</span>
        </div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><i class="fas fa-rupee-sign"></i></div>
        <div class="stat-info">
          <span class="stat-value">${fmtRs(data.totalAmount)}</span>
          <span class="stat-label">Total Amount</span>
        </div>
      </div>
      <div class="stat-card orange">
        <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
        <div class="stat-info">
          <span class="stat-value">${fmtRs(data.paid)}</span>
          <span class="stat-label">Paid</span>
        </div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon"><i class="fas fa-exclamation-circle"></i></div>
        <div class="stat-info">
          <span class="stat-value">${fmtRs(Math.max(data.pending, 0))}</span>
          <span class="stat-label">Pending</span>
        </div>
      </div>
    `;

    const body = document.getElementById('monthlyBody');
    if (!data.records.length) {
      body.innerHTML = '<tr><td colspan="5" class="empty-state">No records for this period</td></tr>';
      return;
    }
    body.innerHTML = data.records.map(r => `
      <tr>
        <td>${r.date}</td>
        <td>${fmt(r.morning)} L</td>
        <td>${fmt(r.evening)} L</td>
        <td><strong>${fmt(r.totalMilk)} L</strong></td>
        <td style="color:var(--green);font-weight:600">${fmtRs(r.totalAmount)}</td>
      </tr>
    `).join('');
  } catch { showToast('Failed to load report', 'error'); }
}

// ── Payments ─────────────────────────────────────
async function loadPayments() {
  try {
    const res = await fetch('/payments');
    const payments = await res.json();
    const body = document.getElementById('paymentBody');

    if (!payments.length) {
      body.innerHTML = '<tr><td colspan="7" class="empty-state">No payment records</td></tr>';
      return;
    }
    body.innerHTML = payments.map(p => {
      const badgeClass = p.status === 'Paid' ? 'badge-paid' : p.status === 'Partial' ? 'badge-partial' : 'badge-unpaid';
      return `
        <tr>
          <td><strong>${p.customerName}</strong></td>
          <td>${p.phone}</td>
          <td>${fmtRs(p.totalDue)}</td>
          <td style="color:var(--green)">${fmtRs(p.paid)}</td>
          <td style="color:var(--red)">${fmtRs(Math.max(p.pending, 0))}</td>
          <td><span class="badge ${badgeClass}">${p.status}</span></td>
          <td>
            <button class="icon-btn pay" title="Record Payment" onclick="openPaymentModal(${p.customerId})">
              <i class="fas fa-plus"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch { showToast('Failed to load payments', 'error'); }
}

function openPaymentModal(customerId) {
  document.getElementById('payCustomerId').value = customerId;
  document.getElementById('payAmount').value = '';
  document.getElementById('payStatus').value = 'Paid';
  document.getElementById('paymentModal').style.display = 'flex';
}

function closePaymentModal() {
  document.getElementById('paymentModal').style.display = 'none';
}

async function submitPayment() {
  const customerId = document.getElementById('payCustomerId').value;
  const amount = document.getElementById('payAmount').value;
  const status = document.getElementById('payStatus').value;

  if (!amount || parseFloat(amount) < 0) {
    showToast('Enter a valid amount', 'error'); return;
  }

  try {
    const res = await fetch('/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, amount, status })
    });
    if (res.ok) {
      showToast('Payment recorded!', 'success');
      closePaymentModal();
      loadPayments();
    } else showToast('Failed to record payment', 'error');
  } catch { showToast('Error recording payment', 'error'); }
}

// ── Init ─────────────────────────────────────────
loadDashboard();