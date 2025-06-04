async function fetchRemoteSchedule() {
  try {
    const res = await fetch(
      'https://hinterlandofthings.com/de/wp-json/wp/v2/pages/6479'
    );
    const page = await res.json();
    const parser = new DOMParser();
    const doc = parser.parseFromString(page.content.rendered, 'text/html');
    const headings = [...doc.querySelectorAll('h2.elementor-heading-title')];
    const sessions = [];
    for (let i = 0; i < headings.length; i++) {
      const text = headings[i].textContent.trim();
      const m = text.match(/^(\d{1,2}:\d{2}) UHR/);
      if (m) {
        const title = headings[i + 1]
          ? headings[i + 1].textContent.replace(/\s+/g, ' ').trim()
          : '';
        sessions.push({ time: m[1], title });
      }
    }
    return sessions;
  } catch (err) {
    console.error('Remote fetch failed', err);
    return [];
  }
}

async function loadLocalSessions() {
  const files = [
    'data/sample-session.md',
    'data/startup-pitch.md',
    'data/panel-discussion.md'
  ];
  const sessions = [];
  for (const file of files) {
    const res = await fetch(file);
    const text = await res.text();
    const [meta, ...body] = text.split('\n---\n');
    const metaLines = meta.replace(/^---\n/, '').trim().split('\n');
    const data = {};
    metaLines.forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim());
      data[key] = value.replace(/"/g, '');
    });
    data.description = body.join('\n');
    sessions.push(data);
  }
  return sessions;
}

async function loadSessions() {
  const remote = await fetchRemoteSchedule();
  if (remote.length) return remote;
  return loadLocalSessions();
}

function createEventElement(session) {
  const li = document.createElement('li');
  li.className = 'event';
  li.innerHTML = `<strong>${session.title}</strong><br>
    <em>${session.time || ''}${session.location ? ' - ' + session.location : ''}</em><br>
    ${session.description || ''}<br>
    <span class="star">\u2606</span>`;
  li.querySelector('.star').addEventListener('click', () => {
    document.getElementById('schedule').appendChild(li.cloneNode(true));
  });
  return li;
}

async function init() {
  const sessions = await loadSessions();
  const backlog = document.getElementById('backlog');
  sessions.forEach(s => backlog.appendChild(createEventElement(s)));
}

init();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js');
  });
}
