# Cartographie de travail des agents (2026-09-20)

> Snapshot pour coordonner les agents qui travaillent sur ce dépôt en parallèle.
> Généré par audit local (lecture seule) + état git. Il décrit un état
> transitoire : **le rafraîchir avant de s'en servir**.

## État git au 2026-09-20 (18h30)

- `main` == `origin/main` (0/0), HEAD : `8b6ee9b chore: nouveaux types partagés (src/types/)`
- Worktree : **~650 entrées sales** — principalement la charge de travail de l'agent i18n
- Commits récents de l'autre agent (ne pas rejouer/reverter) :
  - `348301c` bible: kujv (Cambridge Paragraph Bible) marqué disponible + VERIFIED_FREE
  - `b81da7c` storage: câblage runtime MMKV (web localStorage fallback + native)
  - `8b6ee9b` chore: nouveaux types partagés (src/types/)
  - `81adfd1` + `9fe7094` retrait + gitignore des artifacts `android/app/.../public`

## Thèmes actuellement pris (agent #2)

| Thème | Fichiers touchés (worktree) |
|---|---|
| **i18n (45 locales, batches A→H)** | `src/i18n/locales/*.ts` (ku, ml, ps, sd, si, am, bn… déjà stagés), `src/i18n/i18next-init.ts`, `src/domains/i18n/config.ts`, `app/settings/languages.tsx` |
| **Bible / registry** | `src/domains/bible/registry.ts`, `app/bible/explorer.tsx`, `tests/unit/bible-registry-repository.test.ts` |
| **Mémorisation / révision / FSRS** | `app/memorization/session.tsx`, `app/review/session.tsx`, `src/services/fsrs-factory.ts` |
| **Storage / settings** | `src/infrastructure/storage/mmkv-storage.ts`, `src/store/settings-store.ts` |
| **Deps** | `package.json` (modifié) |
| **Tooling interne** | `graphify-out/**` (leur tool de graphe) |

## Thèmes libres (zone sûre documentée)

- `docs/**`, `BUILD-GUIDE.md`, `PRODUCTION_CHECKLIST.md`, `README.md`, `LICENSE`, bannières
- Poubelle racine (voir plan anti-gonflement — **en attente de feu vert**, car force-push interdit pendant le travail en parallèle)

## Règles de coordination (consensus 20/09)

1. **Aucun commit/push tant que des changements stagés de l'autre agent existent** — un commit ramènerait leur travail (locales stagées).
2. **Zéro modification CI** (`.github/`, `.npmrc`, ESLint/tsconfig liés à la CI) — décision de l'owner.
3. Pas d'écriture sur les thèmes « pris » ci-dessus ; les audits se font en lecture seule et se livrent en rapport (`docs/coordination/`).
4. Les gros mouvements git (LFS, BFG, force-push) se font **après** que tous les agents sont terminés, avec re-clone collectif.

## P0 CI (garde-à-vous, non exécuté)

La CI `main` est **rouge depuis les pushes bible** : `npm ci` échoue en ERESOLVE
(`@ionic/react-router@7.8.6` peer `react-router@^5` vs `react-router@6.30.6`).
Fix identifié : `.npmrc` avec `legacy-peer-deps=true` (1 ligne) — **en attente du
feu vert owner** (toucherait le comportement de la CI).
L'état lint local (`npm run lint` → 3 111 erreurs de typed-linting sur fichiers
non couverts par les tsconfig `project`) est documenté dans le même P0.
