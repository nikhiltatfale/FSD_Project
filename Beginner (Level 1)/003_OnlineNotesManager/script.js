// In-memory storage with enhanced features
let notes = [];
let currentEditId = null;
let noteIdCounter = 1;
let deleteNoteId = null;
let currentView = 'all';
let currentCategory = 'all';
let isListView = false;

// DOM Elements
const noteForm = document.getElementById('noteForm');
const noteTitleInput = document.getElementById('noteTitle');
const noteContentInput = document.getElementById('noteContent');
const noteCategorySelect = document.getElementById('noteCategory');
const notePrioritySelect = document.getElementById('notePriority');
const noteTagsInput = document.getElementById('noteTags');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const formTitle = document.getElementById('formTitle');
const notesGrid = document.getElementById('notesGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const sortBy = document.getElementById('sortBy');
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const mobileToggleBtn = document.getElementById('mobileToggle');
const charCount = document.getElementById('charCount');
const wordCount = document.getElementById('wordCount');
const viewToggle = document.getElementById('viewToggle');
const viewIcon = document.getElementById('viewIcon');

// Initialize app
function init() {
    setupEventListeners();
    updateStats();
    renderNotes();
}

// Event Listeners
function setupEventListeners() {
    noteForm.addEventListener('submit', handleFormSubmit);
    searchInput.addEventListener('input', renderNotes);
    sortBy.addEventListener('change', renderNotes);
    confirmDeleteBtn.addEventListener('click', confirmDelete);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    toggleSidebarBtn.addEventListener('click', toggleSidebar);
    mobileToggleBtn.addEventListener('click', toggleSidebar);
    noteContentInput.addEventListener('input', updateCharacterCount);
    
    // Color picker
    document.querySelectorAll('input[name="noteColor"]').forEach(radio => {
        radio.addEventListener('change', updateFormPreview);
    });
}

// Character and word count
function updateCharacterCount() {
    const text = noteContentInput.value;
    const chars = text.length;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    charCount.textContent = chars;
    wordCount.textContent = words;
}

// Toggle sidebar
function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
    sidebar.classList.toggle('show');
}

// Toggle view (grid/list)
function toggleView() {
    isListView = !isListView;
    notesGrid.classList.toggle('list-view');
    viewIcon.textContent = isListView ? '📋' : '📱';
}

// Change view (all, favorites, archived)
function changeView(view) {
    currentView = view;
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === view) {
            item.classList.add('active');
        }
    });
    
    // Update view title
    const viewTitles = {
        all: 'All Notes',
        favorites: 'Favorite Notes',
        archived: 'Archived Notes'
    };
    document.getElementById('viewTitle').textContent = viewTitles[view];
    
    renderNotes();
}

// Filter by category
function filterByCategory(category) {
    currentCategory = category;
    
    // Update active category
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.category === category) {
            item.classList.add('active');
        }
    });
    
    renderNotes();
}

// Scroll to form
function scrollToForm() {
    document.getElementById('noteFormContainer').scrollIntoView({ behavior: 'smooth' });
    noteTitleInput.focus();
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();

    const selectedColor = document.querySelector('input[name="noteColor"]:checked').value;
    
    const noteData = {
        title: noteTitleInput.value.trim(),
        content: noteContentInput.value.trim(),
        category: noteCategorySelect.value,
        priority: notePrioritySelect.value,
        tags: noteTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag),
        color: selectedColor,
        isPinned: false,
        isFavorite: false,
        isArchived: false
    };

    if (currentEditId !== null) {
        updateNote(currentEditId, noteData);
    } else {
        addNote(noteData);
    }

    resetForm();
    updateStats();
    renderNotes();
}

// Add new note
function addNote(noteData) {
    const note = {
        id: noteIdCounter++,
        ...noteData,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
    };

    notes.unshift(note);
}

// Update existing note
function updateNote(id, noteData) {
    const noteIndex = notes.findIndex(note => note.id === id);
    
    if (noteIndex !== -1) {
        notes[noteIndex] = {
            ...notes[noteIndex],
            ...noteData,
            modifiedAt: new Date().toISOString()
        };
    }
}

// Delete note
function deleteNote(id) {
    deleteNoteId = id;
    deleteModal.classList.add('show');
}

function confirmDelete() {
    notes = notes.filter(note => note.id !== deleteNoteId);
    closeDeleteModal();
    updateStats();
    renderNotes();
}

function closeDeleteModal() {
    deleteModal.classList.remove('show');
    deleteNoteId = null;
}

// Edit note
function editNote(id) {
    const note = notes.find(note => note.id === id);
    
    if (note) {
        currentEditId = id;
        noteTitleInput.value = note.title;
        noteContentInput.value = note.content;
        noteCategorySelect.value = note.category;
        notePrioritySelect.value = note.priority;
        noteTagsInput.value = note.tags.join(', ');
        
        // Set color
        document.querySelector(`input[value="${note.color}"]`).checked = true;
        
        formTitle.textContent = '✏️ Edit Note';
        submitBtn.innerHTML = '<span>💾</span> Update Note';
        cancelBtn.style.display = 'inline-flex';
        
        updateCharacterCount();
        scrollToForm();
    }
}

// Toggle pin status
function togglePin(id) {
    const note = notes.find(note => note.id === id);
    
    if (note) {
        note.isPinned = !note.isPinned;
        updateStats();
        renderNotes();
    }
}

// Toggle favorite status
function toggleFavorite(id) {
    const note = notes.find(note => note.id === id);
    
    if (note) {
        note.isFavorite = !note.isFavorite;
        renderNotes();
    }
}

// Toggle archive status
function toggleArchive(id) {
    const note = notes.find(note => note.id === id);
    
    if (note) {
        note.isArchived = !note.isArchived;
        renderNotes();
    }
}

// Reset form
function resetForm() {
    noteForm.reset();
    currentEditId = null;
    formTitle.textContent = '✨ Create New Note';
    submitBtn.innerHTML = '<span>➕</span> Add Note';
    cancelBtn.style.display = 'none';
    charCount.textContent = '0';
    wordCount.textContent = '0';
    document.querySelector('input[name="noteColor"][value="#1e293b"]').checked = true;
}

// Update statistics
function updateStats() {
    const totalCount = notes.length;
    const pinnedCount = notes.filter(n => n.isPinned).length;
    
    document.getElementById('totalNotes').textContent = totalCount;
    document.getElementById('pinnedNotes').textContent = pinnedCount;
    
    // Update category counts
    document.getElementById('count-all').textContent = totalCount;
    document.getElementById('count-work').textContent = notes.filter(n => n.category === 'work').length;
    document.getElementById('count-personal').textContent = notes.filter(n => n.category === 'personal').length;
    document.getElementById('count-ideas').textContent = notes.filter(n => n.category === 'ideas').length;
    document.getElementById('count-todo').textContent = notes.filter(n => n.category === 'todo').length;
}

// Render notes
function renderNotes() {
    let filteredNotes = filterNotes();
    filteredNotes = sortNotes(filteredNotes);
    
    notesGrid.innerHTML = '';
    
    if (filteredNotes.length === 0) {
        emptyState.classList.add('show');
        document.getElementById('displayCount').textContent = '0 notes';
        return;
    }
    
    emptyState.classList.remove('show');
    document.getElementById('displayCount').textContent = `${filteredNotes.length} notes`;
    
    // Render pinned notes first
    const pinnedNotes = filteredNotes.filter(note => note.isPinned);
    const unpinnedNotes = filteredNotes.filter(note => !note.isPinned);
    
    [...pinnedNotes, ...unpinnedNotes].forEach(note => {
        const noteCard = createNoteCard(note);
        notesGrid.appendChild(noteCard);
    });
}

// Filter notes
function filterNotes() {
    const searchTerm = searchInput.value.toLowerCase();
    
    return notes.filter(note => {
        // Search filter
        const matchesSearch = note.title.toLowerCase().includes(searchTerm) || 
                            note.content.toLowerCase().includes(searchTerm) ||
                            note.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        
        // Category filter
        const matchesCategory = currentCategory === 'all' || note.category === currentCategory;
        
        // View filter
        let matchesView = true;
        if (currentView === 'favorites') {
            matchesView = note.isFavorite;
        } else if (currentView === 'archived') {
            matchesView = note.isArchived;
        } else if (currentView === 'all') {
            matchesView = !note.isArchived;
        }
        
        return matchesSearch && matchesCategory && matchesView;
    });
}

// Sort notes
function sortNotes(notesToSort) {
    const sortType = sortBy.value;
    
    return [...notesToSort].sort((a, b) => {
        switch(sortType) {
            case 'newest':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'oldest':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'title':
                return a.title.localeCompare(b.title);
            case 'modified':
                return new Date(b.modifiedAt) - new Date(a.modifiedAt);
            default:
                return 0;
        }
    });
}

// Create note card element
function createNoteCard(note) {
    const card = document.createElement('div');
    card.className = `note-card ${note.isPinned ? 'pinned' : ''} ${note.isArchived ? 'archived' : ''} ${note.isFavorite ? 'favorite' : ''}`;
    card.style.borderLeftColor = getCategoryColor(note.category);
    
    const formattedDate = formatDate(note.createdAt);
    const modifiedDate = formatDate(note.modifiedAt);
    
    const priorityIcons = {
        low: '🟢',
        medium: '🟡',
        high: '🔴'
    };
    
    card.innerHTML = `
        <div class="note-header">
            <div class="note-title-section">
                <div class="note-title">${escapeHtml(note.title)}</div>
                <div class="note-badges">
                    <span class="badge badge-${note.category}">${getCategoryEmoji(note.category)} ${note.category}</span>
                    <span class="badge-priority priority-${note.priority}">${priorityIcons[note.priority]} ${note.priority}</span>
                </div>
            </div>
            <div class="note-actions-top">
                <button class="icon-btn ${note.isPinned ? 'pinned' : ''}" onclick="togglePin(${note.id})" title="Pin">
                    ${note.isPinned ? '📌' : '📍'}
                </button>
                <button class="icon-btn ${note.isFavorite ? 'pinned' : ''}" onclick="toggleFavorite(${note.id})" title="Favorite">
                    ${note.isFavorite ? '⭐' : '☆'}
                </button>
            </div>
        </div>
        
        <div class="note-content">
            ${escapeHtml(note.content.substring(0, 200))}${note.content.length > 200 ? '...' : ''}
        </div>
        
        ${note.tags.length > 0 ? `
            <div class="note-tags">
                ${note.tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')}
            </div>
        ` : ''}
        
        <div class="note-meta">
            📅 Created: ${formattedDate}<br>
            🕐 Modified: ${modifiedDate}
        </div>
        
        <div class="note-actions-bottom">
            <button class="action-btn-small" onclick="editNote(${note.id})" title="Edit">✏️</button>
            <button class="action-btn-small" onclick="toggleArchive(${note.id})" title="${note.isArchived ? 'Unarchive' : 'Archive'}">
                ${note.isArchived ? '📂' : '📦'}
            </button>
            <button class="action-btn-small" onclick="duplicateNote(${note.id})" title="Duplicate">📋</button>
            <button class="action-btn-small delete" onclick="deleteNote(${note.id})" title="Delete">🗑️</button>
        </div>
    `;
    
    // Apply custom color
    if (note.color) {
        card.style.background = `linear-gradient(135deg, ${note.color} 0%, ${adjustColor(note.color, 20)} 100%)`;
    }
    
    return card;
}

// Duplicate note
function duplicateNote(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
        const duplicate = {
            ...note,
            id: noteIdCounter++,
            title: note.title + ' (Copy)',
            isPinned: false,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString()
        };
        notes.unshift(duplicate);
        updateStats();
        renderNotes();
    }
}

// Get category color
function getCategoryColor(category) {
    const colors = {
        work: '#3b82f6',
        personal: '#10b981',
        ideas: '#f59e0b',
        todo: '#ef4444'
    };
    return colors[category] || '#3b82f6';
}

// Get category emoji
function getCategoryEmoji(category) {
    const emojis = {
        work: '💼',
        personal: '👤',
        ideas: '💡',
        todo: '✅'
    };
    return emojis[category] || '📝';
}

// Adjust color brightness
function adjustColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Export notes as JSON
function exportNotes() {
    if (notes.length === 0) {
        alert('No notes to export!');
        return;
    }
    
    const dataStr = JSON.stringify(notes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Import notes from JSON
function importNotes(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedNotes = JSON.parse(e.target.result);
            
            if (Array.isArray(importedNotes)) {
                // Update IDs to avoid conflicts
                importedNotes.forEach(note => {
                    note.id = noteIdCounter++;
                });
                
                notes = [...notes, ...importedNotes];
                updateStats();
                renderNotes();
                alert(`Successfully imported ${importedNotes.length} notes!`);
            } else {
                alert('Invalid notes file format!');
            }
        } catch (error) {
            alert('Error reading file: ' + error.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// Update form preview
function updateFormPreview() {
    const selectedColor = document.querySelector('input[name="noteColor"]:checked').value;
    document.getElementById('noteFormContainer').style.borderLeftColor = selectedColor;
}

// Utility function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);