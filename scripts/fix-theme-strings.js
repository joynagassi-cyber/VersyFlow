/**
 * Post-processing fix for theme migration
 * Converts string references like "colors.primary" to proper object access
 */

const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('useAppTheme')) return false;

  let changed = false;

  // Fix: backgroundColor: 'colors.xxx' → backgroundColor: colors.xxx
  content = content.replace(/:\s*['"]colors\.\w+['"]/g, (match) => {
    const colorProp = match.replace(/['"]/g, '');
    return ': ' + colorProp;
  });

  // Fix: color="colors.xxx" → color={colors.xxx}
  content = content.replace(/color="colors\.\w+"/g, (match) => {
    const colorProp = match.replace(/['"]/g, '').replace('color=', '');
    return 'color={' + colorProp + '}';
  });

  // Fix: borderColor="colors.xxx" → borderColor={colors.xxx}
  content = content.replace(/borderColor="colors\.\w+"/g, (match) => {
    const colorProp = match.replace(/['"]/g, '').replace('borderColor=', '');
    return 'borderColor={' + colorProp + '}';
  });

  // Fix: background-clip issues
  content = content.replace(/backgroundClip="colors\.\w+"/g, (match) => {
    const colorProp = match.replace(/['"]/g, '').replace('backgroundClip=', '');
    return 'backgroundClip={' + colorProp + '}';
  });

  if (content !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, content, 'utf8');
    changed = true;
  }

  return changed;
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
        if (fixFile(fp)) fixed.push(fp);
      }
    } catch (e) {}
  }
  return fixed;
}

const results = scanDir('app');
console.log('=== Post-Processing Fix Complete ===');
console.log('Fixed ' + results.length + ' files');
results.forEach(r => console.log('  ' + r));
