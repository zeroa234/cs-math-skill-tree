"""Prevent recommended or placeholder evidence from silently clearing prerequisite drafts."""
import pathlib,sys,unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from check_prereqs import backs_required
class RequiredEvidenceTests(unittest.TestCase):
 def test_recommendation_is_not_required(self):
  for status in ['recommended','unspecified']:
   self.assertFalse(backs_required({'courses':[{'prereq_kind':status,'mapped_ids':['Q'],'url':'https://university.edu/course','prereq_text':'Q is helpful'}]},'Q'))
  self.assertFalse(backs_required({'candidate_check':{'Q':'supported'},'extra_prereqs':[{'id':'Q','kind':'required','evidence':'assumed'}]},'Q'))
 def test_complete_direct_quote(self):
  c={'prereq_kind':'required','mapped_ids':['Q'],'url':'https://university.edu/course','prereq_text':'Prerequisites: Q'}
  self.assertTrue(backs_required({'courses':[c]},'Q'));self.assertFalse(backs_required({'courses':[c]},'R'))
 def test_chain_needs_both_links(self):
  e={'id':'Q','basis':'chain','reason':'course X requires Y; Y requires Q','sources':[{'url':'https://university.edu/x','quote':'Requires Y'}]}
  self.assertFalse(backs_required({'required_evidence':[e]},'Q'))
  e['sources'].append({'url':'https://university.edu/y','quote':'Requires Q'})
  self.assertTrue(backs_required({'required_evidence':[e]},'Q'))
if __name__=='__main__':unittest.main()
