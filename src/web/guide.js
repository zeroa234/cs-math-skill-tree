// CS × 数学技能树 — knowledge map ("知识导览") of one skill: the table of contents of an authoritative book, course or
// official doc (data/outlines/, checked against the source pages), plus branches from other sources that fill gaps in
// the skill's description. Drawn as a mind map with markmap (vendor/, MIT) or as a plain outline. The outlines, d3
// and markmap load on first use so the main page stays light. app.js calls init() once, section(skill) for the
// detail panel and open(id) for deep links (#skill/<id>/guide).
window.SkillTreeGuide = (() => {
  "use strict";

  let api = null;
  const PREF = "cs-math-skilltree/guide";
  const KIND = { book: "教材", course: "课程", notes: "讲义", docs: "官方文档" };
  const FILL_COLOR = "#c26a00";
  const pref = { lang: "zh" };
  try { Object.assign(pref, JSON.parse(localStorage.getItem(PREF) || "{}")); } catch { /* storage blocked */ }
  const savePref = () => { try { localStorage.setItem(PREF, JSON.stringify(pref)); } catch { /* ignore */ } };

  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid != null) n.append(kid.nodeType ? kid : document.createTextNode(kid));
    return n;
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const sourceLine = (s) => `${KIND[s.kind] || s.kind}《${s.title}》${s.by ? `，${s.by}` : ""}${s.year ? `，${s.year}` : ""}`;

  // ── lazy loading ──────────────────────────────────────────────────
  let loading = null;
  const script = (src) => new Promise((resolve, reject) => {
    const s = el("script", { src });
    s.onload = resolve;
    s.onerror = () => reject(new Error(`加载失败：${src}`));
    document.head.append(s);
  });
  function load() {
    loading ||= (async () => {
      if (!window.SKILLTREE_OUTLINES) await script("outlines.js");
      if (!window.markmap) { await script("vendor/d3-7.9.0.min.js"); await script("vendor/markmap-view-0.18.12.js"); }
    })().catch((e) => { loading = null; throw e; });
    return loading;
  }

  // ── panel section ─────────────────────────────────────────────────
  function section(s) {
    const g = s.guide;
    if (!g) {
      return el("section", { class: "p-sec" },
        el("h3", {}, "知识导览"),
        el("p", { class: "pending" }, "这个技能的知识导览图还在整理。"));
    }
    return el("section", { class: "p-sec guide-sec" },
      el("h3", {}, "知识导览", el("span", { class: "h-note" }, `${g.branches} 个分支 · ${g.points} 个知识点`)),
      el("p", { class: "guide-src" }, `按${sourceLine(g.source)}的目录整理`,
        g.fills ? `，另从 ${g.sources - 1} 个来源补了 ${g.fills} 个分支` : "", "。"),
      el("ol", { class: "guide-preview" }, g.preview.map((t) => el("li", {}, t)),
        g.branches > g.preview.length ? el("li", { class: "more" }, `…共 ${g.branches} 个`) : null),
      el("button", { class: "btn", onclick: () => open(s.id) }, "打开导览图"));
  }

  // ── dialog ────────────────────────────────────────────────────────
  let dlg = null;
  let ui = {};
  let cur = null; // { s, o, index: Map(ref -> entry), main }
  let mm = null;

  function build() {
    const langBtn = (value, text) => el("button", { "data-lang": value, "aria-pressed": "false",
      onclick: () => { pref.lang = value; savePref(); draw(); } }, text);
    ui = {
      title: el("h2", { id: "guide-title" }),
      en: el("div", { class: "g-en", lang: "en" }),
      svg: document.createElementNS("http://www.w3.org/2000/svg", "svg"),
      status: el("p", { class: "g-status", role: "status" }),
      sources: el("ul", { class: "g-sources" }),
      coverage: el("ul", { class: "g-coverage" }),
      omitted: el("p", { class: "g-omitted" }),
    };
    ui.svg.setAttribute("class", "g-svg");
    ui.svg.setAttribute("aria-label", "知识导览图：滚轮或双指缩放，拖动平移");
    dlg = el("dialog", { class: "guide", "aria-labelledby": "guide-title" },
      el("header", { class: "g-head" },
        el("div", { class: "g-titles" }, ui.title, ui.en),
        el("div", { class: "seg", role: "group", "aria-label": "标题语言" }, langBtn("zh", "中文"), langBtn("both", "双语"), langBtn("en", "原文")),
        el("button", { class: "icon-btn", "aria-label": "关闭导览图", onclick: () => dlg.close() }, "×")),
      el("div", { class: "g-body" },
        el("div", { class: "g-stage" }, ui.svg, ui.status,
          el("div", { class: "zoom-ctl", role: "group", "aria-label": "导览图缩放" },
            el("button", { class: "icon-btn", "aria-label": "放大", onclick: () => mm?.rescale(1.25) }, "+"),
            el("button", { class: "icon-btn", "aria-label": "缩小", onclick: () => mm?.rescale(0.8) }, "−"),
            el("button", { class: "icon-btn", "aria-label": "看全图", title: "看全图", onclick: () => mm?.fit() }, "⤢"))),
        el("aside", { class: "g-side", "aria-label": "来源与覆盖" },
          el("section", {}, el("h3", {}, "目录来源"), ui.sources),
          el("section", {}, el("h3", {}, "查漏补缺", el("span", { class: "h-note" }, "简介里的每个知识点在哪一章，点一下在图上定位")), ui.coverage),
          ui.omitted)));
    dlg.addEventListener("close", () => {
      mm?.destroy();
      mm = null;
      ui.svg.replaceChildren();
      if (cur) api.onClose?.(cur.s.id);
      cur = null;
    });
    document.body.append(dlg);
  }

  async function open(id) {
    const s = api.skill(id);
    if (!s?.guide) return;
    if (!dlg) build();
    ui.title.textContent = `「${s.name}」知识导览`;
    ui.en.textContent = s.en;
    ui.status.textContent = "正在加载导览图…";
    ui.status.hidden = false;
    ui.sources.replaceChildren();
    ui.coverage.replaceChildren();
    ui.omitted.textContent = "";
    if (!dlg.open) dlg.showModal();
    api.onOpen?.(id);
    try { await load(); } catch (e) { ui.status.textContent = `${e.message}。请确认 outlines.js 和 vendor/ 与 index.html 在同一个文件夹。`; return; }
    const o = window.SKILLTREE_OUTLINES[id];
    const index = new Map();
    for (const src of new Set(o.outline.map((b) => b.src))) {
      o.outline.filter((b) => b.src === src).forEach((b, i) => {
        index.set(`${src}:#${i + 1}`, b);
        (function walk(it) { if (it.ref) index.set(`${src}:${it.ref}`, it); (it.items || []).forEach(walk); })(b);
      });
    }
    cur = { s, o, index, main: o.sources[0].key };
    ui.status.hidden = true;
    renderSide();
    draw();
  }

  // ── labels ────────────────────────────────────────────────────────
  function label(it) {
    const orig = esc(it.title);
    const zh = it.zh ? esc(it.zh) : "";
    if (pref.lang === "en" || !zh) return orig;
    if (pref.lang === "zh") return zh;
    return `${zh}<span class="gm-orig" lang="en">${orig}</span>`;
  }
  const refHtml = (it) => (it.ref ? `<span class="gm-ref">${esc(it.ref)}</span>` : "");
  const fillTag = (br) => (br.src !== cur.main ? `<span class="gm-fill">补·${esc(br.src)}</span>` : "");

  // ── mind map: everything expanded and fitted to the window; zoom and pan from there ──
  async function draw() {
    if (!cur) return;
    for (const b of dlg.querySelectorAll("[data-lang]")) b.setAttribute("aria-pressed", String(b.dataset.lang === pref.lang));
    const color = api.color(cur.s.id);
    const node = (it, br) => ({
      content: `${it === br ? fillTag(br) : ""}${refHtml(it)}${label(it)}`,
      payload: { entry: it, color: br.src === cur.main ? null : FILL_COLOR },
      children: (it.items || []).map((c) => node(c, br)),
    });
    const data = { content: `<strong>${esc(cur.s.name)}</strong>`, payload: {}, children: cur.o.outline.map((br) => node(br, br)) };
    const opts = {
      duration: 300,
      maxWidth: 300,
      paddingX: 10,
      spacingVertical: 6,
      spacingHorizontal: 64,
      maxInitialScale: 1.25,
      pan: false, // the wheel zooms and dragging pans, as on the skill map
      color: (n) => n.payload?.color || color,
    };
    if (!mm) mm = new window.markmap.Markmap(ui.svg, opts);
    else mm.setOptions(opts);
    await mm.setData(data);
    await mm.fit();
  }

  // ── side: sources and coverage ────────────────────────────────────
  function renderSide() {
    const { o } = cur;
    ui.sources.replaceChildren(...o.sources.map((s) => el("li", {},
      el("span", { class: `g-key${s.key === cur.main ? "" : " fill"}` }, s.key === cur.main ? `${s.key} 主` : `${s.key} 补`),
      el("div", {},
        el("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, s.title),
        el("div", { class: "g-by" }, [KIND[s.kind] || s.kind, s.by, s.year].filter(Boolean).join(" · ")),
        s.why ? el("div", { class: "g-why" }, s.why) : null,
        (s.toc_urls || []).filter((u) => u !== s.url).length
          ? el("div", { class: "g-toc" }, "目录出处：", (s.toc_urls || []).filter((u) => u !== s.url).map((u, i) =>
            el("a", { href: u, target: "_blank", rel: "noopener noreferrer" }, `链接${i + 1}`)))
          : null))));
    ui.coverage.replaceChildren(...o.coverage.map((c) => {
      const hits = (c.refs || []).map((r) => [r, cur.index.get(r)]).filter(([, it]) => it);
      return el("li", { class: hits.length ? "" : "gap" },
        el("span", { class: "g-topic" }, hits.length ? "✓ " : "— ", c.topic),
        hits.length ? el("span", { class: "g-refs" }, hits.map(([r, it]) => el("button", {
          class: `g-ref${r.startsWith(cur.main + ":") ? "" : " fill"}`, title: it.title, onclick: () => reveal(it),
        }, `${r.split(":")[0]} ${it.ref || ""} ${it.zh || it.title}`.replace(/\s+/g, " ")))) : null,
        c.note ? el("span", { class: "g-note" }, c.note) : null);
    }));
    ui.omitted.textContent = o.omitted ? `未收入：${o.omitted}` : "";
  }

  // Centre one entry on the map and highlight it (unfolding its branch if the reader folded it).
  async function reveal(entry) {
    if (!mm) return;
    let found = null;
    const path = [];
    (function walk(n) {
      if (found) return;
      path.push(n);
      if (n.payload?.entry === entry) found = [...path];
      else (n.children || []).forEach(walk);
      path.pop();
    })(mm.state.data);
    if (!found) return;
    if (found.slice(0, -1).some((n) => n.payload?.fold)) {
      for (const n of found.slice(0, -1)) n.payload = { ...n.payload, fold: 0 };
      await mm.renderData();
    }
    const target = found[found.length - 1];
    await mm.setHighlight(target);
    await mm.centerNode(target);
  }

  return {
    init(a) { api = a; },
    section,
    open,
    isOpen: () => !!dlg?.open,
  };
})();
