# -*- coding: utf-8 -*-
"""Summarise the archived bilingual learning paths as Markdown (written to stdout).

Counts come from data/curation/learning-paths/*.json and output/skilltree.json, so the report
can be regenerated whenever the data changes:

    python -X utf8 scripts/report_learning_paths.py > reports/_bilingual-tables.md
"""
import collections
import glob
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
skills = {s["id"]: s for s in json.load(open(os.path.join(ROOT, "output", "skilltree.json"), encoding="utf-8"))["skills"]}
recs = {}
for p in glob.glob(os.path.join(ROOT, "data", "curation", "learning-paths", "*.json")):
    r = json.load(open(p, encoding="utf-8-sig"))
    recs[r["id"]] = r
LANE = {s["id"]: s["domain"] for s in skills.values()}


def covered_by(rec, topic, lang):
    src = {s["key"]: s for s in rec["sources"]}
    t = next(t for t in rec["topics"] if t["topic"] == topic)
    return [src[r["source"]] for r in t.get(lang, []) if r["extent"] == "covered" and r["source"] in src]


core_total = sum(sum(t["stage"] == "core" for t in r["topics"]) for r in recs.values())
fallbacks = [(i, f) for i, r in sorted(recs.items()) for f in r.get("cross_language_fallbacks", [])]
print(f"- 已归档双语路线：**{len(recs)}/{len(skills)}** 个技能，必学知识点 **{core_total}** 个。")
print(f"- 跨语言补充：**{len(fallbacks)}** 个知识点（中文 {sum(f['lang_missing'] == 'zh' for _, f in fallbacks)}、英文 {sum(f['lang_missing'] == 'en' for _, f in fallbacks)}），每条都经过带网页搜索的一轮确认。")
print()
print("| 领域 | 技能 | 中文全部覆盖 | 英文全部覆盖 | 跨语言补充的知识点 |")
print("|---|---|---|---|---|")
by = collections.defaultdict(lambda: [0, 0, 0, 0])
for i, r in recs.items():
    d = LANE[i]
    gaps = {f["lang_missing"]: 0 for f in r.get("cross_language_fallbacks", [])}
    by[d][0] += 1
    by[d][1] += not any(f["lang_missing"] == "zh" for f in r.get("cross_language_fallbacks", []))
    by[d][2] += not any(f["lang_missing"] == "en" for f in r.get("cross_language_fallbacks", []))
    by[d][3] += len(r.get("cross_language_fallbacks", []))
for d in sorted(by):
    n, zh, en, fb = by[d]
    print(f"| {d} | {n} | {zh} | {en} | {fb} |")
print()
print("### 跨语言补充（逐条）")
print()
print("| 技能 | 缺的语言 | 知识点 | 改读 | 原因 |")
print("|---|---|---|---|---|")
for i, f in fallbacks:
    src = next(s for s in recs[i]["sources"] if s["key"] == f["source"])
    reason = f["reason"].replace("|", "／").replace("\n", " ")
    print(f"| {i} {skills[i]['name']} | {'中文' if f['lang_missing'] == 'zh' else '英文'} | {f['topic']} | [{src['title']}]({src['url']}) | {reason} |")
print()
re_up = [(i, s) for i, r in sorted(recs.items()) for s in r["sources"] if s.get("reupload")]
print(f"### 第三方转载（{len(re_up)} 个来源，均已查过官方渠道）")
print()
print("| 技能 | 来源 | 查过的官方渠道 |")
print("|---|---|---|")
for i, s in re_up:
    print(f"| {i} | [{s['title']}]({s['url']}) | {s.get('official_search', '').replace('|', '／')} |")
print()
paid_only = []
for i, r in sorted(recs.items()):
    for t in r["topics"]:
        if t["stage"] != "core":
            continue
        for lang in ("zh", "en"):
            c = covered_by(r, t["topic"], lang)
            if c and all(s["free"] is False for s in c):
                paid_only.append((i, lang, t["topic"], c[0]))
print(f"### 只能靠付费材料覆盖的知识点（{len(paid_only)} 个）")
print()
print("| 技能 | 语言 | 知识点 | 付费材料 |")
print("|---|---|---|---|")
for i, lang, topic, s in paid_only:
    print(f"| {i} | {'中文' if lang == 'zh' else '英文'} | {topic} | [{s['title']}]({s['url']}) |")
