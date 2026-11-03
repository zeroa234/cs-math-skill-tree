// Skill-local chapter numbers are independent of a textbook's original ref.
// Resolve coverage once at build time, before the browser can silently pick a duplicate ref.
export function numberOutline(o) {
  const refs = new Map();
  const aliases = new Map();
  const counts = new Map();
  const addRef = (key, number) => {
    if (!refs.has(key)) refs.set(key, new Set());
    refs.get(key).add(number);
  };
  const walk = (items, prefix = "", src = "", parents = []) => items.map((it, i) => {
    const number = prefix ? `${prefix}.${i + 1}` : String(i + 1);
    const source = it.src || src;
    const sourcePath = [...parents, it.ref].filter(Boolean);
    if (it.ref) {
      addRef(`${source}:${it.ref}`, number);
      addRef(`${source}:${sourcePath.join("/")}`, number);
    }
    if (!prefix) {
      const ordinal = (counts.get(source) || 0) + 1;
      counts.set(source, ordinal);
      aliases.set(`${source}:#${ordinal}`, number);
    }
    return { ...it, number, ...(it.items ? { items: walk(it.items, number, source, sourcePath) } : {}) };
  });
  const outline = walk(o.outline);
  const coverage = (o.coverage || []).map(c => ({
    ...c,
    sections: [...new Set((c.refs || []).map(ref => {
      // An actual lecture named '#10' takes precedence over a branch ordinal.
      const matches = refs.get(ref) || (aliases.has(ref) ? new Set([aliases.get(ref)]) : new Set());
      if (matches.size !== 1) throw new Error(`outline ${o.id}: coverage ${c.topic}: ${matches.size ? "ambiguous" : "unknown"} ref ${ref}`);
      return [...matches][0];
    }))],
  }));
  return { outline, coverage };
}
