# VersyFlow — Test Strategy

## Architecture de test pour un produit critique (mémorisation Bible + FSRS)

---

## 1. Principes Fondamentaux

### R-T1 : Tests au service de la confiance, pas de la couverture
Chaque test doit correspondre à un comportement utilisateur ou une règle métier. Un test qui vérifie l'implémentation interne sans valeur externe est un test mort.

### R-T2 : Le pyramid testing s'applique strictement
```
       /\
      /  \        E2E Tests (Detox) — max 10%
     /____\       Integration Tests — ~20%
    /      \      Unit Tests — ~70%
   /________\
```

### R-T3 : Tester les contracts, pas les implémentations
Tester que `IFsrsEngine.review()` retourne un `FsrsState` correct, pas comment le Rust le calcule.

### R-T4 : Pas de test sans scénario utilisateur
Chaque test mapping soit à une user story (PRD §3) soit à une exigence non fonctionnelle (PRD §5).

---

## 2. Stratégie par Couche

### 2.1 Domaine Layer (`src/domains/`) — ~80% des tests

C'est LA couche la plus critique à tester. C'est ici que réside toute la logique métier.

#### Tests Bible Domain

| Test ID | Ce qu'on teste | Couverture |
|---------|---------------|------------|
| `bible/parser/reference/resolves_standard` | "Jean 3:16" → `{bookId:'joh', chapter:3, verse:16}` | MUST |
| `bible/parser/reference/resolves_abbreviation` | "Jn 3:16" → `{bookId:'joh', chapter:3, verse:16}` | MUST |
| `bible/parser/reference/handles_ranges` | "Jean 3:16-18" → `{verseEnd:18}` | SHOULD |
| `bible/parser/reference/rejects_invalid` | "Jean 99:1" → `null` | MUST |
| `bible/parser/reference/cases_insensitive` | "jean 3:16" → same as "Jean 3:16" | SHOULD |
| `bible/translation/registry/loads_all_books` | LSG has exactly 66 books | MUST |
| `bible/translation/registry/localizes_names` | `getBooksForUiLanguage('lsg','fr')` → French names | MUST |
| `bible/translation/registry/falls_back_en` | Missing 'fr' name → returns 'en' | SHOULD |
| `bible/translation/registry/validates_chapter_count` | Genesis = 50 chapters, Revelation = 22 | MUST |
| `bible/search/index/builds_word_index` | "commencement" maps to Gen 1:1 | SHOULD |
| `bible/search/index/resolve_by_reference_map` | "gen 1:1" → exact verse in index | MUST |

#### Tests FSRS Domain

| Test ID | Ce qu'on teste | Couverture |
|---------|---------------|------------|
| `fsrs/engine/new_state_defaults` | `newState(0)` returns stability=1, difficulty=5 | MUST |
| `fsrs/engine/review_again_decreases_stability` | Rating AGAIN → stability < previous | MUST |
| `fsrs/engine/review_easy_increases_interval` | Rating EASY → interval > previous | MUST |
| `fsrs/engine/review_hard_moderate_increase` | Rating HARD → interval increase < GOOD | MUST |
| `fsrs/engine/stability_never_negative` | Any rating → stability >= 0 | MUST |
| `fsrs/engine/difficulty_bounds_0_to_10` | Any rating → difficulty in [0, 10] | MUST |
| `fsrs/engine/repetition_increments` | Each review → repetitions++ | MUST |
| `fsrs/engine/predictable_first_review` | New verse + GOOD → interval = 1 day | MUST |
| `fsrs/engine/consecutive_good_increases_interval` | 5x GOOD → interval grows non-linearly | MUST |
| `fsrs/engine/fallback_sm2_matches_classic` | FallbackEngine output close to known SM-2 results | SHOULD |

#### Tests Memorization Domain

| Test ID | Ce qu'on teste | Couverture |
|---------|---------------|------------|
| `mem/session/start_creates_record` | New session creates MemorizationRecord with status 'new' | MUST |
| `mem/session/validate_complete_recall` | All words revealed correctly → status 'in-progress' | MUST |
| `mem/session/validate_partial_recall` | Some words wrong → status 'in-progress', higher difficulty | SHOULD |
| `mem/session/expired_session_resets` | Session > 5 min → auto-reset (future behavior spec) | WON'T |
| `mem/record/status_transitions` | new → in-progress → mastered (stability > 30 days) | MUST |

### 2.2 Service Layer (`src/services/`) — ~15% des tests

Services orchestrent les domaines + storage. Tests d'intégration légers.

| Test ID | Ce qu'on teste | Couverture |
|---------|---------------|------------|
| `bible_service/load_book_caches_in_storage` | `getBookById()` caches result in MMKV | MUST |
| `bible_service/search_reference_returns_verse` | `searchByReference('joh 3:16')` returns correct verse | MUST |
| `fsrs_service/schedule_updates_next_review_at` | `scheduleNextReview()` sets correct timestamp | MUST |
| `fsrs_service/uses_correct_engine` | Production uses WasmEngine, test can swap to MockEngine | MUST |
| `settings_service/persists_language_change` | `setLanguage('ar')` persists to MMKV | MUST |
| `settings_service/applies_rtl_flag` | Setting AR language triggers RTL direction | SHOULD |
| `progress_service/calculates_streak_correctly` | Consecutive days → streak increments correctly | MUST |
| `progress_service/resets_on_gap` | 2-day gap → streak resets to 0 | MUST |

### 2.3 Infrastructure Layer — ~5% des tests

Tests de contrats d'interfaces, pas d'implémentations tierces.

| Test ID | Ce qu'on teste | Couverture |
|---------|---------------|------------|
| `storage/mmkv/write_and_read` | MMKV stores and retrieves JSON correctly | MUST |
| `storage/mmkv/handles_large_payloads` | Stores 500 KB MemorizationRecords without error | SHOULD |
| `storage/fallback_asyncStorage` | AsyncStorage adapter matches IStorage contract | MUST |
| `rust/wasm_loader/retries_on_failure` | 3 retries with exponential backoff | MUST |
| `rust/wasm_loader/fallsback_to_sm2` | After N failures → switches to FallbackEngine | MUST |
| `logging/logger/serializes_events` | DomainEvent serialized to JSON correctly | SHOULD |

---

## 3. Stratégie de Mocking

### Mock Engine FSRS

Pendant les tests, NE JAMAIS charger le vrai WASM. Toujours utiliser un mock:

```typescript
// tests/mocks/fsrs-mock.ts
import { IFsrsEngine, FsrsState, FsrsReview, Rating } from '@/domains/fsrs';

export class MockFsrsEngine implements IFsrsEngine {
  private callCount = 0;
  
  newState(): FsrsState {
    return { stability: 1, difficulty: 5, elapsedDays: 0, repetitions: 0 };
  }
  
  review(state: FsrsState, rating: Rating): FsrsReview {
    this.callCount++;
    
    const multiplier = rating === 4 ? 3.0 : rating === 3 ? 1.5 : rating === 2 ? 1.2 : 0.1;
    const newInterval = Math.max(1, Math.round(state.stability * multiplier));
    
    return {
      state: {
        ...state,
        stability: newInterval,
        difficulty: Math.max(0, Math.min(10, state.difficulty + (rating - 2.5) * 0.5)),
        elapsedDays: newInterval,
        repetitions: state.repetitions + 1,
      },
      due: new Date(Date.now() + newInterval * 86400000),
      stability: newInterval,
      difficulty: state.difficulty,
      elapsedDays: newInterval,
      scheduledDays: newInterval,
      recurring: true,
    };
  }
}
```

### Mock Storage

```typescript
// tests/mocks/storage-mock.ts
import { IStorage } from '@/infrastructure/storage';

export class InMemoryStorage implements IStorage {
  private store = new Map<string, string>();
  
  get(key: string): Promise<string | null> {
    return Promise.resolve(this.store.get(key) ?? null);
  }
  
  set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
    return Promise.resolve();
  }
  
  delete(key: string): Promise<void> {
    this.store.delete(key);
    return Promise.resolve();
  }
  
  getAllKeys(): Promise<string[]> {
    return Promise.resolve([...this.store.keys()]);
  }
}
```

### Règles de Mocking
1. **Jamais mock de domaines** — Les domaines sont de la logique pure, ils doivent être testés réellement
2. **Toujours mock d'infrastructure** — Storage, WASM, network → toujours mocks
3. **Mocks doivent respecter les contrats** — Un mock qui ne respecte pas l'interface cache des bugs

---

## 4. Critères de Couverture Minimale

| Couche | Ligne Coverage | Branch Coverage | Domain Events Covered |
|--------|---------------|-----------------|----------------------|
| `src/domains/bible/` | ≥ 90% | ≥ 85% | N/A |
| `src/domains/fsrs/` | ≥ 95% | ≥ 90% | N/A |
| `src/domains/memorization/` | ≥ 90% | ≥ 85% | N/A |
| `src/domains/i18n/` | ≥ 85% | ≥ 80% | N/A |
| `src/services/` | ≥ 70% | ≥ 60% | Must test all service methods |
| `src/infrastructure/` | ≥ 50% | ≥ 40% | Only contract tests required |

> **Règle :** PR refusée si la nouvelle code adds < 80% de coverage dans le fichier concerné.

---

## 5. Tests d'Intégration

### Test: Full Memorization Flow (integration)

```typescript
describe('Integration: Full Memorization Flow', () => {
  let store: InMemoryStorage;
  let bibleService: BibleService;
  let fsrsService: FsrsService;
  
  beforeEach(() => {
    store = new InMemoryStorage();
    bibleService = new BibleService(store);
    fsrsService = new FsrsService(new MockFsrsEngine());
  });
  
  it('should memorize a verse, review it, and update FSRS state', async () => {
    // 1. Load a verse
    const verse = await bibleService.getVerse('joh', 3, 16);
    expect(verse).not.toBeNull();
    
    // 2. Start memorization
    const record = memorizationDomain.startSession(verse!);
    expect(record.status).toBe('in-progress');
    
    // 3. Complete memorization with GOOD rating
    const review = fsrsService.review(record.fsrsState, Rating.GOOD);
    record.fsrsState = review.state;
    record.nextReviewAt = review.due.getTime();
    record.lastReviewedAt = Date.now();
    
    // 4. Verify FSRS updated
    expect(record.fsrsState.stability).toBeGreaterThan(0);
    expect(record.fsrsState.repetitions).toBe(1);
    
    // 5. Persist to storage
    await store.set('versyflow:user:memorized:' + record.id, JSON.stringify(record));
    
    // 6. Reload and verify
    const reloaded = JSON.parse(await store.get('versyflow:user:memorized:' + record.id)!);
    expect(reloaded.fsrsState.stability).toBe(record.fsrsState.stability);
  });
});
```

---

## 6. Tests E2E (Detox)

### Scénarios E2E critiques (max 10 tests)

| Test ID | Parcours | Importance |
|---------|----------|------------|
| `e2e/onboarding.complete_flow` | Welcome → Language (FR) → Translation (LSG) → Home | CRITICAL |
| `e2e/memorize.first_verse` | Explorer → Jean → Ch3 → Verse 16 → Memorize → Recall → Done | CRITICAL |
| `e2e/review.due_verses` | Home badge "X à réviser" → Review queue → Review one → Summary | HIGH |
| `e2e/change_language` | Settings → Change to English → Verify all text updated | MEDIUM |
| `e2e.search_reference` | Explorer search "Jean 3:16" → Navigate directly to verse | HIGH |
| `e2e.reset_progress` | Settings → Reset → Type "SUPPRIMER" → Confirm → Verify empty home | LOW |
| `e2e.rtl_arabic` | Settings → Arabic → Verify layout mirrored | HIGH |
| `e2e.offline_mode` | Disable network → Open app → Browse Bible → Memorize → All works | CRITICAL |
| `e2e.favorite_verse` | Bible → Favorite → Verify bookmark appears | MEDIUM |
| `e2e.daily_streak_increment` | Day 1 memorize → simulate next day → streak shows 2 days | LOW |

### Configuration Detox
```json
{
  "testBinary": "jest",
  "runnerConfig": "tests/e2e/config.json",
  "configurations": {
    "ios.sim": {
      "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/VersyFlow.app",
      "type": "ios.simulator",
      "device": { "type": "iPhone 15" }
    },
    "android.emu": {
      "binaryPath": "android/app/build/outputs/apk/debug/app-debug.apk",
      "type": "android.emulator",
      "device": { "avdName": "Pixel_6_API_34" }
    }
  }
}
```

---

## 7. Testing du Code Rust

### Tests unitaires Rust (cargo test)

Tous les tests FSRS Rust doivent être écrits en natif:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_new_state_initial_values() {
        let state = new_state(0.9);
        assert_eq!(state.stability, 1.0);
        assert_eq!(state.difficulty, 5.0);
    }
    
    #[test]
    fn test_review_rating_effects() {
        let state = new_state(0.9);
        let review = review(&state, Rating::Good);
        assert!(review.state.stability > state.stability);
    }
    
    #[test]
    fn test_again_resets_interval() {
        let mut state = new_state(0.9);
        state.stability = 10.0;
        let review = review(&state, Rating::Again);
        assert_eq!(review.scheduled_days, 1);
    }
    
    #[test]
    fn test_weight_optimization_valid() {
        let weights = generate_optimal_weights();
        for w in weights {
            assert!(w >= -5.0 && w <= 5.0);
        }
    }
}
```

### Criteres de couverture Rust
- **Line coverage**: ≥ 90% pour `fsrs_adapter.rs`
- **Branch coverage**: ≥ 85%
- **Edge cases**: Every public function must have at least 3 test cases (normal, boundary, error)

---

## 8. CI/CD Pipeline — Gates de Qualité

```yaml
# .github/workflows/ci.yml (résumé)
jobs:
  test:
    steps:
      - Run: npm run typecheck          # TypeScript strict compilation
      - Run: npm run lint               # ESLint + import path rules
      - Run: npm run test:unit -- --coverage  # Jest with coverage report
      - Run: npm run test:integration     # Service layer integration tests
      - Run: cargo test                   # Rust unit tests
      - Check: coverage >= thresholds     # FAIL if below minimum
      
  e2e:
    needs: test
    steps:
      - Run: detox test --configuration ios.sim
      - Run: detox test --configuration android.emu
      
  deploy-preview:
    needs: [test, e2e]
    if: github.event_name == 'pull_request'
    runs: expo publish --profile preview
```

---

## 9. Règles de Gold

1. **Jamais de `test.skip` en production** — Un test skipped est un bug potentiel
2. **Les tests doivent passer without manual intervention** — No screenshots to compare, no human approval
3. **Each new feature requires: unit tests + at least 1 integration test + at least 1 e2e test**
4. **Test data is separate from test logic** — Fixtures in `tests/fixtures/`, assertions in test files
5. **FSRS test oracle** — Les résultats du MockFsrsEngine doivent matcher les outputs du vrai FSRS Rust (within tolerance ±0.1 for stability, ±0.5 for difficulty)

---

*Document approuvé. Critères de couverture doivent être enforceés par CI.*
