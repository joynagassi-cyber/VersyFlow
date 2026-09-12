import fs from 'fs';

function flatten(file){
  const src = fs.readFileSync(file, 'utf8');
  const out = new Set();
  const startMatch = src.match(/=\s*\{/);
  let i = startMatch ? startMatch.index + startMatch[0].length - 1 : 0;
  const n = src.length;
  const path = [];
  i++; // consume root '{'

  function skipWs(){ while (i < n && /\s/.test(src[i])) i++; }
  function expectKey(){
    skipWs();
    let key = '';
    if (src[i] === "'" || src[i] === '"') {
      const q = src[i]; i++;
      while (i < n && src[i] !== q) {
        if (src[i] === '\\') i++;
        key += src[i]; i++;
      }
      i++;
    } else {
      while (i < n && /[A-Za-z0-9_-]/.test(src[i])) { key += src[i]; i++; }
    }
    skipWs();
    if (src[i] !== ':') return null;
    i++;
    skipWs();
    const full = path.length ? path[path.length - 1] + '.' + key : key;
    if (src[i] === '{') {
      out.add(full);
      path.push(key);
      return 'section';
    } else {
      out.add(full);
      // skip value
      if (src[i] === "'" || src[i] === '"') {
        const q = src[i]; i++;
        while (i < n && src[i] !== q) {
          if (src[i] === '\\') i++;
          i++;
        }
        i++;
      } else if (src[i] === '`') {
        i++;
        while (i < n && src[i] !== '`') i++;
        i++;
      } else {
        while (i < n && src[i] !== ',' && src[i] !== '}' && src[i] !== ';') i++;
      }
      return 'value';
    }
  }

  while (i < n) {
    const ch = src[i];
    if (ch === '}') { i++; path.pop(); continue; }
    if (ch === ',' || ch === ';') { i++; continue; }
    const r = expectKey();
    if (r === null || r === undefined) { i++; }
    if (path.length === 0) break;
  }
  return out;
}

function* walk(dir){
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.codegraph') continue;
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx)$/.test(e.name)) yield p;
  }
}
const used = new Set();
for (const dir of ['src','app']) {
  for (const file of walk(dir)) {
    const c = fs.readFileSync(file, 'utf8');
    const re = /t\(\s*['"]([a-z0-9_]+(?:\.[a-z0-9_]+)+)['"]/g;
    let m;
    while ((m = re.exec(c))) used.add(m[1]);
  }
}
const langs = ['ar','de','en','fr','zh'];
console.log('used t() keys:', used.size);
for (const l of langs) {
  const k = flatten(`src/i18n/locales/${l}.ts`);
  const missing = [...used].filter(x => !k.has(x)).sort();
  console.log(`=== ${l} missing: ${missing.length} (of ${k.size} keys)`);
  if (missing.length) console.log(missing.join(' | '));
}
