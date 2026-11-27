/* Run the kz-uicheck checks inside a Playwright page you already drive, on the state you put it in.

   run-checks.py loads a file fresh for each check, which cannot reach a state that only exists
   after a test has seeded records, opened a sheet and set a filter. This runs the same check files
   in the page as it is now:

     import { runChecks, assertClean } from './kz-checks.mjs';   // path to this file
     await page.setViewportSize({ width: 375, height: 800 });     // and hasTouch: true for touch
     const results = await runChecks(page, ['layout-audit', 'popover-check']);
     assertClean(results);                                        // throws with every finding

   A CommonJS test loads it with `const { runChecks } = await import('<path>/kz-checks.mjs')`.

   Each result is { name, failed, lines }: `lines` is what the check printed (findings first,
   then advisories), `failed` follows the same rule as run-checks.py (the first line starts with
   "clean", or table-check's object has no failures). Checks run one after another on the live
   page, not on a fresh load each, so order matters: the checks that type into fields or press
   buttons (form-check, typing-check, toast-check) run last unless you pass your own order, and
   a test that needs a clean state afterwards reloads it. Emulate the device on the context
   (viewport, hasTouch, colorScheme); the checks measure what the page reports.

   No dependencies beyond the Playwright you already use. */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const CHECKS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'checks');

/* every check, the ones that change the page last */
export const CHECKS = [
  'layout-audit', 'contrast-check', 'colour-check', 'agree-check', 'focus-check', 'motion-check',
  'diagram-check', 'table-check', 'popover-check', 'modal-check', 'explain-check',
  'toast-check', 'typing-check', 'form-check',
];

function verdict(result) {
  if (typeof result === 'string') { return true; }
  if (Array.isArray(result)) { return !(result.length && typeof result[0] === 'string' && result[0].startsWith('clean')); }
  if (result && typeof result === 'object') { return Boolean(result.failures && result.failures.length); }
  return true;
}

function lines(result) {
  if (Array.isArray(result)) { return result.map(String); }
  if (result && typeof result === 'object') {
    return (result.failures || []).map(String).concat((result.advisory || []).map((x) => 'advisory: ' + x));
  }
  return [String(result)];
}

/* the checks that exist in this copy, in CHECKS order */
export const AVAILABLE = CHECKS.filter((n) => existsSync(path.join(CHECKS_DIR, n + '.js')));

/* run the named checks (every available one by default) in `page`; returns [{ name, failed, lines }] */
export async function runChecks(page, names = AVAILABLE) {
  const out = [];
  const known = CHECKS.filter((n) => names.includes(n));
  const order = known.concat(names.filter((n) => !CHECKS.includes(n)));
  for (const raw of order) {
    const name = raw.replace(/\.js$/, '');
    const file = path.join(CHECKS_DIR, name + '.js');
    if (!existsSync(file)) { throw new Error('no such check: ' + name); }
    let result;
    try {
      result = await page.evaluate(readFileSync(file, 'utf8'));
    } catch (e) {
      result = 'ERROR ' + (e && e.message ? e.message.split('\n')[0] : e);
    }
    out.push({ name, failed: verdict(result), lines: lines(result) });
  }
  return out;
}

/* throw one error listing every finding of every failed check; returns the results when clean */
export function assertClean(results) {
  const bad = results.filter((r) => r.failed);
  if (bad.length) {
    throw new Error('kz-uicheck: ' + bad.length + ' check(s) failed\n' +
      bad.map((r) => '[' + r.name + ']\n  ' + r.lines.join('\n  ')).join('\n'));
  }
  return results;
}
