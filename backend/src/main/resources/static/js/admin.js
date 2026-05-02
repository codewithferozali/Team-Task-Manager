requireAuth();
if (!requireAdmin()) { throw new Error('Redirecting — not admin'); }
initSidebar();
initModals();

let allUsers = [];

async function loadAdmin() {
  try {
    const [users, projects, stats] = await Promise.all([
      API.users.list(),
      API.projects.list(),
      API.tasks.dashboard()
    ]);
    allUsers = users;
    document.getElementById('stat-users').textContent    = users.length;
    document.getElementById('stat-projects').textContent = projects.length;
    document.getElementById('stat-tasks').textContent    = stats.totalTasks;
    renderUsers(users);
  } catch(e) { showToast(e.message,'error'); }
}

function filterUsers() {
  const q = document.getElementById('user-search').value.toLowerCase();
  renderUsers(allUsers.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)));
}

function renderUsers(users) {
  const tbody = document.getElementById('users-table');
  const me = getUser();
  tbody.innerHTML = users.map(u => `
    <tr>
      <td><div style="display:flex;align-items:center;gap:10px">
        <div class="user-avatar" style="background:${avatarColor(u.name)};width:32px;height:32px;font-size:.75rem">${initials(u.name)}</div>
        <span style="font-weight:600">${u.name}</span>
      </div></td>
      <td style="color:var(--text-muted)">${u.email}</td>
      <td><span class="badge badge-${u.role.toLowerCase()}">${u.role}</span></td>
      <td style="color:var(--text-muted);font-size:.82rem">${formatDate(u.createdAt)}</td>
      <td>
        ${u.id !== me.id ? `
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm btn-secondary" onclick="toggleRole(${u.id},'${u.role}')">
              ${u.role === 'ADMIN' ? '⬇ Make Member' : '⬆ Make Admin'}
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id})">Delete</button>
          </div>` : '<span style="color:var(--text-dim);font-size:.8rem">You</span>'}
      </td>
    </tr>`).join('');
}

async function toggleRole(id, currentRole) {
  const newRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
  try {
    await API.users.updateRole(id, newRole);
    showToast(`Role changed to ${newRole}`, 'success');
    loadAdmin();
  } catch(e) { showToast(e.message,'error'); }
}

async function deleteUser(id) {
  if (!confirm('Permanently delete this user?')) return;
  try {
    await API.users.delete(id);
    showToast('User deleted','success');
    loadAdmin();
  } catch(e) { showToast(e.message,'error'); }
}

loadAdmin();
