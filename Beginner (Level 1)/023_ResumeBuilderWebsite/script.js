/**
 * ATS Resume Builder — script.js
 * Pure Vanilla JS | No frameworks | localStorage persistence
 */

// ============================================================
// STATE
// ============================================================
let currentDomain = '';
let educationCount = 0;
let projectCount = 0;
let experienceCount = 0;

// ============================================================
// DOM REFS
// ============================================================
const sectionDomain   = document.getElementById('sectionDomain');
const sectionForm     = document.getElementById('sectionForm');
const sectionPreview  = document.getElementById('sectionPreview');
const domainFields    = document.getElementById('domainFields');
const domainSectionTitle = document.getElementById('domainSectionTitle');
const navDomainTag    = document.getElementById('navDomainTag');
const resumePreview   = document.getElementById('resumePreview');
const errorBanner     = document.getElementById('errorBanner');
const toast           = document.getElementById('toast');

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/** Show a toast message */
function showToast(msg, type = '') {
  toast.textContent = msg;
  toast.className = 'toast ' + type;
  setTimeout(() => { toast.classList.add('hidden'); }, 3000);
}

/** Show/hide sections */
function showSection(name) {
  [sectionDomain, sectionForm, sectionPreview].forEach(s => s.classList.remove('active'));
  document.getElementById('section' + name).classList.add('active');
}

/** Sanitize HTML to prevent XSS in preview */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Scroll to a form section */
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// LOCAL STORAGE
// ============================================================

function saveToStorage() {
  try {
    const data = collectFormData();
    data.domain = currentDomain;
    data.educationCount = educationCount;
    data.projectCount = projectCount;
    data.experienceCount = experienceCount;
    localStorage.setItem('atsResume', JSON.stringify(data));
  } catch (e) { /* silent */ }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('atsResume');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

function clearStorage() {
  localStorage.removeItem('atsResume');
  showToast('Saved data cleared.', '');
}

// Auto-save on any input change
document.addEventListener('input', debounce(saveToStorage, 800));
document.addEventListener('change', debounce(saveToStorage, 400));

function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

// ============================================================
// DOMAIN SELECTION
// ============================================================

document.querySelectorAll('.domain-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentDomain = btn.dataset.domain;
    renderDomainFields(currentDomain);
    navDomainTag.textContent = btn.querySelector('.domain-name').textContent;

    // Restore or init entries
    const saved = loadFromStorage();
    if (saved && saved.domain === currentDomain) {
      restoreFormData(saved);
    } else {
      // Fresh start — init entry sections
      initEducation();
      initProjects();
      initExperience();
    }

    showSection('Form');
    window.scrollTo({ top: 0 });
  });
});

// ============================================================
// DOMAIN-SPECIFIC FIELDS
// ============================================================

const domainConfigs = {
  software: {
    title: 'Software / IT Details',
    fields: [
      { id: 'progLangs',  label: 'Programming Languages', placeholder: 'Python, JavaScript, Java, C++', hint: 'Comma separated' },
      { id: 'frameworks', label: 'Frameworks & Libraries', placeholder: 'React, Node.js, Django, Spring Boot', hint: '' },
      { id: 'tools',      label: 'Tools & Platforms', placeholder: 'Git, Docker, AWS, Jira, VS Code', hint: '' },
      { id: 'databases',  label: 'Databases', placeholder: 'MySQL, PostgreSQL, MongoDB, Redis', hint: '' },
    ]
  },
  core: {
    title: 'Core Engineering Details',
    fields: [
      { id: 'techSubjects', label: 'Technical Subjects', placeholder: 'Thermodynamics, Fluid Mechanics, Structural Analysis', hint: 'Comma separated' },
      { id: 'engTools',     label: 'Tools / Software Used', placeholder: 'AutoCAD, MATLAB, ANSYS, SolidWorks', hint: '' },
    ]
  },
  design: {
    title: 'Design Details',
    fields: [
      { id: 'designTools', label: 'Design Tools', placeholder: 'Figma, Adobe XD, Photoshop, Illustrator, Sketch', hint: 'Comma separated' },
      { id: 'portfolioLink', label: 'Portfolio Link', placeholder: 'behance.net/yourname or dribbble.com/yourname', hint: '' },
      { id: 'designSpec', label: 'Design Specializations', placeholder: 'UI/UX Design, Branding, Motion Graphics, Typography', hint: 'Comma separated' },
    ]
  },
  management: {
    title: 'Management Details',
    fields: [
      { id: 'areasInterest', label: 'Areas of Interest', placeholder: 'Marketing, Finance, Operations, HR, Strategy', hint: 'Comma separated' },
      { id: 'softSkills',    label: 'Soft Skills', placeholder: 'Leadership, Communication, Problem Solving, Negotiation', hint: 'Comma separated' },
      { id: 'leadership',    label: 'Leadership Roles', placeholder: 'President – College Cultural Committee (2023–24)', hint: 'One per line' },
    ]
  },
  other: {
    title: 'Additional Details',
    fields: [
      { id: 'extraSkills', label: 'Special Skills / Competencies', placeholder: 'Research, Public Speaking, Data Analysis', hint: 'Comma separated' },
      { id: 'extraInfo',   label: 'Other Relevant Information', placeholder: 'Any additional domain-specific information', hint: '' },
    ]
  }
};

function renderDomainFields(domain) {
  const config = domainConfigs[domain];
  if (!config) return;
  domainSectionTitle.textContent = config.title;

  let html = '<div class="form-grid-2">';
  config.fields.forEach(f => {
    const isTextarea = f.id === 'leadership' || f.id === 'extraInfo';
    html += `
      <div class="field-group${isTextarea ? ' full' : ''}">
        <label for="df_${f.id}">${f.label}</label>
        ${isTextarea
          ? `<textarea id="df_${f.id}" rows="3" placeholder="${f.placeholder}"></textarea>`
          : `<input type="text" id="df_${f.id}" placeholder="${f.placeholder}"/>`
        }
        ${f.hint ? `<span class="field-hint">${f.hint}</span>` : ''}
      </div>
    `;
  });
  html += '</div>';
  domainFields.innerHTML = html;
}

// ============================================================
// REPEATING ENTRY BUILDERS
// ============================================================

/* ---- Education ---- */
function initEducation() {
  educationCount = 0;
  document.getElementById('educationEntries').innerHTML = '';
  addEducation(); // Start with 1 entry
}

function addEducation(data = {}) {
  educationCount++;
  const n = educationCount;
  const container = document.getElementById('educationEntries');
  const div = document.createElement('div');
  div.className = 'entry-card';
  div.id = `edu_${n}`;
  div.innerHTML = `
    <div class="entry-card-header">
      <span class="entry-num">Entry #${n}</span>
      ${n > 1 ? `<button class="btn-remove" onclick="removeEntry('edu_${n}')">✕ Remove</button>` : ''}
    </div>
    <div class="form-grid-2">
      <div class="field-group">
        <label>Degree / Course <span class="req">*</span></label>
        <input type="text" id="eduDegree_${n}" value="${esc(data.degree||'')}" placeholder="B.Tech in Computer Science"/>
      </div>
      <div class="field-group">
        <label>Institution <span class="req">*</span></label>
        <input type="text" id="eduInst_${n}" value="${esc(data.institution||'')}" placeholder="Mumbai University"/>
      </div>
      <div class="field-group">
        <label>Year of Completion</label>
        <input type="text" id="eduYear_${n}" value="${esc(data.year||'')}" placeholder="2024"/>
      </div>
      <div class="field-group">
        <label>CGPA / Percentage</label>
        <input type="text" id="eduGrade_${n}" value="${esc(data.grade||'')}" placeholder="8.5 / 10 or 85%"/>
      </div>
    </div>
  `;
  container.appendChild(div);
}

/* ---- Projects ---- */
function initProjects() {
  projectCount = 0;
  document.getElementById('projectEntries').innerHTML = '';
  addProject();
}

function addProject(data = {}) {
  projectCount++;
  const n = projectCount;
  const container = document.getElementById('projectEntries');
  const div = document.createElement('div');
  div.className = 'entry-card';
  div.id = `proj_${n}`;
  div.innerHTML = `
    <div class="entry-card-header">
      <span class="entry-num">Project #${n}</span>
      ${n > 1 ? `<button class="btn-remove" onclick="removeEntry('proj_${n}')">✕ Remove</button>` : ''}
    </div>
    <div class="form-grid-2">
      <div class="field-group">
        <label>Project Title <span class="req">*</span></label>
        <input type="text" id="projTitle_${n}" value="${esc(data.title||'')}" placeholder="E-Commerce Web Application"/>
      </div>
      <div class="field-group">
        <label>Technologies Used</label>
        <input type="text" id="projTech_${n}" value="${esc(data.tech||'')}" placeholder="React, Node.js, MongoDB"/>
      </div>
      <div class="field-group full">
        <label>Description</label>
        <textarea id="projDesc_${n}" rows="2" placeholder="Built a full-stack e-commerce platform with payment integration...">${esc(data.desc||'')}</textarea>
      </div>
    </div>
  `;
  container.appendChild(div);
}

/* ---- Experience ---- */
function initExperience() {
  experienceCount = 0;
  document.getElementById('experienceEntries').innerHTML = '';
  addExperience();
}

function addExperience(data = {}) {
  experienceCount++;
  const n = experienceCount;
  const container = document.getElementById('experienceEntries');
  const div = document.createElement('div');
  div.className = 'entry-card';
  div.id = `exp_${n}`;
  div.innerHTML = `
    <div class="entry-card-header">
      <span class="entry-num">Experience #${n}</span>
      ${n > 1 ? `<button class="btn-remove" onclick="removeEntry('exp_${n}')">✕ Remove</button>` : ''}
    </div>
    <div class="form-grid-2">
      <div class="field-group">
        <label>Role / Position</label>
        <input type="text" id="expRole_${n}" value="${esc(data.role||'')}" placeholder="Software Developer Intern"/>
      </div>
      <div class="field-group">
        <label>Organization</label>
        <input type="text" id="expOrg_${n}" value="${esc(data.org||'')}" placeholder="TCS, Wipro, Startup XYZ"/>
      </div>
      <div class="field-group">
        <label>Duration</label>
        <input type="text" id="expDuration_${n}" value="${esc(data.duration||'')}" placeholder="Jun 2023 – Aug 2023"/>
      </div>
      <div class="field-group">
        <label>Location</label>
        <input type="text" id="expLocation_${n}" value="${esc(data.location||'')}" placeholder="Mumbai / Remote"/>
      </div>
      <div class="field-group full">
        <label>Description</label>
        <textarea id="expDesc_${n}" rows="2" placeholder="Developed REST APIs, reduced query time by 30%...">${esc(data.desc||'')}</textarea>
      </div>
    </div>
  `;
  container.appendChild(div);
}

function removeEntry(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// Add buttons
document.getElementById('btnAddEducation').addEventListener('click', () => addEducation());
document.getElementById('btnAddProject').addEventListener('click', () => addProject());
document.getElementById('btnAddExperience').addEventListener('click', () => addExperience());

// ============================================================
// FORM DATA COLLECTION
// ============================================================

function gv(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function collectFormData() {
  // Education
  const education = [];
  document.querySelectorAll('[id^="eduDegree_"]').forEach(el => {
    const n = el.id.split('_')[1];
    if (!document.getElementById(`edu_${n}`)) return; // removed
    education.push({
      degree: gv(`eduDegree_${n}`),
      institution: gv(`eduInst_${n}`),
      year: gv(`eduYear_${n}`),
      grade: gv(`eduGrade_${n}`),
    });
  });

  // Projects
  const projects = [];
  document.querySelectorAll('[id^="projTitle_"]').forEach(el => {
    const n = el.id.split('_')[1];
    if (!document.getElementById(`proj_${n}`)) return;
    projects.push({
      title: gv(`projTitle_${n}`),
      tech: gv(`projTech_${n}`),
      desc: gv(`projDesc_${n}`),
    });
  });

  // Experience
  const experience = [];
  document.querySelectorAll('[id^="expRole_"]').forEach(el => {
    const n = el.id.split('_')[1];
    if (!document.getElementById(`exp_${n}`)) return;
    experience.push({
      role: gv(`expRole_${n}`),
      org: gv(`expOrg_${n}`),
      duration: gv(`expDuration_${n}`),
      location: gv(`expLocation_${n}`),
      desc: gv(`expDesc_${n}`),
    });
  });

  // Domain fields
  const domainData = {};
  const config = domainConfigs[currentDomain];
  if (config) {
    config.fields.forEach(f => {
      domainData[f.id] = gv(`df_${f.id}`);
    });
  }

  return {
    fullName: gv('fullName'),
    phone: gv('phone'),
    email: gv('email'),
    linkedin: gv('linkedin'),
    portfolio: gv('portfolio'),
    address: gv('address'),
    objective: gv('objective'),
    skills: gv('skills'),
    certifications: gv('certifications'),
    achievements: gv('achievements'),
    languages: gv('languages'),
    education,
    projects,
    experience,
    domainData,
  };
}

// ============================================================
// FORM RESTORE
// ============================================================

function sv(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

function restoreFormData(saved) {
  sv('fullName', saved.fullName);
  sv('phone', saved.phone);
  sv('email', saved.email);
  sv('linkedin', saved.linkedin);
  sv('portfolio', saved.portfolio);
  sv('address', saved.address);
  sv('objective', saved.objective);
  sv('skills', saved.skills);
  sv('certifications', saved.certifications);
  sv('achievements', saved.achievements);
  sv('languages', saved.languages);

  // Education
  educationCount = 0;
  document.getElementById('educationEntries').innerHTML = '';
  if (saved.education && saved.education.length > 0) {
    saved.education.forEach(e => addEducation(e));
  } else { addEducation(); }

  // Projects
  projectCount = 0;
  document.getElementById('projectEntries').innerHTML = '';
  if (saved.projects && saved.projects.length > 0) {
    saved.projects.forEach(p => addProject(p));
  } else { addProject(); }

  // Experience
  experienceCount = 0;
  document.getElementById('experienceEntries').innerHTML = '';
  if (saved.experience && saved.experience.length > 0) {
    saved.experience.forEach(e => addExperience(e));
  } else { addExperience(); }

  // Domain fields
  if (saved.domainData) {
    Object.keys(saved.domainData).forEach(key => {
      sv(`df_${key}`, saved.domainData[key]);
    });
  }
}

// ============================================================
// VALIDATION
// ============================================================

function validateForm(data) {
  const errors = [];

  if (!data.fullName) errors.push('Full Name is required.');
  if (!data.phone) errors.push('Phone number is required.');
  else if (!/^[+\d\s\-().]{7,20}$/.test(data.phone)) errors.push('Enter a valid phone number.');
  if (!data.email) errors.push('Email address is required.');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Enter a valid email address.');
  if (!data.objective) errors.push('Career Objective is required.');

  // At least one education with degree and institution
  const validEdu = data.education.filter(e => e.degree && e.institution);
  if (validEdu.length === 0) errors.push('Add at least one Education entry with Degree and Institution.');

  return errors;
}

function showErrors(errors) {
  if (errors.length === 0) {
    errorBanner.classList.add('hidden');
    return;
  }
  errorBanner.innerHTML = '<strong>Please fix:</strong><br>' + errors.map(e => `• ${e}`).join('<br>');
  errorBanner.classList.remove('hidden');
  errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ============================================================
// RESUME GENERATION (HTML)
// ============================================================

function buildResumeHTML(data) {
  const name = esc(data.fullName).toUpperCase();
  const config = domainConfigs[currentDomain];

  // ---- Contact line ----
  let contactParts = [];
  if (data.phone)     contactParts.push(esc(data.phone));
  if (data.email)     contactParts.push(esc(data.email));
  if (data.address)   contactParts.push(esc(data.address));
  if (data.linkedin)  contactParts.push(esc(data.linkedin));
  if (data.portfolio) contactParts.push(esc(data.portfolio));
  const contactLine = contactParts.join(' | ');

  // ---- Skills block ----
  let skillsHTML = '';
  if (data.skills) {
    skillsHTML += `<div class="r-section">
      <div class="r-section-title">SKILLS</div>
      <div class="r-skills-block">${esc(data.skills)}</div>
    </div>`;
  }

  // ---- Domain-specific skills appended into skills ----
  let domainHTML = '';
  if (config && data.domainData) {
    const lines = [];
    config.fields.forEach(f => {
      const val = data.domainData[f.id];
      if (val) lines.push(`<strong>${f.label}:</strong> ${esc(val)}`);
    });
    if (lines.length) {
      domainHTML = `<div class="r-section">
        <div class="r-section-title">TECHNICAL PROFILE</div>
        <div class="r-skills-block">${lines.join('<br>')}</div>
      </div>`;
    }
  }

  // ---- Education ----
  let eduHTML = '';
  const validEdu = data.education.filter(e => e.degree || e.institution);
  if (validEdu.length) {
    let rows = validEdu.map(e => `
      <div class="r-edu-row">
        <div class="r-edu-left">
          <div class="r-bold">${esc(e.degree)}</div>
          <div class="r-italic">${esc(e.institution)}</div>
        </div>
        <div class="r-edu-right">
          ${e.year ? `<div>${esc(e.year)}</div>` : ''}
          ${e.grade ? `<div>${esc(e.grade)}</div>` : ''}
        </div>
      </div>
    `).join('');
    eduHTML = `<div class="r-section">
      <div class="r-section-title">EDUCATION</div>
      ${rows}
    </div>`;
  }

  // ---- Projects ----
  let projHTML = '';
  const validProj = data.projects.filter(p => p.title);
  if (validProj.length) {
    let blocks = validProj.map(p => `
      <div class="r-project-block">
        <span class="r-project-title">${esc(p.title)}</span>
        ${p.tech ? `<span class="r-project-tech"> | ${esc(p.tech)}</span>` : ''}
        ${p.desc ? `<div class="r-project-desc">${esc(p.desc)}</div>` : ''}
      </div>
    `).join('');
    projHTML = `<div class="r-section">
      <div class="r-section-title">PROJECTS</div>
      ${blocks}
    </div>`;
  }

  // ---- Experience ----
  let expHTML = '';
  const validExp = data.experience.filter(e => e.role || e.org);
  if (validExp.length) {
    let blocks = validExp.map(e => `
      <div>
        <div class="r-exp-header">
          <span class="r-exp-role">${esc(e.role)}</span>
          <span class="r-exp-duration">${esc(e.duration)}</span>
        </div>
        <div class="r-exp-org">${esc(e.org)}${e.location ? ' · ' + esc(e.location) : ''}</div>
        ${e.desc ? `<div class="r-exp-desc">${esc(e.desc)}</div>` : ''}
      </div>
    `).join('');
    expHTML = `<div class="r-section">
      <div class="r-section-title">EXPERIENCE</div>
      ${blocks}
    </div>`;
  }

  // ---- Certifications ----
  let certHTML = '';
  if (data.certifications) {
    const items = data.certifications.split('\n').filter(l => l.trim());
    if (items.length) {
      certHTML = `<div class="r-section">
        <div class="r-section-title">CERTIFICATIONS</div>
        <ul class="r-list">${items.map(i => `<li>${esc(i.trim())}</li>`).join('')}</ul>
      </div>`;
    }
  }

  // ---- Achievements ----
  let achHTML = '';
  if (data.achievements) {
    const items = data.achievements.split('\n').filter(l => l.trim());
    if (items.length) {
      achHTML = `<div class="r-section">
        <div class="r-section-title">ACHIEVEMENTS</div>
        <ul class="r-list">${items.map(i => `<li>${esc(i.trim())}</li>`).join('')}</ul>
      </div>`;
    }
  }

  // ---- Languages ----
  let langHTML = '';
  if (data.languages) {
    langHTML = `<div class="r-section">
      <div class="r-section-title">LANGUAGES</div>
      <div class="r-inline-list">${esc(data.languages)}</div>
    </div>`;
  }

  // ---- Objective ----
  const objHTML = `<div class="r-section">
    <div class="r-section-title">PROFILE</div>
    <div class="r-objective">${esc(data.objective)}</div>
  </div>`;

  return `
    <div class="r-name">${name}</div>
    <div class="r-contact">${contactLine}</div>
    <hr class="r-rule"/>
    ${objHTML}
    ${eduHTML}
    ${skillsHTML}
    ${domainHTML}
    ${expHTML}
    ${projHTML}
    ${certHTML}
    ${achHTML}
    ${langHTML}
  `;
}

// ============================================================
// GENERATE RESUME
// ============================================================

function generateResume() {
  const data = collectFormData();
  const errors = validateForm(data);

  if (errors.length) {
    showErrors(errors);
    return;
  }

  errorBanner.classList.add('hidden');
  saveToStorage();

  const html = buildResumeHTML(data);
  resumePreview.innerHTML = html;

  showSection('Preview');
  window.scrollTo({ top: 0 });
  showToast('Resume generated!', 'success');
}

document.getElementById('btnGenerate').addEventListener('click', generateResume);
document.getElementById('btnGenerateBottom').addEventListener('click', generateResume);

// ============================================================
// NAV — BACK / EDIT
// ============================================================

document.getElementById('btnBackDomain').addEventListener('click', () => {
  showSection('Domain');
  window.scrollTo({ top: 0 });
});

document.getElementById('btnEdit').addEventListener('click', () => {
  showSection('Form');
  window.scrollTo({ top: 0 });
});

// ============================================================
// DOWNLOAD PDF
// ============================================================

document.getElementById('btnDownloadPdf').addEventListener('click', () => {
  showToast('Opening print dialog…', '');
  setTimeout(() => window.print(), 300);
});

// ============================================================
// DOWNLOAD TXT
// ============================================================

document.getElementById('btnDownloadTxt').addEventListener('click', () => {
  const data = collectFormData();
  const txt = buildPlainText(data);
  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (data.fullName.replace(/\s+/g, '_') || 'Resume') + '_Resume.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('TXT file downloaded.', 'success');
});

function buildPlainText(data) {
  const sep = '─'.repeat(60);
  const lines = [];
  const config = domainConfigs[currentDomain];

  lines.push(data.fullName.toUpperCase());
  const contact = [data.phone, data.email, data.address, data.linkedin, data.portfolio].filter(Boolean).join(' | ');
  lines.push(contact);
  lines.push(sep);

  if (data.objective) {
    lines.push('\nPROFILE');
    lines.push(data.objective);
  }

  const validEdu = data.education.filter(e => e.degree || e.institution);
  if (validEdu.length) {
    lines.push('\nEDUCATION');
    validEdu.forEach(e => {
      lines.push(`${e.degree} — ${e.institution}${e.year ? ' | ' + e.year : ''}${e.grade ? ' | ' + e.grade : ''}`);
    });
  }

  if (data.skills) {
    lines.push('\nSKILLS');
    lines.push(data.skills);
  }

  if (config && data.domainData) {
    const parts = config.fields.map(f => data.domainData[f.id] ? `${f.label}: ${data.domainData[f.id]}` : '').filter(Boolean);
    if (parts.length) {
      lines.push('\nTECHNICAL PROFILE');
      parts.forEach(p => lines.push(p));
    }
  }

  const validExp = data.experience.filter(e => e.role || e.org);
  if (validExp.length) {
    lines.push('\nEXPERIENCE');
    validExp.forEach(e => {
      lines.push(`${e.role} — ${e.org}${e.duration ? ' | ' + e.duration : ''}${e.location ? ' | ' + e.location : ''}`);
      if (e.desc) lines.push(e.desc);
    });
  }

  const validProj = data.projects.filter(p => p.title);
  if (validProj.length) {
    lines.push('\nPROJECTS');
    validProj.forEach(p => {
      lines.push(`${p.title}${p.tech ? ' | ' + p.tech : ''}`);
      if (p.desc) lines.push(p.desc);
    });
  }

  if (data.certifications) {
    lines.push('\nCERTIFICATIONS');
    data.certifications.split('\n').filter(Boolean).forEach(c => lines.push('• ' + c.trim()));
  }

  if (data.achievements) {
    lines.push('\nACHIEVEMENTS');
    data.achievements.split('\n').filter(Boolean).forEach(a => lines.push('• ' + a.trim()));
  }

  if (data.languages) {
    lines.push('\nLANGUAGES');
    lines.push(data.languages);
  }

  return lines.join('\n');
}

// ============================================================
// CLEAR DATA BUTTON
// ============================================================

document.getElementById('btnClearData').addEventListener('click', () => {
  if (confirm('Clear all saved data? This cannot be undone.')) {
    clearStorage();
    location.reload();
  }
});

// ============================================================
// SIDEBAR NAV ACTIVE STATE
// ============================================================

const formContent = document.getElementById('formContent');
const navLinks = document.querySelectorAll('.nav-link');

formContent.addEventListener('scroll', updateActiveNav, { passive: true });

function updateActiveNav() {
  const sections = ['secPersonal','secObjective','secEducation','secSkills','secDomain','secProjects','secExperience','secCerts','secAchievements','secLanguages'];
  let current = sections[0];
  const scrollTop = formContent.scrollTop + 80;
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.offsetTop <= scrollTop) current = id;
  });
  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + current);
  });
}

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const targetId = link.getAttribute('href').slice(1);
    const target = document.getElementById(targetId);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ============================================================
// AUTO-LOAD ON PAGE OPEN
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
  const saved = loadFromStorage();
  if (saved && saved.domain) {
    // Silently notify
    showToast('Previous data restored.', '');
  }
  showSection('Domain');
});