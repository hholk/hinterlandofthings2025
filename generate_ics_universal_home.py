import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from bs4 import BeautifulSoup

INPUT_HTML = 'universal-home.html'
OUTPUT_HTML = 'universal-home.html'
ICS_DIR = 'ics'

os.makedirs(ICS_DIR, exist_ok=True)

with open(INPUT_HTML, 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f, 'html.parser')

# Helper to slugify title to filename
def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')[:60]

# Parse time string like '11.06.2025 | 18:00-19:00' or with 'ca.' or 'ab '
def parse_datetimes(time_text):
    date_part, time_part = time_text.split('|')
    date_part = date_part.strip()
    time_part = time_part.strip()
    time_part = time_part.replace('ca.', '').replace('ab', '').strip()

    if '–' in time_part:
        start_str, end_str = [t.strip() for t in time_part.split('–', 1)]
    elif '-' in time_part:
        start_str, end_str = [t.strip() for t in time_part.split('-', 1)]
    else:
        start_str, end_str = time_part, None

    start_dt = datetime.strptime(f"{date_part} {start_str}", '%d.%m.%Y %H:%M')
    if end_str:
        end_dt = datetime.strptime(f"{date_part} {end_str}", '%d.%m.%Y %H:%M')
        if end_dt < start_dt:
            end_dt += timedelta(days=1)
    else:
        end_dt = start_dt + timedelta(hours=1)

    return start_dt, end_dt

for card in soup.find_all('div', class_='event-card'):
    time_text = card.find('div', class_='event-time').get_text(strip=True)
    title = card.find('h2', class_='event-title').get_text(strip=True)
    speaker = card.find('div', class_='event-speaker').get_text(strip=True)
    description = card.find('p', class_='event-description').get_text(strip=True)
    start_dt, end_dt = parse_datetimes(time_text)
    uid = str(uuid.uuid4()) + '@universal-home.de'
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    ics_content = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Universal Home//49. Meeting//DE
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART:{start_dt.strftime('%Y%m%dT%H%M%S')}
DTEND:{end_dt.strftime('%Y%m%dT%H%M%S')}
DTSTAMP:{stamp}
UID:{uid}
CREATED:{stamp}
DESCRIPTION:{description}
SUMMARY:{title}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR
"""
    filename = os.path.join(ICS_DIR, slugify(f"{start_dt.strftime('%Y%m%d%H%M')}-{title}") + '.ics')
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(ics_content)
    link = filename
    card.find('a', class_='ics-link')['href'] = link

with open(OUTPUT_HTML, 'w', encoding='utf-8') as f:
    f.write(str(soup))
