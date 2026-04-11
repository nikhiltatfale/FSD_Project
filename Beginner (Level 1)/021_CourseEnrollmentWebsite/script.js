/* ========================================
   EduVerse — Course Enrollment Platform
   script.js
   ======================================== */

/* ===== INITIAL COURSE DATA ===== */
const defaultCourses = [
  {
    id: "c1",
    title: "Complete Web Development Bootcamp",
    instructor: "Angela Yu",
    duration: "55 hours",
    price: 89,
    category: "Programming",
    description: "Learn HTML5, CSS3, JavaScript, React, Node.js, MongoDB, and more. This comprehensive bootcamp covers everything you need to go from absolute beginner to full-stack web developer. Includes 50+ projects and real-world applications.",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80",
    rating: 4.8
  },
  {
    id: "c2",
    title: "UI/UX Design Mastery",
    instructor: "Sarah Johnson",
    duration: "38 hours",
    price: 74,
    category: "Design",
    description: "Master the art of user experience and interface design. Learn Figma, design principles, user research, prototyping, and how to build stunning products that users love. Portfolio-ready projects included.",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80",
    rating: 4.7
  },
  {
    id: "c3",
    title: "Python for Data Science & AI",
    instructor: "Dr. Andrew Chen",
    duration: "42 hours",
    price: 99,
    category: "Data Science",
    description: "Dive deep into Python programming, data analysis with Pandas, visualization with Matplotlib, machine learning with scikit-learn, and deep learning with TensorFlow. Become a data science expert.",
    image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=600&q=80",
    rating: 4.9
  },
  {
    id: "c4",
    title: "Digital Marketing Strategy",
    instructor: "Mark Williams",
    duration: "28 hours",
    price: 59,
    category: "Marketing",
    description: "Learn SEO, Google Ads, Facebook Ads, email marketing, content strategy, and social media management. Build and execute complete digital marketing campaigns that drive real business results.",
    image: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=600&q=80",
    rating: 4.5
  },
  {
    id: "c5",
    title: "MBA Business Fundamentals",
    instructor: "Prof. Lisa Carter",
    duration: "60 hours",
    price: 129,
    category: "Business",
    description: "Get an MBA-level understanding of finance, marketing, operations, strategy, and leadership. This comprehensive business course is designed for entrepreneurs, managers, and aspiring business leaders.",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80",
    rating: 4.6
  },
  {
    id: "c6",
    title: "React & Next.js Development",
    instructor: "Jonas Schmedtmann",
    duration: "45 hours",
    price: 94,
    category: "Programming",
    description: "Build modern, production-ready web applications with React and Next.js. Learn hooks, context API, server-side rendering, static generation, API routes, and deploy to Vercel. Projects galore!",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80",
    rating: 4.8
  },
  {
    id: "c7",
    title: "Brand Design & Identity",
    instructor: "Emma Rodriguez",
    duration: "22 hours",
    price: 0,
    category: "Design",
    description: "Learn the fundamentals of brand identity design from scratch. Covers logo design, color theory, typography, brand guidelines, and how to create a cohesive visual identity for any business or product.",
    image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&q=80",
    rating: 4.4
  },
  {
    id: "c8",
    title: "Machine Learning A–Z",
    instructor: "Dr. Kirill Eremenko",
    duration: "50 hours",
    price: 109,
    category: "Data Science",
    description: "A complete machine learning course covering regression, classification, clustering, NLP, deep learning, and reinforcement learning. Practical Python and R implementations with real datasets.",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80",
    rating: 4.7
  },
  {
    id: "c9",
    title: "Startup Entrepreneurship",
    instructor: "Reid Hoffman Jr.",
    duration: "18 hours",
    price: 0,
    category: "Business",
    description: "Learn how to ideate, validate, build, and scale a startup from the ground up. Covers lean startup methodology, fundraising, pitching, team building, and product-market fit. Free for all learners.",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80",
    rating: 4.3
  }
];

/* ===== STATE ===== */
let courses = [];         // All courses
let enrollments = [];     // All enrollments
let currentFilter = "All";
let currentSearch = "";
let currentEnrollCourseId = null; // Course being enrolled in
let lastEnrollment = null;        // For receipt generation

/* ===== LOCAL STORAGE HELPERS ===== */
function saveCoursesToStorage() {
  localStorage.setItem("eduverse_courses", JSON.stringify(courses));
}
function saveEnrollmentsToStorage() {
  localStorage.setItem("eduverse_enrollments", JSON.stringify(enrollments));
}
function loadData() {
  // Load or seed courses
  const saved = localStorage.getItem("eduverse_courses");
  courses = saved ? JSON.parse(saved) : [...defaultCourses];
  if (!saved) saveCoursesToStorage(); // Seed on first run

  // Load enrollments
  const savedEnroll = localStorage.getItem("eduverse_enrollments");
  enrollments = savedEnroll ? JSON.parse(savedEnroll) : [];
}

/* ===== INITIALIZATION ===== */
document.addEventListener("DOMContentLoaded", () => {
  loadData();
  renderCourses();
  renderMyCourses();
  setupNavbarScroll();
  setupHamburger();
});

/* ===== NAVBAR SCROLL ===== */
function setupNavbarScroll() {
  window.addEventListener("scroll", () => {
    const navbar = document.getElementById("navbar");
    navbar.classList.toggle("scrolled", window.scrollY > 50);
  });
}

/* ===== HAMBURGER MENU ===== */
function setupHamburger() {
  const btn = document.getElementById("hamburger");
  const links = document.getElementById("navLinks");
  btn.addEventListener("click", () => {
    btn.classList.toggle("open");
    links.classList.toggle("open");
  });
}
function closeMenu() {
  document.getElementById("hamburger").classList.remove("open");
  document.getElementById("navLinks").classList.remove("open");
}

/* ===== SCROLL TO COURSES ===== */
function scrollToCourses() {
  document.getElementById("courses").scrollIntoView({ behavior: "smooth" });
}

/* ===== RENDER COURSES ===== */
function renderCourses() {
  const grid = document.getElementById("coursesGrid");
  const noResults = document.getElementById("noResults");
  const resultsCount = document.getElementById("resultsCount");

  // Filter and search
  const filtered = courses.filter(c => {
    const matchCat = currentFilter === "All" || c.category === currentFilter;
    const q = currentSearch.toLowerCase();
    const matchSearch = !q ||
      c.title.toLowerCase().includes(q) ||
      c.instructor.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  resultsCount.textContent = `Showing ${filtered.length} course${filtered.length !== 1 ? "s" : ""}`;

  if (filtered.length === 0) {
    grid.innerHTML = "";
    noResults.style.display = "block";
    return;
  }
  noResults.style.display = "none";

  grid.innerHTML = filtered.map((c, i) => buildCourseCard(c, i)).join("");
}

/* ===== BUILD COURSE CARD HTML ===== */
function buildCourseCard(c, index) {
  const enrolled = isEnrolled(c.id);
  const priceDisplay = c.price === 0 ? '<span class="card-price free">Free</span>' : `<span class="card-price">$${c.price}</span>`;
  const enrollBtn = enrolled
    ? `<span class="enrolled-badge">✓ Enrolled</span>`
    : `<button class="btn-primary btn-sm" onclick="openEnrollModal('${c.id}')">Enroll</button>`;

  return `
    <div class="course-card" style="animation-delay:${index * 0.05}s">
      <div class="card-img-wrap">
        <img src="${c.image}" alt="${c.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80'" />
        <span class="card-category">${c.category}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${c.title}</h3>
        <p class="card-instructor">by <span>${c.instructor}</span></p>
        <div class="card-meta">
          <span class="card-rating">
            <span class="stars">${generateStars(c.rating)}</span>
            <span>${c.rating}</span>
          </span>
          <span>⏱ ${c.duration}</span>
        </div>
      </div>
      <div class="card-footer">
        ${priceDisplay}
        <div class="card-actions">
          <button class="btn-outline btn-sm" onclick="openCourseModal('${c.id}')">Details</button>
          ${enrollBtn}
        </div>
      </div>
    </div>
  `;
}

/* ===== GENERATE STAR RATING ===== */
function generateStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

/* ===== CHECK IF ENROLLED ===== */
function isEnrolled(courseId) {
  return enrollments.some(e => e.courseId === courseId);
}

/* ===== FILTER BY CATEGORY ===== */
function setFilter(btn) {
  document.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  currentFilter = btn.dataset.cat;
  renderCourses();
}
function setFilterByName(name) {
  currentFilter = name;
  document.querySelectorAll(".filter-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.cat === name);
  });
  renderCourses();
  scrollToCourses();
}

/* ===== SEARCH ===== */
function filterCourses() {
  const input = document.getElementById("searchInput");
  currentSearch = input.value.trim();
  const clearBtn = document.getElementById("clearSearch");
  clearBtn.style.display = currentSearch ? "flex" : "none";
  renderCourses();
}
function clearSearch() {
  document.getElementById("searchInput").value = "";
  currentSearch = "";
  document.getElementById("clearSearch").style.display = "none";
  renderCourses();
}

/* ===== OPEN COURSE MODAL ===== */
function openCourseModal(courseId) {
  const c = courses.find(c => c.id === courseId);
  if (!c) return;

  const enrolled = isEnrolled(c.id);
  const priceDisplay = c.price === 0 ? "Free" : `$${c.price}`;
  const enrollBtn = enrolled
    ? `<span class="enrolled-badge" style="font-size:1rem; padding:12px 22px;">✓ Already Enrolled</span>`
    : `<button class="btn-primary" onclick="closeModal('courseModal'); openEnrollModal('${c.id}')">Enroll Now — ${priceDisplay}</button>`;

  document.getElementById("courseModalContent").innerHTML = `
    <img src="${c.image}" alt="${c.title}" class="course-detail-img"
      onerror="this.src='https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80'" />
    <div class="course-detail-header">
      <span class="card-category" style="position:static; display:inline-block; margin-bottom:12px;">${c.category}</span>
      <h2>${c.title}</h2>
    </div>
    <div class="course-detail-meta">
      <span>👨‍🏫 ${c.instructor}</span>
      <span>⏱ ${c.duration}</span>
      <span>⭐ ${c.rating} / 5.0</span>
      <span>${c.price === 0 ? "🆓 Free" : `💰 $${c.price}`}</span>
    </div>
    <p class="course-detail-desc">${c.description}</p>
    <div class="course-detail-footer">
      <span class="detail-price">${c.price === 0 ? "Free" : `$${c.price}`}</span>
      ${enrollBtn}
    </div>
  `;

  openModal("courseModal");
}

/* ===== OPEN ENROLL MODAL ===== */
function openEnrollModal(courseId) {
  if (isEnrolled(courseId)) {
    showToast("You are already enrolled in this course!", "error");
    return;
  }
  const c = courses.find(c => c.id === courseId);
  if (!c) return;

  currentEnrollCourseId = courseId;
  document.getElementById("enrollCourseName").textContent = c.title;
  document.getElementById("enrollCourseId").value = courseId;

  // Clear form
  ["studentName","studentEmail","studentPhone","studentCollege"].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ""; el.classList.remove("error"); }
  });
  ["nameError","emailError","phoneError","collegeError"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });

  openModal("enrollModal");
}

/* ===== FORM VALIDATION ===== */
function validateEnrollmentForm() {
  let valid = true;

  const name = document.getElementById("studentName").value.trim();
  const email = document.getElementById("studentEmail").value.trim();
  const phone = document.getElementById("studentPhone").value.trim();
  const college = document.getElementById("studentCollege").value.trim();

  // Name
  if (!name || name.length < 2) {
    showFieldError("studentName", "nameError", "Please enter your full name.");
    valid = false;
  } else clearFieldError("studentName", "nameError");

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    showFieldError("studentEmail", "emailError", "Please enter a valid email address.");
    valid = false;
  } else clearFieldError("studentEmail", "emailError");

  // Phone
  const phoneRegex = /^[\+\d\s\-\(\)]{7,15}$/;
  if (!phone || !phoneRegex.test(phone)) {
    showFieldError("studentPhone", "phoneError", "Please enter a valid phone number.");
    valid = false;
  } else clearFieldError("studentPhone", "phoneError");

  // College
  if (!college || college.length < 2) {
    showFieldError("studentCollege", "collegeError", "Please enter your institution name.");
    valid = false;
  } else clearFieldError("studentCollege", "collegeError");

  return valid;
}

function showFieldError(inputId, errorId, message) {
  document.getElementById(inputId).classList.add("error");
  document.getElementById(errorId).textContent = message;
}
function clearFieldError(inputId, errorId) {
  document.getElementById(inputId).classList.remove("error");
  document.getElementById(errorId).textContent = "";
}

/* ===== SUBMIT ENROLLMENT ===== */
function submitEnrollment(e) {
  e.preventDefault();
  if (!validateEnrollmentForm()) return;

  const courseId = document.getElementById("enrollCourseId").value;
  const c = courses.find(c => c.id === courseId);

  const enrollment = {
    id: "enr_" + Date.now(),
    courseId: courseId,
    courseTitle: c.title,
    courseCategory: c.category,
    courseImage: c.image,
    courseInstructor: c.instructor,
    coursePrice: c.price,
    studentName: document.getElementById("studentName").value.trim(),
    studentEmail: document.getElementById("studentEmail").value.trim(),
    studentPhone: document.getElementById("studentPhone").value.trim(),
    studentCollege: document.getElementById("studentCollege").value.trim(),
    enrolledAt: new Date().toISOString()
  };

  enrollments.push(enrollment);
  saveEnrollmentsToStorage();
  lastEnrollment = enrollment;

  closeModal("enrollModal");
  document.getElementById("successMessage").textContent =
    `You've successfully enrolled in "${c.title}". Check your email at ${enrollment.studentEmail} for details.`;
  openModal("successModal");

  // Re-render to update buttons
  renderCourses();
  renderMyCourses();

  showToast("🎉 Enrollment confirmed!", "success");
}

/* ===== RENDER MY COURSES ===== */
function renderMyCourses() {
  const grid = document.getElementById("myCoursesGrid");
  const empty = document.getElementById("emptyState");

  if (enrollments.length === 0) {
    grid.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  grid.innerHTML = enrollments.map((e, i) => `
    <div class="my-course-card" style="animation-delay:${i*0.06}s">
      <img class="my-course-img" src="${e.courseImage}" alt="${e.courseTitle}"
        onerror="this.src='https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=300&q=80'" />
      <div class="my-course-info">
        <h4>${e.courseTitle}</h4>
        <p>by ${e.courseInstructor} • ${e.courseCategory}</p>
        <p class="enrolled-date">Enrolled: ${formatDate(e.enrolledAt)}</p>
        <div class="my-course-actions">
          <button class="btn-outline btn-sm" onclick="openCourseModal('${e.courseId}')">View</button>
          <button class="btn-outline btn-sm" onclick="downloadReceiptById('${e.id}')">⬇ Receipt</button>
          <button class="btn-danger btn-sm" onclick="removeEnrollment('${e.id}')">Remove</button>
        </div>
      </div>
    </div>
  `).join("");
}

/* ===== FORMAT DATE ===== */
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/* ===== REMOVE ENROLLMENT ===== */
function removeEnrollment(enrollmentId) {
  if (!confirm("Are you sure you want to remove this enrollment?")) return;
  enrollments = enrollments.filter(e => e.id !== enrollmentId);
  saveEnrollmentsToStorage();
  renderCourses();
  renderMyCourses();
  showToast("Enrollment removed.", "");
}

/* ===== DOWNLOAD RECEIPT ===== */
function downloadReceipt() {
  if (!lastEnrollment) return;
  generateReceiptHTML(lastEnrollment);
}
function downloadReceiptById(enrollmentId) {
  const e = enrollments.find(e => e.id === enrollmentId);
  if (e) generateReceiptHTML(e);
}

function generateReceiptHTML(e) {
  const receiptHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Enrollment Receipt — EduVerse</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', sans-serif; background: #f5f5f5; display: flex; justify-content: center; padding: 40px 20px; }
  .receipt { background: #fff; max-width: 580px; width: 100%; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
  .receipt-header { background: #1a3c5e; color: #fff; padding: 32px 36px; }
  .receipt-header .brand { font-size: 1.6rem; font-weight: 700; margin-bottom: 4px; }
  .receipt-header .brand em { color: #e8724a; }
  .receipt-header p { opacity: 0.7; font-size: 0.9rem; }
  .receipt-body { padding: 36px; }
  .receipt-title { font-size: 1.3rem; font-weight: 700; color: #1a3c5e; margin-bottom: 6px; }
  .receipt-id { font-size: 0.78rem; color: #6b7280; margin-bottom: 28px; }
  .section-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 14px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 28px; }
  .info-item { display: flex; flex-direction: column; gap: 3px; }
  .info-item .label { font-size: 0.75rem; color: #9ca3af; font-weight: 600; text-transform: uppercase; }
  .info-item .value { font-size: 0.92rem; color: #111; font-weight: 500; }
  .course-box { background: #f8f7f4; border-radius: 10px; padding: 20px; margin-bottom: 28px; }
  .course-box .course-name { font-size: 1.1rem; font-weight: 700; color: #1a3c5e; margin-bottom: 6px; }
  .course-box .course-meta { font-size: 0.84rem; color: #6b7280; }
  .price-row { display: flex; justify-content: space-between; align-items: center; background: #1a3c5e; color: #fff; padding: 18px 20px; border-radius: 10px; margin-bottom: 28px; }
  .price-row .label { font-size: 0.85rem; opacity: 0.8; }
  .price-row .amount { font-size: 1.6rem; font-weight: 700; }
  .price-row .amount.free { color: #34d399; }
  .receipt-footer { text-align: center; padding: 20px; background: #f8f7f4; font-size: 0.8rem; color: #9ca3af; border-top: 1px solid #e5e7eb; }
  @media print {
    body { background: #fff; padding: 0; }
    .receipt { box-shadow: none; border-radius: 0; max-width: 100%; }
    .print-btn { display: none; }
  }
</style>
</head>
<body>
<div class="receipt">
  <div class="receipt-header">
    <div class="brand">Edu<em>Verse</em></div>
    <p>Official Enrollment Receipt</p>
  </div>
  <div class="receipt-body">
    <div class="receipt-title">Enrollment Confirmation</div>
    <div class="receipt-id">Receipt ID: ${e.id.toUpperCase()} &nbsp;|&nbsp; ${formatDate(e.enrolledAt)}</div>

    <div class="section-label">Student Information</div>
    <div class="info-grid">
      <div class="info-item"><span class="label">Full Name</span><span class="value">${e.studentName}</span></div>
      <div class="info-item"><span class="label">Email</span><span class="value">${e.studentEmail}</span></div>
      <div class="info-item"><span class="label">Phone</span><span class="value">${e.studentPhone}</span></div>
      <div class="info-item"><span class="label">Institution</span><span class="value">${e.studentCollege}</span></div>
    </div>

    <div class="section-label">Course Details</div>
    <div class="course-box">
      <div class="course-name">${e.courseTitle}</div>
      <div class="course-meta">Instructor: ${e.courseInstructor} &nbsp;|&nbsp; Category: ${e.courseCategory}</div>
    </div>

    <div class="price-row">
      <div><div class="label">Amount Paid</div></div>
      <div class="amount ${e.coursePrice === 0 ? 'free' : ''}">${e.coursePrice === 0 ? "FREE" : "$" + e.coursePrice + ".00"}</div>
    </div>

    <div style="text-align:center; margin-bottom:20px;">
      <button class="print-btn" onclick="window.print()"
        style="background:#e8724a;color:#fff;border:none;padding:12px 28px;border-radius:8px;font-size:0.9rem;font-weight:600;cursor:pointer;">
        🖨 Print Receipt
      </button>
    </div>
  </div>
  <div class="receipt-footer">
    Thank you for choosing EduVerse. Happy learning! &nbsp;•&nbsp; hello@eduverse.io
  </div>
</div>
</body>
</html>`;

  // Open in new tab for printing/saving
  const blob = new Blob([receiptHTML], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `EduVerse_Receipt_${e.id}.html`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Receipt downloaded!", "success");
}

/* ===== MODAL HELPERS ===== */
function openModal(id) {
  const el = document.getElementById(id);
  el.style.display = "flex";
  setTimeout(() => el.classList.add("open"), 10);
  document.body.style.overflow = "hidden";
}
function closeModal(id) {
  const el = document.getElementById(id);
  el.classList.remove("open");
  el.style.display = "none";
  document.body.style.overflow = "";
}

/* ===== KEYBOARD ESC TO CLOSE MODALS ===== */
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    ["courseModal","enrollModal","successModal","adminLoginModal","adminCourseFormModal"].forEach(closeModal);
  }
});

/* ===== TOAST NOTIFICATION ===== */
function showToast(message, type = "") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast" + (type ? " " + type : "");
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

/* ===== ADMIN LOGIN ===== */
const ADMIN_USER = "admin";
const ADMIN_PASS = "1234";

function openAdminLogin() {
  document.getElementById("adminUser").value = "";
  document.getElementById("adminPass").value = "";
  document.getElementById("adminLoginError").textContent = "";
  openModal("adminLoginModal");
}

function adminLogin(e) {
  e.preventDefault();
  const user = document.getElementById("adminUser").value.trim();
  const pass = document.getElementById("adminPass").value;

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    closeModal("adminLoginModal");
    openAdminPanel();
  } else {
    document.getElementById("adminLoginError").textContent = "Invalid credentials. Try admin / 1234.";
  }
}

/* ===== ADMIN PANEL ===== */
function openAdminPanel() {
  document.getElementById("adminPanel").style.display = "flex";
  document.body.style.overflow = "hidden";
  renderAdminCourses();
  renderAdminEnrollments();
  showAdminTab("courses", document.querySelector(".admin-nav-item"));
}
function adminLogout() {
  document.getElementById("adminPanel").style.display = "none";
  document.body.style.overflow = "";
  showToast("Logged out of admin panel.");
}

function showAdminTab(tab, btn) {
  document.querySelectorAll(".admin-tab").forEach(t => t.style.display = "none");
  document.querySelectorAll(".admin-nav-item").forEach(b => b.classList.remove("active"));
  document.getElementById(`admin${tab.charAt(0).toUpperCase() + tab.slice(1)}Tab`).style.display = "block";
  btn.classList.add("active");

  if (tab === "enrollments") renderAdminEnrollments();
  if (tab === "courses") renderAdminCourses();
}

/* ===== RENDER ADMIN COURSES TABLE ===== */
function renderAdminCourses() {
  const tbody = document.getElementById("adminCoursesBody");
  if (courses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--clr-text-muted);padding:40px;">No courses yet. Add one!</td></tr>`;
    return;
  }
  tbody.innerHTML = courses.map(c => `
    <tr>
      <td><strong>${c.title}</strong></td>
      <td><span class="card-category" style="position:static;display:inline-block;">${c.category}</span></td>
      <td>${c.instructor}</td>
      <td>${c.price === 0 ? "Free" : "$" + c.price}</td>
      <td class="table-actions">
        <button class="btn-outline btn-sm" onclick="openEditCourseForm('${c.id}')">Edit</button>
        <button class="btn-danger btn-sm" onclick="adminDeleteCourse('${c.id}')">Delete</button>
      </td>
    </tr>
  `).join("");
}

/* ===== RENDER ADMIN ENROLLMENTS TABLE ===== */
function renderAdminEnrollments() {
  const tbody = document.getElementById("adminEnrollmentsBody");
  const query = (document.getElementById("enrollmentSearch")?.value || "").toLowerCase().trim();

  const filtered = enrollments.filter(e =>
    !query ||
    e.studentName.toLowerCase().includes(query) ||
    e.courseTitle.toLowerCase().includes(query) ||
    e.studentEmail.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--clr-text-muted);padding:40px;">${query ? "No results found." : "No enrollments yet."}</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(e => `
    <tr>
      <td><strong>${e.studentName}</strong></td>
      <td>${e.studentEmail}</td>
      <td>${e.studentPhone}</td>
      <td>${e.studentCollege}</td>
      <td>${e.courseTitle}</td>
      <td>${formatDate(e.enrolledAt)}</td>
    </tr>
  `).join("");
}

/* ===== FILTER ENROLLMENTS ===== */
function filterEnrollments() {
  renderAdminEnrollments();
}

/* ===== ADMIN ADD COURSE ===== */
function openAddCourseForm() {
  document.getElementById("courseFormTitle").textContent = "Add New Course";
  document.getElementById("courseFormId").value = "";
  document.getElementById("courseForm").reset();
  openModal("adminCourseFormModal");
}

/* ===== ADMIN EDIT COURSE ===== */
function openEditCourseForm(courseId) {
  const c = courses.find(c => c.id === courseId);
  if (!c) return;
  document.getElementById("courseFormTitle").textContent = "Edit Course";
  document.getElementById("courseFormId").value = c.id;
  document.getElementById("cf_title").value = c.title;
  document.getElementById("cf_category").value = c.category;
  document.getElementById("cf_instructor").value = c.instructor;
  document.getElementById("cf_duration").value = c.duration;
  document.getElementById("cf_price").value = c.price;
  document.getElementById("cf_rating").value = c.rating;
  document.getElementById("cf_image").value = c.image;
  document.getElementById("cf_description").value = c.description;
  openModal("adminCourseFormModal");
}

/* ===== SAVE COURSE (ADD / EDIT) ===== */
function saveCourse(e) {
  e.preventDefault();
  const id = document.getElementById("courseFormId").value;
  const newData = {
    id: id || "c_" + Date.now(),
    title: document.getElementById("cf_title").value.trim(),
    category: document.getElementById("cf_category").value,
    instructor: document.getElementById("cf_instructor").value.trim(),
    duration: document.getElementById("cf_duration").value.trim(),
    price: parseFloat(document.getElementById("cf_price").value) || 0,
    rating: parseFloat(document.getElementById("cf_rating").value) || 4.0,
    image: document.getElementById("cf_image").value.trim() || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80",
    description: document.getElementById("cf_description").value.trim()
  };

  if (!newData.title || !newData.category || !newData.instructor) {
    showToast("Please fill all required fields.", "error");
    return;
  }

  if (id) {
    // Edit existing
    const idx = courses.findIndex(c => c.id === id);
    if (idx !== -1) courses[idx] = newData;
    showToast("Course updated successfully!", "success");
  } else {
    // Add new
    courses.push(newData);
    showToast("Course added successfully!", "success");
  }

  saveCoursesToStorage();
  renderCourses();
  renderAdminCourses();
  closeModal("adminCourseFormModal");
}

/* ===== DELETE COURSE ===== */
function adminDeleteCourse(courseId) {
  if (!confirm("Delete this course? This cannot be undone.")) return;
  courses = courses.filter(c => c.id !== courseId);
  // Remove enrollments for this course
  enrollments = enrollments.filter(e => e.courseId !== courseId);
  saveCoursesToStorage();
  saveEnrollmentsToStorage();
  renderCourses();
  renderMyCourses();
  renderAdminCourses();
  renderAdminEnrollments();
  showToast("Course deleted.", "");
}