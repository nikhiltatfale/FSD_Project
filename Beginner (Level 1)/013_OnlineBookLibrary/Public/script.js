// Mock Data
const booksData = [
    {
        id: 1,
        title: "The Silent Echo",
        author: "Sarah Jenkins",
        category: "fiction",
        cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=500&q=80",
        description: "A masterful tale of mystery and suspense set in a quiet coastal town where nothing is as it seems.",
        available: true
    },
    {
        id: 2,
        title: "Quantum Reality",
        author: "Dr. Alan Turing",
        category: "science",
        cover: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=500&q=80",
        description: "Explore the fascinating world of quantum mechanics and what it means for our understanding of reality.",
        available: true
    },
    {
        id: 3,
        title: "Empire Falls",
        author: "Marcus Aurelius",
        category: "history",
        cover: "https://images.unsplash.com/photo-1461301214746-1e109215d6d3?auto=format&fit=crop&w=500&q=80",
        description: "A comprehensive look at the rise and fall of the greatest empires in human history.",
        available: false
    },
    {
        id: 4,
        title: "The Last Horizon",
        author: "Emily Chen",
        category: "fiction",
        cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=500&q=80",
        description: "An epic science fiction adventure across the stars, following humanity's search for a new home.",
        available: true
    },
    {
        id: 5,
        title: "Brain Plasticity",
        author: "Neuro Science",
        category: "science",
        cover: "https://images.unsplash.com/photo-1559757175-9989cb21f68e?auto=format&fit=crop&w=500&q=80",
        description: "How our brains change and adapt throughout our lives.",
        available: true
    },
    {
        id: 6,
        title: "World War II",
        author: "Winston Churchill",
        category: "history",
        cover: "https://images.unsplash.com/photo-1447069387366-2a34706dc7c2?auto=format&fit=crop&w=500&q=80",
        description: "The definitive chronicle of the second world war, told by those who lived it.",
        available: true
    }
];

// State
let borrowedBooks = JSON.parse(localStorage.getItem('cloudLibrary_borrowed')) || [];

// Sync mock data availability with local storage
borrowedBooks.forEach(id => {
    const book = booksData.find(b => b.id === id);
    if(book) book.available = false;
});

// DOM Elements
const bookGrid = document.getElementById('bookGrid');
const borrowedGrid = document.getElementById('borrowedGrid');
const filterBtns = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const navLinks = document.querySelectorAll('.nav-links a');
const catalogSection = document.getElementById('catalog');
const myBooksSection = document.getElementById('my-books');
const modal = document.getElementById('bookModal');
const closeBtn = document.querySelector('.close-btn');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinksContainer = document.querySelector('.nav-links');

// Notification Helper
function showNotification(message) {
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.innerHTML = message;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translateX(100%)';
        notif.style.transition = 'all 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// Initialization
function init() {
    renderBooks(booksData, bookGrid);
    renderBorrowedBooks();
    setupEventListeners();
}

// Render Books
function renderBooks(books, container, isBorrowed = false) {
    container.innerHTML = '';
    
    if (books.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--gray); font-size: 1.1rem;">No books found matching your criteria.</p>`;
        return;
    }

    books.forEach(book => {
        const isUserBorrowed = borrowedBooks.includes(book.id);
        const card = document.createElement('div');
        card.className = 'book-card';
        card.innerHTML = `
            <div class="book-tag">${book.category.toUpperCase()}</div>
            <img src="${book.cover}" alt="${book.title}" class="book-cover">
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">By ${book.author}</p>
                <div class="actions">
                    <button class="btn btn-view" onclick="viewBook(${book.id})">Details</button>
                    ${isBorrowed 
                        ? `<button class="btn btn-outline" onclick="returnBook(${book.id})">Return</button>`
                        : `<button class="btn ${book.available ? 'btn-primary' : 'btn-outline'}" 
                             ${!book.available && !isUserBorrowed ? 'disabled' : ''} 
                             onclick="${isUserBorrowed ? `returnBook(${book.id})` : `borrowBook(${book.id})`}">
                             ${isUserBorrowed ? 'Return' : (book.available ? 'Borrow' : 'Unavailable')}
                           </button>`
                    }
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Render Borrowed Books
function renderBorrowedBooks() {
    const borrowed = booksData.filter(book => borrowedBooks.includes(book.id));
    renderBooks(borrowed, borrowedGrid, true);
    
    if(borrowedBooks.length === 0) {
        borrowedGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; background: var(--white); border-radius: var(--radius); box-shadow: var(--shadow);">
                <i class="fa-solid fa-book-open" style="font-size: 3rem; color: var(--gray); margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3 style="color: var(--dark); margin-bottom: 0.5rem;">No Borrowed Books Iter</h3>
                <p style="color: var(--gray);">You haven't borrowed any books yet. Head over to the catalog to find your next great read!</p>
                <button class="btn btn-primary" style="margin-top: 1.5rem;" onclick="document.querySelector('[data-target=catalog]').click()">Browse Catalog</button>
            </div>
        `;
    }
}

// Event Listeners
function setupEventListeners() {
    // Categories Filter
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const filter = e.target.getAttribute('data-filter');
            if (filter === 'all') {
                renderBooks(booksData, bookGrid);
            } else {
                const filtered = booksData.filter(b => b.category === filter);
                renderBooks(filtered, bookGrid);
            }
        });
    });

    // Search
    const performSearch = () => {
        const query = searchInput.value.toLowerCase().trim();
        const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
        
        let filtered = booksData;
        if(activeFilter !== 'all') {
            filtered = filtered.filter(b => b.category === activeFilter);
        }
        
        if(query) {
            filtered = filtered.filter(b => 
                b.title.toLowerCase().includes(query) || 
                b.author.toLowerCase().includes(query)
            );
        }
        
        renderBooks(filtered, bookGrid);
        document.getElementById('catalog').scrollIntoView({behavior: 'smooth'});
    };

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Navigation and Routing
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('data-target');
            
            navLinks.forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
            
            if(navLinksContainer.classList.contains('active')) {
                navLinksContainer.classList.remove('active');
            }

            if (target === 'my-books') {
                catalogSection.style.display = 'none';
                myBooksSection.style.display = 'block';
                document.querySelector('.hero').style.display = 'none';
                renderBorrowedBooks();
                window.scrollTo({top: 0, behavior: 'smooth'});
            } else if (target === 'catalog') {
                catalogSection.style.display = 'block';
                myBooksSection.style.display = 'none';
                document.querySelector('.hero').style.display = 'flex';
                document.getElementById('catalog').scrollIntoView({behavior: 'smooth'});
            } else {
                // Home
                catalogSection.style.display = 'block';
                myBooksSection.style.display = 'none';
                document.querySelector('.hero').style.display = 'flex';
                window.scrollTo({top: 0, behavior: 'smooth'});
            }
        });
    });
    
    // Mobile menu toggle
    mobileMenuBtn.addEventListener('click', () => {
        navLinksContainer.classList.toggle('active');
    });

    // Modal Close
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Actions globally available
window.viewBook = (id) => {
    const book = booksData.find(b => b.id === id);
    const isBorrowed = borrowedBooks.includes(id);
    const modalDetails = document.getElementById('modalDetails');
    
    modalDetails.innerHTML = `
        <img src="${book.cover}" alt="${book.title}" class="modal-cover">
        <div class="modal-info">
            <div class="status-badge ${book.available ? 'status-available' : 'status-borrowed'}">
                <i class="fa-solid ${book.available ? 'fa-check-circle' : 'fa-times-circle'}"></i> 
                ${book.available ? 'Available Now' : 'Currently Unavailable'}
            </div>
            <h3>${book.title}</h3>
            <h4>By ${book.author}</h4>
            <div style="margin-bottom: 1.5rem;">
                <span style="background: var(--light); padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; color: var(--gray);">
                    Category: ${book.category.toUpperCase()}
                </span>
            </div>
            <p class="modal-desc">${book.description}</p>
            <div style="margin-top: 2rem;">
                ${isBorrowed 
                    ? `<button class="btn btn-outline" style="padding: 0.8rem 2rem; font-size: 1.05rem;" onclick="returnBook(${book.id}); modal.style.display='none'">Return Book</button>`
                    : `<button class="btn ${book.available ? 'btn-primary' : 'btn-outline'}" 
                         style="padding: 0.8rem 2rem; font-size: 1.05rem;"
                         ${!book.available ? 'disabled' : ''} 
                         onclick="borrowBook(${book.id}); modal.style.display='none'">
                         ${book.available ? 'Borrow Book Now' : 'Join Waitlist'}
                       </button>`
                }
            </div>
        </div>
    `;
    modal.style.display = 'flex';
};

window.borrowBook = (id) => {
    const book = booksData.find(b => b.id === id);
    if (!book.available) return;
    
    if (!borrowedBooks.includes(id)) {
        borrowedBooks.push(id);
        book.available = false;
        localStorage.setItem('cloudLibrary_borrowed', JSON.stringify(borrowedBooks));
        
        // Refresh catalog view seamlessly
        const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
        let filtered = booksData;
        if(activeFilter !== 'all') {
            filtered = booksData.filter(b => b.category === activeFilter);
        }
        renderBooks(filtered, bookGrid);
        
        // If in my-books view, refresh it too
        if(myBooksSection.style.display === 'block'){
            renderBorrowedBooks();
        }
        
        showNotification(`<i class="fa-solid fa-check-circle" style="color: var(--secondary); margin-right: 8px;"></i> Successfully borrowed "<strong>${book.title}</strong>"`);
    }
};

window.returnBook = (id) => {
    borrowedBooks = borrowedBooks.filter(bookId => bookId !== id);
    localStorage.setItem('cloudLibrary_borrowed', JSON.stringify(borrowedBooks));
    
    const book = booksData.find(b => b.id === id);
    if (book) book.available = true;

    // Refresh views
    const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
    let filtered = booksData;
    if(activeFilter !== 'all') {
        filtered = booksData.filter(b => b.category === activeFilter);
    }
    renderBooks(filtered, bookGrid);
    
    if(myBooksSection.style.display === 'block'){
        renderBorrowedBooks();
    }
    
    showNotification(`<i class="fa-solid fa-info-circle" style="color: var(--primary); margin-right: 8px;"></i> Returned "<strong>${book.title}</strong>"`);
};

// Fire App
init();
