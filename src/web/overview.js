// CS × 数学技能树 — overview ("world map"): one tile per lane, roads = required prerequisites between lanes.
// Tile positions come from scripts/build.mjs (ELK layered on the lane graph). app.js owns the state and calls
// init() once and render() after every change.
window.SkillTreeOverview = (() => {
  "use strict";

  let api = null;
  let D = null;
  const tiles = new Map();
  let stage = null;
  let roadsG = null;
  let labelsG = null;
  let caption = null;
  let focusLane = null;
  const SVGNS = "http://www.w3.org/2000/svg";

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
  const svgEl = (tag, attrs = {}) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const shortName = (lane) => lane.short || lane.name;

  // Ports: spread a tile's outgoing roads along its right edge and incoming ones along its left edge,
  // each sorted by the other end's height, so roads leave and arrive without crossing at the tile.
  function roadGeometry() {
    const R = new Map(D.overview.regions.map((r) => [r.lane, r]));
    const { headH } = D.overview.tile;
    const ports = new Map();
    const assign = (lane, side, list) => {
      const r = R.get(lane);
      list.sort((a, b) => a.other.y + a.other.h / 2 - (b.other.y + b.other.h / 2));
      const top = r.y + headH;
      const span = r.h - headH - 20;
      list.forEach((it, i) => ports.set(`${it.key}|${side}`, top + (span * (i + 1)) / (list.length + 1)));
    };
    for (const r of D.overview.regions) {
      const out = D.overview.roads.filter((x) => x.from === r.lane).map((x) => ({ key: `${x.from}>${x.to}`, other: R.get(x.to) }));
      const inc = D.overview.roads.filter((x) => x.to === r.lane).map((x) => ({ key: `${x.from}>${x.to}`, other: R.get(x.from) }));
      assign(r.lane, "out", out);
      assign(r.lane, "in", inc);
    }
    return D.overview.roads.map((road) => {
      const a = R.get(road.from);
      const b = R.get(road.to);
      const key = `${road.from}>${road.to}`;
      const sy = ports.get(`${key}|out`);
      const ty = ports.get(`${key}|in`);
      let d;
      let mid;
      if (b.x > a.x) { // forward: right edge → left edge
        const sx = a.x + a.w;
        const tx = b.x - 3;
        const dx = Math.max(36, (tx - sx) / 2);
        d = `M${sx},${sy} C${sx + dx},${sy} ${tx - dx},${ty} ${tx},${ty}`;
        mid = { x: (sx + tx) / 2, y: (sy + ty) / 2 };
      } else if (b.x < a.x) { // backward (weak, shown on focus only): left edge → right edge
        const sx = a.x;
        const tx = b.x + b.w + 3;
        d = `M${sx},${sy} C${sx - 60},${sy} ${tx + 60},${ty} ${tx},${ty}`;
        mid = { x: (sx + tx) / 2, y: (sy + ty) / 2 };
      } else { // same column: bulge out to the right
        const sx = a.x + a.w;
        const tx = b.x + b.w + 3;
        d = `M${sx},${sy} C${sx + 70},${sy} ${tx + 70},${ty} ${tx},${ty}`;
        mid = { x: sx + 52, y: (sy + ty) / 2 };
      }
      return { ...road, key, d, mid, forward: b.x > a.x };
    });
  }

  function build() {
    const wrap = document.querySelector("#ov-wrap");
    stage = wrap.querySelector(".ov-stage");
    caption = wrap.querySelector("#ov-caption");
    const { width, height, tile } = D.overview;
    Object.assign(stage.style, { width: `${width}px`, height: `${height}px` });

    const svg = svgEl("svg", { class: "ov-roads", width, height, "aria-hidden": "true" });
    const defs = svgEl("defs");
    for (const lane of D.lanes) {
      const m = svgEl("marker", {
        id: `ov-arr-${lane.id}`, viewBox: "0 0 10 10", refX: "8", refY: "5", markerWidth: "11", markerHeight: "11",
        markerUnits: "userSpaceOnUse", orient: "auto",
      });
      m.append(svgEl("path", { d: "M0 1L10 5L0 9z", fill: lane.color }));
      defs.append(m);
    }
    svg.append(defs);
    roadsG = svgEl("g");
    labelsG = svgEl("g", { class: "ov-labels" });
    svg.append(roadsG, labelsG);
    stage.append(svg);

    const laneById = new Map(D.lanes.map((l) => [l.id, l]));
    for (const road of roadGeometry()) {
      const p = svgEl("path", {
        d: road.d, class: `ov-road${road.dominant && road.count >= 3 ? " major" : ""}${road.forward ? "" : " back"}`,
        stroke: laneById.get(road.from).color, "stroke-width": String(Math.min(9, 1.2 + road.count * 0.75)),
        "marker-end": `url(#ov-arr-${road.from})`,
      });
      p.dataset.from = road.from;
      p.dataset.to = road.to;
      p._road = road;
      roadsG.append(p);
    }

    // tiles in reading order (column, then top to bottom) so Tab follows the map
    const regions = [...D.overview.regions].sort((a, b) => a.layer - b.layer || a.y - b.y);
    for (const r of regions) {
      const lane = laneById.get(r.lane);
      const members = D.skills.filter((s) => s.lane === r.lane);
      const sx = tile.miniScale;
      const sy = tile.miniScaleY;
      const miniW = r.w - 2 * tile.padX;
      const miniH = Math.round(lane.height * sy);
      const mini = svgEl("svg", { class: "rg-mini", width: miniW, height: miniH, viewBox: `0 0 ${miniW} ${miniH}`, "aria-hidden": "true" });
      const rects = new Map();
      const sid = new Set(members.map((s) => s.id));
      for (const s of members) {
        for (const q of s.required) {
          if (!sid.has(q.id)) continue;
          const a = members.find((m) => m.id === q.id);
          mini.append(svgEl("line", {
            class: "mini-edge",
            x1: (a.x + D.meta.card.w) * sx, y1: (a.y + D.meta.card.h / 2) * sy,
            x2: s.x * sx, y2: (s.y + D.meta.card.h / 2) * sy,
          }));
        }
      }
      for (const s of members) {
        const rect = svgEl("rect", {
          x: s.x * sx, y: s.y * sy, rx: 1.5,
          width: D.meta.card.w * sx, height: Math.max(3, D.meta.card.h * sy - 1),
        });
        rects.set(s.id, rect);
        mini.append(rect);
      }
      const main = el("button", { class: "rg-main", onclick: () => api.enterLane(r.lane) },
        el("span", { class: "rg-swatch", "aria-hidden": "true" }),
        el("span", { class: "rg-titles" },
          el("span", { class: "rg-name" }, lane.name),
          el("span", { class: "rg-en" }, lane.en)));
      const badge = el("span", { class: "rg-badge" });
      const bar = el("span", { class: "rg-bar", "aria-hidden": "true" }, el("span", { class: "rg-bar-fill" }));
      const progText = el("span", { class: "rg-prog-text" });
      const next = el("div", { class: "rg-next" });
      const box = el("article", {
        class: "region" + (lane.optional ? " opt" : ""),
        style: `--dc:${lane.color};left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;--order:${r.layer}`,
        "data-lane": r.lane,
      }, main, el("div", { class: "rg-mini-wrap" }, mini), el("div", { class: "rg-foot" }, el("div", { class: "rg-prog" }, badge, bar, progText), next));
      box.addEventListener("pointerenter", () => setFocus(r.lane));
      box.addEventListener("pointerleave", () => setFocus(null));
      box.addEventListener("focusin", () => setFocus(r.lane));
      box.addEventListener("focusout", (e) => { if (!box.contains(e.relatedTarget)) setFocus(null); });
      tiles.set(r.lane, { box, main, badge, bar, progText, next, rects, members, lane });
      stage.append(box);
    }
    window.addEventListener("resize", fit);
  }

  function regionText(laneId) {
    const laneById = new Map(D.lanes.map((l) => [l.id, l]));
    const fmt = (list, key) => list.sort((a, b) => b.count - a.count).map((x) => `${shortName(laneById.get(x[key]))} ${x.count}`).join("、");
    const inc = D.overview.roads.filter((x) => x.to === laneId);
    const out = D.overview.roads.filter((x) => x.from === laneId);
    return {
      needs: inc.length ? `用到这些领域的必须前置：${fmt(inc, "from")}` : "没有来自其他领域的必须前置，可以直接开始",
      feeds: out.length ? `是这些领域的必须前置：${fmt(out, "to")}` : "",
    };
  }

  function setFocus(laneId) {
    focusLane = laneId;
    for (const p of roadsG.children) {
      const on = laneId && (p.dataset.from === laneId || p.dataset.to === laneId);
      p.classList.toggle("on", !!on);
      p.classList.toggle("in", !!on && p.dataset.to === laneId);
      p.classList.toggle("dim", !!laneId && !on);
    }
    for (const [id, t] of tiles) {
      const linked = laneId && (id === laneId || D.overview.roads.some((x) => (x.from === laneId && x.to === id) || (x.to === laneId && x.from === id)));
      t.box.classList.toggle("dim", !!laneId && !linked);
      t.box.classList.toggle("focus", id === laneId);
    }
    labelsG.replaceChildren();
    if (laneId) {
      for (const p of roadsG.children) {
        if (!p.classList.contains("on")) continue;
        const { mid, count } = p._road;
        const g = svgEl("g", { transform: `translate(${mid.x},${mid.y})` });
        g.append(svgEl("circle", { r: 10 }));
        const t = svgEl("text", { "text-anchor": "middle", dy: "4" });
        t.textContent = String(count);
        g.append(t);
        labelsG.append(g);
      }
      const lane = D.lanes.find((l) => l.id === laneId);
      const { needs, feeds } = regionText(laneId);
      caption.textContent = `${lane.name}：${needs}${feeds ? `；${feeds}` : ""}。数字是跨领域必须前置的条数。`;
    } else caption.textContent = caption.dataset.idle;
  }

  function render() {
    const plan = new Set(api.planIds());
    for (const [laneId, t] of tiles) {
      let lit = 0;
      let avail = 0;
      let inPlan = 0;
      for (const s of t.members) {
        const st = api.status(s.id);
        t.rects.get(s.id).setAttribute("class", `mini-${st}${plan.has(s.id) && st !== "lit" ? " plan" : ""}`);
        if (st === "lit") lit++;
        if (st === "avail") avail++;
        if (plan.has(s.id) && st !== "lit") inPlan++;
      }
      const n = t.members.length;
      const st = lit === n ? "done" : avail ? "open" : "locked";
      t.box.classList.remove("done", "open", "locked");
      t.box.classList.add(st);
      t.box.classList.toggle("in-plan", inPlan > 0);
      t.box.classList.toggle("off-plan", plan.size > 0 && inPlan === 0);
      t.bar.firstChild.style.width = `${(100 * lit) / n}%`;
      t.progText.textContent = `${lit}/${n}${inPlan ? ` · 计划 ${inPlan}` : ""}`;
      t.progText.title = `已点亮 ${lit} / ${n}，现在能学 ${avail}${inPlan ? `，当前计划里还有 ${inPlan} 个` : ""}`;
      t.badge.innerHTML = st === "done" ? `${api.icon("lit")}<span>已完成</span>` : st === "open" ? `${api.icon("avail")}<span>可以开始</span>` : `${api.icon("locked")}<span>未解锁</span>`;

      const { needs } = regionText(laneId);
      const firstAvail = t.members.filter((s) => api.status(s.id) === "avail").sort((a, b) => b.reach - a.reach || a.step - b.step)[0];
      if (st === "done") t.next.replaceChildren(el("span", { class: "rg-note" }, "这个领域已全部点亮"));
      else if (firstAvail) {
        t.next.replaceChildren(el("button", { class: "rg-next-btn", onclick: (e) => { e.stopPropagation(); api.pickSkill(firstAvail.id); } },
          el("span", { class: "rg-next-k" }, "下一步"), el("span", { class: "rg-next-name" }, firstAvail.name), el("span", { "aria-hidden": "true" }, "→")));
      } else {
        const laneById = new Map(D.lanes.map((l) => [l.id, l]));
        const from = D.overview.roads.filter((x) => x.to === laneId).sort((a, b) => b.count - a.count)
          .filter((x) => api.laneProgress(x.from) < 1).slice(0, 3).map((x) => shortName(laneById.get(x.from)));
        t.next.replaceChildren(el("span", { class: "rg-note" }, from.length ? `先学：${from.join("、")}` : "先点亮前面领域里的必须前置"));
      }
      t.main.setAttribute("aria-label", `进入「${t.lane.name}」地图。${n} 个技能，已点亮 ${lit}，现在能学 ${avail}。${needs}。`);
    }
    if (focusLane) setFocus(focusLane);
  }

  // Fit the whole map into the view when it stays readable; otherwise keep 0.62 and let the page scroll.
  function fit() {
    const wrap = document.querySelector("#ov-wrap");
    const area = wrap.querySelector(".ov-scroll");
    if (!area || wrap.hidden) return;
    const narrow = window.matchMedia("(max-width: 900px)").matches;
    stage.classList.toggle("list", narrow);
    if (narrow) { stage.style.transform = ""; stage.parentElement.style.width = stage.parentElement.style.height = ""; return; }
    const { width, height } = D.overview;
    const r = area.getBoundingClientRect();
    const s = Math.max(0.62, Math.min(1, (r.width - 48) / width, (r.height - 32) / height));
    stage.style.transform = `scale(${s})`;
    Object.assign(stage.parentElement.style, { width: `${width * s}px`, height: `${height * s}px` });
  }

  return {
    init(a) {
      api = a;
      D = a.data;
      build();
      render();
    },
    render,
    fit,
  };
})();
