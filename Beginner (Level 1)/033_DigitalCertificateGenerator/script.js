// ─── Init ───────────────────────────────────────────────────
(function init() {
  // Set today's date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('certDate').value = today;

  // Generate certificate ID
  document.getElementById('certId').value = generateCertId();

  // Attach live listeners
  const fields = ['fullName','domain','courseTitle','orgName','instructorName','certDate','certId'];
  fields.forEach(id => {
    document.getElementById(id).addEventListener('input', updatePreview);
  });

  updatePreview();
})();

// ─── Generate Cert ID ───────────────────────────────────────
function generateCertId() {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CERT-${year}-${rand}`;
}

// ─── Live Preview Update ────────────────────────────────────
function updatePreview() {
  const name       = document.getElementById('fullName').value.trim() || 'Recipient Name';
  const domain     = document.getElementById('domain').value || 'Domain';
  const course     = document.getElementById('courseTitle').value.trim() || 'Course Title';
  const org        = document.getElementById('orgName').value.trim() || 'Organization Name';
  const instructor = document.getElementById('instructorName').value.trim() || 'Instructor Name';
  const date       = document.getElementById('certDate').value;
  const certId     = document.getElementById('certId').value;

  document.getElementById('c-name').textContent       = name;
  document.getElementById('c-domain').textContent     = domain;
  document.getElementById('c-course').textContent     = `"${course}"`;
  document.getElementById('c-org').textContent        = org;
  document.getElementById('c-orgLogo').textContent    = org || 'Your Organization';
  document.getElementById('c-instructor').textContent = instructor;
  document.getElementById('c-id').textContent         = certId;
  document.getElementById('c-date').textContent       = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
    : '--';
}

// ─── Validation ──────────────────────────────────────────────
function validateForm() {
  const required = {
    fullName:       'Full Name',
    domain:         'Domain',
    courseTitle:    'Course Title',
    orgName:        'Organization Name',
    instructorName: 'Instructor Name',
  };
  for (const [id, label] of Object.entries(required)) {
    if (!document.getElementById(id).value.trim()) {
      alert(`Please fill in: ${label}`);
      document.getElementById(id).focus();
      return false;
    }
  }
  return true;
}

// ─── Download ────────────────────────────────────────────────
function downloadCert() {
  if (!validateForm()) return;

  const btn = document.getElementById('downloadBtn');
  btn.disabled = true;
  btn.textContent = 'Generating...';

  const cert = document.getElementById('certificate');

  html2canvas(cert, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#fffdf6',
    logging: false
  }).then(canvas => {
    const link = document.createElement('a');
    const name = document.getElementById('fullName').value.trim().replace(/\s+/g, '_');
    link.download = `Certificate_${name}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    btn.disabled = false;
    btn.textContent = '⬇ Download Certificate';
  }).catch(err => {
    console.error(err);
    alert('Failed to generate certificate. Please try again.');
    btn.disabled = false;
    btn.textContent = '⬇ Download Certificate';
  });
}

// ─── Reset ───────────────────────────────────────────────────
function resetForm() {
  document.getElementById('fullName').value       = '';
  document.getElementById('domain').value         = '';
  document.getElementById('courseTitle').value    = '';
  document.getElementById('orgName').value        = '';
  document.getElementById('instructorName').value = '';
  document.getElementById('certDate').value       = new Date().toISOString().split('T')[0];
  document.getElementById('certId').value         = generateCertId();
  updatePreview();
}