# Bible Corpus Status

> Last build: 2026-09-12
> Pipeline: `npm run bible:build` → `BibleIngestionOrchestrator` → reports

## Summary

| Dataset | Language | Status | Verses | Checksum |
|---------|----------|--------|--------|----------|
| lsg | fr | BUILT ✓ | 31,170 | `96d1f2e2f3d6` |
| ostervald | fr | BUILT ✓ | 31,107 | `72766156e213` |
| darby | fr | BUILT ✓ | 31,170 | `cbc2ddbccc69` |

**3 / 3 datasets built. No failures.**

## Verse count note

The LSG/Ostervald/Darby datasets contain **≈ 31,000–31,200 verses** each,
driven by the verse-numbering convention of the eBible.org USFM source.
The validator treats verse-count mismatches as **warnings** (§53), so
incomplete source corpora (e.g. Darby with a few empty verses in ACT/MAT)
do not block the build.

## Excluded (licence-restricted, metadata only)

| Translation | Language | Reason |
|-------------|----------|--------|
| Parole de Vie 2017 | fr | LICENSE_REQUIRED |
| Bible du Semeur 2015 | fr | LICENSE_REQUIRED |
| Segond 21 | fr | LICENSE_REQUIRED |
| TOB | fr | LICENSE_REQUIRED |

See `docs/bible/EXCLUDED_TRANSLATIONS.md` for details.

## Engine gate (§50)

The multi-translation proof script (`npm run bible:verify`) confirms that
the **same** generic USFMAdapter produces 66 books for all three corpora
(frajnd, fra_fob, fraLSG), with verse counts within 0.2% of each other —
well inside the 5% tolerance gate.

```
frajnd_usfm:  66 books ✓, 31170 verses
fra_fob_usfm: 66 books ✓, 31107 verses
fraLSG_usfm:  66 books ✓, 31170 verses
Verse count range: 31107–31170 (Δ63, 0.2% — tolerance 5%)
§50 GATE: PASS
```

## Next steps (§44, §63–§64)

- [ ] eBible live discovery for WEB, WEB-Updated, RVR1909, Néo-Crampon (EN/FR).
- [ ] World corpus: add all priority languages (§39) via multi-workflow parallelism.
- [ ] Integrate new datasets into `bible-text-service.ts` (UI already supports `translationId`).
- [ ] Remove legacy `src/domains/bible/repository.ts` singleton from the app path.
