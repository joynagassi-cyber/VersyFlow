import fs from 'fs';
function* walk(dir){
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.codegraph') continue;
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx)$/.test(e.name)) yield p;
  }
}
const allUsed = new Set();
for (const dir of ['src','app']) {
  for (const file of walk(dir)) {
    const c = fs.readFileSync(file, 'utf8');
    const re = /t\(\s*['"]([a-z0-9_]+(?:\.[a-z0-9_]+)+)['"]/g;
    let m;
    while ((m = re.exec(c))) allUsed.add(m[1]);
  }
}
const langs = ['ar','de','en','fr','zh'];
// Parse locale object structure: flatten "parent.key" using simple line/brace walk
function flatten(file){
  const src = fs.readFileSync(file, 'utf8');
  const keys = new Set();
  const lines = src.split('\n');
  const stack = [];
  for (const line of lines){
    // 1. flat "key:" on this line belong to the section currently open (stack top)
    const parent = stack.length ? stack[stack.length-1] : '';
    for (const fm of line.matchAll(/([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/g)){
      if (parent) keys.add(`${parent}.${fm[1]}`);
    }
    // 2. push each section open
    for (const om of line.matchAll(/([a-zA-Z_][a-zA-Z0-9_-]*)\s*:\s*\{/g)){
      const name = om[1];
      keys.add(parent ? `${parent}.${name}` : name);
      stack.push(name);
    }
    // 3. pop per close at current depth
    const closeCount = (line.match(/}/g)||[]).length;
    for (let i=0;i<closeCount;i++){
      if (stack.length) stack.pop();
    }
  }
  return keys;
}
const locales = {};
for (const l of langs) locales[l] = flatten(`src/i18n/locales/${l}.ts`);
const missing = {};
for (const l of langs) missing[l] = [];
for (const k of allUsed){
  for (const l of langs){
    if (!locales[l].has(k)) missing[l].push(k);
  }
}
console.log('used t() dotted keys:', allUsed.size);
for (const l of langs){
  console.log(`\n== ${l} == (${missing[l].length} missing)`);
  console.log(missing[l].sort().join('\n'));
}
