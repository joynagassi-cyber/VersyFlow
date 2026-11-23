# Playbook écran par écran — état des lieux

Généré par `node scripts/audit-screens.mjs`. **Ne pas éditer à la main.**

**85 écrans** · moyenne **100/100** · **0** avec un manque BLOQUANT · **85** sans aucun manque mesuré.

Lecture : la note rapporte les points mesurables du playbook *dans le fichier* de
l’écran (structure, cinq états, noms accessibles, clavier, cible, honnêteté du texte).
Elle ne juge ni le rendu réel, ni l’esthétique : ces points restent partiels dans
`PLAYBOOK-AUDIT.md`. Un écran « sans données » n’est pas pénalisé pour un état vide
qui n’a pas de sens chez lui.

## Ce qui manque le plus souvent

| Règle | Manque | Écrans concernés |
| --- | --- | --- |

## Les écrans, du plus faible au plus solide

| Note | Écran | Nature | Manques bloquants | Manques majeurs |
| --- | --- | --- | --- | --- |
| 100 | `(tabs)/auth/index.tsx` | données | — | — |
| 100 | `(tabs)/auth/login.tsx` | données | — | — |
| 100 | `(tabs)/auth/signup.tsx` | données | — | — |
| 100 | `(tabs)/explore.tsx` | données | — | — |
| 100 | `(tabs)/index.tsx` | données | — | — |
| 100 | `(tabs)/progress.tsx` | données | — | — |
| 100 | `(tabs)/settings.tsx` | données | — | — |
| 100 | `+not-found.tsx` | statique | — | — |
| 100 | `achievements/index.tsx` | données | — | — |
| 100 | `analytics/dashboard.tsx` | données | — | — |
| 100 | `bible/explorer.tsx` | données | — | — |
| 100 | `collections/index.tsx` | données | — | — |
| 100 | `comparison/result.tsx` | statique | — | — |
| 100 | `comparison/translation.tsx` | données | — | — |
| 100 | `family/activity.tsx` | données | — | — |
| 100 | `family/challenges/detail.tsx` | données | — | — |
| 100 | `family/challenges/index.tsx` | données | — | — |
| 100 | `family/challenges/new.tsx` | données | — | — |
| 100 | `family/challenges/results.tsx` | données | — | — |
| 100 | `family/create.tsx` | données | — | — |
| 100 | `family/home.tsx` | données | — | — |
| 100 | `family/invite.tsx` | données | — | — |
| 100 | `family/join.tsx` | données | — | — |
| 100 | `family/leaderboard.tsx` | données | — | — |
| 100 | `family/member.tsx` | données | — | — |
| 100 | `family/members.tsx` | données | — | — |
| 100 | `family/points.tsx` | statique | — | — |
| 100 | `family/presentation.tsx` | statique | — | — |
| 100 | `family/profile.tsx` | données | — | — |
| 100 | `family/session/live.tsx` | données | — | — |
| 100 | `family/session/prepare.tsx` | données | — | — |
| 100 | `family/session/summary.tsx` | données | — | — |
| 100 | `family/settings.tsx` | données | — | — |
| 100 | `family/sync.tsx` | données | — | — |
| 100 | `mastery/index.tsx` | données | — | — |
| 100 | `memorization/confirm.tsx` | statique | — | — |
| 100 | `memorization/flashcard.tsx` | données | — | — |
| 100 | `memorization/session.tsx` | données | — | — |
| 100 | `memorization/start.tsx` | données | — | — |
| 100 | `memorization/workspace.tsx` | données | — | — |
| 100 | `memory/flashcard.tsx` | statique | — | — |
| 100 | `memory/recall-writing.tsx` | statique | — | — |
| 100 | `notes.tsx` | données | — | — |
| 100 | `notifications.tsx` | données | — | — |
| 100 | `onboarding/fsrs-introduction.tsx` | statique | — | — |
| 100 | `onboarding/journey.tsx` | données | — | — |
| 100 | `onboarding/language-select.tsx` | données | — | — |
| 100 | `onboarding/reminder-config.tsx` | données | — | — |
| 100 | `onboarding/session-config.tsx` | données | — | — |
| 100 | `onboarding/translation-select.tsx` | données | — | — |
| 100 | `onboarding/welcome.tsx` | données | — | — |
| 100 | `profile/create.tsx` | données | — | — |
| 100 | `profile/index.tsx` | données | — | — |
| 100 | `profile/select.tsx` | données | — | — |
| 100 | `review/calendar.tsx` | données | — | — |
| 100 | `review/History.tsx` | données | — | — |
| 100 | `review/queue.tsx` | données | — | — |
| 100 | `review/session.tsx` | données | — | — |
| 100 | `review/summary.tsx` | données | — | — |
| 100 | `search/index.tsx` | données | — | — |
| 100 | `semantic/attach.tsx` | statique | — | — |
| 100 | `semantic/community.tsx` | statique | — | — |
| 100 | `semantic/concept.tsx` | données | — | — |
| 100 | `semantic/data.tsx` | statique | — | — |
| 100 | `semantic/index.tsx` | statique | — | — |
| 100 | `semantic/node.tsx` | statique | — | — |
| 100 | `semantic/review.tsx` | données | — | — |
| 100 | `semantic/suggestions.tsx` | statique | — | — |
| 100 | `semantic/tags.tsx` | statique | — | — |
| 100 | `semantic/tags/new.tsx` | données | — | — |
| 100 | `semantic/tree.tsx` | statique | — | — |
| 100 | `semantic/verse.tsx` | données | — | — |
| 100 | `settings/about.tsx` | données | — | — |
| 100 | `settings/appearance.tsx` | données | — | — |
| 100 | `settings/available-translations.tsx` | données | — | — |
| 100 | `settings/backup.tsx` | données | — | — |
| 100 | `settings/data.tsx` | données | — | — |
| 100 | `settings/index.tsx` | données | — | — |
| 100 | `settings/languages.tsx` | données | — | — |
| 100 | `settings/navigation.tsx` | données | — | — |
| 100 | `settings/privacy.tsx` | statique | — | — |
| 100 | `settings/reminders.tsx` | données | — | — |
| 100 | `settings/session.tsx` | données | — | — |
| 100 | `settings/theme-picker.tsx` | données | — | — |
| 100 | `splash.tsx` | statique | — | — |

## Ce que ce rapport ne dit pas

- **Le rendu** : positions réelles, débordement, contraste mesuré à l’écran. Voir
  `docs/plan/verification-manuelle.md`.
- **L’esthétique** : hiérarchie visuelle, rythme, caractère. Un écran à 100 ici peut
  être plat ; c’est un autre jugement, et il demande l’écran sous les yeux.
- **Les états réellement atteints** : le fichier prouve qu’un `EmptyState` est rendu,
  pas que la donnée peut réellement être vide à cet endroit.
