/**
 * Migration Script — Convert hardcoded colors to theme tokens
 * Run this script to audit and fix all hardcoded color values
 */

const fs = require('fs');
const path = require('path');

// Hardcoded color mappings from the design system
const COLOR_REPLACEMENTS = {
  // Primary
  '#E91E8C': 'colors.primary',
  '#b30069': 'colors.primaryDark',
  '#DF0E84': 'colors.primaryContainer',
  '#ffd9e4': 'colors.primaryFixed',
  '#ffb0cc': 'colors.primaryFixedDim',
  '#8d0051': 'colors.primaryFixedVariant',

  // Backgrounds
  '#fcf9f8': 'colors.background',
  '#FFF0F6': 'colors.surfaceTint',
  '#FAFAFA': 'colors.surface',
  '#FFFFFF': 'colors.surface',
  '#ffffff': 'colors.surface',

  // Borders & Dividers
  '#FFE4EE': 'colors.border',
  '#FFF0F6': 'colors.divider',
  '#F5F5F5': 'colors.divider',
  '#e1bdc8': 'colors.outlineVariant',

  // Text
  '#2D2D2D': 'colors.textPrimary',
  '#1c1b1b': 'colors.onSurface',
  '#594048': 'colors.textSecondary',
  '#6E6E6E': 'colors.textTertiary',
  '#A0A0A0': 'colors.textMuted',
  '#C0C0C0': 'colors.textPlaceholder',

  // Semantic
  '#008733': 'colors.success',
  '#34C759': 'colors.statusLearned',
  '#FF6B6B': 'colors.error',
  '#ba1a1a': 'colors.error',
  '#FF9500': 'colors.warning',
  '#007AFF': 'colors.info',
  '#1976D2': 'colors.info',

  // Icon backgrounds
  '#FFE4EE': 'colors.iconBgRose',
  '#EADCE2': 'colors.iconBgPurple',
  '#E3F2FD': 'colors.iconBgBlue',
  '#E8F5E9': 'colors.iconBgGreen',
  '#FFF3E0': 'colors.iconBgOrange',
  '#E0F2F1': 'colors.iconBgTeal',
  '#E8EAF6': 'colors.iconBgIndigo',
  '#FFEBEE': 'colors.errorLight',
  '#F5F5F5': 'colors.surfaceElevated',
};

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  for (const [color, token] of Object.entries(COLOR_REPLACEMENTS)) {
    const regex = new RegExp(`['"]${color}['"]`, 'g');
    const matches = content.match(regex);
    if (matches && matches.length > 0) {
      issues.push({ color, token, count: matches.length });
    }
  }

  return issues;
}

function scanDirectory(dir) {
  const results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file === 'node_modules' || file === '.git' || file === '__tests__') continue;
      results.push(...scanDirectory(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const issues = scanFile(fullPath);
      if (issues.length > 0) {
        results.push({ file: fullPath, issues });
      }
    }
  }

  return results;
}

const projectRoot = process.cwd();
const appDir = path.join(projectRoot, 'app');
const results = scanDirectory(appDir);

console.log('=== Color Hardcoding Audit ===\n');
console.log(`Found ${results.length} files with hardcoded colors:\n`);

let totalIssues = 0;
for (const result of results) {
  const relativePath = result.file.replace(projectRoot + '\\', '').replace(projectRoot + '/', '');
  totalIssues += result.issues.length;
  console.log(`📄 ${relativePath}`);
  for (const issue of result.issues) {
    console.log(`   ${issue.color} → ${issue.token} (${issue.count} occurrences)`);
  }
  console.log('');
}

console.log(`\nTotal: ${totalIssues} hardcoded color instances across ${results.length} files`);
console.log('\nTo fix these issues, update each file to:');
console.log('1. Import { useAppTheme } from \'@/theme/useTheme\'');
console.log('2. Destructure colors from useAppTheme()');
console.log('3. Replace hardcoded colors with colors.tokenName');
