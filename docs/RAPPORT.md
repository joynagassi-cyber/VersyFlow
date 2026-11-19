# Rapport de partenariat — index

Le document de présentation envoyé aux partenaires le 29 septembre 2026 est
**conservé tel quel**, dans ses deux formats :

- [`VersyFlow-Rapport-Partenariat-2026-09-29.docx`](VersyFlow-Rapport-Partenariat-2026-09-29.docx) — version éditable
- [`VersyFlow-Rapport-Partenariat-2026-09-29-v2.pdf`](VersyFlow-Rapport-Partenariat-2026-09-29-v2.pdf) — version envoyée

Décision D5 (`docs/DECISIONS.md`) : les documents qui décrivent un état
antérieur ne sont pas réécrits, ils reçoivent un avertissement.

## Avertissement

Ce document a été écrit le 29 septembre 2026, quand le projet s'appuyait
encore sur un service cloud (authentification, base, stockage, synchronisation)
et livrait 34 traductions. Trois affirmations y sont donc **périmées** : ce
service est supprimé (décision D1), une seule traduction est livrée (décision
D2), et le décompte de tests a changé. Le document n'est pas réécrit — il
décrit ce qui a été présenté aux partenaires à cette date ; l'état réel est dans
[`AUDIT.md`](AUDIT.md). Les textes bibliques cités (LSG 1910, domaine public)
restent exacts.

## Ce qui a changé depuis, en trois points

| Affirmation de septembre | État au 2026-11-19 | Preuve |
| --- | --- | --- |
| Service cloud (auth, base, stockage, synchronisation) en production | supprimé : l'application est 100 % frontend, l'état vit sur l'appareil | `docs/DECISIONS.md` D1, `tests/design/no-cloud-backend.test.ts` |
| 34 traductions intégrées | une seule livrée (LSG 1910, domaine public) ; les autres sont cataloguées et marquées indisponibles | `docs/DECISIONS.md` D2, `docs/SOURCES.md` |
| 1 148 tests automatisés | **1 722** tests, 181 fichiers, 0 échec | dernière exécution `npx vitest run` |

Ce qui n'a pas changé : la mémorisation par FSRS, les 45 langues d'interface,
la lecture biblique hors ligne, et les textes cités (LSG 1910, domaine public).
