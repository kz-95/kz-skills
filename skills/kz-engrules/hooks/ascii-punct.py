"""PostToolUse hook: normalise typographic punctuation to ASCII after a file write.

Enforces rule 7 (ASCII only in source and docs) automatically instead of relying on
remembering it. Reads the hook payload on stdin, rewrites the file in place, and
reports what it changed so the change is never silent.

Deliberately conservative: it touches only punctuation that has an unambiguous ASCII
equivalent. Letters, CJK, emoji and accented characters are left alone, because a file
may legitimately contain them (content, i18n, someone's name).
"""
import io
import json
import os
import sys

# every mapping here is a punctuation mark with an exact ASCII counterpart
SUBS = {
    '—': '-',      # em dash
    '–': '-',      # en dash
    '−': '-',      # minus sign
    '‐': '-',      # hyphen
    '‘': "'",      # left single quote
    '’': "'",      # right single quote / apostrophe
    '‚': "'",      # single low quote
    '“': '"',      # left double quote
    '”': '"',      # right double quote
    '„': '"',      # double low quote
    '…': '...',    # ellipsis
    ' ': ' ',      # non-breaking space
    ' ': ' ',      # thin space
    ' ': ' ',      # narrow no-break space
    '→': '->',
    '←': '<-',
    '↔': '<->',
    '⇒': '=>',
    '≤': '<=',
    '≥': '>=',
    '×': 'x',
    '•': '*',      # bullet
    '·': '-',      # middot
    '′': "'",      # prime
    '″': '"',      # double prime
}

# only text we own; never touch data files, lockfiles or anything binary
EXTS = {'.md', '.markdown', '.txt', '.html', '.htm', '.css', '.js', '.jsx', '.ts',
        '.tsx', '.py', '.json', '.yml', '.yaml', '.sh', '.sql', '.svg', '.xml',
        '.toml', '.ini', '.cfg', '.rs', '.go', '.java', '.c', '.h', '.cpp'}

SKIP_DIRS = {'node_modules', '.git', 'dist', 'build', 'vendor', '.venv'}


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0

    path = (payload.get('tool_response') or {}).get('filePath') \
        or (payload.get('tool_input') or {}).get('file_path')
    if not path or not os.path.isfile(path):
        return 0

    parts = set(os.path.normpath(path).replace('\\', '/').split('/'))
    if parts & SKIP_DIRS:
        return 0
    if os.path.splitext(path)[1].lower() not in EXTS:
        return 0

    try:
        original = io.open(path, encoding='utf-8').read()
    except (UnicodeDecodeError, OSError):
        return 0        # binary or unreadable: leave it alone

    text = original
    counts = {}
    for bad, good in SUBS.items():
        n = text.count(bad)
        if n:
            counts[bad] = n
            text = text.replace(bad, good)

    if text == original:
        return 0

    try:
        io.open(path, 'w', encoding='utf-8', newline='').write(text)
    except OSError:
        return 0

    total = sum(counts.values())
    detail = ', '.join(
        '%d x U+%04X' % (n, ord(ch)) for ch, n in sorted(counts.items())
    )
    # a silent rewrite is worse than the typo: say what changed
    print(json.dumps({
        'systemMessage': 'ASCII hook: replaced %d non-ASCII punctuation mark%s in %s (%s)'
                         % (total, '' if total == 1 else 's', os.path.basename(path), detail)
    }))
    return 0


if __name__ == '__main__':
    sys.exit(main())
