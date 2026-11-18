# Audit UX/UI Playbook 2026 — application à VersyFlow

Généré par `node scripts/audit-playbook.mjs`. **Ne pas éditer à la main.**
Exécuté le 2026-11-18 04:16 (UTC).

**Bilan : 44 vérifiés · 10 partiels · 0 en échec · 23 non vérifiables ici** (77 règles).

Lecture : *vérifié* = une mesure reproductible dans le dépôt le confirme ; *partiel* = une partie est mesurée, le reste demande un appareil ou un navigateur ; *non vérifiable ici* = la preuve exige un rendu réel, et la façon de le vérifier est indiquée.

| ID | § | Niveau | Verdict | Règle | Mesure |
| --- | --- | --- | --- | --- | --- |
| A01 | A | BLOCKING | **PASS** | Un seul titre de niveau 1 par écran, sans niveau sauté | 91 écrans analysés, 0 h1 en double |
| A02 | A | BLOCKING | **PASS** | Chaque région de navigation est un repère nommé | main nommé, 3/4 nav nommés, 3 repères main |
| A03 | A | MAJOR | **PASS** | L'état actif se voit autrement qu'en gras | 5 `aria-current`, 11 style(s) actif dédié(s) |
| A04 | A | MAJOR | **PASS** | Cinq entrées au plus dans une barre principale | 4 onglets déclarés |
| A05 | A | MAJOR | **PASS** | Retour = écran précédent, pas l'accueil | 26 retours utilisent l'historique |
| A06 | A | BLOCKING | **UNVERIFIABLE** | Un seul objectif et une action primaire par écran | jugement de conception : compte les actions primaires visibles sur l’écran rendu |
| B01 | B | BLOCKING | **PASS** | Texte courant ≥ 4,5:1 sur son fond réel | clair 18.20:1 · clair 8.20:1 |
| B02 | B | BLOCKING | **PASS** | Grand texte (≥ 24 px ou 19 px gras) ≥ 3:1 | tous les couples titre ≥ 8.20:1 |
| B03 | B | BLOCKING | **PASS** | Icônes porteuses de sens, bordures et focus ≥ 3:1 | 21 contours de focus, icônes colorées par jeton |
| B04 | B | BLOCKING | **PASS** | L'information n'est jamais portée par la couleur seule | 42 états exposés en ARIA, 128 libellés textuels |
| B05 | B | MAJOR | **PASS** | Le mode sombre est un second jeu de jetons, pas un filtre | bloc `[data-theme="dark"]` dédié, aucun filtre inverseur |
| B06 | B | MAJOR | **PASS** | Rien ne disparaît en contraste élevé ni en niveaux de gris | 13 règles de contraste élevé |
| C01 | C | BLOCKING | **PASS** | Rien d'utile sous 12 px à l'échelle par défaut | plancher mesuré : 12px (échelle), aucune taille arbitraire sous 12px |
| C02 | C | MAJOR | **PARTIAL** | Le texte tient à 200 % sans perte ni défilement horizontal | zoom autorisé (maximum-scale=5) ; rendu à 200 % non mesuré sans navigateur |
| C03 | C | MAJOR | **UNVERIFIABLE** | Le texte suit la taille système jusqu’à 200 % | nécessite un appareil iOS/Android avec Dynamic Type activé |
| C04 | C | MAJOR | **PASS** | Longueur de ligne entre 45 et 80 caractères | mesure plafonnée en caractères : min(720px, 70ch) |
| C05 | C | MINOR | **PASS** | Un couple de polices, une échelle de tailles documentée | 5 tailles distinctes (12/20/24/28/32 px), 4 familles embarquées |
| D01 | D | BLOCKING | **PASS** | Cible interactive ≥ 24 × 24 px | plancher global de 24 px posé sur les commandes |
| D02 | D | BLOCKING | **PARTIAL** | iOS : zone de touche 44 × 44 pt | 44 px appliqués sous `pointer: coarse` (couvre iOS) ; contrôle sur appareil non fait |
| D03 | D | BLOCKING | **PARTIAL** | Android : cible 48 × 48 dp | 48 px appliqués via `html[data-platform="android"]` ; contrôle sur appareil non fait |
| D04 | D | BLOCKING | **UNVERIFIABLE** | Windows : 40 × 40 epx en tactile | cible Windows non construite (pas d’empaquetage Electron/Tauri dans le dépôt) |
| D05 | D | MAJOR | **UNVERIFIABLE** | Bureau : souris 22–28 pt, cibles espacées | espacement réel entre cibles non mesurable sans rendu |
| D06 | D | MAJOR | **UNVERIFIABLE** | Aucune action destructrice collée à une action fréquente | jugement de conception sur les écrans rendus |
| D07 | D | MAJOR | **UNVERIFIABLE** | Gestes système préservés | nécessite iOS/Android |
| E01 | E | BLOCKING | **PASS** | Les cinq états existent : vide, chargement, erreur, succès, limite | vide (`EmptyState`), chargement (`ScreenSkeleton`), erreur (`ErrorBoundary`), succès, limite : présents |
| E02 | E | BLOCKING | **PASS** | L'état vide propose une action | `EmptyState` accepte une action |
| E03 | E | MAJOR | **PASS** | L'erreur dit quoi faire, pas seulement ce qui a échoué | 13 messages d'erreur orientés action |
| E04 | E | MAJOR | **PASS** | Le chargement réserve la place du contenu, sans saut | squelette monté comme repli de `Suspense` (hauteurs réservées) |
| E05 | E | MAJOR | **PASS** | Un état désactivé explique pourquoi et comment l’activer | 3 élément(s) désactivé(s) relié(s) à une explication (94 attributs disabled) |
| F01 | F | BLOCKING | **PASS** | Chaque champ a un libellé visible relié au programme | tous les champs portent un nom accessible (`aria-label`, `aria-labelledby` ou `<label>` englobant) |
| F02 | F | BLOCKING | **UNVERIFIABLE** | Le message d'erreur est sous son champ et nomme la règle | position du message non mesurable sans rendu |
| F03 | F | BLOCKING | **PASS** | Le champ fautif porte `aria-invalid` et l’erreur est annoncée | 1 `aria-invalid`, 3 zone(s) live |
| F04 | F | MAJOR | **UNVERIFIABLE** | Le formulaire ne demande que ce qu’il utilise | jugement de conception |
| F05 | F | MAJOR | **PASS** | Clavier adapté (`type`, `inputMode`) et autocomplétion | 8 types adaptés, 1 inputMode, 4 autocomplete |
| F06 | F | MAJOR | **PASS** | Action primaire unique et échappatoire possible | 7 annulations, 45 retours |
| G01 | G | BLOCKING | **PASS** | La langue de la page est déclarée | `lang` statique sur `<html>` + synchronisation i18n à l’exécution |
| G02 | G | BLOCKING | **PASS** | Aucune largeur de texte figée : la chaîne la plus longue tient | aucune largeur fixe > 320 px ; retours à la ligne assurés |
| G03 | G | MAJOR | **PARTIAL** | Un seul format de nombre par écran, celui de la langue | 1 usage(s) d’`Intl` |
| G04 | G | MAJOR | **PASS** | Pas de texte de remplissage, pas de promesse invérifiable | aucun lorem ipsum, aucun « bientôt disponible » |
| G05 | G | MAJOR | **PARTIAL** | En RTL la mise en page se retourne sans casser les icônes directionnelles | RTL piloté au niveau document (0 propriétés logiques, 28 directions physiques restantes) |
| G06 | G | MINOR | **PASS** | Dates et heures relatives ou localisées | 37 format(s) relatif(s)/localisé(s) |
| H01 | H | BLOCKING | **PASS** | Tout est utilisable au clavier, focus visible, sans piège | lien d’évitement, 23 règles `:focus-visible`, fermeture Échap |
| H02 | H | BLOCKING | **PASS** | Chaque image a un texte alternatif ou est décorative | toutes les balises `<img>` portent `alt` ou `aria-hidden` |
| H03 | H | BLOCKING | **PASS** | Chaque commande a un nom accessible, icônes comprises | aucun bouton sans nom accessible détecté |
| H04 | H | BLOCKING | **PASS** | Le focus est déplacé après navigation, sans le voler | gestionnaire de focus monté dans 2 coquilles |
| H05 | H | MAJOR | **UNVERIFIABLE** | Zoom système et navigateur testés à 200 % | rendu à 200 % non mesurable sans navigateur |
| H06 | H | MAJOR | **PASS** | Les composants exposent rôles et états exacts | 23 rôles explicites posés |
| I01 | I | MAJOR | **PASS** | Aucune image ou police bloquante au premier écran | polices auto-hébergées en `font-display: swap` |
| I02 | I | MAJOR | **PARTIAL** | Pas de décalage de mise en page à l’arrivée du contenu (CLS ≤ 0,1) | squelette à hauteurs fixes ; CLS non mesuré sans navigateur |
| I03 | I | BLOCKING | **PASS** | Le réglage « réduire le mouvement » est respecté | 8 blocs `prefers-reduced-motion`, dont un pour les animations nommées |
| I04 | I | MAJOR | **PARTIAL** | Aucune animation > 400 ms sans raison, aucune boucle infinie | 5 animation(s) au-delà de 400 ms, justifiées et jouées une seule fois : cursor: pointer; user-select: none; animation: mem-pulse 2.4 · animation: mem-confetti-fall 800ms ease-in both; · transform-style: preserve-3d; transition: transform 450ms ea |
| I05 | I | MINOR | **UNVERIFIABLE** | Premier rendu utile < 2,5 s sur réseau médian | mesure réseau réelle non reproductible ici |
| J01 | J | BLOCKING | **PARTIAL** | Android : edge-to-edge et encoches gérées | `viewport-fit=cover` et encoches déclarés ; rendu Android non testé |
| J02 | J | BLOCKING | **UNVERIFIABLE** | Android : retour système (y compris prédictif) | nécessite un appareil Android |
| J03 | J | MAJOR | **UNVERIFIABLE** | Android : retour visuel Material | nécessite un appareil Android |
| J04 | J | BLOCKING | **UNVERIFIABLE** | iOS : le geste de retour par le bord reste natif | nécessite iOS |
| J05 | J | MAJOR | **PARTIAL** | iOS : zones sûres respectées (encoche, barre d’accueil) | `env(safe-area-inset-*)` utilisé ; rendu iOS non testé |
| J06 | J | MAJOR | **UNVERIFIABLE** | iOS : 5 onglets au plus, feuilles avec paliers | comportement des feuilles natives non mesurable ici |
| J07 | J | BLOCKING | **UNVERIFIABLE** | Windows : raccourcis clavier et touches d’accès | cible Windows non construite |
| J08 | J | MAJOR | **UNVERIFIABLE** | Windows : redimensionnement de 320 epx au plein écran | nécessite la fenêtre Windows |
| J09 | J | MAJOR | **UNVERIFIABLE** | Windows : contraste élevé et thème système suivis | nécessite Windows |
| J10 | J | BLOCKING | **UNVERIFIABLE** | macOS : chaque action a une commande dans la barre de menus | cible macOS non construite |
| J11 | J | MAJOR | **UNVERIFIABLE** | macOS : fenêtre redimensionnable avec taille minimale | nécessite macOS |
| J12 | J | MAJOR | **UNVERIFIABLE** | Linux/GNOME : pas de double barre de titre, icônes symboliques | cible Linux non construite |
| J13 | J | MAJOR | **UNVERIFIABLE** | Linux/KDE : barre de menus, barre d’outils, raccourcis Ctrl | cible Linux non construite |
| J14 | J | MAJOR | **UNVERIFIABLE** | Linux : thème sombre et contraste élevé suivis | cible Linux non construite |
| J15 | J | BLOCKING | **PARTIAL** | Web : utilisable de 320 à 1920 px sans défilement horizontal | aucune largeur > 320 px ; contrôle de rendu à 320/390/768/1280 non fait |
| J16 | J | MAJOR | **PASS** | Web : zones sûres et zoom de page non bloqué | `viewport-fit=cover`, insets `env(...)`, zoom autorisé (5×) |
| K01 | K | BLOCKING | **PASS** | Aucune case pré-cochée, refuser aussi simple qu’accepter | 2 interrupteurs de consentement, état exposé par `role="switch"`, aucun pré-coché |
| K02 | K | BLOCKING | **PASS** | Aucune promesse inventée, aucun chiffre sans source ni date | mode démo signalé à l’écran, sources bibliques documentées et datées |
| K03 | K | MAJOR | **UNVERIFIABLE** | Le total, frais inclus, est visible avant engagement | aucun parcours payant dans l’application aujourd’hui |
| K04 | K | MAJOR | **PASS** | On peut quitter un parcours sans perdre son travail | 30 mécanismes de persistance/brouillon |
| L01 | L | BLOCKING | **PASS** | Des jetons partout, aucune couleur codée en dur dans un écran | aucune couleur hexadécimale dans les écrans |
| L02 | L | BLOCKING | **PASS** | Le résultat sépare vérifié / estimé / non fait | ce rapport sépare PASS, PARTIAL (mesuré en partie), FAIL, UNVERIFIABLE (non fait) et n’accorde aucune réussite par défaut |
| L03 | L | MAJOR | **PASS** | Chaque case cochée repose sur une preuve reproductible | chaque règle est recalculée par `node scripts/audit-playbook.mjs` sur l’état du dépôt |
| L04 | L | MAJOR | **PASS** | Le contexte projet (`AGENTS.md`) énonce les règles de l’écran | section « Règles d’écran » annexée à `AGENTS.md` (structure, couleur, typo, cibles, états, mouvement) |
| L05 | L | MINOR | **PASS** | Un composant par intention, nommé pareil partout | aucun composant homonyme pour une même intention |

## Ce qui reste à vérifier sur un appareil

| ID | Règle | Pourquoi | Comment |
| --- | --- | --- | --- |
| A06 | Un seul objectif et une action primaire par écran | jugement de conception : compte les actions primaires visibles sur l’écran rendu | revoir les 91 écrans (docs/plan/journeys) ou un test d’utilisateur |
| C03 | Le texte suit la taille système jusqu’à 200 % | nécessite un appareil iOS/Android avec Dynamic Type activé | tester sur appareil avec la taille de police système à 200 % |
| D04 | Windows : 40 × 40 epx en tactile | cible Windows non construite (pas d’empaquetage Electron/Tauri dans le dépôt) | empaqueter puis tester au doigt sur Windows |
| D05 | Bureau : souris 22–28 pt, cibles espacées | espacement réel entre cibles non mesurable sans rendu | inspection dans le navigateur, onglet Accessibilité |
| D06 | Aucune action destructrice collée à une action fréquente | jugement de conception sur les écrans rendus | relecture des écrans avec suppression (collections, notes, compte) |
| D07 | Gestes système préservés | nécessite iOS/Android | tester le retour par bord sur les deux plateformes |
| F02 | Le message d'erreur est sous son champ et nomme la règle | position du message non mesurable sans rendu | inspecter le DOM sur un formulaire en erreur |
| F04 | Le formulaire ne demande que ce qu’il utilise | jugement de conception | relecture des formulaires d’inscription et de profil |
| H05 | Zoom système et navigateur testés à 200 % | rendu à 200 % non mesurable sans navigateur | navigateur, zoom 200 %, vérifier l’absence de défilement horizontal |
| I05 | Premier rendu utile < 2,5 s sur réseau médian | mesure réseau réelle non reproductible ici | Lighthouse en réseau « Slow 4G » |
| J02 | Android : retour système (y compris prédictif) | nécessite un appareil Android | test sur appareil, geste de retour depuis chaque écran profond |
| J03 | Android : retour visuel Material | nécessite un appareil Android | vérifier l’onde de pression sur les commandes |
| J04 | iOS : le geste de retour par le bord reste natif | nécessite iOS | tester le glissement depuis le bord gauche |
| J06 | iOS : 5 onglets au plus, feuilles avec paliers | comportement des feuilles natives non mesurable ici | test sur appareil iOS |
| J07 | Windows : raccourcis clavier et touches d’accès | cible Windows non construite | empaqueter puis tester Alt + accélérateurs |
| J08 | Windows : redimensionnement de 320 epx au plein écran | nécessite la fenêtre Windows | redimensionner la fenêtre à 320 epx |
| J09 | Windows : contraste élevé et thème système suivis | nécessite Windows | activer le mode contraste élevé |
| J10 | macOS : chaque action a une commande dans la barre de menus | cible macOS non construite | empaqueter puis vérifier le menu |
| J11 | macOS : fenêtre redimensionnable avec taille minimale | nécessite macOS | redimensionner la fenêtre |
| J12 | Linux/GNOME : pas de double barre de titre, icônes symboliques | cible Linux non construite | lancer le paquet sous GNOME |
| J13 | Linux/KDE : barre de menus, barre d’outils, raccourcis Ctrl | cible Linux non construite | lancer le paquet sous KDE |
| J14 | Linux : thème sombre et contraste élevé suivis | cible Linux non construite | lancer sous thème sombre |
| K03 | Le total, frais inclus, est visible avant engagement | aucun parcours payant dans l’application aujourd’hui | à couvrir le jour où un abonnement existe |

## Preuves

- `node scripts/audit-playbook.mjs` — recalcule chaque ligne ci-dessus.
- `npm run verify` — types, lint, tests de conception, audits du plan.
- `npx vitest run tests/design` — dont `playbook-rules.test.ts` qui verrouille les règles statiques.
