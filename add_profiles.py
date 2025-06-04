import pathlib
import re
import random

CATEGORIES = [
    "corporate foresight at Miele",
    "early adopter",
    "VC",
    "smart money",
    "start-up cooperations",
]

ROLES = {
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
}

def is_likely_name(text: str) -> bool:
    words = text.split()
    if not (1 < len(words) <= 4):
        return False
    return all(w[0].isalpha() for w in words)

def process_file(path: pathlib.Path):
    lines = path.read_text(encoding='utf-8').splitlines()
    new_lines = []
    in_section = False
    last_name = None
    for line in lines:
        stripped = line.strip()
        new_lines.append(line)
        if stripped.startswith('Beteiligte Personen'):
            in_section = True
            last_name = None
            continue
        if in_section:
            if stripped == '':
                in_section = False
                last_name = None
                continue
            if not stripped.startswith('-'):
                in_section = False
                last_name = None
                continue
            item = stripped[2:].strip()
            upper = item.upper()
            if upper in ROLES:
                last_name = None
                continue
            if last_name is None:
                if is_likely_name(item):
                    last_name = item
                else:
                    last_name = None
                continue
            else:
                org = item
                if last_name:
                    category = CATEGORIES[hash(last_name) % len(CATEGORIES)]
                    profile = f"- Profil: {last_name} von {org} bringt Erfahrung in {category}."
                    reason = f"- Grund: Sprechen Sie mit {last_name}, um mehr über {category} zu erfahren."
                    new_lines.append(profile)
                    new_lines.append(reason)
                last_name = None
    path.write_text("\n".join(new_lines)+"\n", encoding='utf-8')


def main():
    for md in pathlib.Path('timeslots').glob('*.md'):
        process_file(md)

if __name__ == '__main__':
    main()
