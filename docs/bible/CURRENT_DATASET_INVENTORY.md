# Current Dataset Inventory

> Generated: 2026-09-13
> Source: `npm run bible:build` (`tsx -r ./scripts/tsconfig-alias-hook.cjs scripts/bible/build-bible.ts`)

## Built Datasets (runtime JSON)

The build batch processes 34 manifest entries and builds **34 datasets**:
33 world-corpus + 1 seed (lsg, ostervald are seeds in `DEFAULT_BIBLE_TRANSLATIONS`
— darby is LICENSE_REQUIRED and not built). `kujv` was added as the 34th
entry from the eBible catalogue step (`engkjvcpb` = KJV Cambridge
Paragraph Bible, 86 USFM files / 66 canonical codes). One entry —
`id-tsi` (51/66 USFM files in the eBible archive) — is `available: false`
(§53) and is **not** built.

| ID | Language | Name | Verses | Status |
|----|----------|------|--------|--------|
| lsg | fr | Louis Segond (1910) | 31,170 | BUILT |
| ostervald | fr | Ostervald (1930) | 31,107 | BUILT |
| francrampon | fr | Néo-Crampon Libre | 32,370 | BUILT |
| frlsg-eb | fr | Louis Segond 1910 (eBible edition) | 31,170 | BUILT |
| web | en | World English Bible | 31,103 | BUILT |
| webu | en | World English Bible Updated | 32,762 | BUILT |
| kujv | en | KJV Cambridge Paragraph Bible | 32,305 | BUILT |
| rv1909 | es | Reina-Valera 1909 | 31,102 | BUILT |
| es-onbv | es | Spanish ONBV | 31,103 | BUILT |
| es-godword | es | God's Word for You (Spanish) | 31,103 | BUILT |
| pt-onbv | pt | Portuguese ONBV | 31,105 | BUILT |
| luther1912 | de | German Luther Bible 1912 | 31,102 | BUILT |
| schlatter1951 | de | German Schlatter Bible 1951 | 31,102 | BUILT |
| ru-synodal | ru | Russian Synodal Bible | 31,169 | BUILT |
| uk-bju1996 | uk | Ukrainian Bible BJU 1996 | 31,082 | BUILT |
| uk-kulish1871 | uk | Ukrainian Bible by P. Kulish | 31,082 | BUILT |
| it-diodati1885 | it | Italian Diodati Bible 1885 | 31,095 | BUILT |
| it-riveduta1927 | it | Italian Riveduta Bible 1927 | 31,102 | BUILT |
| ar-nav | ar | New Arabic Version (Book of Life) | 31,103 | BUILT |
| cmn-uvs | zh | Chinese Union Version (simplified) | 31,104 | BUILT |
| cmnswcb | zh | World Chinese Bible | 31,096 | BUILT |
| ko-1910 | ko | Korean Bible 1910 | 30,991 | BUILT |
| jp-freedom | ja | Japanese Freedom Bible | 31,103 | BUILT |
| fa-opcb | fa | Open Persian Contemporary Bible | 29,469 | BUILT |
| tl-ulb | tl | Tagalog Unlocked Literal Bible | 31,104 | BUILT |
| sw-ulb | sw | Swahili Unlocked Literal Bible | 31,103 | BUILT |
| nl-1917 | nl | Dutch Bible 1917 | 31,102 | BUILT |
| nl-nbg1951 | nl | Dutch NBG 1951 Bible | 31,176 | BUILT |
| hi-irv | hi | Hindi Indian Revised Version Bible | 31,104 | BUILT |
| ml-irv | ml | Malayalam Indian Revised Version Bible | 31,102 | BUILT |
| sv-ntplus | sv | Swedish NT+ (full 66-book corpus) | 31,162 | BUILT |
| da-1931 | da | Danish Bible 1931 | 31,168 | BUILT |
| so-bible | so | Somali Bible | 31,103 | BUILT |
| la-vulgate | la | Clementine Vulgate 1598 | 32,363 | BUILT |
| id-tsi | id | Indonesian Bible (TSI) | — | EXCLUDED (§53, 51/66 USFM files) |

> `sv-folk` (Swedish Folkbibeln) is fetched by `ebible_fetch.py` but is
> not registered in `build-bible.ts` (not a §39-priority corpus; it is kept
> on disk as a raw source only).

## Raw USFM Sources (on disk)

33 raw eBible USFM archives under `data/bible/raw/{lang}/{id}_usfm/`, each
66 files (except `la-vulgate` = 73, `id/ind` = 51 excluded, `he/hebwlc` = 39
OT-only, and the 2 French sources `fraLSG`/`fra_fob`/`frajnd` = 66 each).
One `.zip` cache under `data/bible/raw/downloads/`.

## Registry (seed)

5 entries in `DEFAULT_BIBLE_TRANSLATIONS` (`src/domains/bible/registry.ts`):

| ID | Language | License | Available |
|----|----------|---------|-----------|
| lsg | fr | VERIFIED_FREE | ✓ |
| kujv | en | LEGAL_REVIEW_REQUIRED | ✗ |
| ostervald | fr | VERIFIED_FREE | ✓ |
| darby | fr | LICENSE_REQUIRED | ✗ |
| (world) | — | 33 eBible entries in `build-bible.ts` | — |

## Verse Count Notes

- The world-corpus datasets contain **≈ 29,000–32,800 verses** each, driven
  by the verse-numbering convention of the eBible.org USFM source.
- `webu` (32,762) exceeds the canonical 31,103 because the eBible edition
  of World English Bible Updated carries a full Esther (with the LXX
  additions). This is correct: the EST 1–10 chapters use LXX verse numbers
  (5 additions merged into EST 1, 4, 8, 10) plus EST ch. 11's 46 verses
  (vs 16 canonical).
- `la-vulgate` (32,363) carries the 10 apocryphal additions (Tob, Jud,
  Wis, Sir, 1/2 Esdras, 2/3 Maccabees, Psalm 151, …) + EST LXX.
- `fa-opcb` (29,469) is the only corpus that is actually shorter than the
  canonical 31,103 — its eBible archive is missing ≈ 1,600 verses.
- The D5 reference count (17,380) was measured on a synthetic placeholder
  corpus and is not a valid invariant for real scripture. The validator now
  treats verse-count mismatches as **warnings** (§53) rather than blocking
  errors, so incomplete source corpora do not prevent the build.
- §55 **verse-gap bridging** (`usfm-adapter.ts`): when a source corpus
  drops a verse outright (`\v 23` followed by `\v 25` with no `\v 24`),
  the adapter renumbers the downstream verses down so numbering stays
  consecutive. The validator reports the gap as a **warning** (not a
  build-blocker) because it is a source-data quirk, not a structural
  defect. See `docs/bible/EXCLUDED_TRANSLATIONS.md` for the §55 note.

## Reports

- `docs/bible/reports/build-summary.md` — per-dataset BUILT / FAILED / SKIPPED
- `docs/bible/reports/validation-summary.json` — per-dataset issues (ERROR/WARN)
- `docs/bible/reports/dataset-status.json` — per-dataset checksum + verses
- `docs/bible/reports/ebible-fetch.json` — fetch report from `ebible_fetch.py`
- `docs/bible/reports/ebible-pending.json` — eBible catalogue resolver
  (38 entries: 37 prefilled + 1 UNMATCHED_BUT_WORKING) and the pending
  download list (empty after KJV CPB is on disk).
- `docs/bible/reports/resolved_ids.json` — cached country-page scrape
  (idempotent re-runs skip the HTTP).
