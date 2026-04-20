let allHotels = [];
let currentHotelId = null;
let selectedRating = 0;
let adminToken = null;
let footerClicks = 0;

async function api(method, url, body, token) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers['x-admin-token'] = token;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
}

async function loadHotels() {
  document.getElementById('hotelGrid').innerHTML = '<div class="loading">Loading hotels…</div>';
  allHotels = await api('GET', '/hotels');
  renderHotels(allHotels);
}

function starsHtml(rating, max = 5) {
  let s = '';
  for (let i = 1; i <= max; i++) s += `<span style="color:${i <= Math.round(rating) ? 'var(--gold)' : 'var(--border)'}">★</span>`;
  return s;
}

function renderHotels(hotels) {
  const grid = document.getElementById('hotelGrid');
  if (!hotels.length) { grid.innerHTML = '<div class="loading">No hotels found.</div>'; return; }
  grid.innerHTML = hotels.map(h => `
    <div class="hotel-card">
      <div class="hotel-location">${h.location}</div>
      <h2>${h.name}</h2>
      <p class="hotel-desc">${h.description}</p>
      <div class="rating-row">
        <div class="stars">${h.avgRating ? starsHtml(h.avgRating) : '☆☆☆☆☆'}</div>
        <span class="rating-num">${h.avgRating || 'No ratings'}</span>
        <span class="review-count">(${h.reviewCount} review${h.reviewCount !== 1 ? 's' : ''})</span>
      </div>
      <button class="btn-primary" onclick="openReviews('${h.id}', '${h.name.replace(/'/g, "\\'")}')">View Reviews</button>
    </div>
  `).join('');
}

function filterHotels() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  renderHotels(allHotels.filter(h => h.name.toLowerCase().includes(q) || h.location.toLowerCase().includes(q)));
}

async function openReviews(hotelId, hotelName) {
  currentHotelId = hotelId;
  selectedRating = 0;
  document.getElementById('modalHotelName').textContent = hotelName;
  document.getElementById('rvUsername').value = '';
  document.getElementById('rvComment').value = '';
  document.getElementById('rvError').textContent = '';
  updateStars(0);
  document.getElementById('reviewModal').classList.remove('hidden');
  await loadReviews(hotelId);
}

async function loadReviews(hotelId) {
  const reviews = await api('GET', `/reviews/${hotelId}`);
  const el = document.getElementById('reviewsList');
  if (!reviews.length) { el.innerHTML = '<div class="no-reviews">No reviews yet. Be the first!</div>'; return; }
  el.innerHTML = reviews.map(r => `
    <div class="review-item">
      <div class="rv-header">
        <span class="rv-user">${r.username}</span>
        <span class="rv-stars">${starsHtml(r.rating)}</span>
      </div>
      <p class="rv-comment">${r.comment}</p>
      <span class="rv-date">${new Date(r.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
    </div>
  `).join('');
}

function updateStars(val) {
  selectedRating = val;
  document.querySelectorAll('#starInput span').forEach(s => {
    s.classList.toggle('active', Number(s.dataset.v) <= val);
  });
}

document.getElementById('starInput').addEventListener('click', e => {
  if (e.target.dataset.v) updateStars(Number(e.target.dataset.v));
});

async function submitReview() {
  const username = document.getElementById('rvUsername').value.trim();
  const comment = document.getElementById('rvComment').value.trim();
  const errEl = document.getElementById('rvError');
  if (!username || !comment || !selectedRating) { errEl.textContent = 'All fields are required.'; return; }
  const res = await api('POST', `/reviews/${currentHotelId}`, { username, rating: selectedRating, comment });
  if (res.error) { errEl.textContent = res.error; return; }
  errEl.textContent = '';
  document.getElementById('rvUsername').value = '';
  document.getElementById('rvComment').value = '';
  updateStars(0);
  await loadReviews(currentHotelId);
  await loadHotels();
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

document.getElementById('footerTrigger').addEventListener('click', () => {
  footerClicks++;
  if (footerClicks >= 5) {
    footerClicks = 0;
    if (adminToken) openAdminPanel();
    else document.getElementById('adminLoginModal').classList.remove('hidden');
  }
});

async function adminLogin() {
  const username = document.getElementById('adminUser').value.trim();
  const password = document.getElementById('adminPass').value;
  const res = await api('POST', '/admin/login', { username, password });
  if (res.error) { document.getElementById('loginError').textContent = res.error; return; }
  adminToken = res.token;
  closeModal('adminLoginModal');
  document.getElementById('adminUser').value = '';
  document.getElementById('adminPass').value = '';
  document.getElementById('loginError').textContent = '';
  openAdminPanel();
}

async function openAdminPanel() {
  document.getElementById('adminModal').classList.remove('hidden');
  await renderAdminHotels();
}

async function renderAdminHotels() {
  const hotels = await api('GET', '/hotels');
  const el = document.getElementById('adminHotelList');
  el.innerHTML = '';
  for (const h of hotels) {
    const reviews = await api('GET', `/reviews/${h.id}`);
    const div = document.createElement('div');
    div.className = 'admin-hotel-item';
    div.innerHTML = `
      <div class="admin-hotel-header">
        <span class="admin-hotel-name">${h.name} — ${h.location}</span>
        <button class="btn-danger" onclick="adminDeleteHotel('${h.id}')">Delete Hotel</button>
      </div>
      ${reviews.map(r => `
        <div class="admin-review-item">
          <span>${r.username}: "${r.comment.substring(0, 50)}${r.comment.length > 50 ? '…' : ''}" (${r.rating}★)</span>
          <button class="btn-danger" onclick="adminDeleteReview('${h.id}','${r.id}')">Del</button>
        </div>
      `).join('')}
      ${!reviews.length ? '<div class="rv-date" style="padding-top:0.5rem">No reviews</div>' : ''}
    `;
    el.appendChild(div);
  }
}

async function adminAddHotel() {
  const name = document.getElementById('aHotelName').value.trim();
  const location = document.getElementById('aHotelLoc').value.trim();
  const description = document.getElementById('aHotelDesc').value.trim();
  if (!name || !location || !description) return;
  await api('POST', '/hotels', { name, location, description }, adminToken);
  document.getElementById('aHotelName').value = '';
  document.getElementById('aHotelLoc').value = '';
  document.getElementById('aHotelDesc').value = '';
  await renderAdminHotels();
  await loadHotels();
}

async function adminDeleteHotel(id) {
  await api('DELETE', `/hotels/${id}`, null, adminToken);
  await renderAdminHotels();
  await loadHotels();
}

async function adminDeleteReview(hotelId, reviewId) {
  await api('DELETE', `/reviews/${hotelId}/${reviewId}`, null, adminToken);
  await renderAdminHotels();
  await loadHotels();
}

loadHotels();