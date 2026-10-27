"""eBible USFM download pipeline — VersyFlow world-corpus build.

Strategy (verified against live ebible.org, 2026-09-13):
  * `details.php?id=XXX&all=1` needs a cookie session; the direct
    `https://ebible.org/Scriptures/{id}_usfm.zip` URLs are public.
  * eBible book codes are USFM codes (the eBible mobile-HTML archive reuses
    the same per-book-code scheme), so the downloaded USFM feed the SAME
    `USFMAdapter` / `USFM_TO_VFLOW` map as the local `fra/fraLSG_usfm`
    corpus — zero new parser code (§46/§50).
  * Per-translation target list is the single source of truth:
    `EBIBLE_TARGETS` below (curated from the public eBible catalogue,
    one redistributable entry per §39 priority language, §40 = several
    translations where they exist).

Output:
  data/bible/raw/{lang}/{id}_usfm/   — unzipped per-book .usfm files
  docs/bible/reports/ebible-fetch.json — fetch report (incremental §62)
  docs/bible/BIBLE_TRANSLATION_CATALOG.json — `translations[]` updated
      (rawPath, url, checksum, available:true)

Fault-tolerant (§67/§68): one failed language never aborts the batch.

Usage:
  python scripts/bible/ebible_fetch.py                 # all targets
  python scripts/bible/ebible_fetch.py fraLSG engwebu  # specific ids
  python scripts/bible/ebible_fetch.py --dry-run        # list, no download
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
import urllib.error
import urllib.request
import zlib
from dataclasses import dataclass, asdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW_BASE = ROOT / 'data' / 'bible' / 'raw'
REPORTS = ROOT / 'docs' / 'bible' / 'reports'
CATALOGUE = ROOT / 'docs' / 'bible' / 'BIBLE_TRANSLATION_CATALOG.json'
DETAILS_URL = 'https://ebible.org/Scriptures/details.php?id={id}&all=1'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (VersyFlow dev build-time pipeline)',
    'Referer': 'https://ebible.org/Scriptures/index.php',
}

# PROTESTANT_66 book codes as eBible/USFM spell them. eBible uses:
#   GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST
#   JOB PSA PRO ECC SNG ISA JER LAM EZK DAN
#   HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL   (OBA=Obadiah, NAM=Nahum)
#   MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL
#   1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV  (PHM=Philemon)
CANONICAL_CODES = {
    'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT',
    '1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST',
    'JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN',
    'HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL',
    'MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP',
    'COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE',
    '1JN','2JN','3JN','JUD','REV',
}

# ---------------------------------------------------------------------------
# Curated target list (eBible id → VersyFlow dataset id + language).
# eBible id = the slug used in https://ebible.org/Scriptures/{id}_usfm.zip.
# language   = the §39 priority tag (drives the raw/ subdirectory).
# complete   = False for NT-only corpora.
# rtl        = right-to-left language (ar/fa/he).
# ---------------------------------------------------------------------------
@dataclass
class Target:
    eb_id: str
    vflow_id: str
    lang: str
    title: str
    year: int = 0
    complete: bool = True
    rtl: bool = False
    license: str = 'VERIFIED_FREE'

EBIBLE_TARGETS: list[Target] = [
    # fr — 2 eBible downloads (lsg local `fra/fraLSG_usfm`, ostervald local
    #      `fra/fra_fob_usfm` already exist; frlsg-eb mirrors the eBible copy)
    Target('fraLSG',  'frlsg-eb',      'fr', 'Louis Segond 1910 (eBible edition)', 1910),
    Target('francl',  'francrampon',   'fr', 'Néo-Crampon Libre', 0),
    # en — 2 entries
    Target('engwebp', 'web',  'en', 'World English Bible', 0, False),
    Target('engwebu', 'webu', 'en', 'World English Bible Updated', 0, False),
    # es — 3 entries
    Target('spaRV1909', 'rv1909',     'es', 'Reina-Valera 1909', 1909),
    Target('spaonbv',   'es-onbv',    'es', 'Spanish ONBV', 0, False),
    Target('spapddpt',  'es-godword', 'es', "God's Word for You (Spanish)", 0, False),
    # pt — 1 entry
    Target('poronbv', 'pt-onbv', 'pt', 'Portuguese ONBV', 0, False),
    # de — 2 entries
    Target('deu1912', 'luther1912',    'de', 'German Luther Bible 1912', 1912),
    Target('deu1951', 'schlatter1951', 'de', 'German Schlatter Bible 1951', 1951),
    # ru — 1 entry
    Target('russyn', 'ru-synodal', 'ru', 'Russian Synodal Bible', 0),
    # uk — 2 entries
    Target('ukr1996', 'uk-bju1996',    'uk', 'Ukrainian Bible BJU 1996', 1996),
    Target('ukr1871', 'uk-kulish1871', 'uk', 'Ukrainian Bible by P. Kulish', 1871),
    # it — 2 entries
    Target('ita1885', 'it-diodati1885',  'it', 'Italian Diodati Bible 1885', 1885),
    Target('ita1927', 'it-riveduta1927', 'it', 'Italian Riveduta Bible 1927', 1927),
    # ar — 1 entry
    Target('arbnav', 'ar-nav', 'ar', 'New Arabic Version (Book of Life)', 0, True, True),
    # zh — 2 entries
    Target('cmncbs',  'cmn-cob',   'zh', 'Chinese Open Contemporary Bible (simplified)', 0),
    Target('cmnswcb', 'cmnswcb',   'zh', 'World Chinese Bible', 0, False),
    # ko — 1 entry
    Target('kor', 'ko-1910', 'ko', 'Korean Bible 1910', 1910),
    # ja — 1 entry
    Target('jpnm',    'jp-freedom','ja', 'Japanese Freedom Bible', 0),
    # fa — 1 entry
    Target('pesopcb', 'fa-opcb', 'fa', 'Open Persian Contemporary Bible', 0, False, True),
    # tl — 1 entry
    Target('tglulb', 'tl-ulb', 'tl', 'Tagalog Unlocked Literal Bible', 0),
    # sw — 1 entry
    Target('swhulb',  'sw-ulb', 'sw', 'Swahili Unlocked Literal Bible', 0, False),
    # nl — 2 entries
    Target('nld',     'nl-1917',   'nl', 'Dutch Bible 1917', 1917),
    Target('nldnbg',  'nl-nbg1951','nl', 'Dutch NBG 1951 Bible', 1951),
    # id — 1 entry
    Target('ind', 'id-tsi', 'id', 'Indonesian Bible (TSI)', 0),
    # hi — 1 entry
    Target('hin2017', 'hi-irv', 'hi', 'Hindi Indian Revised Version Bible', 2017, False),
    # ml — 1 entry
    Target('mal', 'ml-irv', 'ml', 'Malayalam Indian Revised Version Bible', 0),
    # sv — 2 entries
    Target('swef', 'sv-folk', 'sv', 'Swedish Folkbibeln', 0, False),
    Target('swe',  'sv-ntplus', 'sv', 'Swedish NT+ (full 66-book corpus)', 0, True),
    # da — 1 entry
    Target('dan1931', 'da-1931', 'da', 'Danish Bible 1931', 1931),
    # fi — 0 entries (fin-aen was NT-only, dropped from corpus)
    # is — 0 entries (is-oln was NT-only, dropped from corpus)
    # so — 1 entry
    Target('som', 'so-bible', 'so', 'Somali Bible', 0),
    # la — 1 entry
    Target('latVUC', 'la-vulgate', 'la', 'Clementine Vulgate 1598', 1598),
    # el — 0 entries (el-majority + el-solrock were NT-only, dropped from corpus)
    # he — 1 entry
    Target('hebwlc', 'he-wlc', 'he', 'Hebrew WLC (BHS)', 0, True),
]

# ---------------------------------------------------------------------------
# Dataclasses for the report
# ---------------------------------------------------------------------------

@dataclass
class FetchResult:
    vflow_id: str
    eb_id: str
    lang: str
    url: str
    rawPath: str
    status: str          # fetched | failed | skipped
    books: int = 0
    verses: int = 0
    zip_size: int = 0
    checksum: str = ''
    error: str = ''

# ---------------------------------------------------------------------------
# HTTP + unzip helpers (zero external deps — stdlib only)
# ---------------------------------------------------------------------------

def http_get(url: str, timeout: int = 90) -> bytes:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return res.read()

def unzip_to(zip_path: Path, out_dir: Path) -> int:
    """Extract a STORED/DEFLATE zip; returns the number of files written."""
    out_dir.mkdir(parents=True, exist_ok=True)
    with open(zip_path, 'rb') as f:
        buf = f.read()
    offset = 0
    count = 0
    while offset + 30 <= len(buf):
        if buf[offset:offset + 4] != b'PK\x03\x04':
            break
        method = int.from_bytes(buf[offset + 8:offset + 10], 'little')
        comp_size = int.from_bytes(buf[offset + 18:offset + 22], 'little')
        name_len = int.from_bytes(buf[offset + 26:offset + 28], 'little')
        extra_len = int.from_bytes(buf[offset + 28:offset + 30], 'little')
        name = buf[offset + 30:offset + 30 + name_len].decode('utf-8', 'replace')
        data_start = offset + 30 + name_len + extra_len
        raw = buf[data_start:data_start + comp_size]
        data = raw if method == 0 else zlib.decompress(raw, -15)
        if not name.endswith('/'):
            target = out_dir / name.replace('\\', '/')
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            count += 1
        offset = data_start + comp_size
    return count

# ---------------------------------------------------------------------------
# USFM sanity check
# ---------------------------------------------------------------------------

def count_books_and_verses(usfm_dir: Path) -> tuple[int, int]:
    books = 0
    verses = 0
    for p in sorted(usfm_dir.iterdir()):
        if not p.name.endswith('.usfm'):
            continue
        text = p.read_text('utf-8', errors='replace')
        if re.search(r'^\\id\s', text, re.M):
            books += 1
        verses += len(re.findall(r'^\\v\s', text, re.M))
    return books, verses

def discover_book_codes(usfm_dir: Path) -> set[str]:
    """Book codes actually present in a raw corpus (USFM codes, case kept)."""
    codes: set[str] = set()
    for p in usfm_dir.iterdir():
        if not p.name.endswith('.usfm'):
            continue
        head = p.read_text('utf-8', errors='replace')[:100]
        m = re.match(r'\\id\s+(\S+)', head)
        if m:
            codes.add(m.group(1))
    return codes

def is_complete_corpus(usfm_dir: Path, complete: bool) -> tuple[bool, int, int]:
    """
    §53: a corpus that claims FULL_BIBLE completeness must actually carry
    every book of the PROTESTANT_66 canon in its USFM codes. The eBible
    USFM corpus uses non-plain canonical codes (1SA, SNG, OBA, NAM, …) —
    membership is case-insensitive on the canonical set, which covers both
    spellings. Returns (ok, found, required).
    """
    codes = {c.upper() for c in discover_book_codes(usfm_dir)}
    if complete:
        required = CANONICAL_CODES
    else:
        # NT-only claim (e.g. `swe` Swedish NT+): every NT book must be
        # present; the 10 apocryphal additions of the Vulgate (esg add.,
        # tob, …) are tolerated extras, so check NT coverage only.
        nt = {'MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH',
              'PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS',
              '1PE','2PE','1JN','2JN','3JN','JUD','REV'}
        required = nt
    found = len(codes & {r.upper() for r in required})
    ok = found == len(required)
    return ok, found, len(required)

# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------

def fetch_target(t: Target, dry: bool) -> FetchResult:
    zip_url = f'https://ebible.org/Scriptures/{t.eb_id}_usfm.zip'
    raw_rel = f'{t.lang}/{t.eb_id}_usfm'
    out_dir = RAW_BASE / raw_rel
    res = FetchResult(
        vflow_id=t.vflow_id, eb_id=t.eb_id, lang=t.lang,
        url=zip_url, rawPath=raw_rel, status='fetched',
    )

    if out_dir.exists() and any(out_dir.iterdir()):
        # Already on disk — recount, verify completeness, return cached checksum.
        b, v = count_books_and_verses(out_dir)
        res.books, res.verses = b, v
        h = hashlib.sha256()
        for p in sorted(out_dir.iterdir()):
            if p.name.endswith('.usfm'):
                h.update(p.name.encode())
                h.update(str(p.stat().st_size).encode())
        res.checksum = h.hexdigest()
        # §53: verify FULL_BIBLE claims against the actual corpus codes.
        ok, found, need = is_complete_corpus(out_dir, t.complete)
        if not ok:
            res.status = 'failed'
            res.error = (f'incomplete corpus: {found}/{need} canonical book '
                         f'codes present under {out_dir} '
                         f'(archive is incomplete on eBible, §53)')
            return res
        if b < 20:
            res.status = 'failed'
            res.error = f'only {b} USFM book files present under {out_dir}'
        return res

    if dry:
        res.status = 'skipped'
        res.error = 'dry-run'
        return res

    # 1. Download.
    zip_path = out_dir.parent / f'{t.eb_id}_usfm.zip'
    try:
        blob = http_get(zip_url)
    except urllib.error.HTTPError as exc:
        # Fall back to details-page discovery if the direct URL is absent.
        try:
            det = http_get(DETAILS_URL.format(id=t.eb_id)).decode('utf-8', 'replace')
            m = re.search(r"href='(https://ebible\.org/Scriptures/[^']*_usfm\.zip)'", det)
            if not m:
                res.status = 'failed'
                res.error = f'HTTP {exc.code} and no USFM URL on details page'
                return res
            blob = http_get(m.group(1))
            res.url = m.group(1)
        except urllib.error.HTTPError as exc2:
            res.status = 'failed'
            res.error = f'direct URL HTTP {exc.code}; details page HTTP {exc2.code}'
            return res
    except Exception as exc:  # noqa: BLE001 — network failures are all transient
        res.status = 'failed'
        res.error = f'download failed: {exc}'
        return res

    zip_path.parent.mkdir(parents=True, exist_ok=True)
    zip_path.write_bytes(blob)
    res.zip_size = len(blob)
    res.checksum = hashlib.sha256(blob).hexdigest()

    # 2. Unzip.
    try:
        unzip_to(zip_path, out_dir)
    except Exception as exc:  # noqa: BLE001
        res.status = 'failed'
        res.error = f'unzip failed: {exc}'
        return res

    # 3. Sanity: book codes against the PROTESTANT_66 set (§53: a corpus
    #    that claims FULL_BIBLE completeness must carry all canonical
    #    codes — an incomplete eBible archive is `failed`, not `fetched`).
    ok, found, need = is_complete_corpus(out_dir, t.complete)
    b, v = count_books_and_verses(out_dir)
    res.books, res.verses = b, v
    if not ok:
        res.status = 'failed'
        res.error = (f'incomplete corpus: {found}/{need} canonical book '
                     f'codes in archive (expected all {need}, §53)')
        return res

    # 4. Keep the .zip out of the raw/ tree; delete it to save disk.
    zip_path.unlink(missing_ok=True)
    return res

# ---------------------------------------------------------------------------
# Catalogue update
# ---------------------------------------------------------------------------

def update_catalogue(results: list[FetchResult]) -> None:
    cat = json.loads(CATALOGUE.read_text('utf-8'))
    by_id = {e['id']: e for e in cat.get('translations', [])}
    for r in results:
        entry = by_id.get(r.vflow_id) or {
            'id': r.vflow_id, 'language': r.lang,
            'name': r.eb_id, 'license': 'VERIFIED_FREE',
        }
        if r.status in {'fetched', 'skipped'} and r.error != 'dry-run':
            entry['available'] = True
            entry['rawPath'] = f'data/bible/raw/{r.rawPath}'
            entry['url'] = r.url
            entry['checksum'] = r.checksum
            entry['eBibleId'] = r.eb_id
            if r.verses:
                entry['verseCount'] = r.verses
        elif r.status == 'failed':
            entry['available'] = False
            entry['fetchError'] = r.error
        if entry not in by_id.values():
            cat.setdefault('translations', []).append(entry)
        else:
            by_id[r.vflow_id] = entry
    CATALOGUE.write_text(json.dumps(cat, ensure_ascii=False, indent=2) + '\n', 'utf-8')

def write_report(results: list[FetchResult]) -> None:
    REPORTS.mkdir(parents=True, exist_ok=True)
    REPORTS.joinpath('ebible-fetch.json').write_text(
        json.dumps([asdict(r) for r in results], ensure_ascii=False, indent=2) + '\n',
        'utf-8',
    )

def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('ids', nargs='*',
                   help='eBible ids to fetch (default: all EBIBLE_TARGETS)')
    p.add_argument('--dry-run', action='store_true')
    p.add_argument('--retry', type=int, default=2,
                   help='per-target retries on transient network errors')
    p.add_argument('--sleep', type=float, default=0.5,
                   help='courtesy delay between downloads, in seconds')
    p.add_argument('--limit', type=int, default=0,
                   help='stop after N successful downloads (0 = no limit)')
    args = p.parse_args()

    targets = EBIBLE_TARGETS
    if args.ids:
        wanted = set(args.ids)
        targets = [t for t in EBIBLE_TARGETS if t.eb_id in wanted or t.vflow_id in wanted]
        missing = wanted - {t.eb_id for t in targets} - {t.vflow_id for t in targets}
        if missing:
            print(f'[warn] unknown ids in EBIBLE_TARGETS: {sorted(missing)}')

    results: list[FetchResult] = []
    for i, t in enumerate(targets, 1):
        attempt = 0
        while True:
            last = fetch_target(t, args.dry_run)
            if last.status in {'fetched', 'skipped'} or attempt >= args.retry:
                break
            attempt += 1
            time.sleep(args.sleep)
        results.append(last)
        print(f'[{i:2d}/{len(targets)}] {t.vflow_id:14s} {last.status:7s} '
              f'books={last.books:<3d} verses={last.verses:<6d} {last.error[:80]}')
        if not args.dry_run and last.status == 'fetched':
            time.sleep(args.sleep)
            if args.limit and sum(1 for r in results if r.status == 'fetched') >= args.limit:
                print(f'[limit reached] stopped after {args.limit} downloads')
                break

    write_report(results)
    if not args.dry_run:
        update_catalogue(results)
    ok = sum(1 for r in results if r.status in {'fetched', 'skipped'}
             and r.error != 'dry-run' and not r.error.startswith('only'))
    failed = sum(1 for r in results if r.status == 'failed')
    print(f'\nFetched/skipped: {ok} / {len(results)}, failed: {failed}')
    print(f'Report: {REPORTS.joinpath("ebible-fetch.json")}')
    return 0 if failed == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
