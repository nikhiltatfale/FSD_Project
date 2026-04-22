let properties = [];
let isAdmin = false;

async function init() {
  await loadProperties();
  renderProperties();
}

async function loadProperties() {
  const r = await fetch('/api/properties');
  properties = await r.json();
  updateLocationFilter();
}

function updateLocationFilter() {
  const sel = document.getElementById('filter-location');
  const locs = [...new Set(properties.map(p => p.location))];
  sel.innerHTML = '<option value="">All Locations</option>' + locs.map(l => `<option value="${l}">${l}</option>`).join('');
}

function getFiltered() {
  const q = document.getElementById('search-input').value.toLowerCase();
  const type = document.getElementById('filter-type').value;
  const loc = document.getElementById('filter-location').value;
  const price = document.getElementById('filter-price').value;
  return properties.filter(p => {
    if (q && !p.title.toLowerCase().includes(q) && !p.location.toLowerCase().includes(q)) return false;
    if (type && p.type !== type) return false;
    if (loc && p.location !== loc) return false;
    if (price) {
      const [min, max] = price.split('-').map(Number);
      if (p.price < min || p.price > max) return false;
    }
    return true;
  });
}

function fmt(p) {
  return p.type === 'rent' ? `₹${p.price.toLocaleString()}/mo` : `₹${p.price.toLocaleString()}`;
}

function renderProperties() {
  const list = getFiltered();
  const grid = document.getElementById('prop-grid');
  document.getElementById('prop-count').textContent = `${list.length} propert${list.length !== 1 ? 'ies' : 'y'} found`;
  if (!list.length) {
    grid.innerHTML = '<div class="no-props" style="grid-column:1/-1"><h3>No properties found</h3><p>Try adjusting your filters</p></div>';
    return;
  }
  grid.innerHTML = list.map(p => `
    <div class="card" onclick="openDetail(${p.id})">
      ${p.images && p.images[0] ? `<img class="card-img" src="${p.images[0]}" alt="${p.title}" loading="lazy">` : '<div class="card-img-placeholder">🏠</div>'}
      <div class="card-body">
        <div class="card-tags"><span class="tag tag-${p.type}">${p.type}</span></div>
        <h3>${p.title}</h3>
        <div class="card-location">📍 ${p.location}</div>
        <div class="card-price">${fmt(p)} ${p.type==='rent'?'<span>per month</span>':''}</div>
        <div class="card-specs">
          <div class="spec">🛏 ${p.bedrooms} bd</div>
          <div class="spec">🚿 ${p.bathrooms} ba</div>
          <div class="spec">📐 ${p.area} sqft</div>
        </div>
      </div>
    </div>`).join('');
}

function openDetail(id) {
  const p = properties.find(x => x.id === id);
  if (!p) return;
  document.getElementById('d-title').textContent = p.title;
  document.getElementById('d-tag').textContent = p.type;
  document.getElementById('d-tag').className = `tag tag-${p.type}`;
  document.getElementById('d-price').textContent = fmt(p);
  document.getElementById('d-loc').textContent = '📍 ' + p.location;
  document.getElementById('d-beds').textContent = p.bedrooms + ' Bedrooms';
  document.getElementById('d-baths').textContent = p.bathrooms + ' Bathrooms';
  document.getElementById('d-area').textContent = p.area + ' sqft';
  document.getElementById('d-addr').textContent = p.location;
  document.getElementById('d-desc').textContent = p.description;
  document.getElementById('inq-prop-id').value = p.id;
  const gallery = document.getElementById('d-gallery');
  gallery.innerHTML = (p.images && p.images.length ? p.images : []).map((img, i) => `<img src="${img}" class="${i===0?'active':''}" onclick="this.parentNode.querySelectorAll('img').forEach(x=>x.classList.remove('active'));this.classList.add('active')">`).join('');
  document.getElementById('detail-overlay').classList.add('active');
}

async function submitInquiry() {
  const name = document.getElementById('inq-name').value.trim();
  const email = document.getElementById('inq-email').value.trim();
  const msg = document.getElementById('inq-msg').value.trim();
  const propertyId = document.getElementById('inq-prop-id').value;
  if (!name || !email || !msg) return toast('Please fill all fields', true);
  await fetch('/api/inquiry', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({propertyId, name, email, message: msg}) });
  toast('Inquiry sent successfully!');
  document.getElementById('inq-name').value = '';
  document.getElementById('inq-email').value = '';
  document.getElementById('inq-msg').value = '';
  document.getElementById('detail-overlay').classList.remove('active');
}

function openAdminLogin() {
  if (isAdmin) { showAdminPanel(); return; }
  document.getElementById('login-overlay').classList.add('active');
  document.getElementById('login-err').style.display = 'none';
}

async function doLogin() {
  const username = document.getElementById('login-user').value;
  const password = document.getElementById('login-pass').value;
  const r = await fetch('/api/admin/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({username, password}) });
  if (r.ok) {
    isAdmin = true;
    document.getElementById('login-overlay').classList.remove('active');
    showAdminPanel();
  } else {
    document.getElementById('login-err').style.display = 'block';
  }
}

function showAdminPanel() {
  document.getElementById('main-content').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'block';
  document.getElementById('admin-nav-btn').textContent = 'Dashboard';
  loadAdminData();
}

function logout() {
  isAdmin = false;
  document.getElementById('main-content').style.display = 'block';
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('admin-nav-btn').textContent = 'Admin';
}

async function loadAdminData() {
  await loadProperties();
  renderAdminTable();
  const ri = await fetch('/api/inquiries');
  const inqs = await ri.json();
  document.getElementById('inq-badge').textContent = inqs.length;
  document.getElementById('inq-table-body').innerHTML = inqs.length
    ? inqs.map(i => `<tr><td>${i.propertyId}</td><td>${i.name}</td><td>${i.email}</td><td>${i.message}</td></tr>`).join('')
    : '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:30px">No inquiries yet</td></tr>';
}

function renderAdminTable() {
  document.getElementById('admin-table-body').innerHTML = properties.length
    ? properties.map(p => `<tr>
        <td><strong>${p.title}</strong></td>
        <td><span class="tag tag-${p.type}">${p.type}</span></td>
        <td>${p.location}</td>
        <td>${fmt(p)}</td>
        <td><div class="action-btns">
          <button class="btn btn-outline" style="padding:6px 14px;font-size:0.8rem" onclick="editProperty(${p.id})">Edit</button>
          <button class="btn btn-danger" style="padding:6px 14px;font-size:0.8rem" onclick="deleteProperty(${p.id})">Delete</button>
        </div></td>
      </tr>`).join('')
    : '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:30px">No properties</td></tr>';
}

function editProperty(id) {
  const p = properties.find(x => x.id === id);
  if (!p) return;
  document.getElementById('edit-id').value = p.id;
  document.getElementById('f-title').value = p.title;
  document.getElementById('f-location').value = p.location;
  document.getElementById('f-price').value = p.price;
  document.getElementById('f-type').value = p.type;
  document.getElementById('f-beds').value = p.bedrooms;
  document.getElementById('f-baths').value = p.bathrooms;
  document.getElementById('f-area').value = p.area;
  document.getElementById('f-images').value = (p.images || []).join(', ');
  document.getElementById('f-desc').value = p.description;
  document.getElementById('form-title').textContent = 'Edit Property';
  showTab('tab-add');
}

function resetForm() {
  document.getElementById('edit-id').value = '';
  document.getElementById('f-title').value = '';
  document.getElementById('f-location').value = '';
  document.getElementById('f-price').value = '';
  document.getElementById('f-type').value = 'buy';
  document.getElementById('f-beds').value = '';
  document.getElementById('f-baths').value = '';
  document.getElementById('f-area').value = '';
  document.getElementById('f-images').value = '';
  document.getElementById('f-desc').value = '';
  document.getElementById('form-title').textContent = 'Add New Property';
  showTab('tab-props');
}

async function submitProperty() {
  const id = document.getElementById('edit-id').value;
  const body = {
    title: document.getElementById('f-title').value.trim(),
    location: document.getElementById('f-location').value.trim(),
    price: Number(document.getElementById('f-price').value),
    type: document.getElementById('f-type').value,
    bedrooms: Number(document.getElementById('f-beds').value),
    bathrooms: Number(document.getElementById('f-baths').value),
    area: Number(document.getElementById('f-area').value),
    images: document.getElementById('f-images').value,
    description: document.getElementById('f-desc').value.trim()
  };
  if (!body.title || !body.location || !body.price) return toast('Please fill required fields', true);
  const url = id ? `/api/properties/${id}` : '/api/properties';
  const method = id ? 'PUT' : 'POST';
  await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
  toast(id ? 'Property updated!' : 'Property added!');
  resetForm();
  await loadAdminData();
  renderAdminTable();
}

async function deleteProperty(id) {
  if (!confirm('Delete this property?')) return;
  await fetch(`/api/properties/${id}`, { method: 'DELETE' });
  toast('Property deleted');
  await loadAdminData();
}

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  const idx = ['tab-props','tab-add','tab-inq'].indexOf(tabId);
  document.querySelectorAll('.tab')[idx].classList.add('active');
}

function closeOverlay(e, id) {
  if (e.target.id === id) document.getElementById(id).classList.remove('active');
}

function toast(msg, err = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (err ? ' error' : '');
  setTimeout(() => t.className = 'toast', 3000);
}

init();