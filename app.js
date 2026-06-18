// API Configuration
const API_URL = 'http://localhost:3000/api';

// ==================== BOOK MANAGEMENT ====================

// Load books on page load
async function loadBooks() {
    try {
        const response = await fetch(`${API_URL}/books`);
        const books = await response.json();
        displayBooks(books);
    } catch (error) {
        console.error('Error loading books:', error);
        showAlert('Error loading books. Make sure the server is running.', 'error');
    }
}

// Display books in table
function displayBooks(books) {
    const tbody = document.querySelector('#booksTable tbody');
    tbody.innerHTML = '';

    if (books.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No books found</td></tr>';
        return;
    }

    books.forEach(book => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${book.id}</td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.isbn || 'N/A'}</td>
            <td>${book.quantity}</td>
            <td>
                <span class="status-badge status-${book.status.toLowerCase()}">
                    ${book.status}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editBook(${book.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteBook(${book.id})">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Add new book
async function addBook() {
    const title = document.querySelector('#bookTitle').value.trim();
    const author = document.querySelector('#bookAuthor').value.trim();
    const isbn = document.querySelector('#bookISBN').value.trim();
    const quantity = parseInt(document.querySelector('#bookQuantity').value) || 1;

    if (!title || !author) {
        showAlert('Title and Author are required!', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/books`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, author, isbn, quantity })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Book added successfully!', 'success');
            document.querySelector('#bookForm').reset();
            loadBooks();
        } else {
            showAlert(data.error || 'Error adding book', 'error');
        }
    } catch (error) {
        console.error('Error adding book:', error);
        showAlert('Error adding book. Make sure the server is running.', 'error');
    }
}

// Delete book
async function deleteBook(id) {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
        const response = await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' });
        const data = await response.json();

        if (response.ok) {
            showAlert('Book deleted successfully!', 'success');
            loadBooks();
        } else {
            showAlert(data.error || 'Error deleting book', 'error');
        }
    } catch (error) {
        console.error('Error deleting book:', error);
        showAlert('Error deleting book. Make sure the server is running.', 'error');
    }
}

// Edit book (placeholder)
function editBook(id) {
    showAlert('Edit feature coming soon!', 'info');
}

// ==================== MEMBER MANAGEMENT ====================

// Load members on page load
async function loadMembers() {
    try {
        const response = await fetch(`${API_URL}/members`);
        const members = await response.json();
        displayMembers(members);
    } catch (error) {
        console.error('Error loading members:', error);
        showAlert('Error loading members. Make sure the server is running.', 'error');
    }
}

// Display members in table
function displayMembers(members) {
    const tbody = document.querySelector('#membersTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (members.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No members found</td></tr>';
        return;
    }

    members.forEach(member => {
        const row = document.createElement('tr');
        const joinDate = new Date(member.membership_date).toLocaleDateString();
        row.innerHTML = `
            <td>${member.id}</td>
            <td>${member.name}</td>
            <td>${member.email}</td>
            <td>${member.phone || 'N/A'}</td>
            <td>${joinDate}</td>
        `;
        tbody.appendChild(row);
    });
}

// Add new member
async function addMember() {
    const name = document.querySelector('#memberName').value.trim();
    const email = document.querySelector('#memberEmail').value.trim();
    const phone = document.querySelector('#memberPhone').value.trim();

    if (!name || !email) {
        showAlert('Name and Email are required!', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Member added successfully!', 'success');
            document.querySelector('#memberForm').reset();
            loadMembers();
        } else {
            showAlert(data.error || 'Error adding member', 'error');
        }
    } catch (error) {
        console.error('Error adding member:', error);
        showAlert('Error adding member. Make sure the server is running.', 'error');
    }
}

// ==================== ISSUE MANAGEMENT ====================

// Load issues on page load
async function loadIssues() {
    try {
        const response = await fetch(`${API_URL}/issues`);
        const issues = await response.json();
        displayIssues(issues);
    } catch (error) {
        console.error('Error loading issues:', error);
        showAlert('Error loading issues. Make sure the server is running.', 'error');
    }
}

// Display issues in table
function displayIssues(issues) {
    const tbody = document.querySelector('#issuesTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (issues.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No issues found</td></tr>';
        return;
    }

    issues.forEach(issue => {
        const row = document.createElement('tr');
        const issueDate = new Date(issue.issue_date).toLocaleDateString();
        const returnDate = issue.return_date ? new Date(issue.return_date).toLocaleDateString() : 'N/A';
        
        row.innerHTML = `
            <td>${issue.id}</td>
            <td>${issue.title || 'N/A'}</td>
            <td>${issue.name || 'N/A'}</td>
            <td>${issueDate}</td>
            <td>${returnDate}</td>
            <td><span class="status-badge status-${issue.status.toLowerCase()}">${issue.status}</span></td>
            <td>
                ${issue.status === 'Issued' ? `<button class="btn-edit" onclick="returnBook(${issue.id})">Return</button>` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Issue a book
async function issueBook() {
    const bookId = document.querySelector('#issueBookId').value;
    const memberId = document.querySelector('#issueMemberId').value;

    if (!bookId || !memberId) {
        showAlert('Please select both book and member!', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/issues`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ book_id: parseInt(bookId), member_id: parseInt(memberId) })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Book issued successfully!', 'success');
            document.querySelector('#issueForm').reset();
            loadIssues();
            loadBooks();
        } else {
            showAlert(data.error || 'Error issuing book', 'error');
        }
    } catch (error) {
        console.error('Error issuing book:', error);
        showAlert('Error issuing book. Make sure the server is running.', 'error');
    }
}

// Return a book
async function returnBook(id) {
    if (!confirm('Mark this book as returned?')) return;

    try {
        const response = await fetch(`${API_URL}/issues/${id}/return`, { method: 'PUT' });
        const data = await response.json();

        if (response.ok) {
            showAlert('Book returned successfully!', 'success');
            loadIssues();
            loadBooks();
        } else {
            showAlert(data.error || 'Error returning book', 'error');
        }
    } catch (error) {
        console.error('Error returning book:', error);
        showAlert('Error returning book. Make sure the server is running.', 'error');
    }
}

// ==================== UTILITY FUNCTIONS ====================

// Show alerts
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        animation: slideInRight 0.3s ease-out;
        ${type === 'success' ? 'background-color: #10b981;' : ''}
        ${type === 'error' ? 'background-color: #ef4444;' : ''}
        ${type === 'info' ? 'background-color: #3b82f6;' : ''}
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

// Theme toggle
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

// Load theme preference
function loadTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

// Search books
function searchBooks() {
    const searchTerm = document.querySelector('#searchBooks').value.toLowerCase();
    const rows = document.querySelectorAll('#booksTable tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadBooks();
    loadMembers();
    loadIssues();
});
