#!/usr/bin/env node
/* Blind pairwise judge. For each model and task, pairs the `none` run of repeat k with the
   `after` /kz-uiuxrule run and the `after` /kz-flashrule run of the same repeat. For both pages
   of a pair it takes a full-page screenshot at 1280 and at 390, and a strip of frames from a
   short scripted interaction (STEPS, per task). Left and right are shuffled (seeded), the files
   are named A-* and B-* only, and `claude -p --model JUDGE_MODEL --tools Read` in a fresh, empty
   config dir is asked which a real user would find better. The judge never sees a condition name,
   a path or a transcript: only six images and the request.

     node scripts/bench/judge.mjs scripts/bench/results/after-2026-10-14.json [--save 5] [--budget 25]

   Writes results/judge-<date>.json (every comparison, the side mapping, the judge's JSON and
   cost) and, with --save N, N representative pairs under results/pairs/ for a person to judge
   blind; the mapping for those is in results/pairs/key.json, so do not open it first.
   This spends real money (one Opus call per comparison). */
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { STATUSES, SITES, openValueList, untickOne, openDetail, flipTheme } from './helpers.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PW = process.env.PLAYWRIGHT || '/opt/node-tools/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const JUDGE_MODEL = process.env.JUDGE_MODEL || 'claude-opus-5-5';
const KZ_SIDE = ['uiuxrule', 'flashrule'];
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const files = args.filter((a, i) => a.endsWith('.json') && !args[i - 1]?.startsWith('--'));
const SAVE = +opt('--save', 0), BUDGET = +opt('--budget', 25), JOBS = +opt('--jobs', 3), SEED = +opt('--seed', 20261014);
const stamp = new Date().toISOString().slice(0, 10);
const OUT = opt('--out', path.join(HERE, 'results', `judge-${stamp}.json`));
const WORK = opt('--work', path.join(process.env.KZ_BENCH_WORK || '/tmp/kzb', `judge-${stamp}`));

/* seeded shuffle source (mulberry32) */
let s = SEED >>> 0;
const rand = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const click = async (p, re) => { const b = p.getByRole('button', { name: re }).first(); if (!(await b.count())) return false; await b.click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(250); return true; };
async function fillForm(p) {
  for (const re of [/site/i, /work type|type of work/i]) {
    const f = p.getByLabel(re).first();
    const tag = await f.evaluate(e => e.tagName + ':' + (e.type || '')).catch(() => '');
    if (tag.startsWith('SELECT')) await f.selectOption({ index: 1 }).catch(() => {});
    else if (/radio/.test(tag)) await f.check().catch(() => {});
    else await f.fill(re.source.includes('site') ? 'Harbour' : 'Plumbing').catch(() => {});
  }
  await p.getByLabel(/budget/i).first().fill('1500').catch(() => {});
  await p.getByLabel(/note/i).first().fill('Leaking pipe in bay 3').catch(() => {});
  return click(p, /submit|send|request|create|save/i);
}
/* Each step: [caption, async page => truthy when the step could be done]. */
const STEPS = {
  'trivial-label': [['Clicked the Save button', p => click(p, /save/i)]],
  'small-column': [['Opened the Status column filter', p => openValueList(p, STATUSES, 'thead')], ['Unticked one status', p => untickOne(p, STATUSES)]],
  'table-build': [['Opened a column filter', async p => (await openValueList(p, STATUSES)) || openValueList(p, SITES)], ['Unticked one value', p => untickOne(p, [...STATUSES, ...SITES])]],
  'chart-filter': [['Opened the site filter', p => openValueList(p, SITES)], ['Unticked one site', p => untickOne(p, SITES)]],
  'form-build': [['Submitted the empty form', p => click(p, /submit|send|request|create|save/i)], ['Filled the form in and submitted it', async p => { await p.reload(); return fillForm(p); }]],
  'iterate-html': [['Clicked the first job', p => openDetail(p)], ['Pressed Escape', async p => { await p.keyboard.press('Escape'); await p.waitForTimeout(250); return true; }], ['Clicked the dark mode toggle', p => flipTheme(p)]],
  'dark-mode': [['Clicked the dark mode toggle', p => flipTheme(p)]],
};

async function capture(browser, page_, task, dir, side) {
  const shots = {};
  for (const [w, name, maxH] of [[1280, 'desktop', 2400], [390, 'phone', 2800]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w === 390 ? 844 : 900 }, isMobile: w === 390, hasTouch: w === 390 });
    const p = await ctx.newPage();
    await p.goto(pathToFileURL(page_).href); await p.waitForTimeout(400);
    if (task === 'dark-mode' && w === 390) await flipTheme(p);          /* the phone shot shows the new mode */
    const h = Math.min(maxH, await p.evaluate(() => document.documentElement.scrollHeight));
    const f = path.join(dir, `${side}-${name}.jpg`);
    await p.screenshot({ path: f, type: 'jpeg', quality: 70, fullPage: true, clip: { x: 0, y: 0, width: w, height: h } });
    shots[name] = f;
    await ctx.close();
  }
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(pathToFileURL(page_).href); await p.waitForTimeout(400);
  const frames = [];
  for (const [cap, fn] of STEPS[task]) {
    let ok = false;
    try { ok = !!(await fn(p)); } catch { ok = false; }
    frames.push({ cap: ok ? cap : cap + ' - could not find the control to do this', img: (await p.screenshot({ type: 'jpeg', quality: 70 })).toString('base64') });
  }
  await ctx.close();
  /* one image: the frames stacked at half size, each with its caption */
  const sheet = await browser.newPage({ viewport: { width: 660, height: 400 } });
  await sheet.setContent('<body style="margin:0;padding:10px;font:16px system-ui;background:#fff;color:#111">' +
    frames.map((f, i) => `<p style="margin:8px 0 4px">Step ${i + 1}: ${f.cap}</p><img style="width:640px;border:1px solid #888" src="data:image/jpeg;base64,${f.img}">`).join('') + '</body>');
  await sheet.waitForTimeout(200);
  const f = path.join(dir, `${side}-steps.jpg`);
  await sheet.screenshot({ path: f, type: 'jpeg', quality: 70, fullPage: true });
  await sheet.close();
  shots.steps = f;
  return { shots, captions: frames.map(f => f.cap) };
}

function taskRequest(task) {
  const p = readFileSync(path.join(HERE, 'tasks', task, 'prompt.md'), 'utf8').trim();
  const fu = path.join(HERE, 'tasks', task, 'followups.json');
  return existsSync(fu) ? p + ' Then, one at a time: ' + JSON.parse(readFileSync(fu, 'utf8')).join(' ') : p;
}

function judge(dir, request, capsA, capsB) {
  const prompt = `Two versions of the same page built from the same request: "${request}". Which would a real user find better to use, A, B or tie? Answer as JSON {winner, reasons[3]}.\n\n` +
    `The images are in the current folder. For each version there are three: A-desktop.jpg (the full page at 1280px wide), A-phone.jpg (the full page at 390px wide, a phone), and A-steps.jpg (frames from a short scripted interaction at 1280px: ${capsA.join('; ')}). B-desktop.jpg, B-phone.jpg and B-steps.jpg are the same for B (${capsB.join('; ')}). ` +
    `Open all six with the Read tool before you answer. Then reply with only the JSON object, for example {"winner": "A", "reasons": ["...", "...", "..."]}, where winner is "A", "B" or "tie".`;
  const cfg = path.join(dir, '.cfg');
  mkdirSync(cfg, { recursive: true });
  const env = { ...process.env, CLAUDE_CONFIG_DIR: cfg };
  for (const k of ['CLAUDECODE', 'CLAUDE_CODE_SESSION_ID', 'CLAUDE_CODE_CHILD_SESSION', 'CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD', 'CLAUDE_ADDITIONAL_DIRECTORIES', 'CLAUDE_CODE_SYNC_SKILLS', 'CLAUDE_CODE_SYNC_PLUGINS', 'CLAUDE_CODE_REMOTE_SESSION_ID', 'CLAUDE_CODE_TEE_SDK_STDOUT', 'CLAUDE_CODE_MESSAGING_SOCKET', 'CLAUDE_CODE_DIAGNOSTICS_FILE', 'CLAUDE_EFFORT']) delete env[k];
  return new Promise(resolve => {
    const c = spawn('claude', ['-p', prompt, '--model', JUDGE_MODEL, '--tools', 'Read', '--allowedTools', 'Read', '--output-format', 'json', '--max-budget-usd', '3'], { cwd: dir, env });
    let out = '';
    c.stdout.on('data', d => { out += d; });
    c.on('close', () => {
      let res = {};
      try { res = JSON.parse(out.trim().split('\n').pop()); } catch { res = { is_error: true, result: out.slice(-500) }; }
      let verdict = null;
      const m = (res.result || '').match(/\{[\s\S]*\}/);
      if (m) { try { verdict = JSON.parse(m[0]); } catch { verdict = null; } }
      resolve({ verdict, cost: res.total_cost_usd || 0, model_ids: Object.keys(res.modelUsage || {}), num_turns: res.num_turns, raw_tail: (res.result || '').slice(-400) });
    });
  });
}

/* ---------- main ---------- */
const runs = files.flatMap(f => JSON.parse(readFileSync(f, 'utf8')).runs).filter(r => r.mode === 'scored' && r.workdir && existsSync(path.join(r.workdir, 'index.html')));
const pick = (model, task, cond, ver, rep) => runs.find(r => r.model === model && r.task === task && r.condition === cond && (r.version || '-') === ver && r.rep === rep);
const comps = [];
for (const r of runs.filter(r => r.condition === 'none')) {
  for (const kc of KZ_SIDE) {
    const k = pick(r.model, r.task, kc, 'after', r.rep);
    if (k) comps.push({ model: r.model, task: r.task, rep: r.rep, kz_condition: kc, none_dir: r.workdir, kz_dir: k.workdir });
  }
}
comps.sort((a, b) => (a.model + a.task + a.kz_condition + a.rep).localeCompare(b.model + b.task + b.kz_condition + b.rep));
for (const c of comps) c.kz_is = rand() < 0.5 ? 'A' : 'B';
const doc = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { date: stamp, judge_model: JUDGE_MODEL, seed: SEED, comparisons: [] };
const done = new Set(doc.comparisons.filter(c => c.verdict).map(c => [c.model, c.task, c.rep, c.kz_condition].join('|')));
const todo = comps.filter(c => !done.has([c.model, c.task, c.rep, c.kz_condition].join('|')));
doc.comparisons = doc.comparisons.filter(c => c.verdict);
let spent = doc.comparisons.reduce((a, c) => a + (c.cost || 0), 0);
console.log(`${comps.length} comparisons, ${todo.length} to judge, spent so far $${spent.toFixed(2)}`);
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const save = () => writeFileSync(OUT, JSON.stringify(doc, null, 1).replace(/[\u0080-\uffff]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')));
let next = 0;
async function worker() {
  while (next < todo.length) {
    const c = todo[next++];
    if (spent >= BUDGET) { console.log('budget reached, stopping'); return; }
    const dir = path.join(WORK, [c.model, c.task, c.kz_condition, 'r' + c.rep].join('__'));
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const A = c.kz_is === 'A' ? c.kz_dir : c.none_dir, B = c.kz_is === 'A' ? c.none_dir : c.kz_dir;
    const ca = await capture(browser, path.join(A, 'index.html'), c.task, dir, 'A');
    const cb = await capture(browser, path.join(B, 'index.html'), c.task, dir, 'B');
    const j = await judge(dir, taskRequest(c.task), ca.captions, cb.captions);
    spent += j.cost;
    const w = (j.verdict?.winner || '').toString().trim().toUpperCase();
    const result = w === 'TIE' ? 'tie' : w === c.kz_is ? 'kz' : (w === 'A' || w === 'B') ? 'none' : null;
    doc.comparisons.push({ ...c, dir, captions: { A: ca.captions, B: cb.captions }, verdict: j.verdict, result, cost: j.cost, judge_model_ids: j.model_ids, num_turns: j.num_turns, raw_tail: j.verdict ? undefined : j.raw_tail });
    console.log(`${c.model.padEnd(18)} ${c.task.padEnd(14)} r${c.rep} none vs ${c.kz_condition.padEnd(9)} kz=${c.kz_is} judge=${w || '?'} -> ${result}  $${j.cost.toFixed(3)} (spent $${spent.toFixed(2)})`);
    save();
  }
}
await Promise.all(Array.from({ length: JOBS }, worker));
await browser.close();
doc.total_cost_usd = Math.round(spent * 10000) / 10000;
save();

/* representative pairs for a person: spread over tasks, models, both kz lanes and all three outcomes */
if (SAVE) {
  const pool = doc.comparisons.filter(c => c.verdict && c.result);
  const chosen = [];
  const score = c => (chosen.some(x => x.task === c.task) ? 0 : 4) + (chosen.some(x => x.result === c.result) ? 0 : 3) +
    (chosen.some(x => x.kz_condition === c.kz_condition) ? 0 : 1) + (chosen.some(x => x.model === c.model) ? 0 : 1);
  while (chosen.length < SAVE && chosen.length < pool.length) {
    const best = pool.filter(c => !chosen.includes(c)).sort((a, b) => score(b) - score(a) || (a.task + a.rep).localeCompare(b.task + b.rep))[0];
    chosen.push(best);
  }
  const pdir = opt('--pairs-dir', path.join(HERE, 'results', 'pairs'));
  rmSync(pdir, { recursive: true, force: true });
  const key = {};
  chosen.forEach((c, i) => {
    const d = path.join(pdir, `pair-${i + 1}`);
    mkdirSync(d, { recursive: true });
    for (const side of ['A', 'B']) for (const n of ['desktop', 'phone', 'steps']) copyFileSync(path.join(c.dir, `${side}-${n}.jpg`), path.join(d, `${side}-${n}.jpg`));
    writeFileSync(path.join(d, 'request.txt'), taskRequest(c.task) + '\n');
    writeFileSync(path.join(d, 'judge.json'), JSON.stringify(c.verdict, null, 1).replace(/[\u0080-\uffff]/g, ch => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0')) + '\n');
    key[`pair-${i + 1}`] = { model: c.model, task: c.task, rep: c.rep, kz_condition: c.kz_condition, kz_is: c.kz_is, judge_result: c.result };
  });
  writeFileSync(path.join(pdir, 'key.json'), JSON.stringify(key, null, 1) + '\n');
  console.log(`saved ${chosen.length} pairs under ${pdir}`);
}
