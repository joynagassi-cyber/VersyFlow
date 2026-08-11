/**
 * Auto-Theme Migration Script
 * Converts hardcoded colors to theme tokens across all screens
 */

const fs = require('fs');
const path = require('path');

// Color replacement map
const COLOR_MAP = {
  '#E91E8C': 'colors.primary',
  '#e91e8c': 'colors.primary',
  '#b30069': 'colors.primaryDark',
  '#DF0E84': 'colors.primaryContainer',
  '#ffd9e4': 'colors.primaryFixed',
  '#ffb0cc': 'colors.primaryFixedDim',
  '#8d0051': 'colors.primaryFixedVariant',
  '#fcf9f8': 'colors.background',
  '#FCF9F8': 'colors.background',
  '#FFF0F6': 'colors.surfaceTint',
  '#fff0f6': 'colors.surfaceTint',
  '#FAFAFA': 'colors.surface',
  '#FAfafafa': 'colors.surface',
  '#FFFFFF': 'colors.surface',
  '#ffffff': 'colors.surface',
  '#FFE4EE': 'colors.border',
  '#ffe4ee': 'colors.border',
  '#F5F5F5': 'colors.surfaceElevated',
  '#f5f5f5': 'colors.surfaceElevated',
  '#2D2D2D': 'colors.textPrimary',
  '#2d2d2d': 'colors.textPrimary',
  '#1c1b1b': 'colors.onSurface',
  '#594048': 'colors.textSecondary',
  '#6E6E6E': 'colors.textTertiary',
  '#6e6e6e': 'colors.textTertiary',
  '#A0A0A0': 'colors.textMuted',
  '#a0a0a0': 'colors.textMuted',
  '#C0C0C0': 'colors.textPlaceholder',
  '#c0c0c0': 'colors.textPlaceholder',
  '#008733': 'colors.success',
  '#008733': 'colors.success',
  '#34C759': 'colors.statusLearned',
  '#FF6B6B': 'colors.error',
  '#ff6b6b': 'colors.error',
  '#ba1a1a': 'colors.error',
  '#FF9500': 'colors.warning',
  '#ff9500': 'colors.warning',
  '#007AFF': 'colors.info',
  '#007aff': 'colors.info',
  '#1976D2': 'colors.info',
  '#1976d2': 'colors.info',
  '#FFE4EE': 'colors.iconBgRose',
  '#ff E4EE': 'colors.iconBgRose',
  '#EADCE2': 'colors.iconBgPurple',
  '#e3f2fd': 'colors.iconBgBlue',
  '#E8F5E9': 'colors.iconBgGreen',
  '#FFF3E0': 'colors.iconBgOrange',
  '#E0F2F1': 'colors.iconBgTeal',
  '#E8EAF6': 'colors.iconBgIndigo',
  '#FFEBEE': 'colors.errorLight',
  '#e1bdc8': 'colors.outlineVariant',
  '#008733': 'colors.success',
  '#A0A0A0': 'colors.textMuted',
};

// Icon background replacements (special case)
const ICON_BG_MAP = {
  '#FFE4EE': 'colors.iconBgRose',
  '#EADCE2': 'colors.iconBgPurple',
  '#E3F2FD': 'colors.iconBgBlue',
  '#E8F5E9': 'colors.iconBgGreen',
  '#FFF3E0': 'colors.iconBgOrange',
  '#E0F2F1': 'colors.iconBgTeal',
  '#E8EAF6': 'colors.iconBgIndigo',
  '#FFEBEE': 'colors.errorLight',
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let changes = [];

  // Check if file already uses theme hook
  if (content.includes('useAppTheme') || content.includes('useTheme')) {
    return { changes: [], modified: false };
  }

  // Replace colors
  for (const [color, token] of Object.entries(COLOR_MAP)) {
    const regex = new RegExp(color.replace(/[#]/g, '\\\\$&'), 'gi');
    const matches = content.match(regex);
    if (matches && matches.length > 0) {
      content = content.replace(regex, token);
      changes.push({ color, token, count: matches.length });
      modified = true;
    }
  }

  if (!modified) return { changes: [], modified: false };

  // Add import if needed
  if (!content.includes('import { useAppTheme }')) {
    content = content.replace(
      /import { (.+) } from ['"]react-native['"];/,
      'import { $1 } from \'react-native\';\nimport { useAppTheme } from \'@/theme/useTheme\';'
    );
  }

  // Add hook call if needed
  if (!content.includes('const { colors') && !content.includes('const colors =')) {
    // Find the component function and add the hook
    const functionMatch = content.match(/export default function \w+\(\) \{/);
    if (functionMatch) {
      const insertPos = functionMatch.index + functionMatch[0].length;
      content = content.slice(0, insertPos) + '\n  const { colors, sp, sh, rad } = useAppTheme();' + content.slice(insertPos);
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  return { changes, modified: true };
}

function scanDir(dir) {
  const results = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file === 'node_modules' || file === '.git' || file === '__tests__' || file === '.expo') continue;
      results.push(...scanDir(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const result = processFile(fullPath);
      if (result.modified) {
        results.push({ file: fullPath, ...result });
      }
    }
  }
  return results;
}

const projectRoot = process.cwd();
const appDir = path.join(projectRoot, 'app');
const results = scanDir(appDir);

console.log('=== Theme Migration Complete ===\n');
console.log(`Fixed ${results.length} files\n`);

let totalChanges = 0;
for (const r of results) {
  const relPath = r.file.replace(projectRoot + '\\', '').replace(projectRoot + '/', '');
  totalChanges += r.changes.length;
  console.log(`✓ ${relPath}`);
  r.changes.forEach(c => {
    console.log(`  ${c.color} → ${c.token} (${c.count})`);
  });
}

console.log(`\nTotal: ${totalChanges} color replacements`);
