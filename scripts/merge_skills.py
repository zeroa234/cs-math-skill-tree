"""Reshape the skill partition across every data file: merge a skill into another, drop a skill, or move / remove
knowledge-map sources. Decisions are recorded in data/curation/partition.json, which scripts/build.mjs applies to the
read-only ChatGPT original (data/source/...). Why each change was made: reports/skill-partition-review-2026-11-01.md.

  python -X utf8 scripts/merge_skills.py merge ABSORBED KEPT        ABSORBED's data goes into KEPT, ABSORBED disappears
  python -X utf8 scripts/merge_skills.py drop ID "reason"           ID disappears; references to it are removed
  python -X utf8 scripts/merge_skills.py move-source FROM KEY TO [branch title ...]
                                                                    move source KEY of FROM's knowledge map (or only the
                                                                    named branches of it) into TO as an extra source
  python -X utf8 scripts/merge_skills.py drop-source ID KEY [KEY ...]   remove sources (and their branches) from ID's map

What it touches:
  prereqs.txt / prereq-notes.json   KEPT gets the union of both lines (minus each other); every other line has ABSORBED
                                    replaced by KEPT (deduplicated, required wins over recommended). Notes are joined;
                                    the summary and any required → recommended judgement still need a human pass.
  research/nodes/                   course evidence is appended to KEPT; ABSORBED's file is deleted
  exercises/                        ABSORBED's exercise is deleted (KEPT keeps its own); uses_prereqs are remapped
  outlines/                         the merged / changed map is written to temp/outlines/nodes/<id>.json; run
                                    scripts/check_outlines.py --archive <id> to re-check every title and archive it
  learning-resources.json, names-en.tsv   ABSORBED's entries are deleted
Historical reports (reports/, data/research/*-2026-11-01.json, docs/*link-check*) are left as they were.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
CUR = ROOT / "data/curation"
PART = CUR / "partition.json"
DRAFTS = ROOT / "temp/outlines/nodes"


def load(p):
    return json.loads(p.read_text(encoding="utf-8-sig"))


def save(p, data):
    """Write JSON with the indent the file already uses (1 for most data files, 2 for learning-resources.json)."""
    indent = 1
    if p.exists():
        old = p.read_text(encoding="utf-8-sig").replace("\r", "")
        indent = next((i for i in (1, 2) if json.dumps(json.loads(old), ensure_ascii=False, indent=i) + "\n" == old), 1)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=indent) + "\n", encoding="utf-8")


def dump_exercises(items):
    """The exercise files' own layout: id / level / time_min on one line, then one line per other field."""
    d = lambda v: json.dumps(v, ensure_ascii=False)
    blocks = []
    for e in items:
        head = ", ".join(f"{d(k)}: {d(e[k])}" for k in ("id", "level", "time_min") if k in e)
        rest = [f"    {d(k)}: {d(v)}" for k, v in e.items() if k not in ("id", "level", "time_min")]
        blocks.append("  {\n    " + head + ",\n" + ",\n".join(rest) + "\n  }")
    return "[\n" + ",\n".join(blocks) + "\n]\n"


def save_exercises(p, items):
    """Keep the file's existing layout: the compact one above, or plain json.dumps(indent=1) (two files use it)."""
    old = p.read_text(encoding="utf-8-sig").replace("\r", "")
    plain = json.dumps(json.loads(old), ensure_ascii=False, indent=1)
    if old in (plain, plain + "\n"):        # P4-P5.json has no newline at the end, X.json has one
        p.write_text(json.dumps(items, ensure_ascii=False, indent=1) + ("\n" if old.endswith("\n") else ""), encoding="utf-8")
    else:
        p.write_text(dump_exercises(items), encoding="utf-8")


# ── prereqs.txt ──────────────────────────────────────────────────────
def read_prereqs():
    lines = (CUR / "prereqs.txt").read_text(encoding="utf-8").splitlines()
    rows = {}
    for i, raw in enumerate(lines):
        body = raw.split("#")[0].strip()
        if not body:
            continue
        id_, req, rec, status = [s.strip() for s in body.split("|")]
        rows[id_] = {"line": i, "req": req.split(), "rec": rec.split(), "status": status}
    return lines, rows


def fmt(id_, r):
    req, rec = " ".join(r["req"]), " ".join(r["rec"])
    return f"{id_:<8}| {req:<20}| {rec:<20}| {r['status']}"


def tidy(id_, r):
    uniq = lambda xs: list(dict.fromkeys(x for x in xs if x != id_))
    r["req"] = uniq(r["req"])
    r["rec"] = [x for x in uniq(r["rec"]) if x not in r["req"]]


def write_prereqs(lines, rows, removed=()):
    for id_, r in rows.items():
        lines[r["line"]] = fmt(id_, r)
    drop = {rows[i]["line"] for i in removed if i in rows}
    out = [l for n, l in enumerate(lines) if n not in drop]
    (CUR / "prereqs.txt").write_text("\n".join(out) + "\n", encoding="utf-8")


def join_text(a, b):
    return a if not b or b == a else b if not a else f"{a}；{b}"


# ── outlines ─────────────────────────────────────────────────────────
def outline(id_):
    """The archived map, or the draft if this tool wrote a newer one (several merges into the same skill)."""
    p, d = ROOT / f"data/outlines/{id_}.json", DRAFTS / f"{id_}.json"
    if d.exists() and (not p.exists() or d.stat().st_mtime > p.stat().st_mtime):
        return load(d)
    return load(p) if p.exists() else None


def put_draft(o):
    DRAFTS.mkdir(parents=True, exist_ok=True)
    o = {k: v for k, v in o.items() if k != "checked"}
    save(DRAFTS / f"{o['id']}.json", o)


def add_sources(dst, src, keys, only_branches=None, fill_default=""):
    """Copy sources `keys` of outline `src` (and their branches) into `dst`; re-key, merging same-title sources."""
    remap = {}
    used = {s["key"] for s in dst["sources"]}
    for s in src["sources"]:
        if s["key"] not in keys:
            continue
        same = next((d for d in dst["sources"] if d["title"].strip().lower() == s["title"].strip().lower()), None)
        if same:
            remap[s["key"]] = same["key"]
            # the moved branches were checked against these pages, so keep them (check_outlines reads toc_urls)
            same["toc_urls"] = list(dict.fromkeys(same.get("toc_urls", []) + s.get("toc_urls", [])))
            continue
        new = next(chr(c) for c in range(ord("A"), ord("Z") + 1) if chr(c) not in used)
        used.add(new)
        remap[s["key"]] = new
        dst["sources"].append({**s, "key": new})
    for b in src["outline"]:
        if b["src"] not in keys or (only_branches and b["title"] not in only_branches and b.get("zh") not in only_branches):
            continue
        b = {**b, "src": remap[b["src"]]}
        main = dst["sources"][0]["key"]
        if b["src"] != main and not b.get("fill"):
            # a supplementary branch must say what it fills (check_outlines); default to where it came from
            b["fill"] = fill_default or f"来自 {src['id']} 的导览图"
        twin = next((d for d in dst["outline"] if d["src"] == b["src"] and d["title"] == b["title"]), None)
        if twin:
            have = {i["title"] for i in twin.get("items", [])}
            twin.setdefault("items", []).extend(i for i in b.get("items", []) if i["title"] not in have)
        else:
            dst["outline"].append(b)
    return remap


def remap_refs(entries, remap):
    for c in entries:
        c["refs"] = [remap.get(r.split(":")[0], r.split(":")[0]) + r[len(r.split(":")[0]):] for r in c.get("refs", [])]
    return entries


def drop_source_keys(o, keys):
    """Remove sources and their branches; coverage entries that only pointed into them go too ("—" entries stay)."""
    o["sources"] = [s for s in o["sources"] if s["key"] not in keys]
    o["outline"] = [b for b in o["outline"] if b["src"] not in keys]
    kept = []
    for c in o.get("coverage", []):
        refs = [r for r in c.get("refs", []) if r.split(":")[0] not in keys]
        if refs or not c.get("refs"):
            kept.append({**c, "refs": refs})
    o["coverage"] = kept


# ── commands ─────────────────────────────────────────────────────────
def merge(absorbed, kept):
    part = load(PART)
    # prerequisites
    lines, rows = read_prereqs()
    a, k = rows[absorbed], rows[kept]
    k["req"] += [x for x in a["req"] if x != kept]
    k["rec"] += [x for x in a["rec"] if x != kept]
    k["status"] = "verified" if a["status"] == k["status"] == "verified" else "draft"
    for id_, r in rows.items():
        r["req"] = [kept if x == absorbed else x for x in r["req"]]
        r["rec"] = [kept if x == absorbed else x for x in r["rec"]]
        tidy(id_, r)
    write_prereqs(lines, rows, removed=[absorbed])
    # notes
    notes = load(CUR / "prereq-notes.json")
    na, nk = notes.pop(absorbed, {}), notes.setdefault(kept, {})
    for q, why in na.items():
        if q not in (kept, absorbed):
            nk[q] = join_text(nk.get(q, ""), why)
    for id_, n in notes.items():
        if absorbed in n:
            n[kept] = join_text(n.get(kept, ""), n.pop(absorbed))
        n.pop(id_, None)
    for q in list(nk):
        if q != "_summary" and q not in rows[kept]["req"] + rows[kept]["rec"]:
            nk.pop(q)
    save(CUR / "prereq-notes.json", notes)
    # course evidence
    rd = ROOT / "data/research/nodes"
    ra, rk = load(rd / f"{absorbed}.json"), load(rd / f"{kept}.json")
    seen = {(c.get("course"), c.get("url")) for c in rk.get("courses", [])}
    rk.setdefault("courses", []).extend(c for c in ra.get("courses", []) if (c.get("course"), c.get("url")) not in seen)
    save(rd / f"{kept}.json", rk)
    (rd / f"{absorbed}.json").unlink()
    # exercises
    for f in (ROOT / "data/exercises").glob("*.json"):
        before = f.read_text(encoding="utf-8-sig")
        new = [e for e in json.loads(before) if e["id"] != absorbed]
        for e in new:
            e["uses_prereqs"] = list(dict.fromkeys(kept if x == absorbed else x for x in e.get("uses_prereqs", []) if not (e["id"] == kept and x == absorbed)))
        if json.dumps(new) != json.dumps(json.loads(before)):
            save_exercises(f, new)
    # knowledge map
    oa, ok = outline(absorbed), outline(kept)
    if oa and ok:
        remap = add_sources(ok, oa, {s["key"] for s in oa["sources"]})
        have = {c["topic"] for c in ok.get("coverage", [])}
        ok.setdefault("coverage", []).extend(c for c in remap_refs(oa.get("coverage", []), remap) if c["topic"] not in have)
        ok["notes"] = join_text(ok.get("notes", ""), f"并入 {absorbed} 的导览图：{oa.get('notes', '')}".rstrip("："))
        ok["omitted"] = join_text(ok.get("omitted", ""), oa.get("omitted", ""))
        put_draft(ok)
        (ROOT / f"data/outlines/{absorbed}.json").unlink()
    # resources, names
    res = load(CUR / "learning-resources.json")
    for sec in ("english", "chinese", "chineseGaps"):
        res[sec].pop(absorbed, None)
    save(CUR / "learning-resources.json", res)
    drop_name(absorbed)
    part["merged"][absorbed] = kept
    save(PART, part)
    print(f"merged {absorbed} → {kept}; re-check the map: python -X utf8 -I scripts/check_outlines.py --archive {kept}")


def drop(id_, reason):
    part = load(PART)
    lines, rows = read_prereqs()
    for i, r in rows.items():
        r["req"] = [x for x in r["req"] if x != id_]
        r["rec"] = [x for x in r["rec"] if x != id_]
    write_prereqs(lines, rows, removed=[id_])
    notes = load(CUR / "prereq-notes.json")
    notes.pop(id_, None)
    for n in notes.values():
        n.pop(id_, None)
    save(CUR / "prereq-notes.json", notes)
    for p in (ROOT / f"data/research/nodes/{id_}.json", ROOT / f"data/outlines/{id_}.json"):
        if p.exists():
            p.unlink()
    for f in (ROOT / "data/exercises").glob("*.json"):
        before = f.read_text(encoding="utf-8-sig")
        new = [e for e in json.loads(before) if e["id"] != id_]
        for e in new:
            e["uses_prereqs"] = [x for x in e.get("uses_prereqs", []) if x != id_]
        if json.dumps(new) != json.dumps(json.loads(before)):
            save_exercises(f, new)
    res = load(CUR / "learning-resources.json")
    for sec in ("english", "chinese", "chineseGaps"):
        res[sec].pop(id_, None)
    save(CUR / "learning-resources.json", res)
    drop_name(id_)
    part["dropped"][id_] = reason
    save(PART, part)
    print(f"dropped {id_}")


def drop_name(id_):
    p = CUR / "names-en.tsv"
    keep = [l for l in p.read_text(encoding="utf-8").splitlines() if l.split("\t")[0].strip() != id_]
    p.write_text("\n".join(keep) + "\n", encoding="utf-8")


def move_source(frm, key, to, branches):
    of, ot = outline(frm), outline(to)
    remap = add_sources(ot, of, {key}, set(branches) or None)
    ot["notes"] = join_text(ot.get("notes", ""), f"从 {frm} 移入来源 {key}→{remap[key]}" + (f" 的分支：{'、'.join(branches)}" if branches else "") + "。")
    put_draft(ot)
    print(f"{frm}:{key} → {to}:{remap[key]}; add a coverage entry for it, then check_outlines.py --archive {to}")


def drop_source(id_, keys):
    o = outline(id_)
    drop_source_keys(o, set(keys))
    put_draft(o)
    print(f"{id_}: removed sources {' '.join(keys)}; fix desc/coverage, then check_outlines.py --archive {id_}")


if __name__ == "__main__":
    cmd, *args = sys.argv[1:]
    if cmd == "merge":
        merge(*args)
    elif cmd == "drop":
        drop(args[0], args[1])
    elif cmd == "move-source":
        move_source(args[0], args[1], args[2], args[3:])
    elif cmd == "drop-source":
        drop_source(args[0], args[1:])
    else:
        sys.exit(__doc__)
