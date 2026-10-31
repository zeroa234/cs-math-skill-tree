"""Shared lookup helper for the pi research sub-agents.

  python scripts/research_tool.py fetch <url> [--grep REGEX] [--chars N]
      Open a page with plain HTTP (free), print its title and text.
      With --grep, print only lines matching REGEX (case-insensitive) plus context.
  python scripts/research_tool.py search "<query>" [--n 5]
      Tavily search (1 credit). Shared budget in temp/research/tavily-budget.json;
      refuses once the budget is spent.

Pages and search results are cached under temp/research/cache/ so agents share them.
The Tavily key comes from TAVILY_API_KEY, else the Windows user environment.
"""
import argparse
import hashlib
import html
import json
import os
import pathlib
import re
import sys
import urllib.error
import urllib.request
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[1]
CACHE = ROOT / "temp/research/cache"
BUDGET_FILE = ROOT / "temp/research/tavily-budget.json"
BUDGET_LIMIT = 600
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"


class _Text(HTMLParser):
    SKIP = {"script", "style", "noscript", "svg"}
    BLOCK = {"p", "div", "li", "br", "tr", "h1", "h2", "h3", "h4", "h5", "h6", "section", "article", "dd", "dt", "td", "th"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.title, self._skip, self._in_title = [], "", 0, False

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self._skip += 1
        if tag == "title":
            self._in_title = True
        if tag in self.BLOCK:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in self.SKIP and self._skip:
            self._skip -= 1
        if tag == "title":
            self._in_title = False
        if tag in self.BLOCK:
            self.parts.append("\n")

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        elif not self._skip:
            self.parts.append(data)


def _cache_path(kind, key):
    CACHE.mkdir(parents=True, exist_ok=True)
    return CACHE / f"{kind}-{hashlib.md5(key.encode()).hexdigest()}.json"


def fetch(url):
    cp = _cache_path("page", url)
    if cp.exists():
        return json.loads(cp.read_text(encoding="utf-8"))
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en,zh;q=0.8"})
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            raw = r.read(4_000_000)
            charset = r.headers.get_content_charset() or "utf-8"
            result = {"url": url, "final_url": r.geturl(), "status": r.status,
                      "type": r.headers.get_content_type()}
    except urllib.error.HTTPError as e:
        result = {"url": url, "status": e.code, "error": str(e)}
        cp.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
        return result
    except Exception as e:  # network errors are not cached, so a retry can succeed
        return {"url": url, "status": None, "error": repr(e)}
    if result["type"] == "application/pdf":
        result.update(title="(PDF)", text=f"[PDF, {len(raw)} bytes; text not extracted]")
    else:
        p = _Text()
        p.feed(raw.decode(charset, errors="replace"))
        text = re.sub(r"[ \t\r\f\v]+", " ", "".join(p.parts))
        text = re.sub(r"\n\s*\n+", "\n", text).strip()
        result.update(title=html.unescape(p.title.strip()), text=text)
    cp.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    return result


def _tavily_key():
    key = os.environ.get("TAVILY_API_KEY", "").strip()
    if not key and sys.platform == "win32":
        import winreg
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as k:
            key = winreg.QueryValueEx(k, "TAVILY_API_KEY")[0].strip()
    return key


def search(query, n):
    cp = _cache_path("search", f"{query}|{n}")
    if cp.exists():
        return json.loads(cp.read_text(encoding="utf-8"))
    used = json.loads(BUDGET_FILE.read_text())["used"] if BUDGET_FILE.exists() else 0
    if used >= BUDGET_LIMIT:
        sys.exit(f"Tavily budget spent ({used}/{BUDGET_LIMIT}). Use fetch on known official pages instead.")
    body = json.dumps({"query": query, "max_results": n, "search_depth": "basic"}).encode()
    req = urllib.request.Request("https://api.tavily.com/search", data=body, headers={
        "Authorization": "Bearer " + _tavily_key(), "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        result = json.loads(r.read().decode())
    BUDGET_FILE.parent.mkdir(parents=True, exist_ok=True)
    BUDGET_FILE.write_text(json.dumps({"used": used + 1}))
    cp.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    return result


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    f = sub.add_parser("fetch")
    f.add_argument("url")
    f.add_argument("--grep")
    f.add_argument("--chars", type=int, default=3000)
    s = sub.add_parser("search")
    s.add_argument("query")
    s.add_argument("--n", type=int, default=5)
    a = ap.parse_args()

    if a.cmd == "fetch":
        r = fetch(a.url)
        print(f"STATUS {r.get('status')}  FINAL {r.get('final_url', '-')}\nTITLE {r.get('title', '')}")
        if "error" in r:
            print("ERROR", r["error"])
            return
        lines = r["text"].splitlines()
        if a.grep:
            rx = re.compile(a.grep, re.I)
            hits = [i for i, line in enumerate(lines) if rx.search(line)]
            shown = set()
            for i in hits[:20]:
                for j in range(max(0, i - 1), min(len(lines), i + 3)):
                    if j not in shown:
                        shown.add(j)
                        print(lines[j][:400])
                print("--")
            print(f"[{len(hits)} matching lines]")
        else:
            print(r["text"][: a.chars])
    else:
        r = search(a.query, a.n)
        for i, item in enumerate(r.get("results", []), 1):
            print(f"{i}. {item.get('title')}\n   {item.get('url')}\n   {(item.get('content') or '')[:300]}")


if __name__ == "__main__":
    main()
