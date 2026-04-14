// ============================================================
//  ImageCompress Pro — script.js
//  All logic: upload, compress, preview, download, validation
// ============================================================

// ---- DOM refs ----
const dropZone       = document.getElementById('drop-zone');
const fileInput      = document.getElementById('file-input');
const errorMsg       = document.getElementById('error-msg');
const controlsSection= document.getElementById('controls-section');
const previewSection = document.getElementById('preview-section');
const spinner        = document.getElementById('spinner');

const fileNameDisplay= document.getElementById('file-name-display');
const fileDims       = document.getElementById('file-dims');
const fileFormat     = document.getElementById('file-format');

const qualitySlider  = document.getElementById('quality-slider');
const qualityVal     = document.getElementById('quality-val');
const resizeW        = document.getElementById('resize-w');
const resizeH        = document.getElementById('resize-h');
const aspectRatio    = document.getElementById('aspect-ratio');
const outputFormat   = document.getElementById('output-format');

const compressBtn    = document.getElementById('compress-btn');
const resetBtn       = document.getElementById('reset-btn');
const downloadBtn    = document.getElementById('download-btn');

const originalPreview    = document.getElementById('original-preview');
const compressedPreview  = document.getElementById('compressed-preview');
const originalSizeLabel  = document.getElementById('original-size-label');
const compressedSizeLabel= document.getElementById('compressed-size-label');

const statOriginal   = document.getElementById('stat-original');
const statCompressed = document.getElementById('stat-compressed');
const statSaved      = document.getElementById('stat-saved');

const canvas         = document.getElementById('canvas');
const ctx            = canvas.getContext('2d');
const toast          = document.getElementById('toast');

// ---- State ----
let originalFile    = null;   // File object
let originalImage   = null;   // HTMLImageElement
let originalBytes   = 0;
let compressedBlob  = null;
let originalAspect  = 1;

// ---- Supported MIME types ----
const SUPPORTED = ['image/jpeg', 'image/png', 'image/webp'];

// ============================================================
//  UTILITY: human-readable file size
// ============================================================
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// ============================================================
//  UTILITY: show toast message
// ============================================================
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ============================================================
//  UTILITY: show / hide spinner
// ============================================================
function showSpinner(val) {
  spinner.classList.toggle('hidden', !val);
}

// ============================================================
//  VALIDATE FILE
// ============================================================
function validateFile(file) {
  if (!file) return false;
  if (!SUPPORTED.includes(file.type)) {
    errorMsg.textContent = '❌ Unsupported format. Please upload JPG, PNG, or WEBP.';
    return false;
  }
  errorMsg.textContent = '';
  return true;
}

// ============================================================
//  LOAD & DISPLAY original image info
// ============================================================
function loadImage(file) {
  originalFile  = file;
  originalBytes = file.size;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      originalImage  = img;
      originalAspect = img.width / img.height;

      // Populate file info
      fileNameDisplay.textContent = '📄 ' + file.name;
      fileDims.textContent = `📐 ${img.width} × ${img.height}px`;
      fileFormat.textContent = '🎨 ' + file.type.split('/')[1].toUpperCase();

      // Show original preview
      originalPreview.src = e.target.result;
      originalSizeLabel.textContent = formatBytes(originalBytes);

      // Auto-set output format to match input
      const ext = file.type.split('/')[1];
      outputFormat.value = (ext === 'jpg' || ext === 'jpeg') ? 'jpeg' : ext;

      // Prefill resize with original dimensions
      resizeW.value = img.width;
      resizeH.value = img.height;

      // Show controls, hide preview until compress clicked
      controlsSection.classList.remove('hidden');
      previewSection.classList.add('hidden');
      compressedBlob = null;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ============================================================
//  COMPRESSION LOGIC (canvas + toBlob)
// ============================================================
function compressImage() {
  if (!originalImage) return;

  showSpinner(true);
  previewSection.classList.add('hidden');

  // Small timeout so spinner renders before heavy canvas work
  setTimeout(() => {
    // Determine output dimensions
    let outW = parseInt(resizeW.value) || originalImage.width;
    let outH = parseInt(resizeH.value) || originalImage.height;

    // Clamp to sane minimum
    outW = Math.max(1, outW);
    outH = Math.max(1, outH);

    // Set canvas size
    canvas.width  = outW;
    canvas.height = outH;

    // Draw image onto canvas (handles resize)
    ctx.clearRect(0, 0, outW, outH);
    ctx.drawImage(originalImage, 0, 0, outW, outH);

    const format  = 'image/' + outputFormat.value;
    const quality = parseInt(qualitySlider.value) / 100;

    // PNG ignores quality in toBlob but we still call it consistently
    canvas.toBlob((blob) => {
      if (!blob) {
        showSpinner(false);
        errorMsg.textContent = '❌ Compression failed. Please try again.';
        return;
      }

      compressedBlob = blob;

      // Show compressed preview
      const url = URL.createObjectURL(blob);
      compressedPreview.src = url;
      const compressedBytes = blob.size;
      compressedSizeLabel.textContent = formatBytes(compressedBytes);

      // Stats
      statOriginal.textContent    = formatBytes(originalBytes);
      statCompressed.textContent  = formatBytes(compressedBytes);
      const saved = originalBytes - compressedBytes;
      const pct   = ((saved / originalBytes) * 100).toFixed(1);
      if (saved > 0) {
        statSaved.textContent = `${formatBytes(saved)} (${pct}% smaller)`;
        statSaved.className   = 'stat-val green';
      } else {
        // Compressed is larger (common with PNG → higher quality)
        statSaved.textContent = `+${formatBytes(Math.abs(saved))} (${Math.abs(pct)}% larger)`;
        statSaved.className   = 'stat-val';
        statSaved.style.color = '#d32f2f';
      }

      showSpinner(false);
      previewSection.classList.remove('hidden');
    }, format, format === 'image/png' ? undefined : quality);

  }, 50);
}

// ============================================================
//  DOWNLOAD
// ============================================================
function downloadCompressed() {
  if (!compressedBlob) return;
  const ext  = outputFormat.value === 'jpeg' ? 'jpg' : outputFormat.value;
  const name = (originalFile.name.replace(/\.[^.]+$/, '') || 'compressed') + '_compressed.' + ext;
  const url  = URL.createObjectURL(compressedBlob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('✅ Image downloaded successfully!');
}

// ============================================================
//  RESET
// ============================================================
function resetAll() {
  originalFile   = null;
  originalImage  = null;
  compressedBlob = null;
  originalBytes  = 0;

  fileInput.value         = '';
  errorMsg.textContent    = '';
  resizeW.value           = '';
  resizeH.value           = '';
  qualitySlider.value     = 80;
  qualityVal.textContent  = 80;
  outputFormat.value      = 'jpeg';

  originalPreview.src     = '';
  compressedPreview.src   = '';
  fileNameDisplay.textContent  = '';
  fileDims.textContent    = '';
  fileFormat.textContent  = '';

  controlsSection.classList.add('hidden');
  previewSection.classList.add('hidden');
  spinner.classList.add('hidden');
}

// ============================================================
//  ASPECT RATIO: sync width ↔ height
// ============================================================
resizeW.addEventListener('input', () => {
  if (aspectRatio.checked && originalImage) {
    const w = parseInt(resizeW.value);
    if (w > 0) resizeH.value = Math.round(w / originalAspect);
  }
});

resizeH.addEventListener('input', () => {
  if (aspectRatio.checked && originalImage) {
    const h = parseInt(resizeH.value);
    if (h > 0) resizeW.value = Math.round(h * originalAspect);
  }
});

// ============================================================
//  QUALITY SLIDER: live label update
// ============================================================
qualitySlider.addEventListener('input', () => {
  qualityVal.textContent = qualitySlider.value;
});

// ============================================================
//  FILE INPUT (browse button)
// ============================================================
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && validateFile(file)) loadImage(file);
});

// ============================================================
//  DRAG & DROP
// ============================================================
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && validateFile(file)) loadImage(file);
});

// Click on drop zone also triggers file picker (except label click handles itself)
dropZone.addEventListener('click', (e) => {
  // Avoid double-trigger if file-label was clicked
  if (e.target.id !== 'file-label' && e.target.tagName !== 'LABEL') {
    fileInput.click();
  }
});

// ============================================================
//  COMPRESS / RESET / DOWNLOAD buttons
// ============================================================
compressBtn.addEventListener('click', compressImage);
resetBtn.addEventListener('click', resetAll);
downloadBtn.addEventListener('click', downloadCompressed);