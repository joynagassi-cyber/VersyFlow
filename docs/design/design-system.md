# Système de design VersyFlow — contrat

Document de décisions. Chaque affirmation renvoie à une source du dépôt ou à une
commande. Ce qui n'est pas vérifié est marqué « non vérifié ».

## 1. Format des couleurs : couleurs CSS réelles, pas de triplet HSL

**Constat** (`grep -rn "hsl(var(" src app tailwind.config.js` → **0** résultat) :
le dépôt n'a jamais utilisé le contrat shadcn « composantes HSL séparées ». Tous
les jetons sont des hexadécimaux (`src/styles/tweakcn-presets.css`).

**Décision** : conserver ce format. Il rend `@property --x { syntax: '<color>' }`
valide, autorise `color-mix()` et permet d'animer. Aucune conversion n'est donc
nécessaire — mais elle est **testée** : `tests/design/theme-tokens.test.ts`
échoue si un triplet nu ou un `hsl(var(--…))` réapparaît.

## 2. Jetons

| Famille | Source | Rôle |
| --- | --- | --- |
| `--background`, `--foreground`, `--card`, `--primary`… | 25 presets (`data-preset`) | contrat shadcn consommé par Tailwind |
| `--primary`, `--ring`, `--accent`, `--tint` | preset **ou** accent d'image | animés via `@property` |
| `--color-*` (pont) | bloc généré dans `tweakcn-presets.css` | compatibilité avec les ~90 fichiers existants |
| `--color-on-primary` | `var(--primary-foreground)` | texte posé sur l'accent |

Le pont est indispensable : les écrans utilisent `bg-surface`, `text-text-muted`,
`text-on-primary`. Un jeton absent du pont ne suit pas le thème — c'est
exactement le défaut corrigé ici (`--color-on-primary` manquait, une correction
de contraste aurait donc rendu du blanc sur du vert clair).

Le socle (`:root`) définit `--primary/--primary-foreground/--ring/--accent/--tint`
**avant** React : plus aucun jeton ne vaut `#000000` au premier rendu.

## 3. Animation (0,8 s)

```css
@property --primary { syntax: '<color>'; inherits: true; initial-value: #e10677; }
:root { transition: --primary .8s cubic-bezier(.22,.61,.36,1), /* … */ }
@media (prefers-reduced-motion: reduce) { :root { transition: none; } }
```

Quatre jetons enregistrés seulement (`--primary`, `--ring`, `--accent`, `--tint`)
plus `--app-bg-image` (`syntax: '*'`). On n'anime ni `--bg` ni `--ink` : un
changement de fond est déjà un fondu d'opacité, et animer l'encre ferait
clignoter le texte à chaque réglage.

## 4. Contraste : mesuré, corrigé, publié

`scripts/apply-preset-contrast.mjs` normalise les palettes après import.

- 25 presets × 2 modes = **50 blocs**, **250 paires** vérifiées.
- Avant : **17 presets** sous 4,5:1 sur `--primary-foreground` (pire cas
  **2,28:1**, ocean-breeze) + 6 paires `--muted-foreground`.
- Après : **pire ratio 4,50:1**, aucun échec.
- Règle appliquée : garder le couple d'origine s'il passe ; sinon ajuster la
  **luminosité** en préservant teinte et saturation (≤ 12 pas de 1 %) ; en
  dernier recours, noir ou blanc au meilleur ratio.
- Chaque correction est écrite dans `docs/design/preset-contrast-report.md`.
- Le script est **idempotent** (`--check` sort en 0 une fois conforme).

## 5. Alpha Tailwind sur variables

`bg-primary/10` ne produisait **aucune règle** : Tailwind ne décompose pas une
`var()`. Correctif dans `tailwind.config.js` :

```js
const alpha = (token) => `color-mix(in srgb, ${token} calc(<alpha-value> * 100%), transparent)`;
```

Couvre `primary, accent, on-primary, background, surface, surface-tint, border,
divider, text-*, card, card-foreground, popover, popover-foreground, muted,
muted-foreground, ring`.

Preuve dans le CSS construit :

```
.surface-glass{background-color:color-mix(in srgb,var(--card) 40%,transparent);
  --tw-backdrop-blur: blur(40px); …; background-image:linear-gradient(…var(--tint) 22%…)}
```

`backdrop-blur-2xl` = **40 px** (vérifié dans `node_modules/tailwindcss/stubs/config.full.js`).

## 6. Verre et surfaces

| Surface | Recette | Raison |
| --- | --- | --- |
| `.surface-glass` | `bg-card/40` + `blur(40px)` + voile `--tint` 22 % en `background-image` | cartes de galerie au-dessus du fond |
| `.card-glass` | idem, recette historique | cartes du tableau de bord |
| `.bible-card` | `--reading-surface-alpha` (0,92) | le texte biblique reste lisible |
| `[data-transparency="reduced"]` / `[data-contrast="high"]` | surfaces **opaques**, `backdrop-filter: none` | le verre est un confort |

Le voile est toujours posé en `background-image`, jamais en `background-color`
(sinon il écrase la couleur de la carte).

## 7. Présentation en couches

| # | Couche | Où | État |
| --- | --- | --- | --- |
| 1 | Palette | `theme-catalog.ts` (100 thèmes) + 25 presets | existe, testé |
| 2 | Fond | `data-app-bg` / `--app-bg-image` / `--theme-image` | existe |
| 3 | Accent | preset, accent VersyFlow, accent d'image (`image-accent.ts`) | existe, testé |
| 4 | Formes | rayons Tailwind + `.screen-column` | partiel |
| 5 | Texte | `theme-fonts.ts` (10 polices bibliques, 6 polices UI) | existe |

Priorité de l'accent (documentée, non modifiée) : **image > couleur libre >
preset > palette**.

## 8. Points ouverts (assumés)

- **Tablette 768–1023 px** : la barre d'onglets basse reste montée ; le rail
  compact 88 px est prévu mais non activé sous 1024 px. À trancher visuellement.
- **Icônes** : 72 fichiers importent encore `lucide-react` ; la coquille de bureau
  et la navigation sont en Hugeicons.
- **Rendu visuel** : aucun navigateur dans l'environnement de développement. Les
  largeurs, le verre et le redimensionnement ne sont **pas vérifiés à l'écran** ;
  seuls le CSS construit, la compilation, les tests et le HTTP 200 le sont.
- **Images de fond** : `public/themes` (353 Mo) est gitignored ; un clone neuf
  n'a aucun visuel de thème.
