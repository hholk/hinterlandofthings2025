// Dieses Skript verwandelt große Tabellen in filterbare, sortierbare Elemente.
// Der Code ist bewusst Schritt für Schritt kommentiert, damit Einsteiger:innen
// sehen, wie DOM-Manipulation ohne Framework funktioniert.

document.addEventListener('DOMContentLoaded', () => {
  const tables = document.querySelectorAll('table[data-enhance="interactive"]');
  tables.forEach((table, index) => enhanceTable(table, index));
});

function enhanceTable(table, index) {
  // Wir speichern uns den ursprünglichen Tabellenkörper, damit wir bei Bedarf
  // wieder zur Originalreihenfolge zurückkehren können.
  const tbody = table.tBodies[0] || table.createTBody();
  const originalRows = Array.from(tbody.rows);
  let currentRows = [...originalRows];
  let currentSort = null;

  const wrapper = document.createElement('div');
  wrapper.className = 'table-shell';
  table.parentNode.insertBefore(wrapper, table);

  const controls = document.createElement('div');
  controls.className = 'table-controls';
  const label = document.createElement('label');
  label.textContent = 'Filter';
  const searchId = `table-search-${index}`;
  label.setAttribute('for', searchId);
  const input = document.createElement('input');
  input.type = 'search';
  input.id = searchId;
  input.placeholder = 'Inhalt durchsuchen…';
  controls.append(label, input);

  const scroll = document.createElement('div');
  scroll.className = 'table-scroll';

  const caption = table.caption ? table.caption.textContent.trim() : '';
  if (table.caption) {
    table.caption.classList.add('visually-hidden');
  }

  wrapper.append(controls, scroll);
  scroll.appendChild(table);

  if (caption) {
    const captionPara = document.createElement('p');
    captionPara.className = 'table-caption';
    captionPara.textContent = caption;
    wrapper.appendChild(captionPara);
  }

  const emptyState = document.createElement('div');
  emptyState.className = 'table-empty';
  emptyState.textContent = 'Keine Ergebnisse für die aktuelle Suche.';
  emptyState.setAttribute('role', 'status');
  emptyState.hidden = true;
  wrapper.appendChild(emptyState);

  // Wir erweitern alle Kopfzellen um klickbare Sortierindikatoren.
  Array.from(table.tHead?.rows[0]?.cells || []).forEach((th, columnIndex) => {
    const indicator = document.createElement('span');
    indicator.className = 'table-sort-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    th.appendChild(indicator);
    th.tabIndex = 0;
    th.setAttribute('role', 'button');
    th.setAttribute('aria-label', `${th.textContent.trim()} sortieren`);
    th.setAttribute('aria-sort', 'none');

    const triggerSort = () => {
      let direction = 'asc';
      if (currentSort && currentSort.index === columnIndex) {
        direction = currentSort.direction === 'asc' ? 'desc' : currentSort.direction === 'desc' ? null : 'asc';
      }
      updateSortState(columnIndex, direction);
    };

    th.addEventListener('click', triggerSort);
    th.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        triggerSort();
      }
    });
  });

  input.addEventListener('input', () => applyFilter(tbody, input.value, emptyState));

  function updateSortState(columnIndex, direction) {
    currentSort = direction ? { index: columnIndex, direction } : null;
    currentRows = direction ? sortRows(originalRows, columnIndex, direction) : [...originalRows];
    currentRows.forEach((row) => tbody.appendChild(row));
    updateIndicators(columnIndex, direction);
    applyFilter(tbody, input.value, emptyState);
  }

  function updateIndicators(activeIndex, direction) {
    Array.from(table.tHead?.rows[0]?.cells || []).forEach((th, idx) => {
      const indicator = th.querySelector('.table-sort-indicator');
      if (!indicator) return;
      if (idx !== activeIndex || !direction) {
        indicator.textContent = '';
        th.setAttribute('aria-sort', 'none');
        return;
      }
      indicator.textContent = direction === 'asc' ? '▲' : '▼';
      th.setAttribute('aria-sort', direction === 'asc' ? 'ascending' : 'descending');
    });
  }
  applyFilter(tbody, '', emptyState);
}

function applyFilter(tbody, query, emptyState) {
  const value = query.trim().toLowerCase();
  let visibleCount = 0;
  Array.from(tbody.rows).forEach((row) => {
    const matches = row.textContent.toLowerCase().includes(value);
    row.style.display = matches ? '' : 'none';
    if (matches) {
      visibleCount += 1;
    }
  });
  if (emptyState) {
    emptyState.hidden = visibleCount > 0;
  }
}

function sortRows(rows, columnIndex, direction) {
  const multiplier = direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const aCell = a.cells[columnIndex]?.textContent.trim() || '';
    const bCell = b.cells[columnIndex]?.textContent.trim() || '';
    const aNumber = parseNumber(aCell);
    const bNumber = parseNumber(bCell);

    if (!Number.isNaN(aNumber) && !Number.isNaN(bNumber)) {
      return (aNumber - bNumber) * multiplier;
    }
    return aCell.localeCompare(bCell, 'de', { sensitivity: 'base' }) * multiplier;
  });
}

function parseNumber(value) {
  const normalized = value.replace(/[^0-9,.-]/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  return parseFloat(normalized);
}
