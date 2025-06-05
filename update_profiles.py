import pathlib
import re
import requests
from bs4 import BeautifulSoup

ROLES = {
    'PANEL', 'KEYNOTE', 'FIRESIDE CHAT', 'LIVE PODCAST', 'PITCH', 'IMPULS',
    'GASTGEBER', 'PAUSE', 'MASTERCLASS', 'MASTERCLASS RAUM 1', 'MASTERCLASS RAUM 2',
    'ROUNDTABLE', 'ROUNDTABLE RAUM 9', 'ROUNDTABLE RAUM 10 & 11'
}


def is_likely_name(text: str) -> bool:
    words = text.split()
    if not (1 < len(words) <= 4):
        return False
    return all(w[0].isalpha() for w in words)


def fetch_profile_snippet(name: str) -> str | None:
    url = 'https://duckduckgo.com/html/'
    params = {'q': name + ' linkedin'}
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        resp = requests.get(url, params=params, headers=headers, timeout=10)
    except Exception:
        return None
    soup = BeautifulSoup(resp.text, 'html.parser')
    snippet_tag = soup.find('a', class_='result__snippet')
    if snippet_tag:
        snippet = snippet_tag.get_text(' ', strip=True)
        snippet = ' '.join(snippet.split())
        words = snippet.split()
        if len(words) > 30:
            snippet = ' '.join(words[:30]) + '...'
        return snippet
    return None


def process_file(path: pathlib.Path):
    lines = path.read_text(encoding='utf-8').splitlines()
    new_lines: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        new_lines.append(line)
        if line.strip().startswith('Beteiligte Personen'):
            i += 1
            while i < len(lines):
                l = lines[i]
                if not l.startswith('-'):
                    break
                item = l[2:].strip()
                upper = item.upper()
                if item.lower() == 'n/a' or upper in ROLES:
                    new_lines.append(l)
                    i += 1
                    continue
                if is_likely_name(item):
                    name = item
                    new_lines.append(l)
                    i += 1
                    if i >= len(lines) or not lines[i].startswith('-'):
                        continue
                    new_lines.append(lines[i])  # organization
                    i += 1
                    old_profile = None
                    if i < len(lines) and lines[i].startswith('- Profil:'):
                        old_profile = lines[i]
                        i += 1
                    if i < len(lines) and lines[i].startswith('- Grund:'):
                        new_lines.append(lines[i])
                        i += 1
                    snippet = fetch_profile_snippet(name)
                    if snippet:
                        new_lines.append(f'- Profil: {snippet}')
                    elif old_profile:
                        new_lines.append(old_profile)
                    continue
                else:
                    new_lines.append(l)
                    i += 1
                    continue
            continue
        i += 1
    path.write_text('\n'.join(new_lines) + '\n', encoding='utf-8')


def main():
    for md in pathlib.Path('timeslots').glob('*.md'):
        process_file(md)


if __name__ == '__main__':
    main()
