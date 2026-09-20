#!/usr/bin/env python3
"""ebible_catalog.py — exhaustive eBible catalogue + auto-resolve → ids.

Companion to ebible_fetch.py. What this script does (in 4 steps):

  1. resolve_ids()      — walks eBible's country pages
                          (https://ebible.org/Scriptures/country.php?c=XX)
                          for every language in CATALOG, harvests the
                          (title, id) rows, and matches them against
                          CATALOG's titles. Results are cached in
                          docs/bible/reports/resolved_ids.json so re-runs
                          are instant and idempotent.
  2. merge_with_prefilled — CATALOG entries already carrying a
                          PREFILLED id win on conflict; missing ids are
                          filled from the resolve step.
  3. drop_already_downloaded — any entry whose raw dir
                          (data/bible/raw/{lang}/{id}_usfm) already has
                          .usfm files is removed from the pending list.
  4. The remaining pending list is written to
                          docs/bible/reports/ebible-pending.json — the
                          input a downloader (this script itself, with
                          --fetch, or a future CI job) consumes.

What it guarantees: every CATALOG translation has a real eBible id (or
is explicitly UNMATCHED, recorded in the report). What it does NOT
guarantee: that the id is "correct" in the sense of "matches your
title exactly" — that is a fuzzy title match, and the resolver is
run against the LATEST eBible country page.

Usage:
  python scripts/bible/ebible_catalog.py                 # resolve + merge + drop (offline)
  python scripts/bible/ebible_catalog.py --fetch         # + download the pending list
  python scripts/bible/ebible_catalog.py --force-resolve # re-scrape (ignore cache)

Network policy: eBible is the only external source. No cookies, no
auth, no non-public endpoints. The country page is plain HTML.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.request
import zlib
from dataclasses import asdict, dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW_BASE = ROOT / 'data' / 'bible' / 'raw'
REPORTS = ROOT / 'docs' / 'bible' / 'reports'
RESOLVED_CACHE = REPORTS / 'resolved_ids.json'
PENDING_REPORT = REPORTS / 'ebible-pending.json'
COUNTRY_URL = 'https://ebible.org/Scriptures/country.php?c={c}'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (VersyFlow dev build-time pipeline)',
    'Referer': 'https://ebible.org/Scriptures/index.php',
}

# ---------------------------------------------------------------------------
# Catalogue — exhaustive, grouped by language > country. Each entry is
# a (vflow_id, country_code, eBible title) triple. eBible's country pages
# are keyed by ISO-639-1 codes (ar, da, de, el, en, es, fa, fi, fr, he,
# hi, id, is, it, ja, ko, la, ml, nl, no, pt, ru, so, sv, sw, tl, uk,
# zh). The titles must match eBible's exact spelling (case-insensitive
# match is attempted, exact-match preferred).
#
# `PREFILLED_IDS` below is the set of entries where the eBible id is
# already known (verified against ebible_fetch.py). For these, the
# resolver SKIPS scraping and uses the pre-filled value directly —
# the pre-fill always wins on conflict.
#
# `UNMATCHED_BUT_WORKING` lists entries that previously failed to
# resolve but where the id IS the value in PREFILLED_IDS — the list
# is a reminder, not an override. If the resolver re-finds them on a
# live country page, the live value is used (eBible occasionally
# re-keys ids).
# ---------------------------------------------------------------------------

CATALOG: dict[str, list[tuple[str, str, str]]] = {
    # (vflow_id, country_code, eBible title)
# fr — 4
    'fr': [
        ('frlsg-eb',    'fr', 'Louis Segond 1910'),
        ('ostervald',   'fr', 'La Sainte Bible'),            # eBible id fra_fob
        ('darby',       'fr', 'Bible J.N. Darby'),
        ('francrampon', 'fr', 'Sainte Bible néo-Crampon Libre'),
    ],
    # en — 3
    'en': [
        ('web',       'en', 'World English Bible'),
        ('webu',      'en', 'World English Bible Updated'),
        ('kujv',      'en', 'King James Version'),
    ],
    # es — 3
    'es': [
        ('rv1909',     'es', 'Santa Biblia Reina Valera 1909'),
        ('es-onbv',    'es', 'Biblica® Open Nueva Biblia Viva 2008'),
        ('es-godword', 'es', 'God\'s Word for You (Spanish)'),
    ],
    # pt — 1
    'pt': [
        ('pt-onbv', 'pt', 'Biblica® Open Nova Bíblia Viva 2007'),
    ],
    # de — 2
    'de': [
        ('luther1912',    'de', 'Luther Bible 1912'),
        ('schlatter1951', 'de', 'Schlatter Bible 1951'),
    ],
    # ru — 1
    'ru': [
        ('ru-synodal', 'ru', 'Russian Synodal Bible'),
    ],
    # uk — 2
    'uk': [
        ('uk-bju1996',    'uk', 'Ukrainian Bible BJU 1996'),
        ('uk-kulish1871', 'uk', 'Ukrainian Bible by P. Kulish'),
    ],
    # it — 2
    'it': [
        ('it-diodati1885',  'it', 'Diodati Bible 1885'),
        ('it-riveduta1927', 'it', 'Riveduta Bible 1927'),
    ],
    # ar — 1
    'ar': [
        ('ar-nav', 'ar', 'New Arabic Version'),
    ],
    # zh — 3
    'zh': [
        ('cmn-uvs',   'zh', 'Chinese Union Version'),
        ('cmnswcb',   'zh', 'World Chinese Bible'),
        ('cmn-cob',   'zh', 'Open Contemporary Bible'),
    ],
    # ko — 1
    'ko': [
        ('ko-1910', 'ko', 'Korean Bible 1910'),
    ],
    # ja — 1
    'ja': [
        ('jp-freedom', 'ja', 'Japanese Freedom Bible'),
    ],
    # fa — 1
    'fa': [
        ('fa-opcb', 'fa', 'Open Persian Contemporary Bible'),
    ],
    # tl — 1
    'tl': [
        ('tl-ulb', 'tl', 'Unlocked Literal Bible'),
    ],
    # sw — 1
    'sw': [
        ('sw-ulb', 'sw', 'Unlocked Literal Bible'),
    ],
    # nl — 2
    'nl': [
        ('nl-1917',    'nl', 'De Bijbel (1917)'),
        ('nl-nbg1951', 'nl', 'NBG-vertaling 1951'),
    ],
    # id — 1
    'id': [
        ('id-tsi', 'id', 'Alkitab TSI'),
    ],
    # hi — 1
    'hi': [
        ('hi-irv', 'hi', 'Indian Revised Version'),
    ],
    # ml — 1
    'ml': [
        ('ml-irv', 'ml', 'Malayalam Indian Revised Version'),
    ],
    # sv — 2
    'sv': [
        ('sv-ntplus', 'sv', 'Swedish NT+ (full 66-book corpus)'),
        ('sv-folk',   'sv', 'Swedish Folkbibeln'),
    ],
    # da — 1
    'da': [
        ('da-1931', 'da', 'Den Danske Bibel 1931'),
    ],
    # so — 1
    'so': [
        ('so-bible', 'so', 'Somali Bible'),
    ],
    # la — 1
    'la': [
        ('la-vulgate', 'la', 'Vulgata Clementina 1598'),
    ],
    # he — 1
    'he': [
        ('he-wlc', 'he', 'Hebrew WLC (BHS)'),
    ],
}

# ---------------------------------------------------------------------------
# Prefilled ids — already verified against ebible_fetch.py (which downloads
# these exact archives). The resolver SKIPs scraping for these.
# The vflow_id → ebible_id map is the authoritative mapping; the eBible
# title is used ONLY to confirm the row was actually found on the
# country page (a sanity check, not the resolver's key).
# ---------------------------------------------------------------------------

PREFILLED_IDS: dict[str, str] = {
    'frlsg-eb':  'fraLSG',
    'ostervald': 'fra_fob',
    'darby':     'frajnd',
    'francrampon': 'francl',
    'web':       'engwebp',
    'webu':      'engwebu',
    'rv1909':    'spaRV1909',
    'es-onbv':   'spaonbv',
    'es-godword':'spapddpt',
    'pt-onbv':   'poronbv',
    'luther1912':'deu1912',
    'schlatter1951': 'deu1951',
    'ru-synodal':'russyn',
    'uk-bju1996':'ukr1996',
    'uk-kulish1871': 'ukr1871',
    'it-diodati1885': 'ita1885',
    'it-riveduta1927': 'ita1927',
    'ar-nav':    'arbnav',
    'cmn-uvs':   'cmncbs',
    'cmnswcb':   'cmnswcb',
    'cmn-cob':   'cmncob',
    'ko-1910':   'kor',
    'jp-freedom':'jpnm',
    'fa-opcb':   'pesopcb',
    'tl-ulb':    'tglulb',
    'sw-ulb':    'swhulb',
    'nl-1917':   'nld',
    'nl-nbg1951':'nldnbg',
    'id-tsi':    'ind',
    'hi-irv':    'hin2017',
    'ml-irv':    'mal',
    'sv-ntplus': 'swe',
    'sv-folk':   'swef',
    'da-1931':   'dan1931',
    'so-bible':  'som',
    'la-vulgate':'latVUC',
    'he-wlc':    'hebwlc',
    # 'kujv' intentionally absent: eBible's KJV id is 'engKJV'; verify by
    # scraping (UNMATCHED_BUT_WORKING below).
}

# Entries that the previous resolver run marked UNMATCHED but that
# actually DO have a working eBible id (recorded for the next run).
# The next --force-resolve will re-attempt scraping; if it finds the
# id, it overwrites this list. If it does not, the entry stays in
# PREFILLED_IDS (no fallback to UNMATCHED, since these are "known").
UNMATCHED_BUT_WORKING: dict[str, str] = {
    'kujv': 'engkjvcpb',  # KJV Cambridge Paragraph Bible (verified 2026-09-13)
}

# vflow_id → raw USFM directory as recorded in BIBLE_TRANSLATION_CATALOG.json.
# `drop_already_downloaded` checks this path, not the generic
# RAW_BASE/{lang}/{eb_id}_usfm, because `fra/fra_fob_usfm` (ostervald)
# and `fra/frajnd_usfm` (darby) live under `fra/` not `fr/`, and KJV
# / cmn-cob have never been downloaded yet.
RAW_PATH_OVERRIDES: dict[str, str] = {
    'frlsg-eb':     'data/bible/raw/fr/fraLSG_usfm',
    'francrampon':  'data/bible/raw/fr/francl_usfm',
    'web':          'data/bible/raw/en/engwebp_usfm',
    'webu':         'data/bible/raw/en/engwebu_usfm',
    'rv1909':       'data/bible/raw/es/spaRV1909_usfm',
    'es-onbv':      'data/bible/raw/es/spaonbv_usfm',
    'es-godword':   'data/bible/raw/es/spapddpt_usfm',
    'pt-onbv':      'data/bible/raw/pt/poronbv_usfm',
    'luther1912':   'data/bible/raw/de/deu1912_usfm',
    'schlatter1951':'data/bible/raw/de/deu1951_usfm',
    'ru-synodal':   'data/bible/raw/ru/russyn_usfm',
    'uk-bju1996':   'data/bible/raw/uk/ukr1996_usfm',
    'uk-kulish1871':'data/bible/raw/uk/ukr1871_usfm',
    'it-diodati1885': 'data/bible/raw/it/ita1885_usfm',
    'it-riveduta1927':'data/bible/raw/it/ita1927_usfm',
    'ar-nav':       'data/bible/raw/ar/arbnav_usfm',
    'cmn-uvs':      'data/bible/raw/zh/cmncbs_usfm',
    'cmnswcb':      'data/bible/raw/zh/cmnswcb_usfm',
    'cmn-cob':      'data/bible/raw/zh/cmncbs_usfm',  # same archive as cmn-uvs
    'ko-1910':      'data/bible/raw/ko/kor_usfm',
    'jp-freedom':   'data/bible/raw/ja/jpnm_usfm',
    'fa-opcb':      'data/bible/raw/fa/pesopcb_usfm',
    'tl-ulb':       'data/bible/raw/tl/tglulb_usfm',
    'sw-ulb':       'data/bible/raw/sw/swhulb_usfm',
    'nl-1917':      'data/bible/raw/nl/nld_usfm',
    'nl-nbg1951':   'data/bible/raw/nl/nldnbg_usfm',
    'id-tsi':       'data/bible/raw/id/ind_usfm',
    'hi-irv':       'data/bible/raw/hi/hin2017_usfm',
    'ml-irv':       'data/bible/raw/ml/mal_usfm',
    'sv-ntplus':    'data/bible/raw/sv/swe_usfm',
    'sv-folk':      'data/bible/raw/sv/swef_usfm',
    'da-1931':      'data/bible/raw/da/dan1931_usfm',
    'so-bible':     'data/bible/raw/so/som_usfm',
    'la-vulgate':   'data/bible/raw/la/latVUC_usfm',
    'he-wlc':       'data/bible/raw/he/hebwlc_usfm',
    # Overrides for the French seed corpora (in `fra/`, not `fr/`):
    'ostervald':    'data/bible/raw/fra/fra_fob_usfm',
    'darby':        'data/bible/raw/fra/frajnd_usfm',
}

# ---------------------------------------------------------------------------
# Result records
# ---------------------------------------------------------------------------

@dataclass
class ResolveResult:
    vflow_id: str
    country_code: str
    title: str
    eb_id: str | None
    source: str            # 'prefilled' | 'country_page' | 'unmatched'
    country_url: str
    match_type: str       # 'exact' | 'case-insensitive' | 'unknown'

@dataclass
class Pending:
    vflow_id: str
    eb_id: str
    lang: str
    url: str
    reason: str = ''


# ---------------------------------------------------------------------------
# Country page scraper (zero external deps, stdlib urllib + zlib)
# ---------------------------------------------------------------------------

def http_get(url: str, timeout: int = 45) -> bytes:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return res.read()

# eBible's country page rows look like:
#   <tr class='redist'><td><a href='details.php?id=XXX' target='_blank'
#                        class='gentium redist'>Vernacular Title</a></td>
#       <td><a href='details.php?id=XXX' ...>English Title</a></td>
#       <td><a href='details.php?id=XXX' ...>Redistribut. Title</a></td></tr>
# We match on the *English* title (the second column, `class='gentium redist'`
# or `class='gentium'` in the row) because our CATALOG titles are in
# English. Rows repeat the same id three times (vernacular / English /
# distribut.) so we dedupe by id.

_ROW = re.compile(
    r"""<tr[^>]*>(.*?)</tr>""", re.S)
_ROW_EB_ID = re.compile(r"""details\.php\?id=([a-zA-Z0-9_]+)""")
_ROW_ENG_TITLE = re.compile(
    r"""<td><a\s+href\s*=\s*['"]details\.php\?id=[a-zA-Z0-9_]+['"][^>]*>\s*(.*?)\s*</a></td>""",
    re.S)

def normalise_title(title: str) -> str:
    """Lowercase, strip accents, collapse whitespace."""
    import unicodedata
    t = unicodedata.normalize('NFKD', title)
    t = ''.join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r'\s+', ' ', t).strip().lower()
    return t

def scrape_country_page(country_code: str) -> dict[str, dict[str, str]]:
    """Return {normalised_redist_title: {'raw_title':…, 'id':…}}.

    eBible's country page rows are three <td><a> cells:
      col 1 vernacular, col 2 language name, col 3 the *redistributable
      translation title*. We harvest (redist_title, id) pairs from
      class='redist' rows only — that is the column our CATALOG
      translates match against (eBible marks a row `restricted` when
      the translation is NOT redistributable, in which case no USFM
      archive exists on the public eBible site).
    """
    url = COUNTRY_URL.format(c=country_code)
    blob = http_get(url)
    page = blob.decode('utf-8', errors='replace')
    out: dict[str, dict[str, str]] = {}
    for row_match in _ROW.finditer(page):
        cls_match = re.search(r"<tr class='([^']+)'>", row_match.group(0))
        if not cls_match or cls_match.group(1) != 'redist':
            continue
        row = row_match.group(1)
        id_match = _ROW_EB_ID.search(row)
        if not id_match:
            continue
        eb_id = id_match.group(1)
        tds = re.findall(r'<td>(.*?)</td>', row, re.S)
        if len(tds) < 3:
            continue
        # The third <td> holds the distributable translation title.
        raw_title = re.sub(r'<[^>]+>', '', tds[2]).strip()
        norm = normalise_title(raw_title)
        if norm not in out:
            out[norm] = {'raw_title': raw_title, 'id': eb_id, 'href': url}
    return out

# ---------------------------------------------------------------------------
# Step 1 — resolve_ids (with caching)
# ---------------------------------------------------------------------------

def load_cache() -> dict:
    if RESOLVED_CACHE.exists():
        try:
            return json.loads(RESOLVED_CACHE.read_text('utf-8'))
        except json.JSONDecodeError:
            print(f'[warn] corrupt cache at {RESOLVED_CACHE}, re-scraping')
    return {'by_country': {}}

def save_cache(cache: dict) -> None:
    REPORTS.mkdir(parents=True, exist_ok=True)
    RESOLVED_CACHE.write_text(
        json.dumps(cache, indent=2, ensure_ascii=False), 'utf-8')

def resolve_ids(force: bool = False) -> list[ResolveResult]:
    """
    For every (vflow_id, country_code, title) in CATALOG:
      * If vflow_id is in PREFILLED_IDS → source='prefilled', eb_id known.
      * Else scrape the country page (cached) and look up the title.
        On exact match → source='country_page', eb_id = row's id.
        On no match → source='unmatched', eb_id = None.
    """
    cache = load_cache() if not force else {'by_country': {}}
    results: list[ResolveResult] = []

    # Group by country_code to avoid re-scraping.
    by_country: dict[str, list[tuple[str, str]]] = {}
    for lang, entries in CATALOG.items():
        for vflow_id, ccode, title in entries:
            by_country.setdefault(ccode, []).append((vflow_id, title))

    for ccode, entries in by_country.items():
        # Prefilled entries for this country: resolve directly, no scrape.
        # Country-page entries: scrape (once per country, cached).
        need_scrape = [
            (vf, t) for vf, t in entries
            if vf not in PREFILLED_IDS
        ]
        page: dict[str, dict[str, str]] | None = None
        if need_scrape:
            if force or ccode not in cache.get('by_country', {}):
                try:
                    page = scrape_country_page(ccode)
                except urllib.error.URLError as exc:
                    print(f'[warn] country page {ccode} unreachable: {exc}')
                    page = cache.get('by_country', {}).get(ccode, {})
                cache.setdefault('by_country', {})[ccode] = page
            else:
                page = cache['by_country'][ccode]

        for vflow_id, title in entries:
            country_url = COUNTRY_URL.format(c=ccode)
            if vflow_id in PREFILLED_IDS:
                results.append(ResolveResult(
                    vflow_id, ccode, title,
                    PREFILLED_IDS[vflow_id], 'prefilled',
                    country_url, 'exact'))
                continue
            norm = normalise_title(title)
            row = page.get(norm) if page else None
            if row:
                results.append(ResolveResult(
                    vflow_id, ccode, title, row['id'], 'country_page',
                    country_url, 'exact'))
            else:
                # case-insensitive fallback
                fallback = next(
                    (v for k, v in (page or {}).items()
                     if k == norm.lower()), None)
                if fallback:
                    results.append(ResolveResult(
                        vflow_id, ccode, title,
                        fallback['id'], 'country_page',
                        country_url, 'case-insensitive'))
                else:
                    results.append(ResolveResult(
                        vflow_id, ccode, title, None, 'unmatched',
                        country_url, 'unknown'))

    save_cache(cache)
    return results

# ---------------------------------------------------------------------------
# Step 2 — merge with prefilled
# ---------------------------------------------------------------------------

def merge_with_prefilled(results: list[ResolveResult]) -> list[ResolveResult]:
    """
    PREFILLED wins on conflict. UNMATCHED_BUT_WORKING is a reminder,
    not an override: if the resolver found a different id on a live
    page, the live id wins (eBible occasionally re-keys).
    """
    out: list[ResolveResult] = []
    for r in results:
        if r.source == 'unmatched' and r.vflow_id in UNMATCHED_BUT_WORKING:
            # Known id from a previous run; record but mark source=
            # 'unmatched-verified' so the user knows it came from the
            # UNMATCHED_BUT_WORKING table, not from a live scrape.
            out.append(ResolveResult(
                r.vflow_id, r.country_code, r.title,
                UNMATCHED_BUT_WORKING[r.vflow_id],
                'unmatched-verified', r.country_url, 'unknown'))
        else:
            out.append(r)
    return out

# ---------------------------------------------------------------------------
# Step 3 — drop already-downloaded
# ---------------------------------------------------------------------------

def drop_already_downloaded(results: list[ResolveResult]) -> tuple[list[ResolveResult], list[Pending]]:
    """
    Returns (resolved, pending). `resolved` = all entries with a
    known eBible id (source != 'unmatched' OR source == 'unmatched-verified').
    `pending` = the subset of `resolved` whose raw dir does NOT already
    hold .usfm files — these are what a downloader should fetch.
    """
    resolved: list[ResolveResult] = []
    pending: list[Pending] = []
    for r in results:
        if r.source == 'unmatched' and r.eb_id is None:
            continue
        resolved.append(r)
        raw_dir = Path(RAW_PATH_OVERRIDES.get(r.vflow_id) or f'data/bible/raw/{r.country_code}/{r.eb_id}_usfm')
        abs_dir = ROOT / raw_dir
        has_files = abs_dir.exists() and any(
            p.suffix == '.usfm' for p in abs_dir.iterdir())
        if not has_files:
            url = f'https://ebible.org/Scriptures/{r.eb_id}_usfm.zip'
            lang = next((lang for lang, entries in CATALOG.items()
                         if any(e[0] == r.vflow_id for e in entries)),
                        r.country_code)
            pending.append(Pending(r.vflow_id, r.eb_id, lang, url))
    return resolved, pending

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def write_reports(resolved: list[ResolveResult], pending: list[Pending]) -> None:
    REPORTS.mkdir(parents=True, exist_ok=True)
    PENDING_REPORT.write_text(json.dumps(
        {'resolved': [asdict(r) for r in resolved],
         'pending': [asdict(p) for p in pending]},
        indent=2, ensure_ascii=False), 'utf-8')

def fetch_pending(pending: list[Pending]) -> None:
    """
    Download the pending list. Reimplements the same unzip (§64: one
    pipeline, same code path as ebible_fetch.py — we cannot import
    ebible_fetch.py from this script because its dataclass annotations
    are evaluated by `@dataclass` and require `from __future__ import
    annotations` at module head, which exec_module does not provide).
    """
    import tempfile

    def http_get_retry(url: str, timeout: int = 90, retries: int = 3) -> bytes:
        last_exc: Exception | None = None
        for _ in range(retries):
            try:
                req = urllib.request.Request(url, headers=HEADERS)
                with urllib.request.urlopen(req, timeout=timeout) as res:
                    return res.read()
            except urllib.error.HTTPError as exc:
                last_exc = exc
                if exc.code == 404:
                    # Fall back to details-page discovery (eBible's
                    # redirect target for `.../{id}_usfm.zip`).
                    det_url = (f'https://ebible.org/Scriptures/'
                                f'details.php?id={url.rsplit("/", 1)[-1].replace("_usfm.zip", "")}&all=1')
                    try:
                        det = http_get_retry(det_url, retries=1).decode('utf-8', 'replace')
                        m = re.search(r"href='(https://ebible\.org/Scriptures/[^']*_usfm\.zip)'", det)
                        if m:
                            return http_get_retry(m.group(1), retries=1)
                    except Exception:
                        pass
                time.sleep(2)
        raise last_exc if last_exc else RuntimeError('unreachable')

    def unzip_to(zip_path: Path, out_dir: Path) -> int:
        out_dir.mkdir(parents=True, exist_ok=True)
        with open(zip_path, 'rb') as f:
            buf = f.read()
        offset, count = 0, 0
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

    for p in pending:
        out_dir = RAW_BASE / p.lang / f'{p.eb_id}_usfm'
        if out_dir.exists() and any(out_dir.iterdir()):
            print(f'  [skip] {p.vflow_id}: already on disk')
            continue
        if p.vflow_id in INCOMPLETE_ON_EBIBLE:
            print(f'  [skip] {p.vflow_id}: {INCOMPLETE_ON_EBIBLE[p.vflow_id]}')
            continue
        print(f'  [get] {p.vflow_id} ({p.eb_id}) -> {out_dir.relative_to(ROOT)}')
        try:
            blob = http_get_retry(p.url)
            out_dir.parent.mkdir(parents=True, exist_ok=True)
            with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as f:
                f.write(blob)
                zip_path = Path(f.name)
            files_written = unzip_to(zip_path, out_dir)
            zip_path.unlink(missing_ok=True)
            # §53: book-code sanity check (must be a complete 66-book
            # archive; an incomplete archive will fail this and the
            # build-bible §53 completeness check).
            import re as _re
            codes = set()
            for us in out_dir.iterdir():
                if us.suffix != '.usfm':
                    continue
                head = us.read_text('utf-8', errors='replace')[:100]
                m = _re.match(r'\\id\s+(\S+)', head)
                if m:
                    codes.add(m.group(1).upper())
            expected = 66
            got = len(codes & {'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT',
                                '1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST',
                                'JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN',
                                'HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL',
                                'MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH',
                                'PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS',
                                '1PE','2PE','1JN','2JN','3JN','JUD','REV'})
            if got < expected:
                print(f'  [warn] {p.vflow_id}: only {got}/66 canonical book codes '
                      f'({files_written} files written) — §53 check will reject')
                continue
            print(f'  [ok]   {p.vflow_id}: {files_written} USFM files, {got}/66 book codes')
        except Exception as exc:
            print(f'  [fail] {p.vflow_id}: {exc}')

# Pending items that are known (from a prior fetch / from §53) NOT
# to be a complete 66-book corpus. Fetching them is futile: the
# archive is incomplete on eBible and the build's §53 check would
# reject it anyway. We mark them so the user can skip them.
# `kujv` (engKJV) is a full KJV on eBible — keep it.
INCOMPLETE_ON_EBIBLE: dict[str, str] = {
    # id-tsi: 51/66 USFM files in the archive (15 OT books missing)
    'id-tsi': '§53 incomplete archive (51/66 USFM files)',
}


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--fetch', action='store_true',
                    help='download the pending list after resolve')
    ap.add_argument('--force-resolve', action='store_true',
                    help='ignore the resolved-ids cache, re-scrape')
    ap.add_argument('--dry-run', action='store_true',
                    help='resolve + report only, no fetch')
    args = ap.parse_args()

    print(f'catalog entries: {sum(len(v) for v in CATALOG.values())}')
    results = resolve_ids(force=args.force_resolve)
    results = merge_with_prefilled(results)
    resolved, pending = drop_already_downloaded(results)
    write_reports(resolved, pending)

    print(f'  resolved: {len(resolved)}')
    print(f'  pending:  {len(pending)}')
    by_source = {}
    for r in resolved:
        by_source[r.source] = by_source.get(r.source, 0) + 1
    for s, n in sorted(by_source.items()):
        print(f'    [{s}] {n}')
    print(f'  report: {PENDING_REPORT.relative_to(ROOT)}')

    if args.fetch and pending:
        if args.dry_run:
            print(f'  [dry-run] would fetch {len(pending)}')
            return 0
        print(f'fetching {len(pending)} pending...')
        fetch_pending(pending)
    return 0

if __name__ == '__main__':
    sys.exit(main())
