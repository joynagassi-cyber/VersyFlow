/**
 * Fix double colon issue from theme migration
 */

const fs = require('fs');
const path = require('path');

function fixDoubleColon(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('colors.')) return false;

  // Fix double colon pattern: ": colors.xxx" → ": colors.xxx"
  content = content.replace(/:\s*:\s*colors\./g, ': colors.');

  if (content !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

function scanDir(dir) {
  const fixed = [];
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    try {
      if (fs.statSync(fp).isDirectory()) {
        if (f === 'node_modules' || f === '.git' || f === '__tests__' || f === '.expo') continue;
        fixed.push(...scanDir(fp));
      } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
        if (fixDoubleColon(fp)) fixed.push(fp);
      }
    } catch (e) {}
  }
  return fixed;
}

const results = scanDir('app');
console.log('Fixed ' + results.length + ' files with double colon issue');
results.slice(0, 5).forEach(r => console.log('  ' + r));
