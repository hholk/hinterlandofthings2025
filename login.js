const form = document.querySelector('form');
if(form){
  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if(email === 'henrikholkenbrink@gmail.com' && password === '1234asdf'){
      localStorage.setItem('loggedIn', 'true');
      window.location.href = '../index.html';
    } else {
      alert('Invalid credentials');
    }
  });
}
