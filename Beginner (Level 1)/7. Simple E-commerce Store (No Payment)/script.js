// ---- DATA CONFIGURATION ----
const CATEGORIES = ['Electronics', 'Fashion', 'Books', 'Home & Kitchen', 'Sports', 'Beauty'];
const ADJECTIVES = ['Premium', 'Pro', 'Classic', 'Ultra', 'Smart', 'Elite', 'Eco', 'Advanced', 'Essential', 'Luxury'];
const NOUNS = {
    'Electronics': ['Smartphone', 'Laptop', 'Headphones', 'Tablet', 'Camera', 'Monitor', 'Keyboard', 'Speaker'],
    'Fashion': ['T-Shirt', 'Jacket', 'Sneakers', 'Watch', 'Sunglasses', 'Jeans', 'Backpack', 'Dress'],
    'Books': ['Novel', 'Guide', 'Biography', 'Textbook', 'Cookbook', 'Journal', 'Dictionary', 'Comic'],
    'Home & Kitchen': ['Blender', 'Coffee Maker', 'Lamp', 'Pillow', 'Vase', 'Pan', 'Mixer', 'Rug'],
    'Sports': ['Football', 'Yoga Mat', 'Dumbbells', 'Tennis Racket', 'Water Bottle', 'Resistance Bands', 'Backpack', 'Helmet'],
    'Beauty': ['Lipstick', 'Perfume', 'Lotion', 'Serum', 'Mascara', 'Foundation', 'Brush Set', 'Shampoo']
};

const NOUN_IMAGES = {
    'Smartphone': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80',
    'Laptop': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80',
    'Headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    'Tablet': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80',
    'Camera': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80',
    'Monitor': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&q=80',
    'Keyboard': 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=400&q=80',
    'Speaker': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80',

    'T-Shirt': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
    'Jacket': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80',
    'Sneakers': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
    'Watch': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
    'Sunglasses': 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80',
    'Jeans': 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80',
    'Backpack': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80',
    'Dress': 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&q=80',

    'Novel': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80',
    'Guide': 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&q=80',
    'Biography': 'https://images.unsplash.com/photo-1455390582262-044cdead27d8?w=400&q=80',
    'Textbook': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80',
    'Cookbook': 'https://images.unsplash.com/photo-1589923188900-85dae5243405?w=400&q=80',
    'Journal': 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400&q=80',
    'Dictionary': 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&q=80',
    'Comic': 'https://images.unsplash.com/photo-1612036782180-6f0b6ce846ce?w=400&q=80',

    'Blender': 'https://images.unsplash.com/photo-1585237887754-046654e9bc35?w=400&q=80',
    'Coffee Maker': 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba1?w=400&q=80',
    'Lamp': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80',
    'Pillow': 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400&q=80',
    'Vase': 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400&q=80',
    'Pan': 'https://images.unsplash.com/photo-1584990347449-b541d4c28135?w=400&q=80',
    'Mixer': 'https://images.unsplash.com/photo-1594246830501-1b6fb89140d3?w=400&q=80',
    'Rug': 'https://images.unsplash.com/photo-1534889156217-d643df14f14a?w=400&q=80',

    'Football': 'https://images.unsplash.com/photo-1614632537190-23e4146777db?w=400&q=80',
    'Yoga Mat': 'https://images.unsplash.com/photo-1601121853354-e6e866bd2ccc?w=400&q=80',
    'Dumbbells': 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80',
    'Tennis Racket': 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=400&q=80',
    'Water Bottle': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80',
    'Resistance Bands': 'https://images.unsplash.com/photo-1598266663439-2056e6900339?w=400&q=80',
    'Helmet': 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&q=80',

    'Lipstick': 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&q=80',
    'Perfume': 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&q=80',
    'Lotion': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80',
    'Serum': 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80',
    'Mascara': 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=400&q=80',
    'Foundation': 'https://images.unsplash.com/photo-1599305090598-fe179d501227?w=400&q=80',
    'Brush Set': 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400&q=80',
    'Shampoo': 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&q=80'
};

// ---- STATE ----
let allProducts = [];
let filteredProducts = [];
let cart = JSON.parse(localStorage.getItem('nexshop_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('nexshop_wishlist')) || [];

let currentCategory = 'All';
let searchQuery = '';
let priceMin = null;
let priceMax = null;
let minRating = 0;
let currentSort = 'featured';

let currentPage = 1;
const ITEMS_PER_PAGE = 20;

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
    generateData();
    populateCategories();
    setupEventListeners();
    updateCartCount();
    updateWishlistCount();
    applyFilters(); // Initial render
});

// ---- DATA GENERATION ----
function generateData() {
    let idCounter = 1;
    CATEGORIES.forEach(category => {
        for (let i = 0; i < 100; i++) {
            const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
            const noun = NOUNS[category][Math.floor(Math.random() * NOUNS[category].length)];
            const name = `${adj} ${noun} ${idCounter}`;
            // Random price between ₹199 and ₹15,999
            const price = parseFloat((Math.random() * 15800 + 199).toFixed(2));
            // Random rating between 2.5 and 5.0
            const rating = parseFloat((Math.random() * 2.5 + 2.5).toFixed(1));
            // Stock between 0 and 50
            const stock = Math.floor(Math.random() * 51);

            // Assign highly specific Unsplash images based on the item noun
            const imgUrl = NOUN_IMAGES[noun] || `https://placehold.co/400x400/f8fafc/475569?text=${encodeURIComponent(noun)}`;

            allProducts.push({
                id: idCounter,
                name,
                category,
                price,
                rating,
                stock,
                image: imgUrl,
                description: `Experience the finest quality with our ${name}. Carefully crafted for optimal performance and durability. Perfect for your daily needs, offering outstanding value in the ${category} collection.`
            });
            idCounter++;
        }
    });
}

// ---- UI RENDERING ----
function populateCategories() {
    const list = document.getElementById('categoryList');
    CATEGORIES.forEach(cat => {
        const li = document.createElement('li');
        li.innerHTML = `<button class="category-btn" data-category="${cat}">${cat}</button>`;
        list.appendChild(li);
    });

    // Add event listeners to category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.dataset.category;
            currentPage = 1;
            applyFilters();
        });
    });
}

function renderProducts() {
    const grid = document.getElementById('productGrid');
    const emptyState = document.getElementById('emptyState');
    const productCount = document.getElementById('productCount');
    const sectionTitle = document.getElementById('productSectionTitle');

    grid.innerHTML = '';

    if (filteredProducts.length === 0) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        productCount.textContent = 'Showing 0 results';
        renderPagination();
        return;
    }

    grid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    // Title
    sectionTitle.textContent = currentCategory === 'All' ? 'All Products' : currentCategory;

    // Pagination slicing
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    productCount.textContent = `Showing ${startIndex + 1}-${Math.min(endIndex, filteredProducts.length)} of ${filteredProducts.length} results`;

    paginatedProducts.forEach(product => {
        const isWishlisted = wishlist.includes(product.id);
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="card-img-wrap" onclick="openProductModal(${product.id})">
                <img src="${product.image}" loading="lazy" alt="${product.name}">
            </div>
            <button class="card-wishlist ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist(${product.id}, event)" aria-label="Add to wishlist">
                <i class='bx ${isWishlisted ? 'bxs-heart' : 'bx-heart'}'></i>
            </button>
            <div class="card-body">
                <div class="card-category">${product.category}</div>
                <div class="card-title" onclick="openProductModal(${product.id})">${product.name}</div>
                <div class="card-rating">
                    ${getStarHtml(product.rating)} <span>(${product.rating})</span>
                </div>
                <div class="card-price-row">
                    <div class="card-price">₹${product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <button class="add-to-cart-sq" onclick="addToCart(${product.id})" aria-label="Add to cart">
                        <i class='bx bx-plus'></i>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    renderPagination();
}

function renderPagination() {
    const controls = document.getElementById('paginationControls');
    controls.innerHTML = '';

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    if (totalPages <= 1) return;

    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = "<i class='bx bx-chevron-left'></i>";
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => { currentPage--; renderProducts(); window.scrollTo({ top: document.getElementById('mainContent').offsetTop - 80, behavior: 'smooth' }); };
    controls.appendChild(prevBtn);

    // Page Numbers (simplified, max 5 pages shown)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    if (startPage > 1) {
        controls.innerHTML += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) controls.innerHTML += `<span>...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.onclick = () => goToPage(i);
        controls.appendChild(btn);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) controls.innerHTML += `<span>...</span>`;
        controls.innerHTML += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = "<i class='bx bx-chevron-right'></i>";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => { currentPage++; renderProducts(); window.scrollTo({ top: document.getElementById('mainContent').offsetTop - 80, behavior: 'smooth' }); };
    controls.appendChild(nextBtn);
}

function goToPage(page) {
    currentPage = page;
    renderProducts();
    window.scrollTo({ top: document.getElementById('mainContent').offsetTop - 80, behavior: 'smooth' });
}

function getStarHtml(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (rating >= i) html += "<i class='bx bxs-star'></i>";
        else if (rating >= i - 0.5) html += "<i class='bx bxs-star-half'></i>";
        else html += "<i class='bx bx-star'></i>";
    }
    return html;
}

// ---- FILTERING & SORTING ----
function applyFilters() {
    filteredProducts = allProducts.filter(p => {
        // Category
        if (currentCategory !== 'All' && p.category !== currentCategory) return false;

        // Search
        if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        // Price
        if (priceMin !== null && p.price < priceMin) return false;
        if (priceMax !== null && p.price > priceMax) return false;

        // Rating
        if (p.rating < minRating) return false;

        return true;
    });

    // Sorting
    if (currentSort === 'price-low') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'price-high') {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (currentSort === 'rating') {
        filteredProducts.sort((a, b) => b.rating - a.rating);
    } else {
        // Featured: default random sort based on ID or we can just sort by rating but lightly randomized
        // We'll leave original generation order as "Featured"
    }

    renderProducts();
}

function setupEventListeners() {
    // Desktop Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        currentPage = 1;
        applyFilters();
    });

    // Mobile Search
    document.getElementById('mobileSearchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        currentPage = 1;
        applyFilters();
    });

    // Price Filters
    document.getElementById('minPrice').addEventListener('input', (e) => {
        priceMin = e.target.value ? parseFloat(e.target.value) : null;
    });
    document.getElementById('maxPrice').addEventListener('input', (e) => {
        priceMax = e.target.value ? parseFloat(e.target.value) : null;
    });
    document.getElementById('applyFiltersBtn').addEventListener('click', () => {
        currentPage = 1;
        applyFilters();
    });

    // Rating Filter
    document.querySelectorAll('input[name="rating"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            minRating = parseFloat(e.target.value);
            currentPage = 1;
            applyFilters();
        });
    });

    // Sorting
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        currentSort = e.target.value;
        currentPage = 1;
        applyFilters();
    });

    // Clear Filters
    document.getElementById('clearFiltersBtn').addEventListener('click', () => {
        document.getElementById('minPrice').value = '';
        document.getElementById('maxPrice').value = '';
        document.getElementById('searchInput').value = '';
        document.getElementById('mobileSearchInput').value = '';
        document.querySelector('input[name="rating"][value="0"]').checked = true;
        document.getElementById('sortSelect').value = 'featured';
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.category-btn[data-category="All"]').classList.add('active');

        currentCategory = 'All';
        searchQuery = '';
        priceMin = null;
        priceMax = null;
        minRating = 0;
        currentSort = 'featured';
        currentPage = 1;
        applyFilters();
    });

    // Modals Handling
    document.getElementById('cartBtn').addEventListener('click', openCartModal);
    document.getElementById('closeCartBtn').addEventListener('click', () => closeAllModals());
    document.getElementById('wishlistBtn').addEventListener('click', openWishlistModal);
    document.getElementById('closeWishlistBtn').addEventListener('click', () => closeAllModals());
    document.getElementById('closeProductBtn').addEventListener('click', () => closeAllModals());
    document.getElementById('closeCheckoutBtn').addEventListener('click', () => closeAllModals());

    document.getElementById('startShoppingBtn').addEventListener('click', () => closeAllModals());

    // Overlay click to close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeAllModals();
        });
    });

    // Checkout Flow
    document.getElementById('checkoutFlowBtn').addEventListener('click', () => {
        closeAllModals();
        if (cart.length === 0) return showToast('Cart is empty', 'error');
        openCheckoutModal();
    });

    document.getElementById('checkoutForm').addEventListener('submit', handleCheckout);
    document.getElementById('continueShoppingBtn').addEventListener('click', () => {
        closeAllModals();
        document.getElementById('checkoutForm').classList.remove('hidden');
        document.getElementById('orderSuccess').classList.add('hidden');
        document.getElementById('checkoutForm').reset();
    });
}

function closeAllModals() {
    document.getElementById('cartModal').classList.add('hidden');
    document.getElementById('productModal').classList.add('hidden');
    document.getElementById('checkoutModal').classList.add('hidden');
    document.getElementById('wishlistModal').classList.add('hidden');
}

// ---- CART SYSTEM ----
function addToCart(productId, qty = 1) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
        showToast('Out of stock!', 'error');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        if (existingItem.qty + qty > product.stock) {
            showToast('Cannot add more than available stock', 'error');
            return;
        }
        existingItem.qty += qty;
    } else {
        cart.push({ ...product, qty });
    }

    saveCart();
    updateCartCount();
    showToast(`${product.name} added to cart!`);
}

function updateCartQty(productId, delta) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        const item = cart[itemIndex];
        const product = allProducts.find(p => p.id === productId);

        let newQty = item.qty + delta;
        if (newQty > product.stock) {
            showToast('Max stock reached', 'error');
            return;
        }
        if (newQty < 1) newQty = 1;

        item.qty = newQty;
        saveCart();
        renderCartItems();
        updateCartCount();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCartItems();
    updateCartCount();
    showToast('Item removed from cart');
}

function saveCart() {
    localStorage.setItem('nexshop_cart', JSON.stringify(cart));
}

function updateCartCount() {
    const badge = document.getElementById('cartBadge');
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    badge.textContent = count;
    if (count > 0) badge.classList.remove('hidden');
    else badge.classList.add('hidden');
}

function openCartModal() {
    closeAllModals();
    renderCartItems();
    document.getElementById('cartModal').classList.remove('hidden');
}

function renderCartItems() {
    const container = document.getElementById('cartItemsContainer');
    const emptyState = document.getElementById('cartEmptyState');
    const footer = document.getElementById('cartFooter');

    container.innerHTML = '';

    if (cart.length === 0) {
        emptyState.classList.remove('hidden');
        footer.classList.add('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    footer.classList.remove('hidden');

    let total = 0;

    cart.forEach(item => {
        total += item.price * item.qty;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">₹${item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div class="cart-item-actions">
                    <div class="qty-ctrl">
                        <button onclick="updateCartQty(${item.id}, -1)">-</button>
                        <span>${item.qty}</span>
                        <button onclick="updateCartQty(${item.id}, 1)">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})"><i class='bx bx-trash'></i></button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });

    document.getElementById('cartTotal').textContent = `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---- WISHLIST SYSTEM ----
function toggleWishlist(productId, event) {
    if (event) event.stopPropagation(); // prevent opening product modal if clicking from card

    const index = wishlist.indexOf(productId);
    if (index > -1) {
        wishlist.splice(index, 1);
        showToast('Removed from wishlist');
    } else {
        wishlist.push(productId);
        showToast('Added to wishlist');
    }

    localStorage.setItem('nexshop_wishlist', JSON.stringify(wishlist));
    updateWishlistCount();

    // Re-render to update heart icons
    // Small optimization: just toggle class if we're on the grid, but re-render is safer
    renderProducts();

    // If wishlist modal is open, re-render it
    if (!document.getElementById('wishlistModal').classList.contains('hidden')) {
        renderWishlistItems();
    }
}

function updateWishlistCount() {
    const badge = document.getElementById('wishlistBadge');
    badge.textContent = wishlist.length;
    if (wishlist.length > 0) badge.classList.remove('hidden');
    else badge.classList.add('hidden');
}

function openWishlistModal() {
    closeAllModals();
    renderWishlistItems();
    document.getElementById('wishlistModal').classList.remove('hidden');
}

function renderWishlistItems() {
    const container = document.getElementById('wishlistItemsContainer');
    const emptyState = document.getElementById('wishlistEmptyState');

    container.innerHTML = '';

    if (wishlist.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    wishlist.forEach(id => {
        const item = allProducts.find(p => p.id === id);
        if (!item) return;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-img" onclick="openProductModal(${item.id})" style="cursor:pointer">
            <div class="cart-item-details">
                <div class="cart-item-title" onclick="openProductModal(${item.id})" style="cursor:pointer">${item.name}</div>
                <div class="cart-item-price">₹${item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div class="cart-item-actions">
                    <button class="primary-btn" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="addToCart(${item.id})">Add to Cart</button>
                    <button class="remove-btn" onclick="toggleWishlist(${item.id})"><i class='bx bx-trash'></i></button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}


// ---- PRODUCT DETAILS MODAL ----
function openProductModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const content = document.getElementById('productDetailsContent');
    const isWishlisted = wishlist.includes(product.id);

    let stockStatus = `<span class="prod-stock">In Stock (${product.stock})</span>`;
    let canAdd = true;
    if (product.stock === 0) {
        stockStatus = `<span class="prod-stock out">Out of Stock</span>`;
        canAdd = false;
    } else if (product.stock < 10) {
        stockStatus = `<span class="prod-stock low">Only ${product.stock} left in stock</span>`;
    }

    content.innerHTML = `
        <div class="prod-details-layout">
            <div class="prod-details-img">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="prod-details-info">
                <div class="prod-details-cat">${product.category}</div>
                <h1 class="prod-details-title">${product.name}</h1>
                <div class="card-rating" style="font-size: 1.1rem; margin-bottom: 1.5rem">
                    ${getStarHtml(product.rating)} <span style="font-size: 0.9rem">(${product.rating} rating)</span>
                </div>
                <div class="prod-details-price">₹${product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                ${stockStatus}
                <p class="prod-details-desc">${product.description}</p>
                
                <div class="prod-action-row">
                    <button class="primary-btn" ${canAdd ? '' : 'disabled style="opacity:0.5;cursor:not-allowed"'} onclick="addToCart(${product.id})">
                        <i class='bx bx-cart-add'></i> Add to Cart
                    </button>
                    <button class="outline-btn" style="padding: 0 1rem; color: ${isWishlisted ? '#ef4444' : 'var(--text-main)'}" onclick="toggleWishlist(${product.id}); openProductModal(${product.id})">
                        <i class='bx ${isWishlisted ? 'bxs-heart' : 'bx-heart'}'></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    closeAllModals();
    document.getElementById('productModal').classList.remove('hidden');
}


// ---- CHECKOUT SYSTEM ----
function openCheckoutModal() {
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    document.getElementById('checkoutTotalAmount').textContent = `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('checkoutModal').classList.remove('hidden');
}

function handleCheckout(e) {
    e.preventDefault();

    // Simulate API call / processing
    const form = document.getElementById('checkoutForm');
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Processing...";
    btn.disabled = true;

    setTimeout(() => {
        // Clear cart
        cart = [];
        saveCart();
        updateCartCount();

        // Show success message
        form.classList.add('hidden');
        document.getElementById('orderSuccess').classList.remove('hidden');

        btn.innerHTML = originalText;
        btn.disabled = false;
    }, 1500);
}


// ---- TOAST NOTIFICATIONS ----
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? 'bx-check-circle' : 'bx-error-circle';

    toast.innerHTML = `
        <i class='bx ${icon}'></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300); // Wait for transition
    }, 3000);
}
