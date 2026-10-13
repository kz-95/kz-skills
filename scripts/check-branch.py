#!/usr/bin/env python3
"""Fail a branch name that breaks engineering rule 33.

A branch is named after the work: feat/, fix/, docs/ or chore/ plus the work in
kebab-case. Never a tool, model, agent or session name, and never a generated id.

Usage: python scripts/check-branch.py [branch]
With no argument it reads GITHUB_HEAD_REF (a pull request in CI), then the
current git branch. main is allowed; it is never pushed to directly (rule 33),
but CI on main must still pass.
"""
import os
import re
import subprocess
import sys

PREFIXES = ("feat", "fix", "docs", "chore")

# Tool, model, agent and host names that must never appear in a branch name.
TOOLS = (
    "claude", "anthropic", "codex", "openai", "gpt", "chatgpt", "copilot",
    "cursor", "gemini", "bard", "devin", "aider", "windsurf", "cline", "amp",
    "opus", "sonnet", "haiku", "fable", "llm", "agent", "bot", "ai", "ccr",
)


def problems(name):
    out = []
    if name == "main":
        return out
    parts = name.split("/")
    if len(parts) != 2 or parts[0] not in PREFIXES:
        out.append("must be <prefix>/<work> with prefix one of %s" % ", ".join(PREFIXES))
    work = parts[-1]
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", work):
        out.append("the work part must be kebab-case: lowercase words joined by '-'")
    words = re.split(r"[-/_.]", name.lower())
    named = sorted(set(w for w in words if w in TOOLS))
    if named:
        out.append("names a tool, model or agent: %s" % ", ".join(named))
    # A generated id: a token with both letters and digits that is not a word,
    # such as cgaoyu7 or 890ac0d4. Real work words are letters only, or a version.
    ids = [w for w in words if re.fullmatch(r"(?=.*\d)(?=.*[a-z])[a-z0-9]{5,}", w)]
    if ids:
        out.append("looks like a generated id: %s" % ", ".join(ids))
    return out


def current():
    if len(sys.argv) > 1:
        return sys.argv[1]
    if os.environ.get("GITHUB_HEAD_REF"):
        return os.environ["GITHUB_HEAD_REF"]
    return subprocess.run(
        ["git", "branch", "--show-current"], capture_output=True, text=True
    ).stdout.strip()


if __name__ == "__main__":
    name = current()
    if not name:
        print("check-branch: detached HEAD, nothing to check")
        sys.exit(0)
    found = problems(name)
    if found:
        print("branch '%s' breaks rule 33 (skills/kz-engrules/rules/engineering-rules.md):" % name)
        for p in found:
            print("  - " + p)
        print("Rename it before the first push: git branch -m <prefix>/<the-work>")
        sys.exit(1)
    print("ok: branch '%s' is named after the work" % name)
