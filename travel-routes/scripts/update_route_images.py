#!/usr/bin/env python3
"""Update route JSON image URLs.

This script scans all JSON files under `travel-routes/data/routes`.
For each image entry (in various sections), if the `url` does not contain
`commons.wikimedia.org` or `upload.wikimedia.org`, it replaces it with a
placeholder Wikimedia Commons image and updates `caption`, `source`, and
`license` fields.
It also ensures that each image list has at least one entry; if empty,
it adds a generic placeholder.

The placeholder image used is a public domain PNG from Wikimedia Commons.
"""
import json
import os
import pathlib

PLACEHOLDER = {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/800px-PNG_transparency_demonstration_1.png",
    "caption": "Placeholder image",
    "source": "Wikimedia Commons",
    "license": "CC0"
}

def is_wikimedia(url: str) -> bool:
    return "commons.wikimedia.org" in url or "upload.wikimedia.org" in url

def process_image_entry(entry: dict) -> dict:
    if not is_wikimedia(entry.get("url", "")):
        # Replace with placeholder while preserving original caption if possible
        new_entry = PLACEHOLDER.copy()
        # Keep original caption if it exists
        if entry.get("caption"):
            new_entry["caption"] = entry["caption"]
        return new_entry
    return entry

def ensure_list(lst):
    return lst if isinstance(lst, list) else []

def update_json_file(path: pathlib.Path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    # Skip files where the JSON root is a list (e.g., route collections)
    if not isinstance(data, dict):
        print(f"Skipping {path} (root is not a dict)")
        return
    modified = False

    # Helper to walk through known image containers
    def walk_images(container):
        nonlocal modified
        if isinstance(container, dict):
            # Only replace if it looks like an image entry: has 'url' AND ('caption' OR 'source' OR 'credit')
            # AND it is NOT a website link (which usually doesn't have caption/credit in the same dict)
            if "url" in container and ("caption" in container or "source" in container or "credit" in container):
                if not is_wikimedia(container.get("url", "")):
                    new_img = process_image_entry(container)
                    if new_img != container:
                        container.clear()
                        container.update(new_img)
                        modified = True
            
            # Recurse into all values
            for key, value in list(container.items()):
                if key == "images" and isinstance(value, list):
                    if not value:
                        container[key] = [PLACEHOLDER.copy()]
                        modified = True
                    else:
                        new_imgs = []
                        for img in value:
                            new_img = process_image_entry(img)
                            new_imgs.append(new_img)
                        if new_imgs != value:
                            if "chile-route-4-patagonia-sur-2026" in str(path):
                                print(f"DEBUG: Modifying images list in {path}")
                                print(f"Old: {value[0].get('url')}")
                                print(f"New: {new_imgs[0].get('url')}")
                            container[key] = new_imgs
                            modified = True
                elif key == "photos" and isinstance(value, list):
                    new_imgs = []
                    for img in value:
                        new_img = process_image_entry(img)
                        new_imgs.append(new_img)
                    if new_imgs != value:
                        container[key] = new_imgs
                        modified = True
                else:
                    walk_images(value)
        elif isinstance(container, list):
            for item in container:
                walk_images(item)

    # Sections to process
    # meta.highlightImages
    if "meta" in data and isinstance(data["meta"], dict):
        if "highlightImages" in data["meta"]:
            walk_images({"images": data["meta"]["highlightImages"]})
            data["meta"]["highlightImages"] = data["meta"]["highlightImages"]
    # days -> station, arrival.segments, arrival.mapPoints
    for day in data.get("days", []):
        station = day.get("station", {})
        walk_images(station)
        arrival = day.get("arrival", {})
        for seg in arrival.get("segments", []):
            walk_images(seg)
        for mp in arrival.get("mapPoints", []):
            walk_images(mp)
    # stops[].photos
    for stop in data.get("stops", []):
        walk_images(stop)
    # lodging[].images
    for lodge in data.get("lodging", []):
        walk_images(lodge)
    # food[].images
    for food in data.get("food", []):
        walk_images(food)

    if modified:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Updated {path}")
    else:
        print(f"No changes needed for {path}")

def main():
    base_dir = pathlib.Path(__file__).resolve().parents[2] / "travel-routes" / "data" / "routes"
    for json_path in base_dir.rglob("*.json"):
        update_json_file(json_path)

if __name__ == "__main__":
    main()
