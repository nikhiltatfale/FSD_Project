// Global Variables
let blogs = [];
let currentEditingBlog = null;
let currentTags = [];
let currentView = 'home';
let currentDate = new Date();
let selectedBlogForModal = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    const firebaseConfig = localStorage.getItem('firebaseConfig');
    if (firebaseConfig) {
        initializeBlogPlatform();
    }
});

// Setup Form Handler
document.getElementById('setupForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const config = {
        apiKey: document.getElementById('apiKey').value,
        projectId: document.getElementById('projectId').value,
        appId: document.getElementById('appId').value
    };
    localStorage.setItem('firebaseConfig', JSON.stringify(config));
    initializeBlogPlatform();
});

function skipSetup() {
    localStorage.setItem('firebaseConfig', JSON.stringify({ demo: true }));
    initializeBlogPlatform();
}

function initializeBlogPlatform() {
    document.getElementById('setupModal').style.display = 'none';
    document.getElementById('blogPlatform').style.display = 'block';
    loadBlogs();
}

// Blog Management Functions
function loadBlogs() {
    const stored = localStorage.getItem('blogs');
    blogs = stored ? JSON.parse(stored) : [];
    renderBlogs();
    updateAllViews();
}

function saveBlogs() {
    localStorage.setItem('blogs', JSON.stringify(blogs));
}

// Blog Form Handler
document.getElementById('blogForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('blogTitle').value;
    const content = document.getElementById('blogContent').value;
    const category = document.getElementById('blogCategory').value;
    
    const excerpt = content.substring(0, 150) + '...';
    const wordCount = content.split(' ').length;
    const readTime = Math.ceil(wordCount / 200) + ' min';
    
    const blogData = {
        id: currentEditingBlog ? currentEditingBlog.id : Date.now().toString(),
        title,
        content,
        excerpt,
        category,
        tags: currentTags,
        publishDate: currentEditingBlog ? currentEditingBlog.publishDate : new Date().toISOString(),
        lastModified: new Date().toISOString(),
        readTime
    };
    
    if (currentEditingBlog) {
        const index = blogs.findIndex(b => b.id === currentEditingBlog.id);
        blogs[index] = blogData;
    } else {
        blogs.unshift(blogData);
    }
    
    saveBlogs();
    cancelEdit();
    showView('home');
    renderBlogs();
    updateAllViews();
});

// Tag Management
function addTag() {
    const tagInput = document.getElementById('tagInput');
    const tag = tagInput.value.trim();
    
    if (tag && !currentTags.includes(tag)) {
        currentTags.push(tag);
        renderTags();
        tagInput.value = '';
    }
}

function removeTag(tag) {
    currentTags = currentTags.filter(t => t !== tag);
    renderTags();
}

function renderTags() {
    const tagsList = document.getElementById('tagsList');
    tagsList.innerHTML = currentTags.map(tag => `
        <span class="tag">
            #${tag}
            <button onclick="removeTag('${tag}')">×</button>
        </span>
    `).join('');
}

// Editor Functions
function showEditor(blog = null) {
    currentEditingBlog = blog;
    currentTags = blog ? [...blog.tags] : [];
    
    document.getElementById('editorTitle').textContent = blog ? 'Edit Post' : 'Create New Post';
    document.getElementById('saveButtonText').textContent = blog ? 'Update Post' : 'Publish Post';
    
    if (blog) {
        document.getElementById('blogTitle').value = blog.title;
        document.getElementById('blogContent').value = blog.content;
        document.getElementById('blogCategory').value = blog.category;
    } else {
        document.getElementById('blogForm').reset();
    }
    
    renderTags();
    showView('editor');
}

function cancelEdit() {
    currentEditingBlog = null;
    currentTags = [];
    document.getElementById('blogForm').reset();
    renderTags();
}

// View Management
function showView(viewName) {
    currentView = viewName;
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === viewName) {
            btn.classList.add('active');
        }
    });
    
    // Update views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    const viewElement = document.getElementById(viewName + 'View');
    if (viewElement) {
        viewElement.classList.add('active');
    }
    
    // Refresh view content
    if (viewName === 'home') renderBlogs();
    if (viewName === 'calendar') renderCalendar();
    if (viewName === 'stats') renderStats();
    if (viewName === 'archive') renderArchive();
}

// Render Blogs (Home View)
function renderBlogs() {
    const blogGrid = document.getElementById('blogGrid');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    const filteredBlogs = blogs.filter(blog => 
        blog.title.toLowerCase().includes(searchTerm) ||
        blog.content.toLowerCase().includes(searchTerm) ||
        blog.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
    
    if (filteredBlogs.length === 0) {
        blogGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-icon">
                    <i class="fas fa-archive"></i>
                </div>
                <h3>No blogs found</h3>
                <p>${searchTerm ? 'Try different search terms' : 'Start creating your first blog post!'}</p>
            </div>
        `;
        return;
    }
    
    blogGrid.innerHTML = filteredBlogs.map(blog => `
        <div class="blog-card" onclick="openBlogModal('${blog.id}')">
            <div class="blog-card-image">
                ${blog.title.charAt(0).toUpperCase()}
            </div>
            <div class="blog-card-content">
                <div class="blog-card-meta">
                    <span class="category-badge">${blog.category}</span>
                    <span class="read-time">
                        <i class="fas fa-clock"></i>
                        ${blog.readTime}
                    </span>
                </div>
                <h3>${blog.title}</h3>
                <p>${blog.excerpt}</p>
                <div class="blog-card-footer">
                    <span>${new Date(blog.publishDate).toLocaleDateString()}</span>
                    <div class="tags-list">
                        ${blog.tags.slice(0, 2).map(tag => `<span class="tag">#${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function filterBlogs() {
    renderBlogs();
}

// Blog Modal Functions
function openBlogModal(blogId) {
    const blog = blogs.find(b => b.id === blogId);
    if (!blog) return;
    
    selectedBlogForModal = blog;
    
    document.getElementById('modalTitle').textContent = blog.title;
    document.getElementById('modalCategory').textContent = blog.category;
    document.getElementById('modalDate').textContent = new Date(blog.publishDate).toLocaleDateString();
    document.getElementById('modalReadTime').innerHTML = `<i class="fas fa-clock"></i> ${blog.readTime}`;
    document.getElementById('modalContent').textContent = blog.content;
    document.getElementById('modalTags').innerHTML = blog.tags.map(tag => 
        `<span class="tag">#${tag}</span>`
    ).join('');
    
    document.getElementById('blogModal').style.display = 'flex';
}

function closeBlogModal() {
    document.getElementById('blogModal').style.display = 'none';
    selectedBlogForModal = null;
}

function editBlog() {
    closeBlogModal();
    showEditor(selectedBlogForModal);
}

function deleteBlog() {
    if (confirm('Are you sure you want to delete this blog?')) {
        blogs = blogs.filter(b => b.id !== selectedBlogForModal.id);
        saveBlogs();
        closeBlogModal();
        renderBlogs();
        updateAllViews();
    }
}

// Calendar Functions
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthElement = document.getElementById('calendarMonth');
    
    monthElement.textContent = currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    let html = '';
    
    // Day headers
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Blank days
    for (let i = 0; i < startingDayOfWeek; i++) {
        html += '<div></div>';
    }
    
    // Days with posts
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toDateString();
        const dayBlogs = blogs.filter(blog => 
            new Date(blog.publishDate).toDateString() === dateStr
        );
        
        const isToday = new Date().toDateString() === dateStr;
        const hasBlogs = dayBlogs.length > 0;
        
        html += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${hasBlogs ? 'has-posts' : ''}"
                 ${hasBlogs && dayBlogs.length === 1 ? `onclick="openBlogModal('${dayBlogs[0].id}')"` : ''}>
                <span class="calendar-day-number">${day}</span>
                ${hasBlogs ? `<span class="badge">${dayBlogs.length}</span>` : ''}
            </div>
        `;
    }
    
    calendarGrid.innerHTML = html;
}

function changeMonth(delta) {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1);
    renderCalendar();
}

// Stats Functions
function renderStats() {
    const stats = calculateStats();
    
    // Render stat cards
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = `
        <div class="stat-card gradient gradient-purple-blue">
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Total Posts</div>
        </div>
        <div class="stat-card gradient gradient-blue">
            <div class="stat-value">${stats.today}</div>
            <div class="stat-label">Today</div>
        </div>
        <div class="stat-card gradient gradient-green">
            <div class="stat-value">${stats.week}</div>
            <div class="stat-label">This Week</div>
        </div>
        <div class="stat-card gradient gradient-yellow">
            <div class="stat-value">${stats.month}</div>
            <div class="stat-label">This Month</div>
        </div>
        <div class="stat-card gradient gradient-pink">
            <div class="stat-value">${stats.year}</div>
            <div class="stat-label">This Year</div>
        </div>
    `;
    
    // Render category chart
    const categoryChart = document.getElementById('categoryChart');
    const categoryData = {};
    blogs.forEach(blog => {
        categoryData[blog.category] = (categoryData[blog.category] || 0) + 1;
    });
    
    categoryChart.innerHTML = Object.entries(categoryData).map(([category, count]) => `
        <div class="category-bar">
            <div class="category-name">${category}</div>
            <div class="bar-container">
                <div class="bar-fill" style="width: ${(count / stats.total) * 100}%">
                    ${count}
                </div>
            </div>
        </div>
    `).join('');
    
    // Render recent activity
    const recentActivity = document.getElementById('recentActivity');
    recentActivity.innerHTML = blogs.slice(0, 5).map(blog => `
        <div class="activity-item">
            <div class="activity-info">
                <h4>${blog.title}</h4>
                <p>${new Date(blog.publishDate).toLocaleDateString()}</p>
            </div>
            <span class="category-badge">${blog.category}</span>
        </div>
    `).join('');
}

function calculateStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    
    return {
        total: blogs.length,
        today: blogs.filter(b => new Date(b.publishDate) >= today).length,
        week: blogs.filter(b => new Date(b.publishDate) >= weekAgo).length,
        month: blogs.filter(b => new Date(b.publishDate) >= monthStart).length,
        year: blogs.filter(b => new Date(b.publishDate) >= yearStart).length
    };
}

// Archive Functions
function renderArchive() {
    const archiveContent = document.getElementById('archiveContent');
    
    // Group blogs by month
    const grouped = {};
    blogs.forEach(blog => {
        const date = new Date(blog.publishDate);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        if (!grouped[key]) {
            grouped[key] = {
                month: monthYear,
                blogs: []
            };
        }
        grouped[key].blogs.push(blog);
    });
    
    // Render grouped blogs
    archiveContent.innerHTML = Object.values(grouped).reverse().map(group => `
        <div class="archive-section">
            <h2>${group.month}</h2>
            ${group.blogs.map(blog => `
                <div class="archive-item" onclick="openBlogModal('${blog.id}')">
                    <div class="archive-item-header">
                        <div>
                            <h3>${blog.title}</h3>
                            <p>${blog.excerpt}</p>
                            <div class="archive-item-meta">
                                <span>${new Date(blog.publishDate).toLocaleDateString()}</span>
                                <span><i class="fas fa-clock"></i> ${blog.readTime}</span>
                                <div class="tags-list">
                                    ${blog.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                                </div>
                            </div>
                        </div>
                        <span class="category-badge">${blog.category}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `).join('');
}

// Update all views
function updateAllViews() {
    if (currentView === 'calendar') renderCalendar();
    if (currentView === 'stats') renderStats();
    if (currentView === 'archive') renderArchive();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('blogModal');
    if (event.target === modal) {
        closeBlogModal();
    }
}

// Tag input enter key handler
document.getElementById('tagInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addTag();
    }
});