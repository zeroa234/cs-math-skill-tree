"""Check the knowledge-map outlines written by pi (docs/pi-outline-brief.md) and archive the reviewed ones.

  python -X utf8 -I scripts/check_outlines.py [ids or prefixes...]           digest: one block per outline
  python -X utf8 -I scripts/check_outlines.py --archive [ids or prefixes...]  copy checked outlines to data/outlines/

Every copied title is looked up in the text the agent actually read (research_tool's cache for the source's
toc_urls). Matching ignores case, spacing, punctuation and PDF hyphenation: "exact" = the normalised title is a
substring of the page; "fuzzy" = at least 80 % of its words appear on the page (wording differs slightly);
"missing" = neither. Archiving drops missing entries (and their children) and records what was dropped.
"""
import argparse
import datetime
import json
import pathlib
import re
import sys
import unicodedata

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from research_tool import cached_text  # noqa: E402

SRC_DIR = ROOT / "temp/outlines/nodes"
OUT_DIR = ROOT / "data/outlines"
SKILLS = ROOT / "output/skilltree.json"
KINDS = {"book", "course", "notes", "docs"}
CJK = re.compile(r"[㐀-鿿]")


def norm(s):
    s = unicodedata.normalize("NFKC", s).lower().replace("&", "and")
    return re.sub(r"[\W_]+", "", s)


def words(s):
    s = unicodedata.normalize("NFKC", s).lower().replace("&", "and")
    return [w for w in re.split(r"[\W_]+", s) if len(w) >= 3 or CJK.search(w)]


class Page:
    def __init__(self, texts):
        joined = "\n".join(texts)
        self.flat = norm(joined)
        self.words = set(words(joined)) | set(words(joined.replace("-\n", "")))

    def match(self, title):
        n = norm(title)
        if n and n in self.flat:
            return "exact"
        ws = words(title)
        if ws and sum(w in self.words for w in ws) / len(ws) >= 0.8:
            return "fuzzy"
        return "missing"


def walk(items, depth=1):
    for it in items:
        yield it, depth
        yield from walk(it.get("items") or [], depth + 1)


def check(o, skill):
    """Return (problems, per-entry verdicts keyed by id(entry))."""
    problems, verdict = [], {}
    keys = [s.get("key") for s in o.get("sources", [])]
    if not keys:
        return ["no sources"], verdict
    pages = {}
    for s in o["sources"]:
        for f in ("key", "kind", "title", "url", "toc_urls"):
            if not s.get(f):
                problems.append(f"source {s.get('key')} lacks {f}")
        if s.get("kind") not in KINDS:
            problems.append(f"source {s.get('key')} kind {s.get('kind')!r}")
        texts = []
        for u in s.get("toc_urls") or []:
            t = cached_text(u)
            if t is None:
                problems.append(f"source {s['key']}: never read {u}")
            else:
                texts.append(t)
        pages[s.get("key")] = Page(texts)
    outline = o.get("outline") or []
    if not outline:
        problems.append("empty outline")
    for br in outline:
        if br.get("src") not in pages:
            problems.append(f"branch {br.get('title')!r} has unknown src {br.get('src')}")
            continue
        if br["src"] != keys[0] and not br.get("fill"):
            problems.append(f"supplement branch {br['title']!r} has no fill reason")
        for it, depth in walk([br]):
            t = it.get("title") or ""
            if not t:
                problems.append(f"entry without title under {br.get('title')!r}")
                continue
            verdict[id(it)] = pages[br["src"]].match(t)
            if not CJK.search(t) and not it.get("zh"):
                problems.append(f"no zh for {t!r}")
            if depth > 3:
                problems.append(f"too deep: {t!r}")
    # coverage refs: "A:5.2" (by ref) or "A:#3" (3rd branch of source A)
    refs = {}
    for br in outline:
        same = [b for b in outline if b.get("src") == br.get("src")]
        refs[f"{br.get('src')}:#{same.index(br) + 1}"] = br
        for it, _ in walk([br]):
            if it.get("ref"):
                refs[f"{br.get('src')}:{it['ref']}"] = it
    for c in o.get("coverage") or []:
        for r in c.get("refs") or []:
            if r not in refs:
                problems.append(f"coverage {c.get('topic')!r}: unknown ref {r}")
        if not c.get("refs") and not c.get("note"):
            problems.append(f"coverage {c.get('topic')!r}: no refs and no note")
    if not o.get("coverage"):
        problems.append("no coverage list")
    if skill is None:
        problems.append("unknown skill id")
    return problems, verdict


def stats(o, verdict):
    entries = [it for br in o.get("outline") or [] for it, _ in walk([br])]
    v = [verdict.get(id(it), "missing") for it in entries]
    leaves = sum(1 for it in entries if not it.get("items"))
    return {"branches": len(o.get("outline") or []), "leaves": leaves,
            "exact": v.count("exact"), "fuzzy": v.count("fuzzy"), "missing": v.count("missing")}


def pick(paths, wanted):
    if not wanted:
        return paths
    return [p for p in paths if any(p.stem == w or p.stem.startswith(w + ".") for w in wanted)]


def prune(items, verdict, dropped):
    kept = []
    for it in items:
        if verdict.get(id(it)) == "missing":
            dropped.append(it.get("title"))
            continue
        if it.get("items"):
            it["items"] = prune(it["items"], verdict, dropped)
        kept.append(it)
    return kept


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="*")
    ap.add_argument("--archive", action="store_true")
    ap.add_argument("--summary", action="store_true", help="one line per outline: size, depth, sources, gaps")
    a = ap.parse_args()
    skills = {s["id"]: s for s in json.loads(SKILLS.read_text(encoding="utf-8"))["skills"]}
    paths = pick(sorted(SRC_DIR.glob("*.json")), a.ids)
    if a.summary:
        print("id\tbranches\tleaves\tflat\tsources\tgaps\tpdf toc hosts")
        for p in paths:
            o = json.loads(p.read_text(encoding="utf-8-sig"))
            br = o.get("outline") or []
            flat = sum(1 for b in br if not b.get("items"))
            leaves = sum(1 for b in br for it, _ in walk([b]) if not it.get("items"))
            gaps = sum(1 for c in o.get("coverage") or [] if not c.get("refs"))
            pdfs = sorted({re.sub(r"^https?://([^/]+).*", r"\1", u) for s in o.get("sources", [])
                           for u in s.get("toc_urls") or [] if u.lower().split("?")[0].endswith(".pdf")})
            print(f"{o['id']}\t{len(br)}\t{leaves}\t{flat}\t{len(o.get('sources', []))}\t{gaps}\t{' '.join(pdfs)}")
        return
    total = {"exact": 0, "fuzzy": 0, "missing": 0}
    for p in paths:
        o = json.loads(p.read_text(encoding="utf-8-sig"))
        skill = skills.get(o.get("id"))
        problems, verdict = check(o, skill)
        st = stats(o, verdict)
        for k in total:
            total[k] += st[k]
        print(f"## {o.get('id')} {skill['name'] if skill else '?'}  ·  {st['branches']} 章 {st['leaves']} 叶"
              f"  ·  原文核对 exact {st['exact']} / fuzzy {st['fuzzy']} / missing {st['missing']}")
        for s in o.get("sources", []):
            print(f"   [{s.get('key')}] {s.get('kind')} · {s.get('title')} — {s.get('by', '')} {s.get('year', '')}  <{s.get('url')}>")
        for br in o.get("outline") or []:
            mark = "" if br.get("src") == o["sources"][0].get("key") else f"  ＋补[{br.get('src')}] {br.get('fill', '')}"
            bad = [it.get("title") for it, _ in walk([br]) if verdict.get(id(it)) == "missing"]
            print(f"   - {br.get('ref', '')} {br.get('title')} / {br.get('zh', '')}  ({len(br.get('items') or [])}){mark}"
                  + (f"  ✗ {bad}" if bad else ""))
        gaps = [c["topic"] for c in o.get("coverage") or [] if not c.get("refs")]
        if gaps:
            print(f"   未覆盖：{gaps}")
        for pr in problems[:12]:
            print(f"   ! {pr}")
        if len(problems) > 12:
            print(f"   ! … {len(problems) - 12} more")
        if a.archive:
            hard = [pr for pr in problems if not pr.startswith(("no zh", "coverage"))]
            if hard:
                print("   → NOT archived (fix the problems above first)")
                continue
            dropped = []
            for br in o["outline"]:
                if verdict.get(id(br)) == "missing":
                    dropped.append(br.get("title"))
                br["items"] = prune(br.get("items") or [], verdict, dropped)
            o["outline"] = [br for br in o["outline"] if verdict.get(id(br)) != "missing"]
            o["checked"] = {"date": datetime.date.today().isoformat(), "exact": st["exact"], "fuzzy": st["fuzzy"],
                            "dropped": dropped}
            OUT_DIR.mkdir(parents=True, exist_ok=True)
            (OUT_DIR / f"{o['id']}.json").write_text(json.dumps(o, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
            print(f"   → archived to data/outlines/{o['id']}.json" + (f" (dropped {len(dropped)})" if dropped else ""))
    print(f"\n{len(paths)} outlines · exact {total['exact']} · fuzzy {total['fuzzy']} · missing {total['missing']}")


if __name__ == "__main__":
    main()
