# Current Dataset Inventory

> Generated: 2026-09-12
> Source: `npm run bible:build`

## Built Datasets (runtime JSON)

| ID | Language | Name | Verses | Checksum | Status |
|----|----------|------|--------|----------|--------|
| lsg | fr | Louis Segond (1910) | 31,170 | `96d1f2e2…` | BUILT |
| ostervald | fr | Ostervald (1930) | 31,107 | `72766156…` | BUILT |
| darby | fr | Darby (1865) | 31,170 | `cbc2ddbccc…` | BUILT |

## Raw USFM Sources (on disk)

| Corpus | Path | Files |
|--------|------|-------|
| LSG | `data/bible/raw/fra/fraLSG_usfm/` | 66 .usfm + 3 aux |
| Ostervald (fra_fob) | `data/bible/raw/fra/fra_fob_usfm/` | 66 .usfm + 3 aux |
| Darby (frajnd) | `data/bible/raw/fra/frajnd_usfm/` | 66 .usfm + 3 aux |

## Registry (seed)

4 entries in `DEFAULT_BIBLE_TRANSLATIONS`:

| ID | Language | License | Available |
|----|----------|---------|-----------|
| lsg | fr | VERIFIED_FREE | ✓ |
| kujv | en | LEGAL_REVIEW_REQUIRED | ✗ |
| ostervald | fr | VERIFIED_FREE | ✓ |
| darby | fr | LICENSE_REQUIRED | ✗ |

## Verse Count Notes

The LSG/Ostervald/Darby datasets contain **≈ 31,000–31,200 verses** each,
driven by the verse-numbering convention of the eBible.org USFM source.
This is **not** the same as the placeholder corpus count (17,380) in the
original `data/bible/lsg.json` — the new datasets are rebuilt from the
actual USFM raw files.

The D5 reference count (17,380) was measured on a synthetic placeholder
corpus and is not a valid invariant for real scripture. The validator now
treats verse-count mismatches as **warnings** (§53) rather than blocking
errors, so incomplete source corpora (e.g. Darby with some empty verses)
do not prevent the build.
