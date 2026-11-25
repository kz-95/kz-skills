/* Page helpers shared by score.mjs (the rubric) and judge.mjs (the interaction trace).
   Each takes a Playwright page. They look for controls the way a person would describe them
   ("the site filter", "the dark mode toggle"), so an unusual control can be missed: a miss
   scores a fail, and the item's name says what was looked for. */

export const STATUSES = ['Open', 'In progress', 'On hold', 'Done', 'Cancelled'];
export const SITES = ['North depot', 'South yard', 'East works', 'West plant', 'Harbour', 'Airport'];

export const visibleCount = (page, sel) => page.evaluate(s => [...document.querySelectorAll(s)].filter(e => {
  const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
  return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
}).length, sel);

export const bodyRows = page => visibleCount(page, 'table tbody tr');

export const visibleCheckboxes = page => page.evaluate(() => [...document.querySelectorAll('input[type=checkbox], [role=checkbox], [role=option][aria-selected], [role=menuitemcheckbox], button[aria-pressed]')].filter(e => {
  const t = e.matches('input') && e.closest('label') ? e.closest('label') : e;
  const r = (e.getBoundingClientRect().width ? e : t).getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden';
}).map(e => {
  const lab = e.closest('label') || (e.id && document.querySelector('label[for="' + e.id + '"]')) || e.parentElement;
  return (lab ? lab.textContent : e.textContent || '').trim().replace(/\s+/g, ' ');
}));

/* Open a value list whose entries include `values`; returns {how, labels, trigger} or null. */
export async function openValueList(page, values, scopeSel = 'body') {
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

export async function untickOne(page, values) {
  const boxes = await page.locator('input[type=checkbox], [role=checkbox], [role=menuitemcheckbox], button[aria-pressed]').all();
  for (const b of boxes) {
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
export const chartSnapshot = page => page.evaluate(() => {
  const sized = e => { const r = e.getBoundingClientRect(); return r.width > 200 && r.height > 100; };
  let big = [...document.querySelectorAll('svg, canvas')].filter(sized);
  if (!big.length) big = [...document.querySelectorAll('[id*=chart i], [class*=chart i], [role=img], figure')].filter(sized).slice(0, 1);
  return big.map(e => e.tagName === 'CANVAS' ? e.toDataURL() : e.innerHTML).join('|');
});

const ITEM_SEL = ['tbody tr', 'ul > li', 'ol > li', '[role=listitem]', 'article', '[role=row]:not(:first-child)', '.job', '.job-card', '.card', '[data-id]', '[data-job-id]', 'li button', 'li'];
export async function jobItems(p) {
  for (const s of ITEM_SEL) if ((await visibleCount(p, s)) === 8) return s;
  return null;
}
export async function applyStatusFilter(p) {
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
  /* a T1 panel: a trigger that opens a list of tick boxes; untick (or tick) one status, then
     press Apply/Done if the list has not narrowed yet */
  const STATUS = /open|progress|done|complete|hold|scheduled|pending|cancel|closed|new|queued|running|succeeded|failed|active|paused|blocked|draft/i;
  const triggers = await p.locator('button[aria-haspopup], button[aria-controls], button[aria-expanded], summary').all();
  for (const t of triggers) {
    if (!(await t.isVisible().catch(() => false))) continue;
    await t.click({ timeout: 1500 }).catch(() => {}); await p.waitForTimeout(200);
    const boxes = await p.locator('input[type=checkbox], [role=checkbox], [role=menuitemcheckbox], input[type=radio], [role=radio], [role=menuitemradio]').all();
    for (const b of boxes) {
      const lab = await b.evaluate(e => ((e.closest('label') || (e.id && document.querySelector('label[for="' + e.id + '"]')) || e.parentElement || e).textContent || '').trim()).catch(() => '');
      if (!STATUS.test(lab) || lab.length > 40 || /^all\b/i.test(lab)) continue;
      if (await b.isVisible().catch(() => false)) await b.click({ timeout: 1500 }).catch(() => {});
      else await b.evaluate(e => (e.closest('label') || e).click()).catch(() => {});
      await p.waitForTimeout(200);
      let n = await visibleCount(p, sel);
      if (!(n > 0 && n < 8)) {
        const apply = p.getByRole('button', { name: /apply|done|show|ok/i }).first();
        if (await apply.count()) { await apply.click({ timeout: 1500 }).catch(() => {}); await p.waitForTimeout(200); n = await visibleCount(p, sel); }
      }
      await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      n = await visibleCount(p, sel);
      if (n > 0 && n < 8) return { sel, after: n };
      break;
    }
    await p.keyboard.press('Escape'); await p.waitForTimeout(80);
  }
  return null;
}
export const dialogCount = p => visibleCount(p, '[role=dialog], dialog[open], [aria-modal=true], aside, .detail, .details, .panel, .drawer, #detail, #details, #detail-panel');
export async function openDetail(p) {
  const sel = await jobItems(p); if (!sel) return false;
  const before = await dialogCount(p);
  const text = await p.evaluate(() => document.body.innerText.length);
  const first = p.locator(sel).first();
  const inner = first.locator('button, a').first();
  await ((await inner.count()) ? inner : first).click({ timeout: 2000 }).catch(() => {});
  await p.waitForTimeout(300);
  return (await dialogCount(p)) > before || (await p.evaluate(() => document.body.innerText.length)) > text + 40;
}

/* ---------- theme ---------- */

/* The dark mode control: a button, switch, checkbox or select whose text, name, title, id or
   class says dark, theme, light or night. Returns a locator or null. */
export async function findThemeToggle(p) {
  const handle = await p.evaluateHandle(() => {
    const re = /dark|theme|light|night/i;
    const say = e => [e.textContent, e.getAttribute('aria-label'), e.getAttribute('title'), e.id, e.className && e.className.baseVal === undefined ? e.className : '',
      e.labels && [...e.labels].map(l => l.textContent).join(' ')].join(' ');
    const cands = [...document.querySelectorAll('button, [role=switch], [role=button], input[type=checkbox], select, a[href="#"]')]
      .filter(e => re.test(say(e)) && (e.getBoundingClientRect().width > 0 || (e.labels && e.labels[0] && e.labels[0].getBoundingClientRect().width > 0)));
    /* in a System / Light / Dark group, the Dark one */
    return cands.find(e => /dark|night/i.test(e.textContent + (e.getAttribute('aria-label') || '') + (e.dataset ? JSON.stringify(e.dataset) : ''))) || cands[0] || null;
  });
  const el = handle.asElement();
  return el || null;
}

/* Flip the theme once. Returns a short description of what was done, or null. */
export async function flipTheme(p) {
  const el = await findThemeToggle(p);
  if (!el) return null;
  const tag = await el.evaluate(e => e.tagName + ':' + (e.type || ''));
  if (tag.startsWith('SELECT')) {
    const ok = await el.evaluate(s => { const o = [...s.options].find(o => /dark/i.test(o.textContent + o.value)); if (!o) return false; s.value = o.value; s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); return true; });
    if (!ok) return null;
  } else if (tag === 'INPUT:checkbox' && !(await el.isVisible())) {
    await el.evaluate(e => (e.labels && e.labels[0] ? e.labels[0] : e).click());
  } else {
    await el.click({ timeout: 2000 }).catch(async () => el.evaluate(e => e.click()));
  }
  await p.waitForTimeout(350);
  return tag;
}

/* In-page colour maths: effective background (first non-transparent ancestor, white at the
   root) and WCAG contrast. Installed once per page as window.__kzc. */
export const installColour = p => p.evaluate(() => {
  if (window.__kzc) return;
  const parse = c => { const m = (c || '').match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
  const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const bg = el => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0.5) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  window.__kzc = { parse, lum, bg, ratio };
});

export const pageLum = async p => { await installColour(p); return p.evaluate(() => window.__kzc.lum(window.__kzc.bg(document.querySelector('main') || document.body))); };

/* ---------- undo-toast: a list of site visits, each editable inline with a Delete button ----------
   Rows are found by their Delete (or Remove) buttons outside any dialog or live region; a row's
   identity is its notes text, which only that row holds. A message is visible text matching a
   pattern (opacity and size checked up the tree), wherever the page put it. */
export const VISIT_NOTES = ['Fire doors checked, one closer slow', 'Crane inspection booked for next week', 'Roof drains clear',
  'Boiler pressure within range', 'Fence panel loose near gate 2', 'Lighting survey complete'];
export const DELETED_RE = /\b(deleted|removed|undo)\b/i;
export const SAVED_RE = /\b(saved|updated)\b/i;
const OUTSIDE = '[role=dialog], [role=alertdialog], dialog, [aria-modal=true], [aria-live]:not([aria-live=off]), [role=status], [role=alert], [role=log], output';

/* the visible elements whose own text matches re; with mark, they get data-kzb-msg */
export const messages = (p, re, mark = false) => p.evaluate(([src, flags, mark]) => {
  const re = new RegExp(src, flags);
  const shown = el => { const r = el.getBoundingClientRect(); if (!r.width || !r.height) return false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.1) return false; } return true; };
  const out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let t;
  while ((t = w.nextNode())) if (re.test(t.nodeValue) && t.parentElement && shown(t.parentElement) && !out.includes(t.parentElement)) out.push(t.parentElement);
  if (mark) { document.querySelectorAll('[data-kzb-msg]').forEach(e => e.removeAttribute('data-kzb-msg')); out.forEach(e => e.setAttribute('data-kzb-msg', '')); }
  return out.length;
}, [re.source, re.flags, mark]);

/* poll up to ms for more matching messages than `base`; returns true when they came */
export async function waitMessage(p, re, base, ms) {
  for (let t = 0; t <= ms; t += 100) { if ((await messages(p, re)) > base) return true; await p.waitForTimeout(100); }
  return false;
}

const deleteButtons = p => p.getByRole('button', { name: /delete|remove/i });
export async function visitRows(p) {
  let n = 0;
  for (const b of await deleteButtons(p).all()) if (await b.isVisible().catch(() => false) && !(await b.evaluate((e, s) => !!e.closest(s), OUTSIDE).catch(() => true))) n++;
  return n;
}
/* the notes of the rows on screen, from field values and text */
export const presentNotes = p => p.evaluate(N => {
  const vals = [...document.querySelectorAll('input, textarea')].map(i => i.value).join('\n') + '\n' + document.body.innerText;
  return N.filter(n => vals.includes(n));
}, VISIT_NOTES);

/* a confirm step, if the page asks: window.confirm is accepted; a modal's confirming button is pressed */
export async function confirmIfAsked(p) {
  await p.waitForTimeout(200);
  const modal = p.locator('[role=alertdialog], [role=dialog], dialog[open], [aria-modal=true]').filter({ visible: true }).last();
  if (!(await modal.count())) return false;
  const btn = modal.getByRole('button', { name: /delete|remove|confirm|yes|ok|continue/i }).filter({ hasNotText: /cancel|keep|^no\b/i }).first();
  if (!(await btn.count())) return false;
  await btn.click({ timeout: 2000 }).catch(() => {});
  return true;
}

/* press the first row's Delete (and confirm if asked); true when a row went */
export async function deleteFirstVisit(p) {
  if (!p.__kzbDialog) { p.on('dialog', d => d.accept().catch(() => {})); p.__kzbDialog = true; }
  const before = await visitRows(p);
  for (const b of await deleteButtons(p).all()) {
    if (!(await b.isVisible().catch(() => false)) || (await b.evaluate((e, s) => !!e.closest(s), OUTSIDE).catch(() => true))) continue;
    await b.click({ timeout: 2000 }).catch(() => {});
    await confirmIfAsked(p);
    await p.waitForTimeout(100);
    return (await visitRows(p)) < before;
  }
  return false;
}

/* press every Undo (or Restore) on screen, one at a time, up to `max` */
export async function pressUndos(p, max = 4) {
  let n = 0;
  for (; n < max; n++) {
    const u = p.getByRole('button', { name: /undo|restore/i }).filter({ visible: true }).first();
    if (!(await u.count())) break;
    await u.click({ timeout: 2000 }).catch(() => {});
    await p.waitForTimeout(300);
  }
  return n;
}

/* change the first row field and leave it (Tab); if the page wants a Save press, press the row's */
export async function editFirstVisit(p) {
  const f = p.locator('input[type=text], input:not([type]), textarea, [contenteditable=true]').filter({ visible: true }).first();
  if (!(await f.count())) return false;
  const editable = await f.evaluate(e => e.isContentEditable);
  if (editable) { await f.click(); await p.keyboard.press('End'); await p.keyboard.type(' (rechecked)'); }
  else { const v = await f.inputValue(); await f.fill(v + ' (rechecked)'); }
  await p.keyboard.press('Tab');
  return true;
}
