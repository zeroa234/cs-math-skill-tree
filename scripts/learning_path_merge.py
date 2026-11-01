# -*- coding: utf-8 -*-
"""Merge research additions into per-skill bilingual learning-path candidates.

Base record: data/curation/learning-paths/<id>.json if archived, otherwise the raw
pi record temp/research/bilingual-coverage/<id>.json.  Additions are every
temp/research/bilingual-coverage/review/*-additions/<id>.json (schema in
docs/maintenance.md, "中英文独立学习路线").  Output goes to
temp/research/bilingual-coverage/review/<id>.json; archive it afterwards with
`node scripts/archive-learning-paths.mjs --reviewed [--archive] <ids>`.

The merge never invents coverage.  It
  * appends sources / chapter references / route steps / search records from additions,
  * recomputes each language's status and gaps from the references (same rule as
    scripts/learning-paths.mjs),
  * drops cross-language fallbacks whose topic is no longer a gap,
  * converts Chinese text to Simplified (Windows LCMapStringEx; zh-CN mapping),
  * marks third-party re-uploads (`reupload: true`) when the record's own text says so
    and reports those that lack an `official_search` note (official version first rule).

Usage:  python -X utf8 scripts/learning_path_merge.py [--all | <ids>] [--report <file>]
"""
import ctypes
import glob
import json
import os
import re
import sys
from ctypes import wintypes

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "temp", "research", "bilingual-coverage")
REVIEW = os.path.join(RAW, "review")
ARCHIVE = os.path.join(ROOT, "data", "curation", "learning-paths")
REUPLOAD_LABEL = "第三方转载，授权未核"
# Text the record itself uses when the uploader is not the author, school or platform.
REUPLOAD_HINT = re.compile(r"第三方(转载|上传|搬运)|转载|搬运|非(学校|大学|官方)(官方)?(账号|发布)?|个人账号|学生(整理|上传)|非官方")
UPDATABLE = {"official_search", "reupload", "role", "access", "covers", "free", "publisher", "title", "url", "evidence"}
ENUM_KEYS = {"key", "source", "lang", "lang_missing", "tier", "role", "extent", "stage", "status", "channel", "id"}


def _t2s_factory():
    if os.name != "nt":
        raise SystemExit("learning_path_merge.py needs Windows (LCMapStringEx) for Traditional→Simplified conversion")
    k = ctypes.WinDLL("kernel32", use_last_error=True)
    f = k.LCMapStringEx
    f.argtypes = [wintypes.LPCWSTR, wintypes.DWORD, wintypes.LPCWSTR, ctypes.c_int, wintypes.LPWSTR,
                  ctypes.c_int, ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p]
    flag = 0x02000000  # LCMAP_SIMPLIFIED_CHINESE
    fixes = {"帐号": "账号", "帐户": "账户"}

    def t2s(s):
        if not s or s.isascii():
            return s
        n = f("zh-CN", flag, s, len(s), None, 0, None, None, None)
        buf = ctypes.create_unicode_buffer(n)
        f("zh-CN", flag, s, len(s), buf, n, None, None, None)
        out = buf.value[:n]
        for a, b in fixes.items():
            out = out.replace(a, b)
        return out
    return t2s


T2S = _t2s_factory()


def simplify(value, key=None):
    if isinstance(value, dict):
        return {k: simplify(v, k) for k, v in value.items()}
    if isinstance(value, list):
        return [simplify(v, key) for v in value]
    if isinstance(value, str) and key not in ENUM_KEYS and not (key or "").endswith("url"):
        return T2S(value)
    return value


def load(p):
    with open(p, encoding="utf-8-sig") as fh:
        return json.load(fh)


def topic_items(desc):
    return [x.strip() for x in re.split(r"[、，,；;。]", desc) if x.strip()]


def compute_routes(rec):
    src = {s["key"]: s for s in rec["sources"]}
    core = [t for t in rec["topics"] if t.get("stage") == "core"]
    out = {}
    for lang in ("zh", "en"):
        route = rec.setdefault("routes", {}).setdefault(lang, {"steps": []})
        steps = {s["source"] for s in route.get("steps", [])}
        gaps = [t["topic"] for t in core if not any(
            r.get("extent") == "covered" and src.get(r["source"], {}).get("lang") == lang
            and src.get(r["source"], {}).get("role") != "reference" and r["source"] in steps
            for r in t.get(lang, []))]
        status = "complete" if not gaps else ("partial" if len(gaps) < len(core) else "gap")
        if status == "complete" and not any(s["lang"] == lang and s["role"] == "primary" and s["key"] in steps for s in rec["sources"]):
            status = "partial"  # validator demands a primary teaching source in a complete route
        route["status"], route["gaps"] = status, gaps
        out[lang] = gaps
    return out


def merge_addition(rec, add, tag):
    keys = {s["key"] for s in rec["sources"]}
    by_url = {(s["lang"], s["url"]): s["key"] for s in rec["sources"]}
    rename = {}
    for s in add.get("sources", []):
        s = dict(s)
        if s.get("tier") == "course":
            s["tier"] = "website"
        existing = by_url.get((s["lang"], s["url"]))
        if existing:
            rename[s["key"]] = existing
            continue
        k, n = s["key"], 2
        while k in keys:
            k, n = f"{s['key']}-{n}", n + 1
        rename[s["key"]] = k
        s["key"] = k
        s["added_by"] = tag
        rec["sources"].append(s)
        keys.add(k)
        by_url[(s["lang"], s["url"])] = k
    by_key = {s["key"]: s for s in rec["sources"]}
    for u in add.get("source_updates", []):
        s = by_key.get(rename.get(u["key"], u["key"]))
        if not s:
            raise SystemExit(f"{rec['id']}: addition {tag} updates unknown source {u['key']}")
        for field, value in u.get("set", {}).items():
            if field not in UPDATABLE:
                raise SystemExit(f"{rec['id']}: addition {tag} may not change {field}")
            s[field] = value
        if s.get("reupload") is False:
            s["access"] = s["access"].replace(REUPLOAD_LABEL + "。", "").replace(REUPLOAD_LABEL, "")
        s.setdefault("updated_by", []).append(tag)
    topics = {t["topic"]: t for t in rec["topics"]}
    for u in add.get("topic_updates", []):
        t = topics.get(u["topic"])
        if not t:
            raise SystemExit(f"{rec['id']}: addition {tag} names unknown topic {u['topic']}")
        ref = {"source": rename.get(u["source"], u["source"]), "section": u["section"], "extent": u.get("extent", "covered")}
        refs = t.setdefault(u["lang"], [])
        if not any(r["source"] == ref["source"] and r["section"] == ref["section"] for r in refs):
            refs.append(ref)
        if u.get("explanation"):
            t["note"] = (t.get("note", "") + ("；" if t.get("note") else "") + u["explanation"]).strip()
    for st in add.get("route_steps", []):
        steps = rec["routes"][st["lang"]].setdefault("steps", [])
        step = {"source": rename.get(st["source"], st["source"]), "read": st["read"]}
        if step not in steps:
            steps.append(step)
    for q in add.get("searches", []):
        q = dict(q)
        if "query_or_url" not in q:
            q["query_or_url"] = q.pop("query", q.pop("url", ""))
        q["by"] = tag
        rec.setdefault("searches", []).append(q)
    for f in add.get("fallback_confirm", []):
        f = {"lang_missing": f["lang"], "topic": f["topic"], "source": rename.get(f["source"], f["source"]),
             "reason": f["reason"], "searched_channels": ["text", "video", "paid"], "confirmed_by": tag}
        rec["cross_language_fallbacks"] = [x for x in rec.get("cross_language_fallbacks", [])
                                           if (x.get("lang_missing"), x.get("topic")) != (f["lang_missing"], f["topic"])] + [f]
    for u in add.get("unresolved", []):
        rec.setdefault("findings", []).append(f"[{tag}] 未解决 {u.get('lang')}「{u.get('topic')}」：{u.get('reason', '')}")


def build(id_, skills):
    skill = skills[id_]
    arch = os.path.join(ARCHIVE, id_ + ".json")
    base = arch if os.path.exists(arch) else os.path.join(RAW, id_ + ".json")
    rec = load(base)
    rec["name"], rec["description"] = skill["name"], skill["desc"]
    for s in rec["sources"]:
        if s.get("tier") == "course":
            s["tier"] = "website"
    applied = rec.setdefault("applied_additions", [])
    for p in sorted(glob.glob(os.path.join(REVIEW, "*-additions", id_ + ".json"))):
        tag = os.path.relpath(p, RAW).replace("\\", "/")
        if tag in applied:
            continue
        merge_addition(rec, load(p), tag)
        applied.append(tag)
    rec = simplify(rec)
    flags = []
    for s in rec["sources"]:
        text = " ".join(str(s.get(k, "")) for k in ("publisher", "access", "title"))
        if s.get("reupload") is None and REUPLOAD_HINT.search(text):
            s["reupload"] = True
        if s.get("reupload"):
            if REUPLOAD_LABEL not in s["access"]:
                s["access"] = REUPLOAD_LABEL + "。" + s["access"]
            if not s.get("official_search"):
                flags.append(f"{s['key']}: re-upload without official_search ({s['title'][:40]})")
    # One primary per language (the panel shows one main card per language): keep the primary that
    # teaches the most core topics (ties: not a re-upload, then listed first); demote the rest.
    core = [t for t in rec["topics"] if t.get("stage") == "core"]
    need_primary, notes = [], []
    for lang in ("zh", "en"):
        prim = [s for s in rec["sources"] if s["lang"] == lang and s["role"] == "primary"]
        score = lambda s: sum(any(r["source"] == s["key"] and r["extent"] == "covered" for r in t.get(lang, [])) for t in core)
        if len(prim) > 1:
            keep = sorted(prim, key=lambda s: (-score(s), bool(s.get("reupload")), rec["sources"].index(s)))[0]
            for s in prim:
                if s is not keep:
                    s["role"] = "supplement"
                    notes.append(f"{s['key']}: demoted to supplement (one primary per language; kept {keep['key']})")
        elif not prim:
            need_primary.append(lang)
    gaps = compute_routes(rec)
    kept = []
    for f in rec.get("cross_language_fallbacks", []):
        if f.get("lang_missing") in gaps and f.get("topic") in gaps[f["lang_missing"]] and f.get("confirmed_by"):
            kept.append(f)
    dropped = len(rec.get("cross_language_fallbacks", [])) - len(kept)
    rec["cross_language_fallbacks"] = kept
    return rec, {"id": id_, "base": os.path.relpath(base, ROOT).replace("\\", "/"), "gaps": gaps,
                 "fallbacks": [(f["lang_missing"], f["topic"]) for f in kept], "dropped_fallbacks": dropped,
                 "need_primary": need_primary, "notes": notes,
                 "reupload_flags": flags, "applied": applied}


def main(argv):
    skills = {s["id"]: s for s in load(os.path.join(ROOT, "output", "skilltree.json"))["skills"]}
    report_path = None
    if "--report" in argv:
        i = argv.index("--report")
        report_path = argv[i + 1]
        argv = argv[:i] + argv[i + 2:]
    ids = list(skills) if "--all" in argv else [a for a in argv if not a.startswith("--")]
    if not ids:
        raise SystemExit(__doc__)
    report = []
    os.makedirs(REVIEW, exist_ok=True)
    for id_ in ids:
        rec, info = build(id_, skills)
        with open(os.path.join(REVIEW, id_ + ".json"), "w", encoding="utf-8") as fh:
            json.dump(rec, fh, ensure_ascii=False, indent=1)
            fh.write("\n")
        report.append(info)
    if report_path:
        with open(report_path, "w", encoding="utf-8") as fh:
            json.dump(report, fh, ensure_ascii=False, indent=1)
    zh = sum(len(r["gaps"]["zh"]) for r in report)
    en = sum(len(r["gaps"]["en"]) for r in report)
    print(f"{len(report)} candidates; gap topics zh {zh} / en {en}; "
          f"fallbacks {sum(len(r['fallbacks']) for r in report)}; dropped fallbacks {sum(r['dropped_fallbacks'] for r in report)}; "
          f"re-uploads lacking official check {sum(len(r['reupload_flags']) for r in report)}")


if __name__ == "__main__":
    main(sys.argv[1:])
