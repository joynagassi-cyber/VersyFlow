#!/usr/bin/env python3
"""Mesures de tonalité et de netteté, normalisées pour être comparables.

Pourquoi ce script
------------------
« Le rendu n'est pas à la hauteur » n'est pas une mesure, et « c'est mieux »
non plus. Pour calibrer un traitement il faut des **cibles numériques**
extraites de l'image de référence, puis un contrôle qui dit, image par image,
sur quel axe on est en dessous.

Toutes les mesures sont normalisées pour être comparables entre une vignette
de sélecteur (120 px de large) et un fond plein écran (1248 px) :

  - les images sont ramenées à une largeur de travail fixe avant analyse ;
  - la netteté est un **rapport** (variance du laplacien / variance de
    l'image), donc sans unité et insensible au contraste global ;
  - la colorimétrie utilise le facteur de Hasler & Süsstrunk, conçu pour
    classer des images sans dépendre de leur taille.

Usage
-----
  python3 scripts/themes/theme-metrics.py <image>...
  python3 scripts/themes/theme-metrics.py --compare targets.json <image>...
  python3 scripts/themes/theme-metrics.py --profile <image>...   # cibles
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

WORK_WIDTH = 240  # largeur d'analyse : proche de la vignette réelle du sélecteur


def load(path: str) -> np.ndarray:
    """Charge en RGB flottant 0..1, ramené à WORK_WIDTH de large."""
    img = Image.open(path).convert("RGB")
    w, h = img.size
    if w != WORK_WIDTH:
        img = img.resize((WORK_WIDTH, max(1, round(h * WORK_WIDTH / w))), Image.LANCZOS)
    return np.asarray(img, dtype=np.float64) / 255.0


def luma(rgb: np.ndarray) -> np.ndarray:
    return rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722


def laplacian(gray: np.ndarray) -> np.ndarray:
    """Laplacien 4-voisins, sans dépendance externe."""
    g = gray
    out = np.zeros_like(g)
    out[1:-1, 1:-1] = (
        4 * g[1:-1, 1:-1]
        - g[:-2, 1:-1] - g[2:, 1:-1]
        - g[1:-1, :-2] - g[1:-1, 2:]
    )
    return out


def colorfulness(rgb: np.ndarray) -> float:
    """Hasler & Süsstrunk (2003) : métrique de vivacité sans unité."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    rg = r - g
    yb = 0.5 * (r + g) - b
    return float(
        np.sqrt(rg.std() ** 2 + yb.std() ** 2)
        + 0.3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2)
    )


def metrics(path: str) -> dict:
    rgb = load(path)
    y = luma(rgb)
    p1, p5, p50, p95, p99 = (float(np.percentile(y, q)) for q in (1, 5, 50, 95, 99))
    lap = laplacian(y)
    sharpness = float(lap.var() / (y.var() + 1e-6))
    # Répartition des tons : part de pixels très sombres / très clairs.
    deep = float((y < 0.06).mean())
    bright = float((y > 0.94).mean())
    # Moyenne par bande : sert à vérifier qu'il reste une zone calme pour le texte.
    h = y.shape[0]
    top = float(y[: h // 3].mean())
    bottom = float(y[-h // 3 :].mean())
    maxc = rgb.max(axis=2)
    minc = rgb.min(axis=2)
    sat = np.where(maxc > 1e-6, (maxc - minc) / np.maximum(maxc, 1e-6), 0)
    return {
        "mean": float(y.mean()),
        "std": float(y.std()),
        "p1": p1,
        "p5": p5,
        "p50": p50,
        "p95": p95,
        "p99": p99,
        "range": p99 - p1,
        "contrast_mid": p95 - p5,
        "sharpness": sharpness,
        "colorfulness": colorfulness(rgb),
        "saturation": float(sat.mean()),
        "warmth": float(rgb[..., 0].mean() - rgb[..., 2].mean()),
        "deep_blacks": deep,
        "highlights": bright,
        "top_mean": top,
        "bottom_mean": bottom,
        "text_zone": top - bottom,
    }


def profile(paths: list[str]) -> dict:
    """Médiane des mesures : robuste aux scènes atypiques (nuit, neige)."""
    rows = [metrics(p) for p in paths]
    keys = rows[0].keys()
    return {k: float(np.median([r[k] for r in rows])) for k in keys}


def table(m: dict, ref: dict | None = None) -> str:
    lines = []
    for k, v in m.items():
        if ref is None:
            lines.append(f"  {k:14s} {v:8.4f}")
        else:
            delta = v - ref[k]
            flag = ""
            if k in ("std", "sharpness", "colorfulness", "range", "contrast_mid"):
                flag = "  <<" if delta < -0.15 * ref[k] else ""
            elif k in ("deep_blacks",):
                flag = "  <<" if delta < -0.02 else ""
            lines.append(f"  {k:14s} {v:8.4f}   ref {ref[k]:8.4f}   {delta:+8.4f}{flag}")
    return "\n".join(lines)


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 2
    if argv[0] == "--profile":
        prof = profile(argv[1:])
        print(json.dumps(prof, indent=2))
        return 0
    if argv[0] == "--compare":
        ref = json.loads(Path(argv[1]).read_text())
        for p in argv[2:]:
            print(f"\n{p}")
            print(table(metrics(p), ref))
        return 0
    for p in argv:
        print(f"\n{p}")
        print(table(metrics(p)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
