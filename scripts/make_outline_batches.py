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


def flat_outlines():
    """Outlines from the first pass that are (almost) one level deep: lecture lists without sections."""
    found = {}
    for p in sorted((ROOT / "temp/outlines/nodes").glob("*.json")):
        o = json.loads(p.read_text(encoding="utf-8-sig"))
        branches = o.get("outline") or []
        flat = sum(1 for b in branches if not b.get("items"))
        if branches and flat / len(branches) >= 0.7:
            found[o["id"]] = f"{len(branches)} 个分支里 {flat} 个没有小节"
    return found


def write_deepen(by_id, todo, size):
    ids = list(todo)
    parts = math.ceil(len(ids) / size)
    per = math.ceil(len(ids) / parts)
    for k in range(parts):
        part = ids[k * per:(k + 1) * per]
        lines = [f"# deepen-{k + 1}（{len(part)} 个节点，第二轮：加深或换源）", ""]
        for i in part:
            lines += describe(by_id[i])
            lines.append(f"  本轮要做的：{todo[i]}")
        (OUT / f"deepen-{k + 1}.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
        print(f"deepen-{k + 1}: {len(part)}  {' '.join(part)}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--size", type=int, default=8)
    ap.add_argument("--pilot", default="M.3.1,M.1.4.3,P.5.4,S.1.2")
    ap.add_argument("--deepen", action="store_true",
                    help="second pass: batches of first-pass outlines that are mostly one level deep")
    ap.add_argument("--fix", action="append", default=[], metavar="ID=REASON",
                    help="add an outline to the second pass with a reason (e.g. a source that must be replaced)")
    a = ap.parse_args()
    skills = json.loads((ROOT / "output/skilltree.json").read_text(encoding="utf-8"))["skills"]
    by_id = {s["id"]: s for s in skills}
    OUT.mkdir(parents=True, exist_ok=True)
    if a.deepen:
        todo = {i: f"目录太平：{why}，给每个分支补上小节" for i, why in flat_outlines().items()}
        for f in a.fix:
            i, why = f.split("=", 1)
            todo[i] = f"{todo[i]}；另外：{why}" if i in todo else why
        write_deepen(by_id, dict(sorted(todo.items(), key=lambda kv: [s["id"] for s in skills].index(kv[0]))), a.size)
        return
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
