# Le verset du jour — carte d'accueil, image et notification

Décidé le 30/10. Trois promesses, tenues par du code testé, pas par une intention.

## 1. Un verset différent chaque jour, sans réseau

`src/domains/bible/daily-verse.ts` embarque **50 versets** (texte LSG, domaine
public) dans le bundle. La sélection ne dépend que du jour calendaire local :

```
index = ((jours depuis le 01/01/2026) × 13) mod 50
```

- **13 est premier avec 50** : deux jours consécutifs ne tombent jamais sur la
  même entrée, et le cycle ne se referme qu'après 50 jours ;
- **déterministe** : recharger l'app, la rouvrir à 23 h 59 ou changer d'appareil
  donne le même verset pour la même date ;
- **hors ligne** : aucun appel réseau. Ni pour le texte, ni pour l'image.

Vérifié par `tests/design/daily-verse.test.ts` : zéro répétition sur 365 jours,
cycle entier visité, fidélité au jeu LSG du dépôt (comparaison caractère à
caractère, suscriptions de psaumes tolérées).

## 2. Une image qui parle du verset

Chaque entrée porte un `visual` : un thème du catalogue local
(`public/themes/<catégorie>/<id>-landscape.png`), choisi pour son **sens** et non
pour son esthétique :

| Verset | Visuel | Pourquoi |
| --- | --- | --- |
| Psaume 23:1 | `ani-agneau` | le berger et sa brebis |
| Ésaïe 40:31 | `ani-aigle` | « ils prennent le vol comme les aigles » |
| Jean 8:12 | `lum-phares` | « je suis la lumière du monde » |
| Hébreux 11:1 | `obj-anchor` | l'ancre de l'espérance |
| Jean 15:5 | `nat-fleurs` | le cep et les sarments |

Le test refuse une entrée dont l'image n'existe pas sur le disque : pas de
vignette cassée, pas de repli silencieux vers un paysage générique. Cinquante
visuels distincts au minimum — jamais le même arbre tous les jours.

Le thème d'image choisi par l'utilisateur continue de peindre le reste de l'app
(`ThemeManager`) ; seule la carte « verset du jour » suit le verset.

## 3. Une notification par jour, elle aussi hors ligne

`src/services/daily-verse-notifier.ts` programme **14 jours d'avance**, chaque
notification portant le texte de son jour (pas un « Votre verset vous attend »).
Identifiants 1001–1200 : aucune collision avec les rappels de révision (1–24).

| Plateforme | Comportement |
| --- | --- |
| Android / iOS / Windows (Capacitor) | notifications système à 8 h, app fermée comprise ; fenêtre reprogrammée à chaque retour au premier plan |
| Web | pas de notification onglet fermé — le navigateur ne réveille pas une PWA sans push. Le verset reste dans l'app et dans l'écran Notifications, et l'écran le dit |

La permission n'est **jamais** demandée au démarrage : `DailyVerseNotifier`
reprogramme seulement si elle est déjà accordée. L'activation explicite vit dans
l'écran Notifications (« Recevoir le verset du jour »).

## Ce qui reste ouvert

- le pack de photos réalistes (`public/themes/photos-*`) n'est pas livré : les
  visuels sont les illustrations du catalogue. Le jour où le pack arrive,
  `scripts/themes/import-photo-themes.mjs` publie la catégorie et il suffira de
  repointing `visual` vers les ids photo ;
- la notification web demanderait un service worker + push : hors périmètre tant
  qu'il n'y a pas de backend de notification.
