requireAuth();
initSidebar();
initModals();

let allProjects = [], allUsers = [];

async function loadProjects() {
  try {
    [allProjects, allUsers] = await Promise.all([
      API.projects.list(),
      API.users.list()
    ]);
    populateUserSelect();
    renderProjects(allProjects);
  } catch(e) { showToast(e.message,'error'); }
}

function populateUserSelect() {
  const sel = document.getElementById('add-user-sel');
  allUsers.forEach(u => {
    const o = document.createElement('option');
    o.value = u.id; o.textContent = u.name; sel.appendChild(o);
  });
}

function filterProjects() {
  const q = document.getElementById('search').value.toLowerCase();
  const st = document.getElementById('filter-status').value;
  renderProjects(allProjects.filter(p =>
    (!q || p.name.toLowerCase().includes(q)) && (!st || p.status === st)
  ));
}

function renderProjects(projects) {
  const grid = document.getElementById('projects-grid');
  if (!projects.length) {
    grid.innerHTML = '<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg><p>No projects found.</p></div>';
    return;
  }
  const isAdmin = getUser()?.role === 'ADMIN';
  grid.innerHTML = projects.map(p => {
    const memberAvatars = p.members.slice(0,4).map(m =>
      `<div class="avatar" style="background:${avatarColor(m.name)}" title="${m.name}">${initials(m.name)}</div>`
    ).join('');
    const extra = p.members.length > 4 ? `<div class="avatar" style="background:var(--border)">+${p.members.length-4}</div>` : '';
    return `<div class="project-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <span class="badge badge-${p.status.toLowerCase()}">${p.status}</span>
        ${isAdmin ? `<div style="display:flex;gap:6px">
          <button class="btn-icon btn-sm" onclick="openProjectModal(${p.id})" title="Edit">✏️</button>
          <button class="btn-icon btn-sm" onclick="openMembersModal(${p.id})" title="Members">👥</button>
          <button class="btn-icon btn-sm" onclick="deleteProject(${p.id})" title="Delete">🗑️</button>
        </div>` : `<button class="btn-icon btn-sm" onclick="openMembersModal(${p.id})">👥</button>`}
      </div>
      <div class="project-name">${p.name}</div>
      <div class="project-desc">${p.description || 'No description provided.'}</div>
      <div class="project-footer">
        <div class="project-members">${memberAvatars}${extra}</div>
        <span style="font-size:.8rem;color:var(--text-muted)">${p.taskCount} task${p.taskCount !== 1 ? 's' : ''}</span>
      </div>
    </div>`;
  }).join('');
}

function openProjectModal(id = null) {
  const proj = id ? allProjects.find(p => p.id === id) : null;
  document.getElementById('edit-proj-id').value = proj?.id || '';
  document.getElementById('proj-modal-title').textContent = proj ? 'Edit Project' : 'New Project';
  document.getElementById('p-name').value   = proj?.name || '';
  document.getElementById('p-desc').value   = proj?.description || '';
  document.getElementById('p-status').value = proj?.status || 'ACTIVE';
  openModal('project-modal');
}

async function saveProject() {
  const btn = document.getElementById('proj-save-btn');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const id = document.getElementById('edit-proj-id').value;
    const body = {
      name: document.getElementById('p-name').value,
      description: document.getElementById('p-desc').value,
      status: document.getElementById('p-status').value
    };
    if (!body.name) { showToast('Name is required','error'); return; }
    if (id) await API.projects.update(id, body);
    else    await API.projects.create(body);
    showToast(id ? 'Project updated!' : 'Project created!', 'success');
    closeModal('project-modal');
    loadProjects();
  } catch(e) { showToast(e.message,'error'); }
  finally { btn.disabled = false; btn.textContent = 'Save'; }
}

async function deleteProject(id) {
  if (!confirm('Delete this project? Tasks will be unlinked.')) return;
  try { await API.projects.delete(id); showToast('Project deleted','success'); loadProjects(); }
  catch(e) { showToast(e.message,'error'); }
}

function openMembersModal(projId) {
  document.getElementById('members-proj-id').value = projId;
  const proj = allProjects.find(p => p.id === projId);
  renderMembersList(proj?.members || []);
  openModal('members-modal');
}

function renderMembersList(members) {
  const el = document.getElementById('members-list');
  const projId = document.getElementById('members-proj-id').value;
  const isAdmin = getUser()?.role === 'ADMIN';
  if (!members.length) { el.innerHTML = '<p style="color:var(--text-muted);font-size:.88rem">No members yet.</p>'; return; }
  el.innerHTML = members.map(m => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:10px">
        <div class="user-avatar" style="background:${avatarColor(m.name)};width:32px;height:32px;font-size:.75rem">${initials(m.name)}</div>
        <div><div style="font-size:.9rem;font-weight:600">${m.name}</div><div style="font-size:.75rem;color:var(--text-muted)">${m.email}</div></div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="badge badge-${m.role.toLowerCase()}">${m.role}</span>
        ${isAdmin ? `<button class="btn-icon btn-sm" onclick="removeMember(${projId},${m.userId})" title="Remove">✕</button>` : ''}
      </div>
    </div>`).join('');
}

async function addMember() {
  const projId = document.getElementById('members-proj-id').value;
  const userId = document.getElementById('add-user-sel').value;
  const role   = document.getElementById('add-role-sel').value;
  if (!userId) { showToast('Select a user first', 'error'); return; }
  try {
    const proj = await API.projects.addMember(projId, { userId: Number(userId), role });
    const idx = allProjects.findIndex(p => String(p.id) === String(projId));
    if (idx !== -1) allProjects[idx] = proj;
    renderMembersList(proj.members);
    showToast('Member added', 'success');
  } catch(e) { showToast(e.message, 'error'); }
}

async function removeMember(projId, userId) {
  try {
    await API.projects.removeMember(projId, userId);
    const proj = await API.projects.get(projId);
    const idx = allProjects.findIndex(p => p.id === projId);
    if (idx !== -1) allProjects[idx] = proj;
    renderMembersList(proj.members);
    showToast('Member removed','success');
  } catch(e) { showToast(e.message,'error'); }
}

loadProjects();
