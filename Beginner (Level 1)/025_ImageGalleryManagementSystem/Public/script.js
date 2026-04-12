/**
 * Image Gallery – Frontend Logic
 * Handles: upload, fetch, render, search, filter, sort, delete, download, modal
 */

// ── State ─────────────────────────────────────────────────────────────────────
let allImages = [];        // master list from server
let currentModalId = null; // id of image open in modal

// ── DOM Refs ──────────────────────────────────────────────────────────────────
const uploadForm     = document.getElementById("uploadForm");
const uploadBtn      = document.getElementById("uploadBtn");
const uploadStatus   = document.getElementById("uploadStatus");
const gallery        = document.getElementById("gallery");
const emptyMsg       = document.getElementById("emptyMsg");
const totalCount     = document.getElementById("totalCount");
const searchInput    = document.getElementById("searchInput");
const filterCategory = document.getElementById("filterCategory");
const sortOrder      = document.getElementById("sortOrder");

// Modal
const modal          = document.getElementById("modal");
const modalOverlay   = document.getElementById("modalOverlay");
const modalClose     = document.getElementById("modalClose");
const modalImg       = document.getElementById("modalImg");
const modalTitle     = document.getElementById("modalTitle");
const modalDesc      = document.getElementById("modalDesc");
const modalCategory  = document.getElementById("modalCategory");
const modalDate      = document.getElementById("modalDate");
const modalDownload  = document.getElementById("modalDownload");
const modalDelete    = document.getElementById("modalDelete");

// ── Utility ───────────────────────────────────────────────────────────────────
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

const setStatus = (msg, type = "success") => {
  uploadStatus.textContent = msg;
  uploadStatus.className = type;
  if (msg) setTimeout(() => (uploadStatus.textContent = ""), 4000);
};

// ── Fetch all images from server ──────────────────────────────────────────────
async function loadImages() {
  try {
    const res  = await fetch("/images");
    allImages  = await res.json();
    renderGallery();
  } catch {
    setStatus("Failed to load images.", "error");
  }
}

// ── Apply search / filter / sort and render ───────────────────────────────────
function renderGallery() {
  const query    = searchInput.value.trim().toLowerCase();
  const category = filterCategory.value;
  const sort     = sortOrder.value;

  let list = allImages.filter((img) => {
    const matchSearch   = img.title.toLowerCase().includes(query);
    const matchCategory = !category || img.category === category;
    return matchSearch && matchCategory;
  });

  list.sort((a, b) =>
    sort === "newest"
      ? new Date(b.uploadDate) - new Date(a.uploadDate)
      : new Date(a.uploadDate) - new Date(b.uploadDate)
  );

  // Update count
  totalCount.textContent = `${allImages.length} image${allImages.length !== 1 ? "s" : ""}`;

  // Clear gallery (keep emptyMsg in DOM)
  [...gallery.querySelectorAll(".card")].forEach((c) => c.remove());

  if (list.length === 0) {
    emptyMsg.style.display = "block";
    return;
  }
  emptyMsg.style.display = "none";

  list.forEach((img) => gallery.appendChild(createCard(img)));
}

// ── Build a card element ──────────────────────────────────────────────────────
function createCard(img) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = img.id;

  card.innerHTML = `
    <img class="card-thumb" src="/uploads/${img.filename}" alt="${img.title}" loading="lazy" />
    <div class="card-body">
      <div class="card-title" title="${img.title}">${img.title}</div>
      <div class="card-desc">${img.description || "No description"}</div>
      <div class="card-meta">
        <span class="card-cat">${img.category}</span>
        <span class="card-date">${formatDate(img.uploadDate)}</span>
      </div>
    </div>
    <div class="card-actions">
      <button class="btn-preview"  data-id="${img.id}">👁 Preview</button>
      <button class="btn-download" data-id="${img.id}">⬇ Save</button>
      <button class="btn-delete"   data-id="${img.id}">🗑 Delete</button>
    </div>
  `;

  // Thumbnail click → preview
  card.querySelector(".card-thumb").addEventListener("click", () => openModal(img.id));

  // Button actions
  card.querySelector(".btn-preview").addEventListener("click",  () => openModal(img.id));
  card.querySelector(".btn-download").addEventListener("click", () => downloadImage(img.id));
  card.querySelector(".btn-delete").addEventListener("click",   () => deleteImage(img.id));

  return card;
}

// ── Upload ────────────────────────────────────────────────────────────────────
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title       = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const category    = document.getElementById("category").value;
  const file        = document.getElementById("imageFile").files[0];

  if (!title || !category || !file) {
    return setStatus("Title, category and image are required.", "error");
  }

  const formData = new FormData();
  formData.append("title",       title);
  formData.append("description", description);
  formData.append("category",    category);
  formData.append("image",       file);

  uploadBtn.disabled   = true;
  uploadBtn.textContent = "Uploading…";

  try {
    const res  = await fetch("/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Upload failed.");

    setStatus(`✅ "${data.image.title}" uploaded!`, "success");
    uploadForm.reset();
    await loadImages();
  } catch (err) {
    setStatus(err.message, "error");
  } finally {
    uploadBtn.disabled    = false;
    uploadBtn.textContent = "Upload";
  }
});

// ── Delete ────────────────────────────────────────────────────────────────────
async function deleteImage(id) {
  if (!confirm("Delete this image? This cannot be undone.")) return;

  try {
    const res  = await fetch(`/image/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    if (currentModalId === id) closeModal();
    await loadImages();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
}

// ── Download ──────────────────────────────────────────────────────────────────
function downloadImage(id) {
  // Trigger browser download via hidden anchor
  const a = document.createElement("a");
  a.href = `/download/${id}`;
  a.click();
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function openModal(id) {
  const img = allImages.find((i) => i.id === id);
  if (!img) return;

  currentModalId = id;

  modalImg.src          = `/uploads/${img.filename}`;
  modalImg.alt          = img.title;
  modalTitle.textContent    = img.title;
  modalDesc.textContent     = img.description || "No description provided.";
  modalCategory.textContent = img.category;
  modalDate.textContent     = formatDate(img.uploadDate);

  modalDownload.onclick = () => downloadImage(id);
  modalDelete.onclick   = () => deleteImage(id);

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = "";
  modalImg.src    = "";
  currentModalId  = null;
}

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", closeModal);

// Close modal on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// ── Live search / filter / sort ───────────────────────────────────────────────
searchInput.addEventListener("input",      renderGallery);
filterCategory.addEventListener("change",  renderGallery);
sortOrder.addEventListener("change",       renderGallery);

// ── Init ──────────────────────────────────────────────────────────────────────
loadImages();