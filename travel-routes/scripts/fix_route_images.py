#!/usr/bin/env python3
"""
Fix route images by replacing the "dice" placeholder with specific or generic Wikimedia images.
"""
import json
import pathlib

# The corrupted placeholder URL to look for
DICE_URL_PART = "PNG_transparency_demonstration_1.png"

# Generic fallback image (Chile Landscape)
GENERIC_IMAGE = {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Carretera_Austral_near_Villa_Cerro_Castillo.jpg/800px-Carretera_Austral_near_Villa_Cerro_Castillo.jpg",
    "caption": "Landschaft in Chile",
    "source": "Wikimedia Commons",
    "license": "CC BY-SA 2.0"
}

# Specific mappings based on keywords in caption or parent name
# Keys are lowercase keywords to match against caption/name
IMAGE_MAPPINGS = {
    "alameda": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Terminal_Alameda.jpg/800px-Terminal_Alameda.jpg",
        "caption": "Terminal Alameda, Santiago",
        "source": "Wikimedia Commons",
        "license": "CC BY-SA 3.0"
    },
    "santiago": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Santiago_de_Chile_Costanera_Center.jpg/800px-Santiago_de_Chile_Costanera_Center.jpg",
        "caption": "Santiago de Chile",
        "source": "Wikimedia Commons",
        "license": "CC BY-SA 3.0"
    },
    "valparaíso": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Cerro_Alegre_Streetart.jpg/800px-Cerro_Alegre_Streetart.jpg",
        "caption": "Valparaíso Cerro Alegre",
        "source": "Wikimedia Commons",
        "license": "CC BY-SA 4.0"
    },
    "cerro alegre": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Cerro_Alegre_Streetart.jpg/800px-Cerro_Alegre_Streetart.jpg",
        "caption": "Streetart im Cerro Alegre",
        "source": "Wikimedia Commons",
        "license": "CC BY-SA 4.0"
    },
    "casablanca": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Casablanca_Valley_Wine.jpg/800px-Casablanca_Valley_Wine.jpg",
        "caption": "Casablanca Valley Weingut",
        "source": "Wikimedia Commons",
        "license": "CC BY-SA 3.0"
    },
    "colchagua": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Colchagua_Wine_Cellars.jpg/800px-Colchagua_Wine_Cellars.jpg",
        "caption": "Colchagua Valley Weinkeller",
        "source": "Wikimedia Commons",
        "license": "CC BY-SA 4.0"
    },
    "san pedro": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Atardecer_en_la_valle_de_la_Luna.JPG/800px-Atardecer_en_la_valle_de_la_Luna.JPG",
        "caption": "San Pedro de Atacama / Valle de la Luna",
        "source": "Wikimedia Commons",
        "license": "CC BY-SA 4.0"
    },
    "atacama": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/The_Milky_Way_above_the_Atacama_Desert.jpg/800px-The_Milky_Way_above_the_Atacama_Desert.jpg",
        "caption": "Atacama Wüste",
        "source": "Wikimedia Commons",
        "license": "CC BY-SA 4.0"
    },
    "calama": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/ESO_Paranal_Observatory_at_night.jpg/800px-ESO_Paranal_Observatory_at_night.jpg",
        "caption": "Sternenhimmel in der Region Antofagasta",
        "source": "Wikimedia Commons",
        "license": "CC BY 4.0"
    },
    "pucón": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Villarrica_Volcano_Puc%C3%B3n.jpg/800px-Villarrica_Volcano_Puc%C3%B3n.jpg",
        "caption": "Vulkan Villarrica bei Pucón",
        "source": "Wikimedia Commons",
        "license": "CC BY-SA 2.0"
    },
    "villarrica": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Villarrica_Volcano_Puc%C3%B3n.jpg/800px-Villarrica_Volcano_Puc%C3%B3n.jpg",
        "caption": "Vulkan Villarrica",
        "source": "Wikimedia Commons",
        "license": "CC BY-SA 2.0"
    },
    "puerto varas": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Volcan_Osorno_Puerto_Varas.jpg/800px-Volcan_Osorno_Puerto_Varas.jpg",
        "caption": "Puerto Varas und Vulkan Osorno",
        "source": "Wikimedia Commons",
        "license": "CC BY-SA 3.0"
    },
    "chiloé": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Palafitos_de_Castro.jpg/800px-Palafitos_de_Castro.jpg",
        "caption": "Palafitos auf Chiloé",
        "source": "Wikimedia Commons",
        "license": "CC BY-SA 2.0"
    },
    "castro": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Palafitos_de_Castro.jpg/800px-Palafitos_de_Castro.jpg",
        "caption": "Palafitos in Castro",
        "source": "Wikimedia Commons",
        "license": "CC BY-SA 2.0"
    },
    "patagonia": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Torres_del_Paine_Three_Towers.jpg/800px-Torres_del_Paine_Three_Towers.jpg",
        "caption": "Patagonien / Torres del Paine",
        "source": "Wikimedia Commons",
        "license": "CC BY-SA 2.0"
    },
    "torres del paine": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Torres_del_Paine_Three_Towers.jpg/800px-Torres_del_Paine_Three_Towers.jpg",
        "caption": "Torres del Paine",
        "source": "Wikimedia Commons",
        "license": "CC BY-SA 2.0"
    },
    "punta arenas": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Magellanic_Penguins_Isla_Magdalena.jpg/800px-Magellanic_Penguins_Isla_Magdalena.jpg",
        "caption": "Pinguine bei Punta Arenas",
        "source": "Wikimedia Commons",
        "license": "CC BY-SA 3.0"
    }
}

def get_replacement_image(caption, context_text=""):
    """
    Find a replacement image based on caption or context keywords.
    """
    text_to_search = (str(caption) + " " + str(context_text)).lower()
    
    for keyword, image_data in IMAGE_MAPPINGS.items():
        if keyword in text_to_search:
            return image_data
            
    return GENERIC_IMAGE

def process_image_entry(entry, context_text=""):
    if "url" in entry and DICE_URL_PART in entry["url"]:
        # Found a dice image!
        replacement = get_replacement_image(entry.get("caption", ""), context_text)
        
        entry["url"] = replacement["url"]
        entry["source"] = replacement["source"]
        entry["license"] = replacement["license"]
        # Only update caption if it's generic or missing, otherwise keep specific caption
        if not entry.get("caption") or "Placeholder" in entry.get("caption", "") or "Stimmungsbild" in entry.get("caption", ""):
             entry["caption"] = replacement["caption"]
        
        return True
    return False

def update_json_file(path: pathlib.Path):
    with open(path, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            print(f"Error decoding {path}")
            return

    if not isinstance(data, dict):
        return

    modified = False

    def walk_images(container, context_name=""):
        nonlocal modified
        
        # Update context based on container name/title if available
        current_context = context_name
        if isinstance(container, dict):
            if "name" in container:
                current_context += " " + container["name"]
            if "title" in container:
                current_context += " " + container["title"]

        if isinstance(container, dict):
            # Check if this dict IS an image entry
            if "url" in container and ("caption" in container or "source" in container or "credit" in container):
                 if process_image_entry(container, current_context):
                     modified = True
            
            # Recurse
            for key, value in container.items():
                if isinstance(value, (dict, list)):
                    walk_images(value, current_context)
                    
        elif isinstance(container, list):
            for item in container:
                walk_images(item, current_context)

    walk_images(data)

    if modified:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Fixed images in {path.name}")
    else:
        # print(f"No dice images found in {path.name}")
        pass

def main():
    base_dir = pathlib.Path(__file__).resolve().parents[1] / "data" / "routes"
    print(f"Scanning {base_dir}...")
    for json_path in base_dir.rglob("*.json"):
        update_json_file(json_path)

if __name__ == "__main__":
    main()
