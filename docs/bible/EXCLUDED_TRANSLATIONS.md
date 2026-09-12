# Excluded Translations

> Translations that are **NOT** included in the distributed corpus because
> their redistribution license is not free/verified.
>
> Per §14/§15/§23 of the master prompt: these entries carry **metadata only**
> — the text is never copied into the distributed corpus. They are listed in
> the registry as `LICENSE_REQUIRED` so the UI can display them with a
> "licence requise" badge, but no dataset is built for them.

| Translation | Language | Year | License Status | Reason |
|-------------|----------|------|----------------|--------|
| Parole de Vie 2017 | fr | 2017 | LICENSE_REQUIRED | Propriétaire (Editions de la Pierre / OMF). Redistribuable uniquement avec autorisation écrite. |
| Bible du Semeur 2015 | fr | 2015 | LICENSE_REQUIRED | Propriétaire (Alliance). Texte protégé par le droit d'auteur. |
| Segond 21 | fr | 2007 | LICENSE_REQUIRED | Propriétaire (Alliance). Version moderne protégée. |
| TOB (Traduction Œcuménique de la Bible) | fr | 1999 | LICENSE_REQUIRED | Propriétaire (Alliance/La Baconnière). Redistribuable uniquement avec licence. |

## How to include one (if the licence is later cleared)

1. Obtain written permission from the rights holder.
2. Add a `VERIFIED_FREE` / `VERIFIED_OPEN` registry entry with the source URL
   and the licence page.
3. Add the raw USFM to `data/bible/raw/fra/` (or download it during the build).
4. Re-run `npm run bible:build -- <id>`.

Until then, the text of these translations is **excluded from the app bundle**.
