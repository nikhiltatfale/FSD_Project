/**
 * College Event Portal 
 * Vanilla JavaScript Implementation
 */

// Generate a unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Mock Data Models
const mockMainEvents = [
    {
        id: 'me_01',
        name: 'Kalavihangam',
        category: 'Cultural',
        banner: 'https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&q=80&w=600',
        description: 'The premier cultural and sports festival celebrating art and athleticism.'
    },
    {
        id: 'me_02',
        name: 'Ignite',
        category: 'Technical',
        banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=600',
        description: 'Annual tech fest featuring hackathons, robotics, and coding challenges.'
    }
];

const mockSubEvents = [
    {
        id: 'se_01',
        mainEventId: 'me_01',
        name: 'Dance Battle',
        date: '2026-05-15',
        venue: 'Main Auditorium',
        coordinator: 'Alice Johnson - 9876543210',
        description: 'Inter-college group and solo dance competitions.'
    },
    {
        id: 'se_02',
        mainEventId: 'me_01',
        name: 'Football Tournament',
        date: '2026-05-16',
        venue: 'College Ground',
        coordinator: 'Bob Smith - 8765432109',
        description: 'Knockout football tournament for college teams.'
    },
    {
        id: 'se_03',
        mainEventId: 'me_02',
        name: 'Algothon 2.0',
        date: '2026-06-10',
        venue: 'CS Labs 1-4',
        coordinator: 'Charlie Davis - 7654321098',
        description: 'A 24-hour coding challenge algorithms and data structures.'
    }
];

class EventPortalContext {
    constructor() {
        this.cache = {
            mainEvents: [],
            subEvents: [],
            registrations: [],
            isAuthenticated: false
        };
        this.currentViewId = 'view-home';
        this.currentAdminTab = 'tab-main-events-manage';
        this.currentSubEventsMainId = null; // tracking currently viewed parent event
        
        this.init();
    }

    init() {
        this.loadStorage();
        if (this.cache.mainEvents.length === 0) {
            this.seedMockData();
        }
        this.cache.isAuthenticated = localStorage.getItem('cep_auth') === 'true';
        
        // Initial Rendering
        this.renderMainEvents();
        this.updateNavUI();
        
        // Prevent default form submits on random buttons
        document.querySelectorAll('form').forEach(f => {
            f.addEventListener('submit', (e) => {
                if(!f.hasAttribute('onsubmit')) e.preventDefault();
            });
        });
    }

    // --- State Management ---
    loadStorage() {
        this.cache.mainEvents = JSON.parse(localStorage.getItem('cep_mainEvents')) || [];
        this.cache.subEvents = JSON.parse(localStorage.getItem('cep_subEvents')) || [];
        this.cache.registrations = JSON.parse(localStorage.getItem('cep_registrations')) || [];
    }

    saveStorage(type) {
        if(type === 'main' || !type) localStorage.setItem('cep_mainEvents', JSON.stringify(this.cache.mainEvents));
        if(type === 'sub' || !type) localStorage.setItem('cep_subEvents', JSON.stringify(this.cache.subEvents));
        if(type === 'reg' || !type) localStorage.setItem('cep_registrations', JSON.stringify(this.cache.registrations));
    }

    seedMockData() {
        this.cache.mainEvents = [...mockMainEvents];
        this.cache.subEvents = [...mockSubEvents];
        this.saveStorage();
    }

    // --- Navigation & UI State ---
    navigateTo(viewAlias) {
        const viewsMapping = {
            'home': 'view-home',
            'subevents': 'view-subevents',
            'admin-login': 'view-admin-login',
            'admin-dashboard': 'view-admin-dashboard'
        };
        const targetViewId = viewsMapping[viewAlias];

        // Route Guards
        if (targetViewId === 'view-admin-dashboard' && !this.cache.isAuthenticated) {
            return this.navigateTo('admin-login');
        }
        if (targetViewId === 'view-admin-login' && this.cache.isAuthenticated) {
            return this.navigateTo('admin-dashboard');
        }

        // Hide all views
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        // Show target view
        document.getElementById(targetViewId).classList.add('active');
        this.currentViewId = targetViewId;

        // View Specific Initialization
        if(targetViewId === 'view-home') this.renderMainEvents();
        if(targetViewId === 'view-admin-dashboard') this.initAdminDashboard();
        
        window.scrollTo(0,0);
    }

    updateNavUI() {
        const logoutBtn = document.getElementById('nav-logout-btn');
        if (logoutBtn) {
            if (this.cache.isAuthenticated) {
                logoutBtn.classList.remove('hidden');
            } else {
                logoutBtn.classList.add('hidden');
            }
        }
    }

    // --- Toast Notifications ---
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // --- User Side Logic ---
    renderMainEvents(searchQuery = '', filterCategory = 'All') {
        const grid = document.getElementById('main-events-grid');
        grid.innerHTML = '';

        const qs = searchQuery.toLowerCase();
        let displayEvents = this.cache.mainEvents.filter(event => {
            const matchQuery = event.name.toLowerCase().includes(qs) || event.description.toLowerCase().includes(qs);
            const matchCategory = filterCategory === 'All' ? true : event.category === filterCategory;
            return matchQuery && matchCategory;
        });

        if (displayEvents.length === 0) {
            grid.innerHTML = this.getEmptyState('No events found matching your criteria.');
            return;
        }

        displayEvents.forEach(event => {
            const card = document.createElement('div');
            card.className = 'card';
            // Placeholder banner if none provided
            const bannerImg = event.banner || 'https://via.placeholder.com/600x400?text=Event+Image';
            
            card.innerHTML = `
                <div class="card-banner" style="background-image: url('${bannerImg}')">
                    <span class="card-badge">${event.category}</span>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${event.name}</h3>
                    <p class="card-desc">${event.description}</p>
                    <button class="btn-primary w-full" onclick="appContext.openSubEvents('${event.id}')">View Events</button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    handleSearch(val) {
        const cat = document.getElementById('global-filter').value;
        this.renderMainEvents(val, cat);
    }

    handleFilter(val) {
        const qs = document.getElementById('global-search').value;
        this.renderMainEvents(qs, val);
    }

    openSubEvents(mainEventId) {
        const mainEvent = this.cache.mainEvents.find(me => me.id === mainEventId);
        if(!mainEvent) return;
        
        this.currentSubEventsMainId = mainEventId;
        document.getElementById('current-main-event-title').innerText = `${mainEvent.name} - Events`;
        document.getElementById('current-main-event-desc').innerText = mainEvent.description;
        
        this.renderSubEvents(mainEventId);
        this.navigateTo('subevents');
    }

    renderSubEvents(mainEventId) {
        const grid = document.getElementById('sub-events-grid');
        grid.innerHTML = '';
        
        const subEvents = this.cache.subEvents.filter(se => se.mainEventId === mainEventId);
        
        if (subEvents.length === 0) {
            grid.innerHTML = this.getEmptyState('No competitions/activities scheduled for this event yet.');
            return;
        }

        subEvents.forEach(se => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-content">
                    <h3 class="card-title mb-4">${se.name}</h3>
                    <p class="text-sm"><strong>Date:</strong> ${new Date(se.date).toDateString()}</p>
                    <p class="text-sm"><strong>Venue:</strong> ${se.venue}</p>
                    <p class="card-desc mt-2">${se.description}</p>
                    <button class="btn-secondary w-full" onclick="appContext.openRegistrationModal('${se.id}')">Register Now</button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // --- Modal Logic ---
    openRegistrationModal(subEventId) {
        const subEvent = this.cache.subEvents.find(se => se.id === subEventId);
        if(!subEvent) return;

        document.getElementById('modal-event-title').innerText = `Register for ${subEvent.name}`;
        document.getElementById('modal-coord').innerText = subEvent.coordinator;
        document.getElementById('modal-datevenue').innerText = `${new Date(subEvent.date).toDateString()} @ ${subEvent.venue}`;
        document.getElementById('modal-desc').innerText = subEvent.description;
        document.getElementById('reg-subevent-id').value = subEvent.id;
        
        document.getElementById('registration-form').reset();
        
        const modal = document.getElementById('registration-modal');
        modal.classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('registration-modal').classList.add('hidden');
    }

    submitRegistration(e) {
        e.preventDefault();
        const subEventId = document.getElementById('reg-subevent-id').value;
        const regData = {
            id: 'reg_' + generateId(),
            subEventId: subEventId,
            name: document.getElementById('reg-name').value,
            email: document.getElementById('reg-email').value,
            phone: document.getElementById('reg-phone').value,
            college: document.getElementById('reg-college').value,
            year: document.getElementById('reg-year').value,
            dept: document.getElementById('reg-dept').value,
            timestamp: new Date().toISOString()
        };

        this.cache.registrations.push(regData);
        this.saveStorage('reg');
        
        this.closeModal();
        this.showToast('Registration successful! Check your email for details.');

        // Simulate Email Delivery via Mockup Modal
        const subEvent = this.cache.subEvents.find(se => se.id === subEventId);
        if (subEvent) {
            setTimeout(() => {
                document.getElementById('sim-email-to').innerText = regData.email;
                document.getElementById('sim-email-subject').innerText = `Registration Confirmed for ${subEvent.name}`;
                document.getElementById('sim-email-body').innerText = `Hello ${regData.name},\n\nYou have successfully registered for ${subEvent.name}.\n\nDetails:\n• Date: ${new Date(subEvent.date).toDateString()}\n• Venue: ${subEvent.venue}\n• Coordinator: ${subEvent.coordinator}\n\nSee you there!`;
                
                document.getElementById('email-simulation-modal').classList.remove('hidden');
                this.showToast('Simulated Email Received!', 'success');
            }, 1000);
        }
    }

    getEmptyState(msg) {
        return `
            <div class="empty-state">
                <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <p>${msg}</p>
            </div>
        `;
    }

    // --- Admin Logic ---
    handleAdminLogin(e) {
        e.preventDefault();
        const usr = document.getElementById('admin-username').value;
        const pwd = document.getElementById('admin-password').value;
        
        // Hardcoded simple auth per requirement
        if(usr === 'admin' && pwd === 'admin') {
            this.cache.isAuthenticated = true;
            localStorage.setItem('cep_auth', 'true');
            this.updateNavUI();
            document.getElementById('admin-login-form').reset();
            this.navigateTo('admin-dashboard');
            this.showToast('Logged in successfully');
        } else {
            this.showToast('Invalid credentials', 'error');
        }
    }

    adminLogout() {
        this.cache.isAuthenticated = false;
        localStorage.removeItem('cep_auth');
        this.updateNavUI();
        this.navigateTo('home');
        this.showToast('Logged out');
    }

    initAdminDashboard() {
        this.renderAdminMainEvents();
        this.renderAdminSubEvents();
        this.renderAdminRegistrations();
        this.populateAdminSelects();
        this.switchAdminTab('main-events-manage');
    }

    switchAdminTab(tabAlias) {
        const tabElId = 'tab-' + tabAlias;
        document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.remove('active'));
        document.getElementById(tabElId).classList.add('active');

        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick').includes(tabAlias));
        if(activeBtn) activeBtn.classList.add('active');
        
        if(tabAlias === 'registrations-view') this.populateAdminSelects(); // refresh filter
    }

    populateAdminSelects() {
        const selParent = document.getElementById('add-sub-main_event');
        selParent.innerHTML = '<option value="" disabled selected>Parent Main Event</option>';
        this.cache.mainEvents.forEach(me => {
            selParent.innerHTML += `<option value="${me.id}">${me.name}</option>`;
        });

        const selFilterObj = document.getElementById('filter-reg-subevent');
        selFilterObj.innerHTML = '<option value="All">All Sub-Events...</option>';
        this.cache.subEvents.forEach(se => {
            const me = this.cache.mainEvents.find(m => m.id === se.mainEventId);
            const pName = me ? me.name : 'Unknown';
            selFilterObj.innerHTML += `<option value="${se.id}">${se.name} (${pName})</option>`;
        });
    }

    renderAdminMainEvents() {
        const list = document.getElementById('admin-main-events-list');
        list.innerHTML = '';
        if(this.cache.mainEvents.length ===0) {
            list.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">No main events exist.</td></tr>';
            return;
        }
        this.cache.mainEvents.forEach(event => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${event.name}</strong></td>
                <td><span class="card-badge" style="position:static">${event.category}</span></td>
                <td>
                    <button class="btn-danger btn-text w-full" style="max-width:80px; padding:0.25rem" onclick="appContext.deleteMainEvent('${event.id}')">Delete</button>
                </td>
            `;
            list.appendChild(tr);
        });
    }

    addMainEvent(e) {
        e.preventDefault();
        const ev = {
            id: 'me_' + generateId(),
            name: document.getElementById('add-main-name').value,
            category: document.getElementById('add-main-category').value,
            banner: document.getElementById('add-main-banner').value,
            description: document.getElementById('add-main-desc').value
        };
        this.cache.mainEvents.push(ev);
        this.saveStorage('main');
        e.target.reset();
        this.renderAdminMainEvents();
        this.populateAdminSelects();
        this.showToast('Main event added');
    }

    deleteMainEvent(id) {
        if(!confirm("Are you sure? This will not delete child sub-events automatically (for simplicity, but bad practice in prod).")) return;
        this.cache.mainEvents = this.cache.mainEvents.filter(e => e.id !== id);
        this.saveStorage('main');
        this.renderAdminMainEvents();
        this.populateAdminSelects();
        this.showToast('Main event deleted');
    }

    renderAdminSubEvents() {
        const list = document.getElementById('admin-sub-events-list');
        list.innerHTML = '';
        if(this.cache.subEvents.length ===0) {
            list.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No sub events exist.</td></tr>';
            return;
        }
        this.cache.subEvents.forEach(se => {
            const me = this.cache.mainEvents.find(m => m.id === se.mainEventId);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${se.name}</strong></td>
                <td>${me ? me.name : '<span class="text-muted">Orphaned</span>'}</td>
                <td>${new Date(se.date).toLocaleDateString()}</td>
                <td>
                    <button class="btn-danger btn-text" style="padding:0.25rem" onclick="appContext.deleteSubEvent('${se.id}')">Delete</button>
                </td>
            `;
            list.appendChild(tr);
        });
    }

    addSubEvent(e) {
        e.preventDefault();
        const ev = {
            id: 'se_' + generateId(),
            mainEventId: document.getElementById('add-sub-main_event').value,
            name: document.getElementById('add-sub-name').value,
            date: document.getElementById('add-sub-date').value,
            venue: document.getElementById('add-sub-venue').value,
            coordinator: document.getElementById('add-sub-coordinator').value,
            description: document.getElementById('add-sub-desc').value
        };
        this.cache.subEvents.push(ev);
        this.saveStorage('sub');
        e.target.reset();
        this.renderAdminSubEvents();
        this.showToast('Sub-Event added');
    }

    deleteSubEvent(id) {
        if(!confirm("Delete this sub-event?")) return;
        this.cache.subEvents = this.cache.subEvents.filter(e => e.id !== id);
        this.saveStorage('sub');
        this.renderAdminSubEvents();
        this.showToast('Sub-event deleted');
    }

    renderAdminStats() {
        const statsGrid = document.getElementById('admin-stats-grid');
        if(!statsGrid) return;
        statsGrid.innerHTML = '';

        const totalRegs = this.cache.registrations.length;
        
        // Group by subEvent
        const regCounts = {};
        this.cache.registrations.forEach(r => {
            regCounts[r.subEventId] = (regCounts[r.subEventId] || 0) + 1;
        });

        // Top event
        let topEventName = 'N/A';
        let maxRegs = 0;
        for (const [sId, count] of Object.entries(regCounts)) {
            if (count > maxRegs) {
                maxRegs = count;
                const se = this.cache.subEvents.find(s => s.id === sId);
                topEventName = se ? se.name : 'Unknown';
            }
        }

        statsGrid.innerHTML = `
            <div class="card" style="padding: 1rem; text-align: center;">
                <h4 class="text-muted">Total Registrations</h4>
                <h2 style="font-size: 2rem; color: var(--primary); margin-top: 0.5rem;">${totalRegs}</h2>
            </div>
            <div class="card" style="padding: 1rem; text-align: center;">
                <h4 class="text-muted">Most Popular Event</h4>
                <p style="font-size: 1.25rem; font-weight: 600; margin-top: 1rem;">${topEventName} <span class="card-badge" style="position:static; padding: 2px 6px; margin-left: 0.5rem;">${maxRegs}</span></p>
            </div>
            <div class="card" style="padding: 1rem; text-align: center;">
                <h4 class="text-muted">Total Sub-Events</h4>
                <h2 style="font-size: 2rem; color: var(--secondary); margin-top: 0.5rem;">${this.cache.subEvents.length}</h2>
            </div>
        `;
    }

    renderAdminRegistrations() {
        this.renderAdminStats();

        const list = document.getElementById('admin-registrations-list');
        list.innerHTML = '';
        
        const filterId = document.getElementById('filter-reg-subevent') ? document.getElementById('filter-reg-subevent').value : 'All';
        
        const filteredRegs = filterId === 'All' 
            ? this.cache.registrations 
            : this.cache.registrations.filter(r => r.subEventId === filterId);

        if(filteredRegs.length === 0) {
            list.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No registrations found.</td></tr>';
            return;
        }

        filteredRegs.forEach(reg => {
            const se = this.cache.subEvents.find(s => s.id === reg.subEventId);
            const seName = se ? se.name : 'Unknown Event';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${reg.name}</strong><br><small class="text-muted">${reg.phone}</small></td>
                <td>${reg.email}</td>
                <td>${reg.college}<br><small class="text-muted">${reg.year} - ${reg.dept}</small></td>
                <td><span class="card-badge" style="position:static">${seName}</span></td>
            `;
            list.appendChild(tr);
        });
    }
}

// Init Global App Context
const appContext = new EventPortalContext();

// Close Modals when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('registration-modal');
    if (event.target == modal) {
        appContext.closeModal();
    }
}
