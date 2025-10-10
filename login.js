// Attach behaviour once the DOM is ready so the form exists.
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const passwordInput = document.getElementById('password');
  const togglePasswordButton = document.getElementById('toggle-password');
  const messageArea = document.getElementById('login-message');
  const submitButton = form.querySelector('button[type="submit"]');

  // Helper to show inline feedback instead of disruptive alert pop-ups.
  const showMessage = (text, type = 'info') => {
    messageArea.textContent = text;
    messageArea.dataset.state = type;
  };

  const setLoading = (isLoading) => {
    submitButton.disabled = isLoading;
    submitButton.setAttribute('aria-busy', String(isLoading));
    submitButton.textContent = isLoading ? 'Wird geprüft…' : 'Jetzt anmelden';
  };

  togglePasswordButton.addEventListener('click', () => {
    const isHidden = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isHidden ? 'text' : 'password');
    togglePasswordButton.setAttribute('aria-pressed', String(isHidden));
    togglePasswordButton.textContent = isHidden ? 'Verbergen' : 'Anzeigen';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('');

    const password = passwordInput.value.trim();
    if (!password) {
      showMessage('Bitte gib dein Passwort ein.', 'error');
      passwordInput.focus();
      return;
    }

    try {
      setLoading(true);
      const isValid = await window.AuthUtils.verifyPassword(password, window.CREDENTIALS.passwordHash);

      if (isValid) {
        showMessage('Erfolgreich angemeldet. Du wirst weitergeleitet …', 'success');
        localStorage.setItem('auth', 'true');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 600);
      } else {
        showMessage('Das Passwort stimmt nicht. Bitte versuche es erneut.', 'error');
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 600);
        passwordInput.focus();
        passwordInput.select();
      }
    } catch (error) {
      console.error('Login failed', error);
      showMessage('Etwas ist schiefgelaufen. Bitte lade die Seite neu und versuche es erneut.', 'error');
    } finally {
      setLoading(false);
    }
  });
});
