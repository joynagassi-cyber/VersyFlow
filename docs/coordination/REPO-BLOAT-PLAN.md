# Plan anti-gonflement du dépôt (mis au chaud — NON exécuté)

> Date : 2026-09-20. Statut : **en attente de feu vert owner + tous les
> agents terminés** (certains steps impliquent force-push / re-clone).

## Constats (mesurés le 20/09)

| Mesure | Valeur |
|---|---|
| `.git/` | **0,6 Go** |
| `data/bible/` tracké | **4 457 fichiers / 711 Mo** (36 JSON top-level + arborescences par livre) |
| Historique | 18+ lots « bible: lot X/Y » + v5/v7 pushes |
| `android/app/src/main/assets` | ✅ déjà dé-tracké + ignoré (commits `81adfd1` / `9fe7094`) |
| Poubelle racine trackée | `VersyFlow.fig` (930 Ko), `plugin.zip`, `package.json.bak`, `sh.exe.stackdump`, `setup.js`, `test.js`, `FINAL_REPORT*.md`, `diagram-etat-projet.html`, `graphify-out/` (cache churné par un agent — **à traiter après** son passage) |

## Option A — Git LFS (progressif, sans force-push)

```bash
git lfs install
git lfs track "data/bible/**/*.json"
git add .gitattributes data/bible
git commit -m "chore: data/bible sous Git LFS"
git lfs push origin main
```

- ✅ Historique intact, clones futurs légers (les gros fichiers ne sont plus dans le git classique)
- ⚠️ Nécessite `git lfs pull` sur chaque machine + sur la CI (`actions: git-lfs` sur les jobs qui le faut)
- ⚠️ Ne réduit pas le 0,6 Go déjà dans l'historique (clone initial toujours lourd)

## Option B — Dé-tracking local (le plus simple, recommandé d'abord)

Raison : `data/bible` est **distribué à l'app via Supabase Storage**
(bucket `bible-datasets`, commit `8757f2e` : téléchargement à la demande).
L'app et la CI n'ont pas besoin des JSON dans le repo ; seuls les scripts de
build/deploy (`scripts/bible/*`, `npm run bible:deploy`) les veulent en local.

```bash
git rm -r --cached data/bible
echo "data/bible/" >> .gitignore
git commit -m "chore: dé-track data/bible (source de vérité = Supabase Storage)"
```

- ✅ Zéro force-push, zéro re-clone, dépôt immédiatement plus lisible
- ✅ Conserve les fichiers sur disque local (chaque dev garde son `data/bible/`)
- ⚠️ Le 0,6 Go d'historique reste ; les clones complets restent lourds (→ Option C)
- ⚠️ Prendre une **backup locale** de `data/bible/` (ou vérifier le bucket Storage) avant,
  car le contenu ne sera plus protégé par git

## Option C — Allègement de l'historique (force-push, dernier recours)

```bash
# Après A ou B, si le clone reste > 300 Mo :
npx @gitfilter/git-filter-repo --path data/bible --invert-paths
# ou BFG : java -jar bfg.jar --strip-blobs-bigger-than 50M
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force origin main   # + notification à tout le monde pour RE-CLONER
```

- ⚠️ **Interdit pendant que d'autres agents/clones travaillent sur ce repo**
  (leur état local serait invalidé) — à faire quand tous les agents sont en veille

## Poubelle racine (indépendant des options A/B/C)

```bash
git rm --cached VersyFlow.fig plugin.zip package.json.bak sh.exe.stackdump setup.js test.js \
  FINAL_REPORT.md FINAL_REPORT_COMPLETE.md diagram-etat-projet.html DATABASE_SETUP_REPORT.md
git rm -r --cached graphify-out   # APRÈS que l'agent qui l'utilise ait fini
# garder les rapports en docs/legacy si utile : git mv avant rm
```

Ajouts `.gitignore` correspondants : `*.tsbuildinfo`, `plugin.zip`, `*.bak`,
`sh.exe.stackdump`, `graphify-out/`.

## Ordre de passage recommandé

1. Poubelle racine (hors `graphify-out/`) — 1 commit, zéro risque
2. Option B (dé-track `data/bible`) — 1 commit, vérifier d'abord que le bucket
   `bible-datasets` est à jour (`npm run bible:deploy` en dry-run si possible)
3. Option A seulement si on veut **versionner** les datasets dans git à l'avenir
4. Option C seulement si le poids des clones reste un problème après B
