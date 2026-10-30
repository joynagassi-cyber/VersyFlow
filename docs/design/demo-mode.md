# Mode démo — architecture, garanties et limites

> Chantier du 30 octobre 2026. Ce document décrit **ce qui est réellement
> garanti** par le code, ce qui est mesuré par les tests, et ce qui reste
> simulé volontairement.

## 1. Ce que la démo isole

| Couche | Mécanisme | Fichier |
|---|---|---|
| Repositories (versets, révisions, familles, profils, streaks, télémétrie) | adaptateurs mock derrière les mêmes ports | `src/dev/mock/repositories.ts`, `src/infrastructure/repository/powersync-repositories.ts` |
| Base de démo | `localStorage` isolé, graines déterministes | `src/dev/mock/db.ts`, `src/dev/mock/seed.ts` |
| **Tout le reste du stockage applicatif** | redirection de `localStorage` sous `versyflow:mock-scope:v1:` | `src/dev/mock/storage-scope.ts` |
| Famille « riche » (défis, séances, fil d'activité) | store Zustand persisté → lui aussi redirigé + graine démo | `src/dev/mock/family-room-seed.ts` |
| Réseau | aucun appel Supabase/PowerSync en mode mock (`MockModeGuardError`) ; le collecteur de test local est optionnel et désactivé par défaut | `src/dev/mode.ts`, `src/dev/local-backend.ts` |
| Notifications | non programmées (le service reste inerte en web) | `src/services/notification-service.ts` |

La redirection de stockage est le point clé : elle couvre **aussi** les accès
directs des écrans (`localStorage.getItem('versyflow:profile:name')`,
`versyflow:collections`, historique de recherche, stores Zustand persistés,
apparence, rappels). Rien n'est « masqué » dans l'interface : les écritures
sont physiquement ailleurs.

## 2. Clés de contrôle (jamais redirigées)

- `versyflow:data-mode` — le choix de mode (`mock` / `live`) ;
- `versyflow:demo:started-at`, `versyflow:demo:version` — métadonnées de session.

Sans elles, la démo ne pourrait pas être quittée ni reprise.

## 3. Durée de vie des données de démo

Les données de démo vivent dans le navigateur, sous le préfixe
`versyflow:mock-scope:v1:`, **jusqu'à** :

- « Réinitialiser la démo » (`/dev`, `/settings/data`) → efface le seul espace
  de démo puis re-sème ;
- un nettoyage du stockage du navigateur.

Elles survivent aux rechargements, à la navigation directe (`/family/home`,
`/review/calendar`, …) et à une sortie de démo : sortir, vérifier ses vraies
données, puis revenir (`?data=mock` ou « Voir la démo ») retrouve le même état.

## 4. Entrer et sortir

| Action | Moyen | Effet |
|---|---|---|
| Entrer | `?data=mock`, ou « Voir la démo » dans `/settings/data` | recharge en mode démo |
| Sortir | `?data=live`, bouton « Quitter la démo » | recharge sur les vraies données |
| Revenir au comportement auto | `VITE_DEMO_DEFAULT=off` | mock seulement si aucun projet Supabase |

La démo est le mode **par défaut** pendant ce chantier (`DEMO_IS_DEFAULT` dans
`src/dev/mode.ts`). L'ordre de résolution reste : URL > choix explicite
persisté > `VITE_DATA_MODE` > démo par défaut > auto-détection.

## 5. Ce qui est simulé (et affiché comme tel)

- notifications : aucune planification réelle dans le navigateur ; les deux
  types (révision, mémorisation) restent enregistrés localement ;
- synchronisation : désactivée, rien n'est envoyé ;
- partage familial : aucune invitation réelle n'est émise ;
- exports : les fichiers produits contiennent les données de démo.

Le bandeau « Démo » (pastille dans les deux coques) mène à `/dev`, qui rappelle
ces limites et permet de réinitialiser.

## 6. Limites techniques assumées

- `localStorage.length` / `key(i)` exposent encore l'énumération brute : aucun
  écran ne s'en sert pour lire un contenu utilisateur, et `getItem` est
  redirigé (aucune valeur réelle n'est lisible).
- `sessionStorage` n'est pas redirigé : il ne contient que l'identifiant de
  session du collecteur de test (`versyflow:mock:session-id`).
- IndexedDB / SQLite / PowerSync ne sont pas ouverts en mode mock.
- Les données d'une session mock **antérieure** à l'isolation (clés non
  préfixées) ne sont plus vues par la démo. Elles restent sur le disque du
  navigateur : aucune suppression automatique n'est faite.

## 7. Tests

- `tests/design/demo-isolation.test.ts` — redirection, non-lecture des valeurs
  réelles, `clear()` sans effet sur le réel, rechargement, sortie, reset ;
- `tests/design/demo-family.test.ts` — famille semée, membres nommés, défis et
  séances, aucune fuite hors de l'espace de démo ;
- `tests/design/demo-ui.test.tsx` — pastille, panneau, texte des limites,
  réinitialisation sans perte.
