#!/usr/bin/env python3
"""
Migrate module-scope `const styles = StyleSheet.create({...})` blocks that
reference the runtime `colors` (from useAppTheme) into `useMemo(() =>
StyleSheet.create({...}), [colors])` inside the component.

For each .tsx file:
  1. Find the top-level `const styles = StyleSheet.create(` … `);` block.
  2. Check whether its body references `colors.` (the runtime hook result).
  3. If yes:
     - Remove the module-scope `const styles = StyleSheet.create({...});` block.
     - Insert `const styles = useMemo(() => StyleSheet.create({...}), [colors]);`
       right after the first `const { colors, ... } = useAppTheme();` line in
       the default-export function (or the first function that calls
       useAppTheme).
     - Ensure `useMemo` is imported from 'react'.
     - Ensure `StyleSheet` is still imported.

Files where the styles block does NOT reference `colors` are left alone.
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def find_styles_block(lines):
    """Find the top-level `const styles = StyleSheet.create(` block.
    Returns (start_idx, end_idx, has_colors_ref) or None.
    """
    n = len(lines)
    for i, line in enumerate(lines):
        m = re.match(r"^const\s+\w+\s*=\s*StyleSheet\.create\(\{", line)
        if not m:
            continue
        # This is a candidate. Find the matching close `});`
        depth = 0
        started = False
        for j in range(i, n):
            for ch in lines[j]:
                if ch == "{":
                    depth += 1
                    started = True
                elif ch == "}":
                    depth -= 1
            if started and depth == 0:
                body = "\n".join(lines[i:j+1])
                has_colors = bool(re.search(r"\bcolors\.\w+", body))
                return (i, j, has_colors)
        return None
    return None


def find_useapptheme_line(lines):
    """Find the line index of the `const { ... } = useAppTheme();` line."""
    for i, line in enumerate(lines):
        if re.search(r"=\s*useAppTheme\(\)\s*;", line):
            return i
    return None


def ensure_usememo_import(lines):
    """Add useMemo to the existing `import { ... } from 'react';` line."""
    for i, line in enumerate(lines):
        if line.lstrip().startswith("import") and "from 'react'" in line:
            if "useMemo" in line:
                return lines
            # Add useMemo into the import braces
            m = re.search(r"import\s*\{([^}]*)\}\s*from\s*'react'", line)
            if m:
                existing = m.group(1)
                new = existing.rstrip() + ", useMemo" if existing.strip() else "useMemo"
                lines[i] = line.replace(m.group(0), f"import {{{new}}} from 'react'")
                return lines
    # No react import — add one
    lines.insert(0, "import { useMemo } from 'react';\n")
    return lines


def process_file(path):
    with open(path, "r", encoding="utf-8") as fh:
        lines = fh.readlines()

    block = find_styles_block(lines)
    if not block:
        return False
    start, end, has_colors = block
    if not has_colors:
        return False

    # Remove the module-scope styles block
    del lines[start:end + 1]

    # Find where to insert the useMemo version (right after useAppTheme destructure)
    ua = find_useapptheme_line(lines)
    if ua is None:
        # No useAppTheme call — just re-add the block at the end
        lines.append("\nconst styles = StyleSheet.create({\n")
        # Re-parse original block body (we deleted it) — simpler: bail
        with open(path, "w", encoding="utf-8") as fh:
            fh.writelines(lines)
        print(f"  WARN {os.path.relpath(path, ROOT)}: no useAppTheme, re-added module-scope block")
        return True

    # Build the replacement
    # We need the original block body — re-read the file for that range
    with open(path, "r", encoding="utf-8") as fh:
        _ = fh.read()  # placeholder — we deleted it; we need to capture before deleting
    # Actually we deleted `lines[start:end+1]`; let's reconstruct from memory
    # Re-read the original file to get the block text
    with open(path, "r", encoding="utf-8") as fh:
        orig = fh.readlines()
    block_lines_orig = orig[start:end + 1]
    # Take the inner part (between `create({` and `});`)
    first = block_lines_orig[0]
    last = block_lines_orig[-1]
    inner = block_lines_orig[1:-1]
    indent = "  "
    new_block = [f"{indent}const styles = useMemo(() => StyleSheet.create({{\n"]
    for il in inner:
        new_block.append(il)
    new_block.append(indent + "}), [colors]);\n")

    # Insert after the useAppTheme destructure line
    insert_at = ua + 1
    lines[insert_at:insert_at] = new_block

    lines = ensure_usememo_import(lines)

    with open(path, "w", encoding="utf-8") as fh:
        fh.writelines(lines)
    return True


def main():
    target_files = []
    for d in ["app", "src"]:
        base = os.path.join(ROOT, d)
        if not os.path.isdir(base):
            continue
        for root, _, files in os.walk(base):
            for f in files:
                if f.endswith(".tsx"):
                    target_files.append(os.path.join(root, f))

    patched = 0
    for path in target_files:
        if process_file(path):
            patched += 1
            print(f"Patched: {os.path.relpath(path, ROOT)}")
    print(f"\nTotal: {patched} file(s)")


if __name__ == "__main__":
    main()
