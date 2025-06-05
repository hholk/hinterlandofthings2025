const ROLES = new Set([
  'PANEL',
  'KEYNOTE',
  'FIRESIDE CHAT',
  'LIVE PODCAST',
  'PITCH',
  'IMPULS',
  'GASTGEBER',
  'PAUSE',
  'MASTERCLASS',
  'MASTERCLASS RAUM 1',
  'MASTERCLASS RAUM 2',
  'ROUNDTABLE',
  'ROUNDTABLE RAUM 9',
  'ROUNDTABLE RAUM 10 & 11',
]);

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
      const tagWrap = clone.querySelector('.tags');
      const lines = md.split(/\r?\n/);
      let meta = [];
      let tags = [];
      lines.forEach(line => {
        if(!line.startsWith('- ')) return;
        const item = line.substring(2).trim();
        if(ROLES.has(item.toUpperCase())) {
          tags.push(item);
          return;
        }
        if(!line.startsWith('- Profil:') && !line.startsWith('- Grund:')) {
          meta.push(item);
        }
      });
      metaSec.textContent = meta.join(', ');
      tags.forEach(t => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = t;
        tagWrap.appendChild(span);
      });
    });
    agenda.appendChild(clone);
  });
}

async function loadNavigation(){
  const resp = await fetch('md-files.json');
  const files = await resp.json();
  const list = document.getElementById('nav-list');
  const input = document.getElementById('nav-filter');
  function render(filter=''){
    list.innerHTML='';
    files.filter(f => f.toLowerCase().includes(filter.toLowerCase())).forEach(f => {
      const li=document.createElement('li');
      const a=document.createElement('a');
      a.href=f;
      a.textContent=f;
      li.appendChild(a);
      list.appendChild(li);
    });
  }
  input.addEventListener('input', ()=>render(input.value));
  render();
}
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('service-worker.js');
}
loadSlots();
loadNavigation();
