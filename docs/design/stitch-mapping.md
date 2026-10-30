# Correspondance prototypes Stitch → écrans réels

Généré par `node scripts/screen-coverage.mjs` — **ne pas éditer à la main**.
Ce fichier est réécrit à chaque exécution de `npm run screens:coverage`, à
partir de la vérification réelle du dépôt : la documentation ne peut donc pas
diverger du code.

- Prototypes dans `stitch_monochrome_pink_ui_kit/` : **60**
- Couverts (route déclarée **et** écran existant avec export par défaut) : **60**
- Écarts : **0**

Les prototypes restent dans le dépôt : ce sont les références de design. Le
HTML Stitch (Tailwind CDN, `material-symbols`) n'est **pas** copié : chaque
écran est traduit en composants du design system (jetons de `src/styles/globals.css`,
`DuoIcon` pour les icônes, `FullScreenPage` pour la coquille).

| Prototype | Destination réelle | État |
|---|---|---|
| `c1_modifi_accueil` | `/tabs/home` · `app/(tabs)/index.tsx` | couvert |
| `c2_modifi_r_sum_de_session` | `/review/summary` · `app/review/summary.tsx` | couvert |
| `c3_modifi_progr_s_famille` | `/tabs/progress` · `app/(tabs)/progress.tsx` | couvert |
| `c4_modifi_r_glages` | `/tabs/settings` · `app/(tabs)/settings.tsx` | couvert |
| `g1_r_glages_profil` | `/profile` · `app/profile/index.tsx` | couvert |
| `g2_r_glages_apparence` | `/settings/appearance` · `app/settings/appearance.tsx` | couvert |
| `g3_r_glages_personnaliser_la_barre_de_navigation` | `/settings/navigation` · `app/settings/navigation.tsx` | couvert |
| `g4_navigation_menu_plus_feuille_modale_3_points` | brique · `src/components/navigation/HamburgerMenu.tsx` | couvert |
| `m10_famille_d_fis_d_quipe` | `/family/challenges` · `app/family/challenges/index.tsx` | couvert |
| `m11_famille_cr_er_un_d_fi` | `/family/challenges/new` · `app/family/challenges/new.tsx` | couvert |
| `m12_famille_d_tail_d_un_d_fi` | `/family/challenges/:challengeId` · `app/family/challenges/detail.tsx` | couvert |
| `m13_famille_r_sultats_d_un_d_fi` | `/family/challenges/:challengeId/results` · `app/family/challenges/results.tsx` | couvert |
| `m14_famille_r_glages_famille` | `/family/settings` · `app/family/settings.tsx` | couvert |
| `m15_famille_pr_paration_de_s_ance` | `/family/session/prepare` · `app/family/session/prepare.tsx` | couvert |
| `m16_famille_s_ance_en_direct_en_ligne` | `/family/session/live` · `app/family/session/live.tsx` | couvert |
| `m16b_famille_s_ance_hors_ligne` | `/family/session/live` · `app/family/session/live.tsx` | couvert · même écran : le mode hors ligne est lu par useSyncStatus |
| `m17_famille_r_sum_de_session_de_groupe` | `/family/session/summary` · `app/family/session/summary.tsx` | couvert |
| `m18_famille_inviter` | `/family/invite` · `app/family/invite.tsx` | couvert |
| `m19_famille_rejoindre` | `/family/join` · `app/family/join.tsx` | couvert |
| `m1_famille_hub` | `/family/home` · `app/family/home.tsx` | couvert |
| `m20_famille_fil_d_activit` | `/family/activity` · `app/family/activity.tsx` | couvert |
| `m21_famille_synchronisation` | `/family/sync` · `app/family/sync.tsx` | couvert |
| `m2_famille_pr_sentation` | `/family/presentation` · `app/family/presentation.tsx` | couvert |
| `m3_famille_cr_ation` | `/family/create` · `app/family/create.tsx` | couvert |
| `m4_famille_profil_de_membre` | `/family/profile` · `app/family/profile.tsx` | couvert |
| `m5_famille_s_lecteur_de_profil` | `/family/select-profile` · `app/family/select-profile.tsx` | couvert |
| `m6_famille_membres` | `/family/members` · `app/family/members.tsx` | couvert |
| `m7_famille_d_tail_d_un_membre` | `/family/member/:accountId` · `app/family/member.tsx` | couvert |
| `m8_famille_classement` | `/family/leaderboard` · `app/family/leaderboard.tsx` | couvert |
| `m9_famille_points_et_niveaux` | `/family/points` · `app/family/points.tsx` | couvert |
| `r10_r_sum_de_session` | `/review/summary` · `app/review/summary.tsx` | couvert |
| `r11_file_de_r_vision` | `/review/queue` · `app/review/queue.tsx` | couvert |
| `r12_session_de_r_vision` | `/review/session` · `app/review/session.tsx` | couvert |
| `r13_d_tail_du_verset` | `/bible/chapter/:bookId/:chapterNumber` · `app/bible/chapter.tsx` | couvert |
| `r14_progr_s_activit` | `/tabs/progress` · `app/(tabs)/progress.tsx` | couvert |
| `r15_r_glages` | `/tabs/settings` · `app/(tabs)/settings.tsx` | couvert |
| `r16_bible_liste_des_livres` | `/bible/explorer` · `app/bible/explorer.tsx` | couvert |
| `r17_bible_chapitres` | `/bible/book/:bookId` · `app/bible/book.tsx` | couvert |
| `r18_lecteur_chapitre` | `/bible/chapter/:bookId/:chapterNumber` · `app/bible/chapter.tsx` | couvert |
| `r1_r_v_lation_progressive` | `/memorization/session` · `app/memorization/session.tsx` | couvert |
| `r20_enregistr_notes` | `/notes` · `app/notes.tsx` | couvert |
| `r21_rappels_et_notifications` | `/settings/reminders` · `app/settings/reminders.tsx` | couvert |
| `r21_s_lection_des_versions_de_la_bible` | `/settings/available-translations` · `app/settings/available-translations.tsx` | couvert |
| `r2_masquage_mots_manquants` | `/memorization/workspace` · `app/memorization/workspace.tsx` | couvert |
| `r3_flashcard_recto` | `/memorization/flashcard` · `app/memorization/flashcard.tsx` | couvert |
| `r4_flashcard_verso` | `/memorization/flashcard` · `app/memorization/flashcard.tsx` | couvert |
| `r5_criture_saisie` | `/memory/recall-writing` · `app/memory/recall-writing.tsx` | couvert |
| `r6_criture_diff_note_fsrs` | `/memory/recall-writing` · `app/memory/recall-writing.tsx` | couvert |
| `r7_lecteur_s_lection_feuille_d_actions` | `/bible/chapter/:bookId/:chapterNumber` · `app/bible/chapter.tsx` | couvert |
| `r8_lecteur_feuille_tendue_m_moriser` | `/bible/chapter/:bookId/:chapterNumber` · `app/bible/chapter.tsx` | couvert |
| `r9_accueil` | `/tabs/home` · `app/(tabs)/index.tsx` | couvert |
| `sacred_focus_scripture` | jetons · `src/styles/globals.css` | couvert · le prototype ne contient que le langage visuel (jetons) |
| `t1_arbre_mes_tags` | `/semantic/tags` · `app/semantic/tags.tsx` | couvert |
| `t2_arbre_ajouter_des_tags` | `/semantic/tags/new` · `app/semantic/tags/new.tsx` | couvert |
| `t3_arbre_arbre_d_un_tag_react_flow` | `/semantic/tree` · `app/semantic/tree.tsx` | couvert |
| `t4_arbre_d_tail_d_un_n_ud` | `/semantic/node` · `app/semantic/node.tsx` | couvert |
| `t5_arbre_suggestions` | `/semantic/suggestions` · `app/semantic/suggestions.tsx` | couvert |
| `t6_arbre_r_viser_une_branche` | `/semantic/review` · `app/semantic/review.tsx` | couvert |
| `t7_arbre_rattacher_un_tag` | `/semantic/attach` · `app/semantic/attach.tsx` | couvert |
| `t8_arbre_donn_es_s_mantiques` | `/semantic/data` · `app/semantic/data.tsx` | couvert |

## Vérifier soi-même

```bash
npm run screens:coverage          # ce rapport, code de sortie 0 si 100 % couvert
grep -c '<Route path=' src/main.tsx
```
