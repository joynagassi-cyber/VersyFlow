# VersyFlow — Quality Gates Specification

> Les portes de qualité qui filtrent chaque PR/commit
> Application: docs/17-workflows-systeme.md, docs/08-execution/DEFINITION_OF_READY_AND_DONE.md

---

## 1. Les 10 Quality Gates

Chaque feature/PR doit passer TOUS les gates pour etre merge.

### Gate 1 — Documentation
**Responsable:** Guardian
- [ ] Doc spec existe avant le code
- [ ] Doc spec matche l'implémentation
- [ ] DECISION_LOG.md mis à jour si decision architecturale

### Gate 2 — Architecture
**Responsable:** Guardian
- [ ] Respecte la separation des couches (09-architecture.md)
- [ ] Pas de dependances interdites
- [ ] Interface/Adapter pattern respecte
- [ ] Aucune logique metier dans components

### Gate 3 — Compilation
**Responsable:** CI automatique
- [ ] `tsc --noEmit` passe vert
- [ ] TypeScript strict mode respected
- [ ] Pas de `any` non intentionnel

### Gate 4 — Lint
**Responsable:** CI automatique
- [ ] ESLint passe sans error ni warning
- [ ] Prettier format applique
- [ ] Import direction respects rules

### Gate 5 — Types
**Responsable:** Anvil + CI
- [ ] Tous les types exportes barrel
- [ ] Pas de type any non justifie
- [ ] Generics utilises quand pertinent

### Gate 6 — Tests
**Responsable:** Anvil + CI
- [ ] Couverture domaine ≥ 90%
- [ ] Couverture service ≥ 70%
- [ ] Tests passes sur CI
- [ ] Pas de test.skip en production

### Gate 7 — Performance
**Responsable:** Scribe + Herald
- [ ] Screen load < 200ms
- [ ] Bundle size stable (pas d'augmentation > 5%)
- [ ] Pas de memory leaks detectes

### Gate 8 — Accessibilité
**Responsable:** Herald
- [ ] Contraste conforme WCAG 2.1 AA
- [ ] Touch targets ≥ 44x44pt
- [ ] Dynamic type support
- [ ] VoiceOver/TalkBack labels presents

### Gate 9 — i18n
**Responsable:** Translator + Herald
- [ ] Tous les textes visibles ont une cled t()
- [ ] Pas de hardcoded string visible
- [ ] RTL verification pour arabe
- [ ] Pluralisation correcte

### Gate 10 — Validation Produit
**Responsable:** Guardian + Forge
- [ ] Feature correspond au PRD spec
- [ ] Teste manuellement sur device/emulateur
- [ ] UX conforme au design system

---

## 2. Gate Automation Levels

| Gate | Automatique | Manuel | Hybrid |
|------|------------|--------|--------|
| Documentation | Partial | Guardian | Review doc vs code |
| Architecture | ESLint rules | Guardian | Cross-check |
| Compilation | **Full auto** | - | tsc --noEmit |
| Lint | **Full auto** | - | ESLint + Prettier |
| Types | **Full auto** | - | TypeScript strict |
| Tests | **Full auto** | - | Jest coverage |
| Performance | Partial | Scribe | Benchmarks |
| Accessibilité | Partial | Herald | Manual check |
| i18n | **Full auto** | - | grep hardcoded strings |
| Validation produit | - | Guardian | Manual review |

---

## 3. Gate Fail Handling

Si un gate echoue:
1. Agent responsible recoit notification automatique
2. Correction demandee avec explication precise
3. Retry possible 3x max
4. Si > 3 retries → escalation humain/Guardian

---

*Ces gates sont appliquees par le CI pipeline (.github/workflows/ci.yml).*
