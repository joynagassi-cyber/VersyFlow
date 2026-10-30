# Refonte de l'accueil et de l'onboarding

## Contrat
Bienvenue publique → inscription ou connexion obligatoire (compte fictif local en mode démo, Supabase hors démo) → langue → introduction → six écrans illustrés (Bible, mémorisation, FSRS, famille, progression, personnalisation) → profil → couleurs → traduction → séance → rappels → célébration → application. Les utilisateurs déjà installés conservent leurs données et leur état d'onboarding. En mode démo uniquement, les comptes sont fictifs et locaux ; ils ne constituent pas une authentification de sécurité. Hors démo, une identité locale ne vaut pas authentification.

## Réalisation
- Garder les routes d'authentification accessibles avant onboarding ; protéger les autres étapes sans marquer le parcours terminé prématurément. L'inscription avec confirmation e-mail ne doit pas simuler une session.
- Illustrations vectorielles locales décoratives et adaptatives, textes traduits ; mise en page mobile et desktop avec contrôles accessibles et retour arrière.
- Profil enregistré via le service existant, sans écraser ni recréer un profil existant ; couleurs via le store d'apparence. Reprendre traduction, séance et rappel existants.
- Icône de l'écran d'accueil : ne proposer aucun faux changement ; développer une intégration native seulement après vérification des possibilités Android/iOS et des ressources natives. Web : aucune promesse d'icône système dynamique.
- Retirer le logo rose des en-têtes et conserver la navigation.
- Vérifier tests, build, navigation, authentification réelle/configuration absente, persistance, profils existants, accessibilité, formats mobile/desktop et contraste. Documenter les vérifications non réalisées.

## Démarrage du mode démo local

`npm run dev:demo` active explicitement le mode de développement sur le port 3000. Les clés localStorage sont isolées sous `versyflow-demo-isolated:`, et la base PowerSync locale a un nom distinct. Aucun compte Supabase ou synchronisation cloud n'est utilisé dans ce mode. Seule la traduction LSG embarquée est proposée pendant l'onboarding. Utiliser un e-mail fictif et un mot de passe sans valeur réelle : la démo locale ne constitue pas une protection de sécurité.

Les écrans métier n'ont pas tous un adaptateur fictif complet ; la démo Famille reste un prototype en mémoire. Ne pas considérer l'ensemble des parcours comme validé sans test.
