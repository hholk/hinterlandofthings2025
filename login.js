async function hash(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;
  const emailHash = await hash(email);
  const passwordHash = await hash(password);
  if (emailHash === CREDENTIALS.email && passwordHash === CREDENTIALS.password) {
    localStorage.setItem('auth', 'true');
    window.location.href = 'index.html';
  } else {
    alert('Falsche Zugangsdaten');
  }
});
