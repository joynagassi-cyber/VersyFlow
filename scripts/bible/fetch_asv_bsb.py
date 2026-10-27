"""One-off fetch of ASV + BSB eBible USFM archives into data/bible/raw/en/.

Uses the same stdlib-only unzip as scripts/bible/ebible_catalog.py
(fetch_pending) — no external deps, runs on Windows.
"""
import re
import sys
import tempfile
import urllib.request
import zlib
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
HEADERS = {"User-Agent": "Mozilla/5.0 (VersyFlow dev build-time pipeline)"}
CANON = {
    "GEN","EXO","LEV","NUM","DEU","JOS","JDG","RUT","1SA","2SA","1KI","2KI",
    "1CH","2CH","EZR","NEH","EST","JOB","PSA","PRO","ECC","SNG","ISA","JER",
    "LAM","EZK","DAN","HOS","JOL","AMO","OBA","JON","MIC","NAM","HAB","ZEP",
    "HAG","ZEC","MAL","MAT","MRK","LUK","JHN","ACT","ROM","1CO","2CO","GAL",
    "EPH","PHP","COL","1TH","2TH","1TI","2TI","TIT","PHM","HEB","JAS","1PE",
    "2PE","1JN","2JN","3JN","JUD","REV",
}


def get(url: str, timeout: int = 180) -> bytes:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def unzip_to(zip_path: Path, out_dir: Path) -> int:
    """Stdlib-only unzip (PK local entries, stored + deflate) — mirrors
    ebible_catalog.fetch_pending. Mirrored here so this script is
    standalone-runnable on Windows."""
    out_dir.mkdir(parents=True, exist_ok=True)
    buf = zip_path.read_bytes()
    offset, count = 0, 0
    while offset + 30 <= len(buf):
        if buf[offset : offset + 4] != b"PK\x03\x04":
            break
        method = int.from_bytes(buf[offset + 8 : offset + 10], "little")
        comp_size = int.from_bytes(buf[offset + 18 : offset + 22], "little")
        name_len = int.from_bytes(buf[offset + 26 : offset + 28], "little")
        extra_len = int.from_bytes(buf[offset + 28 : offset + 30], "little")
        name = buf[offset + 30 : offset + 30 + name_len].decode("utf-8", "replace")
        data_start = offset + 30 + name_len + extra_len
        raw = buf[data_start : data_start + comp_size]
        data = raw if method == 0 else zlib.decompress(raw, -15)
        if not name.endswith("/"):
            target = out_dir / name.replace("\\", "/")
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            count += 1
        offset = data_start + comp_size
    return count


def main() -> int:
    for label, url, out_rel in [
        ("ASV", "https://ebible.org/Scriptures/eng-asv_usfm.zip", "en/asv_usfm"),
        ("BSB", "https://ebible.org/Scriptures/engbsb_usfm.zip", "en/bsb_usfm"),
    ]:
        out = ROOT / "data" / "bible" / "raw" / out_rel
        print(f"[{label}] {url}")
        blob = get(url)
        print(f"[{label}] {len(blob) // 1024} KB")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as f:
            f.write(blob)
            tmp = Path(f.name)
        n = unzip_to(tmp, out)
        tmp.unlink()
        codes = set()
        canon_files = 0
        for us in out.iterdir():
            if us.suffix != ".usfm":
                continue
            head = us.read_text("utf-8", errors="replace")[:200]
            m = re.search(r"\\id\s+([A-Za-z0-9]{1,5})\b", head)
            if m:
                code = m.group(1).upper()
                codes.add(code)
                if code in CANON:
                    canon_files += 1
        hit = len(codes & CANON)
        extra = sorted(codes - CANON)
        print(f"[{label}] {n} USFM files | {canon_files} canon files | book codes {hit}/66 | extra: {extra or 'none'}")
        if hit < 66 or canon_files < 66:
            print(f"[{label}] §53 INCOMPLETE — build will reject")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
