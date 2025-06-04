import os
import re
import pathlib
import requests
from typing import List, Dict
from bs4 import BeautifulSoup

# WordPress page IDs for agenda and exhibition
AGENDA_PAGE = 6479
EXHIBITION_PAGE = 4286
BASE = "https://hinterlandofthings.com/de/wp-json/wp/v2/pages/{}"


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "item"


def fetch_html(page_id: int) -> str:
    url = BASE.format(page_id)
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    return data["content"]["rendered"]


def parse_timeslots(html: str) -> List[Dict[str, object]]:
    soup = BeautifulSoup(html, "lxml")
    headings = [h for h in soup.find_all("h2") if re.match(r"\d{1,2}:\d{2} UHR //", h.get_text(strip=True))]
    slots = []
    for idx, h in enumerate(headings):
        start = re.match(r"(\d{1,2}:\d{2})", h.get_text(strip=True)).group(1)
        end = ""
        if idx + 1 < len(headings):
            end = re.match(r"(\d{1,2}:\d{2})", headings[idx + 1].get_text(strip=True)).group(1)
        title = ""
        meta: List[str] = []
        for el in h.find_all_next():
            if el == headings[idx + 1] if idx + 1 < len(headings) else None:
                break
            if not title and el.name == "h2":
                title = el.get_text(" ", strip=True)
            elif el.name == "h2":
                meta.append(el.get_text(" ", strip=True))
            elif el.name == "p":
                text = el.get_text(" ", strip=True)
                if text:
                    meta.append(text)
        slots.append({"start": start, "end": end, "title": title, "meta": meta})
    return slots


def parse_startups(html: str) -> List[Dict[str, str]]:
    soup = BeautifulSoup(html, "lxml")
    startups = []
    for details in soup.find_all("details"):
        summary = details.find("summary")
        if not summary:
            continue
        text = summary.get_text(strip=True)
        m = re.search(r"(?:ÜBER|ABOUT)\s+(.+)", text, re.IGNORECASE)
        name = m.group(1).strip() if m else text
        desc = " ".join(p.get_text(" ", strip=True) for p in details.find_all("p"))
        if name and desc:
            startups.append({"name": name, "description": desc})
    return startups


def write_timeslot_files(slots: List[Dict[str, object]], out_dir: str = "timeslots"):
    os.makedirs(out_dir, exist_ok=True)
    for idx, slot in enumerate(slots, 1):
        slug = f"{idx:02d}-{slugify(slot['title'])}"
        path = pathlib.Path(out_dir) / f"{slug}.md"
        agenda = f"{slot['start']} - {slot['end']}" if slot['end'] else slot['start']
        with open(path, "w", encoding="utf-8") as f:
            f.write(f"# {slot['title']}\n")
            f.write(f"Thema: {slot['title']}\n")
            f.write(f"Agenda: {agenda}\n")
            if slot["meta"]:
                f.write("Beteiligte Personen:\n")
                for m in slot["meta"]:
                    f.write(f"- {m}\n")
            else:
                f.write("Beteiligte Personen: n/a\n")
            f.write(f"\nStart: {slot['start']}\n")
            f.write(f"End: {slot['end']}\n")


def write_startup_files(startups: List[Dict[str, str]], out_dir: str = "startups_split"):
    os.makedirs(out_dir, exist_ok=True)
    for startup in startups:
        slug = slugify(startup["name"])
        path = pathlib.Path(out_dir) / f"{slug}.md"
        with open(path, "w", encoding="utf-8") as f:
            f.write(f"# {startup['name']}\n")
            f.write(f"Thema: {startup['name']}\n")
            f.write("Agenda: n/a\n")
            f.write("Beteiligte Personen: n/a\n")
            f.write("\nStart: n/a\nEnd: n/a\n\n")
            f.write(startup["description"] + "\n")


def write_lists(slots: List[Dict[str, object]], startups: List[Dict[str, str]]):
    with open("agenda_timeslots.md", "w", encoding="utf-8") as f:
        for s in slots:
            f.write(f"## {s['start']} UHR //\n")
            f.write(f"- {s['title']}\n")
            for m in s["meta"]:
                f.write(f"- {m}\n")
            f.write("\n")
    with open("startups.md", "w", encoding="utf-8") as f:
        for su in startups:
            f.write(f"## {su['name']}\n")
            f.write(su['description'] + "\n\n")


if __name__ == "__main__":
    agenda_html = fetch_html(AGENDA_PAGE)
    exhibition_html = fetch_html(EXHIBITION_PAGE)
    slots = parse_timeslots(agenda_html)
    startups = parse_startups(exhibition_html)
    write_lists(slots, startups)
    write_timeslot_files(slots)
    write_startup_files(startups)
