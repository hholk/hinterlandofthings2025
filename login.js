const form = document.querySelector('form');
let env = { EMAIL: '', PASSWORD: '' };

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
  fetch('../env.json')
    .then(res => (res.ok ? res.json() : {}))
    .then(data => {
      env = Object.assign(env, data);
    })
    .finally(() => {
      if (form) {
        form.addEventListener('submit', handleSubmit);
      }
    });
}

init();
