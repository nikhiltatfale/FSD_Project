// script.js
document.addEventListener('DOMContentLoaded', () => {
    // State management
    let contacts = JSON.parse(localStorage.getItem('contacts')) || [];
    let currentFilter = 'all';
    let currentSort = 'name-asc';
    let searchQuery = '';
    
    // DOM Elements
    const contactsGrid = document.getElementById('contactsGrid');
    const emptyState = document.getElementById('emptyState');
    
    const contactModal = document.getElementById('contactModal');
    const deleteModal = document.getElementById('deleteModal');
    
    const contactForm = document.getElementById('contactForm');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const filterSelect = document.getElementById('filterSelect');
    
    const addContactBtn = document.getElementById('addContactBtn');
    const emptyAddBtn = document.getElementById('emptyAddBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    
    const closeDeleteBtn = document.getElementById('closeDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    let contactToDelete = null;

    init();

    function init() {
        updateFilterOptions();
        renderContacts();
        setupEventListeners();
    }

    function saveContacts() {
        localStorage.setItem('contacts', JSON.stringify(contacts));
        updateFilterOptions();
        renderContacts();
    }

    function getContactById(id) {
        return contacts.find(c => c.id === id);
    }

    function addContact(contact) {
        contact.id = Date.now().toString();
        contact.createdAt = new Date().toISOString();
        contacts.push(contact);
        saveContacts();
        showToast('Contact added successfully!', 'success');
    }

    function updateContact(id, updatedData) {
        const index = contacts.findIndex(c => c.id === id);
        if (index !== -1) {
            contacts[index] = { ...contacts[index], ...updatedData };
            saveContacts();
            showToast('Contact updated successfully!', 'success');
        }
    }

    function deleteContact(id) {
        contacts = contacts.filter(c => c.id !== id);
        saveContacts();
        showToast('Contact deleted.', 'success');
    }

    function renderContacts() {
        let filtered = contacts.filter(c => {
            const matchesSearch = 
                c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.phone.includes(searchQuery) ||
                (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()));
                
            const matchesTag = currentFilter === 'all' || 
                (c.tags && c.tags.split(',').map(t=>t.trim().toLowerCase()).includes(currentFilter.toLowerCase()));
                
            return matchesSearch && matchesTag;
        });

        filtered.sort((a, b) => {
            if (currentSort === 'name-asc') {
                return a.fullName.localeCompare(b.fullName);
            } else if (currentSort === 'name-desc') {
                return b.fullName.localeCompare(a.fullName);
            } else if (currentSort === 'newest') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            return 0;
        });

        if (filtered.length === 0) {
            contactsGrid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            
            if (contacts.length === 0) {
                emptyState.querySelector('h2').textContent = 'No Contacts Found';
                emptyState.querySelector('p').textContent = 'Get started by adding a new contact to your dashboard.';
                emptyAddBtn.classList.remove('hidden');
            } else {
                emptyState.querySelector('h2').textContent = 'No Match Found';
                emptyState.querySelector('p').textContent = 'Try adjusting your search or filter criteria.';
                emptyAddBtn.classList.add('hidden');
            }
        } else {
            contactsGrid.classList.remove('hidden');
            emptyState.classList.add('hidden');
            
            contactsGrid.innerHTML = filtered.map(c => `
                <div class="contact-card">
                    <div class="contact-header">
                        <div class="contact-name">
                            <div class="avatar">${getInitials(c.fullName)}</div>
                            <div class="contact-info-title">
                                <h3>${c.fullName}</h3>
                                ${c.company ? `<span class="company-text"><i class="ph ph-buildings"></i> ${c.company}</span>` : ''}
                            </div>
                        </div>
                        <div class="actions">
                            <button class="btn-icon edit" onclick="editContact('${c.id}')" title="Edit">
                                <i class="ph ph-pencil-simple"></i>
                            </button>
                            <button class="btn-icon danger" onclick="promptDelete('${c.id}')" title="Delete">
                                <i class="ph ph-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="contact-details">
                        <div class="detail-row">
                            <i class="ph ph-phone"></i>
                            <span>${c.phone}</span>
                        </div>
                        <div class="detail-row">
                            <i class="ph ph-envelope-simple"></i>
                            <a href="mailto:${c.email}" style="color:inherit; text-decoration:none;">${c.email}</a>
                        </div>
                        ${c.address ? `
                        <div class="detail-row">
                            <i class="ph ph-map-pin"></i>
                            <span>${c.address}</span>
                        </div>` : ''}
                        ${c.notes ? `
                        <div class="detail-row">
                            <i class="ph ph-file-text"></i>
                            <span style="display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${c.notes}</span>
                        </div>` : ''}
                    </div>
                    ${c.tags ? `
                    <div class="contact-tags">
                        ${c.tags.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).filter(t => t !== '<span class="tag"></span>').join('')}
                    </div>` : ''}
                </div>
            `).join('');
        }
    }

    function updateFilterOptions() {
        const allTags = new Set();
        contacts.forEach(c => {
            if (c.tags) {
                c.tags.split(',').forEach(t => {
                    const tag = t.trim();
                    if(tag) allTags.add(tag);
                });
            }
        });
        
        const currentSelected = filterSelect.value;
        filterSelect.innerHTML = '<option value="all">All Tags</option>';
        [...allTags].sort().forEach(tag => {
            const displayTag = tag.charAt(0).toUpperCase() + tag.slice(1);
            filterSelect.innerHTML += `<option value="${tag}">${displayTag}</option>`;
        });
        
        if (allTags.has(currentSelected)) {
            filterSelect.value = currentSelected;
        } else {
            filterSelect.value = 'all';
            currentFilter = 'all';
        }
    }

    function getInitials(name) {
        return name.split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase() || '?';
    }

    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'ph-check-circle' : 'ph-warning-circle';
        
        toast.innerHTML = `
            <i class="ph ${icon}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function resetForm() {
        contactForm.reset();
        document.getElementById('contactId').value = '';
        document.getElementById('modalTitle').textContent = 'Add New Contact';
        document.querySelectorAll('.form-group').forEach(g => g.classList.remove('error'));
    }

    function validateForm() {
        let isValid = true;
        const nameInput = document.getElementById('fullName');
        const phoneInput = document.getElementById('phone');
        const emailInput = document.getElementById('email');

        if (!nameInput.value.trim()) {
            nameInput.parentElement.classList.add('error');
            isValid = false;
        } else {
            nameInput.parentElement.classList.remove('error');
        }

        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\\s\\./0-9]{6,15}$/im;
        if (!phoneRegex.test(phoneInput.value.trim())) {
            phoneInput.parentElement.classList.add('error');
            isValid = false;
        } else {
            phoneInput.parentElement.classList.remove('error');
        }

        const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
        if (emailInput.value.trim() && !emailRegex.test(emailInput.value.trim())) {
            emailInput.parentElement.classList.add('error');
            isValid = false;
        } else {
            emailInput.parentElement.classList.remove('error');
        }

        return isValid;
    }

    function openModal() {
        contactModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        contactModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        setTimeout(resetForm, 300);
    }

    function openDeleteModal() {
        deleteModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeDeleteModal() {
        deleteModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        contactToDelete = null;
    }

    window.editContact = function(id) {
        const contact = getContactById(id);
        if (!contact) return;

        document.getElementById('contactId').value = contact.id;
        document.getElementById('modalTitle').textContent = 'Edit Contact';
        
        document.getElementById('fullName').value = contact.fullName;
        document.getElementById('phone').value = contact.phone;
        document.getElementById('email').value = contact.email;
        document.getElementById('address').value = contact.address || '';
        document.getElementById('company').value = contact.company || '';
        document.getElementById('tags').value = contact.tags || '';
        document.getElementById('notes').value = contact.notes || '';

        openModal();
    };

    window.promptDelete = function(id) {
        const contact = getContactById(id);
        if (!contact) return;
        
        contactToDelete = id;
        document.getElementById('deleteContactName').textContent = contact.fullName;
        openDeleteModal();
    };

    function setupEventListeners() {
        addContactBtn.addEventListener('click', openModal);
        emptyAddBtn.addEventListener('click', openModal);
        
        closeModalBtn.addEventListener('click', closeModal);
        cancelModalBtn.addEventListener('click', closeModal);
        
        closeDeleteBtn.addEventListener('click', closeDeleteModal);
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);

        contactModal.addEventListener('click', (e) => {
            if(e.target === contactModal) closeModal();
        });
        deleteModal.addEventListener('click', (e) => {
            if(e.target === deleteModal) closeDeleteModal();
        });

        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderContacts();
        });

        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderContacts();
        });

        filterSelect.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            renderContacts();
        });

        confirmDeleteBtn.addEventListener('click', () => {
            if (contactToDelete) {
                deleteContact(contactToDelete);
                closeDeleteModal();
            }
        });

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            document.querySelectorAll('.form-group input').forEach(input => {
                input.addEventListener('input', () => {
                    input.parentElement.classList.remove('error');
                }, { once: true });
            });

            if (!validateForm()) return;

            const contactData = {
                fullName: document.getElementById('fullName').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                email: document.getElementById('email').value.trim(),
                address: document.getElementById('address').value.trim(),
                company: document.getElementById('company').value.trim(),
                tags: document.getElementById('tags').value.trim(),
                notes: document.getElementById('notes').value.trim()
            };

            const id = document.getElementById('contactId').value;
            if (id) {
                updateContact(id, contactData);
            } else {
                addContact(contactData);
            }

            closeModal();
        });
    }
});
