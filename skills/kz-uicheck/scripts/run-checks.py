#!/usr/bin/env python3
"""Run the kz-uicheck checks on a local HTML file in headless Chrome, with no browser window and no
install beyond Python 3 and Chrome. For generated pages, static reports, and a pre-commit step.

    python run-checks.py page.html                       all eight checks, at 1280px
    python run-checks.py page.html --checks table-check,popover-check --width 390

Prints each check's findings and exits 1 if any check found a problem (advisories do not fail it).

How: it copies the page to a temp file with a <base> pointing at the original folder (so relative
CSS, scripts and images still load), appends a script that runs the chosen checks one after
another once the page has loaded, and reads the results back from the DOM Chrome dumps. Waits in the
checks run on virtual time, so a check that pauses for 100ms costs no real time.

Limits: a local file only (for a served page, save it or paste the checks into the console); one
width per run; both colour schemes by default (--scheme); focus-check needs a focused page, which a headless run normally is.
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

HERE = os.path.dirname(os.path.abspath(__file__))
CHECKS_DIR = os.path.join(os.path.dirname(HERE), "checks")
ALL = ["layout-audit", "table-check", "typing-check", "popover-check", "contrast-check",
       "modal-check", "focus-check", "form-check"]


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

    runner = """<script>
window.addEventListener('load', function () {
  var SRC = %s, out = {};
  (async function () {
    for (var k in SRC) {
      try { out[k] = await (0, eval)(SRC[k]); } catch (e) { out[k] = 'ERROR ' + e; }
    }
    var pre = document.createElement('pre'); pre.id = 'kz-check-results';
    pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  })();
});
</script>""" % json.dumps(sources).replace("</", "<\\/")     # a "</script>" inside a check must not end this tag

    doc = open(page, encoding="utf-8", errors="replace").read()
    base = '<base href="%s/">' % ("file:///" + os.path.dirname(page).replace("\\", "/").lstrip("/"))
    doc = re.sub(r"(<head[^>]*>)", lambda m: m.group(1) + base, doc, count=1, flags=re.I) if re.search(r"<head[^>]*>", doc, re.I) else base + doc
    doc = re.sub(r"(</body>)", lambda m: runner + m.group(1), doc, count=1, flags=re.I) if re.search(r"</body>", doc, re.I) else doc + runner

    schemes = ["light", "dark"] if a.scheme == "both" else [a.scheme]
    bad = 0
    for scheme in schemes:
        tmp = tempfile.mkdtemp(prefix="kz-checks-")
        try:
            f = os.path.join(tmp, "page.html")
            open(f, "w", encoding="utf-8").write(doc)
            r = subprocess.run([find_chrome(), "--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars",
                                "--allow-file-access-from-files", "--window-size=%d,%d" % (a.width, a.height),
                                "--blink-settings=preferredColorScheme=%d" % (0 if scheme == "dark" else 1),
                                "--user-data-dir=" + os.path.join(tmp, "profile"),
                                "--virtual-time-budget=300000", "--dump-dom", "file:///" + f.replace("\\", "/")],
                               capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=600)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)    # leave nothing behind, even when Chrome fails

        m = re.search(r'<pre id="kz-check-results">(.*?)</pre>', r.stdout, re.S)
        if not m:
            sys.exit("the checks did not finish (no results in the page). Chrome said:\n" + r.stderr[-800:])
        results = json.loads(html.unescape(m.group(1)))

        print("%s at %dpx, %s scheme" % (os.path.basename(page), a.width, scheme))
        for n in names:
            res = results.get(n)
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
