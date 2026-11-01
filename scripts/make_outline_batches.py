"""Split the skills into outline-research batches for pi sub-agents (see docs/pi-outline-brief.md).

Input : output/skilltree.json (run node scripts/build.mjs first; it carries each skill's current learning resource)
Output: temp/outlines/batches/<name>.md   one task list per sub-agent
        temp/outlines/batches/pilot.md    a small mixed batch for trying the brief first

Batches follow the domain/branch order, so neighbouring skills that share one textbook land in the same batch.
  python -X utf8 scripts/make_outline_batches.py [--size 8] [--pilot M.3.1,M.1.4.3,...]
"""
import argparse
import json
import math
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "temp/outlines/batches"

GROUPS = [
    ["M.1"], ["M.2"], ["M.3", "M.4"], ["M.5"], ["M.6"], ["M.7", "M.8"],
    ["F"], ["P.1", "P.2", "P.3"], ["P.4", "P.5"], ["C.1", "C.2"], ["C.3", "C.4", "C.5"],
    ["D"], ["A.1", "A.2"], ["A.3", "A.4"], ["S.1", "S.2"], ["S.3", "S.4", "S.5"],
    ["H.1", "H.2"], ["H.3", "H.4"], ["V"], ["I"], ["X"],
]


def in_prefix(node_id, prefix):
    return node_id == prefix or node_id.startswith(prefix + ".")


def describe(s):
    lines = [f"- `{s['id']}` **{s['name']}** / {s['en']}（入门层 D{s['entry']}，深度 {'、'.join('D%d' % x for x in s['levels'])}）",
             f"  简介（要覆盖的知识点）：{s['desc']}"]
    for lv, goal in (s.get("milestones") or {}).items():
        lines.append(f"  D{lv} 验收：{goal}")
    r = s.get("resource")
    if r:
        lines.append(f"  现有英文学习资源：{r['title']} <{r['url']}>")
    z = s.get("zhAlt")
    if z:
        lines.append(f"  现有中文学习资源：{z['title']} <{z['url']}>")
    for c in s.get("courses", [])[:2]:
        lines.append(f"  先修证据里的课程：{c['school']} {c['course']} <{c['url']}>")
    return lines


def write(name, members):
    lines = [f"# {name}（{len(members)} 个节点）", ""]
    for s in members:
        lines += describe(s)
    (OUT / f"{name}.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{name}: {len(members)}  {' '.join(s['id'] for s in members)}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--size", type=int, default=8)
    ap.add_argument("--pilot", default="M.3.1,M.1.4.3,P.5.4,S.1.2")
    a = ap.parse_args()
    skills = json.loads((ROOT / "output/skilltree.json").read_text(encoding="utf-8"))["skills"]
    by_id = {s["id"]: s for s in skills}
    OUT.mkdir(parents=True, exist_ok=True)
    seen = set()
    for g in GROUPS:
        members = [s for s in skills if any(in_prefix(s["id"], p) for p in g)]
        parts = math.ceil(len(members) / a.size)
        per = math.ceil(len(members) / parts)
        for k in range(parts):
            part = members[k * per:(k + 1) * per]
            seen.update(s["id"] for s in part)
            suffix = "" if parts == 1 else "abcdefgh"[k]
            write(f"outline-{g[0].replace('.', '')}{suffix}", part)
    write("pilot", [by_id[i] for i in a.pilot.split(",")])
    missing = [s["id"] for s in skills if s["id"] not in seen]
    print("skills", len(skills), "unassigned", missing)


if __name__ == "__main__":
    main()
