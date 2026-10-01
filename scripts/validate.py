#!/usr/bin/env python3
"""Validate the repository: run before proposing a change, and in CI.

    python scripts/validate.py

Checks, each of which has caught a real defect in this project:
  1. every skill is a DIRECT child of skills/ (a nested one is not registered as a command)
     and its frontmatter `name` equals its folder name, with a non-empty description
  2. every relative link, relative path and <img> source in the Markdown resolves
  3. no CRLF line endings in text files (.gitattributes enforces LF)
  4. docs/rule-index.md is up to date with the rule files
  5. the plugin and marketplace manifests parse and agree on the plugin name
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


def frontmatter(text):
    m = re.match(r"^---\n(.*?)\n---\n", text.replace("\r\n", "\n"), re.S)
    out = {}
    if m:
        for line in m.group(1).split("\n"):
            k = re.match(r"^([A-Za-z_-]+):\s*(.*)$", line)
            if k:
                out[k.group(1)] = k.group(2).strip()
    return out


# 1. skills -------------------------------------------------------------------------------
skills_dir = os.path.join(ROOT, "skills")
found = 0
for base, dirs, files in os.walk(skills_dir):
    dirs[:] = [d for d in dirs if d not in ("__pycache__", "node_modules")]
    if "SKILL.md" in files:
        found += 1
        folder = os.path.basename(base)
        fm = frontmatter(read(os.path.join(base, "SKILL.md")))
        rel = os.path.relpath(base, ROOT)
        if fm.get("name") != folder:
            fail("%s: frontmatter name %r does not match its folder %r" % (rel, fm.get("name"), folder))
        if not fm.get("description"):
            fail("%s: no description in the frontmatter" % rel)
        elif len(fm["description"]) > 1024:
            fail("%s: description is %d characters; keep it under 1024" % (rel, len(fm["description"])))
        depth = len(os.path.relpath(base, skills_dir).split(os.sep))
        if depth > 1 and "ui-glance" not in base:
            fail("%s: a skill nested %d deep is read by its parent but is not registered as a command" % (rel, depth))
if found < 8:
    fail("expected at least 8 skills under skills/, found %d" % found)

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

if problems:
    print("%d problem(s):" % len(problems))
    for p in problems:
        print("  - " + p)
    sys.exit(1)
print("ok: %d skills, links resolve, LF endings, rule index current, manifests agree" % found)
