"""Split the skill nodes into research batches for pi sub-agents.

Input : data/source/chatgpt-outputs/knowledge-map-data.json (ChatGPT original, read-only)
Output: temp/research/batches/batch-XX.md  (one brief per batch, lists nodes + candidate prereqs)

Skill nodes = every "主题" node plus branch nodes that are themselves a course
(实分析 / 数理统计 / 随机过程 / 深度学习); pure grouping branches are not skills.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "data/source/chatgpt-outputs/knowledge-map-data.json"
OUT = ROOT / "temp/research/batches"

COURSE_BRANCHES = {"M.1.6", "M.6.2", "M.6.3", "A.2.3"}

# Batches follow the domain/branch order so each sub-agent stays in one subject area.
BATCHES = [
    ["M.1", "M.2"],
    ["M.3", "M.4", "M.5"],
    ["M.6", "M.7", "M.8"],
    ["F", "P.1", "P.2", "P.3"],
    ["P.4", "P.5", "C.1", "C.2"],
    ["C.3", "C.4", "C.5", "D"],
    ["A"],
    ["S"],
    ["H", "V"],
    ["I", "X"],
]


def is_skill(n):
    return n["kind"] == "主题" or n["id"] in COURSE_BRANCHES


def in_prefix(node_id, prefix):
    return node_id == prefix or node_id.startswith(prefix + ".")


def main():
    data = json.loads(SRC.read_text(encoding="utf-8-sig"))
    nodes = {n["id"]: n for n in data["nodes"]}
    skills = [n for n in data["nodes"] if is_skill(n)]
    incoming = {}
    for e in data["edges"]:
        if e["type"] == "prereq":
            incoming.setdefault(e["target"], []).append(e["source"])

    OUT.mkdir(parents=True, exist_ok=True)
    seen = set()
    for i, prefixes in enumerate(BATCHES, 1):
        batch = [n for n in skills if any(in_prefix(n["id"], p) for p in prefixes)]
        lines = [f"# batch-{i:02d}（{len(batch)} 个节点）", ""]
        for n in batch:
            seen.add(n["id"])
            cands = "、".join(f"{c}({nodes[c]['name']})" for c in incoming.get(n["id"], [])) or "无"
            lines.append(f"- `{n['id']}` **{n['name']}**：{n['desc']}  ")
            lines.append(f"  原图建议前置：{cands}")
        (OUT / f"batch-{i:02d}.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
        print(f"batch-{i:02d}: {len(batch)}")
    missing = [n["id"] for n in skills if n["id"] not in seen]
    print("skills", len(skills), "unassigned", missing)


if __name__ == "__main__":
    main()
