// public/js/auth.js
// index.html (로그인/회원가입 페이지) 의 동작을 담당합니다.

document.addEventListener('DOMContentLoaded', () => {
  // 이미 로그인되어 있으면 바로 채팅 페이지로 이동
  if (localStorage.getItem('token')) {
    window.location.href = '/chat.html';
    return;
  }

  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  document.getElementById('showRegister').addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  });

  document.getElementById('showLogin').addEventListener('click', () => {
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
  });

  document.getElementById('topLangSelect').addEventListener('change', (e) => {
    applyLang(e.target.value);
  });

  document.getElementById('loginSubmit').addEventListener('click', async () => {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    errorEl.textContent = '';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        errorEl.textContent = data.error || 'Login failed';
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      applyLang(data.user.ui_lang);
      window.location.href = '/chat.html';
    } catch (err) {
      errorEl.textContent = 'Network error';
    }
  });

  document.getElementById('registerSubmit').addEventListener('click', async () => {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const ui_lang = document.getElementById('registerLang').value;
    const errorEl = document.getElementById('registerError');
    errorEl.textContent = '';

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, ui_lang }),
      });
      const data = await res.json();
      if (!res.ok) {
        errorEl.textContent = data.error || 'Registration failed';
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      applyLang(data.user.ui_lang);
      window.location.href = '/chat.html';
    } catch (err) {
      errorEl.textContent = 'Network error';
    }
  });
});
