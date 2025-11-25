#!/usr/bin/env python3
"""Enrich route JSONs with Wikimedia images.

This script iterates over all route JSON files, and for each day/segment,
it searches Wikimedia Commons for images related to the station name.
It aims to add up to 10 images per segment.
"""
import json
import pathlib
import json
import pathlib
import urllib.request
import urllib.parse
import urllib.error
import time

def search_wikimedia_images(query, limit=10):
    """Search for images on Wikimedia Commons using urllib."""
    base_url = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrnamespace": 6,  # File namespace
        "gsrsearch": f"filetype:bitmap {query}",
        "gsrlimit": limit,
        "prop": "imageinfo",
        "iiprop": "url|extmetadata",
        "iiurlwidth": 800
    }
    
    # Construct query string manually
    query_string = urllib.parse.urlencode(params)
    url = f"{base_url}?{query_string}"
    
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "HinterlandBot/1.0"})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode("utf-8"))
        
        images = []
        if "query" in data and "pages" in data["query"]:
            for page_id, page in data["query"]["pages"].items():
                if "imageinfo" in page:
                    info = page["imageinfo"][0]
                    meta = info.get("extmetadata", {})
                    
                    # Extract useful metadata
                    caption = meta.get("ObjectName", {}).get("value", "")
                    if not caption:
                        caption = page.get("title", "").replace("File:", "")
                    
                    # Clean up caption (remove file extension, etc.)
                    caption = caption.split(".")[0]
                    
                    credit = meta.get("Artist", {}).get("value", "Wikimedia Commons")
                    # Remove HTML tags from credit if simple
                    
                    img_entry = {
                        "url": info.get("thumburl", info.get("url")),
                        "caption": caption[:100], # Limit caption length
                        "source": "Wikimedia Commons",
                        "license": meta.get("UsageTerms", {}).get("value", "Public Domain")
                    }
                    images.append(img_entry)
        return images
    except Exception as e:
        print(f"Error searching for {query}: {e}")
        return []

def enrich_route_file(path: pathlib.Path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    modified = False
    
    if "days" in data:
        for day in data["days"]:
            station = day.get("station", {})
            station_name = station.get("name", "")
            
            if station_name:
                # Clean station name for search
                search_query = station_name.replace("Ankunft", "").replace("Abflug", "").replace("Boarding", "").strip()
                
                # Enhance query context
                if "Navimag" in station_name:
                    search_query = "Navimag ferry Patagonia"
                elif "Pichilemu" in station_name:
                    search_query = "Pichilemu Chile surf beach"
                elif "Bahía Inglesa" in station_name:
                    search_query = "Bahía Inglesa Chile beach"
                elif "Chile" not in search_query and "Patagonia" not in search_query:
                    search_query += " Chile tourism landscape"

                print(f"Searching images for: {search_query}")
                # Fetch more candidates to ensure we get 20 good ones
                new_images = search_wikimedia_images(search_query, limit=30) 
                
                if new_images:
                    current_images = station.get("images", [])
                    # Avoid duplicates by URL
                    existing_urls = {img.get("url") for img in current_images}
                    
                    count_added = 0
                    for img in new_images:
                        if img["url"] not in existing_urls and len(current_images) < 20:
                            current_images.append(img)
                            existing_urls.add(img["url"])
                            count_added += 1
                    
                    if count_added > 0:
                        station["images"] = current_images
                        modified = True
                        print(f"  Added {count_added} images to {station_name}")
            
            # Also enrich activities if they have few images
            for activity in day.get("activities", []):
                if not activity.get("images"):
                    act_name = activity.get("name", "")
                    if act_name:
                        # Enhance activity search
                        act_query = act_name
                        if "Chile" not in act_query:
                             act_query += " Chile"
                        
                        print(f"  Searching activity: {act_query}")
                        act_images = search_wikimedia_images(act_query, limit=5)
                        if act_images:
                            activity["images"] = act_images
                            modified = True

    if modified:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Updated {path}")

def main():
    base_dir = pathlib.Path(__file__).resolve().parents[2] / "travel-routes" / "data" / "routes"
    # Only process the new routes we just created
    target_files = [
        "route-1-classic-fjords.json",
        "route-2-volcanoes-glaciers.json",
        "route-3-desert-ice.json",
        "route-4-wine-dine-sail.json",
        "route-5-grand-adventure.json",
        "route-6-patagonia-road-sail.json"
    ]
    
    for filename in target_files:
        file_path = base_dir / filename
        if file_path.exists():
            print(f"Processing {filename}...")
            enrich_route_file(file_path)
            time.sleep(1) # Be nice to the API

if __name__ == "__main__":
    main()
