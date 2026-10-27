# VersyFlow — CI/CD Pipeline

Single unified pipeline (`.github/workflows/ci-cd.yml`) replacing the six
deleted legacy workflows (`build.yml`, `build-apk.yml`, `build-apk-simple.yml`,
`ci.yml`, `deploy.yml`, `claude-code.yml`).

## 1. Pipeline overview

```
                 ┌─────────────────────┐
                 │     push / PR       │
                 │  main, develop      │
                 │  + workflow_dispatch│
                 └──────────┬──────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
 ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
 │ typecheck    │   │ lint         │   │ tests +      │   quality-gate
 │ tsc --noEmit │   │ eslint       │   │ coverage     │   (parallel matrix,
 └──────┬───────┘   └──────┬───────┘   └──────┬───────┘    fail-fast: false)
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
                    ┌─────────────┐
                    │ build-web   │   npm ci (postinstall PowerSync worker
                    │ Vite → www/ │   patch) → npm run build → upload-artifact
                    └──────┬──────┘   web-build-www (7d)
                           │
        ┌──────────────────┴───────────────────┐
        ▼                                      ▼
 ┌──────────────────┐ ┌──────────────────────┐
 │ build-android    │ │ build-android-release│
 │ debug APK        │ │ SIGNED release APK   │
 │                  │ │ keystore secrets     │
 │ PR, main, develop│ │ push to main only,   │
 │ push, dispatch   │ │ dispatch (build_     │
 │ (not when build_ │ │ release=true),       │
 │  release=true)   │ │ environment:         │
 │ needs:           │ │ production           │
 │ [quality-gate,   │ │ needs:               │
 │  build-web]      │ │ [quality-gate,       │
 │ no secrets       │ │  build-web]          │
 └────────┬─────────┘ └──────────┬───────────┘
         │ artifacts             │ artifacts
         ▼                       ▼
 versyflow-debug-<sha>.apk   versyflow-release-<sha>.apk
 (14d retention)             (30d retention)
```

**DAG rule:** both Android jobs `needs: [quality-gate, build-web]` — an APK is
only built when every gate (typecheck, lint, tests+coverage) passes.

| Job | Trigger | Secrets needed | Output |
|-----|---------|----------------|--------|
| quality-gate | every push to main/develop, every PR to main, dispatch | none | typecheck / lint / coverage artifact |
| build-web | gates pass | VITE_* (empty on PRs is fine) | `web-build-www` artifact |
| build-android | PR, main/develop push, dispatch (not `build_release=true`) | none | debug APK (14d) |
| build-android-release | push to main, dispatch `build_release=true` | KEYSTORE, KEYSTORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD | signed APK (30d) |

The release-consuming job (`build-android-release`) declares
`environment: production` — create the
environment once (Settings → Environments → `production`) and optionally gate
releases behind required reviewers.

## 2. Secrets checklist (Settings → Secrets and variables → Actions)

Full creation recipes: `.github/secrets-checklist.md`.

| Secret | Consumed by | Status / note |
|--------|-------------|---------------|
| `VITE_SUPABASE_URL` | build-web (Vite env) | exists — verify it matches `.env.local` |
| `VITE_SUPABASE_ANON_KEY` | build-web (Vite env) | exists — must be the anon/publishable key, never the service role key |
| `VITE_POWERSYNC_URL` | build-web (Vite env) | **create** from `.env.local` value |
| `KEYSTORE` | build-android-release | base64 of `keystore/release.keystore` (never committed) |
| `KEYSTORE_PASSWORD` | build-android-release | `-storepass` value |
| `KEY_ALIAS` | build-android-release | `-alias` value (convention: `versyflow-release-key`) |
| `KEY_PASSWORD` | build-android-release | `-keypass` value |
| `SUPABASE_URL` / `SUPABASE_SECRET_KEY` | **not** consumed by CI | manual Supabase CLI only; keep the service role key out of CI entirely |

PRs run with empty `VITE_*` values by design (safe placeholder config); only
main-branch builds get the real values.

## 3. How to trigger each pipeline

| What you do | What runs |
|-------------|-----------|
| Push to `develop` | quality-gate → build-web → build-android (debug APK) |
| Open/update a PR targeting `main` | quality-gate → build-web → build-android (debug APK) |
| Push to `main` | quality-gate → build-web → build-android **and** build-android-release (signed APK) |
| `workflow_dispatch` (Actions tab) | gates + web build always; toggle `build_release` for the signed APK; optional `version` label on the artifact name |

Note: `build-android` is excluded when dispatch has `build_release=true`
(debug and release builds are mutually exclusive on manual runs).

## 4. Adding a new platform (iOS)

1. **Native shell** — one time, locally: `npm run cap:add:ios`
   (commit the generated `ios/` tree).
2. **New job** in `ci-cd.yml`, modeled on `build-android`:

   ```yaml
   build-ios:
     name: iOS (debug archive)
     runs-on: macos-latest
     needs: [quality-gate, build-web]
     steps:
       - uses: actions/checkout@v4
       - uses: actions/setup-node@v4
         with: { node-version: 22, cache: npm }
       - run: npm ci
       - uses: actions/download-artifact@v4
         with: { name: web-build-www, path: www }
       - run: npx cap sync ios
       - run: cd ios && xcodebuild -workspace VersyFlow.xcworkspace
             -scheme VersyFlow -configuration Debug -sdk iphonesimulator
             -derivedDataPath build build
       - uses: actions/upload-artifact@v4
         with:
           name: versyflow-debug-${{ github.sha }}.zip
           path: build/Build/Products/*-iphonesimulator/
           retention-days: 14
   ```

3. **iOS release signing** — distribute the Provisioning Profile and
   Signing Certificate (base64) as secrets (mirror the keystore strategy,
   e.g. `IOS_DIST_CERT` + `IOS_DIST_P12_PASSWORD` + `IOS_PROVISIONING_PROFILE`),
   add a `build-ios-release` job with `environment: production`, and a
   `dist` provisioning profile / `ios/build/` export step.
4. **Gate** it on `[quality-gate, build-web]` exactly like the Android jobs,
   so no platform ships unverified code.
5. Add its secrets to `.github/secrets-checklist.md`.

## 5. Troubleshooting guide

| Symptom | Cause | Fix |
|---------|-------|-----|
| `::error::KEYSTORE secret ... is missing` before the build | One of the 4 keystore secrets unset (fail-fast pre-check) | Create the secret, re-run (the job fails fast, before Gradle) |
| Release job fails: "APK is signed with the Android DEBUG keystore" | `RELEASE_*` properties never reached Gradle (keystore not decoded / password wrong / `RELEASE_STORE_FILE` path off) | Check `KEYSTORE_PASSWORD`/`KEY_ALIAS` match the keystore; the workflow decodes to `keystore/release.keystore` relative to the repo root, `RELEASE_STORE_FILE=../../keystore/release.keystore` from `android/app/` |
| `cap sync android` fails / `www/` empty | `web-build-www` artifact missing | `build-web` must succeed first; the job downloads it into `./www` before syncing |
| Android build: SDK / build-tools errors | Missing build tools on the runner | The job installs Build-Tools 35 + Platform 35 via `android-actions/setup-android@v3`; ensure `android/` tree is committed (it is part of the repo) |
| Coverage artifact empty | `tests` check must run `npm run test:coverage` (it does) | If you changed it back to `npm test`, restore `test:coverage` — `vitest run` alone writes no `coverage/` dir |
| `npm ci` fails: "lockfile out of date" | `package-lock.json` not committed / out of sync | `npm install` locally, commit the updated lockfile |
| PowerSync worker 404 in built app | postinstall patch not applied | `npm ci` (not `npm install`) runs `scripts/patch-powersync-worker.cjs`; the patch is idempotent — a stale patch never breaks the build |
| Concurrent runs pile up | Concurrency group | `concurrency: ci-${{ github.workflow }}-${{ github.ref }}` with `cancel-in-progress: true` — newer push cancels the older one |

## 6. Verify the pipeline works

Local (before pushing):

```bash
npm ci                     # also runs the postinstall PowerSync worker patch
npm run typecheck          # tsc -p tsconfig.app.json --noEmit
npm run lint               # eslint . --ext .ts,.tsx
npm run test:coverage      # vitest run --coverage → coverage/
npm run build              # tsc -b + vite build → www/
npx cap sync android       # copies www/ into android/assets/www
cd android && ./gradlew assembleDebug
keytool -printcert -jarfile app/build/outputs/apk/debug/app-debug.apk   # signature sanity
```

CI (GitHub Actions):

```
Push to develop or open a PR → watch:
  Quality Gate — typecheck / lint / tests (all 3 green)
  Build Web (uploads web-build-www)
  Android (debug APK) (uploads versyflow-debug-<sha>.apk)

Push to main → additionally:
  Android (signed release APK) (uploads versyflow-release-<sha>.apk,
    passes only if NOT signed by the debug keystore)
```

Manual: Actions tab → "CI/CD — Web + Android" → Run workflow →
`build_release: true` to force the signed APK without pushing to main.

```bash
# Optional: static YAML sanity check
node -e "require('yaml').parse(require('fs').readFileSync('.github/workflows/ci-cd.yml','utf8'))" && echo OK
```
