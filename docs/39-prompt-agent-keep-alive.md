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
- Projet : VersyFlow, Supabase, plan FREE.
  Réf. : dspqvyesfngxuwqhceog   (URL : https://dspqvyesfngxuwqhceog.supabase.co)
  Région CONSTATÉE le 2026-10-31 : eu-central-1, Postgres 17.6.1.166.
  → La région et la version se LISENT dans `list_projects`, elles ne se
    supposent pas : ce prompt peut se tromper, la réponse de l'API non.
  → Si `list_projects` ne contient PAS cette réf, ARRÊTE-TOI et demande-moi
    avant de créer ou modifier quoi que ce soit. Ne devine jamais un projet.
- ÉTAT CONNU AU 2026-10-31 : `public.keep_alive` EXISTE DÉJÀ dans ce projet,
  avec une structure inconnue et sans colonne `pinged_at` (vérifié :
  `to_regclass('public.keep_alive')` → `keep_alive`,
  `to_regprocedure('public.keep_alive_ping(text)')` → `null`).
  → Cette table ne t'appartient pas. Tu ne l'altères pas, tu ne la supprimes
    pas, tu ne l'utilises pas : le heartbeat de l'annexe 1 porte donc un nom
    NEUF et distinct, `public.keep_alive_heartbeat`.
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
3. L'INSPECTION EN LECTURE SEULE DE L'EXISTANT T'EST AUTORISÉE, sans me
   redemander : `information_schema`, `pg_class`, `pg_proc`, `pg_policies`,
   `pg_description`, les COMMENT sur les objets. C'est le seul moyen de ne pas
   créer une collision — et tu viens d'en trouver une. Ce qui reste interdit,
   c'est d'ÉCRIRE sur un objet que tu n'as pas créé.
4. Le keep-alive ne doit RIEN écrire dans les tables produit, ni dans le
   `keep_alive` préexistant. La seule écriture autorisée est le heartbeat
   décrit en annexe 1 : `public.keep_alive_heartbeat`, une table dédiée que TU
   crées, purgée automatiquement.
5. Tu ajoutes des policies RLS, tu ne modifies ni ne supprimes celles qui
   existent.
6. Toute fonction SQL que tu crées doit fixer `search_path` (sinon le linter
   Supabase la signale) et être révocable sans casser l'existant.
7. Tu affiches les sorties brutes (JSON, tableaux) — pas de résumé à leur place.

────────────────────────────────────────────────────────────────────────
PARTIE A — MODIFICATIONS
────────────────────────────────────────────────────────────────────────
A1. ÉTAT DES LIEUX. Donne : nom, réf, région, statut (`ACTIVE_HEALTHY` ou
    `PAUSED`), date de création. Si le projet est en pause, dis-le immédiatement
    et demande-moi de le réveiller (le bouton « Resume project » du dashboard) :
    aucune requête ne réveille un projet en pause.

A2. PRÉFLIGHT — avant toute création, inventorie ce qui existe déjà, en
    LECTURE SEULE (autorisé, cf. règle 3), et colle les deux sorties :
      - l'ANNEXE 2, commande 3 (objets `keep_alive%` : type, colonnes, policies)
      - l'ANNEXE 2, commande 4 (signature des fonctions `keep_alive%`)
    Règle de décision, à appliquer sans me demander :
      • `keep_alive_heartbeat` n'existe pas → continue en A3.
      • `keep_alive_heartbeat` existe → ARRÊTE-TOI et montre-moi sa structure.
      • `public.keep_alive` existe (c'est le cas aujourd'hui) → ne le touche
        pas, ne t'en sers pas, et dis-moi en une ligne ce qu'il contient.
        Ce n'est PAS un obstacle : le heartbeat porte un autre nom.

A3. HEARTBEAT. Exécute le SQL de l'ANNEXE 1. Il crée :
      - `public.keep_alive_heartbeat` — nom NEUF, choisi pour ne pas heurter le
        `public.keep_alive` déjà présent — journal horodaté, RLS activée,
        aucune policy de lecture : ni anon ni authenticated ne le lisent ;
      - `public.keep_alive_ping(source text)` en `security definer`, seule voie
        d'écriture, avec purge automatique au-delà de 400 lignes ;
      - les privilèges : `anon` et `authenticated` peuvent EXÉCUTER la fonction,
        rien d'autre.
    Puis prouve que la table porte bien les colonnes attendues (ANNEXE 2,
    commande 5) : `id`, `pinged_at`, `source`. Si le `create table if not
    exists` a silencieusement réutilisé une table d'une autre forme, tu le
    verras ici — c'est exactement l'erreur qu'un `if not exists` masque.

A4. VÉRIFIE LES PRIVILÈGES et colle les sorties :
      - `select has_function_privilege('anon', 'public.keep_alive_ping(text)', 'execute');`
        → doit renvoyer `true`
      - `select has_table_privilege('anon', 'public.keep_alive_heartbeat', 'select');`
        → doit renvoyer `false`
      - `select relrowsecurity from pg_class where oid = 'public.keep_alive_heartbeat'::regclass;`
        → doit renvoyer `true`

A5. TESTE LE PING toi-même, avec la clé anon (jamais la service_role), et donne
    les deux sorties brutes :
      - l'appel RPC (ANNEXE 2, commande 1) → attendu : HTTP 200 et un JSON
        `{"ok": true, "pings": N, "last": "..."}`
      - la relecture côté base (ANNEXE 2, commande 2) → le compte a augmenté et
        `max(pinged_at)` est postérieur à l'appel.
    → Si l'appel renvoie `function public.keep_alive_ping(text) does not exist`
    alors que tu viens de la créer, c'est un cache de schéma PostgREST :
    `notify pgrst, 'reload schema';` puis réessaie UNE fois.

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
-- Nom DISTINCT de `public.keep_alive`, qui existe déjà dans ce projet et
-- n'appartient pas à cette installation. Un `create table if not exists` sur
-- `keep_alive` aurait silencieusement réutilisé l'autre table : c'est
-- exactement la collision constatée le 2026-10-31.
create table if not exists public.keep_alive_heartbeat (
  id        bigint generated always as identity primary key,
  pinged_at timestamptz not null default now(),
  source    text not null default 'unknown'
);

-- Garde-fou AVANT toute modification : si le nom existait déjà sous une autre
-- forme, on échoue ici — avant `alter table` et `comment on`, qui sinon
-- auraient déjà touché une table qui n'est pas la nôtre. `create table if not
-- exists` est un no-op dans ce cas, donc rien n'a encore été modifié.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name = 'keep_alive_heartbeat'
       and column_name = 'pinged_at'
  ) then
    raise exception
      'public.keep_alive_heartbeat existe sans colonne pinged_at : arrêt avant toute écriture (structure inattendue).';
  end if;
end;
$$;

alter table public.keep_alive_heartbeat enable row level security;
comment on table public.keep_alive_heartbeat is
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
  insert into public.keep_alive_heartbeat (source)
  values (left(coalesce(nullif(trim(p_source), ''), 'external'), 40));

  -- Rétention : 400 pings suffisent à prouver une année de battement.
  delete from public.keep_alive_heartbeat
   where id <= coalesce((select max(id) - 400 from public.keep_alive_heartbeat), 0);

  select count(*), max(pinged_at)
    into v_pings, v_last
    from public.keep_alive_heartbeat;

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
select count(*) as pings, max(pinged_at) as dernier from public.keep_alive_heartbeat;

# 3) PRÉFLIGHT — ce qui existe déjà sous ce nom (lecture seule)
select c.relname as objet,
       c.relkind as type,
       c.relrowsecurity as rls,
       (select string_agg(a.attname, ', ' order by a.attnum)
          from pg_attribute a
         where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped) as colonnes
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relname like 'keep_alive%'
 order by c.relname;

# 4) PRÉFLIGHT — fonctions existantes (nom + signature)
select p.proname as fonction,
       pg_get_function_identity_arguments(p.oid) as arguments
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname like 'keep_alive%';

# 5) Colonnes réellement présentes sur le heartbeat (après création)
select column_name, data_type
  from information_schema.columns
 where table_schema = 'public' and table_name = 'keep_alive_heartbeat'
 order by ordinal_position;

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

## 5. Réponse à coller à l'agent qui s'est arrêté

L'agent a trouvé une collision (`public.keep_alive` existe déjà, sans
`pinged_at`) et a demandé l'autorisation d'inspecter. Voici la réponse qui
débloque la situation sans rien lui faire modifier d'existant :

```text
Oui, l'inspection en lecture seule est autorisée, et elle l'était déjà
(annexe 2, commandes 3 et 4). Tu n'as pas besoin de me redemander avant de
LIRE : information_schema, pg_class, pg_proc, pg_policies. La seule chose
interdite reste d'écrire sur un objet que tu n'as pas créé.

Deux corrections à ma consigne initiale, tirées de ce que tu viens d'observer :

1. La région réelle est `eu-central-1`. Je m'étais trompé (`eu-west-2`).
   Le prompt est corrigé : la région et la version se lisent dans
   `list_projects`, elles ne se supposent pas.

2. Le heartbeat porte désormais un nom NEUF : `public.keep_alive_heartbeat`,
   et non `public.keep_alive`. Un `create table if not exists` sur un nom
   déjà pris réutilise la table existante en silence — c'est précisément le
   piège dans lequel l'annexe 1 allait tomber. La nouvelle version :
   - ne touche pas `public.keep_alive`, ne s'en sert pas, et le laisse tel quel
     (dis-moi juste en une ligne ce qu'il contient) ;
   - échoue AVANT toute écriture si le nom neuf existe sous une autre forme
     (bloc `do $$ … raise exception`), avec un message lisible ;
   - se termine par la vérification des colonnes réellement présentes.

Reprends à l'étape A2 avec cette version corrigée, et arrête-toi de nouveau
si `keep_alive_heartbeat` existe déjà sous une forme inattendue.

Le mot de passe Postgres reste à faire tourner, mais après la partie B : je ne
veux pas mélanger une rotation de secret avec une mise en service.
```

## 6. Ce que cette correction a appris sur le prompt lui-même

| Élément | Ce que j'avais écrit | Ce que le projet a montré |
| --- | --- | --- |
| Région | `eu-west-2` | **`eu-central-1`** — jamais lire une région dans une consigne, toujours dans l'API |
| Nom du heartbeat | `public.keep_alive` | **déjà pris** par un autre usage → nom dédié `keep_alive_heartbeat` |
| `create table if not exists` | présenté comme sûr | il **masque** une collision de forme : d'où le garde-fou `raise exception` |
| Autorisation de lire | implicite | l'agent s'est arrêté pour demander → désormais **explicite** dans les règles |

C'est le comportement attendu d'un audit honnête : le prompt s'est fait
corriger par le terrain, et la correction est ici, pas seulement dans la
conversation.
