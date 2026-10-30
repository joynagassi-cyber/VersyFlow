# Contrat n°3 — thème par défaut + intégration des thèmes demandés

Statut : **livré et mesuré**. Les commandes de vérification sont en fin de
document ; chaque affirmation de ce fichier peut être rejouée.

---

## 1. Ce qui a été demandé, et où c'est appliqué

| Demande | État | Où le vérifier |
| --- | --- | --- |
| Thème par défaut = tweakcn `cmvukmb1k000004iifp7x5wji` | fait | `src/styles/vendored-themes.css` (bloc `lara-red`), `src/theme/resolve-theme.ts` (`DEFAULT_PRESET_ID`) |
| Typographie du défaut : Inter / Noto Serif Georgian / JetBrains Mono | fait, polices réellement chargées | `src/styles/vendored-themes.css` (`--font-sans/serif/mono`), `src/main.tsx` (`@fontsource/*`) |
| `radius 0.5rem`, `tracking 0em`, ombres `0 1px 4px` / opacité 0.1 | fait | `--radius`, `--tracking-normal`, `--shadow-preset-sm` du bloc `lara-red` |
| Primaire `oklch(0.6370 0.2370 25.3310)` conservée | fait (aucune retouche de teinte) | `--primary: #fb2c36` (= oklch 0.6370 0.2370 25.3310, test dédié) |
| Intégration des thèmes fournis dans le sélecteur d'apparence | 14 thèmes intégrés (voir §3) | `src/theme/preset-catalog.ts`, écran `app/settings/appearance.tsx` |
| Ne pas casser l'existant (25 presets, design system unique) | fait | `npm run verify` → C02/C16 PASS, 25 presets historiques inchangés |

## 2. D'où viennent les valeurs (aucune couleur inventée)

Les thèmes demandés ne sont pas dans le dépôt GitHub de tweakcn
(`utils/theme-presets.ts`) : ce sont des thèmes enregistrés, servis par le
registre officiel `https://tweakcn.com/r/themes/<id>` au format
`registry:style` de shadcn.

- `curl` vers `tweakcn.com` est **bloqué** depuis l'environnement de
  développement (SSL_ERROR_SYSCALL) ; le registre a donc été lu via l'outil de
  lecture web, puis les **payloads JSON ont été figés verbatim** dans
  `scripts/data/vendored-themes.json`, avec l'URL d'origine par thème.
- Plus aucun accès réseau n'est nécessaire pour régénérer : la source est
  versionnée et chaque valeur est traçable jusqu'à son URL.

## 3. Les 14 thèmes intégrés

| id | Nom (registre) | Source | Rayon | Échelle de rayons | Mode |
| --- | --- | --- | --- | --- | --- |
| `lara-red` **(défaut)** | rose-Versyflow | `cmvukmb1k000004iifp7x5wji` | 0.5rem | 1 | clair + sombre |
| `lara` | Lara | `cmm2769u2000004jobride6q4` | 0.5rem | 1 | clair + sombre |
| `emerald` | Emerald | `cmli3sqr4000004le5a0y0d9f` | 1.875rem | 3.75 | clair + sombre |
| `blue-enterprise` | enterprise blue | `cmoywv3xi000004joegevhg1g` | 1.4rem | 2.8 | clair + sombre |
| `neutral-minimal` | Minimal Neutral | `cmho4nr9l000h04l1gu419ckw` | 1rem | 2 | clair + sombre |
| `deep-purple` | Deep Purple | `cmlh0x713000104jrgmds6vcd` | 1rem | 2 | clair + sombre |
| `orange-autoblog` | autoblog | `cmhxosuz5000804l7gqzefqxg` | 1.4rem | 2.8 | clair + sombre |
| `cyan-future-teal` | Future Teal | `cmnl3tsn3000204l3ff39foko` | 0.5rem | 1 | clair + sombre |
| `neon-pink-black` | Black and pink | `cmh70ioup000104jr60yx9c30` | 0.5rem | 1 | **sombre uniquement** |
| `dark-green` | hex | `cmninq0c3000604l25wvb3xgh` | 0.25rem | 0.5 | **sombre uniquement** |
| `violet-amber` | gypsy | `cmog0awkr000004lg13pkhovw` | 0.3rem | 0.6 | clair + sombre |
| `cream-space` | SpaceLinear | `cmm4y9w3o000004l79sky7cqm` | 0.5rem | 1 | clair + sombre |
| `sand-lifeos` | LifeOS-V1 | `cmnxpdhkt000004l49lq9b07w` | 1.25rem | 2.5 | clair + sombre |
| `yellow-sun` | Yellow | `cmn7c96e2000104l88vcy27jo` | 0.5rem | 1 | clair + sombre |

### Trois cas particuliers, traités explicitement

1. **Thèmes conçus pour le sombre** (`neon-pink-black`, `dark-green`) : chez
   tweakcn, `:root` et `.dark` portent les mêmes valeurs (fond noir pur). Les
   deux blocs sont donc générés à l'identique et le thème reste utilisable en
   mode clair sans devenir illisible. Un test vérifie l'égalité des couleurs.
2. **Rayons non standard** (0.25rem à 1.875rem) : plutôt que d'écraser le
   design system, le générateur expose `--radius-scale = rayon / 0.5rem` et
   `tailwind.config.js` multiplie les rayons existants par cette échelle
   (`calc(16px * var(--radius-scale, 1))`). Conséquence mesurable : pour le
   thème par défaut, `--radius-scale: 1`, donc **aucun pixel ne change** par
   rapport à l'état antérieur ; Emerald arrondit l'interface 3,75 ×.
3. **Écarts entre l'annonce et le registre** : le thème Orange a été annoncé
   avec `--spacing: 0.27rem` ; le registre officiel sert `0.25rem`. La valeur
   **du registre** est appliquée (le dépôt/la source gagne sur l'annonce), et
   elle est conservée telle quelle dans `--spacing-preset`.

## 4. Accessibilité : la teinte officielle est conservée, le texte s'adapte

Huit blocs sur vingt-huit avaient, d'origine, un texte posé sur l'accent sous
le seuil AA 4,5:1 (ex. primaire du thème par défaut : 3,65:1 avec texte clair).

Règle appliquée (et **jugée sur pièce** dans `docs/design/vendored-theme-contrast.md`) :

1. la **teinte de l'accent n'est jamais déplacée** — c'est la valeur demandée ;
2. le **texte** posé dessus bascule en noir ou blanc, au meilleur ratio ;
3. en dernier recours seulement, la luminosité de la surface est ajustée
   (même code que `scripts/apply-preset-contrast.mjs`, importé).

Conséquence visible sur le thème par défaut : la primaire reste exactement
`#fb2c36`, le texte des boutons d'accent passe au noir (≈ 5,6:1 au lieu de
3,65:1). 48 corrections sont documentées, aucune silencieuse.

## 5. Ce qui n'est **pas** intégré, et pourquoi

| Élément demandé | État | Raison |
| --- | --- | --- |
| n°16 — « échelles seules » `--base-50…1000`, `--primary-50…1000`, `--secondary-50…1000` | **non intégré** | Aucun identifiant, aucune URL, et aucun jeton sémantique (`--background`, `--primary`…) : le modèle `[data-preset]` de VersyFlow ne peut pas l'activer sans inventer les correspondances. Le bloc CSS n'était présent que dans la conversation (perdu à la compaction). **Renvoyer le bloc suffit** pour l'ajouter. |
| n°17 — `npx shadcn@latest apply --preset bKsI1x32 --only theme` | **non intégré** | Le CLI shadcn ne peut pas tourner (réseau limité à npm/GitHub/PyPI) et l'identifiant `bKsI1x32` renvoie 404 sur les URL de registre publiques testées (`/r/themes/`, `/r/styles/`, `/r/presets/`, `/api/presets/`). Les seuls éléments connus (rouge, radius 0.875rem, `--border` en alpha, pas de `--destructive-foreground`) ne permettent pas de reconstituer 32 jetons sans invention. **Coller la sortie du CLI** suffit. |
| n°18 | **absent** | Titre fourni sans contenu. |

Signalement : l'exclusion « cyberpunk / néon / glow » d'un contrat antérieur
entre en tension avec la demande explicite des thèmes `neon-pink-black` et
`dark-green`. La demande la plus récente a été suivie, avec deux garde-fous :
mode sombre uniquement par construction, et texte porté au seuil AA.

## 6. Pipeline et preuves

```bash
# 1. (re)génère CSS + métadonnées + rapport de contraste depuis la source figée
node scripts/import-vendored-themes.mjs          # --check : sort en 1 si écart

# 2. contrôles
npx tsc -p tsconfig.app.json --noEmit
npx eslint app src/components src/hooks src/store src/theme tests/design --ext .ts,.tsx
npx vitest run tests/design/vendored-themes.test.ts    # 19 tests
npm run verify                                        # 18 PASS · 0 FAIL · 4 non vérifiables
npx vite build
```

Résultats mesurés (état livré) :

- `tsc` — 0 erreur.
- `eslint` (périmètre du projet) — 0 erreur.
- `vitest tests/design tests/unit/dev` — **160/160** (dont 19 pour les thèmes ajoutés).
- `vitest run` (complet) — **1345 réussis / 1364**, 19 échecs **préexistants**
  (7 fichiers : api/fsrs-engine-api, integration/auth-integration,
  semantic/import, unit/bible-full-canon, unit/bible-multi-translation,
  unit/powersync-connector, unit/services/fsrs-factory) — inchangés par ce
  contrat.
- `vite build` — OK, `index` 450,93 kB (gzip 127,44) contre 447,29 kB
  (gzip 126,34) avant : +3,6 kB, dont les woff2 Inter/JetBrains Mono.
- CSS livré — `lara-red`, `#fb2c36`, `--radius-scale`, `Noto Serif Georgian`
  présents ; **0** `oklch(` dans le bundle (conversion hex, WebView anciennes).
- `npm run verify` — **18 PASS · 0 PARTIEL · 0 FAIL · 4 non vérifiables**
  (`tests/design` : 155/155).
  (C18 est le nouveau critère « thème par défaut »).
- Serveur de dev — `/`, `/__dev/responsive-preview`, `/preview-frame.html`,
  `/settings/appearance` = **200**.

## 7. Non vérifié ici

- **Rendu pixel** du nouveau thème par défaut aux largeurs 390/768/1024/1440 :
  aucun navigateur dans l'environnement (U01/U02 de l'audit). À contrôler à
  l'œil, ou via `node scripts/visual-check.mjs` sur un poste avec Playwright.
- **Lisibilité perçue** des thèmes à très grand rayon (Emerald 1.875rem) sur
  les écrans denses : la géométrie est prouvée, l'esthétique ne l'est pas.
- Les polices des thèmes autres que le défaut (Geist, DM Sans, Outfit, Manrope,
  Albert Sans, Plus Jakarta Sans, Fira Code, IBM Plex Mono…) ne sont **pas**
  embarquées : la pile CSS les nomme, le navigateur retombe sur la police
  système si elles sont absentes. Les embarquer toutes ajouterait plusieurs
  centaines de ko ; c'est un choix à valider.
