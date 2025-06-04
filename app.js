async function loadSlots() {
  const resp = await fetch('timeslots.json');
  const slots = await resp.json();
  const agenda = document.getElementById('agenda');
  const tmpl = document.getElementById('slot-template');
  const favs = JSON.parse(localStorage.getItem('favorites')||'[]');
  slots.forEach(slot => {
    const clone = tmpl.content.firstElementChild.cloneNode(true);
    clone.querySelector('.title').textContent = slot.title;
    clone.querySelector('.time').textContent = slot.start + (slot.end ? ' - '+slot.end : '');
    const btn = clone.querySelector('.fav');
    if(favs.includes(slot.file)) btn.classList.add('active');
    btn.addEventListener('click', () => {
      if(favs.includes(slot.file)) {
        favs.splice(favs.indexOf(slot.file),1);
        btn.classList.remove('active');
      } else {
        favs.push(slot.file);
        btn.classList.add('active');
      }
      localStorage.setItem('favorites', JSON.stringify(favs));
    });
    fetch('timeslots/'+slot.file).then(r=>r.text()).then(md => {
      const metaSec = clone.querySelector('.meta');
      const lines = md.split(/\r?\n/);
      let meta = [];
      lines.forEach(line => {
        if(line.startsWith('- ')) meta.push(line.substring(2));
      });
      metaSec.textContent = meta.join(', ');
    });
    agenda.appendChild(clone);
  });
}
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('service-worker.js');
}
loadSlots();
