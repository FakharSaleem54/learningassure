// Authentication and session management

// Session management
function currentSession() {
  const session = sGet('currentSession');
  if (!session) return null;

  // Check if session is expired (24 hours)
  const now = Date.now();
  if (now - session.timestamp > 24 * 60 * 60 * 1000) {
    logout();
    return null;
  }

  return session;
}

function getCurrentUser() {
  const session = currentSession();
  if (!session) return null;

  const users = sGet('users', []);
  return users.find(u => u.id === session.userId) || null;
}

function createSession(user) {
  const session = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    timestamp: Date.now()
  };
  sSet('currentSession', session);
  return session;
}

function logout() {
  sRemove('currentSession');
  window.location.href = 'index.html';
}

// Authentication functions
function login(email, password) {
  const users = sGet('users', []);
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return { ok: false, msg: 'Invalid email or password' };
  }

  const session = createSession(user);
  return { ok: true, user, session };
}

function register(name, email, password, role = 'learner') {
  const users = sGet('users', []);

  // Check if user already exists
  if (users.find(u => u.email === email)) {
    return { ok: false, msg: 'Email already registered' };
  }

  // Create new user
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password, // In production, this should be hashed
    role,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  sSet('users', users);

  const session = createSession(newUser);
  return { ok: true, user: newUser, session };
}

// Role-based access control
function requireLogin(redirectTo = 'login.html') {
  const session = currentSession();
  if (!session) {
    window.location.href = redirectTo;
    return null;
  }
  return session;
}

function requireRole(role, redirectTo = 'index.html') {
  const session = requireLogin();
  if (!session || session.role !== role) {
    alert('Access denied. Insufficient permissions.');
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

// User management (admin functions)
function getAllUsers() {
  return sGet('users', []);
}

function updateUser(userId, updates) {
  const users = sGet('users', []);
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) return false;

  users[index] = { ...users[index], ...updates };
  sSet('users', users);
  return true;
}

function deleteUser(userId) {
  const users = sGet('users', []);
  const filtered = users.filter(u => u.id !== userId);
  sSet('users', filtered);
  return true;
}

// Export functions
window.Auth = {
  currentSession,
  getCurrentUser,
  createSession,
  logout,
  login,
  register,
  requireLogin,
  requireRole,
  getAllUsers,
  updateUser,
  deleteUser
};

// Initialize auth UI on page load
document.addEventListener('DOMContentLoaded', function() {
  updateAuthUI();
});
