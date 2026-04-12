/* =========================================================
   FILE UPLOAD SYSTEM — script.js
   Features: drag/drop, validation, fake progress, gallery,
             search, sort, dark mode, toast notifications
   ========================================================= */

'use strict';

// ─── CONFIG ────────────────────────────────────────────────
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'image/jpeg','image/png','image/gif','image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];
const ALLOWED_EXTS = ['.jpg','.jpeg','.png','.gif','.webp','.pdf','.docx','.txt'];

// ─── STATE ─────────────────────────────────────────────────
let pendingFiles   = [];   // { id, file, status, progress }
let uploadedFiles  = [];   // { id, file, name, size, date, dataURL }
let nextId         = 1;

// ─── DOM REFS ──────────────────────────────────────────────
const dropZone             = document.getElementById('dropZone');
const fileInput            = document.getElementById('fileInput');
const browseBtn            = document.getElementById('browseBtn');
const fileListSection      = document.getElementById('fileListSection');
const fileList             = document.getElementById('fileList');
const fileCount            = document.getElementById('fileCount');
const uploadBtn            = document.getElementById('uploadBtn');
const clearAllBtn          = document.getElementById('clearAllBtn');
const gallerySection       = document.getElementById('gallerySection');
const gallery              = document.getElementById('gallery');
const galleryCount         = document.getElementById('galleryCount');
const searchInput          = document.getElementById('searchInput');
const sortSelect           = document.getElementById('sortSelect');
const totalProgressSection = document.getElementById('totalProgressSection');
const totalProgressFill    = document.getElementById('totalProgressFill');
const totalProgressText    = document.getElementById('totalProgressText');
const toastContainer       = document.getElementById('toastContainer');
const themeToggle          = document.getElementById('themeToggle');

// ─── THEME TOGGLE ──────────────────────────────────────────
themeToggle.addEventListener('click', () => {
  const html  = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  themeToggle.textContent = isDark ? '🌙 Dark Mode' : '☀️ Light Mode';
});

// ─── DRAG & DROP ───────────────────────────────────────────
dropZone.addEventListener('dragenter', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', e => { e.preventDefault(); dropZone.classList.remove('drag-over'); });
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  handleFiles(Array.from(e.dataTransfer.files));
});

// Click on drop zone (not on buttons)
dropZone.addEventListener('click', e => {
  if (e.target !== browseBtn) fileInput.click();
});

// Browse button
browseBtn.addEventListener('click', e => {
  e.stopPropagation();
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  handleFiles(Array.from(fileInput.files));
  fileInput.value = ''; // reset so same file can be re-added
});

// ─── FILE VALIDATION ───────────────────────────────────────
function isValidType(file) {
  if (ALLOWED_TYPES.includes(file.type)) return true;
  // Fallback: check extension
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  return ALLOWED_EXTS.includes(ext);
}

function isValidSize(file) {
  return file.size <= MAX_FILE_SIZE;
}

// ─── HANDLE NEW FILES ──────────────────────────────────────
function handleFiles(files) {
  let addedCount = 0;
  files.forEach(file => {
    // Check duplicate name
    const duplicate = pendingFiles.find(f => f.file.name === file.name);
    if (duplicate) {
      showToast(`"${file.name}" is already in the list.`, 'warning');
      return;
    }

    if (!isValidType(file)) {
      showToast(`❌ "${file.name}": Invalid file type.`, 'error');
      return;
    }
    if (!isValidSize(file)) {
      showToast(`❌ "${file.name}": Exceeds 5MB limit.`, 'error');
      return;
    }

    pendingFiles.push({ id: nextId++, file, status: 'waiting', progress: 0 });
    addedCount++;
  });

  if (addedCount > 0) {
    showToast(`✅ ${addedCount} file(s) added.`, 'success');
    renderFileList();
  }
}

// ─── RENDER FILE LIST ──────────────────────────────────────
function renderFileList() {
  fileList.innerHTML = '';
  fileCount.textContent = pendingFiles.length;

  if (pendingFiles.length === 0) {
    fileListSection.style.display = 'none';
    totalProgressSection.style.display = 'none';
    return;
  }

  fileListSection.style.display = 'block';

  pendingFiles.forEach(item => {
    const card = document.createElement('div');
    card.className = 'file-card';
    card.id = `card-${item.id}`;

    card.innerHTML = `
      <div class="file-preview" id="preview-${item.id}">
        ${getFileIcon(item.file)}
      </div>
      <div class="file-info">
        <div class="file-name">${escapeHTML(item.file.name)}</div>
        <div class="file-meta">${getTypLabel(item.file)} &nbsp;·&nbsp; ${formatSize(item.file.size)}</div>
      </div>
      <div class="file-progress-wrap">
        <div class="file-status-text ${item.status}" id="status-${item.id}">
          ${capitalize(item.status)}
        </div>
        <div class="file-progress-bar">
          <div class="file-progress-fill ${item.status}" id="fill-${item.id}" style="width:${item.progress}%"></div>
        </div>
      </div>
      <div class="file-actions">
        ${item.status === 'waiting' ? `<button class="btn-remove" onclick="removeFile(${item.id})">✕ Remove</button>` : ''}
      </div>
    `;

    fileList.appendChild(card);

    // If image, render thumbnail
    if (item.file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        const el = document.getElementById(`preview-${item.id}`);
        if (el) el.innerHTML = `<img src="${e.target.result}" alt="preview"/>`;
      };
      reader.readAsDataURL(item.file);
    }
  });
}

// ─── REMOVE PENDING FILE ───────────────────────────────────
function removeFile(id) {
  pendingFiles = pendingFiles.filter(f => f.id !== id);
  renderFileList();
  showToast('File removed.', 'info');
}

// Expose globally (used in onclick)
window.removeFile = removeFile;

// ─── CLEAR ALL ─────────────────────────────────────────────
clearAllBtn.addEventListener('click', () => {
  // Only clear waiting files
  const uploading = pendingFiles.filter(f => f.status === 'uploading');
  if (uploading.length > 0) {
    showToast('Cannot clear files that are uploading.', 'warning');
    return;
  }
  pendingFiles = [];
  renderFileList();
  totalProgressSection.style.display = 'none';
  showToast('All pending files cleared.', 'info');
});

// ─── UPLOAD BUTTON ─────────────────────────────────────────
uploadBtn.addEventListener('click', () => {
  const waiting = pendingFiles.filter(f => f.status === 'waiting');
  if (waiting.length === 0) {
    showToast('No files waiting to upload.', 'warning');
    return;
  }
  showToast(`🚀 Uploading ${waiting.length} file(s)...`, 'info');
  totalProgressSection.style.display = 'block';
  waiting.forEach(item => startUpload(item));
});

// ─── SIMULATE UPLOAD ───────────────────────────────────────
function startUpload(item) {
  item.status = 'uploading';
  updateCardStatus(item);

  // Read file as dataURL (for gallery preview later)
  const reader = new FileReader();
  reader.readAsDataURL(item.file);

  const interval = setInterval(() => {
    // Random increment 5-15%
    item.progress += Math.floor(Math.random() * 11) + 5;

    if (item.progress >= 100) {
      item.progress = 100;
      clearInterval(interval);

      // 10% chance of simulated failure
      if (Math.random() < 0.1) {
        item.status = 'failed';
        updateCardStatus(item);
        showToast(`❌ "${item.file.name}" upload failed.`, 'error');
      } else {
        item.status = 'completed';
        updateCardStatus(item);
        showToast(`✅ "${item.file.name}" uploaded!`, 'success');

        // Move to gallery
        reader.onload = e => {
          addToGallery(item, e.target.result);
          // Remove from pending after short delay
          setTimeout(() => {
            pendingFiles = pendingFiles.filter(f => f.id !== item.id);
            renderFileList();
            updateTotalProgress();
          }, 600);
        };
        // If reader already finished
        if (reader.readyState === FileReader.DONE) {
          addToGallery(item, reader.result);
          setTimeout(() => {
            pendingFiles = pendingFiles.filter(f => f.id !== item.id);
            renderFileList();
            updateTotalProgress();
          }, 600);
        }
      }
    }

    updateFill(item);
    updateTotalProgress();
  }, 150);
}

// ─── UPDATE CARD UI ────────────────────────────────────────
function updateCardStatus(item) {
  const statusEl = document.getElementById(`status-${item.id}`);
  const fillEl   = document.getElementById(`fill-${item.id}`);
  if (statusEl) {
    statusEl.className = `file-status-text ${item.status}`;
    statusEl.textContent = capitalize(item.status);
  }
  if (fillEl) {
    fillEl.className = `file-progress-fill ${item.status}`;
  }
  // Hide remove button when uploading
  const card = document.getElementById(`card-${item.id}`);
  if (card) {
    const actions = card.querySelector('.file-actions');
    if (actions && item.status !== 'waiting') actions.innerHTML = '';
  }
}

function updateFill(item) {
  const fillEl = document.getElementById(`fill-${item.id}`);
  if (fillEl) fillEl.style.width = item.progress + '%';
}

// ─── TOTAL PROGRESS ────────────────────────────────────────
function updateTotalProgress() {
  if (pendingFiles.length === 0) {
    totalProgressFill.style.width = '0%';
    totalProgressText.textContent = '0%';
    return;
  }
  const total = pendingFiles.reduce((sum, f) => sum + f.progress, 0);
  const avg = Math.round(total / pendingFiles.length);
  totalProgressFill.style.width = avg + '%';
  totalProgressText.textContent = avg + '%';
}

// ─── GALLERY ───────────────────────────────────────────────
function addToGallery(item, dataURL) {
  uploadedFiles.push({
    id:      item.id,
    file:    item.file,
    name:    item.file.name,
    size:    item.file.size,
    date:    new Date(),
    dataURL: dataURL || null
  });
  renderGallery();
}

function renderGallery() {
  const query   = searchInput.value.trim().toLowerCase();
  const sortBy  = sortSelect.value;

  let filtered = uploadedFiles.filter(f => f.name.toLowerCase().includes(query));

  // Sort
  filtered.sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'size') return a.size - b.size;
    if (sortBy === 'date') return b.date - a.date;
    return 0;
  });

  galleryCount.textContent = filtered.length;
  gallery.innerHTML = '';

  if (filtered.length === 0) {
    gallerySection.style.display = uploadedFiles.length > 0 ? 'block' : 'none';
    if (uploadedFiles.length > 0) gallery.innerHTML = '<p style="color:var(--text2);padding:12px;">No files match your search.</p>';
    return;
  }

  gallerySection.style.display = 'block';

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'gallery-card';

    const isImage = item.file.type.startsWith('image/');
    const previewHTML = isImage && item.dataURL
      ? `<img src="${item.dataURL}" alt="${escapeHTML(item.name)}"/>`
      : getFileIcon(item.file);

    card.innerHTML = `
      <div class="gallery-preview">${previewHTML}</div>
      <div class="gallery-name">${escapeHTML(item.name)}</div>
      <div class="gallery-size">${formatSize(item.size)}</div>
      <div class="gallery-date">${formatDate(item.date)}</div>
      <div class="gallery-btns">
        <button class="btn-download" onclick="downloadFile(${item.id})">⬇ Download</button>
        <button class="btn-delete"   onclick="deleteGalleryFile(${item.id})">🗑</button>
      </div>
    `;
    gallery.appendChild(card);
  });
}

// ─── GALLERY ACTIONS ───────────────────────────────────────
function downloadFile(id) {
  const item = uploadedFiles.find(f => f.id === id);
  if (!item) return;
  if (item.dataURL) {
    const a = document.createElement('a');
    a.href     = item.dataURL;
    a.download = item.name;
    a.click();
  } else {
    showToast('Download not available.', 'warning');
  }
}

function deleteGalleryFile(id) {
  uploadedFiles = uploadedFiles.filter(f => f.id !== id);
  renderGallery();
  showToast('File deleted.', 'info');
}

window.downloadFile     = downloadFile;
window.deleteGalleryFile = deleteGalleryFile;

// ─── SEARCH & SORT ─────────────────────────────────────────
searchInput.addEventListener('input', renderGallery);
sortSelect.addEventListener('change', renderGallery);

// ─── TOAST NOTIFICATIONS ───────────────────────────────────
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ─── HELPERS ───────────────────────────────────────────────
function formatSize(bytes) {
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatDate(date) {
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getTypLabel(file) {
  if (file.type.startsWith('image/')) return 'Image';
  if (file.type === 'application/pdf') return 'PDF';
  if (file.type.includes('wordprocessingml')) return 'DOCX';
  if (file.type === 'text/plain') return 'TXT';
  return file.type || 'Unknown';
}

function getFileIcon(file) {
  if (file.type.startsWith('image/'))         return '🖼️';
  if (file.type === 'application/pdf')         return '📄';
  if (file.type.includes('wordprocessingml')) return '📝';
  if (file.type === 'text/plain')              return '📃';
  return '📁';
}