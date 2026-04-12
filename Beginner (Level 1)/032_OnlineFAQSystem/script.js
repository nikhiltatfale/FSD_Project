/**
 * FAQ Help Center - script.js
 * Handles: load/save, render, search, filter, accordion, admin CRUD
 */

// ============================================================
// INITIAL SAMPLE DATA
// ============================================================
const SAMPLE_FAQS = [
  {
    id: "faq_1",
    question: "What is this FAQ Help Center?",
    answer: "This is a self-service knowledge base where you can find answers to common questions about our product, account, and technical topics.",
    category: "General"
  },
  {
    id: "faq_2",
    question: "How do I contact support?",
    answer: "You can reach our support team via email at support@example.com or through the live chat widget in the bottom right corner.",
    category: "General"
  },
  {
    id: "faq_3",
    question: "How do I reset my password?",
    answer: "Go to the login page and click 'Forgot Password'. Enter your registered email address and we will send you a reset link within a few minutes.",
    category: "Account"
  },
  {
    id: "faq_4",
    question: "Can I change my account email address?",
    answer: "Yes. Navigate to Account Settings > Profile and click 'Change Email'. You will need to verify the new address before the change takes effect.",
    category: "Account"
  },
  {
    id: "faq_5",
    question: "Why is the app running slowly on my device?",
    answer: "Performance issues are usually caused by an outdated browser or cached data. Try clearing your browser cache, disabling extensions, or switching to a supported browser like Chrome or Firefox.",
    category: "Technical"
  },
  {
    id: "faq_6",
    question: "Which browsers are officially supported?",
    answer: "We officially support the latest two versions of Google Chrome, Mozilla Firefox, Apple Safari, and Microsoft Edge. Internet Explorer is not supported.",
    category: "Technical"
  }
];

const STORAGE_KEY = "faqHelpCenter_faqs";

// ============================================================
// STATE
// ============================================================
let faqs = [];           // Master FAQ array
let searchQuery = "";    // Current search string
let activeCategory = "all"; // Current category filter
let adminOpen = false;   // Admin panel visibility

// ============================================================
// LOCAL STORAGE HELPERS
// ============================================================

/** Load FAQs from localStorage, or seed with samples if empty */
function loadFAQs() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      faqs = JSON.parse(stored);
    } catch {
      faqs = [...SAMPLE_FAQS];
      saveFAQs();
    }
  } else {
    faqs = [...SAMPLE_FAQS];
    saveFAQs();
  }
}

/** Persist current FAQs array to localStorage */
function saveFAQs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(faqs));
}

// ============================================================
// UTILITY
// ============================================================

/** Generate a simple unique ID */
function generateId() {
  return "faq_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

/** Get unique sorted categories from FAQ list */
function getCategories() {
  const cats = faqs.map(f => f.category.trim()).filter(Boolean);
  return [...new Set(cats)].sort();
}

// ============================================================
// RENDERING - CATEGORY DROPDOWN
// ============================================================

function renderCategoryFilter() {
  const select = document.getElementById("categoryFilter");
  const current = select.value || "all";

  // Clear existing options except "All"
  select.innerHTML = '<option value="all">All Categories</option>';

  getCategories().forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });

  // Restore selection if it still exists
  if ([...select.options].some(o => o.value === current)) {
    select.value = current;
  } else {
    select.value = "all";
    activeCategory = "all";
  }
}

// ============================================================
// RENDERING - FAQ ACCORDION (main list)
// ============================================================

function renderFAQs() {
  const container = document.getElementById("faqList");
  const noResults = document.getElementById("noResults");
  container.innerHTML = "";

  // Apply search + category filters
  const filtered = faqs.filter(faq => {
    const matchSearch =
      !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery) ||
      faq.answer.toLowerCase().includes(searchQuery);
    const matchCat =
      activeCategory === "all" ||
      faq.category.toLowerCase() === activeCategory.toLowerCase();
    return matchSearch && matchCat;
  });

  if (filtered.length === 0) {
    noResults.style.display = "block";
    return;
  }
  noResults.style.display = "none";

  filtered.forEach(faq => {
    const item = document.createElement("div");
    item.className = "faq-item";
    item.dataset.id = faq.id;

    item.innerHTML = `
      <button class="faq-question" aria-expanded="false" aria-controls="ans_${faq.id}">
        <span>
          <span class="faq-tag">${escapeHTML(faq.category)}</span>
          ${escapeHTML(faq.question)}
        </span>
        <span class="arrow">▼</span>
      </button>
      <div class="faq-answer" id="ans_${faq.id}" role="region">
        <p>${escapeHTML(faq.answer)}</p>
      </div>
    `;

    container.appendChild(item);
  });
}

/** Escape HTML to prevent XSS */
function escapeHTML(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ============================================================
// ACCORDION TOGGLE (event delegation)
// ============================================================

document.getElementById("faqList").addEventListener("click", function (e) {
  const btn = e.target.closest(".faq-question");
  if (!btn) return;

  const item = btn.closest(".faq-item");
  const isOpen = item.classList.contains("open");

  // Close all open items
  document.querySelectorAll(".faq-item.open").forEach(el => {
    el.classList.remove("open");
    el.querySelector(".faq-question").setAttribute("aria-expanded", "false");
  });

  // If it wasn't open, open it
  if (!isOpen) {
    item.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
  }
});

// ============================================================
// SEARCH
// ============================================================

document.getElementById("searchInput").addEventListener("input", function () {
  searchQuery = this.value.trim().toLowerCase();
  renderFAQs();
});

// ============================================================
// CATEGORY FILTER
// ============================================================

document.getElementById("categoryFilter").addEventListener("change", function () {
  activeCategory = this.value;
  renderFAQs();
});

// ============================================================
// ADMIN PANEL TOGGLE
// ============================================================

/** Open admin modal */
function openAdmin() {
  adminOpen = true;
  document.getElementById("adminModal").style.display = "block";
  document.getElementById("overlay").style.display = "block";
  renderAdminFAQList();
}

/** Close admin modal and reset form */
function closeAdmin() {
  adminOpen = false;
  document.getElementById("adminModal").style.display = "none";
  document.getElementById("overlay").style.display = "none";
  resetForm();
}

// Admin button click
document.getElementById("adminToggleBtn").addEventListener("click", function () {
  adminOpen ? closeAdmin() : openAdmin();
});

// Close via X button
document.getElementById("closeModal").addEventListener("click", closeAdmin);

// Close via overlay click
document.getElementById("overlay").addEventListener("click", closeAdmin);

// Keyboard shortcut: Ctrl+Shift+A
document.addEventListener("keydown", function (e) {
  if (e.ctrlKey && e.shiftKey && e.key === "A") {
    e.preventDefault();
    adminOpen ? closeAdmin() : openAdmin();
  }
});

// ============================================================
// RENDERING - ADMIN FAQ LIST (manage rows)
// ============================================================

function renderAdminFAQList() {
  const container = document.getElementById("adminFaqList");
  container.innerHTML = "";

  if (faqs.length === 0) {
    container.innerHTML = "<p style='color:#888;font-size:.9rem;'>No FAQs yet.</p>";
    return;
  }

  faqs.forEach(faq => {
    const row = document.createElement("div");
    row.className = "admin-faq-row";
    row.dataset.id = faq.id;

    row.innerHTML = `
      <span title="${escapeHTML(faq.answer)}">
        <strong>[${escapeHTML(faq.category)}]</strong> ${escapeHTML(faq.question)}
      </span>
      <div class="row-btns">
        <button class="btn-edit" data-id="${faq.id}">Edit</button>
        <button class="btn-delete" data-id="${faq.id}">Delete</button>
      </div>
    `;

    container.appendChild(row);
  });
}

// Event delegation for Edit/Delete inside admin list
document.getElementById("adminFaqList").addEventListener("click", function (e) {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains("btn-edit")) {
    startEdit(id);
  } else if (e.target.classList.contains("btn-delete")) {
    deleteFAQ(id);
  }
});

// ============================================================
// ADD / EDIT FORM LOGIC
// ============================================================

const faqForm = document.getElementById("faqForm");
const editIdInput = document.getElementById("editId");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEdit");

/** Handle form submit - add or update FAQ */
faqForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const question = document.getElementById("faqQuestion").value.trim();
  const answer = document.getElementById("faqAnswer").value.trim();
  const category = document.getElementById("faqCategory").value.trim();
  const editId = editIdInput.value;

  if (!question || !answer || !category) return;

  if (editId) {
    // UPDATE existing
    const idx = faqs.findIndex(f => f.id === editId);
    if (idx !== -1) {
      faqs[idx] = { id: editId, question, answer, category };
    }
  } else {
    // ADD new
    faqs.push({ id: generateId(), question, answer, category });
  }

  saveFAQs();
  renderCategoryFilter();
  renderFAQs();
  renderAdminFAQList();
  resetForm();
});

/** Populate form with FAQ data for editing */
function startEdit(id) {
  const faq = faqs.find(f => f.id === id);
  if (!faq) return;

  editIdInput.value = faq.id;
  document.getElementById("faqQuestion").value = faq.question;
  document.getElementById("faqAnswer").value = faq.answer;
  document.getElementById("faqCategory").value = faq.category;

  submitBtn.textContent = "Update FAQ";
  cancelEditBtn.style.display = "inline-block";

  // Scroll form into view
  faqForm.scrollIntoView({ behavior: "smooth" });
}

/** Cancel editing, reset form */
cancelEditBtn.addEventListener("click", resetForm);

function resetForm() {
  faqForm.reset();
  editIdInput.value = "";
  submitBtn.textContent = "Add FAQ";
  cancelEditBtn.style.display = "none";
}

// ============================================================
// DELETE FAQ
// ============================================================

function deleteFAQ(id) {
  if (!confirm("Delete this FAQ? This cannot be undone.")) return;
  faqs = faqs.filter(f => f.id !== id);
  saveFAQs();
  renderCategoryFilter();
  renderFAQs();
  renderAdminFAQList();
}

// ============================================================
// INIT
// ============================================================

function init() {
  loadFAQs();
  renderCategoryFilter();
  renderFAQs();
}

init();