# Inventaire des parcours métier

Généré par `node scripts/journey-inventory.mjs`. Ne pas éditer à la main.

Routes déclarées dans `src/main.tsx` : **97**.
Parcours inventoriés : **16** — actifs **16**, partiels **0**, absents **0**.

| Parcours | Routes | Tests | Données | État |
| --- | --- | --- | --- | --- |
| Démarrage et onboarding | 1 | `tests/api/navigation-api.test.ts`<br>`tests/design/onboarding-journey.test.tsx`<br>`tests/design/onboarding-progress.test.ts`<br>+1 | — | **actif** |
| Authentification | 3 | `tests/api/navigation-api.test.ts`<br>`tests/auth/insforge-auth.test.ts`<br>`tests/design/onboarding-journey.test.tsx`<br>+2 | — | **actif** |
| Accueil et navigation | 1 | `tests/api/navigation-api.test.ts`<br>`tests/design/batch-navigation.test.ts`<br>`tests/design/lot-journeys-and-polish.test.ts`<br>+5 | — | **actif** |
| Explorer la Bible | 5 | `tests/api/navigation-api.test.ts`<br>`tests/design/batch-navigation.test.ts`<br>`tests/design/bible-book-names.test.ts`<br>+23 | présentes | **actif** |
| Lire un chapitre | 2 | `tests/api/navigation-api.test.ts`<br>`tests/design/app-shells.test.ts`<br>`tests/design/bible-book-names.test.ts`<br>+22 | présentes | **actif** |
| Mémoriser un verset | 4 | `tests/api/navigation-api.test.ts`<br>`tests/design/app-shells.test.ts`<br>`tests/e2e/memorization-flow.test.ts`<br>+10 | présentes | **actif** |
| Réviser (FSRS) | 5 | `tests/api/navigation-api.test.ts`<br>`tests/design/preview-lab.test.tsx`<br>`tests/design/settings-premium.test.ts`<br>+6 | présentes | **actif** |
| Comparer les traductions | 2 | `tests/api/navigation-api.test.ts`<br>`tests/api/theme-api.test.ts`<br>`tests/design/batch-navigation.test.ts`<br>+12 | présentes | **actif** |
| Mémoire sémantique | 12 | `tests/semantic/align.test.ts`<br>`tests/semantic/communities.test.ts`<br>`tests/semantic/import.test.ts`<br>+6 | présentes | **actif** |
| Collections et succès | 2 | `tests/api/navigation-api.test.ts`<br>`tests/design/settings-premium.test.ts`<br>`tests/e2e/collections-achievements-flow.test.ts` | — | **actif** |
| Maîtrise et analytique | 2 | `tests/api/navigation-api.test.ts`<br>`tests/api/progress-service-api.test.ts`<br>`tests/design/demo-progress.test.ts`<br>+7 | — | **actif** |
| Recherche | 1 | `tests/api/navigation-api.test.ts`<br>`tests/e2e/search-flow.test.ts` | présentes | **actif** |
| Famille et partage | 21 | `tests/design/app-shells.test.ts`<br>`tests/design/demo-family.test.ts`<br>`tests/design/family-demo.test.tsx`<br>+6 | — | **actif** |
| Profil | 3 | `tests/api/navigation-api.test.ts`<br>`tests/design/settings-premium.test.ts`<br>`tests/e2e/profile-flow.test.ts`<br>+4 | — | **actif** |
| Réglages | 12 | `tests/api/navigation-api.test.ts`<br>`tests/design/app-shells.test.ts`<br>`tests/design/lot-journeys-and-polish.test.ts`<br>+2 | — | **actif** |
| Notifications | 1 | `tests/api/navigation-api.test.ts`<br>`tests/e2e/notifications-flow.test.ts` | — | **actif** |

## Ce que chaque état veut dire

- **actif** — la route existe, l’écran est monté, un test cite le parcours.
  Cela ne prouve pas que ce test PASSE dans cet environnement : voir la
  section « échecs assumés » du plan (§7).
- **partiel** — la route existe mais aucun test ne la parcourt : le rendu
  n’est vérifié par rien dans le dépôt.
- **absent** — route ou écran manquant : le parcours n’existe pas.

Les données marquées « absentes du poste » sont des jeux bibliques non
versionnés (`data/`) : l’écran s’affiche, le contenu ne peut pas être vérifié
ici. Ce n’est pas une régression, c’est une limite de l’environnement.
