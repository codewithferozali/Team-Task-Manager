requireAuth();
initSidebar();
initModals();

let statusChart, overviewChart;

async function loadDashboard() {
  try {
    const [stats, tasks, projects, users] = await Promise.all([
      API.tasks.dashboard(),
      API.tasks.list(),
      API.projects.list(),
      API.users.list()
    ]);

    // Stats
    document.getElementById('stat-total').textContent   = stats.totalTasks;
    document.getElementById('stat-done').textContent    = stats.completedTasks;
    document.getElementById('stat-overdue').textContent = stats.overdueTasks;
    document.getElementById('stat-projects').textContent = stats.totalProjects;

    // Charts
    renderStatusChart(stats);
    renderOverviewChart(stats);

    // Populate modal selects
    const projSel = document.getElementById('t-project');
    projects.forEach(p => {
      const o = document.createElement('option');
      o.value = p.id; o.textContent = p.name;
      projSel.appendChild(o);
    });

    if (users.length) {
      const assignSel = document.getElementById('t-assign');
      users.forEach(u => {
        const o = document.createElement('option');
        o.value = u.id; o.textContent = u.name;
        assignSel.appendChild(o);
      });
    }

    // Recent tasks
    renderRecentTasks(tasks.slice(0, 8));
  } catch(e) { showToast(e.message, 'error'); }
}

function renderStatusChart(stats) {
  const ctx = document.getElementById('status-chart').getContext('2d');
  if (statusChart) statusChart.destroy();
  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['To Do', 'In Progress', 'Completed'],
      datasets: [{ data: [stats.todoTasks, stats.inProgressTasks, stats.completedTasks],
        backgroundColor: ['#64748b','#06b6d4','#10b981'], borderWidth: 0, hoverOffset: 6 }]
    },
    options: { responsive:true, maintainAspectRatio:false, cutout:'70%',
      plugins: { legend: { position:'bottom', labels: { color:'#94a3b8', padding:16, boxWidth:12 } } }
    }
  });
}

function renderOverviewChart(stats) {
  const ctx = document.getElementById('overview-chart').getContext('2d');
  if (overviewChart) overviewChart.destroy();
  overviewChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['To Do', 'In Progress', 'Completed', 'Overdue'],
      datasets: [{ label: 'Tasks',
        data: [stats.todoTasks, stats.inProgressTasks, stats.completedTasks, stats.overdueTasks],
        backgroundColor: ['rgba(100,116,139,.7)','rgba(6,182,212,.7)','rgba(16,185,129,.7)','rgba(239,68,68,.7)'],
        borderRadius: 6, borderWidth: 0
      }]
    },
    options: { responsive:true, maintainAspectRatio:false,
      plugins: { legend: { display:false } },
      scales: {
        x: { ticks: { color:'#94a3b8' }, grid: { color:'rgba(42,42,74,.6)' } },
        y: { ticks: { color:'#94a3b8', stepSize:1 }, grid: { color:'rgba(42,42,74,.6)' } }
      }
    }
  });
}

function renderRecentTasks(tasks) {
  const el = document.getElementById('recent-tasks');
  if (!tasks.length) { el.innerHTML = '<div class="empty"><p>No tasks yet. Create your first task!</p></div>'; return; }
  el.innerHTML = `<table><thead><tr>
    <th>Title</th><th>Project</th><th>Priority</th><th>Status</th><th>Due Date</th>
  </tr></thead><tbody>
  ${tasks.map(t => `<tr>
    <td style="font-weight:600">${t.title}</td>
    <td style="color:var(--text-muted)">${t.projectName || '—'}</td>
    <td><span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span></td>
    <td><span class="badge badge-${statusClass(t.status)}">${statusLabel(t.status)}</span></td>
    <td class="${t.overdue ? 'badge-overdue' : ''}" style="font-size:.82rem">${formatDate(t.dueDate) || '—'}</td>
  </tr>`).join('')}
  </tbody></table>`;
}

function statusClass(s) {
  return { TODO:'todo', IN_PROGRESS:'progress', COMPLETED:'done' }[s] || 'todo';
}
function statusLabel(s) {
  return { TODO:'To Do', IN_PROGRESS:'In Progress', COMPLETED:'Completed' }[s] || s;
}

async function saveTask() {
  const btn = document.getElementById('task-save-btn');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const projVal   = document.getElementById('t-project').value;
    const assignVal = document.getElementById('t-assign').value;
    const body = {
      title: document.getElementById('t-title').value.trim(),
      description: document.getElementById('t-desc').value.trim() || null,
      priority: document.getElementById('t-priority').value,
      dueDate: document.getElementById('t-due').value || null,
      projectId: projVal   ? Number(projVal)   : null,
      assignedToId: assignVal ? Number(assignVal) : null
    };
    if (!body.title) { showToast('Title is required', 'error'); return; }
    await API.tasks.create(body);
    showToast('Task created!', 'success');
    closeModal('task-modal');
    // reset form
    ['t-title','t-desc','t-due'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('t-project').value  = '';
    document.getElementById('t-assign').value   = '';
    document.getElementById('t-priority').value = 'MEDIUM';
    loadDashboard();
  } catch(e) { showToast(e.message, 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Create Task'; }
}

loadDashboard();
