"""Check data/curation/scope.json against the CS2023 Body of Knowledge and the current skill descriptions.

  python -X utf8 -I scripts/check_scope.py           verify every cited fragment and print the classification
  python -X utf8 -I scripts/check_scope.py --units   also list the parsed knowledge units (sanity check of the parser)
  python -X utf8 -I scripts/check_scope.py --markdown   print the per-skill table used in reports/skill-scope-2026-11-01.md
                                                        (needs a fresh build: the verdicts come from output/skilltree.json)

The Body of Knowledge PDF is read through research_tool's cache (fetched once with research_tool.fetch). Every
evidence fragment must occur in a topic of the cited knowledge unit at the cited tier (CS Core / KA Core), and every
matched or meta item must be one of the skill's description items, split the same way scripts/build.mjs splits them.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from research_tool import cached_text, fetch  # noqa: E402

BOK = "https://csed.acm.org/wp-content/uploads/2024/04/3.1-Body-of-Knowledge-1.pdf"
KAS = "AI|AL|AR|DM|FPL|GIT|HCI|MSF|NC|OS|PDC|SDF|SE|SEC|SEP|SF|SPD"
KU = re.compile(rf"^({KAS})-([A-Za-z]+(?:-[A-Za-z]+)*)(?::\s*(.+?))?\s*$")
TIER = re.compile(r"^(CS Core|KA Core|Non-core)\s*:")
STOP = re.compile(r"^(Illustrative Learning Outcomes|Professional Dispositions|Math Requirements|Course Packaging)")
TOP = re.compile(r"^\d+\.\s+(.*)")


def norm(s):
    return re.sub(r"\s+", " ", s.replace("’", "'").replace("–", "-").replace("“", '"').replace("”", '"')).strip()


def units(text):
    """{code: {tier: [topic text]}} — first occurrence of each unit with topics (course packaging repeats codes)."""
    out, cur, tier = {}, None, None
    for raw in text.splitlines():
        s = raw.strip()
        m = KU.match(s)
        if m:
            code = f"{m.group(1)}-{m.group(2)}"
            cur = None if code in out else out.setdefault(code, {"CS Core": [], "KA Core": [], "Non-core": []})
            tier = None
            continue
        if cur is None:
            continue
        t = TIER.match(s)
        if t:
            tier = t.group(1)
            if s[t.end():].strip():
                cur[tier].append(s[t.end():].strip())
        elif STOP.match(s):
            tier = None
        elif tier and s:
            tm = TOP.match(s)
            if tm:
                cur[tier].append(tm.group(1))
            elif cur[tier] and not s.isdigit():
                cur[tier][-1] += " " + s  # sub-items and wrapped lines stay with their topic
    return {k: {t: [norm(x) for x in v] for t, v in u.items()} for k, u in out.items() if any(u.values())}


def items(desc):
    return [x.strip() for x in re.split(r"[、，,；;。]", desc) if x.strip()]


def main():
    text = cached_text(BOK) or (fetch(BOK) and cached_text(BOK))
    if not text:
        sys.exit(f"cannot read {BOK}")
    bok = units(text)
    if "--units" in sys.argv:
        for code, u in bok.items():
            print(code, {t: len(v) for t, v in u.items()})
    scope = json.loads((ROOT / "data/curation/scope.json").read_text(encoding="utf-8"))["skills"]
    skills = {s["id"]: s for s in json.loads((ROOT / "output/skilltree.json").read_text(encoding="utf-8"))["skills"]}
    problems = []
    for sid in sorted(set(skills) ^ set(scope)):
        problems.append(f"{sid}: {'no scope entry' if sid in skills else 'scope entry for unknown skill'}")
    for sid, e in scope.items():
        if sid not in skills:
            continue
        its = items(skills[sid]["desc"])
        for it in list(e.get("matched", {})) + e.get("meta", []):
            if it not in its:
                problems.append(f"{sid}: item not in description: {it}")
        cites = [ev for evs in e.get("matched", {}).values() for ev in evs] + ([e["hosts"]] if e.get("hosts") else [])
        for code, tier, frag in cites:
            if tier not in ("CS Core", "KA Core"):
                problems.append(f"{sid}: {code} cites tier {tier}")
            elif code not in bok:
                problems.append(f"{sid}: unknown knowledge unit {code}")
            elif not any(norm(frag) in t for t in bok[code][tier]):
                problems.append(f"{sid}: '{frag}' not found in {code} {tier}")
    print(f"{len(bok)} knowledge units parsed; {len(scope)} scope entries; {len(problems)} problems")
    for p in problems:
        print("  !", p)
    if "--markdown" in sys.argv and not problems:
        markdown(scope, skills)
    sys.exit(1 if problems else 0)


def markdown(scope, skills):
    tier = {"CS Core": "CS", "KA Core": "KA"}
    print("\n| 技能 | 判定 | 简介知识点 | CS2023 依据 |\n|---|---|---|---|")
    for sid, s in skills.items():
        e = scope[sid]
        counted = len(items(s["desc"])) - len(e.get("meta", []))
        matched = e.get("matched", {})
        units = sorted({f"{code} {tier[t]}" for evs in matched.values() for code, t, _ in evs})
        basis = "、".join(units) or "—"
        if e.get("hosts"):
            basis += f"；承载 CS Core：{e['hosts'][0]}"
        verdict = "选修" if s["optional"] else ("主干（前置）" if "必须前置" in s["scope"] else "主干")
        note = e.get("note", "")
        if "必须前置" in s["scope"]:
            note = (s["scope"] + "。" + note).strip("。") + "。" if note else s["scope"]
        print(f"| {sid} {s['name']} | {verdict} | {len(matched)}/{counted} | {basis}{'<br>' + note if note else ''} |")


if __name__ == "__main__":
    main()
