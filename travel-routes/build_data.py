"""Hilfsskript zum Generieren der Travel-Routes-Daten als JSON."""

from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime
from math import asin, cos, radians, sin, sqrt
from pathlib import Path


def haversine_km(coord_a: dict, coord_b: dict) -> float:
    """Berechne die Distanz zwischen zwei Koordinatenpaaren in Kilometern."""

    lat1 = radians(coord_a["lat"])
    lon1 = radians(coord_a["lng"])
    lat2 = radians(coord_b["lat"])
    lon2 = radians(coord_b["lng"])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(min(1, sqrt(a)))
    return 6371 * c


def deep_merge(target: dict, extra: dict) -> dict:
    """Merge nested dictionaries without clobbering existing structures."""

    for key, value in extra.items():
        if isinstance(value, dict) and isinstance(target.get(key), dict):
            deep_merge(target[key], value)
        else:
            target[key] = value
    return target


META = {
    "title": "Chile – Interaktive Reiserouten",
    "subtitle": "Modulares Toolkit für 7 kuratierte Varianten plus eigene Entwürfe",
    "defaultDurationDays": 19,
    "currency": "EUR",
    "editor": {
        "localStorageKey": "travel-routes.custom",
        "notesKey": "travel-routes.notes",
    },
    "map": {
        "center": [-30, -71],
        "zoom": 4,
        "tileLayer": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "attribution": "© OpenStreetMap",
    },
}

TRANSPORT_MODES = {
    "drive": {
        "label": "Mietwagen",
        "color": "#5bd1ff",
        "dashArray": None,
        "icon": "🚗",
        "description": "Flexibel unterwegs per Mietwagen – ideal für Tagesausflüge und Hidden Gems.",
        "averageSpeedKmh": 75,
        "carbonPerKm": 0.192,
    },
    "bus": {
        "label": "Fernbus",
        "color": "#ffd35b",
        "dashArray": "8 6",
        "icon": "🚌",
        "description": "Komfortable Langstreckenbusse mit Liegesitzen und WLAN.",
        "averageSpeedKmh": 60,
        "carbonPerKm": 0.05,
    },
    "flight": {
        "label": "Flug",
        "color": "#c792ea",
        "dashArray": "4 6",
        "icon": "✈️",
        "description": "Inlandsflüge überbrücken große Distanzen in kurzer Zeit.",
        "averageSpeedKmh": 740,
        "carbonPerKm": 0.285,
    },
    "walk": {
        "label": "Zu Fuß",
        "color": "#8affc1",
        "dashArray": "2 6",
        "icon": "🥾",
        "description": "Entspannt zu Fuß oder per Trekking unterwegs.",
        "averageSpeedKmh": 4,
        "carbonPerKm": 0.0,
    },
    "ferry": {
        "label": "Fähre",
        "color": "#66d9ef",
        "dashArray": "1 4",
        "icon": "⛴️",
        "description": "Fähren verbinden Inseln und Festland mit Panoramablicken.",
        "averageSpeedKmh": 30,
        "carbonPerKm": 0.18,
    },
}

CARBON_FACTORS = {mode: cfg["carbonPerKm"] for mode, cfg in TRANSPORT_MODES.items()}

TAG_LIBRARY = [
    {"id": "culture", "label": "Kultur"},
    {"id": "nature", "label": "Natur"},
    {"id": "wine", "label": "Wein"},
    {"id": "budget", "label": "Budget"},
    {"id": "honeymoon", "label": "Honeymoon"},
    {"id": "adventure", "label": "Abenteuer"},
    {"id": "photography", "label": "Fotografie"},
    {"id": "food", "label": "Food"},
]

GALLERY = [
    {
        "id": "atacama",
        "title": "Valle de la Luna",
        "caption": "Mondlandschaft bei goldenem Licht",
        "image": "https://images.unsplash.com/photo-1595981267035-7b6b9c4f0a8a?q=80&w=600&auto=format&fit=crop",
        "source": "Unsplash",
        "sourceUrl": "https://unsplash.com/photos/Valle-de-la-Luna",
        "credit": "Diego Jimenez",
        "license": "Unsplash License",
    },
    {
        "id": "torres",
        "title": "Torres del Paine",
        "caption": "Morgendämmerung am Base de las Torres Trail",
        "image": "https://images.unsplash.com/photo-1544989164-31dc3c645987?q=80&w=600&auto=format&fit=crop",
        "source": "Unsplash",
        "sourceUrl": "https://unsplash.com/photos/torres-del-paine",
        "credit": "Jonatan Pie",
        "license": "Unsplash License",
    },
    {
        "id": "valparaiso",
        "title": "Streetart Valparaíso",
        "caption": "Bunte Murals in den Cerros",
        "image": "https://images.unsplash.com/photo-1558981800-ec0bd3b4f3fd?q=80&w=600&auto=format&fit=crop",
        "source": "Unsplash",
        "sourceUrl": "https://unsplash.com/photos/valparaiso",
        "credit": "Liam Gant",
        "license": "Unsplash License",
    },
    {
        "id": "rapa-nui",
        "title": "Ahu Tongariki",
        "caption": "Moai im Morgenlicht",
        "image": "https://images.unsplash.com/photo-1589735552861-4d7e34fdf2c1?q=80&w=600&auto=format&fit=crop",
        "source": "Unsplash",
        "sourceUrl": "https://unsplash.com/photos/moai",
        "credit": "Thomas Griggs",
        "license": "Unsplash License",
    },
]

EVENTS = [
    {
        "id": "santiago-a-mil",
        "title": "Santiago a Mil Festival",
        "date": "03.–21. Januar",
        "location": "Santiago de Chile",
        "coordinates": [-33.45, -70.67],
        "website": "https://www.santiagoamil.cl/",
        "description": "Das größte Theaterfestival Lateinamerikas mit Performances im gesamten Stadtgebiet.",
    },
    {
        "id": "providencia-jazz",
        "title": "Providencia Jazz",
        "date": "Mitte Januar",
        "location": "Parque de las Esculturas, Santiago",
        "coordinates": [-33.41, -70.61],
        "website": "https://www.providencia.cl/",
        "description": "Kostenloses Open-Air-Jazzfestival direkt am Mapocho-Fluss.",
    },
    {
        "id": "chiloe-feria",
        "title": "Ferias Costumbristas",
        "date": "Januar",
        "location": "Chiloé Inseln",
        "coordinates": [-42.48, -73.76],
        "website": "https://www.chiloe.travel/",
        "description": "Regionale Märkte mit Meeresfrüchten, Holzschnitzkunst und Live-Musik.",
    },
]

TEMPLATES = {
    "blankRoute": {
        "id": "custom-blank",
        "name": "Neue Route",
        "color": "#5bd1ff",
        "tags": [],
        "summary": "Starte mit einer leeren Leinwand und füge nach und nach Stopps, Flüge und Kosten hinzu.",
        "meta": {
            "theme": "Individuell",
            "pace": "flexibel",
            "durationDays": 7,
            "costEstimate": 0,
            "highlights": [],
            "scores": {"budget": 3, "adventure": 3, "relax": 3, "culture": 3},
        },
        "stops": [],
        "segments": [],
        "flights": [],
        "lodging": [],
        "food": [],
        "activities": [],
        "notes": "",
    }
}

STOPS: dict[str, dict] = {
    "scl-airport": {
        "id": "scl-airport",
        "name": "Santiago International Airport (SCL)",
        "type": "airport",
        "coordinates": {"lat": -33.3929, "lng": -70.7858},
        "city": "Santiago",
        "address": {
            "street": "Armando Cortínez Norte 1701",
            "city": "Pudahuel",
            "country": "Chile",
        },
        "website": "https://www.nuevopudahuel.cl",
        "contact": {"phone": "+56 2 2690 1707"},
        "openingHours": "24/7",
        "popularFor": ["Internationaler Hub", "Duty-free Einkauf"],
        "tips": [
            "Online-Check-in spart Wartezeit.",
            "TurBus und Centropuerto fahren alle 20 Minuten ins Zentrum.",
        ],
    },
    "terminal-alameda": {
        "id": "terminal-alameda",
        "name": "Terminal Alameda",
        "type": "bus",
        "coordinates": {"lat": -33.4576, "lng": -70.6621},
        "city": "Santiago",
        "address": {
            "street": "Av. Libertador Bernardo O'Higgins 3850",
            "city": "Estación Central",
            "country": "Chile",
        },
        "openingHours": "05:00–23:30",
        "website": "https://www.turbus.cl",
        "popularFor": ["Fernbusse Richtung Küste & Süden"],
        "tips": ["Ticket vorab in der App sichern, um Wartezeiten zu vermeiden."],
    },
    "valparaiso-center": {
        "id": "valparaiso-center",
        "name": "Valparaíso – Cerro Alegre",
        "type": "poi",
        "coordinates": {"lat": -33.0458, "lng": -71.6197},
        "city": "Valparaíso",
        "address": {
            "street": "Pasaje Gálvez",
            "city": "Valparaíso",
            "country": "Chile",
        },
        "openingHours": "Immer offen",
        "popularFor": ["Streetart", "Aufzüge", "Cafés"],
        "tips": ["Free-Walking-Tour um 10:00 Uhr am Plaza Sotomayor."],
    },
    "vina-del-mar": {
        "id": "vina-del-mar",
        "name": "Viña del Mar – Playa Acapulco",
        "type": "beach",
        "coordinates": {"lat": -33.0153, "lng": -71.55},
        "city": "Viña del Mar",
        "popularFor": ["Strandtage", "Sonnenuntergänge"],
        "tips": ["Windjacke einpacken, der Humboldtstrom kühlt die Luft."],
    },
    "ipc-airport": {
        "id": "ipc-airport",
        "name": "Mataveri International Airport (IPC)",
        "type": "airport",
        "coordinates": {"lat": -27.1648, "lng": -109.4216},
        "city": "Hanga Roa",
        "openingHours": "06:00–22:00",
        "website": "https://www.deachile.cl/aeropuerto-rapa-nui",
    },
    "hanga-roa-lodge": {
        "id": "hanga-roa-lodge",
        "name": "Hanga Roa Eco Lodge",
        "type": "hotel",
        "coordinates": {"lat": -27.15, "lng": -109.428},
        "address": {
            "street": "Av. Pont s/n",
            "city": "Hanga Roa",
            "country": "Chile",
        },
        "website": "https://www.hangaroa.cl",
        "openingHours": "Check-in ab 15:00",
        "popularFor": ["Bungalows", "Spa"],
    },
    "rano-raraku": {
        "id": "rano-raraku",
        "name": "Rano Raraku Vulkan",
        "type": "trail",
        "coordinates": {"lat": -27.1251, "lng": -109.2798},
        "openingHours": "09:00–18:00",
        "website": "https://www.gob.cl/rapanui",
        "tips": ["Sonnenhut & Wasser mitnehmen."],
    },
    "cjc-airport": {
        "id": "cjc-airport",
        "name": "Calama Airport (CJC)",
        "type": "airport",
        "coordinates": {"lat": -22.4989, "lng": -68.903},
        "openingHours": "05:00–23:00",
    },
    "san-pedro": {
        "id": "san-pedro",
        "name": "San Pedro de Atacama",
        "type": "town",
        "coordinates": {"lat": -22.911, "lng": -68.203},
        "popularFor": ["Touren ins Valle de la Luna", "Geysire del Tatio"],
        "tips": ["Tourtickets mindestens einen Tag vorher sichern."],
    },
    "valle-luna": {
        "id": "valle-luna",
        "name": "Valle de la Luna",
        "type": "trail",
        "coordinates": {"lat": -23.071, "lng": -68.308},
        "openingHours": "09:00–17:00",
    },
    "pichilemu": {
        "id": "pichilemu",
        "name": "Pichilemu Zentrum",
        "type": "town",
        "coordinates": {"lat": -34.3866, "lng": -72.0062},
        "popularFor": ["Surfen", "Strandcafés"],
    },
    "punta-lobos": {
        "id": "punta-lobos",
        "name": "Punta de Lobos",
        "type": "trail",
        "coordinates": {"lat": -34.4028, "lng": -72.0279},
        "popularFor": ["Wellenreiten", "Aussichtspunkt"],
    },
    "santiago-center": {
        "id": "santiago-center",
        "name": "Santiago – Barrio Lastarria",
        "type": "poi",
        "coordinates": {"lat": -33.439, "lng": -70.644},
        "popularFor": ["Museen", "Food Market"],
    },
    "punta-arenas-airport": {
        "id": "punta-arenas-airport",
        "name": "Punta Arenas Airport (PUQ)",
        "type": "airport",
        "coordinates": {"lat": -53.1351, "lng": -70.8786},
    },
    "puerto-natales": {
        "id": "puerto-natales",
        "name": "Puerto Natales",
        "type": "town",
        "coordinates": {"lat": -51.7245, "lng": -72.5079},
    },
    "torres-base": {
        "id": "torres-base",
        "name": "Torres del Paine – Base Torres",
        "type": "trail",
        "coordinates": {"lat": -50.9741, "lng": -72.8472},
        "openingHours": "06:00–20:00",
    },
    "pucon": {
        "id": "pucon",
        "name": "Pucón – Huerquehue Trailhead",
        "type": "trail",
        "coordinates": {"lat": -39.165, "lng": -71.708},
    },
    "puerto-varas": {
        "id": "puerto-varas",
        "name": "Puerto Varas",
        "type": "town",
        "coordinates": {"lat": -41.318, "lng": -72.983},
    },
    "castro": {
        "id": "castro",
        "name": "Castro – Palafitos",
        "type": "poi",
        "coordinates": {"lat": -42.481, "lng": -73.762},
    },
    "puerto-montt-airport": {
        "id": "puerto-montt-airport",
        "name": "Puerto Montt Airport (PMC)",
        "type": "airport",
        "coordinates": {"lat": -41.4389, "lng": -73.0939},
    },
    "la-serena": {
        "id": "la-serena",
        "name": "La Serena",
        "type": "town",
        "coordinates": {"lat": -29.904, "lng": -71.2489},
    },
    "vicuna": {
        "id": "vicuna",
        "name": "Vicuña",
        "type": "town",
        "coordinates": {"lat": -30.0319, "lng": -70.7081},
    },
    "antofagasta": {
        "id": "antofagasta",
        "name": "Antofagasta – Hand des Desierto",
        "type": "poi",
        "coordinates": {"lat": -24.1589, "lng": -70.1614},
    },
    "santa-cruz": {
        "id": "santa-cruz",
        "name": "Santa Cruz – Colchagua",
        "type": "town",
        "coordinates": {"lat": -34.6394, "lng": -71.3657},
    },
    "talca": {
        "id": "talca",
        "name": "Talca – Altos de Lircay",
        "type": "trail",
        "coordinates": {"lat": -35.596, "lng": -71.043},
    },
    "concepcion": {
        "id": "concepcion",
        "name": "Concepción – Mercado Central",
        "type": "food",
        "coordinates": {"lat": -36.828, "lng": -73.051},
    },
    "colchagua-lodge": {
        "id": "colchagua-lodge",
        "name": "Colchagua Weinlodge",
        "type": "hotel",
        "coordinates": {"lat": -34.6394, "lng": -71.3657},
    },
    "cajon-maipo": {
        "id": "cajon-maipo",
        "name": "Cajón del Maipo – Thermen",
        "type": "trail",
        "coordinates": {"lat": -33.65, "lng": -70.17},
    },
    "san-pedro-boutique": {
        "id": "san-pedro-boutique",
        "name": "San Pedro Boutiquehotel",
        "type": "hotel",
        "coordinates": {"lat": -22.914, "lng": -68.203},
    },
    "torres-ecocamp": {
        "id": "torres-ecocamp",
        "name": "EcoCamp Patagonia",
        "type": "hotel",
        "coordinates": {"lat": -51.1086, "lng": -72.9996},
    },
}

STOP_ENRICHMENTS = {
    "scl-airport": {
        "description": "Hauptdrehscheibe Chiles mit direkter Metro-Busanbindung und modernem Terminal 2.",
        "timezone": "America/Santiago",
        "category": ["Airport", "Transport"],
        "rating": 4.3,
        "reviewCount": 18942,
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=600&auto=format&fit=crop",
                "caption": "Check-in Halle des SCL Flughafens",
                "credit": "Daniel Vargas",
                "license": "Unsplash License",
            }
        ],
        "contact": {
            "email": "info@nuevopudahuel.cl",
            "instagram": "https://www.instagram.com/aeropuertodesantiago/",
        },
        "services": {
            "transport": ["Centropuerto Shuttle", "TurBus", "Cabify Pick-up"],
            "amenities": ["Kostenloses WLAN", "VIP-Lounges", "Duschen"],
        },
        "knowledge": {
            "bestTime": "Check-in spätestens 2 Stunden vor Abflug, internationale Flüge 3 Stunden.",
            "security": "Sicherheitskontrollen liegen im zweiten Stock, Flüssigkeiten max. 100 ml.",
        },
    },
    "terminal-alameda": {
        "description": "Größter Fernbusbahnhof Santiagos mit Shops, Gepäckaufbewahrung und 24/7-Kiosken.",
        "timezone": "America/Santiago",
        "category": ["Bus Station"],
        "rating": 3.9,
        "reviewCount": 14210,
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=600&auto=format&fit=crop",
                "caption": "Abfahrtsbereich Terminal Alameda",
                "credit": "Alejandro Barba",
                "license": "Unsplash License",
            }
        ],
        "contact": {
            "phone": "+56 2 2582 0000",
            "email": "atencion@turbus.cl",
        },
        "services": {
            "transport": ["TurBus", "Pullman", "Condor Bus"],
            "amenities": ["Schließfächer", "Wi-Fi Hotspots", "Geldautomaten"],
        },
        "knowledge": {
            "bestTime": "Späten Nachmittag meiden – Rush Hour. Tickets digital bereithalten.",
        },
    },
    "valparaiso-center": {
        "description": "Historische Hügel mit Straßenkunst, Boutiquen und Aussicht auf die Bucht.",
        "timezone": "America/Santiago",
        "category": ["Historic Quarter", "Viewpoint"],
        "rating": 4.7,
        "reviewCount": 25678,
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1526402462922-1e1d481d87fd?w=600&auto=format&fit=crop",
                "caption": "Bunte Häuser im Cerro Alegre",
                "credit": "Fabiola Peñailillo",
                "license": "Unsplash License",
            }
        ],
        "contact": {
            "instagram": "https://www.instagram.com/visitvalparaiso/",
        },
        "services": {
            "transport": ["Ascensor El Peral", "Trolebus"],
            "amenities": ["Galerien", "Cafés", "Aussichtsplattformen"],
        },
        "knowledge": {
            "bestTime": "Frühmorgens für Fotos ohne Menschenmengen.",
            "safety": "Nachts in Gruppen unterwegs sein, da Kopfsteinpflaster rutschig werden kann.",
        },
    },
    "vina-del-mar": {
        "description": "Beliebter Stadtstrand mit Promenade, Sonnenuntergangs- und Surfspots.",
        "timezone": "America/Santiago",
        "category": ["Beach"],
        "rating": 4.5,
        "reviewCount": 18650,
        "address": {
            "street": "Av. San Martín 200",
            "city": "Viña del Mar",
            "country": "Chile",
        },
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1526401485004-46910ecc8e51?w=600&auto=format&fit=crop",
                "caption": "Strandpromenade von Viña del Mar",
                "credit": "Ricardo Gomez",
                "license": "Unsplash License",
            }
        ],
        "services": {
            "amenities": ["Liegenverleih", "Lifeguards", "Beachvolleyball"],
        },
        "knowledge": {
            "bestTime": "Sonnenuntergang gegen 20:45 Uhr im Januar.",
        },
    },
    "ipc-airport": {
        "description": "Abgeschiedener Insel-Airport auf Rapa Nui mit einer der längsten Pisten im Pazifik.",
        "timezone": "Pacific/Easter",
        "category": ["Airport", "Island"],
        "rating": 4.4,
        "reviewCount": 4120,
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=600&auto=format&fit=crop",
                "caption": "Anflug auf Rapa Nui",
                "credit": "Colton Jones",
                "license": "Unsplash License",
            }
        ],
        "contact": {
            "phone": "+56 32 210 0255",
            "instagram": "https://www.instagram.com/rapanuitravel/",
        },
        "services": {
            "transport": ["Taxi Collectivo", "Hotel-Shuttle"],
            "amenities": ["Souvenirshops", "Tourdesk"],
        },
    },
    "hanga-roa-lodge": {
        "description": "Boutique-Lodge mit Meerblick, Spa und nachhaltigem Fokus im Herzen von Hanga Roa.",
        "timezone": "Pacific/Easter",
        "category": ["Hotel", "Wellness"],
        "rating": 4.8,
        "reviewCount": 985,
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=600&auto=format&fit=crop",
                "caption": "Außenpool der Eco Lodge",
                "credit": "Taryn Elliott",
                "license": "Unsplash License",
            }
        ],
        "contact": {
            "phone": "+56 32 210 1120",
            "email": "reservas@hangaroa.cl",
        },
        "services": {
            "amenities": ["Spa", "Restaurant", "Bike-Verleih"],
            "booking": "https://www.hangaroa.cl",
        },
    },
    "rano-raraku": {
        "description": "Vulkanischer Steinbruch, aus dem die Moai gefertigt wurden – UNESCO-Weltkulturerbe.",
        "timezone": "Pacific/Easter",
        "category": ["Archaeological Site"],
        "rating": 4.9,
        "reviewCount": 12650,
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1516959512124-903c2e1f4f99?w=600&auto=format&fit=crop",
                "caption": "Moai am Rano Raraku",
                "credit": "Marcelo Cidrack",
                "license": "Unsplash License",
            }
        ],
        "knowledge": {
            "bestTime": "Kurz vor Schließung für warmes Licht und weniger Besucher.",
            "tickets": "Nationalparkpass online kaufen und Personalausweis mitführen.",
        },
    },
    "cjc-airport": {
        "description": "Tor zur Atacama – kompakter Flughafen mit schnellen Shuttle-Verbindungen nach San Pedro.",
        "timezone": "America/Santiago",
        "category": ["Airport"],
        "rating": 4.1,
        "reviewCount": 8230,
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1502920917128-1aa500764b43?w=600&auto=format&fit=crop",
                "caption": "Terminalgebäude in Calama",
                "credit": "Rafael Lopez",
                "license": "Unsplash License",
            }
        ],
        "contact": {
            "phone": "+56 55 273 1400",
        },
        "services": {
            "transport": ["Shuttle Transvip", "Car-Rental"],
            "amenities": ["Cafés", "ATM"],
        },
    },
    "san-pedro": {
        "description": "Wüstenoase mit Adobe-Häusern, Observatorien und Ausgangspunkt für Atacama-Exkursionen.",
        "timezone": "America/Santiago",
        "category": ["Town", "Gateway"],
        "rating": 4.6,
        "reviewCount": 17890,
        "address": {
            "street": "Caracoles 360",
            "city": "San Pedro de Atacama",
            "country": "Chile",
        },
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&auto=format&fit=crop",
                "caption": "Adobe-Gassen in San Pedro",
                "credit": "Felipe Pizarro",
                "license": "Unsplash License",
            }
        ],
        "contact": {
            "instagram": "https://www.instagram.com/sanpedrochile/",
        },
        "services": {
            "amenities": ["Tourbüros", "Bike-Verleih", "Apotheken"],
        },
    },
    "valle-luna": {
        "description": "Mondlandschaft im Reserva Nacional Los Flamencos mit Dünen und Salzformationen.",
        "timezone": "America/Santiago",
        "category": ["Nature Reserve"],
        "rating": 4.8,
        "reviewCount": 20110,
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&auto=format&fit=crop",
                "caption": "Sanddünen im Valle de la Luna",
                "credit": "Pablo Garcia",
                "license": "Unsplash License",
            }
        ],
        "knowledge": {
            "bestTime": "Sunset Slots begrenzt – Ticket vorab sichern.",
            "gear": "Windjacke und Stirnlampe für späten Rückweg einpacken.",
        },
    },
    "pichilemu": {
        "description": "Chiles Surf-Hauptstadt mit entspannter Atmosphäre, Hostels und Craft-Coffee.",
        "timezone": "America/Santiago",
        "category": ["Surf Town"],
        "rating": 4.6,
        "reviewCount": 13620,
        "address": {
            "street": "Avenida Ortúzar 151",
            "city": "Pichilemu",
            "country": "Chile",
        },
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1526481280695-3c469928b67b?w=600&auto=format&fit=crop",
                "caption": "Boardwalk in Pichilemu",
                "credit": "Matías Silva",
                "license": "Unsplash License",
            }
        ],
        "services": {
            "amenities": ["Surfshops", "Yoga Studios", "Coworking"],
        },
    },
    "punta-lobos": {
        "description": "Legendärer Point Break südlich von Pichilemu mit Aussichtsklippen.",
        "timezone": "America/Santiago",
        "category": ["Surf Spot", "Viewpoint"],
        "rating": 4.9,
        "reviewCount": 8450,
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1470246973918-29a93221c455?w=600&auto=format&fit=crop",
                "caption": "Wellen am Punta de Lobos",
                "credit": "Alexandre Pellaes",
                "license": "Unsplash License",
            }
        ],
        "knowledge": {
            "bestTime": "Beste Sets im südlichen Winter; im Januar morgens wenig Wind.",
            "safety": "Abstieg zu den Felsen nur mit festen Schuhen.",
        },
    },
    "santiago-center": {
        "description": "Kulturviertel Lastarria mit Museen, Bars und dem GAM Kulturzentrum.",
        "timezone": "America/Santiago",
        "category": ["Neighborhood", "Culture"],
        "rating": 4.7,
        "reviewCount": 30100,
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=600&auto=format&fit=crop",
                "caption": "Abendstimmung im Barrio Lastarria",
                "credit": "Sebastian Sarria",
                "license": "Unsplash License",
            }
        ],
        "contact": {
            "instagram": "https://www.instagram.com/lastarria_santiago/",
        },
        "services": {
            "amenities": ["Museo de Bellas Artes", "Mercado Lastarria", "E-Bike Sharing"],
        },
    },
    "punta-arenas-airport": {
        "description": "Flughafen von Patagonien mit eigenem Pinguin-Souvenirshop und Mietwagenzentrum.",
        "timezone": "America/Punta_Arenas",
        "category": ["Airport", "Patagonia"],
        "rating": 4.2,
        "reviewCount": 5630,
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop",
                "caption": "Ankunft in Punta Arenas",
                "credit": "Rodrigo Gomez",
                "license": "Unsplash License",
            }
        ],
        "services": {
            "transport": ["Bus Sur", "Transfer Australis"],
            "amenities": ["Duty Free", "Snack Bars"],
        },
    },
    "puerto-natales": {
        "description": "Kleines Hafenstädtchen mit Fjordblick, Ausgangspunkt für Torres del Paine.",
        "timezone": "America/Punta_Arenas",
        "category": ["Town", "Gateway"],
        "rating": 4.6,
        "reviewCount": 11200,
        "address": {
            "street": "Pedro Montt 189",
            "city": "Puerto Natales",
            "country": "Chile",
        },
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1526403222653-0e2d61b4a427?w=600&auto=format&fit=crop",
                "caption": "Uferpromenade Puerto Natales",
                "credit": "Marcos Beresovsky",
                "license": "Unsplash License",
            }
        ],
        "services": {
            "amenities": ["Outdoor Gear Shops", "Craft Beer Bars"],
        },
    },
    "torres-base": {
        "description": "Legendärer Aussichtspunkt in Torres del Paine nach steilem Tagesmarsch.",
        "timezone": "America/Punta_Arenas",
        "category": ["Trail", "National Park"],
        "rating": 5.0,
        "reviewCount": 15420,
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=600&auto=format&fit=crop",
                "caption": "Laguna am Base de las Torres",
                "credit": "Diego Jimenez",
                "license": "Unsplash License",
            }
        ],
        "knowledge": {
            "gear": "Trekkingstöcke und Regenjacke obligatorisch – Wetterumschwünge häufig.",
            "permits": "Parkeintritt vorab online bezahlen, Ticket bei Laguna Amarga vorzeigen.",
        },
    },
    "pucon": {
        "description": "Abenteuer-Hub am Vulkan Villarrica mit Thermalquellen und Outdoor-Angebot.",
        "timezone": "America/Santiago",
        "category": ["Adventure Town"],
        "rating": 4.7,
        "reviewCount": 14880,
        "address": {
            "street": "Calle Fresia 223",
            "city": "Pucón",
            "country": "Chile",
        },
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&auto=format&fit=crop",
                "caption": "Blick auf den Villarrica",
                "credit": "Andrés Darricau",
                "license": "Unsplash License",
            }
        ],
        "services": {
            "amenities": ["Thermalbäder", "Klettershops", "Craft Cafés"],
        },
    },
    "puerto-varas": {
        "description": "See-Städtchen mit deutschem Erbe, Blick auf Osorno und zahlreiche Cafés.",
        "timezone": "America/Santiago",
        "category": ["Lake Town", "Culture"],
        "rating": 4.8,
        "reviewCount": 19300,
        "address": {
            "street": "Del Salvador 219",
            "city": "Puerto Varas",
            "country": "Chile",
        },
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1516741535768-20da1914e42e?w=600&auto=format&fit=crop",
                "caption": "Puerto Varas Uferpromenade",
                "credit": "Camila Gutiérrez",
                "license": "Unsplash License",
            }
        ],
        "services": {
            "amenities": ["Seepromenade", "Craft-Bier", "Bäckereien"],
        },
    },
    "castro": {
        "description": "Hauptstadt Chiloés mit berühmten Pfahlbauten, Märkten und Holzkirchen.",
        "timezone": "America/Santiago",
        "category": ["Heritage", "Harbor"],
        "rating": 4.6,
        "reviewCount": 12100,
        "address": {
            "street": "Pedro Montt 51",
            "city": "Castro",
            "country": "Chile",
        },
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1614636268922-9c65b11472ed?w=600&auto=format&fit=crop",
                "caption": "Palafitos in Castro",
                "credit": "Johan Mouchet",
                "license": "Unsplash License",
            }
        ],
        "services": {
            "amenities": ["Fischmärkte", "Bootstouren", "Kunsthandwerk"],
        },
    },
    "puerto-montt-airport": {
        "description": "Regionalflughafen für die Seenregion mit schnellen Check-ins und Mietwagencenter.",
        "timezone": "America/Santiago",
        "category": ["Airport"],
        "rating": 4.1,
        "reviewCount": 6380,
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1479077315426-5f1a0c4e6b76?w=600&auto=format&fit=crop",
                "caption": "Anflug auf Puerto Montt",
                "credit": "Hernan Pablo",
                "license": "Unsplash License",
            }
        ],
        "services": {
            "transport": ["Transfer Delfín", "Taxi Oficial"],
        },
    },
    "la-serena": {
        "description": "Koloniale Stadt mit Stränden und Ausgangspunkt für das Elqui-Tal.",
        "timezone": "America/Santiago",
        "category": ["City", "Beach"],
        "rating": 4.4,
        "reviewCount": 15210,
        "address": {
            "street": "Prat 350",
            "city": "La Serena",
            "country": "Chile",
        },
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop",
                "caption": "Kathedrale von La Serena",
                "credit": "Claudio Tuma",
                "license": "Unsplash License",
            }
        ],
    },
    "vicuna": {
        "description": "Charmantes Pisco-Städtchen im Elqui-Tal mit Observatorien.",
        "timezone": "America/Santiago",
        "category": ["Wine", "Stargazing"],
        "rating": 4.5,
        "reviewCount": 8420,
        "address": {
            "street": "Gabriela Mistral 181",
            "city": "Vicuña",
            "country": "Chile",
        },
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop",
                "caption": "Sternwarte nahe Vicuña",
                "credit": "Jorge Barahona",
                "license": "Unsplash License",
            }
        ],
        "knowledge": {
            "bestTime": "Klares Beobachtungsfenster Mai–November, im Januar trotzdem gute Bedingungen.",
        },
    },
    "antofagasta": {
        "description": "Skulptur ""La Mano del Desierto"" mitten in der Atacama – ikonischer Fotostopp.",
        "timezone": "America/Santiago",
        "category": ["Sculpture", "Roadside"],
        "rating": 4.6,
        "reviewCount": 9620,
        "address": {
            "street": "Ruta 5 Norte km 75",
            "city": "Antofagasta",
            "country": "Chile",
        },
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop",
                "caption": "Hand des Desierto",
                "credit": "Felix Mittermeier",
                "license": "Unsplash License",
            }
        ],
        "knowledge": {
            "bestTime": "Am besten frühmorgens für Schattenwurf und geringeren Verkehr.",
        },
    },
    "santa-cruz": {
        "description": "Weinstadt im Colchagua-Tal mit Museen, Seilbahn und Spitzenweingütern.",
        "timezone": "America/Santiago",
        "category": ["Wine", "Town"],
        "rating": 4.5,
        "reviewCount": 7450,
        "address": {
            "street": "Plaza de Armas",
            "city": "Santa Cruz",
            "country": "Chile",
        },
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop",
                "caption": "Weinberge in Colchagua",
                "credit": "Thomas Schaefer",
                "license": "Unsplash License",
            }
        ],
    },
    "talca": {
        "description": "Tor zum Reserva Nacional Altos de Lircay – Wanderparadies mit Araukarien.",
        "timezone": "America/Santiago",
        "category": ["Trail", "Nature"],
        "rating": 4.6,
        "reviewCount": 5210,
        "address": {
            "street": "Camino Pehuenche km 37",
            "city": "Talca",
            "country": "Chile",
        },
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1458224755287-281747167c72?w=600&auto=format&fit=crop",
                "caption": "Wälder Altos de Lircay",
                "credit": "Constanza Hevia",
                "license": "Unsplash License",
            }
        ],
    },
    "concepcion": {
        "description": "Universitätsstadt mit Streetfood-Markt, Jazzszene und nächtlichem Leben.",
        "timezone": "America/Santiago",
        "category": ["City", "Food"],
        "rating": 4.3,
        "reviewCount": 11800,
        "address": {
            "street": "Aníbal Pinto 65",
            "city": "Concepción",
            "country": "Chile",
        },
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1512058564366-c9e1d31714af?w=600&auto=format&fit=crop",
                "caption": "Mercado in Concepción",
                "credit": "Eduardo Casajús",
                "license": "Unsplash License",
            }
        ],
    },
    "colchagua-lodge": {
        "description": "Boutique-Lodge zwischen Weinbergen mit Spa und Degustationsmenüs.",
        "timezone": "America/Santiago",
        "category": ["Hotel", "Wine"],
        "rating": 4.9,
        "reviewCount": 620,
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1496412705862-e0088f16f791?w=600&auto=format&fit=crop",
                "caption": "Infinity-Pool mit Blick auf Weinberge",
                "credit": "Glen Carrie",
                "license": "Unsplash License",
            }
        ],
    },
    "cajon-maipo": {
        "description": "Anden-Canyon mit Thermalquellen, Hängebrücken und Sternenhimmel.",
        "timezone": "America/Santiago",
        "category": ["Nature", "Wellness"],
        "rating": 4.7,
        "reviewCount": 13220,
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1516366434321-728a48e6b7f1?w=600&auto=format&fit=crop",
                "caption": "Thermalquellen im Cajón del Maipo",
                "credit": "Francisca Alvarez",
                "license": "Unsplash License",
            }
        ],
    },
    "san-pedro-boutique": {
        "description": "Boutique-Hotel mit Adobe-Suiten, Rooftop und Sternengucker-Deck.",
        "timezone": "America/Santiago",
        "category": ["Hotel", "Boutique"],
        "rating": 4.9,
        "reviewCount": 780,
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop",
                "caption": "Suite im Boutiquehotel",
                "credit": "Ralph (Ravi) Kayden",
                "license": "Unsplash License",
            }
        ],
    },
    "torres-ecocamp": {
        "description": "Ikonische Geodomes mitten im Torres-del-Paine-Nationalpark.",
        "timezone": "America/Punta_Arenas",
        "category": ["Hotel", "Glamping"],
        "rating": 4.8,
        "reviewCount": 1340,
        "photos": [
            {
                "url": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&auto=format&fit=crop",
                "caption": "EcoCamp Dome bei Nacht",
                "credit": "James Wheeler",
                "license": "Unsplash License",
            }
        ],
        "services": {
            "amenities": ["Yoga Dome", "Restaurant", "Private Guides"],
        },
    },
}

for stop_id, enrichment in STOP_ENRICHMENTS.items():
    deep_merge(STOPS[stop_id], enrichment)

FLIGHT_ENRICHMENTS = {
    "flight-scl-ipc": {
        "aircraft": "Boeing 787-9",
        "cabinClass": "Economy Plus",
        "baggage": {"carryOn": "8 kg", "checked": "1 x 23 kg inklusive"},
        "checkIn": "Online-Check-in 48 h vor Abflug, Gepäckabgabe Terminal 2",
        "fromTerminal": "SCL T2",
        "toTerminal": "IPC Hauptterminal",
        "notes": "Fensterplätze links bieten Blick auf die Anden und den Pazifik.",
        "fareClasses": ["Economy", "Premium Economy", "Business"],
        "onTimePerformance": "87%", 
    },
    "flight-ipc-cjc": {
        "aircraft": "Airbus A321neo",
        "cabinClass": "Economy",
        "baggage": {"carryOn": "10 kg", "checked": "1 x 23 kg"},
        "checkIn": "Check-in am kleinen Terminal – 90 Minuten vorher genügen.",
        "fromTerminal": "IPC",
        "toTerminal": "CJC T1",
        "notes": "Zwischenlandung in SCL möglich, Snacks an Bord inklusive.",
        "fareClasses": ["Economy", "Full Flex"],
        "onTimePerformance": "81%",
    },
    "flight-cjc-scl": {
        "aircraft": "Airbus A320",
        "cabinClass": "Economy",
        "baggage": {"carryOn": "8 kg", "checked": "1 x 23 kg"},
        "checkIn": "Online 24 h vor Abflug, Gate schließt 20 Minuten vor Abflug.",
        "fromTerminal": "CJC",
        "toTerminal": "SCL T1",
        "notes": "Fensterplätze rechts mit Sicht auf die schneebedeckten Anden.",
        "fareClasses": ["Light", "Plus", "Top"],
        "onTimePerformance": "90%",
    },
    "flight-scl-puq": {
        "aircraft": "Airbus A321",
        "cabinClass": "Economy",
        "baggage": {"carryOn": "8 kg", "checked": "1 x 23 kg"},
        "checkIn": "Sicherheitskontrolle Terminal 1, Boarding startet 35 Minuten vor Abflug.",
        "fromTerminal": "SCL T1",
        "toTerminal": "PUQ",
        "notes": "Sitz links für Torres-del-Paine-Blicke beim Landeanflug wählen.",
        "fareClasses": ["Promo", "Plus", "Premium"],
        "onTimePerformance": "83%",
    },
    "flight-puq-cjc": {
        "aircraft": "Airbus A320neo",
        "cabinClass": "Economy",
        "baggage": {"carryOn": "10 kg", "checked": "1 x 23 kg"},
        "checkIn": "Check-in öffnet 2 h vor Abflug, Transfer zwischen Terminals in SCL beachten.",
        "fromTerminal": "PUQ",
        "toTerminal": "CJC",
        "notes": "Snacks an Bord optional kaufbar, Klimaanlage an Bord kräftig.",
        "fareClasses": ["Zero", "Plus"],
        "onTimePerformance": "78%",
    },
    "flight-cjc-scl-final": {
        "aircraft": "Airbus A320",
        "cabinClass": "Economy",
        "baggage": {"carryOn": "8 kg", "checked": "1 x 23 kg"},
        "checkIn": "Self-Bag-Drop verfügbar, Boarding nach Gruppen.",
        "fromTerminal": "CJC",
        "toTerminal": "SCL T1",
        "notes": "Kurzer Flug – Snacks in der Lounge vorher einplanen.",
        "fareClasses": ["Light", "Plus"],
        "onTimePerformance": "88%",
    },
    "flight-pmc-scl": {
        "aircraft": "Airbus A320",
        "cabinClass": "Economy",
        "baggage": {"carryOn": "8 kg", "checked": "1 x 23 kg"},
        "checkIn": "Boarding-Gates B3/B4, Sicherheitskontrolle meist zügig.",
        "fromTerminal": "PMC",
        "toTerminal": "SCL T1",
        "notes": "Fensterplätze rechts zeigen die Vulkane Osorno & Calbuco.",
        "fareClasses": ["Light", "Plus"],
        "onTimePerformance": "91%",
    },
    "flight-scl-calama": {
        "aircraft": "Airbus A321",
        "cabinClass": "Economy",
        "baggage": {"carryOn": "8 kg", "checked": "1 x 23 kg"},
        "checkIn": "Express-Sicherheitslinie mit Premium-Economy verfügbar.",
        "fromTerminal": "SCL T1",
        "toTerminal": "CJC",
        "notes": "Fensterplätze rechts für Aussicht auf den Atacama-Salar.",
        "fareClasses": ["Basic", "Plus", "Full"],
        "onTimePerformance": "85%",
    },
    "flight-scl-rapa": {
        "aircraft": "Boeing 787-9",
        "cabinClass": "Economy Plus",
        "baggage": {"carryOn": "8 kg", "checked": "2 x 23 kg"},
        "checkIn": "Langstreckenbereich Terminal 2, Boarding ab 60 Minuten vor Abflug.",
        "fromTerminal": "SCL T2",
        "toTerminal": "IPC",
        "notes": "Spezielles Rapa-Nui-Menü an Bord, zwei Mahlzeiten inklusive.",
        "fareClasses": ["Economy", "Premium Business"],
        "onTimePerformance": "82%",
    },
    "flight-scl-cjc-honeymoon": {
        "aircraft": "Airbus A321",
        "cabinClass": "Premium Economy",
        "baggage": {"carryOn": "10 kg", "checked": "2 x 23 kg"},
        "checkIn": "Priority-Check-in am Premium-Schalter, Loungezugang inklusive.",
        "fromTerminal": "SCL T1",
        "toTerminal": "CJC",
        "notes": "Champagner-Servierung zum Start, Sitzplätze 3A/B reserviert.",
        "fareClasses": ["Premium", "Full Flex"],
        "onTimePerformance": "89%",
    },
    "flight-cjc-pmc-honeymoon": {
        "aircraft": "Airbus A320",
        "cabinClass": "Premium Economy",
        "baggage": {"carryOn": "10 kg", "checked": "2 x 23 kg"},
        "checkIn": "Priority Boarding, Lounge in CJC inkludiert.",
        "fromTerminal": "CJC",
        "toTerminal": "PMC",
        "notes": "Fensterplätze links – Blick auf die Küste von Los Lagos.",
        "fareClasses": ["Premium"],
        "onTimePerformance": "80%",
    },
    "flight-puq-scl-honeymoon": {
        "aircraft": "Boeing 737-800",
        "cabinClass": "Premium Economy",
        "baggage": {"carryOn": "10 kg", "checked": "2 x 23 kg"},
        "checkIn": "Priority-Schalter in PUQ, Boarding per Jetbridge.",
        "fromTerminal": "PUQ",
        "toTerminal": "SCL T1",
        "notes": "Beim Abflug Blick auf die Magellanstraße.",
        "fareClasses": ["Premium"],
        "onTimePerformance": "86%",
    },
}

SEGMENT_MODE_DEFAULTS = {
    "bus": {
        "operator": "Fernbus", 
        "frequency": "stündlich",
        "bookingUrl": "https://www.recorrido.cl",
        "luggagePolicy": "2 x 23 kg im Gepäckraum + Handgepäck",
        "seatInfo": "Semi-Cama Sitze mit USB und Heizung",
    },
    "drive": {
        "operator": "Selbstfahrer",
        "frequency": "flexibel",
        "bookingUrl": "https://www.kayak.com/cars",
        "recommendedVehicle": "SUV oder Mittelklasse",
        "tollInfo": "Maut via TAG-Pass oder Barzahlung, Tankstellen alle 80 km",
    },
    "flight": {
        "operator": "Inlandsflug",
        "frequency": "täglich",
        "bookingUrl": "https://www.latamairlines.com/",
        "seatInfo": "Fensterplätze für Landschaftsblick empfohlen",
    },
    "walk": {
        "operator": "Zu Fuß",
        "frequency": "frei planbar",
        "bookingUrl": None,
        "recommendedGear": "Bequeme Wanderschuhe, Sonnen- und Windschutz",
    },
    "ferry": {
        "operator": "Naviera Austral",
        "frequency": "2-3 x täglich",
        "bookingUrl": "https://www.navieraustral.cl",
        "seatInfo": "Innen- und Außendecks, Café an Bord",
    },
}

SEGMENT_SPECIFICS = {
    ("scl-airport", "terminal-alameda", "bus"): {
        "operator": "Centropuerto Express",
        "frequency": "alle 10 Minuten",
        "bookingUrl": "https://www.centropuerto.cl",
        "notes": "Zahlung mit Bip!-Karte oder Kreditkarte möglich.",
    },
    ("terminal-alameda", "valparaiso-center", "bus"): {
        "operator": "TurBus",
        "frequency": "alle 15 Minuten",
        "bookingUrl": "https://www.turbus.cl",
        "notes": "Einchecken auf Bahnsteig 22, WLAN an Bord.",
    },
    ("valparaiso-center", "ipc-airport", "flight"): {
        "operator": "LATAM",
        "notes": "Direkter Sonderflug ab SCL – Transfer Valparaíso→SCL inklusive.",
    },
    ("ipc-airport", "rano-raraku", "drive"): {
        "operator": "Hotel Shuttle",
        "notes": "Unbefestigte Straßen – 4x4 empfohlen.",
    },
    ("cjc-airport", "san-pedro", "bus"): {
        "operator": "Transvip Shuttle",
        "frequency": "alle 30 Minuten",
        "notes": "Stopps in allen Hotels möglich, Klimaanlage kräftig.",
    },
    ("san-pedro", "valle-luna", "drive"): {
        "operator": "Geführter Tourvan",
        "notes": "Eintrittstickets werden vom Guide organisiert.",
    },
    ("san-pedro", "pichilemu", "flight"): {
        "operator": "LATAM + Shuttle",
        "notes": "Umstieg in SCL, Surfboards können als Sportgepäck aufgegeben werden.",
    },
    ("pichilemu", "punta-lobos", "walk"): {
        "notes": "Küstenweg mit wenig Schatten – Wasser einpacken.",
    },
    ("punta-arenas-airport", "puerto-natales", "bus"): {
        "operator": "Bus Sur",
        "frequency": "3 x täglich",
        "notes": "Zwischenstopp in Villa Tehuelches.",
    },
    ("puerto-natales", "torres-base", "bus"): {
        "operator": "Vans Torres",
        "frequency": "täglich 07:00 & 14:00",
        "notes": "Ticket enthält Parkeintritt Laguna Amarga nicht – separat kaufen.",
    },
    ("punta-arenas-airport", "cjc-airport", "flight"): {
        "operator": "Sky Airline",
        "notes": "Sitzplätze mittig mit bester Beinfreiheit (Exit Row).",
    },
    ("valparaiso-center", "pichilemu", "drive"): {
        "notes": "Route via Ruta 66 (Carretera de la Fruta) mit vielen Obstständen.",
    },
    ("puerto-varas", "castro", "ferry"): {
        "operator": "Transbordadora Austral",
        "notes": "Fähre Pargua–Chacao, Boarding 40 Minuten vorher.",
    },
    ("castro", "puerto-montt-airport", "drive"): {
        "notes": "Panamericana Sur – ausreichend Tankstellen.",
    },
    ("santiago-center", "colchagua-lodge", "drive"): {
        "notes": "Route via Ruta 5 und Ruta I-50, Weinverkostung unterwegs möglich.",
    },
    ("santiago-center", "cajon-maipo", "drive"): {
        "notes": "Schmale Serpentinen – früh starten, um Staus zu vermeiden.",
    },
    ("san-pedro-boutique", "puerto-varas", "flight"): {
        "operator": "Sky Airline",
        "notes": "Direkter Charter via SCL – Gepäck wird durchgecheckt.",
    },
    ("castro", "torres-ecocamp", "flight"): {
        "operator": "Charter",
        "notes": "Privatflugzeug mit 12 Sitzen, maximal 15 kg pro Person.",
    },
}

LODGING_ENRICHMENTS = {
    "Hotel Casa Higueras": {
        "address": "Higuera 133, Valparaíso",
        "contact": {"phone": "+56 32 249 7900", "email": "reservas@casahigueras.cl"},
        "amenities": ["Infinity-Pool", "Rooftop-Bar", "Spa"],
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=600&auto=format&fit=crop",
                "caption": "Terrassenblick Hotel Casa Higueras",
                "credit": "Andres J" ,
                "license": "Unsplash License",
            }
        ],
        "rating": 4.7,
        "reviewCount": 1280,
        "checkInWindow": "15:00–23:00",
        "checkOutWindow": "bis 12:00",
        "roomHighlights": ["Meerblick", "Freestanding Bathtub"],
    },
    "Hare Uta Hotel": {
        "address": "Av. Hotu Matu'a s/n, Hanga Roa",
        "contact": {"phone": "+56 32 255 1415", "email": "reservas@hareuta.cl"},
        "amenities": ["Spa", "Thalasso-Pool", "Restaurant"],
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&auto=format&fit=crop",
                "caption": "Bungalow auf Rapa Nui",
                "credit": "Brooke Cagle",
                "license": "Unsplash License",
            }
        ],
        "rating": 4.8,
        "reviewCount": 540,
        "checkInWindow": "15:00–21:00",
        "checkOutWindow": "bis 11:00",
        "roomHighlights": ["Privater Balkon", "Außendusche"],
    },
    "Hotel Desertica": {
        "address": "Tocopilla 18, San Pedro de Atacama",
        "contact": {"phone": "+56 55 255 1212", "email": "reservas@desertica.cl"},
        "amenities": ["Salzwasserpool", "Observatorium", "E-Bike Verleih"],
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1470246973918-29a93221c455?w=600&auto=format&fit=crop",
                "caption": "Adobe-Suiten in San Pedro",
                "credit": "Alexandre Pellaes",
                "license": "Unsplash License",
            }
        ],
        "rating": 4.9,
        "reviewCount": 890,
        "checkInWindow": "14:00–22:00",
        "checkOutWindow": "bis 11:00",
        "roomHighlights": ["Feuerstelle", "Outdoor-Dusche"],
    },
    "Hotel Cabo de Hornos": {
        "address": "Plaza Muñoz Gamero 1025, Punta Arenas",
        "contact": {"phone": "+56 61 271 5000", "email": "reservas@cabodehornos.cl"},
        "amenities": ["Patagonische Küche", "Fitnessstudio", "Bibliothek"],
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1551888419-7f0c0f5fbac1?w=600&auto=format&fit=crop",
                "caption": "Lobby im Hotel Cabo de Hornos",
                "credit": "Roberto Nickson",
                "license": "Unsplash License",
            }
        ],
        "rating": 4.5,
        "reviewCount": 1540,
        "checkInWindow": "15:00–23:30",
        "checkOutWindow": "bis 12:00",
        "roomHighlights": ["Blick auf die Magellanstraße"],
    },
    "Hotel Lago Grey": {
        "address": "Sector Lago Grey, Torres del Paine",
        "contact": {"phone": "+56 61 241 0541", "email": "reservas@lagogrey.com"},
        "amenities": ["Katamaran-Tour", "Aussichtslounge", "Trails ab Haustür"],
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&auto=format&fit=crop",
                "caption": "Lodge am Lago Grey",
                "credit": "Fabrizio Conti",
                "license": "Unsplash License",
            }
        ],
        "rating": 4.6,
        "reviewCount": 620,
        "checkInWindow": "15:00–21:00",
        "checkOutWindow": "bis 11:00",
        "roomHighlights": ["Panoramafenster", "Heißwasserflaschen"],
    },
    "Hotel Noi Casa Atacama": {
        "address": "Tocopilla E-8, San Pedro de Atacama",
        "contact": {"phone": "+56 55 285 1120", "email": "reservas@noihotels.com"},
        "amenities": ["Solarbeheizter Pool", "Wellness", "Bike-Verleih"],
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1470246973918-29a93221c455?w=600&auto=format&fit=crop",
                "caption": "Poolbereich Hotel Noi",
                "credit": "Alexandre Pellaes",
                "license": "Unsplash License",
            }
        ],
        "rating": 4.7,
        "reviewCount": 980,
        "checkInWindow": "15:00–22:00",
        "checkOutWindow": "bis 11:00",
        "roomHighlights": ["Feuerstellen", "Nachthimmel Deck"],
    },
    "WineBox Valparaíso": {
        "address": "Pasaje Gálvez 4, Valparaíso",
        "contact": {"phone": "+56 9 4226 5545", "email": "hola@wineboxvalparaiso.cl"},
        "amenities": ["Rooftop mit Bar", "Weinproben", "Streetart-Galerie"],
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&auto=format&fit=crop",
                "caption": "Containerhotel WineBox",
                "credit": "Aleksandar Pasaric",
                "license": "Unsplash License",
            }
        ],
        "rating": 4.6,
        "reviewCount": 720,
        "checkInWindow": "15:00–22:00",
        "checkOutWindow": "bis 11:00",
        "roomHighlights": ["Privater Balkon", "Kitchenette"],
    },
    "Hotel Antumalal": {
        "address": "Camino Pucón a Villarrica km 2,5",
        "contact": {"phone": "+56 45 244 1011", "email": "reservas@antumalal.com"},
        "amenities": ["Designklassiker", "Spa", "Privater Seezugang"],
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop",
                "caption": "Retro Lounge im Hotel Antumalal",
                "credit": "Tanya Pro",
                "license": "Unsplash License",
            }
        ],
        "rating": 4.7,
        "reviewCount": 510,
        "checkInWindow": "15:00–22:00",
        "checkOutWindow": "bis 11:00",
        "roomHighlights": ["Panoramafenster", "Holzkamin"],
    },
    "Palafito 1326": {
        "address": "Galvarino Riveros 1326, Castro",
        "contact": {"phone": "+56 65 263 1000", "email": "reservas@palafito1326.cl"},
        "amenities": ["Floating Terrace", "Bio-Frühstück", "Kajaks"],
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=600&auto=format&fit=crop",
                "caption": "Pfahlbau-Zimmer",
                "credit": "Sebastian Leon",
                "license": "Unsplash License",
            }
        ],
        "rating": 4.8,
        "reviewCount": 460,
        "checkInWindow": "15:00–20:00",
        "checkOutWindow": "bis 11:00",
        "roomHighlights": ["Meerblick", "Fussbodenheizung"],
    },
    "Hotel Magnolia": {
        "address": "Huérfanos 539, Santiago",
        "contact": {"phone": "+56 2 2470 7000", "email": "reservas@hotelmagnolia.cl"},
        "amenities": ["Rooftop Bar", "Bibliothek", "Design Suites"],
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop",
                "caption": "Rooftop des Hotel Magnolia",
                "credit": "Tanya Pro",
                "license": "Unsplash License",
            }
        ],
        "rating": 4.7,
        "reviewCount": 980,
        "checkInWindow": "15:00–00:00",
        "checkOutWindow": "bis 12:00",
        "roomHighlights": ["Designerbad", "Nespresso"],
    },
    "Explora Atacama": {
        "address": "Ayllu de Larache s/n, San Pedro",
        "contact": {"phone": "+56 2 2395 2800", "email": "reservas@explora.com"},
        "amenities": ["Vollpension", "Observatorium", "Reitställe"],
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop",
                "caption": "Pool der Explora Atacama",
                "credit": "Thomas Schaefer",
                "license": "Unsplash License",
            }
        ],
        "rating": 4.9,
        "reviewCount": 430,
        "checkInWindow": "15:00–22:00",
        "checkOutWindow": "bis 12:00",
        "roomHighlights": ["All-inclusive Guides", "Whirlpools"],
    },
    "Clos Apalta Residence": {
        "address": "Camino Apalta km 4.5, Santa Cruz",
        "contact": {"phone": "+56 72 295 9000", "email": "reservas@lapostolle.com"},
        "amenities": ["Infinity Pool", "Private Butler", "Degustationsmenüs"],
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop",
                "caption": "Villa in den Weinbergen",
                "credit": "Tanya Pro",
                "license": "Unsplash License",
            }
        ],
        "rating": 4.9,
        "reviewCount": 220,
        "checkInWindow": "15:00–19:00",
        "checkOutWindow": "bis 12:00",
        "roomHighlights": ["Panoramablick", "Privater Whirlpool"],
    },
    "Refugio CasaBosque": {
        "address": "Ruta 5 Sur km 57, Chillán",
        "contact": {"phone": "+56 42 266 2010", "email": "contacto@casabosque.cl"},
        "amenities": ["Whirlpool", "Holzöfen", "Outdoor-Lounge"],
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop",
                "caption": "Refugio im Wald",
                "credit": "Tanya Pro",
                "license": "Unsplash License",
            }
        ],
        "rating": 4.6,
        "reviewCount": 410,
        "checkInWindow": "15:00–21:00",
        "checkOutWindow": "bis 11:00",
        "roomHighlights": ["Holzbadewannen", "Blick in den Wald"],
    },
    "La Casona Matetic": {
        "address": "Fundo El Rosario km 18, San Antonio",
        "contact": {"phone": "+56 2 2964 7800", "email": "reservas@matetic.com"},
        "amenities": ["Kolonialvilla", "Weinverkostungen", "Pool"],
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1542318428-29f26af1ff86?w=600&auto=format&fit=crop",
                "caption": "Herrenhaus La Casona",
                "credit": "William Moreland",
                "license": "Unsplash License",
            }
        ],
        "rating": 4.8,
        "reviewCount": 350,
        "checkInWindow": "14:00–20:00",
        "checkOutWindow": "bis 12:00",
        "roomHighlights": ["Veranda", "Antike Möbel"],
    },
    "Viña Vik": {
        "address": "Hacienda Vik, Millahue",
        "contact": {"phone": "+56 2 2383 3600", "email": "reservations@vik.cl"},
        "amenities": ["Weintherapie Spa", "Helipad", "Kunstsammlung"],
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop",
                "caption": "Designhotel in den Hügeln",
                "credit": "Tanya Pro",
                "license": "Unsplash License",
            }
        ],
        "rating": 4.9,
        "reviewCount": 410,
        "checkInWindow": "15:00–20:00",
        "checkOutWindow": "bis 12:00",
        "roomHighlights": ["Kunstwerke", "Panoramafenster"],
    },
    "Nayara Alto Atacama": {
        "address": "Camino Pukará 6, San Pedro",
        "contact": {"phone": "+56 55 284 1919", "email": "reservas@nayaratentedcamp.com"},
        "amenities": ["Privates Observatorium", "Sechs Pools", "All-Inclusive Ausflüge"],
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1470246973918-29a93221c455?w=600&auto=format&fit=crop",
                "caption": "Terrakotta-Bauten im Alto Atacama",
                "credit": "Alexandre Pellaes",
                "license": "Unsplash License",
            }
        ],
        "rating": 4.9,
        "reviewCount": 520,
        "checkInWindow": "15:00–22:00",
        "checkOutWindow": "bis 11:00",
        "roomHighlights": ["Privatterrasse", "Außendusche"],
    },
    "EcoCamp Patagonia Suite Dome": {
        "address": "Sector Las Torres, Torres del Paine",
        "contact": {"phone": "+56 2 2923 5950", "email": "reservas@ecocamp.travel"},
        "amenities": ["Community Dome", "Yoga", "Guide-Team"],
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&auto=format&fit=crop",
                "caption": "Geodomes bei Nacht",
                "credit": "James Wheeler",
                "license": "Unsplash License",
            }
        ],
        "rating": 4.8,
        "reviewCount": 880,
        "checkInWindow": "15:00–20:00",
        "checkOutWindow": "bis 10:00",
        "roomHighlights": ["Holzofen", "Privates Bad"],
    },
    "Hostal El Arbol": {
        "address": "Eduardo de la Barra 29, La Serena",
        "contact": {"phone": "+56 51 221 3370", "email": "info@hostelelarbol.cl"},
        "amenities": ["Garten", "Gemeinschaftsküche", "Yoga"],
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1505691723518-36a9f9439c32?w=600&auto=format&fit=crop",
                "caption": "Innenhof Hostal El Arbol",
                "credit": "Gaelle Marcel",
                "license": "Unsplash License",
            }
        ],
        "rating": 4.5,
        "reviewCount": 680,
        "checkInWindow": "14:00–22:00",
        "checkOutWindow": "bis 11:00",
        "roomHighlights": ["Hängematten", "Gemeinschaftsatmosphäre"],
    },
}

FOOD_ENRICHMENTS = {
    "Bocanáriz Wine Bar": {
        "contact": {"phone": "+56 2 2638 9893", "instagram": "https://www.instagram.com/bocanariz/"},
        "mustTry": ["Wine Flight Tierra de Chile", "Merquén Crostini"],
        "reservation": "Empfohlen für Abendservice",
        "googlePlaceId": "ChIJ8Qj4b2VZYpYR7mxzXIv2qx4",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop",
                "caption": "Wine Pairing bei Bocanáriz",
                "credit": "Thomas Schaefer",
                "license": "Unsplash License",
            }
        ],
    },
    "Mercado Central": {
        "contact": {"phone": "+56 2 2628 7160", "website": "https://www.mercadocentral.cl"},
        "mustTry": ["Caldillo de Congrio", "Empanada de Mariscos"],
        "reservation": "Nicht nötig – mehrere Stände, Karte akzeptiert",
        "googlePlaceId": "ChIJL1tZBKVZYpYRl3F1l16rDp0",
        "instagram": "https://www.instagram.com/mercadocentralsantiago/",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1529257414771-1960ab1f3d30?w=600&auto=format&fit=crop",
                "caption": "Fischstände im Mercado Central",
                "credit": "Nicolas Perez",
                "license": "Unsplash License",
            }
        ],
    },
    "Empanadas Hanga Roa": {
        "contact": {"phone": "+56 32 255 1410"},
        "mustTry": ["Empanada de Atún", "Jugo de Guayaba"],
        "reservation": "Walk-in",
        "googlePlaceId": "ChIJ3V69z0C8hZQRV6x6tEN84qk",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1589308078055-44e511e7d303?w=600&auto=format&fit=crop",
                "caption": "Frische Empanadas",
                "credit": "Gabriel Gurrola",
                "license": "Unsplash License",
            }
        ],
    },
    "Damiana Elena": {
        "contact": {"phone": "+56 61 241 3757", "website": "https://www.damianaelena.cl"},
        "mustTry": ["Centolla", "Patagonisches Lamm"],
        "reservation": "Empfohlen 1 Woche im Voraus",
        "googlePlaceId": "ChIJv4oJLN9b0JUR3gH-6Q4Dzg0",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop",
                "caption": "Patagonisches Fine Dining",
                "credit": "Jay Wennington",
                "license": "Unsplash License",
            }
        ],
    },
    "El Huerto": {
        "contact": {"phone": "+56 55 285 1000", "instagram": "https://www.instagram.com/elhuertospa/"},
        "mustTry": ["Quinoa Burger", "Atacama Craft Beer"],
        "reservation": "Empfohlen für Abendservice",
        "googlePlaceId": "ChIJq0WX7C02YpYRQ4BP8M0YfQc",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=600&auto=format&fit=crop",
                "caption": "Veggie Bowls im El Huerto",
                "credit": "Anna Pelzer",
                "license": "Unsplash License",
            }
        ],
    },
    "Apice Cocina": {
        "contact": {"phone": "+56 32 322 8444", "instagram": "https://www.instagram.com/apicecocina/"},
        "mustTry": ["Degustationsmenü de Temporada"],
        "reservation": "Zwingend – 2 Wochen Vorlauf",
        "googlePlaceId": "ChIJp3Cq6lLBYpYRyYB9H9n1tOI",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600&auto=format&fit=crop",
                "caption": "Fine Dining Teller",
                "credit": "Sebastian Coman",
                "license": "Unsplash License",
            }
        ],
    },
    "Feria Costumbrista de Chonchi": {
        "contact": {"instagram": "https://www.instagram.com/feriachonchi/"},
        "mustTry": ["Curanto en Hoyo", "Milcao"],
        "reservation": "Eintritt frei, Cash only",
        "googlePlaceId": "ChIJDd6rzQVo0JURafqCk41sJL0",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1514986888952-8cd320577b68?w=600&auto=format&fit=crop",
                "caption": "Chilenische Märkte",
                "credit": "Jarritos Mexican Soda",
                "license": "Unsplash License",
            }
        ],
    },
    "Boragó": {
        "contact": {"phone": "+56 2 2953 8893", "website": "https://borago.cl"},
        "mustTry": ["Endemico Menu", "Murtilla Dessert"],
        "reservation": "Mehrere Wochen im Voraus",
        "googlePlaceId": "ChIJN0K8P2JYYpYRtoDnNMSKyk4",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop",
                "caption": "Signature Dish Boragó",
                "credit": "Jay Wennington",
                "license": "Unsplash License",
            }
        ],
    },
    "Café Matilde": {
        "contact": {"phone": "+56 2 2632 4456", "instagram": "https://www.instagram.com/cafematilde/"},
        "mustTry": ["Torta Tres Leches", "Flat White"],
        "reservation": "Nicht nötig",
        "googlePlaceId": "ChIJn8J72VlZYpYR1pRkNvztNF4",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&auto=format&fit=crop",
                "caption": "Kaffee und Kuchen",
                "credit": "Nathan Dumlao",
                "license": "Unsplash License",
            }
        ],
    },
    "Cocina y Amor": {
        "mustTry": ["Reineta mit Chilote-Kräutern", "Chilotanisches Risotto"],
        "reservation": "Empfohlen",
        "googlePlaceId": "ChIJ7e1bGCDcYpYR2_n0KBPXn1E",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop",
                "caption": "Abendessen in Puerto Varas",
                "credit": "Thomas Schaefer",
                "license": "Unsplash License",
            }
        ],
    },
    "Cafe El Kiosco": {
        "contact": {"phone": "+56 51 221 1222"},
        "mustTry": ["Papayas con Crema", "Sandwich Barros Luco"],
        "reservation": "Walk-in",
        "googlePlaceId": "ChIJi8J1H6z3YpYR7Vj1vZ1tcIA",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&auto=format&fit=crop",
                "caption": "Cafe in La Serena",
                "credit": "Pablo Merchán",
                "license": "Unsplash License",
            }
        ],
    },
    "La Recova Market": {
        "mustTry": ["Papayasaft", "Handwerk aus Lapislazuli"],
        "reservation": "Nicht erforderlich",
        "googlePlaceId": "ChIJjZy9fWb4YpYRmS5aXoaZySU",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=600&auto=format&fit=crop",
                "caption": "Marktstände La Recova",
                "credit": "Giorgio Trovato",
                "license": "Unsplash License",
            }
        ],
    },
    "Fabrica de Cecinas Fischer": {
        "mustTry": ["Fischer Wurstplatte", "Kräuter-Käse"],
        "reservation": "Nicht nötig",
        "googlePlaceId": "ChIJyUR2uM7CYpYR7bHimoMuquI",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1484981184820-2e84ea0b2700?w=600&auto=format&fit=crop",
                "caption": "Delikatessenladen",
                "credit": "Jakub Kapusnak",
                "license": "Unsplash License",
            }
        ],
    },
}

ACTIVITY_ENRICHMENTS = {
    "Streetart Walk Valparaíso": {
        "website": "https://www.tours4tips.com/valparaiso",
        "meetingPoint": "Plaza Anibal Pinto um 10:00 Uhr",
        "gear": ["Bequeme Schuhe", "Kamera"],
        "difficulty": "leicht",
        "groupSize": "max. 12 Personen",
        "included": ["Guide", "Streetart-Map"],
        "notes": "Trinkgeld-basiert – 10.000 CLP pro Person empfohlen.",
    },
    "Rapa Nui Sunrise": {
        "website": "https://www.mahinatur.cl",
        "meetingPoint": "Hotel Lobby 04:30 Uhr",
        "gear": ["Windjacke", "Kopflampe"],
        "difficulty": "leicht",
        "groupSize": "max. 8 Personen",
        "included": ["Nationalpark-Ticket", "Breakfast Box"],
        "notes": "Respektabstand zu den Moai einhalten, Stativ erlaubt.",
    },
    "Atacama Stargazing": {
        "website": "https://www.spaceobs.com",
        "meetingPoint": "SpaceObs Observatory 20:00 Uhr",
        "gear": ["Warme Kleidung", "Kamera"],
        "difficulty": "leicht",
        "groupSize": "max. 12 Personen",
        "included": ["Transport", "Teleskop", "Heißgetränke"],
        "notes": "Wolkenlosigkeit prüfen – kurzfristige Umbuchung möglich.",
    },
    "Base Torres Trek": {
        "website": "https://chilenativo.com",
        "meetingPoint": "Puerto Natales 06:30 Uhr",
        "gear": ["Trekkingstöcke", "Regenschutz", "Lunchpaket"],
        "difficulty": "anspruchsvoll",
        "groupSize": "max. 8 Personen",
        "included": ["Transport", "Guide", "Erste-Hilfe Set"],
        "notes": "700 m Höhenmeter, starke Winde – Handschuhe einpacken.",
    },
    "Geysire del Tatio": {
        "website": "https://www.desertadventure.cl",
        "meetingPoint": "Hotel Pick-up 04:30 Uhr",
        "gear": ["Warme Layer", "Mütze", "Badesachen"],
        "difficulty": "mittel",
        "groupSize": "max. 15 Personen",
        "included": ["Frühstück", "Guide", "Oxygen-Kit"],
        "notes": "Höhe 4.300 m – langsame Bewegungen, viel trinken.",
    },
    "Surfkurs Punta de Lobos": {
        "website": "https://www.pichilemusurfschool.cl",
        "meetingPoint": "Surf School Base 09:30 Uhr",
        "gear": ["Neoprenanzug", "Sonnencreme"],
        "difficulty": "mittel",
        "groupSize": "max. 6 Personen",
        "included": ["Board", "Neoprenanzug", "Foto/Video"],
        "notes": "Beste Bedingungen bei Ebbe, Unterricht in Englisch & Spanisch.",
    },
    "Kayak Llanquihue": {
        "website": "https://www.kokayak.cl",
        "meetingPoint": "Puerto Chico 08:30 Uhr",
        "gear": ["Wasserfeste Kleidung", "Sonnenhut"],
        "difficulty": "leicht",
        "groupSize": "max. 10 Personen",
        "included": ["Doppelkajak", "Guide", "Heißgetränke"],
        "notes": "Delfinsichtungen möglich – Kamera wasserdicht verpacken.",
    },
    "Sunrise Moai Shooting": {
        "website": "https://www.mahinatur.cl",
        "meetingPoint": "Hotel Pick-up 05:00 Uhr",
        "gear": ["Stativ", "Graufilter"],
        "difficulty": "leicht",
        "groupSize": "max. 6 Personen",
        "included": ["Privater Guide", "Transfer", "Permit"],
        "notes": "Golden Hour am Ahu Tongariki – respektvolle Distanz einhalten.",
    },
    "Private Thermal Retreat": {
        "website": "https://www.termasvalledecolina.cl",
        "meetingPoint": "Santiago Hotel 08:00 Uhr",
        "gear": ["Badesachen", "Flip-Flops"],
        "difficulty": "leicht",
        "groupSize": "max. 2 Personen",
        "included": ["Private Cabana", "Sekt", "Snacks"],
        "notes": "Thermalbecken zwischen 30–50°C, Höhenlage 2.500 m.",
    },
    "Sunset Cruise Llanquihue": {
        "website": "https://www.southernlakes.cl",
        "meetingPoint": "Muelle Puerto Varas 18:00 Uhr",
        "gear": ["Windjacke", "Kamera"],
        "difficulty": "leicht",
        "groupSize": "max. 10 Personen",
        "included": ["Glas Sekt", "Fingerfood", "Guide"],
        "notes": "Beste Sicht auf Vulkan Osorno bei klarer Sicht.",
    },
    "Chilenischer Kochkurs": {
        "website": "https://www.culinariachile.cl",
        "meetingPoint": "La Serena Markt 10:00 Uhr",
        "gear": ["Schürze"],
        "difficulty": "leicht",
        "groupSize": "max. 8 Personen",
        "included": ["Einkauf am Markt", "Kochkurs", "Rezepte"],
        "notes": "Vegetarische Optionen verfügbar.",
    },
    "Observatorium Mamalluca": {
        "website": "https://www.observatoriomamalluca.cl",
        "meetingPoint": "Touristeninfo Vicuña 20:00 Uhr",
        "gear": ["Jacke", "Kamera"],
        "difficulty": "leicht",
        "groupSize": "max. 15 Personen",
        "included": ["Transport", "Teleskope", "Astronomie-Guide"],
        "notes": "Spanisch & Englisch, warme Kleidung für kühle Nächte.",
    },
    "Weinverkostung Casa del Bosque": {
        "website": "https://www.casadelbosque.cl",
        "meetingPoint": "Weingut Empfang 11:00 Uhr",
        "gear": ["Bequeme Kleidung"],
        "difficulty": "leicht",
        "groupSize": "max. 12 Personen",
        "included": ["Kellerführung", "4 Weine", "Käseplatte"],
        "notes": "Fahrer:in sollte verzichten – Shuttle buchbar.",
    },
}


def nights_between(start: str | None, end: str | None) -> int:
    """Calculate nights between two ISO date strings."""

    if not start or not end:
        return 0
    try:
        begin = datetime.fromisoformat(start)
        finish = datetime.fromisoformat(end)
    except ValueError:
        return 0
    delta = finish - begin
    return max(delta.days, 0)


def stops(*ids: str) -> list[dict]:
    return [deepcopy(STOPS[sid]) for sid in ids]

routes: list[dict] = []

routes.append(
    {
        "id": "var1",
        "name": "Variante 1 – Zentral + Osterinsel + Atacama",
        "color": "#5bd1ff",
        "tags": ["culture", "nature", "adventure"],
        "summary": "Kultur, Osterinsel und Atacama mit Surf-Finale in Pichilemu.",
        "meta": {
            "theme": "Kultur • Inseln • Wüste",
            "pace": "ausgewogen",
            "durationDays": 19,
            "costEstimate": 3200,
            "highlights": ["Rapa Nui", "Valle de la Luna", "Streetart Valparaíso"],
            "scores": {"budget": 3, "adventure": 3, "relax": 3, "culture": 4},
        },
        "costBreakdown": {
            "currency": "EUR",
            "items": [
                {"category": "Flüge", "estimate": 1450, "notes": "SCL↔IPC, IPC→CJC, CJC→SCL"},
                {"category": "Unterkünfte", "estimate": 950, "notes": "Eco-Lodges & Boutique Hotels"},
                {"category": "Transport", "estimate": 380, "notes": "Bus, Taxi, Surf-Van"},
                {"category": "Aktivitäten", "estimate": 220, "notes": "Sunrise-Touren & Surfkurs"},
                {"category": "Food", "estimate": 200, "notes": "Streetfood + Degustation"},
            ],
        },
        "stops": stops(
            "scl-airport",
            "terminal-alameda",
            "valparaiso-center",
            "vina-del-mar",
            "ipc-airport",
            "hanga-roa-lodge",
            "rano-raraku",
            "cjc-airport",
            "san-pedro",
            "valle-luna",
            "pichilemu",
            "punta-lobos",
            "santiago-center",
        ),
        "segments": [
            {"from": "scl-airport", "to": "terminal-alameda", "mode": "bus", "distanceKm": 18, "durationMinutes": 35, "price": 5},
            {"from": "terminal-alameda", "to": "valparaiso-center", "mode": "bus", "distanceKm": 120, "durationMinutes": 110, "price": 9},
            {"from": "valparaiso-center", "to": "ipc-airport", "mode": "flight", "distanceKm": 3750, "durationMinutes": 330, "price": 480},
            {"from": "ipc-airport", "to": "rano-raraku", "mode": "drive", "distanceKm": 17, "durationMinutes": 30, "price": 35},
            {"from": "ipc-airport", "to": "cjc-airport", "mode": "flight", "distanceKm": 4200, "durationMinutes": 310, "price": 410},
            {"from": "cjc-airport", "to": "san-pedro", "mode": "bus", "distanceKm": 105, "durationMinutes": 90, "price": 12},
            {"from": "san-pedro", "to": "valle-luna", "mode": "drive", "distanceKm": 13, "durationMinutes": 25, "price": 18},
            {"from": "san-pedro", "to": "pichilemu", "mode": "flight", "distanceKm": 1540, "durationMinutes": 210, "price": 160},
            {"from": "pichilemu", "to": "punta-lobos", "mode": "walk", "distanceKm": 4, "durationMinutes": 50, "price": 0},
            {"from": "pichilemu", "to": "santiago-center", "mode": "bus", "distanceKm": 215, "durationMinutes": 210, "price": 14},
        ],
        "flights": [
            {
                "id": "flight-scl-ipc",
                "fromStopId": "scl-airport",
                "toStopId": "ipc-airport",
                "airline": "LATAM",
                "flightNumber": "LA841",
                "departure": "2025-01-05T08:40:00-03:00",
                "arrival": "2025-01-05T12:35:00-06:00",
                "durationMinutes": 295,
                "price": 480,
                "currency": "EUR",
                "bookingUrl": "https://www.latamairlines.com/",
            },
            {
                "id": "flight-ipc-cjc",
                "fromStopId": "ipc-airport",
                "toStopId": "cjc-airport",
                "airline": "Sky Airline",
                "flightNumber": "H2193",
                "departure": "2025-01-10T13:10:00-06:00",
                "arrival": "2025-01-10T17:20:00-03:00",
                "durationMinutes": 250,
                "price": 410,
                "currency": "EUR",
                "bookingUrl": "https://www.skyairline.com/",
            },
            {
                "id": "flight-cjc-scl",
                "fromStopId": "cjc-airport",
                "toStopId": "scl-airport",
                "airline": "LATAM",
                "flightNumber": "LA329",
                "departure": "2025-01-16T19:40:00-03:00",
                "arrival": "2025-01-16T21:45:00-03:00",
                "durationMinutes": 125,
                "price": 160,
                "currency": "EUR",
                "bookingUrl": "https://www.latamairlines.com/",
            },
        ],
        "lodging": [
            {
                "name": "Hotel Casa Higueras",
                "stopId": "valparaiso-center",
                "checkIn": "2025-01-04",
                "checkOut": "2025-01-06",
                "website": "https://www.casahigueras.cl",
                "pricePerNight": 180,
                "currency": "EUR",
                "roomType": "Premium Doppelzimmer",
            },
            {
                "name": "Hare Uta Hotel",
                "stopId": "hanga-roa-lodge",
                "checkIn": "2025-01-06",
                "checkOut": "2025-01-09",
                "website": "https://www.hareuta.cl",
                "pricePerNight": 210,
                "currency": "EUR",
                "roomType": "Bungalow",
            },
            {
                "name": "Hotel Desertica",
                "stopId": "san-pedro",
                "checkIn": "2025-01-09",
                "checkOut": "2025-01-13",
                "website": "https://www.desertica.cl",
                "pricePerNight": 195,
                "currency": "EUR",
                "roomType": "Suite Adobe",
            },
        ],
        "food": [
            {
                "name": "Mercado Central",
                "stopId": "santiago-center",
                "type": "Seafood Market",
                "address": "San Pablo 967, Santiago",
                "openingHours": "09:00–18:00",
                "specialties": ["Curanto", "Ceviche Mixto"],
                "priceRange": "€€",
            },
            {
                "name": "Empanadas Hanga Roa",
                "stopId": "hanga-roa-lodge",
                "type": "Streetfood",
                "address": "Atamu Tekena, Hanga Roa",
                "openingHours": "12:00–21:00",
                "specialties": ["Empanada de Atún", "Jugos Naturales"],
                "priceRange": "€",
            },
        ],
        "activities": [
            {
                "title": "Streetart Walk Valparaíso",
                "stopId": "valparaiso-center",
                "durationHours": 3,
                "operator": "Tours4Tips",
                "price": 15,
                "currency": "EUR",
            },
            {
                "title": "Rapa Nui Sunrise",
                "stopId": "rano-raraku",
                "durationHours": 5,
                "operator": "Mahinatur",
                "price": 85,
                "currency": "EUR",
            },
            {
                "title": "Atacama Stargazing",
                "stopId": "san-pedro",
                "durationHours": 2,
                "operator": "SpaceObs",
                "price": 40,
                "currency": "EUR",
            },
        ],
        "notes": "Flex-Tag in Santiago am Ende einplanen, um Festivals mitzunehmen.",
    }
)

routes.append(
    {
        "id": "var2",
        "name": "Variante 2 – Patagonien + Atacama",
        "color": "#8affc1",
        "tags": ["nature", "adventure", "photography"],
        "summary": "Gletscher und Geysire im schnellen Wechsel.",
        "meta": {
            "theme": "Patagonien • Atacama",
            "pace": "zügig",
            "durationDays": 19,
            "costEstimate": 3400,
            "highlights": ["Base Torres", "El Tatio", "Lago Grey"],
            "scores": {"budget": 2, "adventure": 4, "relax": 2, "culture": 3},
        },
        "costBreakdown": {
            "currency": "EUR",
            "items": [
                {"category": "Flüge", "estimate": 1650, "notes": "SCL→PUQ→CJC→SCL"},
                {"category": "Unterkünfte", "estimate": 980, "notes": "Refugio + Boutique"},
                {"category": "Guides", "estimate": 280, "notes": "Base Torres Trek, Geysire"},
                {"category": "Transport", "estimate": 220, "notes": "Busse & Transfers"},
                {"category": "Essen", "estimate": 220, "notes": "Patagonische Küche"},
            ],
        },
        "stops": stops(
            "scl-airport",
            "valparaiso-center",
            "punta-arenas-airport",
            "puerto-natales",
            "torres-base",
            "cjc-airport",
            "san-pedro",
            "valle-luna",
            "santiago-center",
        ),
        "segments": [
            {"from": "scl-airport", "to": "valparaiso-center", "mode": "bus", "distanceKm": 120, "durationMinutes": 110, "price": 9},
            {"from": "scl-airport", "to": "punta-arenas-airport", "mode": "flight", "distanceKm": 2180, "durationMinutes": 195, "price": 320},
            {"from": "punta-arenas-airport", "to": "puerto-natales", "mode": "bus", "distanceKm": 250, "durationMinutes": 190, "price": 12},
            {"from": "puerto-natales", "to": "torres-base", "mode": "bus", "distanceKm": 146, "durationMinutes": 150, "price": 18},
            {"from": "punta-arenas-airport", "to": "cjc-airport", "mode": "flight", "distanceKm": 3620, "durationMinutes": 320, "price": 480},
            {"from": "cjc-airport", "to": "san-pedro", "mode": "bus", "distanceKm": 105, "durationMinutes": 90, "price": 12},
            {"from": "san-pedro", "to": "valle-luna", "mode": "drive", "distanceKm": 13, "durationMinutes": 25, "price": 18},
            {"from": "cjc-airport", "to": "santiago-center", "mode": "flight", "distanceKm": 1220, "durationMinutes": 120, "price": 160},
        ],
        "flights": [
            {
                "id": "flight-scl-puq",
                "fromStopId": "scl-airport",
                "toStopId": "punta-arenas-airport",
                "airline": "LATAM",
                "flightNumber": "LA285",
                "departure": "2025-01-05T07:20:00-03:00",
                "arrival": "2025-01-05T10:35:00-03:00",
                "durationMinutes": 195,
                "price": 320,
                "currency": "EUR",
            },
            {
                "id": "flight-puq-cjc",
                "fromStopId": "punta-arenas-airport",
                "toStopId": "cjc-airport",
                "airline": "Sky Airline",
                "flightNumber": "H520",
                "departure": "2025-01-11T12:00:00-03:00",
                "arrival": "2025-01-11T17:20:00-03:00",
                "durationMinutes": 320,
                "price": 480,
                "currency": "EUR",
            },
            {
                "id": "flight-cjc-scl-final",
                "fromStopId": "cjc-airport",
                "toStopId": "scl-airport",
                "airline": "LATAM",
                "flightNumber": "LA329",
                "departure": "2025-01-17T18:40:00-03:00",
                "arrival": "2025-01-17T20:45:00-03:00",
                "durationMinutes": 125,
                "price": 160,
                "currency": "EUR",
            },
        ],
        "lodging": [
            {
                "name": "Hotel Cabo de Hornos",
                "stopId": "punta-arenas-airport",
                "checkIn": "2025-01-05",
                "checkOut": "2025-01-06",
                "website": "https://www.hotelcabodehornos.com",
                "pricePerNight": 140,
                "currency": "EUR",
            },
            {
                "name": "Hotel Lago Grey",
                "stopId": "torres-base",
                "checkIn": "2025-01-06",
                "checkOut": "2025-01-09",
                "website": "https://www.lagogrey.com",
                "pricePerNight": 260,
                "currency": "EUR",
            },
            {
                "name": "Hotel Noi Casa Atacama",
                "stopId": "san-pedro",
                "checkIn": "2025-01-11",
                "checkOut": "2025-01-15",
                "website": "https://www.noihotels.com",
                "pricePerNight": 230,
                "currency": "EUR",
            },
        ],
        "food": [
            {
                "name": "Damiana Elena",
                "stopId": "puerto-natales",
                "type": "Restaurant",
                "address": "Hermann Eberhard 385, Puerto Natales",
                "openingHours": "19:00–23:00",
                "specialties": ["Patagonisches Lamm", "Königskrabbe"],
                "priceRange": "€€€",
            },
            {
                "name": "El Huerto",
                "stopId": "san-pedro",
                "type": "Vegetarisch",
                "address": "Gustavo Le Paige 419, San Pedro",
                "openingHours": "13:00–22:00",
                "specialties": ["Quinoa-Burger", "Kaktus-Salat"],
                "priceRange": "€€",
            },
        ],
        "activities": [
            {
                "title": "Base Torres Trek",
                "stopId": "torres-base",
                "durationHours": 9,
                "operator": "Chile Nativo",
                "price": 120,
                "currency": "EUR",
            },
            {
                "title": "Geysire del Tatio",
                "stopId": "san-pedro",
                "durationHours": 7,
                "operator": "Desert Adventures",
                "price": 60,
                "currency": "EUR",
            },
        ],
        "notes": "Warme Layer für Patagonien und Höhenanpassung für San Pedro einplanen.",
    }
)

routes.append(
    {
        "id": "var3",
        "name": "Variante 3 – Roadtrip Küste • Seen • Chiloé",
        "color": "#ffb86b",
        "tags": ["nature", "food", "culture"],
        "summary": "Gemächlicher Roadtrip von Santiago bis Chiloé.",
        "meta": {
            "theme": "Küste & Seen Roadtrip",
            "pace": "gemütlich",
            "durationDays": 19,
            "costEstimate": 2600,
            "highlights": ["Valparaíso", "Pucón", "Chiloé"],
            "scores": {"budget": 4, "adventure": 3, "relax": 4, "culture": 3},
        },
        "costBreakdown": {
            "currency": "EUR",
            "items": [
                {"category": "Mietwagen", "estimate": 620, "notes": "SUV mit Vollkasko"},
                {"category": "Unterkünfte", "estimate": 880, "notes": "B&B + Cabañas"},
                {"category": "Fähren", "estimate": 90, "notes": "Überfahrt nach Chiloé"},
                {"category": "Aktivitäten", "estimate": 180, "notes": "Thermen, Nationalparks"},
                {"category": "Food", "estimate": 220, "notes": "Seafood & Craft Beer"},
            ],
        },
        "stops": stops(
            "scl-airport",
            "valparaiso-center",
            "vina-del-mar",
            "pichilemu",
            "pucon",
            "puerto-varas",
            "castro",
            "puerto-montt-airport",
            "santiago-center",
        ),
        "segments": [
            {"from": "scl-airport", "to": "valparaiso-center", "mode": "drive", "distanceKm": 120, "durationMinutes": 110, "price": 20},
            {"from": "valparaiso-center", "to": "pichilemu", "mode": "drive", "distanceKm": 190, "durationMinutes": 180, "price": 30},
            {"from": "pichilemu", "to": "pucon", "mode": "drive", "distanceKm": 620, "durationMinutes": 480, "price": 75},
            {"from": "pucon", "to": "puerto-varas", "mode": "drive", "distanceKm": 315, "durationMinutes": 240, "price": 40},
            {"from": "puerto-varas", "to": "castro", "mode": "ferry", "distanceKm": 85, "durationMinutes": 180, "price": 25},
            {"from": "castro", "to": "puerto-montt-airport", "mode": "drive", "distanceKm": 180, "durationMinutes": 150, "price": 25},
            {"from": "puerto-montt-airport", "to": "santiago-center", "mode": "flight", "distanceKm": 918, "durationMinutes": 110, "price": 95},
        ],
        "flights": [
            {
                "id": "flight-pmc-scl",
                "fromStopId": "puerto-montt-airport",
                "toStopId": "scl-airport",
                "airline": "Sky Airline",
                "flightNumber": "H012",
                "departure": "2025-01-18T16:00:00-03:00",
                "arrival": "2025-01-18T17:45:00-03:00",
                "durationMinutes": 105,
                "price": 95,
                "currency": "EUR",
            }
        ],
        "lodging": [
            {
                "name": "WineBox Valparaíso",
                "stopId": "valparaiso-center",
                "checkIn": "2025-01-03",
                "checkOut": "2025-01-05",
                "website": "https://wineboxvalparaiso.cl",
                "pricePerNight": 130,
                "currency": "EUR",
            },
            {
                "name": "Hotel Antumalal",
                "stopId": "pucon",
                "checkIn": "2025-01-07",
                "checkOut": "2025-01-10",
                "website": "https://www.antumalal.com",
                "pricePerNight": 180,
                "currency": "EUR",
            },
            {
                "name": "Palafito 1326",
                "stopId": "castro",
                "checkIn": "2025-01-12",
                "checkOut": "2025-01-15",
                "website": "https://palafito1326.cl",
                "pricePerNight": 160,
                "currency": "EUR",
            },
        ],
        "food": [
            {
                "name": "Apice Cocina",
                "stopId": "valparaiso-center",
                "type": "Fine Dining",
                "address": "Calle Templeman 494, Valparaíso",
                "openingHours": "19:00–23:00",
                "specialties": ["Degustationsmenü"],
                "priceRange": "€€€",
            },
            {
                "name": "Feria Costumbrista de Chonchi",
                "stopId": "castro",
                "type": "Markt",
                "address": "Costanera de Chonchi",
                "openingHours": "10:00–18:00",
                "specialties": ["Curanto", "Milcao"],
                "priceRange": "€",
            },
        ],
        "activities": [
            {
                "title": "Surfkurs Punta de Lobos",
                "stopId": "pichilemu",
                "durationHours": 2,
                "operator": "Pichilemu Surf School",
                "price": 45,
                "currency": "EUR",
            },
            {
                "title": "Kayak Llanquihue",
                "stopId": "puerto-varas",
                "durationHours": 3,
                "operator": "KO Kayak",
                "price": 55,
                "currency": "EUR",
            },
        ],
        "notes": "Zwei Ruhetage in Puerto Varas einplanen, um flexibel zu bleiben.",
    }
)

routes.append(
    {
        "id": "var4",
        "name": "Variante 4 – Instagram-Hotspots",
        "color": "#c792ea",
        "tags": ["photography", "adventure", "culture"],
        "summary": "Die fotogensten Orte Chiles mit Fokus auf Sunrise & Golden Hour.",
        "meta": {
            "theme": "IG-Hotspots",
            "pace": "zügig",
            "durationDays": 19,
            "costEstimate": 3600,
            "highlights": ["Ahu Tongariki", "Base Torres", "Valle de la Luna"],
            "scores": {"budget": 2, "adventure": 3, "relax": 2, "culture": 3},
        },
        "costBreakdown": {
            "currency": "EUR",
            "items": [
                {"category": "Flüge", "estimate": 1900, "notes": "Mehrere Inlandsflüge"},
                {"category": "Unterkünfte", "estimate": 900, "notes": "Fotofreundliche Hotels"},
                {"category": "Guides", "estimate": 320, "notes": "Foto-Guides & Permits"},
                {"category": "Transport", "estimate": 220, "notes": "Private Transfers"},
                {"category": "Food", "estimate": 180, "notes": "Snacks & Cafés"},
            ],
        },
        "stops": stops(
            "santiago-center",
            "valparaiso-center",
            "valle-luna",
            "torres-base",
            "ipc-airport",
            "rano-raraku",
            "pichilemu",
            "punta-lobos",
        ),
        "segments": [
            {"from": "santiago-center", "to": "valparaiso-center", "mode": "bus", "distanceKm": 120, "durationMinutes": 110, "price": 9},
            {"from": "santiago-center", "to": "valle-luna", "mode": "flight", "distanceKm": 1220, "durationMinutes": 120, "price": 160},
            {"from": "valle-luna", "to": "torres-base", "mode": "flight", "distanceKm": 2180, "durationMinutes": 190, "price": 320},
            {"from": "santiago-center", "to": "ipc-airport", "mode": "flight", "distanceKm": 3750, "durationMinutes": 330, "price": 500},
            {"from": "ipc-airport", "to": "rano-raraku", "mode": "drive", "distanceKm": 17, "durationMinutes": 30, "price": 35},
            {"from": "santiago-center", "to": "pichilemu", "mode": "bus", "distanceKm": 215, "durationMinutes": 210, "price": 14},
            {"from": "pichilemu", "to": "punta-lobos", "mode": "walk", "distanceKm": 4, "durationMinutes": 50, "price": 0},
        ],
        "flights": [
            {
                "id": "flight-scl-calama",
                "fromStopId": "santiago-center",
                "toStopId": "valle-luna",
                "airline": "LATAM",
                "flightNumber": "LA330",
                "departure": "2025-01-05T06:30:00-03:00",
                "arrival": "2025-01-05T08:35:00-03:00",
                "durationMinutes": 125,
                "price": 160,
                "currency": "EUR",
            },
            {
                "id": "flight-scl-puq",
                "fromStopId": "santiago-center",
                "toStopId": "torres-base",
                "airline": "JetSMART",
                "flightNumber": "JA117",
                "departure": "2025-01-10T05:45:00-03:00",
                "arrival": "2025-01-10T09:20:00-03:00",
                "durationMinutes": 215,
                "price": 210,
                "currency": "EUR",
            },
            {
                "id": "flight-scl-rapa",
                "fromStopId": "santiago-center",
                "toStopId": "ipc-airport",
                "airline": "LATAM",
                "flightNumber": "LA841",
                "departure": "2025-01-14T08:40:00-03:00",
                "arrival": "2025-01-14T12:35:00-06:00",
                "durationMinutes": 295,
                "price": 500,
                "currency": "EUR",
            },
        ],
        "lodging": [
            {
                "name": "Hotel Magnolia",
                "stopId": "santiago-center",
                "checkIn": "2025-01-03",
                "checkOut": "2025-01-05",
                "website": "https://www.hotelmagnolia.cl",
                "pricePerNight": 160,
                "currency": "EUR",
            },
            {
                "name": "Explora Atacama",
                "stopId": "valle-luna",
                "checkIn": "2025-01-05",
                "checkOut": "2025-01-08",
                "website": "https://www.explora.com",
                "pricePerNight": 520,
                "currency": "EUR",
            },
        ],
        "food": [
            {
                "name": "Café Matilde",
                "stopId": "santiago-center",
                "type": "Café",
                "address": "Jose Victorino Lastarria 43, Santiago",
                "openingHours": "09:00–20:00",
                "specialties": ["Flat White", "Torta Tres Leches"],
                "priceRange": "€€",
            }
        ],
        "activities": [
            {
                "title": "Sunrise Moai Shooting",
                "stopId": "rano-raraku",
                "durationHours": 4,
                "operator": "Mahinatur",
                "price": 95,
                "currency": "EUR",
            }
        ],
        "notes": "Filtersets und Akkus einpacken – viele Sonnenaufgänge.",
    }
)

routes.append(
    {
        "id": "var5",
        "name": "Variante 5 – Budget & Bus",
        "color": "#f7768e",
        "tags": ["budget", "culture", "nature"],
        "summary": "Langstreckenbusse, Hostales und lokale Märkte.",
        "meta": {
            "theme": "Budget & Bus",
            "pace": "ausgewogen",
            "durationDays": 19,
            "costEstimate": 2200,
            "highlights": ["Elqui-Tal", "San Pedro", "Chiloé"],
            "scores": {"budget": 5, "adventure": 3, "relax": 3, "culture": 3},
        },
        "costBreakdown": {
            "currency": "EUR",
            "items": [
                {"category": "Buspässe", "estimate": 420, "notes": "Nachtbusse & Sitz-Upgrades"},
                {"category": "Unterkünfte", "estimate": 750, "notes": "Hostales & Cabañas"},
                {"category": "Aktivitäten", "estimate": 160, "notes": "Observatorium, Trekking"},
                {"category": "Food", "estimate": 260, "notes": "Märkte & einfache Restaurants"},
                {"category": "Extras", "estimate": 110, "notes": "Eintritte & Leihgeräte"},
            ],
        },
        "stops": stops(
            "terminal-alameda",
            "la-serena",
            "vicuna",
            "antofagasta",
            "san-pedro",
            "pucon",
            "puerto-varas",
            "castro",
            "santiago-center",
        ),
        "segments": [
            {"from": "terminal-alameda", "to": "la-serena", "mode": "bus", "distanceKm": 470, "durationMinutes": 400, "price": 25},
            {"from": "la-serena", "to": "vicuna", "mode": "bus", "distanceKm": 62, "durationMinutes": 70, "price": 4},
            {"from": "vicuna", "to": "antofagasta", "mode": "bus", "distanceKm": 875, "durationMinutes": 780, "price": 32},
            {"from": "antofagasta", "to": "san-pedro", "mode": "bus", "distanceKm": 312, "durationMinutes": 320, "price": 18},
            {"from": "san-pedro", "to": "pucon", "mode": "bus", "distanceKm": 1550, "durationMinutes": 1080, "price": 52},
            {"from": "pucon", "to": "puerto-varas", "mode": "bus", "distanceKm": 315, "durationMinutes": 300, "price": 16},
            {"from": "puerto-varas", "to": "castro", "mode": "bus", "distanceKm": 180, "durationMinutes": 180, "price": 10},
            {"from": "castro", "to": "santiago-center", "mode": "bus", "distanceKm": 1210, "durationMinutes": 960, "price": 45},
        ],
        "flights": [],
        "lodging": [
            {
                "name": "Hostal El Arbol",
                "stopId": "la-serena",
                "checkIn": "2025-01-03",
                "checkOut": "2025-01-05",
                "pricePerNight": 40,
                "currency": "EUR",
            },
            {
                "name": "Refugio CasaBosque",
                "stopId": "pucon",
                "checkIn": "2025-01-11",
                "checkOut": "2025-01-14",
                "pricePerNight": 55,
                "currency": "EUR",
            },
        ],
        "food": [
            {
                "name": "La Recova Market",
                "stopId": "la-serena",
                "type": "Markt",
                "openingHours": "09:00–18:00",
                "specialties": ["Papayas", "Empanadas"],
                "priceRange": "€",
            },
            {
                "name": "Cafe El Kiosco",
                "stopId": "puerto-varas",
                "type": "Konditorei",
                "openingHours": "08:00–20:00",
                "specialties": ["Kuchen", "Kaffee"],
                "priceRange": "€€",
            },
        ],
        "activities": [
            {
                "title": "Observatorium Mamalluca",
                "stopId": "vicuna",
                "durationHours": 3,
                "operator": "Observatorio Mamalluca",
                "price": 18,
                "currency": "EUR",
            }
        ],
        "notes": "Nachtbusse mit Cama-Sitz wählen für mehr Komfort.",
    }
)

routes.append(
    {
        "id": "var6",
        "name": "Variante 6 – Kulinarik & Weintäler",
        "color": "#52fa7c",
        "tags": ["food", "wine", "culture"],
        "summary": "Wein- und Food-Fokus zwischen Santiago und Concepción.",
        "meta": {
            "theme": "Wein & Küche",
            "pace": "gemütlich",
            "durationDays": 19,
            "costEstimate": 2500,
            "highlights": ["Casablanca", "Colchagua", "Concepción"],
            "scores": {"budget": 4, "adventure": 2, "relax": 4, "culture": 4},
        },
        "costBreakdown": {
            "currency": "EUR",
            "items": [
                {"category": "Degustationen", "estimate": 420, "notes": "Geführte Touren"},
                {"category": "Unterkünfte", "estimate": 820, "notes": "Boutique Lodges"},
                {"category": "Transport", "estimate": 310, "notes": "Mietwagen & Fahrer"},
                {"category": "Food", "estimate": 320, "notes": "Verkostungen & Fine Dining"},
                {"category": "Workshops", "estimate": 150, "notes": "Cooking Class & Käse"},
            ],
        },
        "stops": stops(
            "santiago-center",
            "valparaiso-center",
            "santa-cruz",
            "talca",
            "concepcion",
            "santiago-center",
        ),
        "segments": [
            {"from": "santiago-center", "to": "valparaiso-center", "mode": "drive", "distanceKm": 120, "durationMinutes": 110, "price": 20},
            {"from": "valparaiso-center", "to": "santa-cruz", "mode": "drive", "distanceKm": 190, "durationMinutes": 180, "price": 32},
            {"from": "santa-cruz", "to": "talca", "mode": "drive", "distanceKm": 120, "durationMinutes": 110, "price": 18},
            {"from": "talca", "to": "concepcion", "mode": "drive", "distanceKm": 210, "durationMinutes": 180, "price": 28},
            {"from": "concepcion", "to": "santiago-center", "mode": "bus", "distanceKm": 500, "durationMinutes": 320, "price": 17},
        ],
        "flights": [],
        "lodging": [
            {
                "name": "La Casona Matetic",
                "stopId": "valparaiso-center",
                "checkIn": "2025-01-04",
                "checkOut": "2025-01-06",
                "website": "https://www.matetic.com",
                "pricePerNight": 210,
                "currency": "EUR",
            },
            {
                "name": "Clos Apalta Residence",
                "stopId": "santa-cruz",
                "checkIn": "2025-01-06",
                "checkOut": "2025-01-09",
                "website": "https://www.closapalta.cl",
                "pricePerNight": 260,
                "currency": "EUR",
            },
        ],
        "food": [
            {
                "name": "Bocanáriz Wine Bar",
                "stopId": "santiago-center",
                "type": "Wine Bar",
                "address": "Lastarria 276, Santiago",
                "openingHours": "12:00–00:00",
                "specialties": ["Flight Degustationen", "Tapas"],
                "priceRange": "€€€",
            },
            {
                "name": "Fabrica de Cecinas Fischer",
                "stopId": "concepcion",
                "type": "Delikatessen",
                "openingHours": "09:00–19:00",
                "specialties": ["Charcuterie", "Käse"],
                "priceRange": "€€",
            },
        ],
        "activities": [
            {
                "title": "Weinverkostung Casa del Bosque",
                "stopId": "valparaiso-center",
                "durationHours": 4,
                "operator": "Casa del Bosque",
                "price": 65,
                "currency": "EUR",
            },
            {
                "title": "Chilenischer Kochkurs",
                "stopId": "santa-cruz",
                "durationHours": 3,
                "operator": "Rayuela Wine & Grill",
                "price": 85,
                "currency": "EUR",
            },
        ],
        "notes": "Fahrerwechsel einplanen, damit Verkostungen entspannt bleiben.",
    }
)

routes.append(
    {
        "id": "var7",
        "name": "Variante 7 – Honeymoon Light",
        "color": "#ff79c6",
        "tags": ["honeymoon", "relax", "nature"],
        "summary": "Entspannter Mix aus Wellness, Boutiquehotels und Highlights.",
        "meta": {
            "theme": "Honeymoon Light",
            "pace": "gemütlich",
            "durationDays": 19,
            "costEstimate": 3700,
            "highlights": ["Thermen Maipo", "Boutique Atacama", "EcoCamp"],
            "scores": {"budget": 2, "adventure": 3, "relax": 5, "culture": 3},
        },
        "costBreakdown": {
            "currency": "EUR",
            "items": [
                {"category": "Flüge", "estimate": 1700, "notes": "SCL→CJC→PMC→PUQ"},
                {"category": "Unterkünfte", "estimate": 1500, "notes": "Boutique & Glamping"},
                {"category": "Wellness", "estimate": 280, "notes": "Spa & Private Experiences"},
                {"category": "Food", "estimate": 220, "notes": "Fine Dining"},
            ],
        },
        "stops": stops(
            "santiago-center",
            "colchagua-lodge",
            "cajon-maipo",
            "san-pedro-boutique",
            "puerto-varas",
            "castro",
            "torres-ecocamp",
            "scl-airport",
        ),
        "segments": [
            {"from": "santiago-center", "to": "colchagua-lodge", "mode": "drive", "distanceKm": 180, "durationMinutes": 150, "price": 28},
            {"from": "santiago-center", "to": "cajon-maipo", "mode": "drive", "distanceKm": 95, "durationMinutes": 120, "price": 20},
            {"from": "santiago-center", "to": "san-pedro-boutique", "mode": "flight", "distanceKm": 1220, "durationMinutes": 120, "price": 180},
            {"from": "san-pedro-boutique", "to": "puerto-varas", "mode": "flight", "distanceKm": 1880, "durationMinutes": 200, "price": 260},
            {"from": "puerto-varas", "to": "castro", "mode": "ferry", "distanceKm": 85, "durationMinutes": 180, "price": 25},
            {"from": "castro", "to": "torres-ecocamp", "mode": "flight", "distanceKm": 1500, "durationMinutes": 210, "price": 340},
            {"from": "torres-ecocamp", "to": "scl-airport", "mode": "flight", "distanceKm": 2180, "durationMinutes": 195, "price": 320},
        ],
        "flights": [
            {
                "id": "flight-scl-cjc-honeymoon",
                "fromStopId": "santiago-center",
                "toStopId": "san-pedro-boutique",
                "airline": "LATAM",
                "flightNumber": "LA330",
                "departure": "2025-01-06T09:10:00-03:00",
                "arrival": "2025-01-06T11:15:00-03:00",
                "durationMinutes": 125,
                "price": 180,
                "currency": "EUR",
            },
            {
                "id": "flight-cjc-pmc-honeymoon",
                "fromStopId": "san-pedro-boutique",
                "toStopId": "puerto-varas",
                "airline": "Sky Airline",
                "flightNumber": "H420",
                "departure": "2025-01-10T12:30:00-03:00",
                "arrival": "2025-01-10T16:10:00-03:00",
                "durationMinutes": 220,
                "price": 260,
                "currency": "EUR",
            },
            {
                "id": "flight-puq-scl-honeymoon",
                "fromStopId": "torres-ecocamp",
                "toStopId": "scl-airport",
                "airline": "LATAM",
                "flightNumber": "LA286",
                "departure": "2025-01-18T14:00:00-03:00",
                "arrival": "2025-01-18T17:10:00-03:00",
                "durationMinutes": 190,
                "price": 320,
                "currency": "EUR",
            },
        ],
        "lodging": [
            {
                "name": "Viña Vik",
                "stopId": "colchagua-lodge",
                "checkIn": "2025-01-03",
                "checkOut": "2025-01-05",
                "website": "https://www.vinavik.com",
                "pricePerNight": 390,
                "currency": "EUR",
            },
            {
                "name": "Nayara Alto Atacama",
                "stopId": "san-pedro-boutique",
                "checkIn": "2025-01-06",
                "checkOut": "2025-01-10",
                "website": "https://www.nayaratentedcamp.com",
                "pricePerNight": 320,
                "currency": "EUR",
            },
            {
                "name": "EcoCamp Patagonia Suite Dome",
                "stopId": "torres-ecocamp",
                "checkIn": "2025-01-15",
                "checkOut": "2025-01-18",
                "website": "https://www.ecocamp.travel",
                "pricePerNight": 450,
                "currency": "EUR",
            },
        ],
        "food": [
            {
                "name": "Boragó",
                "stopId": "santiago-center",
                "type": "Fine Dining",
                "address": "Av. San José María Escrivá de Balaguer 5970, Vitacura",
                "openingHours": "19:00–23:30",
                "specialties": ["Tasting Menü Endemico"],
                "priceRange": "€€€€",
            },
            {
                "name": "Cocina y Amor",
                "stopId": "puerto-varas",
                "type": "Restaurant",
                "address": "San Pedro 543, Puerto Varas",
                "openingHours": "13:00–22:00",
                "specialties": ["Sopaipillas Gourmet", "Lachs"],
                "priceRange": "€€€",
            },
        ],
        "activities": [
            {
                "title": "Private Thermal Retreat",
                "stopId": "cajon-maipo",
                "durationHours": 4,
                "operator": "Thermas Valle de Colina",
                "price": 95,
                "currency": "EUR",
            },
            {
                "title": "Sunset Cruise Llanquihue",
                "stopId": "puerto-varas",
                "durationHours": 2,
                "operator": "Southern Lakes",
                "price": 70,
                "currency": "EUR",
            },
        ],
        "notes": "Private Ausflüge frühzeitig buchen – Nachfrage in der Hochsaison hoch.",
    }
)


for route in routes:
    segment_distance_map: dict[tuple[str, str], float] = {}
    total_distance = 0.0
    total_carbon = 0.0
    for index, segment in enumerate(route.get("segments", []), start=1):
        segment["id"] = f"{route['id']}-seg-{index:02d}"
        defaults = SEGMENT_MODE_DEFAULTS.get(segment["mode"])
        if defaults:
            deep_merge(segment, deepcopy(defaults))
        specific = SEGMENT_SPECIFICS.get((segment["from"], segment["to"], segment["mode"]))
        if specific:
            deep_merge(segment, deepcopy(specific))
        distance = float(segment.get("distanceKm", 0) or 0)
        segment_distance_map[(segment["from"], segment["to"])] = distance
        total_distance += distance
        factor = CARBON_FACTORS.get(segment["mode"], 0.0)
        carbon = round(distance * factor, 2) if distance else 0.0
        if carbon:
            segment["carbonKg"] = carbon
            total_carbon += carbon

    metrics = route.setdefault("metrics", {})
    metrics["totalDistanceKm"] = round(total_distance, 1)
    metrics["estimatedCarbonKg"] = round(total_carbon, 1)
    metrics["segmentCount"] = len(route.get("segments", []))
    metrics["flightCount"] = sum(1 for seg in route.get("segments", []) if seg["mode"] == "flight")
    metrics["stopCount"] = len(route.get("stops", []))

    flight_carbon = 0.0
    for flight in route.get("flights", []):
        info = FLIGHT_ENRICHMENTS.get(flight["id"])
        if info:
            deep_merge(flight, deepcopy(info))
        if "seatInfo" not in flight and SEGMENT_MODE_DEFAULTS["flight"].get("seatInfo"):
            flight["seatInfo"] = SEGMENT_MODE_DEFAULTS["flight"]["seatInfo"]
        distance = flight.get("distanceKm") or segment_distance_map.get((flight["fromStopId"], flight["toStopId"]))
        if not distance:
            from_stop = STOPS.get(flight["fromStopId"])
            to_stop = STOPS.get(flight["toStopId"])
            if from_stop and to_stop:
                distance = haversine_km(from_stop["coordinates"], to_stop["coordinates"])
        if distance:
            distance = float(distance)
            flight["distanceKm"] = round(distance, 1)
            carbon = round(distance * CARBON_FACTORS["flight"], 2)
            flight["carbonKg"] = carbon
            flight_carbon += carbon
    if flight_carbon:
        metrics["flightCarbonKg"] = round(flight_carbon, 1)
        metrics["groundTransportCarbonKg"] = round(max(total_carbon - flight_carbon, 0), 1)

    total_nights = 0
    total_rate = 0.0
    for stay in route.get("lodging", []):
        info = LODGING_ENRICHMENTS.get(stay["name"])
        if info:
            deep_merge(stay, deepcopy(info))
        nights = nights_between(stay.get("checkIn"), stay.get("checkOut"))
        if nights:
            stay["nights"] = nights
            total_nights += nights
            price = float(stay.get("pricePerNight") or 0)
            total_rate += price * nights
    if total_nights:
        metrics["totalNights"] = total_nights
        metrics["avgNightlyRate"] = round(total_rate / total_nights, 2)
    metrics["lodgingCount"] = len(route.get("lodging", []))

    for item in route.get("food", []):
        info = FOOD_ENRICHMENTS.get(item["name"])
        if info:
            deep_merge(item, deepcopy(info))
    metrics["foodCount"] = len(route.get("food", []))

    for activity in route.get("activities", []):
        info = ACTIVITY_ENRICHMENTS.get(activity["title"])
        if info:
            deep_merge(activity, deepcopy(info))
    metrics["activityCount"] = len(route.get("activities", []))

    duration_days = route.get("meta", {}).get("durationDays", META["defaultDurationDays"])
    cost_estimate = route.get("meta", {}).get("costEstimate", 0)
    if duration_days:
        metrics["averageDailyBudget"] = round(cost_estimate / duration_days, 2)


def main() -> None:
    data = {
        "meta": META,
        "transportModes": TRANSPORT_MODES,
        "tagLibrary": TAG_LIBRARY,
        "gallery": GALLERY,
        "events": EVENTS,
        "templates": TEMPLATES,
        "routes": routes,
    }
    output_path = Path(__file__).with_name("travel-routes-data.json")
    output_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"JSON geschrieben: {output_path}")


if __name__ == "__main__":
    main()
