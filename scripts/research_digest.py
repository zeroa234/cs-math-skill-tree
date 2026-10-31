"""Compact review digest of pi research results, for the main agent's prerequisite decisions.

  python scripts/research_digest.py <id-prefix-or-id> [...]     e.g.  M.1   C.2.1
  python scripts/research_digest.py --batch batch-01a

For each skill prints: the current draft line from data/curation/prereqs.txt, the resource (with whether the
URL is in the fetch cache, i.e. was really opened), each course's official prerequisite text and mapping,
the candidate check, extra prerequisites and the notes.
Reads temp/research/nodes/ (raw pi output) and falls back to data/research/nodes/ (already reviewed).
"""
import hashlib
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / "temp/research/nodes"
DONE = ROOT / "data/research/nodes"
CACHE = ROOT / "temp/research/cache"
NAMES = {}
for line in (ROOT / "temp/research/batches/all-nodes.md").read_text(encoding="utf-8").splitlines():
    m = re.match(r"^(\S+) (.+)$", line)
    if m and "." in m.group(1):
        NAMES[m.group(1)] = m.group(2)


def cached(url):
    p = CACHE / f"page-{hashlib.md5(url.encode()).hexdigest()}.json"
    if not p.exists():
        return "not-in-cache"
    return str(json.loads(p.read_text(encoding="utf-8")).get("status"))


def drafts():
    out = {}
    for line in (ROOT / "data/curation/prereqs.txt").read_text(encoding="utf-8").splitlines():
        line = line.split("#")[0].strip()
        if line:
            parts = [x.strip() for x in line.split("|")]
            out[parts[0]] = parts
    return out


def ids_for(args):
    if args[:1] == ["--batch"]:
        text = (ROOT / f"temp/research/batches/{args[1]}.md").read_text(encoding="utf-8")
        return re.findall(r"^- `([^`]+)`", text, re.M)
    allids = list(NAMES)
    return [i for i in allids if any(i == a or i.startswith(a + ".") for a in args)]


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    d = drafts()
    for i in ids_for(sys.argv[1:]):
        f = RAW / f"{i}.json"
        if not f.exists():
            f = DONE / f"{i}.json"
        _, req, rec, st = d.get(i, [i, "?", "?", "?"])
        name = lambda x: f"{x}({NAMES.get(x, '?')})"
        print(f"=== {i} {NAMES.get(i)}  draft R[{' '.join(map(name, req.split()))}] r[{' '.join(map(name, rec.split()))}] {st}")
        if not f.exists():
            print("   (no research yet)")
            continue
        r = json.loads(f.read_text(encoding="utf-8"))
        res = r.get("resource") or {}
        print(f"   RES {res.get('tier')} | {res.get('title')} | {res.get('url')} [{cached(res.get('url', '')) if res.get('url') else '-'}]")
        for c in r.get("courses", []):
            print(f"   C {c.get('school')} {c.get('course')} [{c.get('prereq_kind')}] [{cached(c.get('url', ''))}] -> {c.get('mapped_ids')}")
            print(f"     \"{(c.get('prereq_text') or '')[:260]}\"")
        if r.get("candidate_check"):
            print("   CHECK", r["candidate_check"])
        for e in r.get("extra_prereqs", []):
            print(f"   EXTRA {e.get('id')} {e.get('kind')}: {(e.get('evidence') or '')[:140]}")
        if r.get("notes"):
            print("   NOTE", r["notes"][:300].replace("\n", " "))


if __name__ == "__main__":
    main()
