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
    steps = {s["source"] for s in rec["routes"][lang]["steps"]}
    return [src[r["source"]] for r in t.get(lang, []) if r["extent"] == "covered" and r["source"] in src
            and src[r["source"]]["lang"] == lang and src[r["source"]]["role"] != "reference"
            and r["source"] in steps]


core_total = sum(sum(t["stage"] == "core" for t in r["topics"]) for r in recs.values())
fallbacks = [(i, f) for i, r in sorted(recs.items()) for f in r.get("cross_language_fallbacks", [])]
print(f"- 已归档双语路线：**{len(recs)}/{len(skills)}** 个技能，必学知识点 **{core_total}** 个。")
free_routes = {lang: sum(all(any(s["free"] is True for s in covered_by(r, t["topic"], lang))
                 for t in r["topics"] if t["stage"] == "core") for r in recs.values()) for lang in ("zh", "en")}
print(f"- 全部必学项均有免费教学：中文 **{free_routes['zh']}** 条、英文 **{free_routes['en']}** 条路线。此数与包含付费材料的范围覆盖数分别统计。")
print(f"- 跨语言补充：**{len(fallbacks)}** 个知识点（中文 {sum(f['lang_missing'] == 'zh' for _, f in fallbacks)}、英文 {sum(f['lang_missing'] == 'en' for _, f in fallbacks)}），每条都经过带网页搜索的一轮确认。")
print()
print("| 领域 | 技能 | 中文全部覆盖 | 英文全部覆盖 | 中文全部免费 | 英文全部免费 | 跨语言补充的知识点 |")
print("|---|---|---|---|---|---|---|")
by = collections.defaultdict(lambda: [0, 0, 0, 0, 0, 0])
for i, r in recs.items():
    d = LANE[i]
    gaps = {f["lang_missing"]: 0 for f in r.get("cross_language_fallbacks", [])}
    by[d][0] += 1
    by[d][1] += r["routes"]["zh"]["status"] == "complete"
    by[d][2] += r["routes"]["en"]["status"] == "complete"
    by[d][3] += len(r.get("cross_language_fallbacks", []))
    for lang, index in (("zh", 4), ("en", 5)):
        by[d][index] += all(any(s["free"] is True for s in covered_by(r, t["topic"], lang))
                           for t in r["topics"] if t["stage"] == "core")
for d in sorted(by):
    n, zh, en, fb, free_zh, free_en = by[d]
    print(f"| {d} | {n} | {zh} | {en} | {free_zh} | {free_en} | {fb} |")
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
print(f"### 当前路线需要付费材料补读的知识点（{len(paid_only)} 个）")
print()
print("指该语言当前没有可独立覆盖整个组合项的免费来源；可能已有免费材料讲解其中一部分。不是断言其他免费教学不存在。")
print()
print("| 技能 | 语言 | 知识点 | 付费材料 |")
print("|---|---|---|---|")
for i, lang, topic, s in paid_only:
    print(f"| {i} | {'中文' if lang == 'zh' else '英文'} | {topic} | [{s['title']}]({s['url']}) |")
pending = []
for i, r in sorted(recs.items()):
    for t in r["topics"]:
        if t["stage"] != "core":
            continue
        for lang in ("zh", "en"):
            c = covered_by(r, t["topic"], lang)
            if any(s["free"] is None for s in c) and not any(s["free"] is True for s in c):
                pending.append((i, lang, t["topic"]))
print()
print(f"### 费用或回放条件待核（{len(pending)} 个语言×知识项）")
print()
print("课程大纲能支持范围判断，但注册、已结课回放或费用尚未确认；这些项目不计入已核免费覆盖，也不直接判为必须付费。具体条件见各来源 access。")
print()
print("| 技能 | 语言 | 知识点 |")
print("|---|---|---|")
for i, lang, topic in pending:
    print(f"| {i} | {'中文' if lang == 'zh' else '英文'} | {topic} |")
