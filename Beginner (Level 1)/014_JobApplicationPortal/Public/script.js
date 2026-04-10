const app = {
    state: {
        jobs: [],
        applications: [],
        token: localStorage.getItem('adminToken') || null,
        currentJobId: null
    },

    init: function() {
        this.cacheDOM();
        this.bindEvents();
        this.checkAuth();
        this.loadJobs();
        
        // Handle direct URL routing based on hash or just default to home
        this.navigate('home');
    },

    cacheDOM: function() {
        this.toastEl = document.getElementById('toast');
        this.navItems = document.querySelectorAll('.nav-item[data-target]');
        this.sections = document.querySelectorAll('.page-section');
        this.hamburger = document.getElementById('hamburger');
        this.mobileMenu = document.getElementById('mobile-menu');
        
        // Admin Elements
        this.navAdminLink = document.getElementById('nav-admin-link');
        this.navLogoutBtn = document.getElementById('nav-logout-btn');
        this.mobileAdminLink = document.getElementById('mobile-admin-link');
        this.mobileLogoutLink = document.getElementById('mobile-logout-link');
    },

    bindEvents: function() {
        // Mobile Menu Toggle
        this.hamburger.addEventListener('click', () => {
            this.mobileMenu.classList.toggle('active');
        });

        // Search in Jobs section
        document.getElementById('jobs-search-input').addEventListener('input', (e) => this.renderJobs(e.target.value));
        document.getElementById('jobs-filter-type').addEventListener('change', () => this.renderJobs(document.getElementById('jobs-search-input').value));

        // Forms
        document.getElementById('apply-form').addEventListener('submit', this.handleApply.bind(this));
        document.getElementById('track-form').addEventListener('submit', this.handleTrack.bind(this));
        document.getElementById('admin-login-form').addEventListener('submit', this.handleLogin.bind(this));
        document.getElementById('job-form').addEventListener('submit', this.handleSaveJob.bind(this));
    },

    // --- Navigation & Routing ---
    navigate: function(sectionId) {
        // Hide all sections
        this.sections.forEach(sec => sec.classList.remove('active'));
        
        // Show target section
        const target = document.getElementById(sectionId);
        if(target) target.classList.add('active');

        // Update nav links
        this.navItems.forEach(item => {
            item.classList.remove('active');
            if(item.dataset.target === sectionId) item.classList.add('active');
        });

        // Close mobile menu if open
        this.mobileMenu.classList.remove('active');

        // Section specific logic
        if (sectionId === 'jobs-section') {
            this.renderJobs();
        } else if (sectionId === 'admin-login-section') {
            if (this.state.token) {
                this.navigate('admin-dashboard-section'); // Redirect if already logged in
            }
        } else if (sectionId === 'admin-dashboard-section') {
            if (!this.state.token) {
                this.navigate('admin-login-section');
            } else {
                this.loadAdminData();
            }
        }
    },

    // --- Helpers ---
    showToast: function(message, type = 'success') {
        this.toastEl.textContent = message;
        this.toastEl.className = `toast show ${type}`;
        setTimeout(() => {
            this.toastEl.classList.remove('show');
        }, 3000);
    },

    formatDate: function(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    },

    // --- API Calls & Data ---
    loadJobs: async function() {
        try {
            const res = await fetch('/api/jobs');
            this.state.jobs = await res.json();
            if (document.getElementById('jobs-section').classList.contains('active')) {
                this.renderJobs();
            }
        } catch (err) {
            console.error('Failed to load jobs', err);
            this.showToast('Failed to load jobs', 'error');
        }
    },

    // --- Public UI ---
    searchFromHome: function() {
        const query = document.getElementById('home-search-input').value;
        document.getElementById('jobs-search-input').value = query;
        this.navigate('jobs-section');
        this.renderJobs(query);
    },

    renderJobs: function(query = '') {
        const grid = document.getElementById('public-jobs-grid');
        const filterType = document.getElementById('jobs-filter-type').value;
        grid.innerHTML = '';

        let filtered = this.state.jobs.filter(job => {
            const matchesQuery = job.title.toLowerCase().includes(query.toLowerCase()) || 
                                 job.location.toLowerCase().includes(query.toLowerCase()) ||
                                 job.company.toLowerCase().includes(query.toLowerCase());
            const matchesType = filterType === 'all' || job.type === filterType;
            return matchesQuery && matchesType;
        });

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                                <i class="fa-solid fa-folder-open" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                                <h3>No jobs found</h3>
                                <p>Try adjusting your search criteria.</p>
                              </div>`;
            return;
        }

        filtered.forEach(job => {
            const card = document.createElement('div');
            card.className = 'job-card';
            card.innerHTML = `
                <div class="job-card-header">
                    <div>
                        <h3 class="job-title">${job.title}</h3>
                        <p class="job-company">${job.company}</p>
                    </div>
                    <span class="job-type-badge">${job.type}</span>
                </div>
                <div class="job-meta">
                    <span><i class="fa-solid fa-location-dot"></i> ${job.location}</span>
                    <span><i class="fa-solid fa-sack-dollar"></i> ${job.salary}</span>
                </div>
                <p class="job-desc">${job.description.substring(0, 100)}...</p>
                <div class="job-footer">
                    <span class="job-date">Posted ${this.formatDate(job.postedDate)}</span>
                    <button class="btn-primary btn-sm" onclick="app.openApplyForm('${job.id}')">Apply Now</button>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    openApplyForm: function(jobId) {
        const job = this.state.jobs.find(j => j.id === jobId);
        if (!job) return;

        this.state.currentJobId = jobId;
        document.getElementById('apply-job-id').value = jobId;
        
        const details = document.getElementById('apply-job-details');
        details.innerHTML = `
            <h2>Apply for ${job.title}</h2>
            <p>at <strong>${job.company}</strong> • ${job.location}</p>
        `;
        
        document.getElementById('apply-form').reset();
        this.navigate('apply-section');
    },

    handleApply: async function(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Submitting...';

        const jobId = document.getElementById('apply-job-id').value;
        const data = {
            name: document.getElementById('apply-name').value,
            email: document.getElementById('apply-email').value,
            phone: document.getElementById('apply-phone').value,
            resumeLink: document.getElementById('apply-resume').value,
            coverLetter: document.getElementById('apply-cover').value
        };

        try {
            const res = await fetch(`/api/apply/${jobId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (res.ok) {
                this.showToast('Application submitted successfully!');
                setTimeout(() => this.navigate('jobs-section'), 1500);
            } else {
                const err = await res.json();
                this.showToast(err.message || 'Failed to apply', 'error');
            }
        } catch (error) {
            this.showToast('Network error', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Submit Application';
        }
    },

    handleTrack: async function(e) {
        e.preventDefault();
        const email = document.getElementById('track-email-input').value;
        const resultsEl = document.getElementById('tracking-results');
        
        resultsEl.innerHTML = '<p class="text-center">Searching...</p>';

        try {
            const res = await fetch(`/api/applications/${email}`);
            const apps = await res.json();
            
            if (apps.length === 0) {
                resultsEl.innerHTML = '<p class="text-center" style="padding: 2rem; background: white; border-radius: 8px;">No applications found for this email address.</p>';
                return;
            }

            resultsEl.innerHTML = apps.map(app => `
                <div class="track-item status-${app.status}">
                    <div class="track-info">
                        <h3>${app.jobTitle}</h3>
                        <p>${app.company} • Applied on ${this.formatDate(app.appliedDate)}</p>
                    </div>
                    <div class="status-badge ${app.status}">${app.status}</div>
                </div>
            `).join('');
            
        } catch (err) {
            resultsEl.innerHTML = '';
            this.showToast('Failed to fetch applications', 'error');
        }
    },

    // --- Admin Authentication ---
    checkAuth: function() {
        if (this.state.token) {
            this.navAdminLink.textContent = 'Dashboard';
            this.navAdminLink.dataset.target = 'admin-dashboard-section';
            this.navLogoutBtn.classList.remove('hidden');
            
            this.mobileAdminLink.textContent = 'Dashboard';
            this.mobileLogoutLink.classList.remove('hidden');
        } else {
            this.navAdminLink.textContent = 'Admin Panel';
            this.navAdminLink.dataset.target = 'admin-login-section';
            this.navLogoutBtn.classList.add('hidden');
            
            this.mobileAdminLink.textContent = 'Admin Panel';
            this.mobileLogoutLink.classList.add('hidden');
        }
    },

    handleLogin: async function(e) {
        e.preventDefault();
        const u = document.getElementById('login-username').value;
        const p = document.getElementById('login-password').value;

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: u, password: p })
            });

            if (res.ok) {
                const data = await res.json();
                this.state.token = data.token;
                localStorage.setItem('adminToken', data.token);
                this.checkAuth();
                this.showToast('Login successful');
                this.navigate('admin-dashboard-section');
            } else {
                this.showToast('Invalid credentials', 'error');
            }
        } catch (err) {
            this.showToast('Login failed', 'error');
        }
    },

    logout: function() {
        this.state.token = null;
        localStorage.removeItem('adminToken');
        this.checkAuth();
        this.navigate('home');
        this.showToast('Logged out');
    },

    // --- Admin Dashboard ---
    switchAdminTab: function(tabId) {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        
        document.querySelectorAll('.admin-menu li').forEach(li => li.classList.remove('active'));
        document.querySelector(`.admin-menu li[data-tab="${tabId}"]`).classList.add('active');
    },

    loadAdminData: async function() {
        await this.loadJobs();
        this.renderAdminJobs();

        try {
            const res = await fetch('/api/applications');
            this.state.applications = await res.json();
            this.renderAdminApps();
        } catch (err) {
            this.showToast('Failed to load applications', 'error');
        }
    },

    renderAdminJobs: function() {
        const tbody = document.getElementById('admin-jobs-table');
        tbody.innerHTML = this.state.jobs.map(job => `
            <tr>
                <td><strong>${job.title}</strong></td>
                <td>${job.company}</td>
                <td>${job.type}</td>
                <td>${this.formatDate(job.postedDate)}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon" onclick="app.editJob('${job.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon delete" onclick="app.deleteJob('${job.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    renderAdminApps: function() {
        const tbody = document.getElementById('admin-apps-table');
        tbody.innerHTML = this.state.applications.sort((a,b) => new Date(b.appliedDate) - new Date(a.appliedDate)).map(app => `
            <tr>
                <td>
                    <strong>${app.name}</strong><br>
                    <small class="text-gray-500">${app.email}</small>
                </td>
                <td>
                    ${app.jobTitle}<br>
                    <small class="text-gray-500">${app.company}</small>
                </td>
                <td>${this.formatDate(app.appliedDate)}</td>
                <td>
                    <div class="action-btns">
                        <a href="${app.resumeLink}" target="_blank" class="btn-icon" title="View Resume"><i class="fa-solid fa-file-pdf"></i></a>
                        <button class="btn-icon" onclick="app.viewAppDetails('${app.id}')" title="View Details"><i class="fa-solid fa-eye"></i></button>
                    </div>
                </td>
                <td>
                    <select class="status-select" onchange="app.updateAppStatus('${app.id}', this.value)">
                        <option value="Pending" ${app.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Shortlisted" ${app.status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
                        <option value="Hired" ${app.status === 'Hired' ? 'selected' : ''}>Hired</option>
                        <option value="Rejected" ${app.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                    </select>
                </td>
            </tr>
        `).join('');
    },

    updateAppStatus: async function(appId, status) {
        try {
            const res = await fetch(`/api/applications/${appId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                this.showToast('Status updated');
                // Update local state
                const app = this.state.applications.find(a => a.id === appId);
                if (app) app.status = status;
            } else {
                this.showToast('Failed to update status', 'error');
            }
        } catch (err) {
            this.showToast('Error updating status', 'error');
        }
    },

    viewAppDetails: function(appId) {
        const application = this.state.applications.find(a => a.id === appId);
        if (!application) return;

        const modalBody = document.getElementById('app-modal-body');
        modalBody.innerHTML = `
            <div class="details-content">
                <p><strong>Candidate:</strong> ${application.name}</p>
                <p><strong>Email:</strong> ${application.email}</p>
                <p><strong>Phone:</strong> ${application.phone}</p>
                <p><strong>Applied For:</strong> ${application.jobTitle} at ${application.company}</p>
                <p><strong>Date:</strong> ${this.formatDate(application.appliedDate)}</p>
                <hr style="margin: 1rem 0; border: none; border-top: 1px solid #E5E7EB;">
                <p><strong>Cover Letter:</strong></p>
                <p style="background: #F9FAFB; padding: 1rem; border-radius: 0.5rem; font-size: 0.9rem;">
                    ${application.coverLetter ? application.coverLetter.replace(/\n/g, '<br>') : '<em>No cover letter provided.</em>'}
                </p>
            </div>
        `;
        
        document.getElementById('app-modal').classList.add('active');
    },

    closeAppModal: function() {
        document.getElementById('app-modal').classList.remove('active');
    },

    // --- Job Modals & CRUD ---
    openJobModal: function() {
        document.getElementById('job-form').reset();
        document.getElementById('admin-job-id').value = '';
        document.getElementById('job-modal-title').textContent = 'Post New Job';
        document.getElementById('job-modal').classList.add('active');
    },

    closeJobModal: function() {
        document.getElementById('job-modal').classList.remove('active');
    },

    editJob: function(jobId) {
        const job = this.state.jobs.find(j => j.id === jobId);
        if (!job) return;

        document.getElementById('admin-job-id').value = job.id;
        document.getElementById('admin-job-title').value = job.title;
        document.getElementById('admin-job-company').value = job.company;
        document.getElementById('admin-job-location').value = job.location;
        document.getElementById('admin-job-salary').value = job.salary;
        document.getElementById('admin-job-type').value = job.type;
        document.getElementById('admin-job-desc').value = job.description;

        document.getElementById('job-modal-title').textContent = 'Edit Job';
        document.getElementById('job-modal').classList.add('active');
    },

    handleSaveJob: async function(e) {
        e.preventDefault();
        
        const jobId = document.getElementById('admin-job-id').value;
        const data = {
            title: document.getElementById('admin-job-title').value,
            company: document.getElementById('admin-job-company').value,
            location: document.getElementById('admin-job-location').value,
            salary: document.getElementById('admin-job-salary').value,
            type: document.getElementById('admin-job-type').value,
            description: document.getElementById('admin-job-desc').value
        };

        const method = jobId ? 'PUT' : 'POST';
        const url = jobId ? `/api/jobs/${jobId}` : '/api/jobs';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                this.showToast(jobId ? 'Job updated!' : 'Job created!');
                this.closeJobModal();
                this.loadAdminData(); // Reload all data
            } else {
                this.showToast('Failed to save job', 'error');
            }
        } catch (err) {
            this.showToast('Error saving job', 'error');
        }
    },

    deleteJob: async function(jobId) {
        if (!confirm('Are you sure you want to delete this job? All associated applications will also be removed.')) return;

        try {
            const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
            if (res.ok) {
                this.showToast('Job deleted');
                this.loadAdminData();
            } else {
                this.showToast('Failed to delete job', 'error');
            }
        } catch (err) {
            this.showToast('Error deleting job', 'error');
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => app.init());
