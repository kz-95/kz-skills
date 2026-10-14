#!/usr/bin/env node
/* Score benchmark outputs: kz-uicheck failures at 1280px and 390px, and a per-task rubric of
   binary items checked in the DOM with Playwright. The same scoring runs for every condition.

     node scripts/bench/score.mjs scripts/bench/results/before-2026-10-14.json
     RESCORE=1 ONLY_TASK=iterate-html node scripts/bench/score.mjs <results.json>   score one task again

   Writes `score` into each scored run of the results file, in place.
   Needs: Python 3, Playwright at PLAYWRIGHT (default /opt/node-tools/node_modules/playwright),
   and Chrome for run-checks.py (CHROME, default the Playwright headless shell). */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const PW = process.env.PLAYWRIGHT || '/opt/node-tools/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const RUN_CHECKS = path.join(REPO, 'skills', 'kz-uicheck', 'scripts', 'run-checks.py');
/* the rubric's "is it a T1 panel" uses the check's own definition, so the rubric and table-check
   cannot disagree about what a chart filter has to be */
const TABLE_CHECK = readFileSync(path.join(REPO, 'skills', 'kz-uicheck', 'checks', 'table-check.js'), 'utf8');
const STATUSES = ['Open', 'In progress', 'On hold', 'Done', 'Cancelled'];
const SITES = ['North depot', 'South yard', 'East works', 'West plant', 'Harbour', 'Airport'];

function uicheck(file, width) {
  const r = spawnSync('python3', [RUN_CHECKS, file, '--width', String(width)],
    { env: { ...process.env, CHROME }, encoding: 'utf8', timeout: 900000 });
  const perCheck = {};
  let failures = 0;
  for (const m of (r.stdout || '').matchAll(/^\[(FAIL|ok)\] (\S+)/gm)) {
    perCheck[m[2]] = (perCheck[m[2]] || 0) + (m[1] === 'FAIL' ? 1 : 0);
    if (m[1] === 'FAIL') failures++;
  }
  const total = (r.stdout || '').match(/(\d+) failure\(s\) across (\d+)/);
  return { failures, runs: total ? +total[2] : 0, perCheck, error: total ? null : (r.stderr || r.stdout || '').slice(-400) };
}

/* ---------- page helpers ---------- */
const visibleCount = (page, sel) => page.evaluate(s => [...document.querySelectorAll(s)].filter(e => {
  const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
  return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
}).length, sel);

const bodyRows = page => visibleCount(page, 'table tbody tr');

const visibleCheckboxes = page => page.evaluate(() => [...document.querySelectorAll('input[type=checkbox], [role=checkbox], [role=option][aria-selected], [role=menuitemcheckbox], button[aria-pressed]')].filter(e => {
  const t = e.matches('input') && e.closest('label') ? e.closest('label') : e;
  const r = (e.getBoundingClientRect().width ? e : t).getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden';
}).map(e => {
  const lab = e.closest('label') || (e.id && document.querySelector('label[for="' + e.id + '"]')) || e.parentElement;
  return (lab ? lab.textContent : e.textContent || '').trim().replace(/\s+/g, ' ');
}));

/* Open a value list whose entries include `values`; returns {how, labels, trigger} or null. */
async function openValueList(page, values, scopeSel = 'body') {
  const hits = labels => labels.filter(l => values.some(v => l.includes(v))).length;
  let labels = await visibleCheckboxes(page);
  if (hits(labels) >= Math.min(3, values.length)) return { how: 'inline', labels, trigger: null };
  const triggers = await page.locator(`${scopeSel} button, ${scopeSel} [role=button], ${scopeSel} summary, ${scopeSel} th[aria-haspopup], ${scopeSel} [aria-haspopup]`).all();
  for (const t of triggers) {
    if (!(await t.isVisible().catch(() => false))) continue;
    await t.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(150);
    labels = await visibleCheckboxes(page);
    if (hits(labels) >= Math.min(3, values.length)) return { how: 'panel', labels, trigger: t };
    await page.keyboard.press('Escape');
    await page.mouse.click(2, 2);
    await page.waitForTimeout(80);
  }
  return null;
}

async function untickOne(page, values) {
  const boxes = await page.locator('input[type=checkbox], [role=checkbox], [role=menuitemcheckbox], button[aria-pressed]').all();
  for (const b of boxes) {
    if (!(await b.isVisible().catch(() => false))) {
      // a styled checkbox may be visually hidden; try its label
    }
    const lab = await b.evaluate(e => ((e.closest('label') || (e.id && document.querySelector('label[for="' + e.id + '"]')) || e.parentElement || e).textContent || '').trim());
    if (!values.some(v => lab.includes(v))) continue;
    const checked = await b.evaluate(e => e.matches('input') ? e.checked : (e.getAttribute('aria-checked') || e.getAttribute('aria-pressed')) === 'true');
    if (!checked) continue;
    const lbl = await b.evaluate(e => !!e.closest('label'));
    if (await b.isVisible()) await b.click({ timeout: 2000 }).catch(() => {});
    else if (lbl) await b.locator('xpath=ancestor::label[1]').click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(200);
    return lab;
  }
  return null;
}

/* An svg or canvas of real size, or failing that an HTML chart (bars drawn with divs) in an
   element whose id, class or role says chart/img. */
const chartSnapshot = page => page.evaluate(() => {
  const sized = e => { const r = e.getBoundingClientRect(); return r.width > 200 && r.height > 100; };
  let big = [...document.querySelectorAll('svg, canvas')].filter(sized);
  if (!big.length) big = [...document.querySelectorAll('[id*=chart i], [class*=chart i], [role=img], figure')].filter(sized).slice(0, 1);
  return big.map(e => e.tagName === 'CANVAS' ? e.toDataURL() : e.innerHTML).join('|');
});

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
      const t = p.locator('button, [role=switch], input[type=checkbox], select').filter({ hasText: /dark|theme|light/i });
      let el = (await t.count()) ? t.first() : p.locator('[aria-label*=dark i], [aria-label*=theme i], [title*=dark i], [title*=theme i], #theme-toggle, .theme-toggle').first();
      if (!(await el.count())) return false;
      const tag = await el.evaluate(e => e.tagName);
      if (tag === 'SELECT') await el.selectOption({ label: /dark/i }).catch(async () => el.selectOption({ index: 2 }).catch(() => {}));
      else await el.click({ timeout: 2000 }).catch(() => {});
      await p.waitForTimeout(250);
      return (await bg()) !== a;
    }],
  ],
};

const ITEM_SEL = ['tbody tr', 'ul > li', 'ol > li', '[role=listitem]', 'article', '[role=row]:not(:first-child)', '.job', '.job-card', '.card', '[data-id]', '[data-job-id]', 'li button', 'li'];
async function jobItems(p) {
  for (const s of ITEM_SEL) if ((await visibleCount(p, s)) === 8) return s;
  return null;
}
async function applyStatusFilter(p) {
  const sel = await jobItems(p); if (!sel) return null;
  const s = p.locator('select').filter({ hasText: /./ });
  for (const sl of await s.all()) {
    const opts = await sl.evaluate(e => [...e.options].map(o => o.value));
    for (let i = 1; i < opts.length; i++) {
      await sl.selectOption({ index: i }).catch(() => {}); await p.waitForTimeout(150);
      const n = await visibleCount(p, sel); if (n > 0 && n < 8) return { sel, after: n };
    }
  }
  const btns = await p.locator('button, [role=tab], [role=radio], input[type=radio], label').all();
  for (const b of btns) {
    const txt = (await b.textContent().catch(() => '')) || (await b.getAttribute('value').catch(() => '')) || '';
    if (!/open|progress|done|complete|hold|scheduled|pending|cancel|closed|new|queued|running|succeeded|failed|active|paused|blocked|draft/i.test(txt) || txt.length > 40) continue;
    await b.click({ timeout: 1500 }).catch(() => {}); await p.waitForTimeout(150);
    const n = await visibleCount(p, sel); if (n > 0 && n < 8) return { sel, after: n };
  }
  return null;
}
const dialogCount = p => visibleCount(p, '[role=dialog], dialog[open], [aria-modal=true], aside, .detail, .details, .panel, .drawer, #detail, #details, #detail-panel');
async function openDetail(p) {
  const sel = await jobItems(p); if (!sel) return false;
  const before = await dialogCount(p);
  const text = await p.evaluate(() => document.body.innerText.length);
  const first = p.locator(sel).first();
  const inner = first.locator('button, a').first();
  await ((await inner.count()) ? inner : first).click({ timeout: 2000 }).catch(() => {});
  await p.waitForTimeout(300);
  return (await dialogCount(p)) > before || (await p.evaluate(() => document.body.innerText.length)) > text + 40;
}

/* ---------- main ---------- */
const file = process.argv[2];
if (!file) { console.error('usage: node score.mjs <results.json>'); process.exit(2); }
const doc = JSON.parse(readFileSync(file, 'utf8'));
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
for (const run of doc.runs) {
  if (run.mode !== 'scored' || !run.workdir) continue;
  if (run.score && !process.env.RESCORE) continue;
  if (process.env.ONLY_TASK && run.task !== process.env.ONLY_TASK) continue;
  const page_ = path.join(run.workdir, 'index.html');
  if (!existsSync(page_)) { run.score = { error: 'no index.html' }; continue; }
  const score = { uicheck: { 1280: uicheck(page_, 1280), 390: uicheck(page_, 390) }, rubric: [] };
  for (const [name, fn] of RUBRICS[run.task] || []) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    let pass = false, err = null;
    try {
      await page.goto(pathToFileURL(page_).href);
      await page.waitForTimeout(300);
      pass = !!(await fn(page, run));
    } catch (e) { err = String(e).slice(0, 200); }
    score.rubric.push({ item: name, pass, ...(err ? { error: err } : {}) });
    await ctx.close();
  }
  score.rubric_pass = score.rubric.filter(r => r.pass).length;
  score.rubric_total = score.rubric.length;
  run.score = score;
  console.log(`${run.task.padEnd(14)} ${run.condition.padEnd(8)} checks ${score.uicheck[1280].failures}/${score.uicheck[390].failures}  rubric ${score.rubric_pass}/${score.rubric_total}`);
  writeFileSync(file, JSON.stringify(doc, null, 1).replace(/[\u0080-\uffff]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')));
}
await browser.close();
writeFileSync(file, JSON.stringify(doc, null, 1).replace(/[\u0080-\uffff]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')));
