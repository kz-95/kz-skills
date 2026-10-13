#!/usr/bin/env python3
"""kz-judge: the UI rules a script cannot measure, judged by a small decision model instead of the agent.

    python judge.py check page.html            judge one page (calibrates first if it never has)
    python judge.py calibrate                  re-run the labelled examples for the engine in use
    python judge.py check page.html --strict   exit 1 on findings (they are advisories by default)
    python judge.py engines                    which engines this machine has

Engines, first available wins (or name one with --engine jev|laya):
  jev   TypeSafe's hosted model. Needs TYPESAFE_API_KEY. About $0.04 per million input tokens.
  laya  A local model (github.com/NandhaKishorM/laya). Free, offline, slower to load. Found through
        LAYA_PYTHON, then C:\\Harness\\engine\\laya, then this Python if it can import laya.
  If neither is present the check is skipped and says so (exit 0; with --strict, exit 2).

The page's text facts (error messages, button labels, empty states, delete confirmations) are read in
headless Chrome; the questions are in questions.py. Costs no tokens of the agent that runs it: only the
findings come back. With jev, the page's text is sent to api.typesafe.ai; use --engine laya to keep it local.
"""
import argparse
import concurrent.futures
import hashlib
import importlib.util
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from questions import QUESTIONS  # noqa: E402

for _s in (sys.stdout, sys.stderr):      # page text may hold any script; a Windows pipe defaults to cp1252
    _s.reconfigure(encoding="utf-8", errors="replace")
JEV_MODEL = "jev-1.13.0"            # pinned: the thresholds were calibrated against this version
CAL_FILE = os.path.join(os.path.expanduser("~"), ".kz", "judge-calibration.json")
MARGIN = 0.05                       # an example within this of the threshold counts as not separated

EXTRACT = r"""(function () {
  var out = { error: [], button: [], empty: [], confirm: [] };
  function txt(e) { return (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim(); }
  function vis(e) { var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
  function add(k, t) { if (t && t.length > 1 && t.length < 400 && out[k].indexOf(t) < 0) { out[k].push(t); } }
  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), function (e) { if (!e.closest('[data-judge="skip"]')) { fn(e); } }); }
  each('[role=alert],[aria-live=assertive],.error,.err,.error-message,[id$="Err"],[id$="-error"]', function (e) { add('error', txt(e)); });
  each('button,[role=button],input[type=submit],input[type=button]', function (e) {
    if (!vis(e) || e.closest('th')) { return; }      /* a sort button is named by its column */
    add('button', (e.getAttribute('aria-label') || txt(e) || e.value || '').trim());
  });
  each('.empty,[class*="empty"],[data-empty],.no-results', function (e) { add('empty', txt(e)); });
  each('dialog,[role=alertdialog],[role=dialog][aria-modal=true]', function (e) {
    var t = txt(e); if (/\b(delete|remove|clear|reset|wipe|discard|erase)\b/i.test(t)) { add('confirm', t); }
  });
  return out;
})()"""


# ---------------------------------------------------------------------------------------- engines
def laya_python():
    for p in [os.environ.get("LAYA_PYTHON"), r"C:\Harness\engine\laya\venv\Scripts\python.exe",
              os.path.expanduser("~/laya/venv/bin/python")]:
        if p and os.path.exists(p):
            return p
    return sys.executable if importlib.util.find_spec("laya") else None


def available():
    found = []
    if os.environ.get("TYPESAFE_API_KEY"):
        found.append("jev")
    if laya_python():
        found.append("laya")
    return found


def noul(spec):
    """The question as both engines take it: instructions plus the optional true/false criteria."""
    q = {"type": "noul", "instructions": spec["ask"]}
    if spec.get("criteria"):
        q["criteria"] = spec["criteria"]
    return q


def jev_one(text, spec):
    """One text, one question: the state holds only the text the question is about (QUICKREF rule 3), so one
    page string cannot steer the answer about another."""
    body = json.dumps({"state": {"text": text}, "model": JEV_MODEL,
                       "questions": {"q": noul(spec)}}).encode()
    for attempt in range(3):
        req = urllib.request.Request("https://api.typesafe.ai/v1/systemone", body, {
            "Authorization": "Bearer " + os.environ["TYPESAFE_API_KEY"], "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                out = json.load(r)
                return out["answers"]["q"]["noul"], out.get("model", JEV_MODEL),                     out.get("usage", {}).get("input_tokens", 0), r.headers.get("x-typesafe-request-id")
        except urllib.error.HTTPError as e:
            if e.code in (429, 529) and attempt < 2:
                time.sleep(1.5 * (attempt + 1))
                continue
            sys.exit("jev refused the request (HTTP %d%s). Nothing was judged." % (
                e.code, ": check TYPESAFE_API_KEY" if e.code == 401 else ""))
        except urllib.error.URLError as e:
            sys.exit("could not reach api.typesafe.ai (%s). Nothing was judged." % e.reason)


def ask_jev(items):
    """items: [(id, text, question spec)] -> ({id: p_yes}, model, notes). Requests run 8 at a time."""
    with concurrent.futures.ThreadPoolExecutor(8) as pool:
        res = list(pool.map(lambda it: jev_one(it[1], it[2]), items))
    answers = {it[0]: r[0] for it, r in zip(items, res)}
    model = res[0][1] if res else JEV_MODEL
    notes = ["jev: %d request(s), %d input tokens, first request id %s" % (
        len(res), sum(r[2] for r in res), res[0][3] if res else "-")]
    return answers, model, notes


def ask_laya(items):
    job = json.dumps({"items": [{"id": i, "text": t, "q": noul(spec)} for i, t, spec in items]})
    r = subprocess.run([laya_python(), os.path.join(HERE, "laya_worker.py")], input=job, capture_output=True,
                       text=True, encoding="utf-8", errors="replace", timeout=900)
    line = [ln for ln in r.stdout.splitlines() if ln.startswith("{")]
    if not line:
        sys.exit("laya did not answer:\n" + r.stderr[-800:])
    out = json.loads(line[-1])
    return out["answers"], out["model"], []


def ask(engine, items):
    return ask_jev(items) if engine == "jev" else ask_laya(items)


# ------------------------------------------------------------------------------------ calibration
def fingerprint():
    return hashlib.sha256(json.dumps([QUESTIONS, JEV_MODEL, MARGIN], sort_keys=True).encode()).hexdigest()[:12]


def calibrate(engine):
    items = []
    for qid, q in QUESTIONS.items():
        for side in ("good", "bad"):
            for n, t in enumerate(q[side]):
                items.append(("%s|%s|%d" % (qid, side, n), t, q))
    answers, model, _ = ask(engine, items)
    result = {}
    for qid, q in QUESTIONS.items():
        good = [answers["%s|good|%d" % (qid, n)] for n in range(len(q["good"]))]
        bad = [answers["%s|bad|%d" % (qid, n)] for n in range(len(q["bad"]))]
        result[qid] = {"trusted": min(good) >= q["threshold"] + MARGIN and max(bad) <= q["threshold"] - MARGIN,
                       "good_min": round(min(good), 3), "bad_max": round(max(bad), 3)}
    cal = load_cal()
    cal[engine] = {"model": model, "questions": fingerprint(), "results": result}
    os.makedirs(os.path.dirname(CAL_FILE), exist_ok=True)
    tmp = CAL_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(cal, f, indent=1)
    os.replace(tmp, CAL_FILE)
    return cal[engine]


def load_cal():
    try:
        with open(CAL_FILE, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def calibration_for(engine):
    c = load_cal().get(engine)
    if not c or c.get("questions") != fingerprint():     # never calibrated, or the questions changed
        print("calibrating %s on the labelled examples first..." % engine)
        c = calibrate(engine)
    return c


# ------------------------------------------------------------------------------------- the page
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


def facts(page):
    doc = open(page, encoding="utf-8", errors="replace").read()
    base = '<base href="%s/">' % Path(os.path.abspath(page)).parent.as_uri().rstrip("/")
    runner = ("<script>window.addEventListener('load',function(){var p=document.createElement('pre');"
              "p.id='kz-judge-facts';p.textContent=JSON.stringify(%s);document.body.appendChild(p);});</script>"
              % EXTRACT)
    m = re.search(r"<head[^>]*>", doc, re.I)
    doc = doc[:m.end()] + base + doc[m.end():] if m else base + doc
    k = doc.lower().rfind("</body>")
    doc = doc[:k] + runner + doc[k:] if k >= 0 else doc + runner
    tmp = tempfile.mkdtemp(prefix="kz-judge-")
    try:
        f = os.path.join(tmp, "page.html")
        open(f, "w", encoding="utf-8").write(doc)
        r = subprocess.run([find_chrome(), "--headless=new", "--disable-gpu", "--no-first-run",
                            "--user-data-dir=" + os.path.join(tmp, "profile"),
                            "--virtual-time-budget=10000", "--dump-dom", Path(f).as_uri()],
                           capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=300)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)              # leave nothing behind
    m = re.search(r'<pre id="kz-judge-facts">(.*?)</pre>', r.stdout, re.S)
    if not m:
        sys.exit("could not read the page's text. Chrome said:\n" + r.stderr[-800:])
    return json.loads(html.unescape(m.group(1)))


# ------------------------------------------------------------------------------------------ main
def main():
    ap = argparse.ArgumentParser(description="Judge the UI rules a script cannot measure.")
    ap.add_argument("cmd", choices=["check", "calibrate", "engines"])
    ap.add_argument("page", nargs="?")
    ap.add_argument("--engine", choices=["auto", "jev", "laya"], default="auto")
    ap.add_argument("--strict", action="store_true", help="exit 1 when there are findings")
    a = ap.parse_args()

    have = available()
    if a.cmd == "engines":
        print("available: " + (", ".join(have) or "none") + "   (order of preference: jev, laya)")
        return
    engine = (have[0] if have else None) if a.engine == "auto" else (a.engine if a.engine in have else None)
    if not engine:
        print("judge skipped: no engine%s. Set TYPESAFE_API_KEY (jev) or install laya. Nothing was judged."
              % (" (" + a.engine + " is not available)" if a.engine != "auto" else ""))
        sys.exit(2 if a.strict or a.engine != "auto" else 0)

    if a.cmd == "calibrate":
        c = calibrate(engine)
        print("%s (%s):" % (engine, c["model"]))
        for qid, res in c["results"].items():
            print("  %-26s %s  good >= %.2f, bad <= %.2f" % (qid, "trusted" if res["trusted"] else "NOT TRUSTED",
                                                              res["good_min"], res["bad_max"]))
        return

    if not a.page:
        sys.exit("check needs a page: judge.py check page.html")
    if not os.path.isfile(a.page):
        sys.exit("no such page: " + a.page)
    found = facts(a.page)
    cal = calibration_for(engine)
    trusted = [q for q, res in cal["results"].items() if res["trusted"]]
    if not trusted:
        print("%s: no question is trusted on %s (%s), so nothing was judged. See `judge.py calibrate`."
              % (os.path.basename(a.page), engine, cal["model"]))
        sys.exit(2 if a.strict else 0)
    items = []
    for qid in trusted:
        for n, t in enumerate(found.get(QUESTIONS[qid]["kind"], [])):
            items.append(("%s|%d" % (qid, n), t, QUESTIONS[qid]))

    print("%s judged by %s (%s)" % (os.path.basename(a.page), engine, cal["model"]))
    skipped = [q for q in QUESTIONS if q not in trusted]
    if skipped:
        print("  not asked (this engine failed their labelled examples): " + ", ".join(skipped))
    findings = []
    if items:
        answers, _, notes = ask(engine, items)
        for iid, text, _ in items:
            qid = iid.split("|")[0]
            if answers[iid] < QUESTIONS[qid]["threshold"]:
                findings.append("%s | %s | %s (p=%.2f) | \"%s\"" % (QUESTIONS[qid]["rule"], qid,
                                                                QUESTIONS[qid]["finding"], answers[iid], text[:80]))
        for n in notes:
            print("  " + n)
    print("  read: " + ", ".join("%d %s" % (len(v), k) for k, v in found.items()))
    for f in findings:
        print("  " + f)
    print("%d finding(s)%s" % (len(findings), "" if a.strict else " (advisory)"))
    sys.exit(1 if a.strict and findings else 0)


if __name__ == "__main__":
    main()
