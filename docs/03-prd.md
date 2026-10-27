# VersyFlow — Product Requirements Document (PRD)

## Document généré par Agent B — PRD

---

## 1. Problèmes à Résoudre

### P1 : La mémorisation biblique est frustrante
Les outils existants (YouVersion, etc.) proposent des quiz basiques sans compréhension réelle de la courbe d'oubli. L'expérience est mécanique, répétitive et rapidement démotivante.

### P2 : Pas d'optimisation scientifique de la révision
Les algorithmes de répétition espacée disponibles sont soit trop simples (SM-2), soit noyés dans des applications trop larges (Anki). Aucun produit biblique n'utilise un moteur de précision comme FSRS.

### P3 : Fragmentation linguistique
Choisir une traduction biblique et choisir la langue de l'interface sont souvent confondus ou liés artificiellement dans les apps existantes.

### P4 : Expérience de conception inégale
Beaucoup d'apps bibliques sacrifient le design sur l'autel de la fonctionnalité. Le résultat est fonctionnel mais peu engageant.

---

## 2. Cas d'Usage Détaillés

### CU-1 : Première utilisation (Onboarding)
| Étape | Action | Résultat |
|-------|--------|----------|
| 1 | L'utilisateur ouvre l'app | WelcomeScreen avec carousel |
| 2 | Tape "Commencer" | LanguagePickerScreen |
| 3 | Choisit "Français" | Sélection persistée |
| 4 | TranslationPickerScreen affiché | LSG pré-sélectionné |
| 5 | Confirme LSG | settings.uiLanguage = 'fr', settings.bibleTranslation = 'lsg' |
| 6 | Accueil affiché | Prêt à explorer |

### CU-2 : Mémorisation d'un verset
| Étape | Action | Résultat |
|-------|--------|----------|
| 1 | Navigation vers Bible → Jean → Chapitre 3 | Liste des versets affichée |
| 2 | Sélectionne Jean 3:16 | Aperçu du verset complet |
| 3 | Tape "Mémoriser ce verset" | Session mémorisation démarre |
| 4 | Aperçu 10s → masquage progressif | L'utilisateur voit chaque mot |
| 5 | Tap-to-reveal sur chaque mot | Progression visuelle |
| 6 | Tape "J'ai mémorisé" | FSRS enregistre première note |
| 7 | Confirmation + prochain intervalle | Retour à l'accueil, statut "En cours" |

### CU-3 : Révision FSRS
| Étape | Action | Résultat |
|-------|--------|----------|
| 1 | Badge "3 versets à réviser" sur Accueil | L'utilisateur voit notification |
| 2 | Lance session de révision | ReviewQueueScreen |
| 3 | Verset présenté partiellement caché | Mode rappel actif |
| 4 | Tape pour révéler + évalue | Again/Hard/Good/Easy |
| 5 | FSRS calcule nouvel intervalle | MemorizationRecord mis à jour |
| 6 | Session terminée | Résumé avec stats |

### CU-4 : Suivi de progression
| Étape | Action | Résultat |
|-------|--------|----------|
| 1 | Onglet "Progression" | Dashboard stats |
| 2 | Voir StatsGrid | 4 métriques clés |
| 3 | Scroll vers graphiques | Hebdo chart |
| 4 | Scroll vers listes | Versets par statut |

---

## 3. User Stories MVP

### US-1 : Choisir sa langue et traduction
> **EN TANT QUE** nouvel utilisateur  
> **JE VEUX** choisir la langue de l'interface ET la traduction biblique au démarrage  
> **AFIN DE** avoir l'app personnalisée selon mes préférences  

**Critères d'acceptation:**
- [ ] Écran onboarding avec sélection langue UI (au moins 5 langues)
- [ ] Écran suivant avec sélection traduction biblique
- [ ] Les deux sélections sont persistées localement (MMKV)
- [ ] LSG sélectionnée par défaut
- [ ] Support RTL automatique si arabe sélectionné
- [ ] Au second lancement, skip onboarding si déjà configuré

### US-2 : Parcourir et sélectionner un verset
> **EN TANT QUE** utilisateur  
> **JE VEUX** parcourir les livres, chapitres et versets de la Bible  
> **AFIN DE** trouver le verset que je veux mémoriser  

**Critères d'acceptation:**
- [ ] Navigation : Livres → Chapitres → Liste des versets
- [ ] Recherche par référence (ex: "Jean 3:16", "Psaume 23")
- [ ] Affichage du texte complet du verset
- [ ] Indicateur de statut mémorisation (nouveau/en cours/maîtrisé)
- [ ] Tous les 66 livres affichés groupés par testament
- [ ] Le LSG est la seule traduction chargée au MVP

### US-3 : Session de mémorisation interactive
> **EN TANT QUE** utilisateur  
> **JE VEUX** mémoriser un verset de manière interactive  
> **AFIN DE** le retenir durablement grâce à l'effort actif de rappel  

**Critères d'acceptation:**
- [ ] Aperçu du verset complet pendant 10 secondes
- [ ] Masquage progressif mot par mot (placeholders gris)
- [ ] Mode tap-to-reveal sur chaque mot
- [ ] Indicateur de progression visuel (X mots révélés / Y total)
- [ ] Validation : "J'ai mémorisé" OU "Besoin de plus de temps"
- [ ] Feedback visuel immédiat après validation
- [ ] Session ne dure pas plus de 2 minutes par verset
- [ ] Zéro logique métier dans le composant écran

### US-4 : Révision pilotée par FSRS
> **EN TANT QUE** utilisateur  
> **JE VEUX** recevoir des rappels de révision au moment optimal  
> **AFIN DE** maximiser ma rétention sans effort inutile  

**Critères d'acceptation:**
- [ ] FSRS calcule l'intervalle optimal après chaque révision
- [ ] File d'attente triée par urgence (overdue > scheduled > upcoming)
- [ ] Interface de révision dédiée présentée verset par verset
- [ ] Après chaque réponse, FSRS met à jour stabilité, difficulté, intervalle
- [ ] Prochain intervalle affiché à l'utilisateur
- [ ] Moteur WASM chargé au démarrage, fallback SM-2 JS en cas d'échec
- [ ] Historique complet de chaque révision conservé

### US-5 : Suivi de progression
> **EN TANT QUE** utilisateur  
> **JE VEUX** voir ma progression globale  
> **AFIN DE** rester motivé et visualiser mon engagement  

**Critères d'acceptation:**
- [ ] Compteur de versets mémorisés (par statut: nouveau, en cours, maîtrisé)
- [ ] Série de jours consécutifs (streak) affichée avec animation
- [ ] Graphique de révision hebdomadaire
- [ ] Taux de rétention calculé et affiché
- [ ] Sections: versets récents, à renforcer, maîtrisés

### US-6 : Paramètres
> **EN TANT QUE** utilisateur  
> **JE VEUX** modifier mes préférences à tout moment  
> **AFIN DE** adapter l'app à mes besoins évolutifs  

**Critères d'acceptation:**
- [ ] Changer la langue de l'interface (sans redémarrage)
- [ ] Changer la traduction biblique (sans redémarrage)
- [ ] Option reset progression avec confirmation destructive (texte à taper)
- [ ] Affichage version app et stockage utilisé
- [ ] Lien vers documentation

---

## 4. Exigences Fonctionnelles

| ID | Exigence | Description |
|----|----------|-------------|
| EF-1 | Onboarding | Sélection langue UI + traduction biblique, persistance, RTL auto |
| EF-2 | Navigation Bible | Livres (66) → Chapitres → Versets + recherche par référence |
| EF-3 | Mémorisation interactive | Session word-by-word avec progressive mask + tap-to-reveal |
| EF-4 | Intégration FSRS | Moteur Rust/WASM + fallback JS SM-2 + calcul intervalles |
| EF-5 | Statistiques | Dashboard stats, streak, weekly chart, retention rate |
| EF-6 | Système i18n | 5 langues UI supportées, fallback chain, RTL-aware |

---

## 5. Exigences Non-Fonctionnelles

| ID | Exigence | Critère Mesurable |
|----|----------|-------------------|
| NF-1 | Offline-first | 100% des fonctionnalités MVP sans connexion |
| NF-2 | Performance | Interaction < 200ms de latence perçue |
| NF-3 | Taille application | Fichier APK/IPA < 50MB hors assets médias |
| NF-4 | Compatibilité platefor | iOS 15+, Android API 26+ |
| NF-5 | FSRS disponible | Moteur chargé en < 500ms au démarrage |
| NF-6 | Fiabilité | > 99.5% sessions sans crash |
| NF-7 | Internationalisation | Architecture prête pour 20+ langues UI |
| NF-8 | Accessibilité | WCAG 2.1 AA minimum (contrast ≥ 4.5:1) |

---

## 6. Scope MVP — Inclus

- Onboarding complet (langue + traduction)
- Navigation Bible (livres → chapitres → versets)
- Mémorisation interactive (mot par mot, tap-to-reveal)
- Moteur FSRS intégré (Rust WASM + fallback JS)
- Sessions de révision pilotées FSRS
- Statistiques de progression basiques
- Design system implémenté
- 1 traduction biblique (LSG)
- 5 langues UI (FR, EN, AR, DE, ZH)
- Stockage local (MMKV)
- Support RTL pour arabe

---

## 7. Scope MVP — Hors Scope

| Élément | Planning | Raison |
|---------|----------|--------|
| Sync cloud | V1+ | Complexité inutile pour MVP |
| Partage social | V1+ | Hors sujet principal (mémorisation) |
| Notifications push | V1+ | Fonctionnalité additive, pas fondamentale |
| Audio versets | V1+ | Feature bonus, nécessite assets externes |
| Multimédia | V1+ | Hors scope MVP |
| Communauté | V1+ | Fonctionnalité grande échelle, complexité backend |

---

## 8. Critères de Succès MVP

- [x] Un utilisateur peut compléter l'onboarding en < 60 secondes
- [x] Un utilisateur peut mémoriser son premier verset en < 3 minutes
- [x] Le moteur FSRS calcule les intervalles en < 50ms
- [x] 100% des fonctionnalités MVP fonctionnent offline
- [x] L'app passe la review Apple Store et Google Play
- [x] Zero bug critique ouvert au moment du release

---

## 9. Priorisation Produit (MoSCoW)

| Priorité | Fonctionnalité | Justification |
|----------|---------------|---------------|
| **MUST** | Onboarding complet | Premier contact utilisateur, critique |
| **MUST** | Sélection de verset | Sans verset, pas de mémorisation |
| **MUST** | Session mémorisation interactive | Cœur du produit |
| **MUST** | Moteur FSRS fonctionnel | Différenciateur clé |
| **MUST** | Révisions pilotées FSRS | Boucle complète mémorisation→rétention |
| **MUST** | Stockage local persistant | Offline-first requis |
| **SHOULD** | Statistiques de progression | Motivation utilisateur |
| **SHOULD** | Support RTL (arabe) | Langue MVP requise |
| **SHOULD** | Recherche par référence | UX significativement meilleur |
| **COULD** | Versets favoris | Plutôt V1 |
| **COULD** | Streak / gamification légère | Motivant mais pas critique |
| **WON'T** | Sync cloud | V1+ |
| **WON'T** | Notifications | V1+ |
| **WON'T** | Partage social | V1+ |

---

*Document approuvé. Transmis à l'Agent C (UX Flow) et Agent B (Features).*
