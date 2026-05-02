requireAuth();
initSidebar();
initModals();

let allTasks = [], allProjects = [], allUsers = [];

async function loadTasks() {
  try {
    [allTasks, allProjects, allUsers] = await Promise.all([
      API.tasks.list(),
      API.projects.list(),
      API.users.list()
    ]);
    populateSelects();
    renderBoard(allTasks);
  } catch(e) { showToast(e.message, 'error'); }
}

function populateSelects() {
  const projSel = document.getElementById('t-project');
  const filterProj = document.getElementById('filter-project');
  allProjects.forEach(p => {
    [projSel, filterProj].forEach(sel => {
      const o = document.createElement('option');
      o.value = p.id; o.textContent = p.name; sel.appendChild(o);
    });
  });
  const assignSel = document.getElementById('t-assign');
  allUsers.forEach(u => {
    const o = document.createElement('option');
    o.value = u.id; o.textContent = u.name; assignSel.appendChild(o);
  });
}

function filterTasks() {
  const q = document.getElementById('search').value.toLowerCase();
  const pri = document.getElementById('filter-priority').value;
  const proj = document.getElementById('filter-project').value;
  const filtered = allTasks.filter(t =>
    (!q || t.title.toLowerCase().includes(q)) &&
    (!pri || t.priority === pri) &&
    (!proj || String(t.projectId) === proj)
  );
  renderBoard(filtered);
}

function renderBoard(tasks) {
  const cols = { TODO: [], IN_PROGRESS: [], COMPLETED: [] };
  tasks.forEach(t => (cols[t.status] || cols.TODO).push(t));

  document.getElementById('drop-todo').innerHTML     = cols.TODO.map(taskCard).join('');
  document.getElementById('drop-progress').innerHTML = cols.IN_PROGRESS.map(taskCard).join('');
  document.getElementById('drop-done').innerHTML     = cols.COMPLETED.map(taskCard).join('');

  document.getElementById('count-todo').textContent     = cols.TODO.length;
  document.getElementById('count-progress').textContent = cols.IN_PROGRESS.length;
  document.getElementById('count-done').textContent     = cols.COMPLETED.length;

  document.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('dragstart', e => {
      e.dataTransfer.setData('taskId', card.dataset.id);
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });
}

function taskCard(t) {
  const over = t.overdue;
  const av = t.assignedTo ? `<div class="task-assignee" style="background:${avatarColor(t.assignedTo.name)}" title="${t.assignedTo.name}">${initials(t.assignedTo.name)}</div>` : '';
  return `<div class="task-card" draggable="true" data-id="${t.id}" onclick="editTask(${t.id})">
    <div class="task-title">${t.title}</div>
    ${t.projectName ? `<div style="font-size:.75rem;color:var(--text-muted);margin-bottom:4px">📁 ${t.projectName}</div>` : ''}
    <div class="task-meta">
      <span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span>
      ${t.dueDate ? `<span class="task-due ${over ? 'overdue' : ''}">📅 ${formatDate(t.dueDate)}${over ? ' ⚠️' : ''}</span>` : ''}
      ${av}
    </div>
  </div>`;
}

async function drop(e, status) {
  e.preventDefault();
  document.querySelectorAll('.kanban-drop').forEach(d => d.classList.remove('drag-over'));
  const id = e.dataTransfer.getData('taskId');
  try {
    await API.tasks.updateStatus(id, status);
    const task = allTasks.find(t => String(t.id) === id);
    if (task) task.status = status;
    renderBoard(allTasks);
    showToast('Status updated', 'success');
  } catch(err) { showToast(err.message, 'error'); }
}

function openTaskModal(task = null) {
  document.getElementById('edit-task-id').value = task?.id || '';
  document.getElementById('task-modal-title').textContent = task ? 'Edit Task' : 'New Task';
  document.getElementById('t-title').value    = task?.title || '';
  document.getElementById('t-desc').value     = task?.description || '';
  document.getElementById('t-priority').value = task?.priority || 'MEDIUM';
  document.getElementById('t-status').value   = task?.status || 'TODO';
  document.getElementById('t-due').value      = task?.dueDate || '';
  document.getElementById('t-project').value  = task?.projectId || '';
  document.getElementById('t-assign').value   = task?.assignedTo?.id || '';
  openModal('task-modal');
}

async function editTask(id) {
  try {
    const t = await API.tasks.get(id);
    openTaskModal(t);
  } catch(e) { showToast(e.message, 'error'); }
}

async function saveTask() {
  const btn = document.getElementById('task-save-btn');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const id        = document.getElementById('edit-task-id').value;
    const projVal   = document.getElementById('t-project').value;
    const assignVal = document.getElementById('t-assign').value;
    const body = {
      title: document.getElementById('t-title').value.trim(),
      description: document.getElementById('t-desc').value.trim() || null,
      priority: document.getElementById('t-priority').value,
      status: document.getElementById('t-status').value,
      dueDate: document.getElementById('t-due').value || null,
      projectId: projVal   ? Number(projVal)   : null,
      assignedToId: assignVal ? Number(assignVal) : null
    };
    if (!body.title) { showToast('Title is required', 'error'); return; }
    if (id) await API.tasks.update(id, body);
    else    await API.tasks.create(body);
    showToast(id ? 'Task updated!' : 'Task created!', 'success');
    closeModal('task-modal');
    loadTasks();
  } catch(e) { showToast(e.message, 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Save'; }
}

loadTasks();
