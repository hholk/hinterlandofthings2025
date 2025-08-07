document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = e.target.password.value;
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  if (hashHex === CREDENTIALS.passwordHash) {
    localStorage.setItem('auth', 'true');
    window.location.href = 'index.html';
  } else {
    alert('Falsche Zugangsdaten');
  }
});

