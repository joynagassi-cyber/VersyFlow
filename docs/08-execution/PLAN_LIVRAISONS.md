# VersyFlow — Plan des Livraisons (MVP → v1)

> Document généré par le CEO Multi-Agent

---

## MVP (Release Candidate, fin Sprint 5)

### Fonctionnalités incluses
- Onboarding: langue UI + traduction biblique
- Navigation Bible: 66 livres, chapitres, versets LSG
- Mémorisation interactive: word-by-word reveal, tap-to-reveal
- Moteur FSRS: WASM ou fallback SM-2
- Révisions pilotées FSRS: file triée par urgence, rating Again/Hard/Good/Easy
- Suivi progression: streak, stats basiques, weekly chart
- Paramètres: changer langue/traduction live, reset progress
- i18n: FR, EN, AR, DE, ZH + RTL support
- Design System: rose/frais premium

### Tests
- Unit tests domaines > 90% coverage
- Integration tests services > 70% coverage
- E2E Detox: 10 scenarios passing
- CI pipeline vert

### Qualité
- Tous les écrans < 200ms
- APK < 50MB
- Build iOS et Android fonctionnels
- 0 crash rapporté en internal testing

### Documents mis à jour
- docs/08-execution/: status mis à jour, tâches marquées terminees
- README.md: lien vers documentation complète
- CHANGELOG.md (si applicable)

### Risques residuels
- FSRS pas encore optimisé avec données reelles
- Performance sur devices low-end Android non testés
- Conflits i18n mineurs possibles dans de nouvelles combinaisons langue/translation

---

## Alpha (fin Sprint 2) — Version Interne

### Fonctionnalités incluses
- Onboarding complet
- Bible navigation (66 livres LSG)
- Memorisation interactive (word reveal)
- Moteur FSRS (WASM + fallback SM-2)
- Persistance des donnees (MMKV)

### Tests
- Unit tests domaines > 80% coverage
- Build iOS simulator fonctionne
- Build Android emulator fonctionne

### Qualite
- Session mémorisation lancee en < 3 clics
- FSRS calcule en < 50ms (ou fallback < 100ms)

### Documents
- docs/08-execution/: Sprint 2 marqué complete

### Risques residuels
- Pas d'ecrans de revision
- Pas de statistiques
- Pas de polish animations
- Fallback SM-2 peut être utilisé si WASM échoue

---

## Beta (fin Sprint 4) — Version de Test

### Fonctionnalités incluses
- TOUT le MVP (memorization + review + stats + settings)
- Toutes les micro-interactions
- RTL polish arabe
- Live language/translation change

### Tests
- Unit tests > 90%
- Integration tests > 70%
- 10 E2E tests passing
- Performance audit passe

### Qualite
- Tous les ecrans < 200ms
- Architecture audit clean

### Documents
- Guardian produit rapport architecture final
- docs/08-execution: roadmap finalizee

### Risques residuels
- Bugs edge cases possibles (ex: dates limites, timezone)
- Performance device-specific non testes
- Quelques traductions peut-etre manquantes dans certaines combinaisons

---

## v1.0 (Post-MVP) — Production

### Inclusions
- MVP complet + tous les fixes du beta
- App Store submission ready
- Play Store submission ready

### Hors scope v1.0 (planifies V1+)
- Multi-traductions bibliques (KJV, NIV, etc.)
- Synchronisation cloud
- Notifications push
- Contenu audio
- Fonctionnalites sociales
- Themes UI avances (dark mode)

### Apres v1.0
- Collecter feedback beta testers
- Prioriser bugs reportes
- Planifier V1 features
- Optimiser FSRS weights avec donnees reelles utilisateurs
