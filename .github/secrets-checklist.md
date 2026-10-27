# VersyFlow — CI/CD Secrets Checklist

Every secret consumed by `.github/workflows/ci-cd.yml`. Scope: **Repository
secrets** — Settings → Secrets and variables → Actions → New repository
secret. The release-signing secrets can also live in the `production`
environment scope (the `build-android-release` and `build-ios-release` jobs
declare `environment: production`).

## Pipeline secrets (consumed by ci-cd.yml)

| # | Secret | Status | Used by | Purpose | How to create |
|---|--------|--------|---------|---------|---------------|
| 1 | `VITE_SUPABASE_URL` | ✅ exists | build-web | Supabase URL baked into the Vite bundle (`import.meta.env.VITE_SUPABASE_URL`) | Already present as a repo secret — verify it matches `.env.local`. |
| 2 | `VITE_SUPABASE_ANON_KEY` | ✅ exists | build-web | Supabase publishable/anon key baked into the bundle. Must be the **anon** key — never the service role key (service role must NEVER ship to the client). | Already present — confirm it is the anon/publishable key. |
| 3 | `VITE_POWERSYNC_URL` | ✅ exists | build-web | PowerSync sync endpoint baked into the bundle; required for runtime sync. | Present — verify it matches `.env.local`. |
| 4 | `KEYSTORE` | ✅ exists | build-android-release | Base64 of `keystore/release.keystore`, decoded at build time for release APK signing. | See "Keystore setup" below. **Never commit the keystore file.** |
| 5 | `KEYSTORE_PASSWORD` | ✅ exists | build-android-release | Password of the release keystore (the `-storepass` value from `keytool`). | Set to `VersyFlow2024!` (current keystore). It only reaches `android/gradle.properties` inside the CI runner — never in the repo. |
| 6 | `KEY_ALIAS` | ✅ exists | build-android-release | Key alias inside the keystore (`versyflow-release-key`). | Set in GitHub. |
| 7 | `KEY_PASSWORD` | ✅ exists | build-android-release | Password of the key entry (`VersyFlow2024!`). | Same value as `KEYSTORE_PASSWORD` in the typical case. |

### iOS signing secrets (consumed by `build-ios-release`)

These gate the iOS job: **while any of them is missing, the job is skipped**
(no macOS minutes spent). Set all four to activate signed `.ipa` builds on tag.
See "Apple / iOS signing setup" below.

| # | Secret | Status | Used by | Purpose | How to create |
|---|--------|--------|---------|---------|---------------|
| 8 | `APPLE_CERTIFICATE_P12` | ❌ missing | build-ios-release | Base64 of the Apple **Distribution `.p12`** certificate (exported from Keychain Access). | See "Apple / iOS signing setup". |
| 9 | `APPLE_CERTIFICATE_PASSWORD` | ❌ missing | build-ios-release | The password you set when exporting the `.p12`. | Same step. |
| 10 | `APPLE_PROVISION_PROFILE_BASE64` | ❌ missing | build-ios-release | Base64 of the App Store / AdHoc `.mobileprovision` matching the certificate + App ID. | Same step. |
| 11 | `APPLE_TEAM_ID` | ❌ missing | build-ios-release | 10-char Apple Developer Team ID (from the cert or App Store Connect). | From Xcode → Accounts, or `security find-identity -v -p codesigning`. |

## Workflow-only secrets (not consumed by ci-cd.yml)

None.

## Backend-only secrets (NOT consumed by any CI build)

| # | Secret | Status | Purpose |
|---|--------|--------|---------|
| 12 | `SUPABASE_URL` | ✅ exists | Supabase project URL — kept for manual Supabase CLI migration runs (`supabase db push`), not referenced by `ci-cd.yml`. Leave as-is or move to an environment-scoped secret. |
| 13 | `SUPABASE_SECRET_KEY` | ✅ exists | Supabase service-role key for manual DB pushes only. **High privilege: keep out of any CI job** — restrict access (environment scope), never inject into build jobs. |

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

`build-android-release` and `build-ios-release` declare `environment: production`.
Create it once: Settings → Environments → New environment → name `production`.
Optionally restrict who can deploy to it.

## Apple / iOS signing setup (one-time, on a Mac with Xcode)

Required for the `build-ios-release` job (`.ipa`). The `ios/` Xcode project is
generated **locally on a Mac** with `npx cap add ios` + `npx cap sync ios`, then
committed — it is **not** generated by the CI runner.

### 0. Generate and commit the `ios/` project (on a Mac)

```bash
npx cap add ios          # one-time
npx cap sync ios         # after each web build / plugin change
git add ios && git commit -m "chore: add Capacitor iOS project"
```

### 1. Export the Distribution `.p12` (Keychain Access)

1. In Xcode → *Signing & Capabilities*, make sure an **Apple Distribution**
   certificate is installed (or *Distribute App* → *Certificate* to fetch it).
2. Open **Keychain Access** → *My Certificates* → select
   `Apple Distribution: <name>` → *Export* → save as `VersyFlowDistribution.p12`
   with a password.
3. Encode it:

```bash
base64 -i VersyFlowDistribution.p12 -o p12.b64   # value for APPLE_CERTIFICATE_P12
```

The password you chose is `APPLE_CERTIFICATE_PASSWORD`.

### 2. Export the App Store provisioning profile

- In App Store Connect (developer.apple.com), under *Certificates, IDs &
  Profiles* → *Profiles*, create / download an **App Store** distribution
  profile for bundle ID `com.versyflow.app` → `*.mobileprovision`.
- Encode it:

```bash
base64 -i VersyFlowAppStore.mobileprovision -o prof.b64   # value for APPLE_PROVISION_PROFILE_BASE64
```

### 3. Get the Team ID

- Xcode → *Accounts* → your team, or
  `security find-identity -v -p codesigning` → the 10-char ID before `(...)` is
  not the Team ID; read it from the `.p12`/profile or from the Apple Developer
  portal (Account → Membership). That 10-char value is `APPLE_TEAM_ID`.

### 4. Set the four secrets in GitHub

Settings → Secrets and variables → Actions → New repository secret (or in the
`production` environment scope):

- `APPLE_CERTIFICATE_P12` = contents of `p12.b64`
- `APPLE_CERTIFICATE_PASSWORD` = the p12 export password
- `APPLE_PROVISION_PROFILE_BASE64` = contents of `prof.b64`
- `APPLE_TEAM_ID` = the 10-char Team ID

> While any of these is missing, `build-ios-release` **skips** (prints a note,
> spends no macOS minutes). Once all four are set, the next `v*` tag produces a
> signed `.ipa` automatically.

> **Bundle ID assumption:** the iOS App ID is `com.versyflow.app` (same as
> Android). If you register a different App ID in App Store Connect, the
> provisioning profile and the `ios/` project's bundle id must match it.

## Quick reference (no values — values stay in GitHub Secrets only)

```bash
# Vite build-time env (rows 1–3)
VITE_SUPABASE_URL=<supabase project URL>
VITE_SUPABASE_ANON_KEY=<anon / publishable key>
VITE_POWERSYNC_URL=<powersync endpoint>

# Android release signing (rows 4–7)
KEYSTORE=<base64 of keystore/release.keystore>
KEYSTORE_PASSWORD=<storepass>
KEY_ALIAS=<alias, e.g. versyflow-release-key>
KEY_PASSWORD=<keypass>

# iOS .ipa signing (rows 8–11) — gate for the iOS job
APPLE_CERTIFICATE_P12=<base64 of distribution .p12>
APPLE_CERTIFICATE_PASSWORD=<p12 export password>
APPLE_PROVISION_PROFILE_BASE64=<base64 of .mobileprovision>
APPLE_TEAM_ID=<10-char Apple Team ID>
```

See `.github/ci-secrets.example.env` for a copy-pasteable (value-free) reference.
