> **Note (2026-11-19) — documentation historique.** VersyFlow est
> désormais 100 % frontend : the former backend et the local store ont été retirés du
> dépôt. Les mentions de ces services dans ce document décrivent
> l’état antérieur, pas l’architecture actuelle (voir `docs/AUDIT.md`).

# Refonte de l'accueil et de l'onboarding

## Contrat

## Réalisation
- Garder les routes d'authentification accessibles avant onboarding ; protéger les autres étapes sans marquer le parcours terminé prématurément. L'inscription avec confirmation e-mail ne doit pas simuler une session.
- Illustrations vectorielles locales décoratives et adaptatives, textes traduits ; mise en page mobile et desktop avec contrôles accessibles et retour arrière.
- Profil enregistré via le service existant, sans écraser ni recréer un profil existant ; couleurs via le store d'apparence. Reprendre traduction, séance et rappel existants.
- Icône de l'écran d'accueil : ne proposer aucun faux changement ; développer une intégration native seulement après vérification des possibilités Android/iOS et des ressources natives. Web : aucune promesse d'icône système dynamique.
- Retirer le logo rose des en-têtes et conserver la navigation.
- Vérifier tests, build, navigation, authentification réelle/configuration absente, persistance, profils existants, accessibilité, formats mobile/desktop et contraste. Documenter les vérifications non réalisées.

## Démarrage du mode démo local


Les illustrations narratives, les options de photo/couverture et les icônes natives restent à réaliser. Tous les parcours métier et la synchronisation réelle ne sont pas validés par ces changements.
