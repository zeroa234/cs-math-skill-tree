"""Shared lookup helper for the pi research sub-agents.

  python scripts/research_tool.py fetch <url> [--grep REGEX] [--chars N] [--start N]
      Open a page with plain HTTP (free), print its title and text (PDFs: text extracted with pypdf).
      With --grep, print only lines matching REGEX (case-insensitive) plus context.
      --start skips the first N characters, for reading a long table of contents in pieces.
  python scripts/research_tool.py extract <url> [--grep REGEX] [--chars N] [--start N]
      Tavily extract (1 credit, same budget) for pages plain fetch cannot read (JS-rendered, blocked).
  python scripts/research_tool.py search "<query>" [--n 5]
      Tavily search (1 credit). Shared budget in temp/research/tavily-budget.json;
      refuses once the budget is spent.

Pages, extracts and search results are cached under temp/research/cache/ so agents share them,
and so scripts/check_outlines.py can check copied tables of contents against the exact text an agent read.
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


def _clean(text):
    text = re.sub(r"[\ud800-\udfff]", "", text)  # unpaired surrogates from math-font PDFs cannot be written as UTF-8
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    return re.sub(r"\n\s*\n+", "\n", text).strip()


def _save(cp, result):
    # write-then-rename, so a crash never leaves an empty cache entry behind
    tmp = cp.with_suffix(".tmp")
    tmp.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    tmp.replace(cp)


def _load(cp):
    try:
        return json.loads(cp.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def _pdf_text(raw):
    # pypdf lives in temp/pylib (pip install --target); -I mode ignores PYTHONPATH, so add it here.
    sys.path.insert(0, str(ROOT / "temp/pylib"))
    import io
    import logging
    from pypdf import PdfReader
    logging.getLogger("pypdf").setLevel(logging.ERROR)  # font-encoding warnings would flood the agent's output
    try:
        reader = PdfReader(io.BytesIO(raw))
        pages = [page.extract_text() or "" for page in reader.pages[:400]]
    except Exception as e:
        return f"[PDF, {len(raw)} bytes; text extraction failed: {e!r}]"
    return _clean("\n".join(f"[page {i + 1}]\n{t}" for i, t in enumerate(pages)))


def fetch(url):
    cp = _cache_path("page", url)
    cached = _load(cp) if cp.exists() else None
    # entries cached before PDF extraction existed hold only a placeholder
    if cached and not cached.get("text", "").startswith("[PDF,"):
        return cached
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en,zh;q=0.8"})
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            raw = r.read(60_000_000)  # whole-book PDFs (e.g. Sutton & Barto) run past 20 MB
            charset = r.headers.get_content_charset() or "utf-8"
            result = {"url": url, "final_url": r.geturl(), "status": r.status,
                      "type": r.headers.get_content_type()}
    except urllib.error.HTTPError as e:
        result = {"url": url, "status": e.code, "error": str(e)}
        _save(cp, result)
        return result
    except Exception as e:  # network errors are not cached, so a retry can succeed
        return {"url": url, "status": None, "error": repr(e)}
    if result["type"] == "application/pdf" or raw[:5] == b"%PDF-":
        result.update(type="application/pdf", title="(PDF)", text=_pdf_text(raw))
    else:
        p = _Text()
        p.feed(raw.decode(charset, errors="replace"))
        result.update(title=_clean(html.unescape(p.title.strip())), text=_clean("".join(p.parts)))
    _save(cp, result)
    return result


def _tavily_key():
    key = os.environ.get("TAVILY_API_KEY", "").strip()
    if not key and sys.platform == "win32":
        import winreg
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as k:
            key = winreg.QueryValueEx(k, "TAVILY_API_KEY")[0].strip()
    return key


def _spend():
    used = json.loads(BUDGET_FILE.read_text())["used"] if BUDGET_FILE.exists() else 0
    if used >= BUDGET_LIMIT:
        sys.exit(f"Tavily budget spent ({used}/{BUDGET_LIMIT}). Use fetch on known official pages instead.")
    BUDGET_FILE.parent.mkdir(parents=True, exist_ok=True)
    BUDGET_FILE.write_text(json.dumps({"used": used + 1}))


def _tavily(endpoint, payload, timeout):
    req = urllib.request.Request(f"https://api.tavily.com/{endpoint}", data=json.dumps(payload).encode(), headers={
        "Authorization": "Bearer " + _tavily_key(), "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def search(query, n):
    cp = _cache_path("search", f"{query}|{n}")
    if cp.exists() and _load(cp):
        return _load(cp)
    _spend()
    result = _tavily("search", {"query": query, "max_results": n, "search_depth": "basic"}, 60)
    _save(cp, result)
    return result


def extract(url):
    cp = _cache_path("extract", url)
    if cp.exists() and _load(cp):
        return _load(cp)
    _spend()
    res = _tavily("extract", {"urls": [url], "extract_depth": "basic", "format": "text"}, 90)
    hit = (res.get("results") or [None])[0]
    if not hit:
        return {"url": url, "status": None, "error": json.dumps(res.get("failed_results"), ensure_ascii=False)}
    result = {"url": url, "final_url": hit.get("url", url), "status": 200, "type": "tavily-extract",
              "title": "", "text": _clean(hit.get("raw_content") or "")}
    _save(cp, result)
    return result


def cached_text(url):
    """Text an agent has already read for url (plain fetch first, then Tavily extract), or None."""
    for kind in ("page", "extract"):
        cp = _cache_path(kind, url)
        r = _load(cp) if cp.exists() else None
        if r and r.get("text") and not r["text"].startswith("[PDF,"):
            return r["text"]
    return None


def _show(r, a):
    print(f"STATUS {r.get('status')}  FINAL {r.get('final_url', '-')}\nTITLE {r.get('title', '')}")
    if "error" in r:
        print("ERROR", r["error"])
        return
    text = r["text"]
    print(f"[{len(text)} chars]")
    if a.grep:
        lines = text.splitlines()
        rx = re.compile(a.grep, re.I)
        hits = [i for i, line in enumerate(lines) if rx.search(line)]
        shown = set()
        for i in hits[:40]:
            for j in range(max(0, i - 1), min(len(lines), i + 3)):
                if j not in shown:
                    shown.add(j)
                    print(lines[j][:400])
            print("--")
        print(f"[{len(hits)} matching lines]")
    else:
        print(text[a.start: a.start + a.chars])
        if a.start + a.chars < len(text):
            print(f"[... more: --start {a.start + a.chars}]")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("fetch", "extract"):
        f = sub.add_parser(name)
        f.add_argument("url")
        f.add_argument("--grep")
        f.add_argument("--chars", type=int, default=3000)
        f.add_argument("--start", type=int, default=0)
    s = sub.add_parser("search")
    s.add_argument("query")
    s.add_argument("--n", type=int, default=5)
    a = ap.parse_args()

    if a.cmd == "fetch":
        _show(fetch(a.url), a)
    elif a.cmd == "extract":
        _show(extract(a.url), a)
    else:
        r = search(a.query, a.n)
        for i, item in enumerate(r.get("results", []), 1):
            print(f"{i}. {item.get('title')}\n   {item.get('url')}\n   {(item.get('content') or '')[:300]}")


if __name__ == "__main__":
    main()
