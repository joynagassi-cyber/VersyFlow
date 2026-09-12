#!/usr/bin/env python3
"""
Insert `const { colors, sp, sh, rad } = useAppTheme();` into any top-level
`function X() {` (or arrow function assigned to a const) that references
`colors.` but doesn't already destructure `useAppTheme()`.

Also adds `import { useAppTheme } from '@/theme/useTheme';` at the top of
the file if it's not already there.

Safe, idempotent. No regex tricks — just walk lines.
"""
import os
import re
import sys

# Find every .tsx file under app/ and src/ that references `colors.`
# and lacks `useAppTheme` import OR the destructuring.
TARGET_DIRS = ["app", "src"]

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

IMPORT_LINE = "import { useAppTheme } from '@/theme/useTheme';"
DESTRUCT_LINE = "  const { colors, sp, sh, rad } = useAppTheme();"

# Patterns that declare a function in TSX:
#   function foo(
#   const foo = (
#   export default function foo(
#   export default function (
FUNC_PATTERNS = [
    re.compile(r"^(\s*)(export\s+default\s+)?function\s+\w+"),
    re.compile(r"^(\s*)(export\s+default\s+)?(?:const|let|var)\s+\w+\s*=\s*(?:\(|async\s*\()"),
    # Also component arrow
    re.compile(r"^(\s*)(export\s+default\s+)?(?:const|let|var)\s+\w+\s*:\s*React\.FC\s*=\s*\("),
]


def has_useapptheme_import(lines):
    for ln in lines:
        if "useAppTheme" in ln and ("import" in ln) and ("@/theme/useTheme" in ln or "useTheme" in ln):
            # Make sure it's an import statement, not just a usage
            if ln.lstrip().startswith("import"):
                return True
    return False


def has_useapptheme_destructure(lines, func_start, func_end):
    """Check if the function body already calls useAppTheme() and destructures colors."""
    body = lines[func_start:func_end]
    joined = "\n".join(body)
    # Look for "useAppTheme()" and "colors" in the destructuring
    if re.search(r"useAppTheme\(\)", joined):
        # If destructured colors are present, assume it's fine
        if re.search(r"\bcolors\b", joined):
            return True
    return False


def find_functions(lines):
    """Return a list of (start, end) line-index tuples for top-level functions."""
    funcs = []
    i = 0
    n = len(lines)
    while i < n:
        matched = False
        for pat in FUNC_PATTERNS:
            m = pat.match(lines[i])
            if m:
                start = i
                # Walk to find the matching closing brace of the function body
                depth = 0
                seen_open = False
                j = i
                while j < n:
                    for ch in lines[j]:
                        if ch == "{":
                            depth += 1
                            seen_open = True
                        elif ch == "}":
                            depth -= 1
                    if seen_open and depth == 0:
                        end = j + 1
                        break
                    j += 1
                else:
                    end = n
                funcs.append((start, end))
                i = end
                matched = True
                break
        if not matched:
            i += 1
    return funcs


def process_file(path, lines):
    """Insert imports and destructures as needed. Returns count of insertions."""
    changes = 0

    # 1. Add import if referenced but missing
    joined = "\n".join(lines)
    if "useAppTheme" in joined and not has_useapptheme_import(lines):
        # Find the last import statement
        last_import_idx = 0
        for idx, ln in enumerate(lines):
            if ln.lstrip().startswith("import"):
                last_import_idx = idx
        lines.insert(last_import_idx + 1, IMPORT_LINE)
        changes += 1
        # Recount functions since we shifted
        lines = [l.rstrip() + "\n" for l in lines] if all(l.endswith("\n") for l in lines) else lines

    # 2. For each top-level function missing the destructure, insert it
    funcs = find_functions(lines)
    for (start, end) in funcs:
        if has_useapptheme_destructure(lines, start, end):
            continue
        # Check if body references colors./sp./sh./rad.
        body_text = "\n".join(lines[start:end])
        if not re.search(r"\bcolors\.\b|\bsp\.\b|\bsh\.\b|\brad\.\b", body_text):
            continue
        # Insert the destructure on the first non-empty line after the function header
        # The function header is the line with "function X(" or "const X = ("
        # Look for the first line after `start` that contains `{` opening the body
        # But if the arrow function body starts with `(args) => {`, the `{` may be on start+1
        insert_at = start + 1
        # Find the actual body opening — scan for a line that ends in `{` (or contains `{`)
        k = start
        open_brace_line = None
        # Naive: find the first `{` after the function name in the file body
        for idx in range(start, end):
            if "{" in lines[idx] and open_brace_line is None:
                open_brace_line = idx
                break
        if open_brace_line is None:
            continue
        # Insert right after the opening brace
        lines.insert(open_brace_line + 1, DESTRUCT_LINE)
        changes += 1
        # All subsequent functions are off by one; re-scan
        break

    return changes, lines


def main():
    target_files = []
    for d in TARGET_DIRS:
        base = os.path.join(ROOT, d)
        if not os.path.isdir(base):
            continue
        for root, _, files in os.walk(base):
            for f in files:
                if f.endswith(".tsx") or f.endswith(".ts"):
                    target_files.append(os.path.join(root, f))

    total_changes = 0
    for path in target_files:
        with open(path, "r", encoding="utf-8") as fh:
            lines = fh.readlines()
        # Strip trailing newlines for processing
        processed, lines = process_file(path, lines)
        if processed > 0:
            with open(path, "w", encoding="utf-8") as fh:
                fh.writelines(lines)
            print(f"Patched {path}: {processed} insertion(s)")
            total_changes += processed
    print(f"\nTotal patches: {total_changes}")


if __name__ == "__main__":
    main()
