// Main application utilities and initialization

// Toast notification system
function showToast(message, type = 'info', duration = 5000) {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);

    // Add toast styles if not already present
    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          max-width: 400px;
        }
        .toast {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          margin-bottom: 10px;
          padding: 16px;
          display: flex;
          align-items: center;
          animation: slideInRight 0.3s ease-out;
          border-left: 4px solid;
        }
        .toast.success { border-left-color: #10b981; }
        .toast.error { border-left-color: #ef4444; }
        .toast.warning { border-left-color: #f59e0b; }
        .toast.info { border-left-color: #3b82f6; }
        .toast-icon {
          font-size: 20px;
          margin-right: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }
        .toast-content {
          flex: 1;
          font-size: 14px;
          line-height: 1.4;
        }
        .toast-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          margin-left: 12px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .toast-close:hover {
          color: #374151;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .toast.fade-out {
          animation: fadeOut 0.3s ease-out forwards;
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(100%); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  // Set icon based on type
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  // Add to container
  toastContainer.appendChild(toast);

  // Auto remove after duration
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 300);
  }, duration);

  return toast;
}

// Convenience functions for different toast types
function showSuccess(message, duration) {
  return showToast(message, 'success', duration);
}

function showError(message, duration) {
  return showToast(message, 'error', duration);
}

function showWarning(message, duration) {
  return showToast(message, 'warning', duration);
}

function showInfo(message, duration) {
  return showToast(message, 'info', duration);
}

// Formatting utilities
function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Utility functions
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function isOnline() {
  return navigator.onLine;
}

function getUrlParams() {
  const params = {};
  const urlParams = new URLSearchParams(window.location.search);
  for (const [key, value] of urlParams) {
    params[key] = value;
  }
  return params;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackErr) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Auth UI management
function updateAuthUI() {
  const session = Auth.currentSession();
  const userMenu = document.querySelector('.user-menu');

  if (!userMenu) return;

  if (session) {
    userMenu.innerHTML = `
      <div class="user-info">
        <div class="user-name">${session.name}</div>
        <div class="user-dropdown">
          <button class="user-menu-btn" onclick="toggleUserMenu()">
            <span class="user-avatar">${session.name.charAt(0).toUpperCase()}</span>
            <span class="dropdown-arrow">▼</span>
          </button>
          <div class="user-menu-dropdown" id="userMenuDropdown" style="display: none;">
            <a href="dashboard.html">Dashboard</a>
            <a href="profile.html">Profile</a>
            <a href="settings.html">Settings</a>
            <hr>
            <a href="#" onclick="Auth.logout()">Logout</a>
          </div>
        </div>
      </div>
    `;
  } else {
    userMenu.innerHTML = `
      <div class="auth-links">
        <a href="login.html" class="btn outline small">Login</a>
        <a href="register.html" class="btn primary small">Sign Up</a>
      </div>
    `;
  }
}

function toggleUserMenu() {
  const dropdown = document.getElementById('userMenuDropdown');
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
  const dropdown = document.getElementById('userMenuDropdown');
  const userMenuBtn = event.target.closest('.user-menu-btn');

  if (dropdown && !userMenuBtn && !dropdown.contains(event.target)) {
    dropdown.style.display = 'none';
  }
});

// Global error handler
window.addEventListener('error', function(e) {
  console.error('Global error:', e.error);
  showError('An unexpected error occurred. Please refresh the page.');
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(e) {
  console.error('Unhandled promise rejection:', e.reason);
  showError('An unexpected error occurred. Please refresh the page.');
});

// Export functions
window.AppUtils = {
  showSuccess,
  showError,
  showInfo,
  showWarning,
  formatCurrency,
  formatDate,
  formatDateTime,
  generateId,
  debounce,
  isOnline,
  getUrlParams,
  copyToClipboard,
  isValidEmail,
  updateAuthUI,
  toggleUserMenu
};

// Initialize auth UI on page load
document.addEventListener('DOMContentLoaded', function() {
  updateAuthUI();
});
