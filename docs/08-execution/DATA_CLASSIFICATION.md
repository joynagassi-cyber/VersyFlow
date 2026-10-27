# VersyFlow — Data Classification

**Date :** 2026-09-10

---

## Classification des données

| Classe | Tables | Explication |
|--------|--------|-------------|
| **SYNCED** | `users`, `learner_profiles`, `memorization_records`, `review_logs`, `word_performance`, `streaks`, `collections`, `collection_verses`, `user_achievements`, `settings`, `families`, `family_memberships`, `family_invitations` | Données utilisateur syncées via PowerSync ↔ Supabase |
| **LOCAL_ONLY** | `bible_languages`, `bible_translations`, `bible_books`, `bible_verses`, `versification_maps`, `achievements` | Corpus biblique + données statiques — non syncées |
| **REMOTE_ONLY** | (aucune pour l'instant) | Invitations email, avatars, exports — via Supabase Storage |
| **DERIVED** | (aucune) | File de révision, agrégats — recalculés localement |
| **ANALYTICS_ONLY** | (à créer) | Telemetry anonymisée — upload batch via supabase-js |
| **EPHEMERAL** | (stocké en localStorage) | Thème, scroll, flags UI — Capacitor Preferences |

---

## Règles

- **Ne pas syncer** la Bible (LOCAL_ONLY)
- **Ne pas tout mettre** dans SQLite (Bible = tables statiques, pas de sync)
- **Ne pas envoyer** le texte biblique complet en telemetry
