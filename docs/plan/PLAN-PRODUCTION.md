# Plan de mise en production — VersyFlow

**Rédigé le** : 2026-10-30 · **Base** : `main` @ `7a087ae` · **Horizon** : janvier 2027
**Cibles** : Android (Play) · iOS (App Store) · Windows · macOS

> Ce document remplace les checklists datées d'août/septembre (`PRODUCTION_CHECKLIST.md`,
> `docs/KANBAN_BOARD.md`), qui décrivent encore une pile Expo/InsForge abandonnée.
> Chaque affirmation ci-dessous renvoie à un fichier du dépôt ou à une commande
> exécutée le 30/10/2026.

---

## 1. Résumé exécutif

Le produit est **fonctionnellement complet** (16 parcours actifs, 60/60 écrans
couverts, 1478 tests verts sur 1497) mais **rien n'est livrable en l'état** :

| Blocage | Preuve | Conséquence |
| --- | --- | --- |
| **CI rouge sur `main`** | `gh run view 42374644402` → `Quality Gate — tests: failure` ; en local `19 failed / 1478 passed` | Aucun artefact signé n'est produit : les jobs `Build Web`, `Android`, `iOS`, `Publish` sont tous `skipped` derrière le quality gate |
| **Aucune cible native iOS / desktop** | pas de dossier `ios/` ; aucun paquet Electron/Tauri dans `package.json` | iOS et Windows/macOS ne sont pas commencés |
| **Mode démo par défaut** | `DEMO_IS_DEFAULT = true` (`src/dev/mode.ts`) | Inacceptable pour un store public ; acceptable pour une bêta fermée |

Trois chantiers de fond : **débloquer la chaîne CI** (1 semaine), **brancher le réel**
(3 semaines), **ouvrir les 4 plateformes** (6 semaines, dont 3 pour iOS/desktop).

Dates proposées : **Android en bêta fermée dès le 1ᵉʳ décembre**, **iOS TestFlight
avant Noël**, **Windows/macOS en janvier**, **go-live store en janvier 2027**.

---

## 2. Ce que j'ai vérifié dans le dépôt

| Sujet | Constat mesuré | Fichier / commande |
| --- | --- | --- |
| Qualité | 17 PASS · 1 PARTIEL (C11, 86/87 écrans) · 0 FAIL · 4 non vérifiables | `docs/plan/audit-report.md` |
| Tests | **19 échecs préexistants** dans 7 fichiers, hors périmètre design | `npx vitest run` (30/10) |
| CI/CD | Pipeline complète web → Android debug/release → iOS signé → GitHub Release, **iOS conditionné aux secrets Apple** | `.github/workflows/ci-cd.yml` |
| Android | `versionCode 1`, `versionName 0.1.0`, **`targetSdkVersion 34`** par défaut, signature pilotée par secrets | `android/app/build.gradle`, `android/build.gradle` |
| Permissions Android | `SYSTEM_ALERT_WINDOW`, `READ/WRITE_EXTERNAL_STORAGE` déclarées sans usage identifié | `android/app/src/main/AndroidManifest.xml` |
| Orientation | `screenOrientation="portrait"` figée | même fichier |
| iOS | dossier absent ; job CI prêt mais **exige un Mac** et `APPLE_*` | `.github/secrets-checklist.md` |
| Desktop | **rien** : ni Electron, ni Tauri, ni build Windows/macOS | `package.json` |
| Backend réel | mode `live` = Supabase + PowerSync, modules importés dynamiquement ; **aucun `.env.local` dans le dépôt** | `src/dev/mode.ts`, `.env.example` |
| Migrations | `supabase/migrations` 0000→0008 + `migrations/` (3 fichiers) | dossiers |
| i18n | **45 locales** dans `src/i18n/locales/` | `ls src/i18n/locales |
| Notifications | `@capacitor/local-notifications` (rappels locaux seulement, pas de push) | `package.json` |
| Observabilité | **aucun** Sentry / Crashlytics / analytics | `package.json` |
| Visuels de thèmes | 40 images photo toujours absentes (générateur en 403) | `docs/design/photo-themes.md` §6 |

---

## 3. Décisions à trancher avant d'écrire du code

| # | Décision | Recommandation | Pourquoi |
| --- | --- | --- | --- |
| D1 | **Techno desktop** : Electron ou Tauri | **Electron** (electron-builder) | L'app dépend de `@powersync/web` + worker dédié (`public/worker/powersync-worker.js`) et de WASM/SQLite : Chromium embarqué = même moteur que Android et le web. Tauri s'appuie sur WebView2 (Windows, OK) et **WKWebView** (macOS, moteur Safari) : risque réel sur PowerSync/OPFS, non testé ici. |
| D2 | **Matériel et comptes Apple** | Mac (même loué) + Apple Developer 99 $/an | Sans Mac physique ni certificat, pas d'`.ipa`, pas de TestFlight, pas de notarisation macOS. Le runner `macos-latest` de la CI ne suffit pas : le projet Xcode doit être généré et committé une fois depuis un Mac. |
| D3 | **Signature Windows** | Certificat OV/EV (~250-400 €/an) **ou** assumer l'avertissement SmartScreen | Sans certificat, Windows affiche « éditeur inconnu » à chaque install. |
| D4 | **Mode démo à la sortie store** | Démo **ON pour la bêta fermée**, bascule à **OFF** avant la review Play/App Store (une variable `VITE_DEMO_DEFAULT=off`) | Une app qui démarre sur des données fictives sera refusée ou mal notée ; le bandeau actuel protège en bêta, pas en public. |
| D5 | **Identité de publication** | `com.versyflow.app` conservé partout (Android déjà publié sous cet id) ; à confirmer avant le premier envoi iOS/desktop, un bundle id **ne se change plus** ensuite | `capacitor.config.ts` |

---

## 4. Calendrier proposé

```
Novembre                              Décembre                    Janvier
30/10   10/11        24/11            08/12      22/12            12/01      31/01
  |-------|------------|----------------|----------|----------------|----------|
  M0      M1           M2               M3         M4               M5         M6
cadrage  CI verte     réel +           Android    iOS              Desktop    go-live
+ prépa  + dette      sync             bêta       TestFlight       Win/macOS  + stores
```

| Jalon | Fenêtre | Livrable de fin (vérifiable) |
| --- | --- | --- |
| **M0** Cadrage & prérequis | 30/10 → 06/11 | Comptes (Play Console, Apple, certificat Windows), clés Supabase/PowerSync en secrets GitHub, D1–D5 tranchées |
| **M1** Chaîne verte | 03/11 → 10/11 | `npm test` 100 % vert, CI verte sur `main`, build Android **debug** produit par la CI |
| **M2** Réel branché | 10/11 → 24/11 | Compte réel, sync multi-appareils, migrations + RLS déployées, parcours mémorisation/révision joués sur données réelles |
| **M3** Android bêta | 24/11 → 08/12 | AAB signé sur la piste *internal testing*, fiche store prête, testeurs internes actifs |
| **M4** iOS TestFlight | 08/12 → 22/12 | `.ipa` signé, build TestFlight installable, mêmes parcours vérifiés sur iPhone |
| **M5** Desktop | 22/12 → 12/01 | Installeurs Windows (`.exe`/MSI) et macOS (`.dmg` notarié) signés, auto-update |
| **M6** Go-live | 12/01 → 31/01 | Démo OFF, fiches publiées, review Play + App Store passée, support et rollback prêts |

⚠️ **Capacité réduite du 22/12 au 2/01** : je compte 5 jours ouvrés utiles sur cette
fenêtre, pas 8. Si les fêtes sont chargées, décaler M5 de 5 jours et garder le go-live.

---

## 5. Backlog détaillé

Charges en jours-homme, hors revue de store (délais externes : Play 1-3 j, App Store 1-2 j,
parfois 7 j).

### Lot A — Débloquer la chaîne (M1, ~4 j)

| ID | Tâche | Preuve de fin | Charge |
| --- | --- | --- | --- |
| A1 | Trier les 19 échecs : corriger ce qui est un vrai bug, `skipIf` documenté pour ce qui dépend de l'environnement (WASM, jeux bibliques absents, Supabase non configuré) | `npx vitest run` → 0 échec, chaque `skip` justifié en commentaire | 1,5 j |
| A2 | Rendre la CI verte sur `main` (quality gate + build Android debug) | Run GitHub vert, APK debug en artefact | 0,5 j |
| A3 | Ajouter `npm run verify` + `themes:photos:check` au quality gate | Workflow mis à jour, run vert | 0,5 j |
| A4 | Passer `targetSdk` à 35 (ou 36 si la Play Console l'exige en janvier) et vérifier `minSdk` | Build release OK, avertissement Play disparu | 1 j |
| A5 | Nettoyer le manifeste : retirer `SYSTEM_ALERT_WINDOW` et les permissions de stockage si inutilisées | Manifeste réduit, app fonctionnelle | 0,5 j |

### Lot B — Backend réel et synchronisation (M2, ~9 j)

| ID | Tâche | Preuve de fin | Charge |
| --- | --- | --- | --- |
| B1 | Renseigner les secrets (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_POWERSYNC_URL`) et un `.env.local` local | `?data=live` charge le vrai backend | 0,5 j |
| B2 | Appliquer les migrations sur le projet Supabase de production + vérifier les RLS table par table | Script de vérification : chaque table protégée, test « utilisateur A ne lit pas B » | 2 j |
| B3 | Déployer PowerSync (sync rules, streams) et valider la réplication | Deux appareils, une écriture, propagation < 5 s | 1,5 j |
| B4 | Auth réelle : inscription, connexion, déconnexion, réinitialisation, session expirée | Parcours auth joué sur données réelles + `auth-integration` vert | 1,5 j |
| B5 | Famille / partage multi-comptes sur le réel (aujourd'hui prouvé en mock) | Invitation, rôle, lecture croisée entre 2 comptes réels | 2 j |
| B6 | Mode démo : bandeau, sortie, réinitialisation — revérifiés avec le backend réel branché | Tests `demo-isolation` + essai manuel : aucune fuite vers les vraies données | 1 j |
| B7 | Sauvegarde / restauration du projet Supabase (plan de reprise) | Restauration testée sur un projet jetable | 0,5 j |

### Lot C — Android bêta puis store (M3, ~5 j)

| ID | Tâche | Preuve de fin | Charge |
| --- | --- | --- | --- |
| C1 | Générer le keystore de release, le stocker en secrets, produire un AAB signé | `gh release` avec `.aab`, signature vérifiée | 1 j |
| C2 | Icône adaptative, écran de démarrage, captures 8 téléphones + tablette, description FR/EN | Fiche Play complète | 1 j |
| C3 | Politique de confidentialité + formulaire *Data safety* (données stockées, pas de tiers) | Fiche conforme, aucun item « ne sait pas » | 1 j |
| C4 | Débloquer l'orientation pour tablettes si le responsive 768/1280 tient | Test sur tablette réelle | 0,5 j |
| C5 | Piste *internal testing* → bêta fermée (20 testeurs), collecte de retours | Build installé par les testeurs | 1 j |
| C6 | Vérifier les notifications locales (rappel quotidien) sur Android 13+ | Rappel reçu, permission demandée au bon moment | 0,5 j |

### Lot D — iOS (M4, ~6 j, dont dépendances externes)

| ID | Tâche | Preuve de fin | Charge |
| --- | --- | --- | --- |
| D1 | Compte Apple Developer + App ID + certificats (prérequis M0, délai variable) | Accès App Store Connect | 0,5 j (admin) |
| D2 | `npx cap add ios` depuis un Mac, commit du projet Xcode, premiers builds | `ios/` dans le dépôt, build simulateur OK | 1,5 j |
| D3 | Adapter les plugins : SQLite/PowerSync en WKWebView, SplashScreen, StatusBar, clavier | Parcours mémorisation complet sur iPhone réel | 2 j |
| D4 | Signature CI (`APPLE_*`), `.ipa` sur TestFlight | Build TestFlight installable | 1 j |
| D5 | Fiche App Store : captures 6,7"/6,1", confidentialité, *age rating* | Fiche prête à soumettre | 1 j |

### Lot E — Desktop Windows + macOS (M5, ~8 j)

| ID | Tâche | Preuve de fin | Charge |
| --- | --- | --- | --- |
| E1 | Coque Electron (main + preload sécurisés, protocole `app://` pour `www/`) | App démarre sur Windows et macOS | 1,5 j |
| E2 | Vérifier PowerSync/SQLite/worker dans Electron, sinon bascule vers `@powersync/op-sqlite` côté natif | Sync fonctionnelle dans les deux OS | 2 j |
| E3 | Menu natif, raccourcis, ouverture de liens externes, mode hors-ligne | Revue manuelle | 1 j |
| E4 | Packaging : NSIS + MSI (Windows), DMG universal (macOS), icônes | Installeurs produits par la CI | 1,5 j |
| E5 | Signature Windows + notarisation macOS (D3) | « Éditeur vérifié », Gatekeeper silencieux | 1 j |
| E6 | Auto-update (electron-updater) + manifeste de release | Mise à jour d'une v1 vers v2 constatée | 1 j |

### Lot F — Durcissement et go-live (M6, ~6 j)

| ID | Tâche | Preuve de fin | Charge |
| --- | --- | --- | --- |
| F1 | Bascule démo OFF + parcours de première ouverture sur données réelles | `VITE_DEMO_DEFAULT=off` en prod, démo accessible seulement via `/dev` | 0,5 j |
| F2 | Vérifications navigateur U01–U04 (390/768/1024/1440, débordements, verre, parcours réels) | Captures + rapport rempli | 1,5 j |
| F3 | Observabilité minimale : rapport de crash (Sentry ou équivalent), respect du consentement | Crash de test remonté, opt-in respecté | 1 j |
| F4 | Accessibilité finale : C11 (87ᵉ écran), lecteur d'écran sur les 4 plateformes | Audit + captures | 1 j |
| F5 | Perf : démarrage < 3 s, mémoire < 300 Mo, taille AAB/installeurs | Mesures consignées | 1 j |
| F6 | Runbook : release, rollback, incident, support | Document signé | 1 j |

### Lot G — Contenus et dettes (parallèle, ~3 j)

| ID | Tâche | Preuve de fin | Charge |
| --- | --- | --- | --- |
| G1 | 40 images de thèmes photo (bloqué par le générateur) | `npm run themes:photos` + tests design verts | 0 (si images) |
| G2 | Relecture des 45 locales : au moins FR/EN/ES au niveau natif, les autres en repli assumé | Échantillon relu, repli FR documenté | 2 j |
| G3 | Deux écrans en `PARTIAL` (C11) + dette de lint gelée | `verify` à 18 PASS | 1 j |

**Total** : ~41 jours-homme. Sur 13 semaines, cela suppose **3,5 jours utiles par
semaine** de ma part, ou une répartition avec toi sur les tâches d'administration
(comptes, captures, fiches store ≈ 5 j).

---

## 6. Risques

| Risque | Impact | Parade |
| --- | --- | --- |
| Pas de Mac disponible | iOS et macOS bloqués, M4/M5 tombent | Trancher en M0 : Mac d'occasion, Mac mini, ou Mac en location cloud (MacStadium) — prévoir 2-3 j de délai |
| Review Play/App Store refusée | Retard 1-2 semaines | Soumettre Android en interne dès M3, iOS en TestFlight dès M4 : les refus se découvrent tôt |
| PowerSync dans Electron/WKWebView | Desktop retardé | D1 tranchée pour Electron (Chromium) ; test E2 dès le 2ᵉ jour de M5, avant tout le packaging |
| Démo par défaut oubliée en prod | Rejet store, confusion utilisateur | F1 est une tâche bloquante avec test automatisé sur le build de prod |
| 40 images indisponibles | Thèmes photo absents (non bloquant produit) | Lot G1 ; à défaut, livrer sans et l'annoncer |
| 45 locales non relues | Textes bancals sur les stores | Limiter la vente aux langues relues, repli FR assumé |
| Congés de fin d'année | M5 glisse | Marge de 5 jours déjà intégrée ; M6 reste dans janvier |

---

## 7. Definition of Done par plateforme

**Commun** : CI verte · aucun test ignoré sans justification · build reproductible
depuis un tag `v*` · version et `versionCode` incrémentés · politique de confidentialité
publiée · données locales chiffrées ou documentées · démo accessible mais non par défaut.

| Plateforme | Critère de sortie |
| --- | --- |
| **Android** | AAB signé accepté par Play, `targetSdk` conforme, 0 permission injustifiée, testeurs bêta sur 2 semaines, crash-free > 99 % |
| **iOS** | `.ipa` TestFlight, parcours complet sur appareil physique, pas de `UIWebView`, fiche complète |
| **Windows** | Installeur signé, SmartScreen silencieux, sync vérifiée, auto-update testée |
| **macOS** | DMG universal notarié, Gatekeeper silencieux (Intel + Apple Silicon), sync vérifiée |

---

## 8. Répartition

**Moi (agent)** : lots A, B (sauf accès projet), C1-C3/C6, D2-D5, E1-E4/E6, F1-F6, G3.
**Toi** : comptes et secrets (Play Console, Apple, certificat Windows, clés Supabase),
D3 (signature Windows), captures d'écran finales, décisions D1–D5, et la disponibilité
d'un Mac.

---

## 9. Prochaine action

Si tu valides ce plan : je démarre le **lot A** (M1) immédiatement sur cette branche —
A1 (les 19 tests) puis A3, pour que la CI repasse au vert, et je te livre un run GitHub
vert avant le 10 novembre.
