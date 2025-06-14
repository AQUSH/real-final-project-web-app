// DOM Elements
const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
const navLinks = document.querySelector('.nav-links');

// Mobile Navigation Toggle
if (mobileNavToggle) {
    mobileNavToggle.addEventListener('click', () => {
        const isExpanded = mobileNavToggle.getAttribute('aria-expanded') === 'true';
        mobileNavToggle.setAttribute('aria-expanded', !isExpanded);
        navLinks.classList.toggle('active');
    });
}

// To-Do List Functionality
class TodoList {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.form = document.getElementById('todoForm');
        this.input = document.getElementById('todoInput');
        this.list = document.getElementById('todoList');
        this.statusFilterBtns = document.querySelectorAll('.filter-btn[data-filter]');
        this.priorityFilterBtns = document.querySelectorAll('.filter-btn[data-priority]');
        this.totalTasksSpan = document.getElementById('totalTasks');
        this.completedTasksSpan = document.getElementById('completedTasks');
        this.currentStatusFilter = 'all';
        this.currentPriorityFilter = 'all';

        if (this.form) {
            this.initializeEventListeners();
            this.renderTodos();
            this.updateStats();
        }
    }

    initializeEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });

        // Status filter buttons
        this.statusFilterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.statusFilterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentStatusFilter = btn.dataset.filter;
                this.renderTodos();
            });
        });

        // Priority filter buttons
        this.priorityFilterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.priorityFilterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentPriorityFilter = btn.dataset.priority;
                this.renderTodos();
            });
        });
    }

    addTodo() {
        const text = this.input.value.trim();
        if (text) {
            // Extract priority and due date from text
            const { cleanText, priority, dueDate } = this.parseInputText(text);
            
            const todo = {
                id: Date.now(),
                text: cleanText,
                completed: false,
                priority,
                dueDate,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };

            this.todos.unshift(todo);
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.input.value = '';
            
            // Show notification
            this.showNotification('Task added successfully!', 'success');
        }
    }

    parseInputText(text) {
        let cleanText = text;
        let priority = 'normal';
        let dueDate = null;

        // Extract priority
        const priorityMatch = text.match(/!(high|medium|low)/i);
        if (priorityMatch) {
            priority = priorityMatch[1].toLowerCase();
            cleanText = cleanText.replace(priorityMatch[0], '').trim();
        }

        // Extract due date (format: @YYYY-MM-DD or @tomorrow or @today)
        const dateMatch = text.match(/@(\d{4}-\d{2}-\d{2}|tomorrow|today|next week)/i);
        if (dateMatch) {
            const dateStr = dateMatch[1].toLowerCase();
            const today = new Date();
            
            switch(dateStr) {
                case 'today':
                    dueDate = today.toISOString().split('T')[0];
                    break;
                case 'tomorrow':
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    dueDate = tomorrow.toISOString().split('T')[0];
                    break;
                case 'next week':
                    const nextWeek = new Date(today);
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    dueDate = nextWeek.toISOString().split('T')[0];
                    break;
                default:
                    dueDate = dateStr;
            }
            cleanText = cleanText.replace(dateMatch[0], '').trim();
        }

        return { cleanText, priority, dueDate };
    }

    toggleTodo(id) {
        this.todos = this.todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, completed: !todo.completed };
            }
            return todo;
        });
        this.saveTodos();
        this.renderTodos();
        this.updateStats();
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveTodos();
        this.renderTodos();
        this.updateStats();
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    getFilteredTodos() {
        return this.todos.filter(todo => {
            // Apply status filter
            const matchesStatus = 
                this.currentStatusFilter === 'all' ? true :
                this.currentStatusFilter === 'active' ? !todo.completed :
                this.currentStatusFilter === 'completed' ? todo.completed : true;

            // Apply priority filter
            const matchesPriority = 
                this.currentPriorityFilter === 'all' ? true :
                todo.priority === this.currentPriorityFilter;

            // Return true only if both filters match
            return matchesStatus && matchesPriority;
        });
    }

    renderTodos() {
        if (!this.list) return;

        const filteredTodos = this.getFilteredTodos();
        
        // Sort todos
        filteredTodos.sort((a, b) => {
            // First by completion status
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
            // Then by due date (if exists)
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            } else if (a.dueDate) {
                return -1;
            } else if (b.dueDate) {
                return 1;
            }
            
            // Then by priority
            const priorityOrder = { high: 1, medium: 2, low: 3, normal: 4 };
            if (a.priority !== b.priority) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            
            // Finally by creation date
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        this.list.innerHTML = '';

        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''} priority-${todo.priority}`;
            
            // Check if task is overdue
            const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;
            if (isOverdue) li.classList.add('overdue');

            const dueDateDisplay = todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : '';
            
            li.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <div class="todo-content">
                    <span class="todo-text ${todo.priority}">${this.escapeHtml(todo.text)}</span>
                    ${todo.dueDate ? `<span class="todo-due-date ${isOverdue ? 'overdue' : ''}">${dueDateDisplay}</span>` : ''}
                    <span class="todo-priority ${todo.priority}">${todo.priority}</span>
                </div>
                <div class="todo-actions">
                    <button class="todo-edit" title="Edit">✏️</button>
                    <button class="todo-delete" title="Delete">🗑️</button>
                </div>
            `;

            const checkbox = li.querySelector('.todo-checkbox');
            const deleteBtn = li.querySelector('.todo-delete');
            const editBtn = li.querySelector('.todo-edit');

            checkbox.addEventListener('change', () => this.toggleTodo(todo.id));
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this task?')) {
                    this.deleteTodo(todo.id);
                }
            });
            editBtn.addEventListener('click', () => this.editTodo(todo));

            this.list.appendChild(li);
        });
    }

    editTodo(todo) {
        const newText = prompt('Edit task:', todo.text);
        if (newText !== null && newText.trim() !== '') {
            const { cleanText, priority, dueDate } = this.parseInputText(newText);
            
            this.todos = this.todos.map(t => {
                if (t.id === todo.id) {
                    return {
                        ...t,
                        text: cleanText,
                        priority: priority || t.priority,
                        dueDate: dueDate || t.dueDate,
                        lastModified: new Date().toISOString()
                    };
                }
                return t;
            });
            
            this.saveTodos();
            this.renderTodos();
            this.showNotification('Task updated successfully!', 'success');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    updateStats() {
        if (this.totalTasksSpan && this.completedTasksSpan) {
            const total = this.todos.length;
            const completed = this.todos.filter(todo => todo.completed).length;
            const overdue = this.todos.filter(todo => 
                todo.dueDate && 
                new Date(todo.dueDate) < new Date() && 
                !todo.completed
            ).length;
            
            this.totalTasksSpan.textContent = total;
            this.completedTasksSpan.textContent = `${completed} (${overdue} overdue)`;
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/"/g, '"')
            .replace(/'/g, '&#039;');
    }
}

// Initialize Todo List
document.addEventListener('DOMContentLoaded', () => {
    new TodoList();
});
