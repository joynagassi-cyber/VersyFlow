# Thèmes chrétiens & d'architecture sacrée

## 1. Analyse de `wallpapershome.com/architecture/` et direction retenue

L'analyse de `https://wallpapershome.com/architecture/` (sous-catégories `Classical`, `Houses and Exteriors`, `Coastal`, `Modern`, `Streets`) et de ses conditions d'utilisation met en évidence trois points :

1. **Licence** : les conditions de WallpapersHome stipulent que ses images sont strictement réservées à un usage personnel et demeurent sous le droit d'auteur de leurs auteurs respectifs (pas de redistribution dans une application).
2. **Qualités esthétiques retenues** :
   - double déclinaison systématique **bureau horizontal** + **mobile vertical** ;
   - compositions architecturales lumineuses, lignes propres, rayons volumétriques dans les nefs/temples (`Classical / Skylight`), demeures paisibles de pierre et de bois à l'heure dorée (`Houses and Exteriors`), sanctuaires côtiers blancs sur mer calme (`Coastal`) et lieux de recueillement épurés (`Modern`).
3. **Filtrage et élévation chrétienne** :
   - écartement complet des motifs Halloween, occultes ou nocturnes/néons présents dans certaines galeries publiques ;
   - création de **deux collections dédiées placées en tête du sélecteur d'apparence** (`Paramètres → Apparence → Fond → Image` et `/settings/theme-picker`), centrées sur la foi chrétienne, l'œuvre rédemptrice du Christ et la paix des sanctuaires.

## 2. Les deux nouvelles catégories livrées (`13` scènes = `26` fonds HD + `13` vignettes WebP)

### A. `foi-victoire` — **Foi & Victoire** (`5` scènes illustrées originales, `10` visuels + `5` vignettes)

Illustrations éditoriales originales générées en double cadrage natif (`3:2` bureau `1248×832` et `2:3` mobile `832×1248`) :

| id | Nom (FR) | Nom (EN) | Motif |
| --- | --- | --- | --- |
| `chr-victoire-croix` | Victoire à la Croix | Victory at the Cross | Croix vide victorieuse au lever du soleil sur Golgotha, rayons d'or sur Jérusalem |
| `chr-tombeau-ouvert` | Tombeau vide à l'aube | Empty Tomb at Dawn | Matin de la Résurrection, pierre roulée et lumière dorée jaillissant du tombeau ouvert |
| `chr-bon-berger` | Le Bon Berger | The Good Shepherd | Verts pâturages et eaux paisibles du Psaume 23 au soleil levant |
| `chr-gethsemane` | Jardin de Gethsémané | Garden of Gethsemane | Oliviers millénaires sous un rayon céleste dans la nuit étoilée face à Jérusalem |
| `chr-mer-galilee` | Paix sur la Galilée | Peace on Galilee | Barque paisible sur la mer de Galilée apaisée sous les nuages entrouverts à l'aube |

### B. `architecture-sacree` — **Architecture & Sanctuaires** (`8` scènes architecturales, `16` visuels + `8` vignettes)

Photographies architecturales haute définition (`3000 px` côté source, licence gratuite **Unsplash License** — `images.unsplash.com`, hors `plus.unsplash.com`), chacune avec un vrai cadrage paysage et un vrai cadrage portrait distincts :

| id | Nom (FR) | Nom (EN) | Inspiration architecturale |
| --- | --- | --- | --- |
| `arc-cathedrale-lumiere` | Nef de lumière | Nave of Light | Voûtes de pierre et faisceaux lumineux obliques (`Classical / Skylight`) |
| `arc-vitrail-grace` | Rosace & Vitrail | Rose Window & Stained Glass | Grande rosace gothique et vitraux saphir/rubis |
| `arc-chapelle-colline` | Chapelle des collines | Hillside Chapel | Chapelle immaculée et clocher à croix sur colline verdoyante |
| `arc-cloitre-olivier` | Cloître & Arches | Cloister & Arches | Colonnades romanes/gothiques et jeux d'ombre paisibles |
| `arc-chapelle-cotiere` | Chapelle sur la mer | Chapel by the Sea | Sanctuaire côtier blanc surmonté d'une croix face à la mer (`Coastal`) |
| `arc-maison-paisible` | Demeure paisible | Peaceful Dwelling | Maison de pierre et de bois au pied des montagnes (`Houses & Exteriors`) |
| `arc-sanctuaire-bois` | Sanctuaire & Recueillement | Quiet Sanctuary | Bancs de bois et nef silencieuse dans la lumière du matin (`Modern / Interior`) |
| `arc-arche-jerusalem` | Pierres de Jérusalem | Stones of Jerusalem | Arches de pierre blonde et cour pavée ensoleillée |

## 3. Commandes d'import et de vérification

```bash
# Importer / régénérer depuis artifacts/sacred-src/ (non versionné)
npm run themes:sacred

# Vérifier l'alignement strict disque <-> src/theme/sacred-themes.generated.ts
npm run themes:sacred:check
```
