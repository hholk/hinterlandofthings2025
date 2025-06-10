function toMinutes(t){
  const [h,m] = t.split(':').map(Number);
  return h*60 + m;
}

async function loadSlots(){
  const resp = await fetch('universal-timeslots.json');
  const slots = await resp.json();
  const days = {
    1: document.getElementById('day1'),
    2: document.getElementById('day2'),
    3: document.getElementById('day3')
  };
  const tmpl = document.getElementById('slot-template');

  const dayStarts = {};
  const dayEnds = {};
  slots.forEach(s => {
    const start = toMinutes(s.start);
    const end = toMinutes(s.end);
    if(!(s.day in dayStarts) || start < dayStarts[s.day]) dayStarts[s.day] = start;
    if(!(s.day in dayEnds) || end > dayEnds[s.day]) dayEnds[s.day] = end;
  });

  Object.keys(days).forEach(day => {
    const rows = Math.ceil((dayEnds[day] - dayStarts[day]) / 15);
    days[day].style.gridTemplateRows = `repeat(${rows}, 15px)`;
  });

  const popup = document.getElementById('slot-popup');
  const popTitle = popup.querySelector('.title');
  const popTime = popup.querySelector('.time');
  const popSpeaker = popup.querySelector('.speaker');
  const popDesc = popup.querySelector('.desc');
  const popIcs = popup.querySelector('.ics-link');

  slots.forEach((slot, idx) => {
    const clone = tmpl.content.firstElementChild.cloneNode(true);
    clone.dataset.id = idx;
    clone.querySelector('.title').textContent = slot.title;
    clone.querySelector('.time').textContent = slot.start + (slot.end ? ' - ' + slot.end : '');
    clone.querySelector('.speaker').textContent = slot.speaker;
    clone.querySelector('.desc').textContent = slot.description;
    clone.querySelector('.ics-link').href = slot.ics;

    clone.addEventListener('click', () => {
      if(popup.classList.contains('active') && popup.dataset.activeId === String(idx)) {
        popup.classList.remove('active');
        popup.dataset.activeId = '';
        return;
      }
      popTitle.textContent = slot.title;
      popTime.textContent = clone.querySelector('.time').textContent;
      popSpeaker.textContent = slot.speaker;
      popDesc.textContent = slot.description;
      popIcs.href = slot.ics;
      popup.dataset.activeId = String(idx);
      popup.classList.add('active');
    });

    const startRow = Math.floor((toMinutes(slot.start) - dayStarts[slot.day]) / 15) + 1;
    const span = Math.ceil((toMinutes(slot.end) - toMinutes(slot.start)) / 15);
    clone.style.gridRow = `${startRow} / span ${span}`;

    days[slot.day].appendChild(clone);
  });

  popup.addEventListener('click', () => {
    popup.classList.remove('active');
    popup.dataset.activeId = '';
  });
}
loadSlots();
