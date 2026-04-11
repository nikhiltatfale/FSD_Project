/**
 * ReviewHub — script.js
 * Pure Vanilla JS | localStorage | No frameworks
 */

// ============================================================
// CONSTANTS
// ============================================================
const LS_USERS    = 'rh_users';
const LS_SESSION  = 'rh_session';
const LS_REVIEWS  = 'rh_reviews';

const ADMIN_USER = 'admin';
const ADMIN_PASS = '1234';

// ============================================================
// 100 DEMO PRODUCTS
// ============================================================
const CATEGORY_ICONS = {
  Electronics: '📱', Books: '📚', Clothing: '👕',
  Home: '🏠', Sports: '⚽', Beauty: '💄', Toys: '🧸', Food: '🍕'
};

const PRODUCTS = (() => {
  const data = [
    // Electronics (15)
    ['Wireless Bluetooth Earbuds', 'Electronics', 'True wireless earbuds with active noise cancellation and 24-hour battery life.'],
    ['4K Smart TV 55"', 'Electronics', 'Ultra HD smart television with built-in streaming apps and voice control.'],
    ['Mechanical Keyboard', 'Electronics', 'RGB backlit mechanical keyboard with tactile brown switches for typists.'],
    ['USB-C Hub 7-in-1', 'Electronics', 'Multi-port hub with HDMI, USB 3.0, SD card reader and power delivery.'],
    ['Portable Charger 20000mAh', 'Electronics', 'High-capacity power bank with fast charge support for multiple devices.'],
    ['Wireless Mouse', 'Electronics', 'Ergonomic wireless mouse with silent clicks and 18-month battery life.'],
    ['Laptop Stand Aluminum', 'Electronics', 'Adjustable aluminum stand compatible with all laptops up to 17 inches.'],
    ['Gaming Headset', 'Electronics', '7.1 surround sound gaming headset with noise-cancelling boom microphone.'],
    ['Webcam 1080p', 'Electronics', 'Full HD webcam with autofocus and built-in dual microphones for video calls.'],
    ['Smart Watch Series X', 'Electronics', 'Fitness tracking smartwatch with heart rate monitor and GPS tracking.'],
    ['Portable Bluetooth Speaker', 'Electronics', 'Waterproof portable speaker with 360 degree sound and 12-hour battery.'],
    ['Noise Cancelling Headphones', 'Electronics', 'Over-ear headphones with industry-leading active noise cancellation.'],
    ['External SSD 1TB', 'Electronics', 'Ultra-fast external solid state drive with USB 3.2 Gen 2 interface.'],
    ['Smart Home Hub', 'Electronics', 'Central smart home controller compatible with Alexa, Google and HomeKit.'],
    ['Action Camera 4K', 'Electronics', 'Waterproof 4K action camera with image stabilization and wide-angle lens.'],

    // Books (13)
    ['Atomic Habits', 'Books', 'Proven framework for building good habits and breaking bad ones.'],
    ['The Pragmatic Programmer', 'Books', 'Classic guide to software craftsmanship and career growth for developers.'],
    ['Thinking Fast and Slow', 'Books', 'Explores the two systems that drive human thinking and decision making.'],
    ['Clean Code', 'Books', 'Handbook of agile software craftsmanship with practical refactoring techniques.'],
    ['Deep Work', 'Books', 'Rules for focused success in a distracted world by Cal Newport.'],
    ['The Alchemist', 'Books', 'A philosophical novel about following your dreams and finding your destiny.'],
    ['Rich Dad Poor Dad', 'Books', 'Personal finance classic about the mindset of the wealthy vs. the poor.'],
    ['Sapiens', 'Books', 'Brief history of humankind from ancient times to the modern era.'],
    ['The Lean Startup', 'Books', 'Methodology for developing businesses using validated learning and iteration.'],
    ['System Design Interview', 'Books', 'Insider guide to cracking system design interviews at top tech companies.'],
    ['Introduction to Algorithms', 'Books', 'Comprehensive textbook covering a wide range of algorithms in depth.'],
    ['Zero to One', 'Books', 'Notes on startups and how to build the future by Peter Thiel.'],
    ['The Psychology of Money', 'Books', 'Timeless lessons on wealth, greed and happiness.'],

    // Clothing (13)
    ['Classic White T-Shirt', 'Clothing', '100% organic cotton crew neck tee, pre-shrunk and machine washable.'],
    ['Slim Fit Chinos', 'Clothing', 'Stretch cotton chino pants available in multiple colors and sizes.'],
    ['Hoodie Pullover', 'Clothing', 'Fleece pullover hoodie with kangaroo pocket and ribbed cuffs.'],
    ['Running Shoes', 'Clothing', 'Lightweight breathable running shoes with responsive cushioning.'],
    ['Denim Jacket', 'Clothing', 'Classic washed denim jacket with button closure and chest pockets.'],
    ['Sports Leggings', 'Clothing', 'High-waist compression leggings with moisture-wicking fabric.'],
    ['Formal Dress Shirt', 'Clothing', 'Wrinkle-resistant formal shirt available in white, blue and grey.'],
    ['Winter Parka', 'Clothing', 'Water-resistant insulated parka with faux-fur trimmed hood.'],
    ['Canvas Sneakers', 'Clothing', 'Classic low-top canvas sneakers with vulcanized rubber sole.'],
    ['Yoga Pants', 'Clothing', '4-way stretch yoga pants with hidden waistband pocket.'],
    ['Polo T-Shirt', 'Clothing', 'Premium pique cotton polo shirt with 2-button placket.'],
    ['Leather Belt', 'Clothing', 'Genuine leather belt with reversible buckle in black and brown.'],
    ['Thermal Socks Pack', 'Clothing', 'Pack of 6 cushioned thermal socks for outdoor and winter wear.'],

    // Home (12)
    ['Non-Stick Cookware Set', 'Home', '10-piece non-stick aluminum cookware set with glass lids.'],
    ['Robot Vacuum Cleaner', 'Home', 'Smart robot vacuum with mapping, scheduling and auto-empty dock.'],
    ['Air Purifier HEPA', 'Home', 'True HEPA air purifier covering up to 500 sq ft for clean indoor air.'],
    ['Bamboo Cutting Board', 'Home', 'Extra-large bamboo cutting board with juice groove and non-slip feet.'],
    ['Coffee Maker 12-Cup', 'Home', 'Programmable drip coffee maker with thermal carafe and auto-brew.'],
    ['Memory Foam Pillow', 'Home', 'Ergonomic memory foam pillow with cooling gel layer for better sleep.'],
    ['Weighted Blanket 15lb', 'Home', '100% cotton weighted blanket designed to reduce stress and improve sleep.'],
    ['Desk Lamp LED', 'Home', 'Adjustable LED desk lamp with wireless charging pad and USB port.'],
    ['Indoor Plant Pots Set', 'Home', 'Set of 5 minimalist ceramic plant pots with drainage holes and saucers.'],
    ['Shower Head High Pressure', 'Home', '6-setting high-pressure shower head with easy tool-free installation.'],
    ['Spice Rack Organizer', 'Home', 'Wall-mounted magnetic spice rack with 12 airtight glass jars.'],
    ['Electric Kettle 1.7L', 'Home', 'Stainless steel variable temperature kettle with keep-warm function.'],

    // Sports (12)
    ['Yoga Mat Non-Slip', 'Sports', 'Eco-friendly 6mm thick non-slip yoga mat with carrying strap.'],
    ['Resistance Bands Set', 'Sports', 'Set of 5 latex resistance bands with varying resistance levels.'],
    ['Dumbbell Set Adjustable', 'Sports', 'Adjustable dumbbell set from 5 to 52.5 lbs with quick-change dial.'],
    ['Jump Rope Speed', 'Sports', 'Bearing-equipped speed jump rope with adjustable length and foam handles.'],
    ['Foam Roller Deep Tissue', 'Sports', 'High-density foam roller for muscle recovery and myofascial release.'],
    ['Pull Up Bar Doorframe', 'Sports', 'Heavy-duty doorframe pull-up bar requiring no screws, holds 300 lbs.'],
    ['Water Bottle Insulated', 'Sports', 'Double-wall vacuum insulated bottle keeps drinks cold 24h, hot 12h.'],
    ['Running Belt', 'Sports', 'Sweat-proof running belt with key clip and expandable phone pocket.'],
    ['Gym Gloves', 'Sports', 'Weight lifting gloves with wrist support and anti-slip grip padding.'],
    ['Protein Shaker Bottle', 'Sports', 'BPA-free shaker bottle with BlenderBall wire whisk and storage cup.'],
    ['Hiking Backpack 30L', 'Sports', 'Lightweight 30L hiking backpack with rain cover and hydration sleeve.'],
    ['Knee Support Brace', 'Sports', 'Adjustable compression knee brace with side stabilizers for sports.'],

    // Beauty (10)
    ['Vitamin C Serum', 'Beauty', 'Brightening 20% Vitamin C serum with hyaluronic acid and vitamin E.'],
    ['Facial Cleansing Brush', 'Beauty', 'Silicone sonic facial cleansing brush with 3 modes and timer.'],
    ['Retinol Night Cream', 'Beauty', 'Anti-ageing night cream with 0.5% retinol and niacinamide complex.'],
    ['SPF 50 Sunscreen', 'Beauty', 'Lightweight mineral sunscreen SPF 50 with zinc oxide, no white cast.'],
    ['Hair Dryer Pro', 'Beauty', 'Professional ionic hair dryer with diffuser and concentrator attachments.'],
    ['Hyaluronic Acid Moisturizer', 'Beauty', 'Oil-free gel-cream moisturizer with triple hyaluronic acid complex.'],
    ['Eye Cream Peptide', 'Beauty', 'Advanced peptide eye cream targeting dark circles and fine lines.'],
    ['Lip Balm SPF Set', 'Beauty', 'Set of 4 tinted lip balms with SPF 15 and shea butter formula.'],
    ['Jade Roller & Gua Sha', 'Beauty', 'Natural jade face roller and gua sha stone for lymphatic drainage.'],
    ['Charcoal Face Mask', 'Beauty', 'Deep-pore cleansing charcoal peel-off mask for oily and combination skin.'],

    // Toys (13)
    ['LEGO Architecture Set', 'Toys', 'Iconic architecture building set with 744 pieces for ages 12 and up.'],
    ['Remote Control Car', 'Toys', 'High-speed 1:18 scale RC car with 2.4GHz remote and rechargeable battery.'],
    ['Wooden Puzzle 1000 Pieces', 'Toys', 'Vibrant 1000-piece wooden puzzle with poster guide included.'],
    ['Magnetic Building Blocks', 'Toys', '64-piece magnetic tile building set for creative STEM play.'],
    ['Art Supply Kit Kids', 'Toys', 'Complete 143-piece art kit with colored pencils, markers and sketchpad.'],
    ['Telescope for Kids', 'Toys', '70mm refractor telescope with tripod and smartphone adapter.'],
    ['Board Game Strategy', 'Toys', 'Award-winning strategy board game for 2-4 players ages 10 and up.'],
    ['Slime Making Kit', 'Toys', 'All-inclusive slime kit with glitter, charms and 18 slime recipes.'],
    ['Model Rocket Kit', 'Toys', 'Entry-level model rocket kit with launch pad for ages 10 and up.'],
    ['Robotic Coding Kit', 'Toys', 'Beginner-friendly robot kit that teaches block-based coding concepts.'],
    ['Mini Drone for Kids', 'Toys', 'Easy-to-fly beginner drone with altitude hold and one-key landing.'],
    ['Science Experiment Kit', 'Toys', '50+ experiments STEM kit covering chemistry, physics and biology.'],
    ['Card Game Classic', 'Toys', 'Fast-paced family card game for 2-10 players ages 7 and up.'],

    // Food (12)
    ['Organic Green Tea 100g', 'Food', 'Premium Japanese matcha grade organic green tea leaves, hand-picked.'],
    ['Dark Chocolate 85%', 'Food', 'Single-origin 85% dark chocolate bars with no added sugar.'],
    ['Himalayan Pink Salt 1kg', 'Food', 'Coarse grain pink Himalayan salt rich in minerals, perfect for grinding.'],
    ['Assorted Nuts Trail Mix', 'Food', 'Roasted mixed nuts and dried fruit trail mix with no preservatives.'],
    ['Cold Pressed Olive Oil', 'Food', 'Extra virgin first cold-pressed olive oil from small Italian farms.'],
    ['Protein Granola', 'Food', 'High-protein granola with oats, almonds and honey, no refined sugar.'],
    ['Apple Cider Vinegar', 'Food', 'Unfiltered organic apple cider vinegar with mother culture.'],
    ['Honey Raw Unfiltered', 'Food', 'Pure raw unfiltered wildflower honey, never heated or processed.'],
    ['Turmeric Latte Mix', 'Food', 'Golden milk turmeric latte blend with ginger, cinnamon and black pepper.'],
    ['Chia Seeds Organic', 'Food', 'Certified organic white chia seeds, source of omega-3 and fibre.'],
    ['Quinoa White 500g', 'Food', 'Certified organic pre-washed white quinoa, complete protein source.'],
    ['Coconut Oil Cold Pressed', 'Food', 'Virgin cold-pressed coconut oil for cooking, baking and skin care.'],
  ];

  return data.map((item, i) => ({
    id: i + 1,
    name: item[0],
    category: item[1],
    description: item[2],
    icon: CATEGORY_ICONS[item[1]] || '📦'
  }));
})();

// ============================================================
// LOCALSTORAGE HELPERS
// ============================================================
function getUsers()    { try { return JSON.parse(localStorage.getItem(LS_USERS))  || []; } catch(e) { return []; } }
function getSession()  { try { return JSON.parse(localStorage.getItem(LS_SESSION)); }      catch(e) { return null; } }
function getReviews()  { try { return JSON.parse(localStorage.getItem(LS_REVIEWS)) || {}; } catch(e) { return {}; } }

function saveUsers(u)   { localStorage.setItem(LS_USERS,   JSON.stringify(u)); }
function saveSession(s) { localStorage.setItem(LS_SESSION, JSON.stringify(s)); }
function saveReviews(r) { localStorage.setItem(LS_REVIEWS, JSON.stringify(r)); }

function currentUser() { return getSession(); }

// ============================================================
// VIEW MANAGEMENT
// ============================================================
const VIEWS = ['auth', 'products', 'detail', 'admin'];

function showView(name) {
  VIEWS.forEach(v => document.getElementById('view' + cap(v)).classList.add('hidden'));
  document.getElementById('view' + cap(name)).classList.remove('hidden');

  const header = document.getElementById('siteHeader');
  if (name === 'auth') {
    header.classList.add('hidden');
  } else {
    header.classList.remove('hidden');
  }

  if (name === 'products') renderProducts();
  updateHeader();
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ============================================================
// HEADER UPDATE
// ============================================================
function updateHeader() {
  const user = currentUser();
  const nameEl  = document.getElementById('headerUserName');
  const logoutBtn = document.getElementById('btnLogout');
  const loginBtn  = document.getElementById('btnGoLogin');

  if (user) {
    nameEl.textContent = 'Hi, ' + (user.name || user.email.split('@')[0]);
    logoutBtn.classList.remove('hidden');
    loginBtn.classList.add('hidden');
  } else {
    nameEl.textContent = 'Guest';
    logoutBtn.classList.add('hidden');
    loginBtn.classList.remove('hidden');
  }
}

// ============================================================
// AUTH — TAB SWITCH
// ============================================================
function switchTab(tab) {
  document.getElementById('formLogin').classList.toggle('hidden',  tab !== 'login');
  document.getElementById('formSignup').classList.toggle('hidden', tab !== 'signup');
  document.getElementById('tabLogin').classList.toggle('active',   tab === 'login');
  document.getElementById('tabSignup').classList.toggle('active',  tab === 'signup');
  clearMsg('loginMsg');
  clearMsg('signupMsg');
}

// ============================================================
// AUTH — SIGN UP
// ============================================================
function handleSignup() {
  const name     = document.getElementById('signupName').value.trim();
  const email    = document.getElementById('signupEmail').value.trim().toLowerCase();
  const password = document.getElementById('signupPassword').value;

  if (!name || !email || !password) { return setMsg('signupMsg', 'All fields are required.', 'error'); }
  if (!isValidEmail(email))         { return setMsg('signupMsg', 'Enter a valid email address.', 'error'); }
  if (password.length < 6)          { return setMsg('signupMsg', 'Password must be at least 6 characters.', 'error'); }

  const users = getUsers();
  if (users.find(u => u.email === email)) { return setMsg('signupMsg', 'This email is already registered.', 'error'); }

  users.push({ name, email, password });
  saveUsers(users);
  saveSession({ email, name });

  setMsg('signupMsg', 'Account created!', 'success');
  setTimeout(() => showView('products'), 500);
}

// ============================================================
// AUTH — LOGIN
// ============================================================
function handleLogin() {
  const email    = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) { return setMsg('loginMsg', 'Please fill in all fields.', 'error'); }

  const users = getUsers();
  const user  = users.find(u => u.email === email && u.password === password);
  if (!user) { return setMsg('loginMsg', 'Invalid email or password.', 'error'); }

  saveSession({ email: user.email, name: user.name });
  setMsg('loginMsg', 'Login successful!', 'success');
  setTimeout(() => showView('products'), 400);
}

// ============================================================
// GUEST BROWSE
// ============================================================
function handleGuestBrowse() {
  localStorage.removeItem(LS_SESSION);
  showView('products');
}

// ============================================================
// LOGOUT
// ============================================================
function handleLogout() {
  localStorage.removeItem(LS_SESSION);
  showToast('Logged out successfully.');
  showView('auth');
}

// ============================================================
// PRODUCT LIST — RENDER
// ============================================================
function renderProducts() {
  const grid     = document.getElementById('productGrid');
  const search   = (document.getElementById('searchInput').value || '').toLowerCase();
  const category = document.getElementById('categoryFilter').value;

  let filtered = PRODUCTS;
  if (search)   filtered = filtered.filter(p => p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search) || p.category.toLowerCase().includes(search));
  if (category) filtered = filtered.filter(p => p.category === category);

  document.getElementById('productCount').textContent = `Showing ${filtered.length} of ${PRODUCTS.length} products`;

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="padding:24px;color:#888;grid-column:1/-1;">No products match your search.</p>';
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const { avg, count } = getAvgRating(p.id);
    return `
      <div class="product-card">
        <div class="product-img-placeholder">${p.icon}</div>
        <div class="product-body">
          <div class="product-name">${escHtml(p.name)}</div>
          <div><span class="product-category">${p.category}</span></div>
          <div class="product-desc">${escHtml(p.description)}</div>
          <div class="product-rating">
            <span class="stars">${renderStars(avg)}</span>
            <span class="rating-count"> ${avg > 0 ? avg.toFixed(1) : 'No ratings'} (${count})</span>
          </div>
          <button class="btn btn-primary btn-sm" onclick="showProductDetail(${p.id})">View Details</button>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// PRODUCT DETAIL
// ============================================================
function showProductDetail(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const reviews = getReviews()[productId] || [];
  const { avg, count } = getAvgRating(productId);
  const user = currentUser();

  const userAlreadyReviewed = user && reviews.some(r => r.userEmail === user.email);

  // Build review form or prompt
  let reviewFormHTML = '';
  if (!user) {
    reviewFormHTML = `
      <div class="login-prompt">
        <a onclick="showView('auth')">Login or Sign Up</a> to write a review.
      </div>
    `;
  } else if (userAlreadyReviewed) {
    reviewFormHTML = `
      <div class="review-form-box">
        <p style="color:#27ae60;font-weight:600;">✓ You have already reviewed this product.</p>
      </div>
    `;
  } else {
    reviewFormHTML = `
      <div class="review-form-box">
        <h3>Write a Review</h3>
        <div class="field-group">
          <label>Your Rating</label>
          <div class="star-picker" id="starPicker">
            <span data-val="1" onclick="pickStar(1)">★</span>
            <span data-val="2" onclick="pickStar(2)">★</span>
            <span data-val="3" onclick="pickStar(3)">★</span>
            <span data-val="4" onclick="pickStar(4)">★</span>
            <span data-val="5" onclick="pickStar(5)">★</span>
          </div>
        </div>
        <div class="field-group">
          <label>Comment</label>
          <textarea id="reviewComment" placeholder="Share your experience with this product..."></textarea>
        </div>
        <div id="reviewMsg" class="msg"></div>
        <button class="btn btn-primary" onclick="submitReview(${productId})">Submit Review</button>
      </div>
    `;
  }

  // Build reviews list
  const reviewsHTML = reviews.length === 0
    ? '<p class="no-reviews">No reviews yet. Be the first to review!</p>'
    : reviews.map(r => `
        <div class="review-card">
          <div class="review-header">
            <div>
              <div class="review-author">${escHtml(r.userName)}</div>
              <div class="stars">${renderStars(r.rating)}</div>
            </div>
            <div class="review-date">${r.date}</div>
          </div>
          <div class="review-comment">${escHtml(r.comment)}</div>
        </div>
      `).join('');

  document.getElementById('detailContent').innerHTML = `
    <div class="detail-header">
      <div class="detail-img-placeholder">${product.icon}</div>
      <div class="detail-name">${escHtml(product.name)}</div>
      <div><span class="product-category">${product.category}</span></div>
      <div class="detail-desc">${escHtml(product.description)}</div>
      <div class="detail-avg-rating">
        <span class="stars">${renderStars(avg)}</span>
        <strong> ${avg > 0 ? avg.toFixed(1) + ' / 5' : 'No ratings yet'}</strong>
      </div>
      <div class="detail-review-count">${count} review${count !== 1 ? 's' : ''}</div>
    </div>

    ${reviewFormHTML}

    <div class="reviews-section">
      <h3>All Reviews (${count})</h3>
      ${reviewsHTML}
    </div>
  `;

  showView('detail');
  window.scrollTo({ top: 0 });
}

// ============================================================
// STAR PICKER
// ============================================================
let selectedRating = 0;

function pickStar(val) {
  selectedRating = val;
  document.querySelectorAll('#starPicker span').forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.val) <= val);
  });
}

// ============================================================
// SUBMIT REVIEW
// ============================================================
function submitReview(productId) {
  const user    = currentUser();
  const comment = document.getElementById('reviewComment').value.trim();

  if (!user)            { return setMsg('reviewMsg', 'Please login first.', 'error'); }
  if (selectedRating === 0) { return setMsg('reviewMsg', 'Please select a star rating.', 'error'); }
  if (!comment)         { return setMsg('reviewMsg', 'Please write a comment.', 'error'); }

  const reviews = getReviews();
  if (!reviews[productId]) reviews[productId] = [];

  // Double-check one review per user
  if (reviews[productId].some(r => r.userEmail === user.email)) {
    return setMsg('reviewMsg', 'You have already reviewed this product.', 'error');
  }

  reviews[productId].push({
    userEmail: user.email,
    userName:  user.name || user.email.split('@')[0],
    rating:    selectedRating,
    comment:   comment,
    date:      new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  });

  saveReviews(reviews);
  selectedRating = 0;
  showToast('Review submitted successfully!');
  showProductDetail(productId); // re-render
}

// ============================================================
// RATING HELPERS
// ============================================================
function getAvgRating(productId) {
  const reviews = (getReviews()[productId] || []);
  if (reviews.length === 0) return { avg: 0, count: 0 };
  const sum = reviews.reduce((a, r) => a + r.rating, 0);
  return { avg: sum / reviews.length, count: reviews.length };
}

function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

// ============================================================
// ADMIN
// ============================================================
function handleAdminLogin() {
  const u = document.getElementById('adminUser').value.trim();
  const p = document.getElementById('adminPass').value;

  if (u !== ADMIN_USER || p !== ADMIN_PASS) {
    return setMsg('adminLoginMsg', 'Invalid admin credentials.', 'error');
  }

  document.getElementById('adminLoginSection').classList.add('hidden');
  document.getElementById('adminDashboard').classList.remove('hidden');
  refreshAdminStats();
}

function refreshAdminStats() {
  const users   = getUsers();
  const reviews = getReviews();
  const totalReviews = Object.values(reviews).reduce((a, r) => a + r.length, 0);

  document.getElementById('statUsers').textContent    = users.length;
  document.getElementById('statReviews').textContent  = totalReviews;
  document.getElementById('statProducts').textContent = PRODUCTS.length;
}

function adminReset() {
  if (!confirm('This will delete ALL users, sessions, and reviews. Continue?')) return;
  localStorage.removeItem(LS_USERS);
  localStorage.removeItem(LS_SESSION);
  localStorage.removeItem(LS_REVIEWS);
  setMsg('adminMsg', '✓ All data has been reset.', 'success');
  refreshAdminStats();
}

function adminLogout() {
  document.getElementById('adminLoginSection').classList.remove('hidden');
  document.getElementById('adminDashboard').classList.add('hidden');
  document.getElementById('adminUser').value = '';
  document.getElementById('adminPass').value = '';
  clearMsg('adminLoginMsg');
  showView('products');
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3000);
}

// ============================================================
// MESSAGES
// ============================================================
function setMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent  = text;
  el.className    = 'msg ' + (type || '');
}

function clearMsg(id) {
  const el = document.getElementById(id);
  if (el) { el.textContent = ''; el.className = 'msg'; }
}

// ============================================================
// UTILITIES
// ============================================================
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================================
// INIT
// ============================================================
(function init() {
  const user = currentUser();
  if (user) {
    showView('products');
  } else {
    showView('auth');
  }
})();