# VersyFlow — Guide de Build Production

> **Mise à jour CI/CD (sept. 2026)** : le pipeline unique
> `.github/workflows/ci-cd.yml` remplace les anciens workflows legacy
> (`build.yml`, `build-apk.yml`, `build-apk-simple.yml`, `ci.yml`,
> `deploy.yml`, `claude-code.yml` — tous supprimés).
>
> **Plus aucun mot de passe de keystore n'est codé en dur dans ce guide.**
> Toutes les identités de signature transitent par des **GitHub Secrets** —
> voir `.github/secrets-checklist.md` (détail) et
> `.github/ci-secrets.example.env` (modèle sans valeurs).

---

## 1. Pipeline (`.github/workflows/ci-cd.yml`)

```
quality-gate (matrice parallèle : typecheck / lint / tests)
   ↓
build-web  (tsc -b + vite build → www/, artifact "web-build-www")
   ↓
   ├─ build-android          (APK debug, aucun secret requis)
   └─ build-android-release  (APK signé, secrets KEYSTORE*, environment: production)
```

| Déclencheur | Qui s'exécute |
|---|---|
| `push` sur `main` / `develop` + PR vers `main` | quality-gate → build-web → **build-android (debug)** |
| `push` sur `main` | + **build-android-release (signé)** |
| `workflow_dispatch` (manuel) | Entrées optionnelles : `build_release` (booléen), `version` (libellé ajouté aux noms d'artefacts APK) |

Chaque job Android : `npm ci` (le `postinstall` exécute
`scripts/patch-powersync-worker.cjs`, idempotent) → téléchargement de
`web-build-www` dans `./www` → `npx cap sync android` → `./gradlew` (JDK 17
Temurin + Android SDK via `android-actions/setup-android@v3`).

Les variables Vite (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
`VITE_POWERSYNC_URL`) sont injectées au niveau du workflow depuis des secrets.
Sur PR, elles sont vides (config placeholder sûre) ; sur `main`, les vraies
valeurs.

---

## 2. Secrets requis (à créer dans GitHub, JAMAIS dans le repo)

Liste complète avec les étapes de création : **`.github/secrets-checklist.md`**.
Modèle de référence sans valeurs : **`.github/ci-secrets.example.env`**.

| Secret | Job | Note |
|---|---|---|
| `VITE_SUPABASE_URL` | build-web | existe déjà — vérifier qu'elle correspond à `.env.local` |
| `VITE_SUPABASE_ANON_KEY` | build-web | existe déjà — clé **anon/publishable** uniquement, jamais la service role |
| `VITE_POWERSYNC_URL` | build-web | **manquante** — copier la valeur de `.env.local` |
| `KEYSTORE` | build-android-release | base64 de `keystore/release.keystore` |
| `KEYSTORE_PASSWORD` | build-android-release | mot de passe du store (`keytool -storepass`) |
| `KEY_ALIAS` | build-android-release | alias de la clé (convention : `versyflow-release-key`) |
| `KEY_PASSWORD` | build-android-release | mot de passe de la clé (`keytool -keypass`) |

> ⚠️ **Le mot de passe `VersyFlow2024!` référencé dans l'ancienne version de ce
> guide est déprécié.** Régénérez le keystore avec un mot de passe fort et
> recréez les 4 secrets correspondants. Un nouveau keystore change l'identité
> de l'application sur Google Play (les mises à jour in-place sont brisées) —
> ne régénérez que si vous avez perdu l'original, et conservez l'ancien pour
> une migration d'identité.

---

## 3. Keystore de signature (jamais commité)

- **Emplacement local** : `keystore/release.keystore` (ignoré par git —
  `keystore/`, `*.keystore`, `*.jks` dans `.gitignore` ; vérifier avec
  `git check-ignore keystore/release.keystore`).
- **Le debug keystore** `android/app/debug.keystore` reste suivi dans git
  (défaut standard Android, sans secret).
- Génération (une fois) :
  ```bash
  keytool -genkeypair \
    -keystore keystore/release.keystore \
    -alias versyflow-release-key \
    -keyalg RSA -keysize 4096 -validity 10000 \
    -storetype PKCS12 \
    -storepass <MOT_DE_PASSE_FORT> \
    -keypass <MOT_DE_PASSE_FORT>
  ```
- Encodage pour le secret `KEYSTORE` :
  ```bash
  # Git Bash / Linux / macOS
  base64 -w0 keystore/release.keystore
  # PowerShell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes('keystore\release.keystore'))
  ```

**Ce que fait le job release** (`build-android-release`) :

1. Vérification fail-fast : `test -n` sur les 4 secrets keystore avec message
   `::error::` explicite (échec avant le build).
2. `echo "$KEYSTORE" | base64 -d > keystore/release.keystore`
3. Ajout de `RELEASE_STORE_FILE=../../keystore/release.keystore` +
   `RELEASE_STORE_PASSWORD` / `RELEASE_KEY_ALIAS` / `RELEASE_KEY_PASSWORD` à
   `android/gradle.properties` (jetable sur le runner, jamais commité).
4. `./gradlew assembleRelease` — `android/app/build.gradle` définit
   `signingConfigs.release` qui lit ces propriétés via `findProperty()`.
5. **Vérification de signature** : `keytool -printcert -jarfile
   app-release.apk` — le job échoue si l'APK est signée par le certificat
   **Android Debug** (repli silencieux sur le debug keystore = secrets pas
   appliqués).

**Sauvegarde hors ligne** : keystore + 4 valeurs (alias, storepass, keypass,
base64) dans un gestionnaire de mots de passe chiffré ou disque hors ligne.
Perdre le keystore rend impossible toute mise à jour sous la même identité
Play.

---

## 4. Workflow manuel (onglet Actions → "CI/CD — Web + Android" → Run workflow)

- `build_release: false` (défaut) → APK **debug** téléchargeable (artefact
  `versyflow-debug-*.apk`, rétention 14 j).
- `build_release: true` → APK **signé release** (artefact
  `versyflow-release-*.apk`, rétention 30 j) — nécessite les 4 secrets
  keystore + déverrouillage de l'environnement `production`.
- `version` (libellé libre) → préfixe ajouté au nom de l'artefact APK
  (défaut : `dev` / `release`).

---

## 5. Configuration locale

### SDK Android (machine locale uniquement — CI s'occupe d'elle-même)

La CI installe le JDK 17 (Temurin) et l'Android SDK via GitHub Actions ;
localement, via Android Studio (recommandé) ou cmdline-tools :

```bash
# Via Android Studio : SDK Manager → Build-Tools 35.0.0, Platform 35,
# Command-line Tools. Définir ANDROID_HOME (ex. C:\Users\joyda\AppData\Local\Android\Sdk)

# Ou sans Android Studio :
export ANDROID_HOME=~/Android/sdk
sdkmanager --licenses
sdkmanager "build-tools;35.0.0" "platforms;android-35" "platform-tools"
```

### `.env.local` (déjà présent — ne pas committer)

```bash
VITE_SUPABASE_URL=https://<votre-projet>.supabase.co
VITE_SUPABASE_ANON_KEY=<clé anon/publishable Supabase>
VITE_POWERSYNC_URL=https://<votre-projet>.powersync.supabase.co
```

### Builds locaux

```bash
npm start                        # dev (Vite)
npx cap run android          # APK debug local (Capacitor)
npm run typecheck && npm run lint # portes qualité (reprennent les gates CI)
npm test                         # Vitest
npm run build                    # build web production (→ www/, utilisé par la CI)
npx cap sync android             # copie www/ dans android/assets/www
```

---

## 6. Structure des fichiers

```
VersyFlow/
├── .github/
│   ├── workflows/
│   │   └── ci-cd.yml               # Pipeline unique (remplace les anciens workflows legacy)
│   ├── secrets-checklist.md        # Documentation complète des secrets
│   └── ci-secrets.example.env      # Modèles de secrets (placeholders, commitable)
├── keystore/
│   └── release.keystore            # ⚠️ git-ignored — jamais commité (secret KEYSTORE)
├── android/
│   ├── gradle.properties           # Le job CI y ajoute les props RELEASE_* (jetable)
│   └── app/
│       ├── build.gradle            # signingConfigs.release via findProperty('RELEASE_*')
│       └── debug.keystore          # Suivi dans git (défaut standard, sans secret)
└── www/                            # ⚠️ git-ignored — artefact Vite (sortie de `npm run build`)
```

---

## 7. Environnement GitHub `production`

`build-android-release` déclare `environment: production`.
Créer une fois : Settings → Environments → New environment → nom `production`.
Option : restreindre qui peut y déployer. Les secrets keystore peuvent
être portés en scope environnement pour que la signature release exige le
déverrouillage de cet environnement.

---

## Notes importantes

1. **Le keystore est UNIQUE** — perdez-le et plus aucune mise à jour sous la
   même identité Play. Sauvegarde chiffrée hors ligne obligatoire.
2. **Aucun secret dans le YAML** — `ci-cd.yml` ne référence que
   `${{ secrets.XXX }}` ; aucune valeur réelle n'est dans le repo.
3. **Service role jamais dans la CI** — `SUPABASE_SECRET_KEY` est réservée aux
   migrations manuelles (`supabase db push`) ; ne jamais l'injecter dans les
   jobs de build.
4. **Vérification de signature en CI** — le job release échoue si l'APK est
   signée par le debug keystore (détection de repli silencieux).

## État actuel

| Élément | Statut |
|---------|--------|
| Pipeline unifié `ci-cd.yml` | ✅ En place (quality-gate → build-web → android ×2) |
| Workflows legacy (7) | ✅ Supprimés |
| `signingConfigs.release` dans `android/app/build.gradle` | ✅ Via `findProperty('RELEASE_*')` |
| `www/` et `keystore/` git-ignorés | ✅ (artefacts build / secrets) |
| Documentation des secrets | ✅ `.github/secrets-checklist.md` + `ci-secrets.example.env` |
| Secrets à créer (7 requis au total) | ⚠️ reste à créer : `VITE_POWERSYNC_URL` + les 4 secrets keystore (`KEYSTORE`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`) — `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` existent déjà — voir checklist |
