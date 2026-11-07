# Mode sombre — pourquoi il était incomplet, et ce qui a été corrigé

> Le sombre n'était pas une palette : c'était une **liste de valeurs figées
> posée à côté du clair**, plus une douzaine de correctifs réservés au mode qui
> « souffrait ». Trois défauts distincts en découlaient.

## 1. Incomplet — cinq jetons n'existaient qu'en clair

`--bl`, `--gb`, `--ga`, `--veil`, `--premium-on` étaient déclarés **uniquement**
dans le bloc clair. Le sombre n'y touchait pas : il héritait des valeurs du
clair par simple cascade. Conséquence mesurée : en sombre,
`--premium-on` valait `#1a0b14`, une encre choisie pour un texte posé sur un
dégradé clair — pas le résultat d'une décision.

## 2. Figé — le sombre ignorait le preset

| Jeton | Clair (avant) | Sombre (avant) | Effet |
| --- | --- | --- | --- |
| `--gc` | `#ffffff` | `#171717` | le clair valait la **surface**, le sombre le **fond** |
| `--tx` | `#1b1220` | `#f3f3f3` | aucun preset ne les changeait |
| `--acc` | `--color-primary` | `color-mix(primary 45 %, --mut)` | accent **désaturé** en sombre seulement |
| `--glass-rgb` | `255,255,255` | `18,18,18` | le verre ne suivait pas la carte du preset |

Le défaut le plus visible n'était pas l'accent, mais `--gc` : en clair il valait
la surface (`#ffffff`), en sombre il valait le fond (`#171717`). **Les cartes
sombres n'avaient donc aucune élévation** — elles se confondaient avec la page.
C'est la définition d'un mode non conforme : les deux modes n'appliquaient pas
la même formule.

## 3. Correctifs propres au sombre

Douze règles préfixées `html[data-theme='dark']` corrigeaient, composant par
composant, ce que `text-primary` (magenta vif) ne savait pas faire sur un fond
sombre. Tout écran ajouté ensuite héritait du défaut, puisque le correctif
n'était pas là où vivait la règle. Elles sont remplacées par des règles
**communes**, dont l'encre est calculée par mode.

## Ce qui a été fait

### Une formule, deux modes

Un bloc **commun** aux deux modes porte l'identité et les densités :

```css
--acc: var(--color-primary);      --acc2: var(--color-accent);
--tx:  var(--color-text-primary); --mut:  var(--color-text-secondary);
--gc:  rgb(var(--gc-rgb));        --bg:   rgb(var(--bg-rgb));
--bl: var(--bg-blur); --gb: var(--glass-blur);
--ga: var(--glass-alpha); --veil: var(--veil-alpha);
--on-accent: var(--color-on-primary);
```

Chaque mode ne déclare plus que **ce qui diffère réellement** : l'ancre du
reflet, la densité du voile, la saturation du logo. Les formules se répondent
deux à deux (`--bd` : `--gc 75 %` en clair, `--tx 14 %` en sombre) au lieu de
diverger.

### Les triplets RGB, seule valeur que le CSS ne sait pas calculer

`rgba(var(--gc-rgb), a)` attend **trois nombres**, pas une couleur :
`color-mix()` ne peut pas servir d'ancre ici, et s'en servir créerait un cycle
(`--color-surface` devient translucide sous une image de thème). D'où
`src/theme/surface-triplets.ts` : on lit `--card`, `--background`,
`--foreground` du preset **après** application du thème, on convertit, on
écrit. Le verre suit désormais la carte du preset, en clair comme en sombre.

### Les encres, mesurées

| Paire | Clair | Sombre |
| --- | --- | --- |
| texte / surface | 17,08:1 | 16,67:1 |
| texte secondaire / surface | 9,33:1 | 8,53:1 |
| accent textuel / surface | 10,00:1 | 8,58:1 |

L'écart entre les deux modes passe sous 0,5 point de contraste. `--acc-text`
est calculé depuis l'accent (`mix(acc 70 %, texte)` en sombre, `50 %` en clair),
donc il suit presets et accents fixes.

### La barre du navigateur

`<meta name="theme-color">` valait `#D81B97` en dur — une barre magenta au-dessus
d'un écran sombre, dans une teinte qui n'était même pas celle de la marque. Elle
suit maintenant le fond réel (`applyThemeColor`), et le script d'amorçage de
`index.html` la règle dès le premier paint.

## Limite assumée, mesurée plutôt que tue

`--premium-on` sert d'encre sur un **dégradé** `--acc → --acc2`. Sur l'accent de
marque `#e6067a`, seul un noir presque pur dépasse 4,5:1 ; le blanc plafonne à
4,50 et s'effondre à 1,50 sur l'extrémité claire du dégradé. La paire mesurait
**4,24:1 avant réécriture**, elle mesure **4,05:1** ici : c'est une paire de
marque préexistante, légèrement en dessous de AA, et la dérivation ne prétend
pas la corriger. La corriger vraiment demande de changer la composition du
dégradé de marque — une décision de design, pas un correctif.

Les surfaces **pleines** d'accent, elles, utilisent `--on-accent`, qui suit
`--primary-foreground` du preset : un preset qui déclare du texte sombre sur un
accent clair n'écope donc jamais d'un blanc illisible.

## Garde-fous ajoutés

`tests/design/dark-parity.test.ts` (20 tests) :

- **parité** : le sombre déclare tout ce que le clair déclare ;
- **dynamisme** : aucune couleur littérale dans les blocs de mode ;
- **non-régression** : l'accent n'est plus désaturé dans un seul mode ;
- **structure** : aucune déclaration hors bloc (une déclaration orpheline est
  ignorée en silence par le moteur CSS — c'est arrivé pendant la réécriture,
  seul le build l'avait signalée) ;
- **contraste** : les paires des deux modes tiennent AA, et l'écart de
  contraste entre modes reste sous 1,5 point.

`dark-restraint.test.ts` a été **supprimé** : il verrouillait les défauts
(`--gc: #171717`, accent désaturé à 45 %). Un test qui décrit un défaut empêche
de le corriger.
