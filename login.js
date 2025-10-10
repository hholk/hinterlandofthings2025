// Attach behaviour once the DOM is ready so the form exists.
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const passwordInput = document.getElementById('password');
  const togglePasswordButton = document.getElementById('toggle-password');
  const messageArea = document.getElementById('login-message');
  const submitButton = form.querySelector('button[type="submit"]');
  const loginCard = document.querySelector('.login-card');
  const loginLayout = document.querySelector('.login-layout');
  const successPanel = document.getElementById('post-login-panel');
  const successGrid = document.getElementById('experience-grid-login');
  let hasRenderedSuccessView = false;

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

  /**
   * Sobald das Passwort stimmt (oder bereits gespeichert war), blenden wir die
   * vollständige Übersicht aller Unterseiten ein. Für Einsteiger:innen: Wir
   * trennen die reine Login-Logik von der UI-Aktualisierung, damit der Code
   * übersichtlich bleibt und später leichter erweitert werden kann.
   */
  const revealSuccessView = () => {
    if (hasRenderedSuccessView) {
      return;
    }

    hasRenderedSuccessView = true;

    if (loginLayout) {
      loginLayout.classList.add('login-layout--authenticated');
    }

    if (loginCard) {
      loginCard.classList.add('login-card--hidden');
      loginCard.setAttribute('aria-hidden', 'true');
      form.reset();
      // Mini-Verzögerung, damit die Ausblend-Animation fertig läuft, bevor wir
      // das Element komplett aus dem Layout nehmen.
      window.setTimeout(() => {
        loginCard.style.display = 'none';
      }, 500);
    }

    if (successPanel) {
      successPanel.hidden = false;
      successPanel.setAttribute('aria-hidden', 'false');
      if (typeof successPanel.focus === 'function') {
        successPanel.focus();
      }
    }

    if (window.ExperienceUI && window.EXPERIENCE_PAGES && successGrid) {
      window.ExperienceUI.renderExperienceCards(successGrid, window.EXPERIENCE_PAGES, {
        tilt: {
          max: 12,
          speed: 600,
          glare: true,
          'max-glare': 0.5,
          scale: 1.05
        }
      });
    }
  };

  if (localStorage.getItem('auth') === 'true') {
    revealSuccessView();
    showMessage('Du bist bereits angemeldet – wähle jetzt eine Unterseite.', 'success');
  }

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
        showMessage('Erfolgreich angemeldet. Wähle jetzt deine Unterseite!', 'success');
        localStorage.setItem('auth', 'true');
        revealSuccessView();
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
