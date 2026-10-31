"""Replace lines in data/curation/prereqs.txt and merge notes into data/curation/prereq-notes.json.

  python scripts/set_prereqs.py <decisions.json>

decisions.json: {"<id>": {"required": {"<id>": "why", ...}, "recommended": {"<id>": "why", ...},
                          "summary": "evidence in one line", "status": "verified"}}
Each listed skill's line in prereqs.txt is rewritten (keeping its position); its notes are replaced.
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
TXT = ROOT / "data/curation/prereqs.txt"
NOTES = ROOT / "data/curation/prereq-notes.json"

decisions = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
notes = json.loads(NOTES.read_text(encoding="utf-8")) if NOTES.exists() else {}
lines = TXT.read_text(encoding="utf-8").splitlines()
seen = set()
for i, line in enumerate(lines):
    key = line.split("|")[0].strip()
    if key in decisions and not line.lstrip().startswith("#"):
        d = decisions[key]
        req = " ".join(d.get("required", {}))
        rec = " ".join(d.get("recommended", {}))
        lines[i] = f"{key:<8}| {req:<20}| {rec:<20}| {d.get('status', 'verified')}"
        seen.add(key)
missing = set(decisions) - seen
if missing:
    sys.exit(f"not found in prereqs.txt: {sorted(missing)}")
for key, d in decisions.items():
    entry = {**d.get("required", {}), **d.get("recommended", {})}
    if d.get("summary"):
        entry["_summary"] = d["summary"]
    notes[key] = entry
TXT.write_text("\n".join(lines) + "\n", encoding="utf-8")
NOTES.write_text(json.dumps(dict(sorted(notes.items())), ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print(f"updated {len(decisions)} skills")
