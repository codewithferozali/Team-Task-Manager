// Redirect if already logged in
if (getToken()) window.location.href = '/dashboard.html';

function switchTab(tab) {
  document.getElementById('login-form').style.display  = tab === 'login'  ? '' : 'none';
  document.getElementById('signup-form').style.display = tab === 'signup' ? '' : 'none';
  document.getElementById('tab-login').classList.toggle('active',  tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
}

document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const err = document.getElementById('login-error');
  btn.textContent = 'Signing in…'; btn.disabled = true; err.style.display = 'none';
  try {
    const data = await API.auth.login({
      email: document.getElementById('login-email').value,
      password: document.getElementById('login-password').value
    });
    saveAuth(data);
    window.location.href = '/dashboard.html';
  } catch (ex) {
    err.textContent = ex.message; err.style.display = 'block';
    btn.textContent = 'Sign In'; btn.disabled = false;
  }
});

document.getElementById('signup-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('signup-btn');
  const err = document.getElementById('signup-error');
  btn.textContent = 'Creating…'; btn.disabled = true; err.style.display = 'none';
  try {
    const data = await API.auth.signup({
      name: document.getElementById('signup-name').value,
      email: document.getElementById('signup-email').value,
      password: document.getElementById('signup-password').value,
      role: document.getElementById('signup-role').value
    });
    saveAuth(data);
    window.location.href = '/dashboard.html';
  } catch (ex) {
    err.textContent = ex.message; err.style.display = 'block';
    btn.textContent = 'Create Account'; btn.disabled = false;
  }
});
