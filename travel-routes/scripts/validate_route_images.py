#!/usr/bin/env python3
"""Validate that all image URLs in route JSON files are from Wikimedia Commons.
Prints any files and entries that still have non‑Wikimedia URLs.
"""
import json, pathlib, sys

def is_wikimedia(url):
    return "commons.wikimedia.org" in url or "upload.wikimedia.org" in url

def check_file(path: pathlib.Path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        return []
    issues = []
    def walk(container, location=""):
        if isinstance(container, dict):
            # Identify image dicts by presence of 'url' and either 'caption' or 'source'
            if "url" in container and ("caption" in container or "source" in container):
                if not is_wikimedia(container["url"]):
                    issues.append((location, container["url"]))
            for k, v in container.items():
                walk(v, f"{location}/{k}" if location else k)
        elif isinstance(container, list):
            for i, item in enumerate(container):
                walk(item, f"{location}[{i}]")
    walk(data)
    return issues

def main():
    base = pathlib.Path(__file__).resolve().parents[2] / "travel-routes" / "data" / "routes"
    bad = False
    for p in base.rglob("*.json"):
        issues = check_file(p)
        if issues:
            bad = True
            print(f"Non‑Wikimedia URLs in {p}:")
            for loc, url in issues:
                print(f"  {loc}: {url}")
    if not bad:
        print("All image URLs are from Wikimedia Commons.")

if __name__ == "__main__":
    main()
