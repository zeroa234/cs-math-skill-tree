// Verify exported local numbers, original provenance and formerly ambiguous coverage against all source data.
import assert from "node:assert/strict";
import fs from "node:fs";
import { numberOutline } from "../scripts/outline-sections.mjs";

const root = new URL("../", import.meta.url);
const read = name => JSON.parse(fs.readFileSync(new URL(name, root), "utf8"));
const exported = read("output/outlines.json");
let entries = 0;
for (const [id, generated] of Object.entries(exported)) {
  const raw = read(`data/outlines/${id}.json`);
  const sections = new Set();
  const check = (items, original, prefix = "") => {
    assert.equal(items.length, original.length);
    items.forEach((it, i) => {
      const number = prefix ? `${prefix}.${i + 1}` : String(i + 1);
      assert.equal(it.number, number, `${id}: non-contiguous skill number`);
      assert(!sections.has(number), `${id}: duplicate skill number`);
      sections.add(number);
      for (const field of ["ref", "src", "title", "zh", "fill"]) assert.deepEqual(it[field], original[i][field], `${id}/${number}: changed source ${field}`);
      check(it.items || [], original[i].items || [], number);
      entries++;
    });
  };
  check(generated.outline, raw.outline);
  generated.coverage.forEach((c, i) => {
    assert.deepEqual(c.refs, raw.coverage[i].refs, `${id}: lost original coverage references`);
    assert.equal(c.sections.length > 0, (c.refs || []).length > 0, `${id}: lost coverage`);
    assert(c.sections.every(n => sections.has(n)), `${id}: unresolved coverage section`);
  });
}
assert.equal(Object.keys(exported).length, read("output/skilltree.json").skills.length);
const limits = exported["M.1.1"].outline;
assert.equal(limits[0].number, "1");
assert.equal(limits[0].ref, "2.2");
assert.equal(limits[0].items[0].number, "1.1");
assert.equal(limits[0].items[0].ref, "");
assert.equal(limits[6].number, "7");
assert.equal(limits[6].src, "B");
assert.equal(limits[6].ref, "5.1");
const topic = (id, name) => exported[id].coverage.find(c => c.topic === name).sections;
assert.deepEqual(topic("F.1.5", "工作量/跨度"), ["4", "5", "7"]);
assert.deepEqual(topic("P.4.1", "生命周期"), ["1", "6", "6.2", "6.5"]);
assert.deepEqual(topic("P.4.1", "工程原则"), ["4", "5", "9", "9.2", "9.4"]);
assert.deepEqual(topic("P.4.1", "协作"), ["2", "3", "8", "8.1"]);
assert.deepEqual(topic("D.1.2", "索引"), ["1", "2", "3", "4"]);
assert.deepEqual(topic("D.1.2", "执行计划"), ["5", "6", "7", "8"]);
const ambiguous = read("data/outlines/P.4.1.json");
ambiguous.coverage[0].refs = ["B:2.1"];
assert.throws(() => numberOutline(ambiguous), /ambiguous ref B:2\.1/);
ambiguous.coverage[0].refs = ["B:not-a-section"];
assert.throws(() => numberOutline(ambiguous), /unknown ref B:not-a-section/);
console.log(`ok: ${Object.keys(exported).length} skills, ${entries} numbered entries; source associations and collision regressions`);
