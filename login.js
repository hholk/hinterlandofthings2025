const form = document.querySelector('form');
let env = { EMAIL: '', PASSWORD: '' };

function parseEnv(text) {
  return text.split('\n').reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return acc;
    const [key, ...rest] = trimmed.split('=');
    acc[key] = rest.join('=');
    return acc;
  }, {});
}

function handleSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if (email === env.EMAIL && password === env.PASSWORD) {
    localStorage.setItem('loggedIn', 'true');
    window.location.href = '../index.html';
  } else {
    alert('Invalid credentials');
  }
}

function init() {
  fetch('../.env')
    .then(res => (res.ok ? res.text() : ''))
    .then(text => {
      env = Object.assign(env, parseEnv(text));
    })
    .finally(() => {
      if (form) {
        form.addEventListener('submit', handleSubmit);
      }
    });
}

init();
