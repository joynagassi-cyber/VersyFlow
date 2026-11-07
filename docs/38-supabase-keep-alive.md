# 38 — Empêcher Supabase de se mettre en pause (et sauvegarder la base)

> Concerne le projet Supabase **`dspqvyesfngxuwqhceog`**
> (`https://dspqvyesfngxuwqhceog.supabase.co`, région constatée le 2026-10-31 :
> **eu-central-1**), celui que le dépôt référence : `supabase/config.toml`,
> `.mcp.json`, `src/services/bible-text-service.ts:85`.

## 1. Ce qui se passe réellement quand un projet « s'éteint »

Trois états différents sont souvent confondus :

| État | Déclencheur | Données | Réversible ? |
| --- | --- | --- | --- |
| **Pause** | plan Free + « activité base insuffisante » sur une fenêtre glissante de **7 jours** | intactes | oui, un clic **Resume project** dans le dashboard |
| **Fin de la reprise en un clic** | au-delà d'environ **1 an** de pause | sauvegardes encore téléchargeables | seulement en passant au plan payant |
| **Suppression** | action manuelle | perdues définitivement | non |

Conséquences pratiques :

- **Une pause ne supprime pas les tables.** Le risque immédiat n'est pas la
  perte de données, c'est l'indisponibilité (API, Auth, PowerSync) et le fait
  que l'app échoue silencieusement.
- Le vrai danger, c'est de **découvrir la pause trop tard** : un projet qui
  reste en pause pendant des mois perd la reprise en un clic. C'est là qu'on
  peut perdre l'accès pratique à ses données.
- **Le plan Free n'a aucune sauvegarde automatique.** Les backups quotidiens et
  le PITR commencent au plan Pro. Un « keep-alive » n'a donc jamais protégé
  une donnée : il protège la *disponibilité*. La protection des données, c'est
  le dump.

D'où les **deux** workflows ajoutés, qui répondent à deux risques distincts.

## 2. `supabase-keep-alive.yml` — la disponibilité

| Élément | Choix | Pourquoi |
| --- | --- | --- |
| Fréquence | `17 5 * * 1,4` (lundi + jeudi) | la fenêtre est de 7 jours ; deux passages laissent 2 jours de marge si un run échoue ou si GitHub retarde le cron |
| Nature de la requête | `GET /auth/v1/health`, `GET /rest/v1/`, `GET /rest/v1/bible_books?select=id&limit=1` | **lecture seule** : aucune écriture, aucune table à créer, aucune clé service exposée à GitHub |
| Succès | au moins une réponse **2xx** | un `[]` compte : la requête a atteint la base, c'est ce que Supabase mesure |
| Clé | `VITE_SUPABASE_ANON_KEY` (déjà un secret du dépôt) | la clé anon est publique par nature ; la service role ne doit **jamais** entrer dans un workflow |
| Échec 401/403 | message dédié | la clé a probablement été régénérée → mettre le secret à jour |
| Échec réseau / 5xx | message dédié + lien du dashboard | projet probablement en pause → **Resume project**, puis relancer |
| Traçabilité | tableau dans le *job summary* | on lit le résultat du run sans ouvrir les logs |

Testé hors GitHub contre un serveur local dans les quatre cas : sain (200 →
exit 0), pause (522 → exit 1 + lien), clé refusée (401 → exit 1 + consigne),
sans clé (avertissement, sonde publique seulement).

## 3. `supabase-backup.yml` — les données

| Élément | Choix | Pourquoi |
| --- | --- | --- |
| Fréquence | `43 4 * * 0` (dimanche) | un dump complet hebdomadaire suffit pour une base de cette taille |
| Outil | image Docker `postgres:17` | `pg_dump` doit être ≥ à la version du serveur ; on ne dépend pas du client installé sur le runner |
| Format | `--format=custom` | rechargeable avec `pg_restore`, sélectif, compressé |
| Contrôles | taille ≥ 20 000 o **et** `pg_restore --list` ≥ 20 objets | un dump de 3 ko n'est pas une sauvegarde ; on refuse de publier un artefact vide |
| Conservation | artefact GitHub, **90 jours** | gratuit ; pour un archivage long, télécharger le fichier ou pousser vers un stockage objet |
| Sans secret | `::notice::` + job vert | un dépôt neuf reste vert tant que la sauvegarde n'est pas configurée |

## 4. Mise en service (une fois)

1. **Secrets** — Settings → Secrets and variables → Actions
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` : déjà présents d'après
     `.github/secrets-checklist.md` (le keep-alive n'a donc rien à configurer).
   - `SUPABASE_DB_PASSWORD` : à ajouter pour activer les sauvegardes
     (Dashboard → Project Settings → Database). Facultatif :
     `SUPABASE_DB_HOST`, `SUPABASE_DB_USER` (pooler session
     `aws-0-<région>.pooler.supabase.com` si le port 5432 est filtré).
2. **Branche par défaut** — un `schedule` GitHub ne s'exécute que sur `main`.
   Avant le merge, lancer à la main : onglet **Actions** →
   « Supabase — keep-alive » → **Run workflow** (branche au choix).
3. **Vérifier** — le *job summary* doit afficher trois lignes 2xx.

## 5. Les deux limites à connaître

- **GitHub désactive les workflows planifiés d'un dépôt sans activité pendant
  60 jours.** Ce n'est pas un problème ici (le dépôt reçoit des pushes), mais
  un projet laissé seul six mois perdrait son keep-alive. Pour une garantie
  indépendante de GitHub, ajouter un moniteur externe (cron-job.org,
  UptimeRobot) sur `https://dspqvyesfngxuwqhceog.supabase.co/auth/v1/health`.
- **Une pause déjà en cours ne se répare pas depuis la CI.** Aucune requête ne
  réveille un projet en pause : il faut le bouton du dashboard. Le workflow
  sert à *ne pas y arriver*, puis à *le dire* si ça arrive.

## 6. Incident à traiter séparément : mot de passe en clair dans le dépôt

`supabase/MIGRATION_GUIDE.md:65` contenait la chaîne de connexion complète,
**mot de passe inclus**. Il a été neutralisé dans ce lot, mais un secret
commité doit être considéré comme compromis :

1. Dashboard → Project Settings → Database → **Reset database password** ;
2. reporter la nouvelle valeur **uniquement** dans le secret GitHub
   `SUPABASE_DB_PASSWORD` et dans `.env.local` (git-ignoré) ;
3. vérifier l'historique : `git log -S '<mot_de_passe>' --oneline` — le
   secret reste lisible dans les commits antérieurs. Le retirer de l'historique
   (`git filter-repo`) est possible mais réécrit toutes les branches ; la
   rotation est la vraie parade.
