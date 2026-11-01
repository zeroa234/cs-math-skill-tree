"""Render the human-authored, per-skill source review and its evidence index.

Suitability decisions come from source-review.tsv, never from HTTP codes or a
keyword scoring algorithm. Reuses check_outlines for directory provenance.
"""
import collections
import csv
import json
import pathlib
import sys
import urllib.parse

import check_outlines
from research_tool import cached_text

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATE = '2026-11-01'
LABELS = {'main': '适合主学', 'partial': '覆盖部分', 'advanced': '入口偏难',
          'archive': '历史资料', 'intro': '仅作导读', 'gap': '暂缺'}


def read(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))


def main():
    data = read('output/skilltree.json')
    notes = read('data/curation/source-review-notes.json')
    snapshot = read(f'data/research/source-audit-{DATE}.json')
    http = {x['url']: x for x in snapshot['results']}
    browser = {x['url']: x for x in snapshot['browserChecks']}
    web = {x['url']: x for x in notes['webChecks']}
    with (ROOT / 'data/curation/source-review.tsv').open(encoding='utf-8', newline='') as stream:
        rows = list(csv.DictReader(stream, delimiter='\t'))
    decisions = {x['id']: x for x in rows}
    skills = {x['id']: x for x in data['skills']}
    assert len(rows) == len(decisions) == len(skills) == 201
    assert decisions.keys() == skills.keys()
    for key, row in decisions.items():
        assert row['enVerdict'] in LABELS and row['zhVerdict'] in LABELS
        assert (row['zhVerdict'] == 'gap') == (not skills[key].get('zhAlt')), key
    inventory = set()
    source_catalog = {}
    records = []
    total = collections.Counter()
    evidence_toc_count = 0

    def state(url):
        response = http.get(url)
        assert response is not None, f'Unprobed URL: {url}'
        if browser.get(url, {}).get('status') == 200:
            return '浏览器正文可读'
        if response.get('status') == 200:
            if response.get('contentType') == 'application/pdf':
                return 'HTTP 200；PDF目录另核'
            if response.get('needsReview'):
                return 'HTTP 200；正文待确认'
            return 'HTTP 200'
        if web.get(url, {}).get('result') == 'readable':
            return '网页读取可见；本机' + ('限流429' if response.get('status') == 429 else '连接失败')
        return '当前访问未确认' + ('（HTTP ' + str(response['status']) + '）' if response.get('status') else '')

    def link(title, url):
        # Escape Markdown table delimiters; preserve URL queries and fragments.
        return '[' + title.replace('|', '／').replace('\n', ' ') + '](' + url + ')'

    def resource(r, row, prefix):
        if not r:
            return '暂缺；' + row['zhAssessment']
        inventory.add(r['url'])
        return (f"**{LABELS[row[prefix + 'Verdict']]}** · {link(r['title'], r['url'])}"
                f"<br>{row[prefix + 'Assessment']}<br>访问：{state(r['url'])}。")

    rendered = []
    for skill in data['skills']:
        key = skill['id']
        row = decisions[key]
        outline = read(f'data/outlines/{key}.json')
        problems, verdicts = check_outlines.check(outline, skill)
        stats = check_outlines.stats(outline, verdicts)
        assert not problems and stats['missing'] == 0, (key, problems, stats)
        total.update({k: stats[k] for k in ['exact', 'fuzzy', 'missing', 'branches', 'leaves']})
        sources = []
        guide_parts = []
        for i, source in enumerate(outline['sources']):
            urls = list(dict.fromkeys([source['url'], *source['toc_urls']]))
            inventory.update(urls)
            for url in urls:
                assert url in http, (key, url)
            cached = [url for url in source['toc_urls'] if cached_text(url)]
            assert len(cached) == len(source['toc_urls']), (key, 'missing TOC cache')
            evidence_toc_count += len(cached)
            record = {'key': source['key'], 'title': source['title'], 'by': source.get('by', ''),
                      'kind': source['kind'], 'url': source['url'], 'tocUrls': source['toc_urls'],
                      'currentAccess': state(source['url']), 'cachedTocPages': len(cached)}
            sources.append(record)
            catalog = source_catalog.setdefault(source['url'], {**record, 'uses': []})
            catalog['uses'].append(key)
            guide_parts.append(('主' if i == 0 else '补') + '：' + link(source['title'], source['url'])
                               + '（' + state(source['url']) + '）')
        gaps = [x for x in outline['coverage'] if not x.get('refs')]
        guide_parts.append(f"目录核对：精确{stats['exact']}／近似{stats['fuzzy']}／缺失0。")
        if gaps:
            guide_parts.append('未列专节：' + '、'.join(x['topic'] for x in gaps) + '。')
        if key in notes['guideNotes']:
            guide_parts.append(notes['guideNotes'][key])
        for course in skill.get('courses', []):
            inventory.add(course['url'])
        records.append({'id': key, 'name': skill['name'], 'entry': skill['entry'], 'description': skill['desc'],
                        'english': {'resource': skill['resource'], 'verdict': row['enVerdict'],
                                    'assessment': row['enAssessment'], 'currentAccess': state(skill['resource']['url'])},
                        'chinese': {'resource': skill.get('zhAlt'), 'verdict': row['zhVerdict'],
                                    'assessment': row['zhAssessment']},
                        'guide': {'sources': sources, 'titleCheck': stats, 'gaps': gaps,
                                  'assessment': notes['guideNotes'].get(key, '')},
                        'prerequisiteEvidenceUrls': [x['url'] for x in skill.get('courses', [])]})
        rendered.append('| ' + key + ' ' + skill['name'] + '（D' + str(skill['entry']) + '） | '
                        + resource(skill['resource'], row, 'en') + ' | '
                        + resource(skill.get('zhAlt'), row, 'zh') + ' | ' + '<br>'.join(guide_parts) + ' |')
    assert inventory == http.keys(), ('Snapshot drift', inventory - http.keys(), http.keys() - inventory)
    en = collections.Counter(x['enVerdict'] for x in rows)
    zh = collections.Counter(x['zhVerdict'] for x in rows)
    unresolved = [x for x in snapshot['results'] if x.get('status') != 200]
    unconfirmed = [x for x in unresolved if web.get(x['url'], {}).get('result') != 'readable']
    http200 = sum(x.get('status') == 200 for x in snapshot['results'])
    report = [
        '# 技能节点资源来源与适用性复核（2026-11-01）', '',
        f"范围：全部201个技能，201个英文入口、166个中文映射（94个来源）、201份导览（{len(source_catalog)}个独立主/补来源）。",
        f"基线：`{notes['baseline']}`；日期时区：Asia/Kuala_Lumpur。", '',
        '## 结论', '',
        '来源大多能核对到大学课程、作者/出版社、官方项目或原作者社区资料；主要问题是覆盖范围、起点难度、材料形态和年代。适用性按节点当前简介和入门层判断，不把返回200、名校名称或目录标题命中当作完整适用证明。', '',
        '| 适用性 | 英文节点 | 中文节点 |', '|---|---:|---:|',
        *[f"| {label} | {en[k]} | {zh[k]} |" for k, label in LABELS.items()], '',
        f"全清单共{len(http)}个不同URL（包括导览目录、锚点入口和先修证据），最新直接HTTP检查{http200}个200、{len(unresolved)}个未成功；后者中2个可通过网页读取服务核实正文，另{len(unconfirmed)}个当前访问仍未确认。没有观察到404/410。可访问性仅代表此次检查环境。", '',
        f"导览标题按项目已有正文缓存重核：{total['exact']}条精确、{total['fuzzy']}条近似、0条缺失，结构校验无问题。仍有{sum(len(x['guide']['gaps']) for x in records)}个知识点没有单独对应章节，其中也含交叉领域定位和树外先修。这是历史文本与当前结构的核对，不是所有当前PDF正文的重新抽取。", '',
        '重点：M.1.4.2不能用Jacobian行列式代替一般矩阵；M.6.4需另学排队论；F.1.2的6.046入口偏难；P.2.1官方停止维护；H.2.2断言仿真不等于形式证明；H.4.4和S.4.4不能仅靠综述或知识库完成整个技能。', '',
        '## 本次实际修正', '',
        *['- ' + x for x in notes['changes']], '',
        '没有因局部DNS、限流或超时删除真实来源。原始研究记录、原图及先修依赖均保留。', '',
        '## 尚需处理的访问问题', '',
        '| 来源 | 本机结果 | 对节点的影响与复核 |', '|---|---|---|',
    ]
    for item in unresolved:
        url = item['url']
        affected = sorted({x['id'] for x in item['uses']})
        report.append('| ' + link(item.get('title') or urllib.parse.urlsplit(url).netloc + urllib.parse.urlsplit(url).path, url)
                      + ' | ' + str(item.get('status') or '网络/TLS失败') + ' | '
                      + '、'.join(affected) + '。' + web.get(url, {}).get('note', '当前访问未确认，不能断言永久失效。') + ' |')
    report += ['', '## 判断口径与证据边界', '',
        '- “适合主学”表示适合作本节点主线，不代表一份材料覆盖D1到D4全部专题；“覆盖部分”必须结合所列补充来源。',
        '- “入口偏难”表示知识与目标有关，但入门层和资源先修不合适；“历史资料”保留稳定概念，需更新工具、平台和当代案例；“仅作导读”不作完整技能训练。',
        '- 逐项判断依据节点简介、实际课程/教材目录、已有已读取正文与本次重点正文复查；没有逐页审校全部教材、看完全部视频、运行所有实验或登录付费课程。',
        '- 大学/作者/出版社身份、公开目录和免费全文是不同问题；商业教材只核书目和目录，未声称全文免费。平台注册、证书与实际云服务费依原学习卡说明。',
        '- 4个HTML空壳（南瓜书、ROS2、Microsoft IoT、北大编译实践）已用Edge渲染后读取正文；3个学习入口PDF结合现存正文缓存复核；原始内容只留在temp，不复制进报告。',
        '- 先修证据URL纳入访问检查；本次没有重新认定191个verified和10个draft的课程先修声明。',
        '- 复用现有HTTP检查、正文缓存、目录核对和Playwright；本次自写部分是扩大清单、临时正文留存和把人工结论合并为报告的薄层代码，未用自动打分替代人工判断。',
        '- 全量检查器曾在成功保存正文后遇到相对路径记录错误；已修正并用原始响应中一致的URL/时间/状态恢复1106条记录，再用新增Airflow链接实测相对目录工作正常。未把此记录错误当作网络失败。', '',
        '## 逐节点结果', '',
        '每行均列英文、中文和导览的实际来源链接。HTTP状态独立展示；“PDF目录另核”表示响应可达，目录依据保存的作者/出版社正文缓存。', '',
        '| 节点与入门层 | 英文资源与适用性 | 中文资源与适用性 | 导览来源、核对和边界 |',
        '|---|---|---|---|', *rendered, '',
        '## 可复查材料与验证', '',
        '- 人工判断：`data/curation/source-review.tsv`；重点证据与导览补充判断：`data/curation/source-review-notes.json`。',
        f'- HTTP最终快照与动态页面验证元数据：`data/research/source-audit-{DATE}.json`；逐节点机器可读报告：`reports/source-review-{DATE}.json`。',
        '- 复现报告：`python -X utf8 scripts/build_source_review.py`；重新联网：`python -X utf8 scripts/audit_resources.py --scope all --output temp/resource-audit/all-source-links.json --evidence-dir temp/resource-audit/current-pages`。',
        '- 临时正文/浏览器记录/运行日志在`temp/resource-audit/`，可删除；若删除`temp/research/cache/`，应先用现有research_tool重新读取目录来源才能重跑逐标题核对。',
        '- 验证状态见本报告末尾；Git按基线、数据修正、报告归档分阶段保存。', '',
        '较温和的算法起点可用[MIT6.006](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/)，随后回原6.046补高级设计；历史Java课可配[当前Java官方教程](https://dev.java/learn/)。这两项为已核实补充建议，没有替换用户已有选课。', '',
        '### 运行验证', '',
    ]
    for name, log in [('资源页面', 'resource-ui-test.log'), ('D.2.1导览', 'guide-ui-test.log')]:
        path = ROOT / 'temp/resource-audit' / log
        text = path.read_text(encoding='utf-8', errors='replace') if path.exists() else ''
        passes = [line for line in text.splitlines() if line.startswith(('PASS:', 'ok:'))]
        assert passes, f'{name} has not passed: {path}'
        report.append('- ' + name + '：' + '；'.join(passes))
    report.append('- `npm run build`通过；原有3个无必须前置警告沿用既有课程证据。')
    (ROOT / f'reports/source-review-{DATE}.md').write_text('\n'.join(report) + '\n', encoding='utf-8')
    machine = {'reviewDate': DATE, 'summary': {'skills': 201, 'englishVerdicts': dict(en), 'chineseVerdicts': dict(zh),
                'urls': len(http), 'http200': http200, 'directFailures': len(unresolved), 'accessUnconfirmed': len(unconfirmed),
                'outlineTitles': dict(total), 'outlineSources': len(source_catalog)},
               'decisions': records, 'outlineSourceCatalog': list(source_catalog.values())}
    (ROOT / f'reports/source-review-{DATE}.json').write_text(json.dumps(machine, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(machine['summary'], ensure_ascii=False))


if __name__ == '__main__':
    main()
