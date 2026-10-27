# Excluded Translations

> Translations that are **NOT** included in the distributed corpus.
>
> Per §14/§15/§23 of the master prompt: license-excluded entries carry
> **metadata only** — the text is never copied into the distributed corpus.
> They are listed in the registry as `LICENSE_REQUIRED` so the UI can display
> them with a "licence requise" badge, but no dataset is built for them.
> §53 source-completeness exclusions (archive incomplete on eBible) carry
> `available: false` and are skipped by every build.

## License exclusions

| Translation | Language | Year | License Status | Reason |
|-------------|----------|------|----------------|--------|
| Parole de Vie 2017 | fr | 2017 | LICENSE_REQUIRED | Propriétaire (Editions de la Pierre / OMF). Redistribuable uniquement avec autorisation écrite. |
| Bible du Semeur 2015 | fr | 2015 | LICENSE_REQUIRED | Propriétaire (Alliance). Texte protégé par le droit d'auteur. |
| Segond 21 | fr | 2007 | LICENSE_REQUIRED | Propriétaire (Alliance). Version moderne protégée. |
| TOB (Traduction Œcuménique de la Bible) | fr | 1999 | LICENSE_REQUIRED | Propriétaire (Alliance/La Baconnière). Redistribuable uniquement avec licence. |

## §53 Source-completeness exclusions

eBible USFM archives sometimes ship fewer than 66 book files. Such corpora
are `available: false` in `build-bible.ts` (skipped by every build) and
`available: false` in `BIBLE_TRANSLATION_CATALOG.json` — they may re-enter
the corpus when eBible publishes a complete archive.

| Dataset | Language | eBible archive | Present / required | Status |
|---------|----------|----------------|--------------------|--------|
| `id-tsi` | id | `ind` | 51 / 66 USFM files (15 books missing, §53) | Excluded until a complete archive is available |

> Note: `id-tsi.json` was produced in an earlier build cycle when the
> 51-file archive was treated as admissible. It is **not** in the
> §39-priority corpus and is not bundled with the app. Re-verify by
> deleting the file and re-running `npm run bible:build` — the dataset
> will not be rebuilt because the manifest is `available: false`.

## How to include one (if the licence is later cleared)

1. Obtain written permission from the rights holder.
2. Add a `VERIFIED_FREE` / `VERIFIED_OPEN` registry entry with the source URL
   and the licence page.
3. Add the raw USFM to `data/bible/raw/fra/` (or download it during the build).
4. Re-run `npm run bible:build -- <id>`.

## How to re-include a §53-excluded translation (once complete)

1. Confirm the eBible archive now ships 66 USFM files:
   `python scripts/bible/ebible_fetch.py ind` and check the report.
2. Flip `available: true` in `scripts/bible/build-bible.ts` and the catalog.
3. Re-run `npm run bible:build` and confirm the validator is clean.

Until then, the text of these translations is **excluded from the app bundle**.
