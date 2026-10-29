# Inventaire des parcours métier

Généré par `node scripts/journey-inventory.mjs`. Ne pas éditer à la main.

Routes déclarées dans `src/main.tsx` : **94**.
Parcours inventoriés : **16** — actifs **16**, partiels **0**, absents **0**.

| Parcours | Routes | Tests | Données | État |
| --- | --- | --- | --- | --- |
| Démarrage et onboarding | 1 | `tests/api/navigation-api.test.ts`<br>`tests/e2e/onboarding-flow.test.ts` | — | **actif** |
| Authentification | 3 | `tests/api/navigation-api.test.ts`<br>`tests/auth/insforge-auth.test.ts`<br>`tests/e2e/auth-flow.test.ts`<br>+1 | — | **actif** |
| Accueil et navigation | 1 | `tests/api/navigation-api.test.ts`<br>`tests/e2e/navigation-flow.test.ts` | — | **actif** |
| Explorer la Bible | 5 | `tests/api/navigation-api.test.ts`<br>`tests/e2e/bible-flow.test.ts`<br>`tests/unit/bible-app-integration.test.ts`<br>+15 | présentes | **actif** |
| Lire un chapitre | 2 | `tests/api/navigation-api.test.ts`<br>`tests/e2e/bible-flow.test.ts`<br>`tests/unit/bible-app-integration.test.ts`<br>+15 | présentes | **actif** |
| Mémoriser un verset | 4 | `tests/api/navigation-api.test.ts`<br>`tests/e2e/memorization-flow.test.ts`<br>`tests/unit/domains/memorization/comparison-engine.test.ts`<br>+9 | présentes | **actif** |
| Réviser (FSRS) | 5 | `tests/api/navigation-api.test.ts`<br>`tests/e2e/review-flow.test.ts`<br>`tests/integration/review-log-persistence.test.ts`<br>+3 | présentes | **actif** |
| Comparer les traductions | 2 | `tests/api/navigation-api.test.ts`<br>`tests/api/theme-api.test.ts`<br>`tests/design/resolve-theme.test.ts`<br>+7 | présentes | **actif** |
| Mémoire sémantique | 12 | `tests/semantic/align.test.ts`<br>`tests/semantic/communities.test.ts`<br>`tests/semantic/import.test.ts`<br>+6 | présentes | **actif** |
| Collections et succès | 2 | `tests/api/navigation-api.test.ts`<br>`tests/e2e/collections-achievements-flow.test.ts` | — | **actif** |
| Maîtrise et analytique | 2 | `tests/api/navigation-api.test.ts`<br>`tests/api/progress-service-api.test.ts`<br>`tests/e2e/progress-flow.test.ts`<br>+3 | — | **actif** |
| Recherche | 1 | `tests/api/navigation-api.test.ts`<br>`tests/e2e/search-flow.test.ts` | présentes | **actif** |
| Famille et partage | 21 | `tests/unit/domains/family/permissions.test.ts`<br>`tests/unit/domains/family-domain-model.test.ts`<br>`tests/unit/family-create.test.ts`<br>+3 | — | **actif** |
| Profil | 3 | `tests/api/navigation-api.test.ts`<br>`tests/e2e/profile-flow.test.ts`<br>`tests/e2e/profile-isolation.test.ts`<br>+3 | — | **actif** |
| Réglages | 12 | `tests/api/navigation-api.test.ts`<br>`tests/e2e/settings-flow.test.ts` | — | **actif** |
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
