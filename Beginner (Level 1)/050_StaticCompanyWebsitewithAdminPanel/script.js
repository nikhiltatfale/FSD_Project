/* =====================================================
   TechNova – script.js
   All functionality: Navbar, ScrollReveal, Contact Form,
   Admin Login, Admin Dashboard (CRUD), localStorage
   ===================================================== */

/* ─── Default Data ─── */
const DEFAULT_SERVICES = [
  { icon: "🌐", title: "Web Development", desc: "Custom, responsive websites and web apps built with modern technologies." },
  { icon: "📱", title: "Mobile Apps", desc: "Cross-platform mobile applications for iOS and Android." },
  { icon: "☁️", title: "Cloud Solutions", desc: "Scalable cloud infrastructure setup, migration, and management." },
  { icon: "🤖", title: "AI & Automation", desc: "Intelligent automation tools and AI-powered integrations for your workflow." },
  { icon: "🔒", title: "Cybersecurity", desc: "End-to-end security audits, threat detection, and data protection." },
  { icon: "📊", title: "Data Analytics", desc: "Turn raw data into actionable insights with powerful dashboards." }
];

const DEFAULT_PORTFOLIO = [
  { img: "https://picsum.photos/seed/proj1/400/220", title: "E-Commerce Platform", desc: "Full-stack shop with payment integration." },
  { img: "https://picsum.photos/seed/proj2/400/220", title: "Healthcare App", desc: "Patient management and appointment booking." },
  { img: "https://picsum.photos/seed/proj3/400/220", title: "FinTech Dashboard", desc: "Real-time analytics for financial data." },
  { img: "https://picsum.photos/seed/proj4/400/220", title: "EdTech Portal", desc: "Online learning platform with live classes." }
];

/* ─── localStorage Helpers ─── */
function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch (e) { return fallback; }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ─── Init: load all data into DOM ─── */
function initSite() {
  // Hero
  const hero = load("hero", {
    title: "Building the Future with Technology",
    subtitle: "We craft world-class software solutions to help your business grow and scale.",
    cta: "Get Started"
  });
  document.getElementById("heroTitle").textContent = hero.title;
  document.getElementById("heroSubtitle").textContent = hero.subtitle;
  document.getElementById("heroCTA").textContent = hero.cta;

  // About
  const aboutText = load("aboutText",
    "TechNova is a leading IT solutions company founded in 2015. We specialize in web development, cloud infrastructure, mobile applications, and AI-powered tools. Our team of 50+ experts delivers end-to-end digital transformation for startups and enterprises across the globe. We believe in quality, speed, and innovation.");
  document.getElementById("aboutText").textContent = aboutText;

  // Services
  renderServices();

  // Portfolio
  renderPortfolio();
}

/* ─── RENDER SERVICES ─── */
function renderServices() {
  const services = load("services", DEFAULT_SERVICES);
  const grid = document.getElementById("servicesGrid");
  grid.innerHTML = "";
  if (!services.length) {
    grid.innerHTML = '<p class="no-data">No services added yet.</p>';
    return;
  }
  services.forEach(s => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<div class="card-icon">${escHtml(s.icon)}</div><h3>${escHtml(s.title)}</h3><p>${escHtml(s.desc)}</p>`;
    grid.appendChild(card);
  });
}

/* ─── RENDER PORTFOLIO ─── */
function renderPortfolio() {
  const items = load("portfolio", DEFAULT_PORTFOLIO);
  const grid = document.getElementById("portfolioGrid");
  grid.innerHTML = "";
  if (!items.length) {
    grid.innerHTML = '<p class="no-data">No portfolio items yet.</p>';
    return;
  }
  items.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${escHtml(p.img)}" alt="${escHtml(p.title)}" onerror="this.src='https://picsum.photos/400/220'" loading="lazy" />
      <h3>${escHtml(p.title)}</h3>
      <p>${escHtml(p.desc)}</p>`;
    grid.appendChild(card);
  });
}

/* ─── XSS helper ─── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ─── NAVBAR TOGGLE ─── */
document.getElementById("navToggle").addEventListener("click", function () {
  document.getElementById("navLinks").classList.toggle("open");
});

// Close menu when a link is clicked (mobile)
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    document.getElementById("navLinks").classList.remove("open");
  });
});

/* ─── SMOOTH SCROLL (fallback for older browsers) ─── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

/* ─── SCROLL REVEAL ─── */
function revealOnScroll() {
  const reveals = document.querySelectorAll(".reveal");
  const trigger = window.innerHeight * 0.88;
  reveals.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < trigger) el.classList.add("visible");
  });
}
window.addEventListener("scroll", revealOnScroll);
revealOnScroll(); // run once on load

/* ─── CONTACT FORM VALIDATION & SUBMIT ─── */
function validateField(id, errId, condition, message) {
  const input = document.getElementById(id);
  const err = document.getElementById(errId);
  if (condition(input.value.trim())) {
    err.textContent = message;
    input.classList.add("input-error");
    return false;
  }
  err.textContent = "";
  input.classList.remove("input-error");
  return true;
}

function submitContact() {
  const nameOk    = validateField("cName",    "errName",    v => !v,                      "Name is required.");
  const emailOk   = validateField("cEmail",   "errEmail",   v => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Valid email required.");
  const subjectOk = validateField("cSubject", "errSubject", v => v.length < 3,            "Subject must be at least 3 characters.");
  const msgOk     = validateField("cMessage", "errMessage", v => v.length < 10,           "Message must be at least 10 characters.");

  if (!nameOk || !emailOk || !subjectOk || !msgOk) return;

  const entry = {
    id: Date.now(),
    name:    document.getElementById("cName").value.trim(),
    email:   document.getElementById("cEmail").value.trim(),
    subject: document.getElementById("cSubject").value.trim(),
    message: document.getElementById("cMessage").value.trim(),
    date:    new Date().toLocaleString()
  };

  const msgs = load("contactMessages", []);
  msgs.unshift(entry);
  save("contactMessages", msgs);

  // Clear form
  ["cName","cEmail","cSubject","cMessage"].forEach(id => document.getElementById(id).value = "");

  // Show success
  const msgEl = document.getElementById("formMsg");
  msgEl.textContent = "✅ Your message has been sent! We'll get back to you soon.";
  msgEl.className = "form-msg success";
  msgEl.classList.remove("hidden");
  setTimeout(() => msgEl.classList.add("hidden"), 5000);
}

/* ─── ADMIN FOOTER CLICK TRICK ─── */
let footerClicks = 0, footerTimer = null;
document.getElementById("footerBrand").addEventListener("click", function () {
  footerClicks++;
  clearTimeout(footerTimer);
  footerTimer = setTimeout(() => { footerClicks = 0; }, 2500);
  if (footerClicks >= 5) {
    footerClicks = 0;
    // Already logged in?
    if (load("adminLoggedIn", false)) {
      openAdminPanel();
    } else {
      document.getElementById("adminLoginModal").classList.remove("hidden");
    }
  }
});

/* ─── ADMIN LOGIN ─── */
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";

function adminLogin() {
  const u = document.getElementById("adminUser").value.trim();
  const p = document.getElementById("adminPass").value;
  const errEl = document.getElementById("loginErr");
  if (u === ADMIN_USER && p === ADMIN_PASS) {
    save("adminLoggedIn", true);
    errEl.textContent = "";
    errEl.classList.add("hidden");
    closeModal("adminLoginModal");
    document.getElementById("adminUser").value = "";
    document.getElementById("adminPass").value = "";
    openAdminPanel();
  } else {
    errEl.textContent = "❌ Invalid username or password.";
    errEl.classList.remove("hidden");
  }
}

// Allow Enter key on login fields
["adminUser", "adminPass"].forEach(id => {
  document.getElementById(id).addEventListener("keydown", function (e) {
    if (e.key === "Enter") adminLogin();
  });
});

function adminLogout() {
  save("adminLoggedIn", false);
  closeModal("adminPanel");
}

/* ─── OPEN ADMIN PANEL ─── */
function openAdminPanel() {
  // Populate hero fields
  const hero = load("hero", {
    title: document.getElementById("heroTitle").textContent,
    subtitle: document.getElementById("heroSubtitle").textContent,
    cta: document.getElementById("heroCTA").textContent
  });
  document.getElementById("aHeroTitle").value    = hero.title;
  document.getElementById("aHeroSubtitle").value = hero.subtitle;
  document.getElementById("aHeroCTA").value      = hero.cta;

  // Populate about field
  document.getElementById("aAboutText").value = document.getElementById("aboutText").textContent;

  // Render admin services & portfolio lists
  renderAdminServices();
  renderAdminPortfolio();
  renderAdminMessages();

  document.getElementById("adminPanel").classList.remove("hidden");
  showTab("tabHero", document.querySelector(".tab-btn"));
}

/* ─── MODAL CLOSE ─── */
function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}
// Click backdrop to close login modal
document.getElementById("adminLoginModal").addEventListener("click", function (e) {
  if (e.target === this) closeModal("adminLoginModal");
});

/* ─── TAB SYSTEM ─── */
function showTab(tabId, btn) {
  document.querySelectorAll(".tab-content").forEach(t => {
    t.classList.remove("active");
    t.style.display = "none";
  });
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  const tab = document.getElementById(tabId);
  tab.style.display = "block";
  tab.classList.add("active");
  if (btn) btn.classList.add("active");
}

/* ─── SAVE HERO ─── */
function saveHero() {
  const hero = {
    title:    document.getElementById("aHeroTitle").value.trim(),
    subtitle: document.getElementById("aHeroSubtitle").value.trim(),
    cta:      document.getElementById("aHeroCTA").value.trim()
  };
  if (!hero.title) { alert("Hero title cannot be empty."); return; }
  save("hero", hero);
  document.getElementById("heroTitle").textContent    = hero.title;
  document.getElementById("heroSubtitle").textContent = hero.subtitle;
  document.getElementById("heroCTA").textContent      = hero.cta;
  showToast("Hero section updated!");
}

/* ─── SAVE ABOUT ─── */
function saveAbout() {
  const text = document.getElementById("aAboutText").value.trim();
  if (!text) { alert("About text cannot be empty."); return; }
  save("aboutText", text);
  document.getElementById("aboutText").textContent = text;
  showToast("About section updated!");
}

/* ─── ADMIN SERVICES LIST ─── */
function renderAdminServices() {
  const services = load("services", DEFAULT_SERVICES);
  const list = document.getElementById("servicesList");
  list.innerHTML = "";
  if (!services.length) {
    list.innerHTML = '<p class="no-data">No services yet.</p>';
    return;
  }
  services.forEach((s, i) => {
    const item = document.createElement("div");
    item.className = "admin-item";
    item.innerHTML = `
      <div class="admin-item-info">
        <strong>${escHtml(s.icon)} ${escHtml(s.title)}</strong>
        <small>${escHtml(s.desc)}</small>
      </div>
      <div class="admin-item-actions">
        <button class="btn" onclick="editService(${i})">Edit</button>
        <button class="btn btn-danger" onclick="confirmDelete('service', ${i})">Delete</button>
      </div>`;
    list.appendChild(item);
  });
}

/* ─── EDIT SERVICE ─── */
function editService(index) {
  const services = load("services", DEFAULT_SERVICES);
  const s = services[index];
  document.getElementById("editSvcIndex").value = index;
  document.getElementById("svcIcon").value      = s.icon;
  document.getElementById("svcTitle").value     = s.title;
  document.getElementById("svcDesc").value      = s.desc;
  document.getElementById("svcFormTitle").textContent = "Edit Service";
}

function cancelEditService() {
  document.getElementById("editSvcIndex").value   = -1;
  document.getElementById("svcIcon").value        = "";
  document.getElementById("svcTitle").value       = "";
  document.getElementById("svcDesc").value        = "";
  document.getElementById("svcFormTitle").textContent = "Add New Service";
}

/* ─── SAVE SERVICE (Add or Edit) ─── */
function saveService() {
  const icon  = document.getElementById("svcIcon").value.trim();
  const title = document.getElementById("svcTitle").value.trim();
  const desc  = document.getElementById("svcDesc").value.trim();
  if (!title || !desc) { alert("Title and description are required."); return; }

  const services = load("services", DEFAULT_SERVICES);
  const index = parseInt(document.getElementById("editSvcIndex").value, 10);
  if (index === -1) {
    services.push({ icon: icon || "⚙️", title, desc });
    showToast("Service added!");
  } else {
    services[index] = { icon: icon || "⚙️", title, desc };
    showToast("Service updated!");
  }
  save("services", services);
  cancelEditService();
  renderAdminServices();
  renderServices();
}

/* ─── ADMIN PORTFOLIO LIST ─── */
function renderAdminPortfolio() {
  const items = load("portfolio", DEFAULT_PORTFOLIO);
  const list = document.getElementById("portfolioList");
  list.innerHTML = "";
  if (!items.length) {
    list.innerHTML = '<p class="no-data">No portfolio items yet.</p>';
    return;
  }
  items.forEach((p, i) => {
    const item = document.createElement("div");
    item.className = "admin-item";
    item.innerHTML = `
      <div class="admin-item-info">
        <strong>${escHtml(p.title)}</strong>
        <small>${escHtml(p.desc)}</small>
        <small style="word-break:break-all;color:#999;">${escHtml(p.img)}</small>
      </div>
      <div class="admin-item-actions">
        <button class="btn btn-danger" onclick="confirmDelete('portfolio', ${i})">Delete</button>
      </div>`;
    list.appendChild(item);
  });
}

/* ─── ADD PORTFOLIO ─── */
function addPortfolio() {
  const img   = document.getElementById("portImg").value.trim();
  const title = document.getElementById("portTitle").value.trim();
  const desc  = document.getElementById("portDesc").value.trim();
  if (!title) { alert("Project title is required."); return; }
  const items = load("portfolio", DEFAULT_PORTFOLIO);
  items.push({ img: img || "https://picsum.photos/400/220", title, desc });
  save("portfolio", items);
  document.getElementById("portImg").value   = "";
  document.getElementById("portTitle").value = "";
  document.getElementById("portDesc").value  = "";
  renderAdminPortfolio();
  renderPortfolio();
  showToast("Portfolio item added!");
}

/* ─── CONFIRM DELETE ─── */
let _deleteType = null, _deleteIndex = null;
function confirmDelete(type, index) {
  _deleteType  = type;
  _deleteIndex = index;
  const typeLabel = type === "service" ? "service" : "portfolio item";
  document.getElementById("confirmText").textContent = `Delete this ${typeLabel}? This cannot be undone.`;
  document.getElementById("confirmYes").onclick = executeDelete;
  document.getElementById("confirmModal").classList.remove("hidden");
}

function executeDelete() {
  if (_deleteType === "service") {
    const services = load("services", DEFAULT_SERVICES);
    services.splice(_deleteIndex, 1);
    save("services", services);
    renderAdminServices();
    renderServices();
    showToast("Service deleted.");
  } else if (_deleteType === "portfolio") {
    const items = load("portfolio", DEFAULT_PORTFOLIO);
    items.splice(_deleteIndex, 1);
    save("portfolio", items);
    renderAdminPortfolio();
    renderPortfolio();
    showToast("Portfolio item deleted.");
  }
  closeModal("confirmModal");
  _deleteType = null;
  _deleteIndex = null;
}

/* ─── ADMIN MESSAGES ─── */
function renderAdminMessages() {
  const msgs = load("contactMessages", []);
  const list = document.getElementById("messagesList");
  list.innerHTML = "";
  if (!msgs.length) {
    list.innerHTML = '<p class="no-data">No messages received yet.</p>';
    return;
  }
  msgs.forEach(m => {
    const card = document.createElement("div");
    card.className = "msg-card";
    card.innerHTML = `
      <div class="msg-meta">
        <strong>${escHtml(m.name)}</strong> &lt;${escHtml(m.email)}&gt; &nbsp;|&nbsp; ${escHtml(m.date)}
      </div>
      <strong>${escHtml(m.subject)}</strong>
      <p>${escHtml(m.message)}</p>`;
    list.appendChild(card);
  });
}

/* ─── TOAST NOTIFICATION ─── */
function showToast(message) {
  let toast = document.getElementById("toastEl");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toastEl";
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      background: #323232; color: #fff; padding: 12px 22px;
      border-radius: 6px; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(0,0,0,.3);
      transition: opacity .3s ease;`;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = "1";
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = "0"; }, 3000);
}

/* ─── START ─── */
initSite();