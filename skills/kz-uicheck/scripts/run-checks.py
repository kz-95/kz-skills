#!/usr/bin/env python3
"""Run the kz-uicheck checks on a local HTML file in headless Chrome, with no browser window and no
install beyond Python 3 and Chrome. For generated pages, static reports, and a pre-commit step.

    python run-checks.py page.html                       all nine checks, at 1280px
    python run-checks.py page.html --checks table-check,popover-check --width 390

Prints each check's findings and exits 1 if any check found a problem (advisories do not fail it).

How: it copies the page to a temp file with a <base> pointing at the original folder (so relative
CSS, scripts and images still load), appends a script that runs the chosen checks one after
another once the page has loaded, and reads the results back from the DOM Chrome dumps. Waits in the
checks run on virtual time, so a check that pauses for 100ms costs no real time.

Limits: a local file only (for a served page, save it or paste the checks into the console); one
width per run; both colour schemes by default (--scheme); each check gets a fresh page load, so one
check cannot see what another left open; a page may not read other local files unless --local-fetch.
"""
import argparse
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = os.path.dirname(os.path.abspath(__file__))
CHECKS_DIR = os.path.join(os.path.dirname(HERE), "checks")
for _s in (sys.stdout, sys.stderr):      # findings quote page text; a Windows pipe defaults to cp1252
    _s.reconfigure(encoding="utf-8", errors="replace")
ALL = ["layout-audit", "table-check", "typing-check", "popover-check", "contrast-check",
       "modal-check", "focus-check", "form-check", "motion-check"]


def find_chrome():
    if os.environ.get("CHROME"):
        return os.environ["CHROME"]
    for c in [r"C:\Program Files\Google\Chrome\Application\chrome.exe",
              r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
              r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
              "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]:
        if os.path.exists(c):
            return c
    for name in ("google-chrome", "chromium", "chromium-browser", "chrome"):
        if shutil.which(name):
            return shutil.which(name)
    sys.exit("Chrome or Chromium not found. Set the CHROME environment variable to its path.")


def failed(result):
    """A check's own verdict: an array whose first line starts 'clean', or table-check's object."""
    if isinstance(result, dict):
        return bool(result.get("failures"))
    if isinstance(result, list):
        return not (result and isinstance(result[0], str) and result[0].startswith("clean"))
    return True                       # an error string, or nothing came back


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("page")
    ap.add_argument("--checks", default=",".join(ALL))
    ap.add_argument("--width", type=int, default=1280)
    ap.add_argument("--height", type=int, default=900)
    ap.add_argument("--local-fetch", action="store_true",
                    help="let the page read other local files (off by default: a page's script could read any file)")
    ap.add_argument("--scheme", choices=["both", "light", "dark"], default="both",
                    help="prefers-color-scheme to run under; both by default, since a colour verified in one says nothing about the other")
    a = ap.parse_args()

    page = os.path.abspath(a.page)
    names = [n.strip().replace(".js", "") for n in a.checks.split(",") if n.strip()]
    sources = {}
    for n in names:
        p = os.path.join(CHECKS_DIR, n + ".js")
        if not os.path.exists(p):
            sys.exit("no such check: " + n)
        sources[n] = open(p, encoding="utf-8").read()

    raw = open(page, encoding="utf-8", errors="replace").read()
    base = '<base href="%s/">' % Path(page).parent.as_uri().rstrip("/")
    m = re.search(r"<head[^>]*>", raw, re.I)
    raw = raw[:m.end()] + base + raw[m.end():] if m else base + raw

    def with_runner(src):
        """The page with one check appended, run once it has loaded."""
        runner = ("<script>window.addEventListener('load', function () { (async function () {"
                  " var out; try { out = await (0, eval)(%s); } catch (e) { out = 'ERROR ' + e; }"
                  " var pre = document.createElement('pre'); pre.id = 'kz-check-results';"
                  " pre.textContent = JSON.stringify(out); document.body.appendChild(pre); })(); });</script>"
                  % json.dumps(src).replace("</", "<\\/"))     # a "</script>" inside a check must not end this tag
        k = raw.lower().rfind("</body>")
        return raw[:k] + runner + raw[k:] if k >= 0 else raw + runner

    def run_one(src, scheme):
        """Each check gets a fresh page load: a check that opens panels or edits fields must not leave its
        state for the next one (the 'one at a time, on a settled page' rule)."""
        tmp = tempfile.mkdtemp(prefix="kz-checks-")
        try:
            f = os.path.join(tmp, "page.html")
            open(f, "w", encoding="utf-8").write(with_runner(src))
            flags = [find_chrome(), "--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars",
                     "--window-size=%d,%d" % (a.width, a.height),
                     "--blink-settings=preferredColorScheme=%d" % (0 if scheme == "dark" else 1),
                     "--user-data-dir=" + os.path.join(tmp, "profile"),
                     "--virtual-time-budget=300000", "--dump-dom", Path(f).as_uri()]
            if a.local_fetch:
                flags.insert(1, "--allow-file-access-from-files")
            r = subprocess.run(flags, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=600)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)    # leave nothing behind, even when Chrome fails
        m = re.search(r'<pre id="kz-check-results">(.*?)</pre>', r.stdout, re.S)
        if not m:
            return "ERROR the check did not finish. Chrome said: " + r.stderr[-400:]
        return json.loads(html.unescape(m.group(1)))

    schemes = ["light", "dark"] if a.scheme == "both" else [a.scheme]
    bad = 0
    for scheme in schemes:
        print("%s at %dpx, %s scheme" % (os.path.basename(page), a.width, scheme))
        for n in names:
            res = run_one(sources[n], scheme)
            verdict = "FAIL" if failed(res) else "ok"
            bad += verdict == "FAIL"
            print("\n[%s] %s" % (verdict, n))
            lines = res if isinstance(res, list) else (
                (["failures:"] + ["  " + x for x in res.get("failures", [])] + ["advisory:"] + ["  " + x for x in res.get("advisory", [])])
                if isinstance(res, dict) else [str(res)])
            for line in lines:
                print("  " + str(line))
        print()
    print("%d failure(s) across %d check run(s)" % (bad, len(names) * len(schemes)))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
