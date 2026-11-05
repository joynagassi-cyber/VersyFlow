# Mode démo — état et limites de l'audit

État du lot du 30 octobre 2026 : **isolation globale non validée**. Ne pas
utiliser de données personnelles pour tester. Les contrôles automatiques
ci-dessous ne remplacent pas une vérification de tous les parcours, des accès
directs, des WebViews et des appareils physiques.

## Comportement existant et protections ajoutées

- `src/dev/mode.ts` choisit le mode mock par défaut, sauf choix explicite
  persisté, URL `?data=live` ou configuration prioritaire. La sortie vers les
  données réelles est volontaire et active les services réels configurés.
- Les repositories principaux utilisent des adaptateurs mock et les méthodes
  `getItem`, `setItem`, `removeItem` et `clear` du `localStorage` sont redirigées
  sous `versyflow:mock-scope:v1:`. L'installation précède les imports de
  l'application ; si l'installation échoue, le démarrage en démo est arrêté.
- Les données fictives de cet espace survivent au rechargement et sont effacées
  par la réinitialisation de la démo ou le nettoyage du navigateur. Les clés
  de contrôle de mode restent hors de cet espace. Les anciens mocks non
  préfixés ne sont ni migrés ni supprimés automatiquement.
- Pour éviter de modifier les rappels réels, les services de rappels quotidiens
  et hebdomadaires ne demandent pas de permission et ne consultent, annulent ou
  programment aucune notification native en mode mock. Le planning hebdomadaire
  fictif est enregistré dans le stockage de la démo. Les notifications déjà
  programmées avant l'entrée en démo ne sont pas annulées et peuvent se déclencher.
- Le collecteur de test (`src/dev/local-backend.ts`) est désactivé sans
  dérogation, même avec `VITE_MOCK_API=on` ou une ancienne file d'événements.
- Lors d'un changement explicite via l'interface, l'ancien `?data=` est retiré
  de l'URL et le mode courant reste actif jusqu'au rechargement. Si le stockage
  du choix échoue, le nouveau mode est placé dans l'URL.

## Ce qui reste à vérifier ou à construire

La redirection repose sur des méthodes de `Storage` : l'énumération brute
(`length`, `key`, `Object.keys`) et les accès par propriété ne sont pas isolés.
`sessionStorage` n'est pas redirigé. Les APIs IndexedDB, SQLite, les événements
inter-onglets et d'éventuels accès directs aux SDK ou plugins doivent encore
être audités et testés en conditions réelles. Les garde-fous PowerSync et auth
ne prouvent pas à eux seuls l'absence de tout accès réel sur toutes les routes.

Les scénarios complets famille, statistiques, mémorisation, FSRS, calendrier,
notes, tags, sessions, accès directs et changements de mode n'ont pas tous été
validés dans un vrai navigateur. La cohérence des données entre tous les écrans
reste à établir. Les tests unitaires ne prouvent pas le comportement des plugins
Capacitor ; aucune vérification sur appareil physique n'a été réalisée ici.
Le Web ne programme pas de notifications en arrière-plan.

## Tests de ce lot

- `tests/design/demo-isolation.test.ts` : clés et repositories ciblés dans
  jsdom, réinitialisation et simulation de rechargement / sortie ; ce n'est pas
  un test navigateur des parcours complets.
- `tests/design/demo-fail-closed.test.ts` : échec simulé de l'installation.
- `tests/design/weekly-reminders.test.ts` : plugin natif simulé, y compris
  absence d'appel au plugin en démo ; pas un appareil physique.
- `tests/design/demo-safety-collector.test.ts` : collecteur inactif.
- `tests/design/demo-family.test.ts` et `demo-ui.test.tsx` : adaptateurs,
  graine et rendu isolés ; pas une validation de toutes les interactions.
