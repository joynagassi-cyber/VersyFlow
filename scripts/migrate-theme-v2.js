/**
 * Theme Migration Script v2
 * Properly adds useAppTheme import and hook to all files
 */

const fs = require('fs');
const path = require('path');

const COLOR_MAP = {
  '#E91E8C': 'colors.primary', '#e91e8c': 'colors.primary',
  '#fcf9f8': 'colors.background',
  '#FFF0F6': 'colors.surfaceTint', '#fff0f6': 'colors.surfaceTint',
  '#FFE4EE': 'colors.border', '#ffe4ee': 'colors.border',
  '#2D2D2D': 'colors.textPrimary', '#2d2d2d': 'colors.textPrimary',
  '#594048': 'colors.textSecondary', '#594048': 'colors.textSecondary',
  '#6E6E6E': 'colors.textTertiary', '#6e6e6e': 'colors.textTertiary',
  '#A0A0A0': 'colors.textMuted', '#a0a0a0': 'colors.textMuted',
  '#008733': 'colors.success', '#008733': 'colors.success',
  '#FF6B6B': 'colors.error', '#ff6b6b': 'colors.error',
  '#FF9500': 'colors.warning', '#ff9500': 'colors.warning',
  '#007AFF': 'colors.info', '#007aff': 'colors.info',
  '#1976D2': 'colors.info',
  '#FFFFFF': 'colors.surface', '#ffffff': 'colors.surface',
  '#F5F5F5': 'colors.surfaceElevated',
  '#ffd9e4': 'colors.primaryFixed',
  '#e1bdc8': 'colors.outlineVariant',
  '#1c1b1b': 'colors.onSurface',
  '#D1C3C9': 'colors.outline',
  '#e3f2fd': 'colors.iconBgBlue',
  '#e8f5e9': 'colors.iconBgGreen',
  '#fff3e0': 'colors.iconBgOrange',
  '#e0f2f1': 'colors.iconBgTeal',
  '#e8eaf6': 'colors.iconBgIndigo',
  '#ffebee': 'colors.errorLight',
  '#eadce2': 'colors.iconBgPurple',
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('useAppTheme')) return false; // Already migrated

  let changed = false;

  // Replace colors
  for (const [color, token] of Object.entries(COLOR_MAP)) {
    const regex = new RegExp(color.replace(/[#]/g, '\\$&'), 'gi');
    const matches = content.match(regex);
    if (matches && matches.length > 0) {
      content = content.replace(regex, token);
      changed = true;
    }
  }

  // Add import
  if (!content.includes("import { useAppTheme }")) {
    // Find the react-native import line
    const rnImport = content.match(/import \{[^}]+\} from ['"]react-native['"];/);
    if (rnImport) {
      content = content.replace(rnImport[0], rnImport[0] + '\nimport { useAppTheme } from \'@/theme/useTheme\';');
    } else {
      // Add at the beginning of imports
      const firstImport = content.match(/^import .+$/m);
      if (firstImport) {
        content = content.replace(firstImport[0], firstImport[0] + '\nimport { useAppTheme } from \'@/theme/useTheme\';');
      }
    }
  }

  // Add hook call inside component function
  if (!content.includes('const { colors')) {
    // Find the component function
    const funcMatch = content.match(/export default function \w+\(\) \{/) ||
                      content.match(/export default function \w+\(\{[^)]*\}\) \{/);
    if (funcMatch) {
      const pos = funcMatch.index + funcMatch[0].length;
      content = content.slice(0, pos) + '\n  const { colors, sp, sh, rad } = useAppTheme();' + content.slice(pos);
    }
  }

  if (changed) {
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
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) {
        if (f === 'node_modules' || f === '.git' || f === '__tests__' || f === '.expo') continue;
        fixed.push(...scanDir(fp));
      } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
        if (processFile(fp)) fixed.push(fp);
      }
    } catch (e) {}
  }
  return fixed;
}

const results = scanDir('app');
console.log('=== Theme Migration Complete ===');
console.log('Fixed ' + results.length + ' files');
results.forEach(r => console.log('  ' + r));
