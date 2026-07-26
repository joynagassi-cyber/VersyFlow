# VersyFlow — Risk Register

> Document généré par le CEO Multi-Agent
> Chaque risque est classé par probabilité (Faible/Moyen/Eleve) et impact (Mineur/Moyen/Critique).

---

## Risques Identifiés

### R-001: Échec compilation WASM Rust
| Champ | Valeur |
|-------|--------|
| Probabilité | Faible |
| Impact | CRITIQUE |
| Détecté en | Sprint 0 |
| Mitigation | Fallback SM-2 JS existe déjà (Scribe implémente en parallèle) |
| Owner | Forge |
| Statut | OUVERT |

**Détail**: Si le compilateur Rust/WASM échoue à produire un module fonctionnel, tout le moteur FSRS est bloqué.
**Plan B**: Utiliser exclusivement FallbackEngine SM-2 JavaScript. L'application fonctionne correctement, juste moins précise dans les prédictions FSRS.
**Action**: Forge commence Scribe FallbackEngine EN PARALLELE dès Sprint 0 pour avoir un backup prêt.

---

### R-002: Fichier LSG.json incomplet ou corrompu
| Champ | Valeur |
|-------|--------|
| Probabilité | Moyen |
| Impact | CRITIQUE |
| Détecté en | Sprint 1 |
| Mitigation | Zod validation au load, fallback LSG par défaut, structure JSON bien définie |
| Owner | Scribe |
| Statut | OUVERT |

**Détail**: Le fichier LSG contient ~31,102 versets. Erreur de structure = bible navigation cassée.
**Plan B**: Reset automatique à LSG par défaut (comme défini dans user flows section cas d'erreur).
**Action**: Scribe valide chaque livre individuellement pendant la construction. Anvil écrit tests Zod.

---

### R-003: RTL breaks layouts en production
| Champ | Valeur |
|-------|--------|
| Probabilité | Moyen |
| Impact | MOYEN |
| Détecté en | Sprint 1 |
| Mitigation | Tests arabe dès Sprint 1, polish continu, utilisation logical properties (marginStart/paddingEnd) |
| Owner | Herald |
| Statut | OUVERT |

**Détail**: I18nManager.forceRTL() ne mirror pas tout automatiquement. Certains layouts peuvent se briser.
**Plan B**: Désactiver temporairement support RTL, fix avant beta release.
**Action**: Herald teste arabe après chaque écran nouveau. Translator vérifie que textes arabes ne dépassent pas les conteneurs.

---

### R-004: Tests E2E flaky (instables)
| Champ | Valeur |
|-------|--------|
| Probabilité | Moyen |
| Impact | MOYEN |
| Détecté en | Sprint 4 |
| Mitigation | Prioriser unitaires sur E2E, E2E seulement pour flows critiques (10 scenarios max) |
| Owner | Anvil |
| Statut | OUVERT |

**Détail**: Detox tests sont sensibles aux timing issues sur émulateurs.
**Plan B**: Réduire nombre de tests E2E, garder uniquement les plus critiques.
**Action**: Anvil write E2E tests avec waits explicites (pas de hardcoded timeouts). Guardian audit coverage realiste.

---

### R-005: Performance degrade avec beaucoup de versets
| Champ | Valeur |
|-------|--------|
| Probabilité | Faible |
| Impact | MOYEN |
| Détecté en | Sprint 1+ |
| Mitigation | FlashList/FlatList virtualisés dès Sprint 1 pour Bible nav |
| Owner | Herald + Scribe |
| Statut | OUVERT |

**Détail**: Charger 31,102 versets en mémoire sans virtualisation peut causer des lag/s crashes sur devices low-end (Android API 26).
**Plan B**: Lazy loading des chapitres (ne charger que le chapitre affiché, pas toute la Bible en mémoire).
**Action**: Herald utilise FlashList pour VerseListScreen. Scribe preload chapitres en arrière-plan.

---

### R-006: Conflits inter-agents sur fichiers communs
| Champ | Valeur |
|-------|--------|
| Probabilité | Très faible |
| Impact | Mineur |
| Détecté en | Toujours (potentiel) |
| Mitigation | Matrice MODULE_OWNERSHIP.md — chaque fichier appartient à UN seul agent |
| Owner | Guardian |
| Statut | OUVERT (monitoring continu) |

**Détail**: Malgré les ownerships exclusifs, un agent peut accidentellement modifier le dossier d'un autre.
**Plan B**: Guardian détecte via audits hebdomadaires et rapporte dans docs/08-execution/CONFLICT_REPORT.md.
**Action**: Guardian scanne les modifications chaque sprint. CI pipeline check files modified per PR.

---

### R-007: Traductions incomplètes ou incohérentes
| Champ | Valeur |
|-------|--------|
| Probabilité | Moyen |
| Impact | Mineur |
| Détecté en | Sprint 1-4 |
| Mitigation | Translator review final Sprint 4, Herald vérifie coverage t() calls |
| Owner | Translator |
| Statut | OUVERT |

**Détail**: Les 5 fichiers .json doivent avoir exactement les mêmes clés. Une clé manquante = fallback chain activé = texte dans la mauvaise langue.
**Plan B**: Fallback EN → FR → key itself. L'app ne se brise pas, juste UX dégradée.
**Action**: Translator vérifie alignement des clés entre fichiers. Herald vérifie que tous les textes ont une clé.

---

### R-008: FSRS calculations incorrectes (bugs algorithme)
| Champ | Probabilité |
|-------|--------|
| Impact | CRITIQUE |
| Détecté en | Sprint 2 |
| Mitigation | MockFsrsEngine aligné sur comportement SM-2 connu, tests unitaires par valeur connue |
| Owner | Anvil + Scribe |
| Statut | OUVERT |

**Détail**: Si FSRS calcule mal les intervalles, l'expérience utilisateur se dégrade (rappels trop fréquents ou trop rares).
**Plan B**: Fallback SM-2 donne des résultats prédictibles et testés.
**Action**: Anvil écrit tests avec valeurs connues SM-2 pour validation. Scribe compare outputs WASM vs SM-2.

---

### R-009: Streak calculation faux à minuit / changements timezone
| Champ | Valeur |
|-------|--------|
| Probabilité | Faible |
| Impact | Mineur |
| Détecté en | Sprint 3 |
| Mitigation | Test edge case timezone explicite, utilise date locale utilisateur |
| Owner | Scribe |
| Statut | OUVERT |

**Détail**: Si l'utilisateur change de timezone ou traverse la ligne de changement de date, le streak peut être calculé faux.
**Plan B**: Utiliser la date locale device, pas UTC. Un streak "perdu" par timezone shift est mineur.
**Action**: Scribe code streak avec normalizeDate(local) et teste les cas limites (midnight +/- 1 minute).

---

### R-0010: App Store / Play Store rejection
| Champ | Valeur |
|-------|--------|
| Probabilité | Faible |
| Impact | CRITIQUE |
| Détecté en | Sprint 5 |
| Mitigation | Privacy policy documentée, conformité guidelines Apple/Google vérifiée |
| Owner | Guardian + Herald |
| Statut | OUVERT |

**Détail**: Rejection could delay MVP launch significantly. Common reasons: permissions, content policy, privacy.
**Plan B**: Submit with minimal feature set, iterate after approval.
**Action**: Guardian prépare privacy policy + terms. Herald ensures no forbidden patterns in UI.

---

## Résumé des Risques

| Niveau d'impact | CrITIQUE | MOYEN | Mineur | Total |
|----------------|---------|-------|--------|-------|
| Probabilité Elevée | 0 | 0 | 0 | 0 |
| Probabilité Moyen | 2 (R-002, R-008) | 2 (R-003, R-004) | 1 (R-007) | 5 |
| Probabilité Faible | 1 (R-001) | 1 (R-005) | 1 (R-009) | 3 |
| Probabilité Tres faible | 0 | 0 | 1 (R-006) | 1 |
| **Total** | **3** | **3** | **3** | **9** |

**Risques critiques**: 3 (R-001 WASM, R-002 LSG.json, R-010 App Store)
**Mitigation prioritaire**: R-001 (Forge+Scribe parallel), R-002 (Zod validation), R-010 (Privacy policy early)

---

*Ce registre est mis à jour hebdomadairement par Guardian.*
