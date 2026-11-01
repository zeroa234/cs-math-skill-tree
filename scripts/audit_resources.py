"""Check learning-resource URLs; HTTP success alone does not establish content suitability.

Reuses the project's HTML parser. No search API/key or third-party packages needed.
Run after npm run build: python -X utf8 scripts/audit_resources.py
Results are temporary evidence, not a guarantee of access from every region.
"""
import argparse
import concurrent.futures
import datetime
import hashlib
import json
import pathlib
import re
import threading
import urllib.error
import urllib.parse
import urllib.request
from research_tool import _Text, UA

ROOT = pathlib.Path(__file__).resolve().parents[1]


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--output', type=pathlib.Path, default=ROOT / 'temp/resource-audit/final-links.json')
    ap.add_argument('--workers', type=int, default=8)
    ap.add_argument('--scope', choices=['learning', 'all'], default='learning',
                    help='all also checks outline sources/TOCs and prerequisite evidence URLs')
    ap.add_argument('--evidence-dir', type=pathlib.Path,
                    help='temporary directory for fetched HTML text, for human content review')
    ap.add_argument('--only-url', action='append', default=[], help='check only these inventory URLs (repeatable)')
    args = ap.parse_args()
    data = json.loads((ROOT / 'output/skilltree.json').read_text(encoding='utf-8'))
    uses = {}
    for skill in data['skills']:
        for key in ['resource', 'zhAlt']:
            resource = skill.get(key)
            if resource:
                uses.setdefault(resource['url'], []).append({'id': skill['id'], 'language': resource['lang'], 'role': key})
        if args.scope == 'all':
            for course in skill.get('courses', []):
                uses.setdefault(course['url'], []).append({'id': skill['id'], 'role': 'prerequisite'})
    if args.scope == 'all':
        for path in sorted((ROOT / 'data/outlines').glob('*.json')):
            outline = json.loads(path.read_text(encoding='utf-8'))
            for source in outline['sources']:
                for url in dict.fromkeys([source['url'], *source.get('toc_urls', [])]):
                    uses.setdefault(url, []).append({'id': outline['id'], 'role': 'outline', 'source': source['key']})
    if args.evidence_dir:
        args.evidence_dir = args.evidence_dir.resolve()
        args.evidence_dir.mkdir(parents=True, exist_ok=True)
    if args.only_url:
        unknown = set(args.only_url) - uses.keys()
        if unknown:
            ap.error('URLs are outside the selected inventory: ' + ', '.join(sorted(unknown)))
        uses = {url: uses[url] for url in args.only_url}
    gates = {urllib.parse.urlsplit(url).netloc: threading.Semaphore(2) for url in uses}

    def check(url):
        result = {'url': url, 'uses': uses[url], 'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat()}
        try:
            with gates[urllib.parse.urlsplit(url).netloc]:
                request = urllib.request.Request(url, headers={'User-Agent': UA})
                with urllib.request.urlopen(request, timeout=25) as response:
                    result.update(status=response.status, finalUrl=response.url, contentType=response.headers.get_content_type())
                    raw = response.read(1_500_000)
                    if result['contentType'] == 'application/pdf':
                        result['needsReview'] = 'PDF contents require separate review'
                    else:
                        parser = _Text()
                        parser.feed(raw.decode(response.headers.get_content_charset() or 'utf-8', errors='replace'))
                        result['title'] = parser.title.strip()
                        text = re.sub(r'\s+', ' ', ''.join(parser.parts)).strip()
                        # Do not retain copyrighted article bodies in this report.
                        result['textLength'] = len(text)
                        if args.evidence_dir:
                            evidence = args.evidence_dir / (hashlib.sha256(url.encode()).hexdigest() + '.json')
                            evidence.write_text(json.dumps({**result, 'text': ''.join(parser.parts)},
                                                           ensure_ascii=False), encoding='utf-8')
                            result['evidenceFile'] = evidence.relative_to(ROOT).as_posix()
                        if len(text) < 80 or re.search(r'access denied|just a moment|page not found', parser.title, re.I):
                            result['needsReview'] = 'Check rendered page: empty shell, challenge or error title'
        except urllib.error.HTTPError as exc:
            result.update(status=exc.code, error=str(exc))
        except Exception as exc:
            if 'status' in result:
                # A parser/evidence-path failure must not erase an observed HTTP status.
                result.update(needsReview='Content or evidence processing failed', processingError=str(exc))
            else:
                result.update(status=None, error=str(exc))
        return result

    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, min(args.workers, 12))) as pool:
        for i, item in enumerate(pool.map(check, sorted(uses)), 1):
            results.append(item)
            if i % 50 == 0:
                print(f'Checked {i}/{len(uses)} URLs', flush=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    report = {'skills': len(data['skills']), 'scope': args.scope, 'urls': len(uses), 'results': results}
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    flagged = [r for r in results if r.get('status') != 200 or r.get('needsReview')]
    for item in flagged:
        print(json.dumps({k: v for k, v in item.items() if k != 'uses'}, ensure_ascii=False))
    print(f'{len(results)} URLs; {sum(r.get("status") == 200 for r in results)} HTTP 200; {len(flagged)} need review')
    # Rate limiting, bot challenges and DNS issues require investigation; do not call them dead links.
    return 1 if any(r.get('status') in (404, 410) for r in results) else 0


if __name__ == '__main__':
    raise SystemExit(main())
