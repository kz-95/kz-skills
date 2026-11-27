#!/usr/bin/env python3
"""Run the kz-uicheck checks on a local HTML file in headless Chrome, with no browser window and no
install beyond Python 3 and Chrome. For generated pages, static reports, and a pre-commit step.

    python run-checks.py page.html                       every check, at 1280px
    python run-checks.py page.html --checks table-check,popover-check --width 390
    python run-checks.py app.html --hash orders --tap "#tab-open,#new-order" --wait ".sheet"

Prints each check's findings and exits 1 if any check found a problem (advisories do not fail it).

Screen targeting: a check measures whatever screen is showing, so point it at the one you changed.
    --hash ROUTE      open page.html#ROUTE
    --storage FILE    JSON {key: value} written to localStorage before any page script runs
    --tap SELECTORS   comma list, clicked in order after load, about 150ms apart
    --wait SELECTOR   must exist and be visible before the check runs
    --expect TEXT     visible text that must be on screen before the check runs
A tap target that is missing, or a --wait / --expect that never shows within about 3s, makes the
run FAIL with "WRONG SCREEN: ...". A check that saw the wrong screen is never a silent clean.

Pointer: headless Chrome reports no pointer and no hover unless told, so it is emulated: a mouse
that hovers above 480px, touch at 480px and below (--pointer fine|touch overrides). 375px is
therefore touch, which is what the 44px tap-target rule and explain-check's touch path need.

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
POINTER = {"fine": "primaryHoverType=2,primaryPointerType=4,availableHoverTypes=2,availablePointerTypes=4",
           "touch": "primaryHoverType=1,primaryPointerType=2,availableHoverTypes=1,availablePointerTypes=2"}
ALL = ["layout-audit", "table-check", "typing-check", "popover-check", "contrast-check",
       "modal-check", "focus-check", "form-check", "motion-check", "diagram-check",
       "toast-check", "explain-check", "agree-check", "colour-check"]


def js(value):
    """A Python value as a JS literal that is safe inside a <script> tag."""
    return json.dumps(value).replace("</", "<\\/")


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
    if isinstance(result, str) and result.startswith("WRONG SCREEN"):
        return True                   # the check never reached the screen it was meant to measure
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
    ap.add_argument("--pointer", choices=["auto", "fine", "touch"], default="auto",
                    help="pointer to emulate: fine (mouse, can hover) or touch (cannot hover); auto is touch at 480px and below")
    ap.add_argument("--hash", default="", help="open page.html#ROUTE")
    ap.add_argument("--storage", help="JSON file of {key: value} written to localStorage before any page script runs")
    ap.add_argument("--tap", default="", help="comma list of selectors clicked in order after load, about 150ms apart")
    ap.add_argument("--wait", help="selector that must exist and be visible before the check runs")
    ap.add_argument("--expect", help="visible text that must be on screen before the check runs")
    a = ap.parse_args()
    a.hash = a.hash.lstrip("#")
    taps = [t.strip() for t in a.tap.split(",") if t.strip()]

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
    if a.storage:
        store = json.load(open(a.storage, encoding="utf-8"))
        if not isinstance(store, dict):
            sys.exit("--storage must hold a JSON object of {key: value}")
        # first thing in <head>, so it runs before any page script reads the keys
        base += ("<script>(function () { var s = %s; for (var k in s) { if (s.hasOwnProperty(k)) {"
                 " try { localStorage.setItem(k, typeof s[k] === 'string' ? s[k] : JSON.stringify(s[k])); }"
                 " catch (e) {} } } })();</script>" % js(store))
    raw = raw[:m.end()] + base + raw[m.end():] if m else base + raw

    # Reach the screen before the check: tap in order, then wait for the selector and the text.
    # Any step that fails yields a "WRONG SCREEN:" string, which failed() counts as FAIL.
    screen_js = ("function kzVisible(el) { if (!el || !el.getClientRects().length) return false;"
                 " var cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none'; }"
                 " function kzSleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }"
                 " async function kzPoll(test) { for (var i = 0; i < 30; i++) { if (test()) return true;"
                 " await kzSleep(100); } return test(); }"
                 " async function kzScreen() { var taps = %s, wait = %s, expect = %s;"
                 " for (var i = 0; i < taps.length; i++) { var sel = taps[i];"
                 " var ok = await kzPoll(function () { return document.querySelector(sel); });"
                 " if (!ok) return 'WRONG SCREEN: tap target ' + sel + ' not found';"
                 " ok = await kzPoll(function () { return kzVisible(document.querySelector(sel)); });"
                 " if (!ok) return 'WRONG SCREEN: tap target ' + sel + ' is not visible, so a person could not tap it';"
                 " var el = document.querySelector(sel);"
                 " if (el.scrollIntoView) el.scrollIntoView({ block: 'center' });"
                 " if (window.PointerEvent) { el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));"
                 " el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true })); }"
                 " el.click(); await kzSleep(150); }"
                 " if (wait && !(await kzPoll(function () { return kzVisible(document.querySelector(wait)); })))"
                 " return 'WRONG SCREEN: ' + wait + ' never appeared';"
                 " if (expect && !(await kzPoll(function () { return (document.body.innerText || '').indexOf(expect) >= 0; })))"
                 " return 'WRONG SCREEN: text \"' + expect + '\" never appeared';"
                 " return ''; }" % (js(taps), js(a.wait or ""), js(a.expect or "")))

    def with_runner(src):
        """The page with one check appended, run once it has loaded."""
        runner = ("<script>" + screen_js + " window.addEventListener('load', function () { (async function () {"
                  " var out; try { var bad = await kzScreen(); out = bad ? bad : await (0, eval)(%s); }"
                  " catch (e) { out = 'ERROR ' + e; }"
                  " var pre = document.createElement('pre'); pre.id = 'kz-check-results';"
                  " pre.textContent = JSON.stringify(out); document.body.appendChild(pre); })(); });</script>"
                  % js(src))     # a "</script>" inside a check must not end this tag
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
                     # headless Chrome reports pointer: none and hover: none unless told otherwise, so a check
                     # that tests the hover path (explain-check) would never see one
                     "--blink-settings=preferredColorScheme=%d,%s" % (0 if scheme == "dark" else 1, POINTER[pointer]),
                     "--user-data-dir=" + os.path.join(tmp, "profile"),
                     "--virtual-time-budget=300000", "--dump-dom",
                     Path(f).as_uri() + ("#" + a.hash if a.hash else "")]
            if a.local_fetch:
                flags.insert(1, "--allow-file-access-from-files")
            if hasattr(os, "geteuid") and os.geteuid() == 0:
                # Chrome refuses to start as root (containers, CI runners) unless its sandbox is off
                flags.insert(1, "--no-sandbox")
            r = subprocess.run(flags, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=600)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)    # leave nothing behind, even when Chrome fails
        m = re.search(r'<pre id="kz-check-results">(.*?)</pre>', r.stdout, re.S)
        if not m:
            return "ERROR the check did not finish. Chrome said: " + r.stderr[-400:]
        return json.loads(html.unescape(m.group(1)))

    schemes = ["light", "dark"] if a.scheme == "both" else [a.scheme]
    pointer = a.pointer if a.pointer != "auto" else ("touch" if a.width <= 480 else "fine")
    screen = ", ".join(x for x in [
        "#" + a.hash if a.hash else "",
        "storage " + os.path.basename(a.storage) if a.storage else "",
        "tap " + " > ".join(taps) if taps else "",
        "wait " + a.wait if a.wait else "",
        'expect "%s"' % a.expect if a.expect else ""] if x) or "first screen after load"
    bad = 0
    for scheme in schemes:
        print("%s at %dpx, %s scheme, %s pointer, screen: %s" % (os.path.basename(page), a.width, scheme, pointer, screen))
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
