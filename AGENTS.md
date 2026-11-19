# AGENTS.md

<!-- BACKEND:START -->
## Backend — aucun

Ce dépôt est **100 % frontend** : l'application ne fait aucun appel à un backend.
Les données (profils, famille, mémorisation, sémantique, marketplace) vivent en
local derrière les interfaces de `src/infrastructure/repository/ports.ts`, et le
mode de données se choisit via `VITE_DATA_MODE` (`mock` par défaut).

- Mode et repositories : `src/dev/mode.ts`, `src/infrastructure/repository/mode-repositories.ts`.
- Bible : JSON local dans `public/data/bible/` (chargé paresseusement via `src/services/bible-text-service.ts`).
- Aucun secret n'est requis pour lancer, tester ou builder l'application.
<!-- BACKEND:END -->
