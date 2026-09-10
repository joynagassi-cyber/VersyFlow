/**
 * import-bible-cli.ts — script entrypoint for `import-bible.ts`.
 *
 * Usage:
 *   npx vite-node scripts/import-bible-cli.ts [translationId]
 *   BIBLE_IMPORT_ID=kujv npx vite-node scripts/import-bible-cli.ts
 *
 * `import-bible.ts` is a pure library; this thin wrapper is the CLI surface.
 */

import { cwd } from 'node:process';
import runImport from './import-bible';

const id =
  process.argv[2] ??
  process.env.BIBLE_IMPORT_ID ??
  'lsg';

try {
  const report = runImport(id, cwd());
  console.log(`\n=== import-bible: ${report.translationId} ===`);
  console.log(
    `books: ${report.books}  chapters: ${report.chapters}  verses: ${report.verses}`,
  );

  if (report.missingCanon.length) {
    console.warn(
      `MISSING canon codes (${report.missingCanon.length}): ${report.missingCanon.join(', ')}`,
    );
  } else {
    console.log('canon coverage: all 66 book codes present');
  }

  if (report.warnings.length) {
    console.warn('warnings:');
    for (const w of report.warnings) console.warn(`  - ${w}`);
  }

  console.log(`normalized dataset written to: ${report.outputPath}`);
  console.log(report.ok ? '\nRESULT: OK' : '\nRESULT: FAILED (canon incomplete)');
  process.exitCode = report.ok ? 0 : 1;
} catch (err) {
  console.error(
    'import-bible failed:',
    err instanceof Error ? err.message : err,
  );
  process.exitCode = 1;
}
