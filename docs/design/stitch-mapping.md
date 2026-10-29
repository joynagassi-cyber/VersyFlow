# Correspondance prototypes Stitch → écrans réels

Source visuelle (conservée dans le dépôt, ne pas supprimer) :
`stitch_monochrome_pink_ui_kit/` (59 écrans, `code.html` + `screen.png`) et
`stitch_monochrome_pink_ui_kit/sacred_focus_scripture/DESIGN.md`.

## Principe d'implémentation (propre, pas de copier-coller du HTML Stitch)

1. **Fondations d'abord** — `src/styles/sacred-focus.css` (classes `sf-*`),
   variables `--color-*` de `src/styles/globals.css`, `src/theme/tokens.ts`,
   `tailwind.config.js` (Playfair Display / Inter, ombres `soft`/`hero`).
   Tout écran qui utilise ces variables/classes hérite du design sans
   réécriture : c'est ce qui couvre les 59 écrans d'un coup.
2. **Composants partagés ensuite** — `BottomTabs`, `Button`, `Card`, `Chip`,
   `ProgressRing` consomment les mêmes tokens.
3. **Écrans pilotes convertis à la main** — Accueil (r9/c1) fait foi ;
   les autres écrans adoptent `sf-screen`, `sf-card`, `sf-btn-primary`,
   `sf-scripture`, `sf-chip`… au fil de leur ouverture (voir statut).

Statuts : « Fondations » = hérite déjà des couleurs/typo/rayons via les
tokens globaux ; la conversion fine (mise en page pixel-près du prototype)
se fait écran par écran dans l'ordre r* → m* → g*/c* → t*.

| Prototype | Route / écran réel | Statut |
|---|---|---|
| `c1_modifi_accueil` | /tabs/home | Fondations `sf-*` (global) |
| `c2_modifi_r_sum_de_session` | /review/summary | Fondations `sf-*` (global) |
| `c3_modifi_progr_s_famille` | /family/home (progrès) | Fondations `sf-*` (global) |
| `c4_modifi_r_glages` | /tabs/settings | Fondations `sf-*` (global) |
| `g1_r_glages_profil` | /profile | Fondations `sf-*` (global) |
| `g2_r_glages_apparence` | /settings/appearance | Fondations `sf-*` (global) |
| `g3_r_glages_personnaliser_la_barre_de_navigation` | /settings/navigation | Fondations `sf-*` (global) |
| `g4_navigation_menu_plus_feuille_modale_3_points` | navigation (menu +) | Fondations `sf-*` (global) |
| `m10_famille_d_fis_d_quipe` | Famille — écran à créer/valider (hub famille existant partiel) | Fondations `sf-*` (global) |
| `m11_famille_cr_er_un_d_fi` | Famille — écran à créer/valider (hub famille existant partiel) | Fondations `sf-*` (global) |
| `m12_famille_d_tail_d_un_d_fi` | Famille — écran à créer/valider (hub famille existant partiel) | Fondations `sf-*` (global) |
| `m13_famille_r_sultats_d_un_d_fi` | Famille — écran à créer/valider (hub famille existant partiel) | Fondations `sf-*` (global) |
| `m14_famille_r_glages_famille` | Famille — écran à créer/valider (hub famille existant partiel) | Fondations `sf-*` (global) |
| `m15_famille_pr_paration_de_s_ance` | Famille — écran à créer/valider (hub famille existant partiel) | Fondations `sf-*` (global) |
| `m16_famille_s_ance_en_direct_en_ligne` | Famille — écran à créer/valider (hub famille existant partiel) | Fondations `sf-*` (global) |
| `m16b_famille_s_ance_hors_ligne` | Famille — écran à créer/valider (hub famille existant partiel) | Fondations `sf-*` (global) |
| `m17_famille_r_sum_de_session_de_groupe` | Famille — écran à créer/valider (hub famille existant partiel) | Fondations `sf-*` (global) |
| `m18_famille_inviter` | /family/invite | Fondations `sf-*` (global) |
| `m19_famille_rejoindre` | /family/join | Fondations `sf-*` (global) |
| `m1_famille_hub` | /family/home | Fondations `sf-*` (global) |
| `m20_famille_fil_d_activit` | Famille — écran à créer/valider (hub famille existant partiel) | Fondations `sf-*` (global) |
| `m21_famille_synchronisation` | Famille — écran à créer/valider (hub famille existant partiel) | Fondations `sf-*` (global) |
| `m2_famille_pr_sentation` | Famille — écran à créer/valider (hub famille existant partiel) | Fondations `sf-*` (global) |
| `m3_famille_cr_ation` | Famille — écran à créer/valider (hub famille existant partiel) | Fondations `sf-*` (global) |
| `m4_famille_profil_de_membre` | Famille — écran à créer/valider (hub famille existant partiel) | Fondations `sf-*` (global) |
| `m5_famille_s_lecteur_de_profil` | Famille — écran à créer/valider (hub famille existant partiel) | Fondations `sf-*` (global) |
| `m6_famille_membres` | /family/members | Fondations `sf-*` (global) |
| `m7_famille_d_tail_d_un_membre` | Famille — écran à créer/valider (hub famille existant partiel) | Fondations `sf-*` (global) |
| `m8_famille_classement` | Famille — écran à créer/valider (hub famille existant partiel) | Fondations `sf-*` (global) |
| `m9_famille_points_et_niveaux` | Famille — écran à créer/valider (hub famille existant partiel) | Fondations `sf-*` (global) |
| `r10_r_sum_de_session` | /review/summary | Fondations `sf-*` (global) |
| `r11_file_de_r_vision` | /review/queue | Fondations `sf-*` (global) |
| `r12_session_de_r_vision` | /review/session | Fondations `sf-*` (global) |
| `r13_d_tail_du_verset` | /bible/chapter (détail verset) | Fondations `sf-*` (global) |
| `r14_progr_s_activit` | /tabs/progress | Fondations `sf-*` (global) |
| `r15_r_glages` | /tabs/settings | Fondations `sf-*` (global) |
| `r16_bible_liste_des_livres` | /bible/explorer | Fondations `sf-*` (global) |
| `r17_bible_chapitres` | /bible/book/:bookId | Fondations `sf-*` (global) |
| `r18_lecteur_chapitre` | /bible/chapter/:bookId/:chapter | Fondations `sf-*` (global) |
| `r1_r_v_lation_progressive` | /memorization/session (révélation) | Fondations `sf-*` (global) |
| `r20_enregistr_notes` | /semantic/verse (notes) | Fondations `sf-*` (global) |
| `r21_rappels_et_notifications` | /settings/reminders · /settings/available-translations | Fondations `sf-*` (global) |
| `r21_s_lection_des_versions_de_la_bible` | /settings/reminders · /settings/available-translations | Fondations `sf-*` (global) |
| `r2_masquage_mots_manquants` | /memorization/workspace (masquage) | Fondations `sf-*` (global) |
| `r3_flashcard_recto` | /memorization/flashcard (recto) | Fondations `sf-*` (global) |
| `r4_flashcard_verso` | /memorization/flashcard (verso) | Fondations `sf-*` (global) |
| `r5_criture_saisie` | /memory/recall-writing | Fondations `sf-*` (global) |
| `r6_criture_diff_note_fsrs` | /memory/recall-writing (diff/FSRS) | Fondations `sf-*` (global) |
| `r7_lecteur_s_lection_feuille_d_actions` | /bible/chapter (feuille d'actions) | Fondations `sf-*` (global) |
| `r8_lecteur_feuille_tendue_m_moriser` | /bible/chapter (mémoriser) | Fondations `sf-*` (global) |
| `r9_accueil` | /tabs/home (app/(tabs)/index.tsx) | Fondations `sf-*` (global) |
| `t1_arbre_mes_tags` | /semantic | Fondations `sf-*` (global) |
| `t2_arbre_ajouter_des_tags` | /semantic | Fondations `sf-*` (global) |
| `t3_arbre_arbre_d_un_tag_react_flow` | /semantic/concept | Fondations `sf-*` (global) |
| `t4_arbre_d_tail_d_un_n_ud` | /semantic/concept | Fondations `sf-*` (global) |
| `t5_arbre_suggestions` | /semantic | Fondations `sf-*` (global) |
| `t6_arbre_r_viser_une_branche` | /semantic | Fondations `sf-*` (global) |
| `t7_arbre_rattacher_un_tag` | /semantic/concept | Fondations `sf-*` (global) |
| `t8_arbre_donn_es_s_mantiques` | /semantic | Fondations `sf-*` (global) |
| `r9_accueil` / `c1_modifi_accueil` | /tabs/home | ✅ Converti (pilote) |

## Règles non négociables (DESIGN.md)

- Accent unique `#D81B60` (jamais d'aplat rose géant hors carte héros).
- Playfair Display = titres + texte biblique ; Inter = interface.
- Cartes : blanc, bordure `rgba(0,0,0,.06)`, rayon 16–24px, ombre `soft`.
- Boutons CTA : pill, hauteur ≥ 54px ; actif = pastille + point magenta.
