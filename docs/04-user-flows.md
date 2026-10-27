# VersyFlow — User Flows Détaillés

## Document généré par Agent C — UX Flow

---

## 1. Flow: Onboarding Complet

```
[App Launch]
    ↓
{Première ouverture?}
    ├─ OUI → [Écran Bienvenue] → [Choix Langue UI] → [Choix Traduction Biblique] → [Accueil]
    └─ NON → [Accueil direct]
```

### Détail écran par écran

#### Écran Bienvenue
- Logo VersyFlow animé
- Tagline "Mémorisation biblique intuitive"
- Bouton "Commencer"
- Délai max: 3 secondes avant bouton visible
- Option Skip pour retour à l'écran onboarding ultérieur

#### Choix Langue Interface
- Grid de cartes avec drapeaux/noms natifs
- Groupé par région (Européen, Moyen-Orient, Asie)
- RTL détecté automatiquement pour l'arabe
- Sélection persistée dans settings.language
- Navigation vers écran traduction ou Accueil si déjà configuré

#### Choix Traduction Biblique
- Liste des traductions disponibles
- LSG sélectionnée par défaut
- Description de chaque traduction (année, style, accessibilité)
- Bouton "Continuer" disabled tant qu'une sélection n'est pas faite
- Persistance dans settings.bibleTranslation

### Cas d'erreur
- Si utilisateur quitte onboarding → onboarding montré à prochain lancement
- Si langue non disponible → fallback FR puis EN
- Si traduction non téléchargée → auto-download puis continue

---

## 2. Flow: Mémorisation d'un Nouveau Verset

```
[Accueil]
    ↓
[Taper "Explorer" ou sélectionner verset rapide]
    ↓
[Vue Liste Livres] → [Taper Livre] → [Vue Chapitres] → [Taper Chapitre] → [Vue Versets]
    ↓
[Choisir verset spécifique OU "Verset Aléatoire"]
    ↓
[Aperçu du verset + statut mémorisation]
    ↓
[Taper "Mémoriser ce verset"]
    ↓
[Session Mémorisation — Mot par Mot]
    ↓
[Progressif: mots révélés un par un]
    ↓
[Utilisateur tape sur mots pour les révéler]
    ↓
{Tous mots révélés + utilisateur confirmé}
    ↓
[FSRS: première note] → [Confirmation] → [Retour Accueil]
```

### Étape par étape

1. **Depuis Accueil** → l'utilisateur tape sur l'onglet "Explorer"
2. **Navigation Bible** → parcourt livres → chapitres → versets (voir Flow 3)
3. **Sélection verset** → voit le texte complet + statut (Nouveau/En cours/Maîtrisé)
4. **Lance mémorisation** → tape "Mémoriser ce verset"
5. **Mode preview** → voit le verset complet pendant 10 secondes
6. **Masquage progressif** → les mots deviennent des placeholders gris
7. **Tap-to-reveal** → tape sur chaque mot pour le voir
8. **Validation** → tape "J'ai mémorisé" ou "Besoin de plus de temps"
9. **FSRS initial** → si validé, FSRS calcule le premier état
10. **Retour Accueil** → le verset passe au statut "En cours"

### Cas d'erreur
- Session interrompue → progression sauvegardée, reprend au même mot
- Retour/arrière pendant session → demande confirmation ("Quitter sans mémoriser?")

---

## 3. Flow: Navigation Biblique

```
[Accueil] → [Onglet Explorer]
    ↓
[Vue: 66 Livres groupés Ancien/Nouveau Testament]
    ↓
[Taper un livre, ex: "Jean"]
    ↓
[Vue: Chapitres 1-21 avec nombres de versets]
    ↓
[Taper un chapitre, ex: "3"]
    ↓
[Vue: Versets Jean 3:1 → Jean 3:36 avec texte complet]
    ↓
[Taper un verset spécifique]
    ↓
[Carte Verset détaillée: texte + référence + statut]
    ↓
[Boutons: Mémoriser | Favoris | Réviser]
```

### Détail des états de navigation

**État 1: Liste des Livres**
- 2 sections: Ancien Testament (39 livres), Nouveau Testament (27 livres)
- Chaque livre: nom + nombre de chapitres
- Recherche rapide par nom ou abrégé

**État 2: Liste des Chapitres**
- Grille de chapitres avec numéro + nombre de versets
- Chapitres avec versets déjà mémorisés indicator visuel
- Filtrage possible par nombre de versets

**État 3: Liste des Versets**
- Verset par verset avec texte complet
- Indicateur de statut mémorisation en bord gauche
- Barre de recherche par numéro de verset
- Option "verset aléatoire"

**État 4: Carte Verset Détaillée**
- Texte complet affiché en grand
- Référence claire
- Statut de mémorisation
- Historique de révision (si verset déjà mémorisé)
- Actions: mémoriser, favori, réviser, partager (futur)

---

## 4. Flow: Révision FSRS

```
[Accueil] → [Badge "X versets à réviser"] → [Écran Révisions]
    ↓
[File d'attente FSRS triée par Urgence]
    ↓
{Y a-t-il des révisions?}
    ├─ OUI → [Premier verset de la file]
    │         ↓
    │     [Mode Rappel Actif — texte caché partiellement]
    │         ↓
    │     [Utilisateur répond/tape/révèle]
    │         ↓
    │     [FSRS évalue la réponse]
    │         ↓
    │     [FSRS calcule nouvel intervalle]
    │         ↓
    │     {Réponse?}
    │         ├─ Correct facile → [Interval × 1.5 approx] → Prochain
    │         ├─ Correct moyen → [Interval × 1.2 approx] → Prochain
    │         ├─ Incorrect → [Reset interval + révision rapprochée] → Prochain
    │         └─ Difficile → [Interval × 0.8 approx, fréquence augmentée] → Prochain
    │
    └─ NON → [Écran "Tout est à jour! ✓"] → [Statistiques session]
```

### Critère d'urgence FSRS
Les versets sont triés par ordre de priorité:
1. **Overdue** (en retard) — date de révision dépassée
2. **Scheduled** (à jour mais bientôt) — révision prévue dans les 24h
3. **New** (prochains) — sous les 48h

### Détail de chaque révision

1. **Présentation verset** → texte partiellement masqué (rappel actif)
2. **L''utilisateur réfléchit** → peut tap-to-revel pendant 30s max
3. **Auto-révélation** → si 30s sans réponse, verset révélé
4. **Auto-évaluation** → l'utilisateur choisit: Correct / Presque / Incorrect
5. **FSRS update** → calcul nouveau stabilité, difficulté, intervalle
6. **Feedback** → affiche le prochainInterval prédit
7. **Suivant** → passe au verset suivant dans la file

### Cas d'erreur
- Session interrompue → progression sauvegardée, reprend au verset suivant
- Moteur FSRS indisponible → fallback SM-2 en JS (journalisé)

---

## 5. Flow: Écran Progression

```
[Accueil] → [Onglet "Progression"]
    ↓
[Dashboard Stats]
    ├─ Total versets mémorisés: XX
    ├─ En cours: YY
    ├─ À réviser: ZZ
    ├─ Streak: XX jours 🔥
    └─ Taux de rétention: XX%
    ↓
[Graphique Hebdomadaire] (bar chart des sessions par jour)
    ↓
[Section: Versets Récents] (derniers mémorisés)
[Section: Versets à Renforcer] (stabilité faible)
[Section: Versets Maîtrisés] (stabilité élevée)
```

---

## 6. Flow: Paramètres

```
[Accueil] → [Onglet "Paramètres"]
    ↓
[Menu Settings]
    ├─ 🌐 Langue de l'interface → [LanguagePickerScreen]
    ├─ 📖 Traduction Biblique → [TranslationPickerScreen]
    ├─ 🎨 Apparence → [À venir: ThemePickerScreen]
    ├─ 🔔 Notifications → [À venir: NotificationSettings]
    ├─ 💾 Données & Stockage → [StorageInfoScreen]
    ├─ ℹ️ À propos → [AboutScreen]
    └─ 🗑️ Réinitialiser la progression → [ConfirmModal → Reset]
```

### Sous-flow: Réinitialisation progressive
1. Tape "Réinitialiser la progression"
2. Modal destructive apparaît: "Êtes-vous sûr? Cela supprimera TOUS vos versets mémorisés et historiques de révision."
3. Champ texte obligatoire: taper "SUPPRIMER" pour confirmer
4. Bouton "Confirmer" activé uniquement quand le texte correspond
5. Après confirmation: toast "Progression réinitialisée" + redirect Accueil

---

## 7. Flow: Cas d'Erreur et Reprise

### Sans connexion internet
→ **Behavior**: Rien ne se passe de visible. L'app fonctionne 100% offline. Aucun error message nécessaire.

### Corruption base de données locale
→ **Recovery**: Auto-backup vérifié au démarrage. Si corruption détectée: propose restoration depuis backup.

### Moteur FSRS indisponible (échec chargement WASM)
→ **Fallback**: Algorithme SM-2 simplifié intégré en JS comme fallback temporaire. Logguer l'event.

### Traduction biblique non trouvée
→ **Recovery**: Reset à LSG par défaut. Message utilisateur: "Traduction réinitialisée à LSG".

### Verset référencé introuvable
→ **Recovery**: Toast "Verset non disponible dans cette traduction" + redirect vers liste des chapitres.

### Erreur de navigation (écran inexistant)
→ **Recovery**: Redirection automatique vers Accueil + log d'erreur.

---

*Document approuvé. Transmis à l'Agent D (UI/Design System) pour spécification des écrans.*
