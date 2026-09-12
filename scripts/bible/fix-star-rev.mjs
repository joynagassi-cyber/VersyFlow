import { readFileSync, writeFileSync } from 'node:fs';

const p = 'scripts/bible/usfm2json.mjs';
let src = readFileSync(p, 'utf8');

// --- Fix 1: STAR → P+STAR for all pair-closer patterns ---
// The pattern `P + 'X' + STAR` means: backslash-X followed by a literal *
// But STAR is just `*` (unescaped) — when concatenated into a RegExp source,
// `*` after a character class or capture group acts as a quantifier on that
// preceding element. We need `\*` (P + STAR) to match a literal asterisk.

const pairs = [
  // [oldSuffix, newSuffix] — only the suffix after the word-marker content
  ["+ STRONGREF + P + 'w' + STAR",      "+ STRONGREF + P + 'w' + P + STAR"],
  ["+ STRONGREF + P + '+' + 'w' + STAR","+ STRONGREF + P + '+' + 'w' + P + STAR"],
  ["+ P + 'w' + STAR",                  "+ P + 'w' + P + STAR"],
  ["+ P + '+' + 'w' + STAR",            "+ P + '+' + 'w' + P + STAR"],
  ["+ P + 'nd' + STAR",                 "+ P + 'nd' + P + STAR"],
  ["+ P + 'd' + STAR",                  "+ P + 'd' + P + STAR"],
  ["+ P + '+' + 'it' + STAR",           "+ P + '+' + 'it' + P + STAR"],
  ["+ P + 'it' + STAR",                 "+ P + 'it' + P + STAR"],
  ["+ P + 'j' + STAR",                  "+ P + 'j' + P + STAR"],
  ["+ P + 'q' + STAR",                  "+ P + 'q' + P + STAR"],
  ["+ P + 's' + STAR",                  "+ P + 's' + P + STAR"],
];

for (const [old, nw] of pairs) {
  if (src.includes(old)) {
    src = src.split(old).join(nw);
    console.log('fixed:', old.trim().slice(0, 45), '→', nw.trim().slice(0, 50));
  } else {
    console.log('skip (not found):', old.trim().slice(0, 45));
  }
}

// --- Fix 2: RE_V — replace the whole line ---
const reVStart = src.indexOf("  const RE_V   = new RegExp");
const reVEnd   = src.indexOf('\n', reVStart);
if (reVStart !== -1) {
  // Build the new RE_V line. We want RegExp source:
  //   ^  \v  \s+  (\d+)  \s*  ([\s\S]*)  $
  // Using P (2-char, for one backslash) and B (1-char, single backslash):
  //   '^' + P + 'v ' + B + 's+' + '(' + B + 'd+)' + B + 's*' + '(' + B + '[' + B + 's' + B + 'S]*' + '$'
  // Note: no CLOSE after group 2 — the group captures everything to end of line.
  const newRE_V =
    "  const RE_V   = new RegExp('^' + P + 'v ' + B + 's+' + " +
    "String.fromCharCode(40) + B + 'd+' + String.fromCharCode(41) + " +
    "B + 's*' + String.fromCharCode(40) + B + '[' + B + 's' + B + 'S]*' + '$');";
  src = src.slice(0, reVStart) + newRE_V + src.slice(reVEnd);
  console.log('RE_V line replaced.');
}

writeFileSync(p, src, 'utf8');
console.log('Done. Size:', src.length);
