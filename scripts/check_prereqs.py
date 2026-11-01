"""Required edges need explicit required-course evidence, or a documented course-order/prerequisite chain.
This checks completeness and classification; it cannot establish academic truth from labels alone.
"""
import json
import pathlib
import sys
from urllib.parse import urlparse
ROOT = pathlib.Path(__file__).resolve().parents[1]

def backs_required(node, prereq):
    for course in node.get('courses', []):
        if (course.get('prereq_kind') == 'required' and prereq in course.get('mapped_ids', [])
                and course.get('prereq_text') and urlparse(course.get('url', '')).scheme in ('http','https')):
            return True
    for evidence in node.get('required_evidence', []):
        sources = evidence.get('sources', [])
        if (evidence.get('id') == prereq and evidence.get('basis') in ('course','same_course','chain')
                and evidence.get('reason') and sources
                and all(s.get('quote') and urlparse(s.get('url','')).scheme in ('http','https') for s in sources)
                and (evidence['basis'] != 'chain' or len(sources) >= 2)):
            return True
    # candidate_check and historical extra_prereqs are research leads, not proofs.
    return False

def main():
    bad, drafts, total = [], [], 0
    notes = json.loads((ROOT/'data/curation/prereq-notes.json').read_text('utf8'))
    for line in (ROOT/'data/curation/prereqs.txt').read_text('utf8').splitlines():
        if not line.strip() or line.lstrip().startswith('#'): continue
        sid, req, rec, status = map(str.strip,line.split('|'))
        if status != 'verified': drafts.append(sid)
        p = ROOT/f'data/research/nodes/{sid}.json'
        r = json.loads(p.read_text('utf8')) if p.exists() else {}
        if status == 'verified' and not r.get('courses'): bad.append(f'{sid}: verified without course evidence')
        for q in req.split():
            total += 1
            if not backs_required(r,q): bad.append(f'{sid} → {q}: no explicit required-course evidence')
            if not notes.get(sid,{}).get(q): bad.append(f'{sid} → {q}: no entry-level rationale')
    print(f'{total} required edges; {len(bad)} evidence/classification problems; {len(drafts)} draft skills')
    for msg in bad: print('  !',msg)
    for sid in drafts: print('  (draft)',sid)
    sys.exit(1 if bad or drafts else 0)

if __name__ == '__main__':main()
