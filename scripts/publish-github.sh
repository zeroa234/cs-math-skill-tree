#!/usr/bin/env bash
# 把本项目发布到 GitHub（zeroa234/cs-math-skill-tree 的 main）。
# 本项目平时在作者的工作区大仓库里（projects/cs-math-skill-tree/）提交；这里用 git subtree split 只拆出
# 本目录的提交，再逐个重建提交对象：去掉提交说明里的 AI 署名行（Co-Authored-By: Claude / Claude-Session），
# 把本地 git 身份 "ZCode Agent <agent@local>" 换成作者的 GitHub 身份（noreply 邮箱，贡献者栏显示 zeroa234），然后推送。
# 时间和文件树原样保留，同样的输入得到同样的提交号，所以每次发布都是快进推送。
# （2026-11-01 加身份替换时改写过一次已发布的历史，强推过一次；之后不需要强推。）
# （不用 git filter-branch：它要求整个大仓库的工作区是干净的。）
# 用法（Git Bash，任意目录）：bash scripts/publish-github.sh [--dry-run]    拆分要遍历大仓库全部提交，约 1–2 分钟
set -euo pipefail
cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
PREFIX=projects/cs-math-skill-tree
BRANCH=publish/cs-math-skill-tree
REMOTE=https://github.com/zeroa234/cs-math-skill-tree.git
export LOCAL_ID="ZCode Agent <agent@local>"
export PUBLISH_ID="zeroa234 <208007470+zeroa234@users.noreply.github.com>"   # 和 zeroa234/desk-pet 的提交同一身份

split=$(git subtree split -q --prefix="$PREFIX")
head=$(python -X utf8 - "$split" <<'EOF'
import os, re, subprocess, sys

def git(*a, inp=None):
    return subprocess.run(["git", *a], input=inp, capture_output=True, check=True).stdout

LOCAL, PUBLISH = os.environ["LOCAL_ID"].encode(), os.environ["PUBLISH_ID"].encode()
TRAILER = re.compile(rb"(?im)^(co-authored-by: claude.*|claude-session:.*)(\n|$)")
new = {}
for line in git("rev-list", "--reverse", "--topo-order", "--parents", sys.argv[1]).decode().split("\n"):
    if not line:
        continue
    sha, *parents = line.split()
    raw = git("cat-file", "commit", sha)
    head, _, msg = raw.partition(b"\n\n")
    lines = [l for l in head.split(b"\n") if not l.startswith(b"parent ")]
    lines[1:1] = [b"parent " + new[p].encode() for p in parents]     # 第 0 行是 tree
    lines = [l.replace(LOCAL, PUBLISH, 1) if l.startswith((b"author ", b"committer ")) else l for l in lines]
    msg = TRAILER.sub(b"", msg).rstrip() + b"\n"
    new[sha] = git("hash-object", "-t", "commit", "-w", "--stdin", inp=b"\n".join(lines) + b"\n\n" + msg).decode().strip()
print(new[sys.argv[1]])
EOF
)
git branch -f "$BRANCH" "$head"

left=$(git log --format=%B "$BRANCH" | grep -c -i -E '^(co-authored-by: claude|claude-session:)' || true)
[ "$left" = 0 ] || { echo "还有 $left 行署名没去掉" >&2; exit 1; }
ids=$(git log --format='%an <%ae>%n%cn <%ce>' "$BRANCH" | sort -u)
[ "$ids" = "$PUBLISH_ID" ] || { echo "作者 / 提交者里还有别的身份：$ids" >&2; exit 1; }
[ "$(git rev-parse "$BRANCH^{tree}")" = "$(git rev-parse "$split^{tree}")" ] || { echo "文件树和拆分结果不一致" >&2; exit 1; }
echo "$BRANCH = $(git rev-parse --short "$BRANCH")，$(git rev-list --count "$BRANCH") 个提交，署名行 0，作者都是 $PUBLISH_ID，文件树与拆分结果一致"
[ "${1:-}" = "--dry-run" ] && exit 0
git push "$REMOTE" "$BRANCH:main"
