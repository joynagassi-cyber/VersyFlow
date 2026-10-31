# 39 — Prompt à donner à un agent connecté au Supabase du projet

> Ce fichier contient **un prompt prêt à copier-coller**. Il s'adresse à un agent
> qui a un accès réel au projet Supabase de VersyFlow (MCP Supabase, CLI liée, ou
> clé de service) — pas à un agent qui ne verrait que le dépôt.
>
> Colle le bloc de la section 1 dans la conversation, en entier. Les annexes
> (SQL, commandes) sont déjà incluses dedans : l'agent n'a besoin de rien d'autre.

## 1. Le prompt

```text
Tu es l'agent qui administre le projet Supabase de VersyFlow. Tu as un accès réel
à ce projet (MCP Supabase, CLI `supabase` liée, ou clé de service). Ta mission a
deux parties, et la seconde est la seule qui compte :

  A. FAIRE LES MODIFICATIONS qui rendent le keep-alive possible et vérifiable.
  B. PROUVER qu'il fonctionne — avec des sorties brutes, pas des affirmations.

Ne me dis jamais « c'est fait » sans la preuve correspondante. Si une étape
échoue, tu t'arrêtes à cette étape et tu me montres l'erreur exacte.

────────────────────────────────────────────────────────────────────────
CONTEXTE
────────────────────────────────────────────────────────────────────────
- Projet : VersyFlow, Supabase, région eu-west-2, Postgres 17, plan FREE.
- Réf. du projet : dspqvyesfngxuwqhceog   (URL : https://dspqvyesfngxuwqhceog.supabase.co)
  → Si `list_projects` ne contient PAS cette réf, ARRÊTE-TOI et demande-moi
    avant de créer ou modifier quoi que ce soit. Ne devine jamais un projet.
- Le schéma public contient déjà ~26 tables produit (bible_books, bible_verses,
  bible_translations, users, learner_profiles, memorization_records, review_logs,
  families, family_memberships, concepts, collections, settings, streaks, …).
  → Tu n'en modifies AUCUNE. Tu n'en supprimes AUCUNE.
- Pourquoi cette mission : le plan Free met un projet en PAUSE après 7 jours
  d'activité base insuffisante. La pause ne supprime pas les données (reprise en
  un clic pendant ~1 an), mais elle coupe l'API, l'auth et PowerSync sans
  prévenir. Le plan Free n'a par ailleurs AUCUNE sauvegarde automatique.

────────────────────────────────────────────────────────────────────────
RÈGLES ABSOLUES
────────────────────────────────────────────────────────────────────────
1. Aucune opération destructive : pas de DROP TABLE, TRUNCATE, DELETE non borné,
   pas de reset de mot de passe, pas de suppression de projet ou de branche.
2. Aucune clé service_role dans un workflow, un dépôt Git ou un log. La seule clé
   qui a le droit de vivre dans GitHub est la clé anon/publishable.
3. Le keep-alive ne doit RIEN écrire dans les tables produit. La seule écriture
   autorisée est le heartbeat décrit en annexe 1 (une table dédiée, purgée).
4. Tu ajoutes des policies RLS, tu ne modifies ni ne supprimes celles qui existent.
5. Toute fonction SQL que tu crées doit fixer `search_path` (sinon le linter
   Supabase la signale) et être révocable sans casser l'existant.
6. Tu affiches les sorties brutes (JSON, tableaux) — pas de résumé à leur place.

────────────────────────────────────────────────────────────────────────
PARTIE A — MODIFICATIONS
────────────────────────────────────────────────────────────────────────
A1. ÉTAT DES LIEUX. Donne : nom, réf, région, statut (`ACTIVE_HEALTHY` ou
    `PAUSED`), date de création. Si le projet est en pause, dis-le immédiatement
    et demande-moi de le réveiller (le bouton « Resume project » du dashboard) :
    aucune requête ne réveille un projet en pause.

A2. HEARTBEAT. Exécute le SQL de l'ANNEXE 1. Il crée :
      - `public.keep_alive` (journal horodaté, RLS activée, aucune policy de
        lecture : ni anon ni authenticated ne la lisent directement) ;
      - `public.keep_alive_ping(source text)` en `security definer`, seule voie
        d'écriture, avec purge automatique au-delà de 400 lignes ;
      - les privilèges : `anon` et `authenticated` peuvent EXÉCUTER la fonction,
        rien d'autre.

A3. VÉRIFIE LES PRIVILÈGES et colle les sorties :
      - `select has_function_privilege('anon', 'public.keep_alive_ping(text)', 'execute');`
        → doit renvoyer `true`
      - `select has_table_privilege('anon', 'public.keep_alive', 'select');`
        → doit renvoyer `false`
      - `select relrowsecurity from pg_class where oid = 'public.keep_alive'::regclass;`
        → doit renvoyer `true`

A4. TESTE LE PING toi-même, avec la clé anon (jamais la service_role), et donne
    les deux sorties brutes :
      - l'appel RPC (ANNEXE 2, commande 1) → attendu : HTTP 200 et un JSON
        `{"ok": true, "pings": N, "last": "..."}`
      - la relecture côté base (ANNEXE 2, commande 2) → le compte a augmenté et
        `max(pinged_at)` est postérieur à l'appel.

────────────────────────────────────────────────────────────────────────
PARTIE B — LA PREUVE (c'est ici que la plupart des « keep-alive » échouent)
────────────────────────────────────────────────────────────────────────
B1. PLANIFICATEUR EXTERNE — indispensable.
    Un keep-alive doit venir de l'EXTÉRIEUR de la base : une requête interne ne
    prouve pas l'activité qu'on cherche à produire. Mets en place UNE des deux
    options, et dis-moi laquelle :
      (a) GitHub Actions, fichier `.github/workflows/supabase-keep-alive.yml`,
          cron `17 5 * * 1,4` (lundi + jeudi), `workflow_dispatch` activé.
          Il appelle, avec `secrets.VITE_SUPABASE_ANON_KEY` :
            GET  /auth/v1/health                          (sans clé)
            GET  /rest/v1/                                (introspection)
            GET  /rest/v1/bible_books?select=id&limit=1    (lecture réelle)
            POST /rest/v1/rpc/keep_alive_ping             (heartbeat, corps {"p_source":"github"})
          Les trois premières sont des lectures ; la quatrième est la seule
          écriture, bornée et purgée. Un 404 sur le heartbeat n'est PAS un
          échec (la fonction peut ne pas encore exister) : simple notice.
          Succès = au moins un 2xx. 401/403 = clé régénérée → message dédié.
          Aucun 2xx = projet en pause → message avec le lien du dashboard.
          Le job doit écrire un tableau récapitulatif dans le `job summary`.
          ⚠ Ce fichier exige un jeton avec la permission `workflows`. Si tu ne
          l'as pas, ne contourne pas : crée-le via l'interface web du dépôt
          (Add file → Create new file) ou demande-moi un jeton adapté.
          ⚠ Un `schedule` GitHub ne s'exécute QUE sur la branche par défaut
          (`main`). Tant qu'il n'y est pas, lance-le à la main.
      (b) Un moniteur externe gratuit (cron-job.org, UptimeRobot) sur la même
          URL RPC, toutes les 72 h maximum.
    Secret requis pour la sauvegarde (facultatif ici) : `SUPABASE_DB_PASSWORD`.
    Secrets attendus côté GitHub et déjà présents : `VITE_SUPABASE_URL`,
    `VITE_SUPABASE_ANON_KEY`.

B2. PREUVE QUE LE PLANIFICATEUR TOURNE RÉELLEMENT :
      - si GitHub : `gh run list --workflow=supabase-keep-alive.yml --limit 3`
        puis `gh run view <id>` → colle le tableau du job summary ;
      - si moniteur externe : colle la dernière exécution et son code HTTP.

B3. PREUVE QUE LE PING COMPTE : relance le ping, puis compare
    `max(pinged_at)` avant/après (ANNEXE 2, commande 2). L'écart doit
    correspondre à l'heure de tes deux appels.

B4. TEST NÉGATIF — un keep-alive qui ne sait pas échouer est un faux voyant.
    Fais échouer volontairement la sonde (URL de projet invalide, ou clé anon
    volontairement fausse) et prouve que :
      - une URL/ref inexistante produit un échec explicite « projet probablement
        en pause » avec le lien du dashboard ;
      - une clé fausse produit un échec explicite « clé refusée (401/403) ».
    Puis remets la bonne configuration et re-prouve le succès (B1).
    Ne laisse AUCUNE configuration de test en place.

B5. CRITÈRE FINAL, LE SEUL QUI VAUT :
    « Dans 8 jours, sans aucun autre trafic, le projet est toujours
    ACTIVE_HEALTHY. » Le reste (B1→B4) prouve seulement que la plomberie
    fonctionne ; B5 prouve que Supabase compte bien ces pings comme de
    l'activité. Note-le dans ton rapport final, avec la date à laquelle il
    faudra le constater.

────────────────────────────────────────────────────────────────────────
PARTIE C — SÉCURITÉ (à traiter dans le même passage)
────────────────────────────────────────────────────────────────────────
C1. Le mot de passe Postgres du projet a été COMMITÉ en clair dans
    `supabase/MIGRATION_GUIDE.md` (corrigé depuis, mais toujours lisible dans
    l'historique Git). Considère-le comme compromis.
    → Demande-moi l'autorisation, puis : Dashboard → Project Settings →
    Database → « Reset database password ». La nouvelle valeur ne va QUE dans
    le secret GitHub `SUPABASE_DB_PASSWORD` et dans `.env.local` (git-ignoré).
    Ne me l'écris pas dans la conversation, ne la mets pas dans un fichier suivi.

C2. Vérifie qu'aucune clé service_role n'est exposée côté client : elle ne doit
    apparaître ni dans `.env.example`, ni dans un `VITE_*`, ni dans le bundle.

────────────────────────────────────────────────────────────────────────
RAPPORT FINAL ATTENDU (format exact)
────────────────────────────────────────────────────────────────────────
1. État avant  : statut du projet, nombre de lignes de keep_alive.
2. Modifications appliquées : liste des objets créés (nom + type), rien d'autre.
3. Preuves : pour B1, B2, B3, B4 → la commande ET sa sortie brute.
4. Ce qui reste à faire par moi (ex. : cliquer « Run workflow », ajouter un
   secret, revenir dans 8 jours pour B5).
5. Risques résiduels : ce que cette installation ne couvre PAS (voir annexe 3).

────────────────────────────────────────────────────────────────────────
ANNEXE 1 — SQL du heartbeat (à exécuter tel quel)
────────────────────────────────────────────────────────────────────────
create table if not exists public.keep_alive (
  id        bigint generated always as identity primary key,
  pinged_at timestamptz not null default now(),
  source    text not null default 'unknown'
);

alter table public.keep_alive enable row level security;
comment on table public.keep_alive is
  'Journal des pings keep-alive. Écrit uniquement via public.keep_alive_ping(). Aucune policy : lecture impossible pour anon/authenticated.';

create or replace function public.keep_alive_ping(p_source text default 'external')
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pings bigint;
  v_last  timestamptz;
begin
  insert into public.keep_alive (source)
  values (left(coalesce(nullif(trim(p_source), ''), 'external'), 40));

  -- Rétention : 400 pings suffisent à prouver une année de battement.
  delete from public.keep_alive
   where id <= coalesce((select max(id) - 400 from public.keep_alive), 0);

  select count(*), max(pinged_at) into v_pings, v_last from public.keep_alive;

  return jsonb_build_object('ok', true, 'pings', v_pings, 'last', v_last);
end;
$$;

revoke all on function public.keep_alive_ping(text) from public;
grant execute on function public.keep_alive_ping(text) to anon, authenticated;

────────────────────────────────────────────────────────────────────────
ANNEXE 2 — Commandes de vérification
────────────────────────────────────────────────────────────────────────
# 1) Le ping (remplace <ANON_KEY> ; ne l'écris jamais dans un fichier suivi)
curl -sS -w '\nHTTP %{http_code}\n' \
  -X POST 'https://dspqvyesfngxuwqhceog.supabase.co/rest/v1/rpc/keep_alive_ping' \
  -H 'apikey: <ANON_KEY>' \
  -H 'Authorization: Bearer <ANON_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"p_source":"manual"}'

# 2) La trace côté base (via MCP ou psql)
select count(*) as pings, max(pinged_at) as dernier from public.keep_alive;

# 3) La sonde publique, sans clé (utile pour un moniteur externe)
curl -sS -o /dev/null -w 'HTTP %{http_code}\n' \
  'https://dspqvyesfngxuwqhceog.supabase.co/auth/v1/health'

────────────────────────────────────────────────────────────────────────
ANNEXE 3 — Limites à me rappeler (ne pas les masquer)
────────────────────────────────────────────────────────────────────────
- Le keep-alive protège la DISPONIBILITÉ, pas les données. Sans `pg_dump`, un
  `DELETE` malheureux ou une migration ratée reste définitif : le plan Free n'a
  aucune sauvegarde automatique.
- GitHub désactive les workflows planifiés d'un dépôt sans activité (push)
  pendant 60 jours : le keep-alive s'arrête tout seul sur un dépôt dormant.
- Une pause déjà en cours ne se répare PAS depuis la CI : seul le bouton
  « Resume project » du dashboard la lève.
- Les pings doivent rester espacés (72 h max, jamais toutes les minutes) : il
  n'y a aucune raison de consommer du quota pour prouver une présence.
```

## 2. Ce que ce prompt garantit, et ce qu'il ne peut pas garantir

| Point | Pourquoi c'est dans le prompt |
| --- | --- |
| Réf. de projet imposée, avec arrêt si absente | le compte Supabase où j'ai cherché le projet ne le contenait pas : un agent qui « devine » un projet peut modifier le mauvais |
| Heartbeat + RPC `security definer` | donne une **preuve horodatée** au lieu d'un « ça devrait tourner » |
| Table fermée, aucune policy | un journal lisible par `anon` serait un compteur public de l'activité du projet |
| Test négatif obligatoire | c'est ce qui distingue un keep-alive d'un voyant toujours vert |
| Critère B5 à 8 jours | les étapes B1–B4 prouvent la plomberie ; seule l'absence de pause prouve que Supabase **compte** ces pings |
| Rotation du mot de passe | le secret reste lisible dans l'historique Git même après correction du fichier |

Ce que le prompt **ne** peut pas faire : empêcher GitHub de désactiver un cron
sur un dépôt dormant, ni réveiller un projet déjà en pause. Ces deux faits sont
dans l'annexe 3 pour que l'agent ne les taise pas.

## 3. Fichiers de référence

- `docs/38-supabase-keep-alive.md` — les trois états (pause / fin de reprise /
  suppression), la mise en service, les limites.
- `.github/workflows/supabase-keep-alive.yml` — le workflow complet, **dans
  l'espace de travail mais pas dans le dépôt distant** : le jeton GitHub des
  sessions d'agent n'a pas la permission `workflows` (`refusing to allow a
  GitHub App to create or update workflow … without workflows permission`).
  À coller une fois sur `main` via `Add file → Create new file`, ou à pousser
  avec un jeton qui a cette permission.
- `.github/workflows/supabase-backup.yml` — le `pg_dump` hebdomadaire, même
  situation. Il ne démarre qu'une fois `SUPABASE_DB_PASSWORD` ajouté aux
  secrets ; sans lui, le job se termine proprement avec une notice.

## 4. Ce que le workflow a été testé à faire

Exécuté hors GitHub contre un faux serveur, quatre scénarios :

| Scénario simulé | HTTP | Sortie du job |
| --- | --- | --- |
| Projet sain | 200 partout | exit **0**, tableau 2xx dans le résumé |
| Heartbeat pas encore créé | 404 sur le RPC | exit **0** + notice « créer la fonction » |
| Projet en pause | 522 | exit **1** + lien du dashboard |
| Clé anon régénérée | 401 | exit **1** + consigne de mise à jour du secret |

C'est le test négatif (deux dernières lignes) qui fait la différence entre un
keep-alive et un voyant toujours vert.
