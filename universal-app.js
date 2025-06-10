async function loadSlots(){
  const resp = await fetch('universal-timeslots.json');
  const slots = await resp.json();
  const day1 = document.getElementById('day1');
  const day2 = document.getElementById('day2');
  const day3 = document.getElementById('day3');
  const tmpl = document.getElementById('slot-template');
  slots.forEach(slot => {
    const clone = tmpl.content.firstElementChild.cloneNode(true);
    clone.querySelector('.title').textContent = slot.title;
    clone.querySelector('.time').textContent = slot.start + (slot.end ? ' - ' + slot.end : '');
    clone.querySelector('.speaker').textContent = slot.speaker;
    clone.querySelector('.desc').textContent = slot.description;
    clone.querySelector('.ics-link').href = slot.ics;
    if(slot.day === 1) day1.appendChild(clone);
    else if(slot.day === 2) day2.appendChild(clone);
    else day3.appendChild(clone);
  });
}
loadSlots();
