#!/usr/bin/env python3
"""Validate the repository: run before proposing a change, and in CI.

    python scripts/validate.py

Checks, each of which has caught a real defect in this project:
  1. every skill is a DIRECT child of skills/ (a nested one is not registered as a command)
     and its frontmatter `name` equals its folder name, with a non-empty description;
     the frontmatter is strict YAML (an unquoted value with ': ' makes the skills CLI skip it)
  2. every relative link, relative path and <img> source in the Markdown resolves
  3. no CRLF line endings in text files (.gitattributes enforces LF)
  4. docs/rule-index.md is up to date with the rule files
  5. the plugin and marketplace manifests parse and agree on the plugin name
  6. every published link (https://kz-95.github.io/kz-skills/...) names a file under docs/,
     and its #anchor, on an .html page, names an id that page has
  7. docs/llms.txt is a byte-for-byte copy of llms.txt (GitHub Pages serves docs/ only)
Exit status is 0 only when every check passes.
"""
import io
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
problems = []


def fail(msg):
    problems.append(msg)


def read(p):
    return io.open(p, encoding="utf-8", newline="").read()


YAML_INDICATORS = "-?:,[]{}#&*!|>'\"%@`"
DQ_ESCAPES = {"\\": "\\", '"': '"', "/": "/", "n": "\n", "t": "\t", "r": "\r", "0": "\0", " ": " "}


def frontmatter(text, errors=None):
    """Read the frontmatter as the strict YAML parsers that install skills read it.

    Values may be plain, "double quoted", 'single quoted' or a block scalar (>-, |).
    A plain value that strict YAML rejects or misreads (one containing ': ' or ' #',
    or starting with an indicator) is reported to `errors`: the skills CLI skips such
    a skill with "Nested mappings are not allowed in compact mappings".
    """
    m = re.match(r"^---\n(.*?)\n---\n", text.replace("\r\n", "\n"), re.S)
    out = {}
    err = errors if errors is not None else []
    if not m:
        err.append("no frontmatter block (--- ... ---) at the top")
        return out
    lines = m.group(1).split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]
        i += 1
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        k = re.match(r"^([A-Za-z_][A-Za-z0-9_-]*):(?: (.*))?$", line)
        if not k:
            err.append("line %d is not a top-level `key: value`: %r" % (i, line[:60]))
            continue
        key, raw = k.group(1), (k.group(2) or "").strip()
        if raw in (">", ">-", ">+", "|", "|-", "|+"):
            block = []
            while i < len(lines) and (lines[i].startswith(" ") or not lines[i].strip()):
                block.append(lines[i].strip())
                i += 1
            if raw.startswith(">"):
                val = re.sub(r"(?<!\n)\n(?!\n)", " ", "\n".join(block).strip("\n"))
            else:
                val = "\n".join(block).strip("\n")
            out[key] = val
            continue
        if raw.startswith('"'):
            val, j, ok = [], 1, False
            while j < len(raw):
                c = raw[j]
                if c == "\\" and j + 1 < len(raw) and raw[j + 1] in DQ_ESCAPES:
                    val.append(DQ_ESCAPES[raw[j + 1]])
                    j += 2
                    continue
                if c == "\\":
                    err.append("%s: unknown escape in a double-quoted value" % key)
                    j += 1
                    continue
                if c == '"':
                    ok = True
                    break
                val.append(c)
                j += 1
            rest = raw[j + 1:].strip() if ok else ""
            if not ok or (rest and not rest.startswith("#")):
                err.append("%s: double-quoted value is not closed on its line, or has text after the closing quote" % key)
            out[key] = "".join(val)
        elif raw.startswith("'"):
            mm = re.match(r"^'((?:[^']|'')*)'\s*(#.*)?$", raw)
            if not mm:
                err.append("%s: single-quoted value is not closed on its line" % key)
                out[key] = raw.strip("'")
            else:
                out[key] = mm.group(1).replace("''", "'")
        else:
            if raw and (raw[0] in YAML_INDICATORS or ": " in raw or " #" in raw or raw.endswith(":")):
                err.append("%s: unquoted value that strict YAML rejects (contains ': ' or ' #', or starts "
                           "with an indicator); wrap it in double quotes" % key)
            out[key] = raw
        if i < len(lines) and lines[i].startswith(" "):
            err.append("%s: value continues on an indented line; use one line or a block scalar (>-)" % key)
    return out


# 1. skills -------------------------------------------------------------------------------
skills_dir = os.path.join(ROOT, "skills")
found = 0
for base, dirs, files in os.walk(skills_dir):
    dirs[:] = [d for d in dirs if d not in ("__pycache__", "node_modules")]
    if "SKILL.md" in files:
        found += 1
        folder = os.path.basename(base)
        rel = os.path.relpath(base, ROOT)
        yaml_errors = []
        fm = frontmatter(read(os.path.join(base, "SKILL.md")), yaml_errors)
        for e in yaml_errors:
            fail("%s/SKILL.md: frontmatter is not strict YAML - %s" % (rel, e))
        if fm.get("name") != folder:
            fail("%s: frontmatter name %r does not match its folder %r" % (rel, fm.get("name"), folder))
        if not fm.get("description"):
            fail("%s: no description in the frontmatter" % rel)
        elif len(fm["description"]) > 1024:
            fail("%s: description is %d characters; keep it under 1024" % (rel, len(fm["description"])))
        depth = len(os.path.relpath(base, skills_dir).split(os.sep))
        if depth > 1 and "ui-glance" not in base:
            fail("%s: a skill nested %d deep is read by its parent but is not registered as a command" % (rel, depth))
if found < 14:
    fail("expected at least 14 skills under skills/ (thirteen plus ui-glance), found %d" % found)

# 1b. kz-flashrule cites only rule IDs that exist, so the digest cannot drift ----------------
# every file in kz-uiuxrule/rules (ui, chart, motion and diagram rules) plus the engineering rules
rd = os.path.join(skills_dir, "kz-uiuxrule", "rules")
srcs = [os.path.join(rd, f) for f in os.listdir(rd)] + [os.path.join(skills_dir, "kz-engrules", "rules", "engineering-rules.md")]
ids = set(re.findall(r"^\| ([A-Z]?\d+[a-z]?\d*) \| \*\*", "\n".join(read(p) for p in srcs), re.M))
for line in read(os.path.join(skills_dir, "kz-flashrule", "SKILL.md")).splitlines():
    cell = line.split("|")[1].strip() if line.startswith("|") else ""
    if cell in ("", "ID") or set(cell) <= set("-: "):
        continue
    if cell.startswith("kz-") and not os.path.isfile(os.path.join(skills_dir, cell, "SKILL.md")):
        fail("kz-flashrule: cites skill %s, which does not exist" % cell)
    elif not cell.startswith("kz-") and cell not in ids:
        fail("kz-flashrule: cites rule %s, which no rule file defines" % cell)

# 1b. no merge conflict left in any text file -----------------------------------------------
for base, _, files in os.walk(ROOT):
    if ".git" in base.split(os.sep):
        continue
    for f in files:
        if f.endswith((".md", ".js", ".py", ".json", ".html", ".txt", ".yml")):
            text = open(os.path.join(base, f), encoding="utf-8", errors="replace").read()
            if re.search(r"^(<<<<<<<|>>>>>>>) ", text, re.M):
                fail("%s: an unresolved merge conflict marker" % os.path.relpath(os.path.join(base, f), ROOT))

# 2. relative links ---------------------------------------------------------------------------
LINK = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
IMG = re.compile(r'<img[^>]+src="([^"]+)"')
TICK = re.compile(r"`((?:\.\./|\./)[^`\s]+)`")
for base, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in (".git", "node_modules", "__pycache__", "assets")]
    for f in files:
        if not f.endswith(".md"):
            continue
        p = os.path.join(base, f)
        for t in LINK.findall(read(p)) + TICK.findall(read(p)) + IMG.findall(read(p)):
            if t.startswith(("http://", "https://", "mailto:", "#")):
                continue
            t = t.split("#")[0]
            if not t or not (t.startswith(".") or "/" in t or "." in t):
                continue
            if not os.path.exists(os.path.normpath(os.path.join(base, t))):
                fail("%s: broken relative link -> %s" % (os.path.relpath(p, ROOT), t))

# 2b. licence: every skill declares it, and LICENSE carries the Commons Clause above the Apache text
lic = read(os.path.join(ROOT, "LICENSE"))
if "Commons Clause" not in lic[:200] or "Apache License" not in lic:
    fail("LICENSE must open with the Commons Clause condition and contain the Apache License 2.0 text")
for base, dirs, files in os.walk(skills_dir):
    if "SKILL.md" in files:
        fm = frontmatter(read(os.path.join(base, "SKILL.md")))
        if "Commons Clause" not in fm.get("license", ""):
            fail("%s: frontmatter `license:` must name Apache-2.0 with Commons Clause" % os.path.relpath(base, ROOT))

# 3. line endings --------------------------------------------------------------------------------
for base, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in (".git", "node_modules", "__pycache__")]
    for f in files:
        if f.endswith((".md", ".js", ".mjs", ".py", ".json", ".html", ".txt", ".xml", ".yml")):
            if b"\r\n" in open(os.path.join(base, f), "rb").read():
                fail("%s: CRLF line endings (the repository is LF)" % os.path.relpath(os.path.join(base, f), ROOT))

# 4. generated index -----------------------------------------------------------------------------
r = subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "build-index.py"), "--check"],
                   capture_output=True, text=True)
if r.returncode != 0:
    fail((r.stdout + r.stderr).strip() or "docs/rule-index.md check failed")

# 5. manifests -------------------------------------------------------------------------------------
try:
    plugin = json.loads(read(os.path.join(ROOT, ".claude-plugin", "plugin.json")))
    market = json.loads(read(os.path.join(ROOT, ".claude-plugin", "marketplace.json")))
    names = [p.get("name") for p in market.get("plugins", [])]
    if plugin.get("name") not in names:
        fail("marketplace.json lists %s but plugin.json is named %r" % (names, plugin.get("name")))
except Exception as e:  # noqa: BLE001 - report any parse failure plainly
    fail("manifest problem: %s" % e)

# 6. published links ------------------------------------------------------------------------------
# GitHub Pages serves docs/ at this address, so a link to it is a link into docs/ that the
# relative-link check above cannot see. A trailing / means index.html.
PUB = re.compile(r"https://kz-95\.github\.io/kz-skills/([^\s\"'<>()\[\]`]*)")
ID_ATTR = re.compile(r"""\bid\s*=\s*["']([^"']+)["']""")
ids_cache = {}
tracked = subprocess.run(["git", "ls-files"], cwd=ROOT, capture_output=True, text=True).stdout.splitlines()
for rel in tracked:
    if not rel.endswith((".md", ".txt", ".html", ".json")):
        continue
    src = os.path.join(ROOT, rel)
    if not os.path.isfile(src):
        continue
    for n, line in enumerate(read(src).splitlines(), 1):
        for m in PUB.finditer(line):
            target = m.group(1).rstrip(".,;:")
            path, _, anchor = target.partition("#")
            path = path.split("?")[0]
            if path == "" or path.endswith("/"):
                path += "index.html"
            local = os.path.normpath(os.path.join(ROOT, "docs", path))
            if not os.path.isfile(local):
                fail("%s:%d: published link to a page that does not exist -> %s" % (rel, n, m.group(0)))
                continue
            if anchor and local.endswith(".html"):
                if local not in ids_cache:
                    ids_cache[local] = set(ID_ATTR.findall(read(local)))
                if anchor not in ids_cache[local]:
                    fail("%s:%d: published link to an anchor the page does not have -> %s" % (rel, n, m.group(0)))

# 7. llms.txt is served from docs/ by GitHub Pages, so the copy there must match the root one --
try:
    if open(os.path.join(ROOT, "llms.txt"), "rb").read() != open(os.path.join(ROOT, "docs", "llms.txt"), "rb").read():
        fail("docs/llms.txt is out of date - copy llms.txt")
except OSError as e:
    fail("docs/llms.txt is out of date - copy llms.txt (%s)" % e)

# 8. ASCII only (engineering rule 7) in the files agents read and run -----------------------------
# Skill text, rules, scripts and checks. A line that must quote a non-ASCII sample (a name a form
# has to accept) ends with the invisible marker <!-- ascii-ok -->.
for base, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in (".git", "node_modules", "__pycache__", "out", "history")]
    rel_base = os.path.relpath(base, ROOT)
    if not (rel_base == "." or rel_base.startswith(("skills", "scripts"))):
        continue
    for f in files:
        if not f.endswith((".md", ".js", ".mjs", ".py", ".ts", ".tsx", ".txt")):
            continue
        path = os.path.join(base, f)
        for n, line in enumerate(io.open(path, encoding="utf-8", errors="replace"), 1):
            if any(ord(c) > 127 for c in line) and "<!-- ascii-ok -->" not in line:
                fail("%s:%d: non-ASCII character (rule 7: use the ASCII form)" % (os.path.relpath(path, ROOT), n))
                break

if problems:
    print("%d problem(s):" % len(problems))
    for p in problems:
        print("  - " + p)
    sys.exit(1)
print("ok: %d skills, links resolve, LF endings, rule index current, manifests agree, published links resolve, llms.txt copies match, ASCII only" % found)
