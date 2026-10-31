"""Copy reviewed pi research (temp/research/nodes/<id>.json) into data/research/nodes/ for every skill whose
prerequisites are marked verified in data/curation/prereqs.txt. Strips the exercise field (exercises live in
data/exercises/). Reports resource URLs that never went through the fetch cache so they can be checked by hand.

  python scripts/archive_research.py
"""
import hashlib
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / "temp/research/nodes"
OUT = ROOT / "data/research/nodes"
CACHE = ROOT / "temp/research/cache"


def cache_status(url):
    p = CACHE / f"page-{hashlib.md5(url.encode()).hexdigest()}.json"
    return json.loads(p.read_text(encoding="utf-8")).get("status") if p.exists() else None


verified = []
for line in (ROOT / "data/curation/prereqs.txt").read_text(encoding="utf-8").splitlines():
    parts = [x.strip() for x in line.split("#")[0].split("|")]
    if len(parts) == 4 and parts[3] == "verified":
        verified.append(parts[0])

OUT.mkdir(parents=True, exist_ok=True)
copied, unchecked = 0, []
for i in verified:
    src = RAW / f"{i}.json"
    if not src.exists():
        continue
    r = json.loads(src.read_text(encoding="utf-8"))
    r.pop("exercise", None)
    r.pop("prereq_suggestion", None)
    url = (r.get("resource") or {}).get("url")
    if url and cache_status(url) != 200:
        unchecked.append(f"{i} {url} (cache: {cache_status(url)})")
    (OUT / f"{i}.json").write_text(json.dumps(r, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    copied += 1
print(f"archived {copied} of {len(verified)} verified skills")
for u in unchecked:
    print("CHECK", u)
