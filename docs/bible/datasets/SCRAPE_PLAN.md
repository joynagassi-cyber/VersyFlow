# Bible Datasets — Scrape Plan

> Status: 2026-10-04. Companion to `scripts/bible/ebible_catalog.py`
> (resolve + fetch + catalog stubs) and `docs/bible/reports/ebible-pending.json`.

## Scope

Add new **libre accès** Bible translations to the `bible-datasets`
distribution pipeline (Supabase Storage public bucket → on-demand
download on the client, `app/settings/available-translations.tsx`).
The corpus must cover the PROTESTANT_66 canon (66 books); the build
gate §53 (`scripts/bible/build-bible.ts`) rejects incomplete archives.

## License policy (non-negotiable)

| Verdict | Accept? | Rule |
|---|---|---|
| Public domain (KJV derivatives, pre-1928 translations, eBible "public domain" rows) | ✅ | — |
| CC0 | ✅ | — |
| CC-BY (attribution OK, no NC/S) | ✅ | Record the license version + attribution string in the catalog entry |
| CC-BY-NC(-SA) / CC-BY-SA | ❌ | Non-commercial or share-alike → excluded (commercial app) |
| Lockman / SBB / proprietary (NIV, ESV, BSB, NBLH, DHH, KJV-2011, ARA-ARC/NV12, AFA, KOB) | ❌ | Never scraped — see "Excluded" below |

## Added in this plan (2 built + 2 pending stubs)

### 1. `asv` — American Standard Version (1901) — EN — ✅ BUILT

- **Source**: eBible id `eng-asv`, direct URL
  `https://ebible.org/Scriptures/eng-asv_usfm.zip` (HTTP 200, 2 803 KB).
- **License**: public domain (eBible detail page: "Public Domain" — the
  1901 text; public domain in the US).
- **Format**: USFM, 71 files (66 canonical + `00-FRT` + `01-INT` front
  matter, filtered by `EBIBLE_NON_CANONICAL` in `build-bible.ts` after
  adding `INT` to the set).
- **§53 check**: 66/66 canonical book codes (verified on the archive).
- **Raw location**: `data/bible/raw/en/asv_usfm/` (flattened; the eBible
  zip nests one extra dir, `fetch_asv_bsb.py` + `ebible_catalog.py`
  `RAW_PATH_OVERRIDES` handle it).
- **Status**: `ready` — `data/bible/asv.json` built (31 102 verses),
  catalog entry with real sha256 + sizeBytes.

### 2. `bsb` — Berean Standard Bible — EN — ✅ BUILT

- **Source**: eBible id `engbsb`, direct URL
  `https://ebible.org/Scriptures/engbsb_usfm.zip` (HTTP 200, 2 946 KB).
- **License**: CC-BY per eBible detail page ("public domain" link to
  berean.bible + CC family noted). The BSB's legal posture is loose
  enough that eBible ships it freely; **recorded as CC** — verify the
  exact BSB open-source license (CC-BY 4.0 non-commercial vs. full
  CC-BY) with the legal gate before marketing claims.
- **Format**: USFM, 66 canonical files (no front matter).
- **§53 check**: 66/66 canonical book codes (verified on the archive).
- **Raw location**: `data/bible/raw/en/bsb_usfm/`.
- **Status**: `ready` — `data/bible/bsb.json` built (31 086 verses),
  catalog entry with real sha256 + sizeBytes.

### 3. `de-tkw` — Textbibel Kautzsch & Weizsäcker (1906) — DE — pending

- **Source**: eBible id `deuTKW`, URL
  `https://ebible.org/Scriptures/deutkw_usfm.zip`.
- **License**: public domain (1906 translation; eBible detail page
  says "public domain").
- **§53 check**: not run yet (archive not downloaded).
- **Effort**: small (~7 MB zip expected).
- **Status**: `pending` — catalog stub in
  `data/bible/dataset-catalog.json`; run
  `python scripts/bible/ebible_catalog.py --fetch --update-catalog`
  then `npm run bible:build -- de-tkw`.

### 4. `pt-brbsl` — Bíblia Portuguesa Mundial — PT — pending

- **Source**: eBible id `porbrbsl`, URL
  `https://ebible.org/Scriptures/porbrbsl_usfm.zip`.
- **License**: public domain per eBible metadata table (2022 "Bíblia
  Livre" family; double-check the exact CC/PD wording on the detail
  page before shipping).
- **§53 check**: not run yet.
- **Effort**: small.
- **Status**: `pending` — catalog stub; same workflow as `de-tkw`.

## Excluded — and why (audit trail)

| Target | Source | Verdict | Reason |
|---|---|---|---|
| `spaNBLH` (NBLH) | eBible detail page | ❌ | "Copyright © 2005 The Lockman Foundation" — no USFM redistribution, no public URL |
| `spavbl` (Versión Biblia Libre) | eBible detail page | ❌ | CC-BY-SA 4.0 (ShareAlike) — too restrictive for a commercial app |
| `porTFT` (Tradução para Tradutores, 2018) | eBible detail page | ❌ | "Copyright © 2018 Ellis W. Deibler, Jr." — private copyright |
| RVR 1960 | not on eBible | ❌ | Spanish RVR-1960 is still under copyright; not freely distributed |
| ARA (Almeida Rev. e Atualizada) | not on eBible | ❌ | Proprietary (CIP / SBB), not freely distributed |
| CBOL (CUV) | not on eBible (id `cmnCBOL` not found) | ⚠️ | CUV-1919 text is public domain in some jurisdictions; no verified free USFM source found on eBible this run — revisit later |
| KOB (Kyodoin) | not on eBible (`jpnKOB` not found) | ❌ | KOB is CC-BY-SA (share-alike) → excluded |
| SVD (Simplified Vocabulary Bible) | not on eBible | ⚠️ | eBible's `arb`/`araAF`/`araSVD` ids not found; the SVD is historically CC-BY (verify current wording) — revisit later |
| AFA (Arabic Family Bible) | not on eBible | ❌ | Not freely distributed |
| YAKU (Hausa) | not on eBible | ❌ | No verified public USFM source found this run |
| TLA (Swahili) | not on eBible (`swaTLA`/`swa` not found) | ⚠️ | No verified public USFM source found this run |
| HINDI (1967) | not on eBible (`hin1967` not found) | ⚠️ | No verified public USFM source found this run (existing `hi-irv` covers Hindi) |
| KRV (1930 Korean) | not on eBible | ⚠️ | No verified public USFM source found this run (existing `ko-1910` covers Korean) |
| Elberfelder (deuELB) | not on eBible (`deuELB`/`deuelb` not found; only `deuTKW`/`deuELO`/`deu1912`/`deu1951`) | ❌ | Elberfelder is CC-BY-SA → excluded |
| NIV-PT | paywalled | ❌ | Paywalled |
| Louis Segond 21 | paywalled (alliance biblique) | ❌ | Paywalled |
| WEB | `web` + `webu` already built | — | Already in the corpus |
| Schlatter 1951 | `schlatter1951` already built | — | Already in the corpus |
| Luther 1912 | `luther1912` already built | — | Already in the corpus |
| Segond 1910 | `lsg` already built | — | Already in the corpus |

## Follow-ups (out of scope for this commit)

1. **Verify BSB license wording** with the legal gate before any
   marketing copy that references "Berean Standard Bible".
2. **SVD / CBOL / TLA / KRV / HINDI 1967** — re-run the eBible
   resolver (`--force-resolve`) after their country pages are
   reachable; some eBible country pages were returning HTTP 500
   during this run (en / zh / ja / ko / hi / sw / ha).
3. **`npm run bible:deploy`** after `de-tkw` / `pt-brbsl` are built
   (push to Supabase Storage `bible-datasets`).
