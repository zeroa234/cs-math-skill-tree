"""Zip the web page for sharing: output/cs-math-skill-tree-<date>.zip (one folder, open index.html).

usage: python -X utf8 scripts/package_web.py      (run `node scripts/build.mjs` first so data.js is current)
"""
import datetime
import pathlib
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
WEB = ROOT / "src" / "web"
FILES = ["index.html", "style.css", "app.js", "overview.js", "guide.js", "data.js", "outlines.js",
         "vendor/panzoom-4.6.2.min.js", "vendor/d3-7.9.0.min.js", "vendor/markmap-view-0.18.12.js"]
NM = ROOT / "node_modules"
LICENSES = {
    "vendor/panzoom-MIT-License.txt": NM / "@panzoom" / "panzoom" / "MIT-License.txt",
    "vendor/d3-LICENSE.txt": NM / "d3" / "LICENSE",
    "vendor/markmap-view-LICENSE.txt": NM / "markmap-view" / "LICENSE",
}
README = """CS × 数学技能树

打开：解压后双击 index.html，用 Chrome / Edge / Firefox / Safari 都可以。不用安装，也不用联网；
      只有点“去哪学”里的学习资源链接时才需要联网。

怎么用：
- 首页是领域总览。从最左边一列标着“可以开始”的领域入手，块上的“下一步”就是现在最值得学的技能。
- 点一个领域进入它的技能地图；点一个技能看它的必须 / 推荐前置、知识导览、学习资源和练习题（答案折叠）。
- “知识导览”里点“打开导览图”：按权威教材或课程的目录画出这个技能的知识点，滚轮缩放、拖动平移。
- 学会后点“点亮”，必须前置都点亮的技能才会解锁。右上角“?”有完整说明。

进度：只保存在你自己的浏览器里，换电脑或清缓存会丢。用右上角“进度 → 导出”备份。

说明：必须前置都以真实大学课程的先修要求为依据；标“前置待核实”的 10 个技能还没找到课程证据。
知识导览图的每个标题都和来源目录页逐条核对过。
第三方组件：Panzoom 4.6.2（MIT）、d3 7.9.0（ISC）、markmap-view 0.18.12（MIT），许可证见 vendor/ 下的同名 txt。
"""


def main():
    date = datetime.date.today().isoformat()
    out = ROOT / "output" / f"cs-math-skill-tree-{date}.zip"
    out.parent.mkdir(exist_ok=True)
    top = "cs-math-skill-tree"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for f in FILES:
            z.write(WEB / f, f"{top}/{f}")
        for name, src in LICENSES.items():
            z.write(src, f"{top}/{name}")
        # UTF-8 with BOM so Windows Notepad shows the Chinese text correctly
        z.writestr(f"{top}/README.txt", "﻿" + README.replace("\n", "\r\n"))
    print(out, f"{out.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
