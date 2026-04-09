document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginView = document.getElementById('login-view');
    const todoView = document.getElementById('todo-view');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const itemsLeft = document.getElementById('items-left');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    // State
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    let currentFilter = 'all'; // all, active, completed

    // Initialize
    checkAuth();
    
    // Auth Functions
    function checkAuth() {
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        if (isAuthenticated) {
            showView(todoView, loginView);
            renderTodos();
        } else {
            showView(loginView, todoView);
        }
    }

    function login(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (username.trim() && password.trim()) {
            // Mock authentication - accepts any username/password
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('username', username);
            
            // Animation out
            loginView.style.opacity = '0';
            setTimeout(() => {
                showView(todoView, loginView);
                document.getElementById('username').value = '';
                document.getElementById('password').value = '';
                renderTodos();
                showToast('Welcome back, ' + username + '!', 'success');
            }, 300);
        } else {
            showToast('Please enter both username and password.', 'error');
        }
    }

    function logout() {
        todoView.style.opacity = '0';
        setTimeout(() => {
            localStorage.removeItem('isAuthenticated');
            showView(loginView, todoView);
            showToast('Logged out successfully.', 'success');
        }, 300);
    }

    function showView(show, hide) {
        hide.classList.remove('active-view');
        show.classList.add('active-view');
        show.style.opacity = '1'; 
    }

    // Todo Functions
    function addTodo(e) {
        e.preventDefault();
        const text = todoInput.value.trim();
        
        if (text) {
            const newTodo = {
                id: Date.now().toString(),
                text: text,
                completed: false
            };
            
            todos.unshift(newTodo);
            saveTodos();
            renderTodos();
            todoInput.value = '';
            
            // Minimal feedback
            const icon = document.createElement('i');
            icon.className = 'fas fa-check todo-add-feedback';
            icon.style.marginLeft = '5px';
            const btn = document.querySelector('.add-btn');
            btn.appendChild(icon);
            setTimeout(() => icon.remove(), 500);
        }
    }

    function toggleTodo(id) {
        todos = todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, completed: !todo.completed };
            }
            return todo;
        });
        saveTodos();
        renderTodos();
    }

    function deleteTodo(id) {
        todos = todos.filter(todo => todo.id !== id);
        saveTodos();
        renderTodos();
        showToast('Task deleted.', 'success');
    }

    function clearCompleted() {
        const initialLength = todos.length;
        todos = todos.filter(todo => !todo.completed);
        const removed = initialLength - todos.length;
        
        if (removed > 0) {
            saveTodos();
            renderTodos();
            showToast(`${removed} completed tasks cleared.`, 'success');
        }
    }

    function setFilter(e) {
        filterBtns.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.getAttribute('data-filter');
        renderTodos();
    }

    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    function renderTodos() {
        todoList.innerHTML = '';
        
        let filteredTodos = todos;
        if (currentFilter === 'active') {
            filteredTodos = todos.filter(t => !t.completed);
        } else if (currentFilter === 'completed') {
            filteredTodos = todos.filter(t => t.completed);
        }
        
        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} id="check-${todo.id}">
                <label for="check-${todo.id}" class="todo-text">${escapeHtml(todo.text)}</label>
                <button class="delete-btn" data-id="${todo.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            
            // Add events
            const checkbox = li.querySelector('.todo-checkbox');
            checkbox.addEventListener('change', () => toggleTodo(todo.id));
            
            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
            
            todoList.appendChild(li);
        });

        // Update stats
        const activeCount = todos.filter(t => !t.completed).length;
        itemsLeft.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;
        
        // Show/hide clear completed button
        const hasCompleted = todos.some(t => t.completed);
        clearCompletedBtn.style.opacity = hasCompleted ? '1' : '0.5';
        clearCompletedBtn.style.pointerEvents = hasCompleted ? 'auto' : 'none';
        
        if (filteredTodos.length === 0) {
            todoList.innerHTML = `
                <li style="text-align: center; color: var(--text-muted); padding: 20px;">
                    No tasks found.
                </li>
            `;
        }
    }

    // Utilities
    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    function showToast(message, type = 'success') {
        const container = document.getElementById('notification-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        
        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3300);
    }

    // Event Listeners
    loginForm.addEventListener('submit', login);
    logoutBtn.addEventListener('click', logout);
    todoForm.addEventListener('submit', addTodo);
    clearCompletedBtn.addEventListener('click', clearCompleted);
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', setFilter);
    });
});
