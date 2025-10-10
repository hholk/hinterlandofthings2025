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
  const titleToCard = {};
  doc.querySelectorAll('.event-card').forEach(card => {
    const titleEl = card.querySelector('.event-title');
    if (!titleEl) return;
    const title = titleEl.textContent.trim();
    const catClass = Array.from(card.classList).find(c => c.startsWith('category-'));
    if (catClass) {
      titleToCategory[title] = catClass.replace('category-', '');
    }
    titleToCard[title] = card.outerHTML;
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
  // Using the same palette as the landing page keeps the calendar visually in sync for beginners exploring both views.

  const events = slots.map(slot => ({
    title: slot.title,
    start: `${days[slot.day]}T${slot.start}:00`,
    end: `${days[slot.day]}T${slot.end}:00`,
    color: colors[titleToCategory[slot.title] || 'all']
  }));

  const calendar = EventCalendar.create(document.getElementById('ec'), {
    view: 'timeGridDay',
    height: '160vh',
    duration: {days: 3},
    initialDate: '2025-06-11',
    hiddenDays: [0,1,2,6],
    slotDuration: '00:15',
    eventContent: ({ event }) => ({ html: event.title }),
    eventClick: ({ event }) => {
      const overlay = document.getElementById('overlay');
      const content = document.getElementById('overlay-content');
      content.innerHTML = titleToCard[event.title] || `<div class="event-card"><h2 class="event-title">${event.title}</h2></div>`;
      overlay.style.display = 'flex';
    },
    events
  });

  document.getElementById('overlay').addEventListener('click', (e) => {
    if (e.target.id === 'overlay') {
      e.currentTarget.style.display = 'none';
    }
  });
}

document.addEventListener('DOMContentLoaded', loadCalendar);
