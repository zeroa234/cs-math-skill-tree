"""A course page and the paid book catalogued on it must keep their own costs."""
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from learning_path_merge import merge_addition


class ResourceIdentityTests(unittest.TestCase):
    def test_shared_url_does_not_replace_course_with_paid_book(self):
        url = "https://university.example/course"
        record = {"id": "T", "sources": [
            {"key": "book", "lang": "zh", "url": url, "tier": "book", "free": False}
        ], "topics": [{"topic": "测试", "zh": [], "en": []}],
            "routes": {"zh": {"steps": []}, "en": {"steps": []}}}
        addition = {"sources": [
            {"key": "course", "lang": "zh", "url": url, "tier": "video", "free": True}
        ], "topic_updates": [{"topic": "测试", "lang": "zh", "source": "course", "section": "第1讲"}],
            "route_steps": [{"lang": "zh", "source": "course", "read": "看第1讲"}]}
        merge_addition(record, addition, "test")
        sources = {s["key"]: s for s in record["sources"]}
        self.assertEqual(len(sources), 2)
        self.assertIs(sources["book"]["free"], False)
        self.assertIs(sources["course"]["free"], True)
        self.assertEqual(record["topics"][0]["zh"][0]["source"], "course")
        self.assertEqual(record["routes"]["zh"]["steps"][0]["source"], "course")


if __name__ == "__main__":
    unittest.main()
