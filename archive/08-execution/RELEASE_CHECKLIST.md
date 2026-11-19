# VersyFlow — QA Checklist & Release Checklist

> Document généré par le CEO Multi-Agent

---

## QA Checklist

### Avant chaque Sprint (Internal QA)

| Check | Qui | Quand |
|-------|-----|-------|
| Tous les tests passent (typecheck + lint + test) | CI automatique | À chaque commit |
| Couverture domaine >= 90% | Guardian | Fin de Sprint 2 et Sprint 4 |
| Couverture service >= 70% | Guardian | Fin de Sprint 4 |
| Zéro anti-pattern détecté | Guardian | Hebdomadaire |
| 100% des textes ont clé i18n | Translator + Herald | Fin de chaque sprint UI |
| Build iOS fonctionne | Forge | Chaque fin de sprint |
| Build Android fonctionne | Forge | Chaque fin de sprint |

### Avant Beta Release (Sprint 5)

| Check | Status | Notes |
|-------|--------|-------|
| E2E tests: 10 scenarios passing | [ ] |Voir 18-test-strategy.md section E2E |
| APK < 50MB | [ ] | Build production |
| IPA passe TestFlight | [ ] | Build production |
| Zero crash en internal testing | [ ] | Crashlytics ou équivalent |
| Tous les écrans < 200ms | [ ] | Performance audit |
| RTL arabe vérifié manuellement | [ ] | Par agent Herald ou humain |
| Offline mode fonctionne | [ ] | Réseaux désactivé, tester tous flows |
| Switch language live (sans restart) | [ ] | FR -> EN -> AR -> DE -> ZH |
| Switch translation live | [ ] | LSG -> changement -> retour LSG |
| Reset progress destructif fonctionnel | [ ] | Avec confirmation texte |
| Streak calcule correctement gap | [ ] | Simuler plusieurs jours |
| Review queue trie correctement | [ ] | Overdue > Today > Upcoming |
| FSRS intervalles corrects | [ ] | Comparer avec outputs connus SM-2 |
| LSG.json valide (66 livres, 31102 versets) | [ ] | Zod validation |
| App Store screenshots prêts | [ ] | iOS + Android |
| Privacy policy documentée | [ ] | Guardian |

---

## Release Checklist

### Alpha (fin Sprint 2)

**Fonctionnalités incluses:**
- Onboarding complet
- Bible navigation (66 livres, recherche)
- Mémorisation interactive (word reveal)
- FSRS moteur (WASM ou Fallback)
- Persistances des données

**Tests:**
- Unit tests domains > 80%
- Build iOS/Android fonctionnels
- Zéro crash critique

**Documents mis à jour:**
- Aucun (docs specs figées)
- docs/08-execution/ si changements roadmap

**Risques residuels:**
- FSRS non optimisé (fallback SM-2 possible)
- Pas d'écran de révision
- Pas de statistiques

---

### Beta (fin Sprint 4)

**Fonctionnalités incluses:**
- Tout le MVP: onboarding, bible nav, memorization, review, stats, settings
- Tous les tests E2E passent
- Performance < 200ms
- RTL arabe polish

**Tests:**
- Unit tests domains > 90%
- Integration tests services > 70%
- 10 E2E tests passing
- CI pipeline vert

**Documents mis à jour:**
- Aucun changement docs specs
- Guardian produit rapport d'architecture final

**Risques residuels:**
- Bugs edge cases possibles
- Performance sur devices low-end inconnue
- Conflits i18n résiduels possibles

---

### Release Candidate (fin Sprint 5)

**Fonctionnalités incluses:**
- 100% du scope MVP

**Tests:**
- Tous les checks QA list ci-dessus passes
- TestFlight + Play Console Internal beta distribué
- 0 crash rapporté en beta testing interne

**Documents mis à jour:**
- README.md avec lien vers docs complètes
- CHANGELOG.md (si existe)

**Risques residuels:**
- Bugs UI mineurs possibles (non bloquants)
- Performance device-specific non testés

---

### v1.0 (Post-MVP)

**Inclus:**
- MVP complet + fixes beta
- App Store / Play Store submissions

**Non-inclus (V1+):**
- Multi-traductions bibliques
- Sync cloud
- Notifications push
- Audio versets
- Fonctionnalités sociales
- Thèmes avancés

**Après v1.0:**
- Collecter feedback beta testers
- Prioriser bugs Reportes
- Planifier V1 features (docs V1+)
- Optimiser FSRS weights avec données reales
