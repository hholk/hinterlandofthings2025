document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const password = e.target.password.value;
  if (password === CREDENTIALS.password) {
    localStorage.setItem('auth', 'true');
    window.location.href = 'index.html';
  } else {
    alert('Falsche Zugangsdaten');
  }
});

