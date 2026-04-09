document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const shortenForm = document.getElementById('shorten-form');
    const urlInput = document.getElementById('url-input');
    const inputError = document.getElementById('input-error');
    const loaderOverlay = document.getElementById('loader-overlay');
    
    const resultSection = document.getElementById('result-section');
    const shortUrlDisplay = document.getElementById('short-url-display');
    const copyResultBtn = document.getElementById('copy-result-btn');
    const openResultBtn = document.getElementById('open-result-btn');

    const historyList = document.getElementById('history-list');
    const emptyHistory = document.getElementById('empty-history');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const toastContainer = document.getElementById('toast-container');

    // Current full origin for building short links (e.g., http://127.0.0.1:5500)
    // When running locally from file:// this might just serve as a visual prefix.
    const baseUrl = window.location.origin + window.location.pathname;

    // --- State Management ---
    let urlHistory = JSON.parse(localStorage.getItem('urlShortenerHistory')) || [];

    // --- Initialization ---
    init();

    function init() {
        renderHistory();
        checkAndRedirect();
        
        // Form submission
        shortenForm.addEventListener('submit', handleShorten);
        
        // Clear history
        clearHistoryBtn.addEventListener('click', clearHistory);
        
        // Result copy button
        copyResultBtn.addEventListener('click', () => {
            const code = shortUrlDisplay.getAttribute('data-code');
            const fullShortUrl = `${baseUrl}?code=${code}`;
            copyToClipboard(fullShortUrl);
        });
    }

    // --- Core Logic ---

    // 1. Redirection checking logic
    function checkAndRedirect() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            // Find mapping in history
            const target = urlHistory.find(item => item.code === code);
            
            if (target) {
                // Perform JS redirect
                showToast(`Redirecting to original URL...`, 'success', 'fa-solid fa-spinner fa-spin');
                setTimeout(() => {
                    window.location.href = target.originalUrl;
                }, 1000);
            } else {
                // Invalid code error
                showToast('Invalid or expired short URL.', 'error', 'fa-solid fa-circle-exclamation');
                // Remove parameter from URL without reloading
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }

    // 2. Handle form submission
    function handleShorten(e) {
        e.preventDefault();
        const originalUrl = urlInput.value.trim();

        // Validation
        if (!isValidUrl(originalUrl)) {
            inputError.classList.remove('hidden');
            urlInput.classList.add('error');
            return;
        }

        inputError.classList.add('hidden');
        urlInput.classList.remove('error');

        // Show Loader Simulation
        loaderOverlay.classList.remove('hidden');

        setTimeout(() => {
            // Simulate API delay
            loaderOverlay.classList.add('hidden');
            const shortCode = generateRandomCode();
            
            saveToHistory(originalUrl, shortCode);
            showResult(shortCode);
            renderHistory();
            
            urlInput.value = ''; // clear input
            showToast('URL shortened successfully!', 'success', 'fa-solid fa-check');
        }, 800);
    }

    // 3. Validation helper
    function isValidUrl(string) {
        try {
            const newUrl = new URL(string);
            return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
        } catch (err) {
            return false;
        }
    }

    // 4. Generate random 6 characters (alphanumeric)
    function generateRandomCode() {
        const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // 5. Store in localStorage
    function saveToHistory(originalUrl, code) {
        const newItem = {
            id: Date.now().toString(),
            originalUrl: originalUrl,
            code: code,
            createdAt: new Date().toISOString()
        };
        
        // Add to front of array
        urlHistory.unshift(newItem);
        localStorage.setItem('urlShortenerHistory', JSON.stringify(urlHistory));
    }

    function deleteFromHistory(id) {
        urlHistory = urlHistory.filter(item => item.id !== id);
        localStorage.setItem('urlShortenerHistory', JSON.stringify(urlHistory));
        renderHistory();
        showToast('Item deleted from history', 'success', 'fa-solid fa-trash-can');
    }

    function clearHistory() {
        if(confirm('Are you sure you want to clear your entire link history?')) {
            urlHistory = [];
            localStorage.removeItem('urlShortenerHistory');
            renderHistory();
            resultSection.classList.add('hidden');
            showToast('History cleared', 'success', 'fa-solid fa-broom');
        }
    }

    // --- UI/Rendering Logic ---

    function showResult(code) {
        const fullShortUrl = `${baseUrl}?code=${code}`;
        // display format for aesthetics
        const displayUrl = `short.ly/${code}`; 
        
        shortUrlDisplay.textContent = displayUrl;
        shortUrlDisplay.href = fullShortUrl;
        shortUrlDisplay.setAttribute('data-code', code);
        
        openResultBtn.href = fullShortUrl;
        
        resultSection.classList.remove('hidden');
        
        // trigger animation
        resultSection.style.animation = 'none';
        resultSection.offsetHeight; // trigger reflow
        resultSection.style.animation = null;
    }

    function renderHistory() {
        historyList.innerHTML = '';
        
        if (urlHistory.length === 0) {
            emptyHistory.classList.remove('hidden');
            historyList.classList.add('hidden');
            clearHistoryBtn.classList.add('hidden');
        } else {
            emptyHistory.classList.add('hidden');
            historyList.classList.remove('hidden');
            clearHistoryBtn.classList.remove('hidden');
            
            urlHistory.forEach(item => {
                const fullShortUrl = `${baseUrl}?code=${item.code}`;
                const displayShort = `short.ly/${item.code}`;
                
                const li = document.createElement('li');
                li.className = 'history-item';
                li.innerHTML = `
                    <div class="history-urls">
                        <a href="${fullShortUrl}" target="_blank" class="short-url">${displayShort}</a>
                        <span class="history-long-url" title="${item.originalUrl}">${item.originalUrl}</span>
                    </div>
                    <div class="history-actions">
                        <button class="btn icon-btn copy-btn tooltip" data-code="${item.code}" data-tooltip="Copy code">
                            <i class="fa-regular fa-copy"></i>
                        </button>
                        <button class="btn icon-btn danger delete-btn tooltip" data-id="${item.id}" data-tooltip="Delete">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                `;
                
                // Add event listeners to buttons
                li.querySelector('.copy-btn').addEventListener('click', () => {
                    copyToClipboard(fullShortUrl);
                });
                
                li.querySelector('.delete-btn').addEventListener('click', () => {
                    deleteFromHistory(item.id);
                });

                historyList.appendChild(li);
            });
        }
    }

    // --- Utilities ---

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!', 'success', 'fa-regular fa-copy');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            showToast('Failed to copy', 'error', 'fa-solid fa-xmark');
        });
    }

    function showToast(message, type = 'success', iconClass = 'fa-solid fa-circle-info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        toast.innerHTML = `
            <i class="${iconClass}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Remove toast from DOM after animation completes
        setTimeout(() => {
            if(toast.parentElement) toast.remove();
        }, 3000);
    }
});
