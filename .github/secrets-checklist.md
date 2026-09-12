# VersyFlow — CI/CD Secrets Checklist

Every secret consumed by `.github/workflows/ci-cd.yml`. Scope: **Repository
secrets** — Settings → Secrets and variables → Actions → New repository
secret. The release-signing secrets can also live in the `production`
environment scope (the `build-android-release` job declares
`environment: production`).

## Pipeline secrets (consumed by ci-cd.yml)

| # | Secret | Status | Used by | Purpose | How to create |
|---|--------|--------|---------|---------|---------------|
| 1 | `VITE_SUPABASE_URL` | ✅ exists | build-web | Supabase URL baked into the Vite bundle (`import.meta.env.VITE_SUPABASE_URL`) | Already present as a repo secret — verify it matches `.env.local`. |
| 2 | `VITE_SUPABASE_ANON_KEY` | ✅ exists | build-web | Supabase publishable/anon key baked into the bundle. Must be the **anon** key — never the service role key (service role must NEVER ship to the client). | Already present — confirm it is the anon/publishable key. |
| 3 | `VITE_POWERSYNC_URL` | ❌ missing | build-web | PowerSync sync endpoint baked into the bundle; required for runtime sync. | Copy the `VITE_POWERSYNC_URL` value from `.env.local` and add it as a repo secret. |
| 4 | `KEYSTORE` | ❌ missing | build-android-release | Base64 of `keystore/release.keystore`, decoded at build time for release APK signing. | See "Keystore setup" below. **Never commit the keystore file.** |
| 5 | `KEYSTORE_PASSWORD` | ❌ missing | build-android-release | Password of the release keystore (the `-storepass` value from `keytool`). | Use the value you chose in `keytool -genkeypair`. It only reaches `android/gradle.properties` inside the CI runner — never in the repo. |
| 6 | `KEY_ALIAS` | ❌ missing | build-android-release | Key alias inside the keystore (default convention: `versyflow-release-key`). | The `-alias` value passed to `keytool -genkeypair`. |
| 7 | `KEY_PASSWORD` | ❌ missing | build-android-release | Password of the key entry (the `-keypass` value; often identical to the store password). | Same value as `KEYSTORE_PASSWORD` in the typical case; store it here regardless. |

## Workflow-only secrets (not consumed by ci-cd.yml)

None.

## Backend-only secrets (NOT consumed by any CI build)

| # | Secret | Status | Purpose |
|---|--------|--------|---------|
| 8 | `SUPABASE_URL` | ✅ exists | Supabase project URL — kept for manual Supabase CLI migration runs (`supabase db push`), not referenced by `ci-cd.yml`. Leave as-is or move to an environment-scoped secret. |
| 9 | `SUPABASE_SECRET_KEY` | ✅ exists | Supabase service-role key for manual DB pushes only. **High privilege: keep out of any CI job** — restrict access (environment scope), never inject into build jobs. |

---

## Keystore setup (one-time, local machine)

The release keystore (`keystore/release.keystore`) is **never committed** —
`keystore/`, `*.keystore`, `*.jks` are git-ignored and the file is untracked
(verify with `git check-ignore keystore/release.keystore`). The standard
`android/app/debug.keystore` stays tracked; it is the well-known Android
default and harmless.

### 1. Generate the keystore (if you don't have one yet)

```bash
keytool -genkeypair \
  -keystore keystore/release.keystore \
  -alias versyflow-release-key \
  -keyalg RSA -keysize 4096 -validity 10000 \
  -storetype PKCS12 \
  -storepass <STRONG_PASSWORD> \
  -keypass <STRONG_PASSWORD>
```

The alias, store password and key password become `KEY_ALIAS`,
`KEYSTORE_PASSWORD` and `KEY_PASSWORD`.

> ⚠️ The old hardcoded password referenced in earlier docs (`VersyFlow2024!`)
> is **deprecated**: regenerate the keystore with a fresh strong password and
> re-create the four secrets. A new key changes the app's identity on Google
> Play and breaks in-place updates — only regenerate if you no longer have the
> original keystore, and keep the old one for a Play identity migration.

### 2. Encode and create the `KEYSTORE` secret

```bash
# Git Bash / Linux / macOS
base64 -w0 keystore/release.keystore   # copy the single-line output
```

<details>
<summary>Windows PowerShell alternative</summary>

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('keystore\release.keystore'))
```

</details>

Then: Settings → Secrets and variables → Actions → **New repository secret** →
name `KEYSTORE`, value = the base64 string.

### 3. What the pipeline does with it

`build-android-release` (push to main, or dispatch with `build_release=true`):

1. Fail-fast pre-check: `test -n` on all four keystore secrets with a clear
   `::error::` message, so a missing secret fails before the (slow) build.
2. `echo "$KEYSTORE" | base64 -d > keystore/release.keystore`
3. Appends `RELEASE_STORE_FILE=../../keystore/release.keystore`,
   `RELEASE_STORE_PASSWORD`, `RELEASE_KEY_ALIAS`, `RELEASE_KEY_PASSWORD` to
   `android/gradle.properties` (the file the signed build writes is
   disposable on the runner and never committed).
4. `./gradlew assembleRelease` — `android/app/build.gradle`
   `signingConfigs.release` reads those properties via `findProperty()`.
5. `keytool -printcert -jarfile app-release.apk` — fails the job if the APK
   was accidentally signed with the Android **debug** cert (i.e. the
   properties did not apply and the fallback was used).

### 4. Offline backup

Back up the keystore file **and** the four credential values offline (encrypted
password manager / HSM / offline disk). Losing the keystore makes it
impossible to push updates under the same Play identity. Prefer an
`environment: production` secret scope so release signing requires unlocking
the production environment.

---

## GitHub environment `production`

`build-android-release` declares `environment: production`.
Create it once: Settings → Environments → New environment → name `production`.
Optionally restrict who can deploy to it.

## Quick reference (no values — values stay in GitHub Secrets only)

```bash
# Vite build-time env (rows 1–3)
VITE_SUPABASE_URL=<supabase project URL>
VITE_SUPABASE_ANON_KEY=<anon / publishable key>
VITE_POWERSYNC_URL=<powersync endpoint>

# Release signing (rows 4–7)
KEYSTORE=<base64 of keystore/release.keystore>
KEYSTORE_PASSWORD=<storepass>
KEY_ALIAS=<alias, e.g. versyflow-release-key>
KEY_PASSWORD=<keypass>
```

See `.github/ci-secrets.example.env` for a copy-pasteable (value-free) reference.
