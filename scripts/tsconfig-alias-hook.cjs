// Resolves the "@/*" path aliases for tsx (used by scripts that import
// from src/ while running under plain tsx). Load with:
//   tsx -r ./scripts/tsconfig-alias-hook.cjs <script>
//
// tsx's internal resolveTsPaths() consults Module._resolveFilename as a
// final fallback, so this hook is what actually makes @/ work under tsx
// when tsconfig-paths/register is unavailable or mis-configured.
const Module = require('node:module');
const tsconfigPaths = require('tsconfig-paths');

const root = process.cwd();
const cfg = tsconfigPaths.loadConfig(`${root}/tsconfig.app.json`);
if (cfg.resultType === 'success') {
  const matchPath = tsconfigPaths.createMatchPath(cfg.absoluteBaseUrl, cfg.paths);
  const originalResolve = Module._resolveFilename;
  Module._resolveFilename = function (request, ...args) {
    if (request.startsWith('@/')) {
      // matchPath(request, readJson?, fileExists?, extensions?) — the last
      // arg is the array of file extensions to try for "file"-type paths.
      const resolved = matchPath(request, undefined, undefined, [
        '.ts', '.tsx', '.js', '.jsx', '.json', '.node',
      ]);
      if (resolved && resolved !== request) {
        return originalResolve.call(this, resolved, ...args);
      }
    }
    return originalResolve.call(this, request, ...args);
  };
}
