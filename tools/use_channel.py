#!/usr/bin/env python3
"""Apply a channel's brand to reel-studio/brand.json. Usage: python3 tools/use_channel.py <sonar|general>"""
import json, os, sys
from pathlib import Path
root = Path(__file__).resolve().parent.parent
ch = json.loads((root / "channels" / f"{sys.argv[1]}.json").read_text())
bp = root / "reel-studio" / "brand.json"
brand = json.loads(bp.read_text())
brand.update(ch.get("brand", {}))
if os.environ.get("REEL_FONT_SOURCE"):
    brand["fontSource"] = os.environ["REEL_FONT_SOURCE"]
bp.write_text(json.dumps(brand, indent=2))
print(f"channel {ch['name']}: voice={ch['voice']} accent={brand.get('accent')} fonts={brand.get('fontSource')}")
print("tone:", ch["tone"]); print("rules:"); [print(" -", r) for r in ch.get("rules", [])]
