// ===== STATE =====
let pdfFiles = []; // Array of { id, file, name, size }
let dragSrcIndex = null; // Index of item being dragged (for reorder)

// ===== DOM REFS =====
const dropZone     = document.getElementById('drop-zone');
const fileInput    = document.getElementById('file-input');
const fileList     = document.getElementById('file-list');
const mergeBtn     = document.getElementById('merge-btn');
const clearBtn     = document.getElementById('clear-btn');
const progressArea = document.getElementById('progress-area');
const stats        = document.getElementById('stats');
const fileCount    = document.getElementById('file-count');
const totalSize    = document.getElementById('total-size');
const toast        = document.getElementById('toast');

// ===== TOAST =====
let toastTimer = null;
function showToast(msg, type = 'info') {
  toast.textContent = msg;
  toast.className = 'show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = ''; }, 3000);
}

// ===== FORMAT FILE SIZE =====
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// ===== UNIQUE ID =====
let idCounter = 0;
function nextId() { return ++idCounter; }

// ===== VALIDATE PDF (basic check) =====
async function isPdfValid(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target.result);
      // Check PDF magic bytes: %PDF
      const magic = String.fromCharCode(arr[0], arr[1], arr[2], arr[3]);
      resolve(magic === '%PDF');
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
}

// ===== ADD FILES =====
async function addFiles(fileArray) {
  let added = 0;
  let skipped = 0;

  for (const file of fileArray) {
    // Check MIME type
    if (file.type !== 'application/pdf') {
      skipped++;
      continue;
    }
    // Validate magic bytes
    const valid = await isPdfValid(file);
    if (!valid) {
      skipped++;
      showToast(`"${file.name}" appears to be a corrupted or invalid PDF.`, 'error');
      continue;
    }
    pdfFiles.push({ id: nextId(), file, name: file.name, size: file.size });
    added++;
  }

  if (skipped > 0 && added === 0) {
    showToast(`${skipped} invalid/non-PDF file(s) skipped.`, 'error');
  } else if (added > 0) {
    showToast(`${added} PDF(s) added successfully.`, 'success');
  }

  renderList();
  updateStats();
  updateMergeBtn();
}

// ===== RENDER FILE LIST =====
function renderList() {
  fileList.innerHTML = '';

  pdfFiles.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'file-item';
    li.dataset.index = index;
    li.draggable = true;

    li.innerHTML = `
      <span class="drag-handle" title="Drag to reorder">☰</span>
      <span class="file-name" title="${item.name}">${item.name}</span>
      <span class="file-size">${formatSize(item.size)}</span>
      <button class="remove-btn" data-id="${item.id}" title="Remove">✕</button>
    `;

    // Drag events for reorder
    li.addEventListener('dragstart', onDragStart);
    li.addEventListener('dragover',  onDragOver);
    li.addEventListener('dragleave', onDragLeave);
    li.addEventListener('drop',      onDrop);
    li.addEventListener('dragend',   onDragEnd);

    // Remove button
    li.querySelector('.remove-btn').addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      removeFile(id);
    });

    fileList.appendChild(li);
  });
}

// ===== REMOVE FILE =====
function removeFile(id) {
  pdfFiles = pdfFiles.filter(f => f.id !== id);
  renderList();
  updateStats();
  updateMergeBtn();
  showToast('File removed.', 'info');
}

// ===== CLEAR ALL =====
clearBtn.addEventListener('click', () => {
  pdfFiles = [];
  renderList();
  updateStats();
  updateMergeBtn();
  showToast('All files cleared.', 'info');
});

// ===== UPDATE STATS BAR =====
function updateStats() {
  const count = pdfFiles.length;
  const total = pdfFiles.reduce((acc, f) => acc + f.size, 0);
  fileCount.textContent = count + (count === 1 ? ' file' : ' files');
  totalSize.textContent = formatSize(total);
  stats.style.display = count > 0 ? 'flex' : 'none';
}

// ===== UPDATE MERGE BUTTON =====
function updateMergeBtn() {
  mergeBtn.disabled = pdfFiles.length < 2;
}

// ===== FILE INPUT CHANGE =====
fileInput.addEventListener('change', (e) => {
  addFiles(Array.from(e.target.files));
  fileInput.value = ''; // reset so same file can be re-added
});

// ===== DROP ZONE - file drop =====
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const files = Array.from(e.dataTransfer.files);
  if (files.length === 0) return;
  addFiles(files);
});

// ===== DROP ZONE - click to browse =====
dropZone.addEventListener('click', (e) => {
  // Don't trigger if clicking the label (it already triggers input)
  if (e.target.id !== 'browse-btn') {
    fileInput.click();
  }
});

// ===== REORDER DRAG & DROP =====
function onDragStart(e) {
  dragSrcIndex = parseInt(e.currentTarget.dataset.index);
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  // Set data so browser allows drag
  e.dataTransfer.setData('text/plain', dragSrcIndex);
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}

function onDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  e.stopPropagation(); // prevent triggering drop zone
  const targetIndex = parseInt(e.currentTarget.dataset.index);
  e.currentTarget.classList.remove('drag-over');

  if (dragSrcIndex === null || dragSrcIndex === targetIndex) return;

  // Reorder array
  const moved = pdfFiles.splice(dragSrcIndex, 1)[0];
  pdfFiles.splice(targetIndex, 0, moved);

  renderList();
  updateStats();
  showToast('Order updated.', 'info');
}

function onDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  // Clean up all drag-over highlights
  document.querySelectorAll('.file-item').forEach(el => el.classList.remove('drag-over'));
  dragSrcIndex = null;
}

// ===== MERGE PDFs =====
mergeBtn.addEventListener('click', async () => {
  if (pdfFiles.length < 2) {
    showToast('Please add at least 2 PDF files to merge.', 'error');
    return;
  }

  // Show progress
  progressArea.style.display = 'block';
  mergeBtn.disabled = true;

  try {
    const { PDFDocument } = PDFLib;

    // Create a new merged PDF document
    const mergedPdf = await PDFDocument.create();

    for (let i = 0; i < pdfFiles.length; i++) {
      const file = pdfFiles[i].file;

      // Read file as ArrayBuffer
      const arrayBuffer = await readFileAsArrayBuffer(file);

      let srcDoc;
      try {
        srcDoc = await PDFDocument.load(arrayBuffer, {
          ignoreEncryption: true // try to load encrypted PDFs gracefully
        });
      } catch (err) {
        showToast(`Failed to read "${file.name}". It may be corrupted or encrypted.`, 'error');
        progressArea.style.display = 'none';
        mergeBtn.disabled = false;
        updateMergeBtn();
        return;
      }

      // Copy all pages from source into merged doc
      const pages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    }

    // Serialize merged PDF
    const mergedBytes = await mergedPdf.save();

    // Create Blob and trigger download
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'merged.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up object URL after a brief delay
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    showToast('PDFs merged successfully! Downloading...', 'success');

  } catch (err) {
    console.error('Merge error:', err);
    showToast('An unexpected error occurred during merging. Check console.', 'error');
  } finally {
    progressArea.style.display = 'none';
    updateMergeBtn();
  }
});

// ===== HELPER: Read file as ArrayBuffer =====
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
}