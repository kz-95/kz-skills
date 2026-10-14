#!/usr/bin/env node
/* Score benchmark outputs. For each scored run, the same for every condition:
     - kz-uicheck failures at 1280px and 390px (run-checks.py, both colour schemes), and the
       failures the agent introduced: the run's count minus the untouched starter's;
     - a per-task rubric of binary items checked in the DOM with Playwright;
     - axe-core violations by impact at 1280 and 390 (AXE_VERSION, injected from npm);
     - Lighthouse accessibility and best-practices at mobile (LIGHTHOUSE_VERSION).

     node scripts/bench/score.mjs scripts/bench/results/after-2026-10-14.json
     RESCORE=1 ONLY_TASK=iterate-html node scripts/bench/score.mjs <results.json>   score one task again
     SCORE_JOBS=3 ...                                        runs scored at once (default 3)
     SKIP_LIGHTHOUSE=1 ...                                   leave Lighthouse out
     DEBUG=1 ...                                             print each rubric item as it is scored

   Writes `score` into each scored run, and `starters` (the untouched pages' own numbers) into
   the file, in place. Needs: Python 3, Playwright at PLAYWRIGHT, Chrome for run-checks.py
   (CHROME, default the Playwright headless shell), a full Chromium for Lighthouse (CHROME_PATH),
   and axe-core and lighthouse installed under KZ_BENCH_TOOLS (see README), else npx fetches them. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { STATUSES, SITES, visibleCount, bodyRows, visibleCheckboxes, openValueList, untickOne, chartSnapshot,
  jobItems, applyStatusFilter, dialogCount, openDetail, findThemeToggle, flipTheme, installColour, pageLum } from './helpers.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const PW = process.env.PLAYWRIGHT || '/opt/node-tools/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const CHROME_PATH = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
export const AXE_VERSION = '4.10.3';
export const LIGHTHOUSE_VERSION = '12.8.2';
const TOOLS = process.env.KZ_BENCH_TOOLS || '/tmp/kzb-tools';
const AXE = path.join(TOOLS, 'node_modules', 'axe-core', 'axe.min.js');
const LH_BIN = path.join(TOOLS, 'node_modules', '.bin', 'lighthouse');
const RUN_CHECKS = path.join(REPO, 'skills', 'kz-uicheck', 'scripts', 'run-checks.py');
/* the rubric's "is it a T1 panel" uses the check's own definition, so the rubric and table-check
   cannot disagree about what a chart filter has to be */
const TABLE_CHECK = readFileSync(path.join(REPO, 'skills', 'kz-uicheck', 'checks', 'table-check.js'), 'utf8');

function run(cmd, args, env, timeout = 900000) {
  return new Promise(resolve => {
    const p = spawn(cmd, args, { env: { ...process.env, ...env } });
    let out = '', err = '';
    const t = setTimeout(() => p.kill('SIGKILL'), timeout);
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { err += d; });
    p.on('close', code => { clearTimeout(t); resolve({ code, out, err }); });
  });
}

async function uicheck(file, width) {
  const r = await run('python3', [RUN_CHECKS, file, '--width', String(width)], { CHROME });
  const perCheck = {};
  let failures = 0;
  for (const m of (r.out || '').matchAll(/^\[(FAIL|ok)\] (\S+)/gm)) {
    perCheck[m[2]] = (perCheck[m[2]] || 0) + (m[1] === 'FAIL' ? 1 : 0);
    if (m[1] === 'FAIL') failures++;
  }
  const total = (r.out || '').match(/(\d+) failure\(s\) across (\d+)/);
  return { failures, runs: total ? +total[2] : 0, perCheck, error: total ? null : (r.err || r.out || '').slice(-400) };
}

/* A tiny static server, so Lighthouse sees http:// rather than file:// (some audits refuse file). */
const server = http.createServer((req, res) => {
  const f = decodeURIComponent(new URL(req.url, 'http://x').pathname.replace(/^\/f/, ''));
  if (!existsSync(f) || !f.startsWith('/')) { res.writeHead(404); res.end(); return; }
  const type = f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'application/octet-stream';
  res.writeHead(200, { 'content-type': type }); res.end(readFileSync(f));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const urlOf = file => `http://127.0.0.1:${server.address().port}/f${file}`;

async function lighthouse(file) {
  if (process.env.SKIP_LIGHTHOUSE) return null;
  const args = [urlOf(file), '--only-categories=accessibility,best-practices', '--form-factor=mobile',
    '--screenEmulation.mobile=true', '--output=json', '--output-path=stdout', '--quiet',
    '--chrome-flags=--headless=new --no-sandbox'];
  const r = existsSync(LH_BIN) ? await run(LH_BIN, args, { CHROME_PATH }, 240000)
    : await run('npx', ['-y', `lighthouse@${LIGHTHOUSE_VERSION}`, ...args], { CHROME_PATH }, 240000);
  try {
    const d = JSON.parse(r.out);
    const failed = Object.entries(d.audits).filter(([, a]) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable').map(([k]) => k);
    return { version: d.lighthouseVersion, accessibility: d.categories.accessibility.score, best_practices: d.categories['best-practices'].score, failed };
  } catch (e) { return { error: (r.err || r.out || String(e)).slice(-300) }; }
}

async function axe(browser, file) {
  const out = { version: AXE_VERSION, by_impact: { critical: 0, serious: 0, moderate: 0, minor: 0 }, nodes_by_impact: { critical: 0, serious: 0, moderate: 0, minor: 0 }, rules: {} };
  for (const width of [1280, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(pathToFileURL(file).href); await page.waitForTimeout(300);
      await page.addScriptTag({ path: AXE });
      const v = await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ['violations'] })).violations.map(x => ({ id: x.id, impact: x.impact, nodes: x.nodes.length })));
      for (const x of v) {
        const prev = out.rules[x.id];
        if (!prev) out.rules[x.id] = { impact: x.impact, nodes: x.nodes, widths: [width] };
        else { prev.nodes = Math.max(prev.nodes, x.nodes); prev.widths.push(width); }
      }
    } catch (e) { out.error = String(e).slice(0, 200); }
    await ctx.close();
  }
  for (const r of Object.values(out.rules)) { out.by_impact[r.impact] = (out.by_impact[r.impact] || 0) + 1; out.nodes_by_impact[r.impact] = (out.nodes_by_impact[r.impact] || 0) + r.nodes; }
  out.serious_critical = out.by_impact.serious + out.by_impact.critical;
  return out;
}

/* ---------- rubrics: each item is [name, async page => boolean] ---------- */
const RUBRICS = {
  'trivial-label': [
    ['button text is "Save draft"', async p => (await p.getByRole('button', { name: /^save draft$/i }).count()) === 1],
    ['Save draft has the primary style', async p => p.getByRole('button', { name: /^save draft$/i }).evaluate(b => /primary/.test(b.className) || getComputedStyle(b).backgroundColor === 'rgb(36, 87, 197)').catch(() => false)],
    ['Cancel stayed secondary', async p => p.getByRole('button', { name: /^cancel$/i }).evaluate(b => getComputedStyle(b).backgroundColor !== 'rgb(36, 87, 197)').catch(() => false)],
    ['diff is small (<= 6 lines changed)', async (p, run) => run.lines_added + run.lines_removed <= 6],
    ['the form still saves', async p => { await p.getByRole('button', { name: /^save draft$/i }).click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(150); return p.evaluate(() => /saved/i.test(document.body.innerText)); }],
  ],
  'small-column': [
    ['a Status header exists', async p => p.evaluate(() => [...document.querySelectorAll('th')].some(th => /status/i.test(th.textContent)))],
    ['every row shows a status from the data', async p => p.evaluate(S => {
      const i = [...document.querySelectorAll('thead th')].findIndex(th => /status/i.test(th.textContent));
      const rows = [...document.querySelectorAll('tbody tr')];
      return i >= 0 && rows.length === 40 && rows.every(r => S.some(s => (r.children[i]?.textContent || '').includes(s)));
    }, STATUSES)],
    ['Status has the same filter panel as the other columns', async p => !!(await openValueList(p, STATUSES, 'thead'))],
    ['unticking a status filters rows live', async p => { const before = await bodyRows(p); if (!(await openValueList(p, STATUSES, 'thead'))) return false; const l = await untickOne(p, STATUSES); return !!l && (await bodyRows(p)) < before; }],
    ['the existing Site filter still works', async p => { await p.reload(); return !!(await openValueList(p, SITES, 'thead')); }],
  ],
  'table-build': [
    ['a table of the orders (>= 10 rows, customer/site/status/amount headers)', async p => (await bodyRows(p)) >= 10 && p.evaluate(() => ['customer', 'site', 'status', 'amount'].every(h => [...document.querySelectorAll('th')].some(th => th.textContent.toLowerCase().includes(h))))],
    ['a filter offers a value list (not only a select or text box)', async p => !!(await openValueList(p, SITES)) || !!(await openValueList(p, STATUSES))],
    ['the value list shows counts', async p => { const o = (await openValueList(p, STATUSES)) || (await openValueList(p, SITES)); return !!o && o.labels.filter(l => /\d/.test(l)).length >= 3; }],
    ['unticking a value filters rows live', async p => { await p.reload(); const before = await bodyRows(p); const o = (await openValueList(p, STATUSES)) || (await openValueList(p, SITES)); if (!o) return false; const l = await untickOne(p, [...STATUSES, ...SITES]); return !!l && (await bodyRows(p)) < before; }],
    ['amounts are right-aligned', async p => p.evaluate(() => { const td = [...document.querySelectorAll('tbody td')].find(t => /\d[\d,]*\.\d\d/.test(t.textContent)); return !!td && ['right', 'end'].includes(getComputedStyle(td).textAlign); })],
  ],
  'chart-filter': [
    ['a chart is drawn (svg, canvas or HTML chart >= 200x100)', async p => (await chartSnapshot(p)).length > 0],
    ['the site filter is not a <select>', async p => p.evaluate(S => ![...document.querySelectorAll('select')].some(s => [...s.options].some(o => S.includes(o.textContent.trim()))), SITES)],
    /* T1, as table-check.js defines it: no CHARTBOX (chips, tick boxes, a select or a text box
       driving the chart), and a trigger that declares aria-haspopup opens a value list with counts */
    ['the site filter is a T1 panel (table-check CHARTBOX clean, aria-haspopup trigger, value list with counts)', async p => {
      const tc = await p.evaluate(TABLE_CHECK);
      if (!tc || (tc.failures || []).some(f => /^CHARTBOX/.test(f))) return false;
      const o = await openValueList(p, SITES);
      if (!o || o.how !== 'panel') return false;
      const declared = await o.trigger.evaluate(e => e.hasAttribute('aria-haspopup') || !!e.closest('[aria-haspopup]')).catch(() => false);
      return declared && o.labels.filter(l => /\d/.test(l)).length >= 3;
    }],
    ['unticking a site re-renders the chart', async p => { await p.reload(); const a = await chartSnapshot(p); const o = await openValueList(p, SITES); if (!o) return false; const l = await untickOne(p, SITES); await p.waitForTimeout(300); return !!l && (await chartSnapshot(p)) !== a; }],
    ['the panel closes on trigger, Escape and outside click', async p => {
      const closed = async () => (await visibleCheckboxes(p)).filter(l => SITES.some(s => l.includes(s))).length < 3;
      await p.reload(); let o = await openValueList(p, SITES); if (!o || o.how !== 'panel') return false;
      await o.trigger.click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(150); const a = await closed();
      await p.reload(); o = await openValueList(p, SITES); await p.keyboard.press('Escape'); await p.waitForTimeout(150); const b = await closed();
      await p.reload(); o = await openValueList(p, SITES); await p.mouse.click(5, (await p.evaluate(() => innerHeight)) - 5); await p.waitForTimeout(150); const c = await closed();
      return a && b && c;
    }],
  ],
  'dark-mode': [
    ['a toggle switches the page to a dark background', async p => { await p.evaluate(() => localStorage.clear()); await p.reload(); if ((await pageLum(p)) < 0.2) return false; if (!(await flipTheme(p))) return false; return (await pageLum(p)) < 0.2; }],
    ['in dark, headings, labels and table cells keep 4.5:1', async p => { await p.evaluate(() => localStorage.clear()); await p.reload(); if (!(await flipTheme(p)) || (await pageLum(p)) >= 0.2) return false; await installColour(p);
      return p.evaluate(() => { const k = window.__kzc; const els = [...document.querySelectorAll('h1, h2, label, th, td, .summary, button')].filter(e => e.getBoundingClientRect().width > 0 && e.textContent.trim());
        return els.length > 10 && els.every(e => { const c = k.parse(getComputedStyle(e).color); return c && k.ratio(c, k.bg(e)) >= 4.5; }); }); }],
    ['in dark, the form fields follow the theme (dark field, text 4.5:1)', async p => { await p.evaluate(() => localStorage.clear()); await p.reload(); if (!(await flipTheme(p)) || (await pageLum(p)) >= 0.2) return false; await installColour(p);
      return p.evaluate(() => { const k = window.__kzc; const f = [...document.querySelectorAll('form input, form select, form textarea')].filter(e => e.getBoundingClientRect().width > 0);
        return f.length >= 3 && f.every(e => { const b = k.bg(e); const c = k.parse(getComputedStyle(e).color); return k.lum(b) < 0.4 && c && k.ratio(c, b) >= 4.5; }); }); }],
    ['in dark, the chart follows the theme (labels 4.5:1, bars 3:1)', async p => { await p.evaluate(() => localStorage.clear()); await p.reload(); if (!(await flipTheme(p)) || (await pageLum(p)) >= 0.2) return false; await installColour(p);
      return p.evaluate(() => { const k = window.__kzc; const svg = document.querySelector('svg#chart, svg.chart, svg[role=img]'); if (!svg) return false; const bg = k.bg(svg);
        const texts = [...svg.querySelectorAll('text')], rects = [...svg.querySelectorAll('rect')].filter(r => r.getBoundingClientRect().width > 2);
        const fill = e => k.parse(getComputedStyle(e).fill);
        return texts.length >= 6 && texts.every(t => { const c = fill(t); return c && k.ratio(c, bg) >= 4.5; }) && rects.length >= 6 && rects.every(r => { const c = fill(r); return c && k.ratio(c, bg) >= 3; }); }); }],
    ['the toggle exposes its state (aria-pressed, a switch, a checkbox, a select, or a name that changes)', async p => { await p.evaluate(() => localStorage.clear()); await p.reload(); const el = await findThemeToggle(p); if (!el) return false;
      const st = await el.evaluate(e => e.hasAttribute('aria-pressed') || (e.getAttribute('role') === 'switch' && e.hasAttribute('aria-checked')) || e.type === 'checkbox' || e.tagName === 'SELECT');
      if (st) return true; const n0 = await el.evaluate(e => (e.getAttribute('aria-label') || '') + e.textContent); await flipTheme(p); const el2 = await findThemeToggle(p); const n1 = el2 ? await el2.evaluate(e => (e.getAttribute('aria-label') || '') + e.textContent) : n0; return n0 !== n1; }],
    ['the choice survives a reload', async p => { await p.evaluate(() => localStorage.clear()); await p.reload(); if (!(await flipTheme(p)) || (await pageLum(p)) >= 0.2) return false; await p.reload(); await p.waitForTimeout(300); return (await pageLum(p)) < 0.2; }],
  ],
  'form-build': [
    ['all four fields have labels', async p => { for (const re of [/site/i, /work type|type of work/i, /budget/i, /note/i]) if ((await p.getByLabel(re).count()) < 1) return false; return true; }],
    ['site and work type are required, and marked', async p => {
      for (const re of [/site/i, /work type|type of work/i]) {
        const ok = await p.getByLabel(re).first().evaluate(e => e.required || e.getAttribute('aria-required') === 'true' || !!e.closest('[aria-required=true]')).catch(() => false);
        if (!ok) return false;
      }
      return p.evaluate(() => /\*|required|optional/i.test([...document.querySelectorAll('label, legend')].map(l => l.textContent).join(' ')));
    }],
    ['submitting empty shows an inline error, not a success', async p => {
      const before = await p.evaluate(() => document.body.innerText);
      await p.getByRole('button', { name: /submit|send|request|create|save/i }).first().click({ timeout: 2000 }).catch(() => {});
      await p.waitForTimeout(200);
      return p.evaluate(b => { const t = document.body.innerText; return t !== b && /required|choose|select|enter|please|missing/i.test(t) && !/submitted|thank|received|request sent/i.test(t); }, before);
    }],
    ['budget is a numeric input', async p => p.getByLabel(/budget/i).first().evaluate(e => e.type === 'number' || /decimal|numeric/.test(e.inputMode || '')).catch(() => false)],
    ['a valid submit shows a confirmation', async p => {
      await p.reload();
      for (const re of [/site/i, /work type|type of work/i]) {
        const f = p.getByLabel(re).first();
        const tag = await f.evaluate(e => e.tagName + ':' + (e.type || '')).catch(() => '');
        if (tag.startsWith('SELECT')) await f.selectOption({ index: 1 }).catch(() => {});
        else if (/radio/.test(tag)) await f.check().catch(() => {});
        else await f.fill(re.source.includes('site') ? 'Harbour' : 'Plumbing').catch(() => {});
      }
      await p.getByLabel(/budget/i).first().fill('1500').catch(() => {});
      await p.getByLabel(/note/i).first().fill('Leaking pipe in bay 3').catch(() => {});
      await p.getByRole('button', { name: /submit|send|request|create|save/i }).first().click({ timeout: 2000 }).catch(() => {});
      await p.waitForTimeout(300);
      return p.evaluate(() => /submitted|thank|received|sent|created|saved/i.test(document.body.innerText));
    }],
  ],
  'iterate-html': [
    ['8 jobs are listed', async p => (await jobItems(p)) !== null],
    ['the status filter narrows the list', async p => !!(await applyStatusFilter(p))],
    ['clicking a job opens a detail panel', async p => openDetail(p)],
    ['Escape closes the detail panel', async p => {
      await p.reload(); const d0 = await dialogCount(p); const t0 = await p.evaluate(() => document.body.innerText.length);
      if (!(await openDetail(p))) return false;
      const t1 = await p.evaluate(() => document.body.innerText.length);
      await p.keyboard.press('Escape'); await p.waitForTimeout(250);
      const d2 = await dialogCount(p); const t2 = await p.evaluate(() => document.body.innerText.length);
      return d2 <= d0 && (t1 - t2) >= (t1 - t0) / 2;     // panel gone, or a fixed side panel back to its empty state
    }],
    ['the filter value survives a reload', async p => { await p.reload(); const r = await applyStatusFilter(p); if (!r) return false; await p.reload(); await p.waitForTimeout(200); const n = await visibleCount(p, r.sel); return n === r.after; }],
    ['a dark mode toggle changes the background', async p => {
      await p.evaluate(() => localStorage.clear()); await p.reload();
      const bg = () => p.evaluate(() => getComputedStyle(document.body).backgroundColor + getComputedStyle(document.documentElement).backgroundColor);
      const a = await bg();
      if (!(await flipTheme(p))) return false;
      return (await bg()) !== a;
    }],
  ],
};


/* ---------- main ---------- */
async function scorePage(browser, file, task, run) {
  if (process.env.DEBUG) console.log('scoring ' + file);
  const [c1280, c390, lh] = await Promise.all([uicheck(file, 1280), uicheck(file, 390), lighthouse(file)]);
  const score = { uicheck: { 1280: c1280, 390: c390 }, axe: await axe(browser, file), lighthouse: lh, rubric: [] };
  if (process.env.DEBUG) console.log('  checks/axe/lighthouse done', JSON.stringify(lh).slice(0, 120));
  for (const [name, fn] of RUBRICS[task] || []) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    page.setDefaultTimeout(4000);          /* a control that is not there fails fast, not after 30 s */
    let pass = false, err = null;
    try {
      await page.goto(pathToFileURL(file).href);
      await page.waitForTimeout(300);
      pass = !!(await fn(page, run || { lines_added: 0, lines_removed: 0 }));
    } catch (e) { err = String(e).slice(0, 200); }
    if (process.env.DEBUG) console.log(`  ${task} ${pass ? 'pass' : 'FAIL'} ${name}${err ? ' ' + err : ''}`);
    score.rubric.push({ item: name, pass, ...(err ? { error: err } : {}) });
    await ctx.close();
  }
  score.rubric_pass = score.rubric.filter(r => r.pass).length;
  score.rubric_total = score.rubric.length;
  return score;
}

const file = process.argv[2];
if (!file) { console.error('usage: node score.mjs <results.json>'); process.exit(2); }
const doc = JSON.parse(readFileSync(file, 'utf8'));
const save = () => writeFileSync(file, JSON.stringify(doc, null, 1).replace(/[\u0080-\uffff]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')));
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
doc.score_tools = { axe_core: AXE_VERSION, lighthouse: LIGHTHOUSE_VERSION };
doc.starters = doc.starters || {};
for (const task of [...new Set(doc.runs.filter(r => r.task).map(r => r.task))]) {
  if (doc.starters[task] && !process.env.RESCORE) continue;
  const f = path.join(HERE, 'tasks', task, 'index.html');
  doc.starters[task] = await scorePage(browser, f, task, null);
  console.log(`starter ${task.padEnd(14)} checks ${doc.starters[task].uicheck[1280].failures}/${doc.starters[task].uicheck[390].failures}  axe s+c ${doc.starters[task].axe.serious_critical}  LH ${doc.starters[task].lighthouse?.accessibility}`);
}
save();
const todo = doc.runs.filter(run => run.mode === 'scored' && run.workdir && (!run.score || process.env.RESCORE) &&
  (!process.env.ONLY_TASK || run.task === process.env.ONLY_TASK));
let next = 0;
async function worker() {
  while (next < todo.length) {
    const run = todo[next++];
    const page_ = path.join(run.workdir, 'index.html');
    if (!existsSync(page_)) { run.score = { error: 'no index.html' }; continue; }
    const score = await scorePage(browser, page_, run.task, run);
    const st = doc.starters[run.task];
    score.introduced = { 1280: score.uicheck[1280].failures - st.uicheck[1280].failures, 390: score.uicheck[390].failures - st.uicheck[390].failures };
    run.score = score;
    console.log(`${run.task.padEnd(14)} ${(run.model || '').padEnd(18)} ${(run.version || '').padEnd(6)} ${run.condition.padEnd(9)} checks ${score.uicheck[1280].failures}/${score.uicheck[390].failures}  rubric ${score.rubric_pass}/${score.rubric_total}  axe s+c ${score.axe.serious_critical}  LH ${score.lighthouse?.accessibility}`);
    save();
  }
}
await Promise.all(Array.from({ length: +(process.env.SCORE_JOBS || 3) }, worker));
await browser.close();
server.close();
save();
