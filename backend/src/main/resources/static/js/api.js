const BASE = '/api';

function getToken() { return localStorage.getItem('token'); }
function getUser()  { return JSON.parse(localStorage.getItem('user') || 'null'); }

function saveAuth(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify({ id: data.id, name: data.name, email: data.email, role: data.role }));
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/index.html';
}

function requireAuth() {
  if (!getToken()) { window.location.href = '/index.html'; return false; }
  return true;
}

function requireAdmin() {
  const u = getUser();
  if (!u || u.role !== 'ADMIN') { window.location.href = '/dashboard.html'; return false; }
  return true;
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(BASE + path, { ...options, headers });

  if (res.status === 401) { logout(); return; }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(json.message || 'Request failed');
  return json.data !== undefined ? json.data : json;
}

const API = {
  auth: {
    signup: (body) => api('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
    login:  (body) => api('/auth/login',  { method: 'POST', body: JSON.stringify(body) }),
    me:     ()     => api('/auth/me'),
  },
  users: {
    list:       ()         => api('/users'),
    updateRole: (id, role) => api(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
    delete:     (id)       => api(`/users/${id}`, { method: 'DELETE' }),
  },
  projects: {
    list:         ()           => api('/projects'),
    get:          (id)         => api(`/projects/${id}`),
    create:       (body)       => api('/projects', { method: 'POST', body: JSON.stringify(body) }),
    update:       (id, body)   => api(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete:       (id)         => api(`/projects/${id}`, { method: 'DELETE' }),
    addMember:    (id, body)   => api(`/projects/${id}/members`, { method: 'POST', body: JSON.stringify(body) }),
    removeMember: (id, userId) => api(`/projects/${id}/members/${userId}`, { method: 'DELETE' }),
  },
  tasks: {
    list:         (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return api('/tasks' + (q ? '?' + q : ''));
    },
    dashboard:    ()          => api('/tasks/dashboard'),
    get:          (id)        => api(`/tasks/${id}`),
    create:       (body)      => api('/tasks', { method: 'POST', body: JSON.stringify(body) }),
    update:       (id, body)  => api(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    updateStatus: (id, status)=> api(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete:       (id)        => api(`/tasks/${id}`, { method: 'DELETE' }),
  }
};

/* ── Toast ── */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  toast.innerHTML = `<span>${icons[type] || '•'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut .3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ── Sidebar helpers ── */
function initSidebar() {
  const user = getUser();
  if (!user) return;
  const nameEl = document.getElementById('sidebar-name');
  const roleEl = document.getElementById('sidebar-role');
  const avatarEl = document.getElementById('sidebar-avatar');
  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = user.role;
  if (avatarEl) avatarEl.textContent = user.name.slice(0,2).toUpperCase();

  // Hide admin links for members
  if (user.role !== 'ADMIN') {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  }

  // Mobile sidebar toggle
  const menuBtn = document.getElementById('menu-btn');
  const sidebar = document.querySelector('.sidebar');
  const overlayBg = document.getElementById('overlay-bg');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlayBg.classList.toggle('show');
    });
    overlayBg?.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlayBg.classList.remove('show');
    });
  }

  document.getElementById('logout-btn')?.addEventListener('click', logout);
}

/* ── Initials avatar color ── */
function avatarColor(name = '') {
  const colors = ['#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
  let h = 0;
  for (let c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

function initials(name = '') {
  return name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
}

/* ── Date helpers ── */
function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function isOverdue(dueDate, status) {
  if (!dueDate || status === 'COMPLETED') return false;
  return new Date(dueDate) < new Date();
}

/* ── Modal helpers ── */
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}
function initModals() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
}
