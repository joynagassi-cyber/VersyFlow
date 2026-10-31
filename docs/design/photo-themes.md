# Thèmes photo — lot « 40 images »

État au **30 octobre 2026** : **livré et validé** (`20/20` scènes importées, soit **40 visuels WebP**
et **20 vignettes WebP** dans `public/themes/photos-nature/` et `public/themes/photos-vie/`,
et catalogue `ALL_THEMES` porté à **120 thèmes** : 100 illustrés + 20 photographiques).

> **Note de transparence sur la provenance** : l'outil de génération synthétique de l'espace de
> travail (`gemini-3.1-flash-image`) répond toujours `403 PERMISSION_DENIED` lors des relances.
> Pour livrer de **vraies photographies haute définition** sans aucune simulation ni image
> basse résolution agrandie, les 40 sources (`3000 px` de large côté source, licence
> **Unsplash License** gratuite — `images.unsplash.com`, à l'exclusion stricte de
> `plus.unsplash.com`, iStock ou Shutterstock) ont été déposées dans `artifacts/photos-src/`
> (non versionné), auditées visuellement sur planches-contacts 40/40 (zéro filigrane, zéro logo
> de marque, zéro enseigne commerciale, zéro visage identifiable au premier plan, cadrages
> paysage et portrait photographiquement distincts), puis converties via
> `npm run themes:photos`.

## 1. Contrat de fichiers

Pour une scène `{id}` de catégorie `{category}` :

| Fichier | Chemin | Taille |
| --- | --- | --- |
| Portrait (mobile, thème appliqué) | `public/themes/{category}/{id}-portrait.webp` | 832 × 1248 |
| Paysage (bureau, sélecteur) | `public/themes/{category}/{id}-landscape.webp` | 1248 × 832 |
| Vignette | `public/themes/{category}/{id}-thumb.webp` | 320 px de large |

- Le format WebP maintient un poids total contenu (~7,1 Mo pour les 60 fichiers WebP réunis,
  chaque visuel restant largement sous la limite de 900 Ko et chaque vignette sous 60 Ko).
  `themePortraitUrl` / `themeLandscapeUrl` lisent l'extension réelle portée par l'entrée
  générée ; `themeThumbUrl` renvoie toujours `-thumb.webp`.
- Le **portrait n'est pas un recadrage du paysage** : chaque scène dispose d'une photographie
  paysage dédiée et d'une photographie portrait dédiée (`sha256(portrait) !== sha256(landscape)`).
- Aucune image source plus petite que la cible (`1248 px` sur le grand côté) n'est acceptée
  (pas d'agrandissement).

## 2. Les 20 scènes livrées

Nature (10) — catégorie `photos-nature` :

| id | Nom | Motif | Paysage | Portrait | Vignette |
| --- | --- | --- | --- | --- | --- |
| `pho-feuilles` | Feuillages superposés | feuilles épaisses vert vif superposées, arrière-plan sombre | `1248×832` | `832×1248` | `320w` |
| `pho-aurore` | Aurore boréale | aurore verte au-dessus d'un paysage enneigé nocturne | `1248×832` | `832×1248` | `320w` |
| `pho-foret-brume` | Forêt brumeuse | sous-bois brumeux et rayons dorés au lever du jour | `1248×832` | `832×1248` | `320w` |
| `pho-cascade` | Cascade | cascade forestière et rochers sombres | `1248×832` | `832×1248` | `320w` |
| `pho-dunes` | Dunes au coucher du soleil | ondulations de sable, lumière dorée | `1248×832` | `832×1248` | `320w` |
| `pho-lac` | Lac de montagne | lac calme alpin, reflets nets | `1248×832` | `832×1248` | `320w` |
| `pho-vague` | Vague déferlante | écume océanique et marée sur le sable | `1248×832` | `832×1248` | `320w` |
| `pho-lavande` | Champ de lavande | rangées violettes au crépuscule | `1248×832` | `832×1248` | `320w` |
| `pho-falaise` | Falaise côtière | falaises atlantiques, océan et brume côtière | `1248×832` | `832×1248` | `320w` |
| `pho-coquelicots` | Coquelicots | champ rouge en lumière chaude | `1248×832` | `832×1248` | `320w` |

Vie & loisirs (10) — catégorie `photos-vie` :

| id | Nom | Motif | Paysage | Portrait | Vignette |
| --- | --- | --- | --- | --- | --- |
| `pho-voiture` | Voiture de sport | coupé sport sans emblème visible au coucher du soleil | `1248×832` | `832×1248` | `320w` |
| `pho-football` | Football | ballon sur pelouse de stade sans marque visible | `1248×832` | `832×1248` | `320w` |
| `pho-cafe-livre` | Café & livre | tasse fumante et livre ouvert, lumière du matin | `1248×832` | `832×1248` | `320w` |
| `pho-velo` | Vélo en ville | vélo minimaliste contre mur coloré / allée arborée | `1248×832` | `832×1248` | `320w` |
| `pho-table` | Table partagée | repas convivial et bois naturel | `1248×832` | `832×1248` | `320w` |
| `pho-surf` | Surf | houle dorée et silhouette de surfeur au loin | `1248×832` | `832×1248` | `320w` |
| `pho-randonnee` | Randonnée | sentier verdoyant et sommet à l'horizon | `1248×832` | `832×1248` | `320w` |
| `pho-cuisine` | Cuisine | ingrédients frais et panier artisanal | `1248×832` | `832×1248` | `320w` |
| `pho-bibliotheque` | Bibliothèque | étagères boiseries et lumière chaude | `1248×832` | `832×1248` | `320w` |
| `pho-guitare` | Guitare acoustique | guitare acoustique dans une lumière calme | `1248×832` | `832×1248` | `320w` |

Les couleurs d'accent de repli sont **toutes reprises** de thèmes existants du
catalogue (test dédié) : aucun nouveau choix de couleur.

## 3. Import et contrôle

```bash
# Réimporter après ajout/remplacement dans artifacts/photos-src/
# (supprimer d'abord les .webp cibles si une scène déjà importée est remplacée)
npm run themes:photos

# Vérifier l'alignement strict disque <-> src/theme/photo-themes.generated.ts
npm run themes:photos:check
```

## 4. Intégration au sélecteur

`src/theme/photo-themes.ts` construit les deux catégories (`Photographies — Nature`,
`Photographies — Vie & loisirs`, libellées en FR et EN) à partir de
`src/theme/photo-themes.generated.ts`, et `src/theme/theme-catalog.ts` les concatène aux
dix catégories illustrées. Les réglages d'apparence (`app/settings/appearance.tsx`,
`app/settings/theme-picker.tsx`) les affichent avec miniature WebP `320 px`, visuel
portrait `< 1024 px` et paysage `>= 1024 px`, persistance `accent = id` et repli `nat-trees`.

## 5. État de validation

| Étape | État |
| --- | --- |
| Contrat de nommage, formats, tailles | fait et testé |
| Import automatique + contrôle de synchro (`themes:photos:check`) | fait et testé |
| Intégration catalogue / URLs / vignettes (`ALL_THEMES = 120`) | fait et testé |
| **40 visuels réels + 20 vignettes WebP** | **livré et vérifié** (`tests/design/photo-themes.test.ts` : 9/9 tests OK) |
