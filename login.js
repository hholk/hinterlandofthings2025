const form = document.querySelector('.login-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector('#email').value;
    const password = form.querySelector('#password').value;
    if (email === 'henrikholkenbrink@gmail.com' && password === '1234asdf') {
      localStorage.setItem('loggedIn', 'true');
      window.location.href = '../index.html';
    } else {
      alert('Invalid credentials');
    }
  });
}
