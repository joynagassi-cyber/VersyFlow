# 35 — Mode « frontend seul » (mock) + collecteur de tests local

> Objectif : pouvoir cliquer dans **toute l'application** sans Supabase, sans
> PowerSync, sans réseau, avec des données réalistes — et récupérer ce qui a
> été fait pendant les tests manuels dans un petit serveur local.

---

## 1. Démarrage rapide

```bash
npm install                # une seule fois

npm run dev:mock           # API de test + Vite en mode mock
#   App          → http://localhost:3000
#   Panneau dev  → http://localhost:3000/dev
#   Collecteur   → http://localhost:4000  (tableau de bord)
```

Autres commandes :

| Commande | Effet |
| --- | --- |
| `npm run dev:mock` | Démarre l'API de test (`:4000`) **et** Vite en mode mock |
| `npm run mock:server` | Démarre seulement l'API de test |
| `npm run dev` | Vite seul — le mode est détecté automatiquement (voir §2) |
| `npm run build:mock` | Build de production en mode mock (`www/`) |
| `npm run preview:mock` | Prévisualise le build mock |

Raccourcis d'URL : `?data=mock` / `?data=live` (le choix est mémorisé).

---

## 2. Comment le mode est choisi

`src/dev/mode.ts` résout `mock | live`, dans cet ordre :

1. `?data=mock|live` dans l'URL (persisté dans `localStorage`),
2. `localStorage['versyflow:data-mode']` (bouton du panneau `/dev`),
3. `VITE_DATA_MODE` (`.env.mock` → `mock`),
4. automatique : **mock** si `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` sont
   absents, **live** sinon.

Le changement de mode recharge la page (les racines de composition sont des
singletons).

---

## 3. Ce qui est découplé

Les écrans, les hooks et les services de domaine n'ont pas changé : ils
consomment toujours les **ports** (`IMemorizationRepository`,
`IAuthService`…). Seules les racines de composition choisissent l'adaptateur.

| Port / service | Live (inchangé) | Mock (nouveau) |
| --- | --- | --- |
| `getAuthService()` (`@/auth`) | `SupabaseAuthService` | `MockAuthService` |
| `getSyncUserIdProvider()` | session Supabase | identité locale stable (`usr_…`) |
| `getMemorizationRepository()` | `MemorizationRepositoryPowerSync` | `MockMemorizationRepository` |
| `getReviewLogRepository()` | `ReviewLogRepositoryPowerSync` | `MockReviewLogRepository` |
| `getLearnerProfileRepository()` | `LearnerProfileRepositoryPowerSync` | `MockLearnerProfileRepository` |
| `getFamilyRepository()` | `FamilyRepositoryPowerSync` | `MockFamilyRepository` |
| `getFamilyInvitationRepository()` | `FamilyInvitationRepositoryPowerSync` | `MockFamilyInvitationRepository` |
| `getStreakRepository()` | `StreakRepositoryPowerSync` | `MockStreakRepository` |
| `getTranslationPreferenceRepository()` | `TranslationPreferenceRepositoryPowerSync` | `MockTranslationPreferenceRepository` |
| `getTelemetryUploadPort()` | `TelemetryEventsRepositoryPowerSync` | `MockTelemetryUploadPort` |
| `syncService` (`@/store/sync-store`) | `PowerSyncSyncService` | `MockSyncService` |
| Base SQLite | `PowerSyncDatabase` | `MockDb` (localStorage) |
| Datasets bibliques distants | Supabase Storage | **bloqués** (offline strict) |

Garde-fou : `getPowerSyncDatabase()` lève `MockModeGuardError` en mode mock —
un import résiduel ne peut donc pas démarrer la pile cloud par accident.

Le seul module qui contient **encore** des imports statiques du SDK est la
racine de composition (`powersync-repositories.ts`) : le code PowerSync est
présent dans le bundle mais **jamais instancié** en mode mock. Les workers
`wa-sqlite` restent en chunks séparés (chargés uniquement en mode live).

---

## 4. Données de test

`src/dev/mock/seed.ts` crée, pour l'identité courante :

- **8 versets LSG** (Jean 3:16, Psaumes 23:1, Philippiens 4:13, Romains 8:28,
  Ésaïe 40:31, Proverbes 3:5-6, Matthieu 11:28, Josué 1:9),
  avec statuts `new` / `in-progress` / `mastered`, des échéances dues,
  en retard et futures, des favoris et des tags ;
- **~25 révisions** (journal FSRS) pour l'écran historique/analytics ;
- **2 profils apprenant** (dont un « famille ») ;
- **1 famille** avec 3 membres et une invitation `VERSY-TEST-2026` ;
- **9 jours de streak** ;
- la **préférence de traduction** (`lsg`) et quelques événements de télémétrie.

Base stockée sous `versyflow:mock:db:v1` (localStorage, un blob JSON) :
snapshot / export / reset sont triviaux et fonctionnent hors ligne.

### Identité

Le mode mock réutilise l'écran d'identification existant (email + nom, sans
mot de passe) et la clé `versyflow:local-identity`. L'identifiant de compte
est dérivé de l'email (`usr_<hash>`) : stable entre les rechargements.

Sans identification, une identité de démonstration est utilisée
(`ami@versyflow.test`). Si vous vous identifiez après avoir exploré la démo,
**les données existantes sont ré-attribuées à votre compte** au lieu d'être
perdues (`reassignMockOwner`).

---

## 5. Collecteur de tests local

Chaque action utile est envoyée à l'API locale :

| Événement | Déclencheur |
| --- | --- |
| `app.boot` | démarrage (mode, counts, URL, user-agent) |
| `nav.visit` | chaque changement de route |
| `auth.identify` / `auth.login` / `auth.logout` | écrans d'identification |
| `mock.write` | toute écriture d'un adaptateur mock (collection, action, id) |
| `review_logs.create` | notation d'une révision (rating inclus) |
| `telemetry.batch` | flush de la télémétrie |
| `sync.mock` / `dev.seed` / `dev.reset` | actions du panneau `/dev` |

Côté client (`src/dev/local-backend.ts`) :

- file persistée dans `localStorage` (`versyflow:mock:outbox:v1`), max 500
  événements, envoi par lots de 100 toutes les 0,5 s / 3 s,
- `navigator.sendBeacon` sur `pagehide` (rien n'est perdu à la fermeture),
- **jamais bloquant** : une API absente laisse simplement la file en attente,
- URL relative `/api` → proxifiée par Vite (donc compatible avec l'aperçu
  HTTPS du bac à sable, où `localhost` n'est pas joignable depuis le navigateur).

Côté serveur (`server/mock-api.mjs`, **zéro dépendance**) :

```
GET  /api/health            état + compteurs
POST /api/events            { events: [...] }
GET  /api/events?limit=&type=&order=
POST /api/snapshot          instantané complet de la base mock
GET  /api/snapshots         liste des instantanés
GET  /api/summary           compteurs pour le tableau de bord
GET  /api/export            export JSON complet (téléchargement)
POST /api/reset             vide tout
GET  /                      tableau de bord (auto-refresh 4 s, filtres)
```

Stockage : `data/mock-backend/events.jsonl` + `data/mock-backend/snapshots/*.json`
(ignoré par Git, redirigeable via `MOCK_DATA_DIR`).

---

## 6. Panneau `/dev`

Accessible sans onboarding (et depuis **Paramètres → Test & Développement** en
mode mock) :

- mode actif + bascule mock ↔ live,
- identité utilisée, résultat du seed au démarrage,
- état de l'API locale (en ligne / hors ligne, file, envoyés, échecs),
  boutons « Vider la file », « Envoyer l'instantané », lien tableau de bord,
- compteurs par collection, « Re-seeder », « Exporter en JSON »,
  « Tout réinitialiser »,
- 12 derniers événements reçus par le serveur,
- « Sauter l'onboarding » (marque l'onboarding comme fait et ouvre l'accueil).

Un instantané complet de la base mock est envoyé automatiquement au serveur
3 s après le démarrage, puis dès que les données changent (au plus une fois
par minute) et à la fermeture de l'onglet.

---

## 7. Repasser sur le vrai backend

1. `.env.local` avec `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `VITE_POWERSYNC_URL` (voir `.env.example`),
2. `npm run dev` (le mode auto basculera en `live`),
   ou `?data=live`, ou le bouton du panneau `/dev`.

Rien d'autre à changer : les adaptateurs PowerSync sont inchangés.

---

## 8. Tests

```bash
npx vitest run tests/unit/mock-mode.test.ts \
               tests/integration/mock-mode-composition.test.ts
```

- `tests/unit/mock-mode.test.ts` — seed, adaptateurs, résolution du mode.
- `tests/integration/mock-mode-composition.test.ts` — chaîne complète
  `getMemorizationService() → repos → MockDb`, profils/famille, garde
  PowerSync, service d'auth mock.

---

## 9. Limites connues

- Les vues sémantiques (`/semantic`) s'affichent **vides** en mode mock :
  leurs tables LOCAL_ONLY vivent dans SQLite/PowerSync, pas dans `MockDb`.
- Les traductions non embarquées (`public/data/bible/lsg.json` est la seule
  fournie) ne peuvent pas être téléchargées en mode mock (offline strict).
- Le mode live reste la seule voie pour tester la synchronisation
  multi-appareils, les RLS et les workers PowerSync.
