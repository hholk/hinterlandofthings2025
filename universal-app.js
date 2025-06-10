// Build calendar view using EventCalendar library
async function loadCalendar() {
  const [slotsResp, htmlResp] = await Promise.all([
    fetch('universal-timeslots.json'),
    fetch('universal-home.html')
  ]);
  const slots = await slotsResp.json();
  const html = await htmlResp.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const titleToCategory = {};
  doc.querySelectorAll('.event-card').forEach(card => {
    const titleEl = card.querySelector('.event-title');
    if (!titleEl) return;
    const title = titleEl.textContent.trim();
    const catClass = Array.from(card.classList).find(c => c.startsWith('category-'));
    if (catClass) {
      titleToCategory[title] = catClass.replace('category-', '');
    }
  });

  const days = {
    1: '2025-06-11',
    2: '2025-06-12',
    3: '2025-06-13'
  };

  const colors = {
    presentation: 'var(--primary-blue)',
    qa: 'var(--primary-green)',
    networking: 'var(--primary-orange)',
    all: 'var(--primary-gray)'
  };

  const events = slots.map(slot => ({
    title: slot.title,
    start: `${days[slot.day]}T${slot.start}:00`,
    end: `${days[slot.day]}T${slot.end}:00`,
    color: colors[titleToCategory[slot.title] || 'all']
  }));

  EventCalendar.create(document.getElementById('ec'), {
    view: 'timeGridDay',
    height: '80vh',
    duration: {days: 3},
    initialDate: '2025-06-11',
    hiddenDays: [0,1,2,6],
    slotDuration: '00:15',
    events
  });
}

document.addEventListener('DOMContentLoaded', loadCalendar);
