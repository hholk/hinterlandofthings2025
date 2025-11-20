import json
with open("/Users/henrikholkenbrink/gh-hinterland2025/hinterlandofthings2025/travel-routes/data/routes/chile-route-4-patagonia-sur-2026.json", "r") as f:
    data = json.load(f)
    print(json.dumps(data["days"][1]["hotels"][0]["images"], indent=2))
