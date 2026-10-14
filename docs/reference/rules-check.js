/* Rules check: the wrong/right pairs in ui-rules-visual.html, asserted.

   state-check.js drives the charts and the tables bound to them. This one covers the
   rule demonstrations that have behaviour of their own - the tables in T, the clear in
   A3, the modal in N1, the popovers in N2, the fields in F2 F4 F5 F6 F7 F8 F9, the draft in F3 - plus the
   geometric claims the rules make as figures (L3's two comparisons, L4's offset, L6's
   cap, L11's wrap-only-while-it-fits, Y1's tabular figures, P1's zero shift), the
   motion samples in M2-M6, and the diagrams in G, measured as drawn (a slanted run,
   stacked lines, a line behind a box, a plate on its line or under a box, the key's
   place, the narrow-screen width, the box and accent budget, the figure's name).

   Every assertion here is written so that breaking the thing it guards makes it fail.
   It also asserts the WRONG side still demonstrates its defect: a sample that quietly
   starts behaving correctly stops teaching anything, and nothing else would catch it.

   Paste into the console on ui-rules-visual.html, served (not opened from disk). */
(function () {
  var problems = [];
  function bad(rule, detail) { problems.push(rule + ' | ' + detail); }
  function ok(rule, cond, detail) { if (!cond) { bad(rule, detail); } }
  function $(id) { return document.getElementById(id); }
  function rows(id) { return $(id).querySelectorAll('tbody tr[data-id]').length; }
  function cs(el) { return getComputedStyle(el); }
  function px(v) { return parseFloat(v) || 0; }

  /* ---- S1 / T1 / T2: the table earns its controls ------------------------- */
  (function () {
    var all = rows('tTbl');
    ok('S1', all > 0, 'the standard table drew no rows at all');

    $('tQ').value = 'kajang';
    $('tQ').dispatchEvent(new Event('input'));
    ok('S1', rows('tTbl') < all, 'search did not narrow the table');
    ok('S1', /\d+ of \d+/.test($('tCount').textContent),
       'the count chip does not report "n of m": ' + $('tCount').textContent);

    $('tClear').click();
    ok('A3', rows('tTbl') === all, 'clear did not restore every row');
    ok('A3', $('tQ').value === '', 'clear left text in the search box');

    /* T2: the computed column is on the row, so it can be sorted and filtered */
    var share = Array.prototype.slice.call($('t2Tbl').querySelectorAll('thead th'))
      .filter(function (th) { return /Share/.test(th.textContent); })[0];
    ok('T2', !!share, 'the computed Share column is missing from the panelled table');
    ok('T2', share && share.classList.contains('sortable'),
       'the computed column is not sortable, so it was not materialised onto the row');

    /* T3: every column explains itself */
    ['tTbl', 't2Tbl', 't3Tbl', 't4Tbl'].forEach(function (id) {
      var ths = $(id).querySelectorAll('thead th.sortable');
      var helped = $(id).querySelectorAll('thead th .help').length;
      ok('T3', helped >= ths.length,
         id + ': ' + helped + ' explainers for ' + ths.length + ' columns');
    });
  })();

  /* ---- T4: the shortcut drives the column filter, it does not hold state --- */
  (function () {
    var before = rows('t4Tbl');
    $('t4Ren').click();
    var after = rows('t4Tbl');
    ok('T4', after < before, 'the shortcut button changed nothing');
    /* the trigger belongs to the Type COLUMN, so find it by the header's position
       rather than by taking the first cell in the filter row */
    var heads = Array.prototype.map.call($('t4Tbl').querySelectorAll('thead th'),
      function (th) { return th.textContent.replace(/[^A-Za-z]/g, ''); });
    var typeAt = heads.indexOf('Type');
    var cells = $('t4Tbl').querySelectorAll('thead .filters td');
    var trigger = typeAt >= 0 ? cells[typeAt] : null;
    ok('T4', trigger && !/^All$/i.test(trigger.textContent.trim()),
       'the Type column trigger still reads "All" after the shortcut set its filter: "' +
       (trigger ? trigger.textContent.trim() : 'no trigger') + '"');
    $('t4Clear').click();
    ok('T4', rows('t4Tbl') === before, 'clearing did not restore the rows');
  })();

  /* ---- A3: the wrong side must still be wrong ----------------------------- */
  (function () {
    var all = rows('a3BadTbl');
    window.a3Bad && window.a3Bad.setFilter('type', ['Fit-out']);
    $('a3BadQ').value = 'kajang';
    $('a3BadQ').dispatchEvent(new Event('input'));
    $('a3BadClear').click();
    ok('A3 (wrong sample)', rows('a3BadTbl') !== all,
       'the wrong sample now clears everything, so it no longer shows the defect');
    window.a3Bad && window.a3Bad.reset();
    $('a3BadQ').value = '';

    var btn = $('a3GoodClear');
    ok('A3', btn.disabled, 'the clear button is enabled while nothing is set');
    $('a3GoodQ').value = 'kajang';
    $('a3GoodQ').dispatchEvent(new Event('input'));
    ok('A3', /Clear 1 filter/.test(btn.textContent),
       'the label is not derived from what is set: "' + btn.textContent + '"');

    /* and the part that matters: it clears the column filter too, not just the search.
       Without this the sample could quietly become the defect it is contrasted with.
       Measure the full set AFTER clearing, or the search left over from the label
       assertion above is counted as the total. */
    btn.click();
    var total = rows('a3GoodTbl');
    window.a3Good && window.a3Good.setFilter('type', ['Fit-out']);
    ok('A3', rows('a3GoodTbl') < total, 'the column filter did not narrow the right sample');
    btn.click();
    ok('A3', rows('a3GoodTbl') === total,
       'clear left a column filter behind: ' + rows('a3GoodTbl') + ' of ' + total + ' rows');
    ok('A3', $('a3GoodQ').value === '', 'clear left text in the search box');
  })();

  /* ---- A2: the same message counts, it does not restack ------------------- */
  (function () {
    var host = document.querySelector('.toasts, #toasts');
    if (!host) { bad('A2', 'no toast host found'); return; }
    Array.prototype.slice.call(host.children).forEach(function (n) { n.remove(); });
    $('a2Good').click(); $('a2Good').click(); $('a2Good').click();
    ok('A2', host.children.length === 1,
       'three identical toasts produced ' + host.children.length + ' nodes');
    ok('A2', /3/.test(host.textContent), 'the merged toast carries no count');
    Array.prototype.slice.call(host.children).forEach(function (n) { n.remove(); });
  })();

  /* ---- N1: the modal locks, and releases on every path out ---------------- */
  (function () {
    /* "paid for the scrollbar" is a claim about the page not moving, so measure the
       page: the content column keeps its edges when the lock goes on. (The check here
       used to be paddingRight >= 0, which cannot fail - it passed a 16px shift.) */
    var col = document.querySelector('.wrap');
    var was = col.getBoundingClientRect();
    $('n1GoodOpen').click();
    var now = col.getBoundingClientRect();
    ok('N1', cs(document.body).overflow === 'hidden', 'the sealed dialog did not lock the scroll');
    ok('N1', Math.abs(now.left - was.left) < 1 && Math.abs(now.width - was.width) < 1,
       'locking the scroll moved the page: content column ' + Math.round(was.width) +
       'px became ' + Math.round(now.width) + 'px');
    $('n1Good').close();
    /* the close event is queued, so read it after the task that dispatches it */
    setTimeout(function () {
      if (cs(document.body).overflow === 'hidden') {
        console.warn('rules check | N1 | the lock survived the dialog closing');
      }
    }, 0);
  })();

  /* N1's wrong half opts out of modal-check (data-modal-check="skip"), so this is the only
     thing that notices if it ever starts locking. */
  (function () {
    /* the sealed dialog above is released by an observer, which runs only after this
       synchronous script: its lock is still on here, so measure from no lock and put it back */
    var b = document.body.style.overflow, h = document.documentElement.style.overflow;
    document.body.style.overflow = ''; document.documentElement.style.overflow = '';
    $('n1BadOpen').click();
    ok('N1 (wrong sample)', $('n1Bad').open, 'the leaky dialog did not open');
    ok('N1 (wrong sample)', cs(document.body).overflow !== 'hidden' &&
       cs(document.documentElement).overflow !== 'hidden',
       'the leaky dialog now locks the scroll, so it shows nothing');
    $('n1Bad').close();
    document.body.style.overflow = b; document.documentElement.style.overflow = h;
  })();

  /* ---- X1: the wrong half's field has no label (it opts out of form-check) */
  (function () {
    var f = document.querySelector('[data-form-check="skip"] .fake-btn ~ input.field');
    ok('X1 (wrong sample)', !!f && !f.labels.length && !f.getAttribute('aria-label') &&
       !f.getAttribute('aria-labelledby'), 'the wrong field is gone or now has a label');
    ok('X1 (wrong sample)', !!f && f.parentElement.querySelector('.fake-btn').tabIndex < 0,
       'the fake button is now focusable, so it shows nothing');
  })();

  /* ---- N2: multi-select stays open, single-pick closes -------------------- */
  (function () {
    $('n2GoodBtn').click();
    var i = $('n2GoodPop').querySelector('input');
    i.checked = true; i.dispatchEvent(new Event('change', { bubbles: true }));
    ok('N2', !$('n2GoodPop').hidden, 'the multi-select panel closed on the first tick');
    ok('N2', /Renovation/.test($('n2GoodBtn').textContent),
       'the trigger caption did not follow the tick');
    document.body.click();

    $('n2BadBtn').click();
    var j = $('n2BadPop').querySelector('input');
    j.checked = true; j.dispatchEvent(new Event('change', { bubbles: true }));
    ok('N2 (wrong sample)', $('n2BadPop').hidden,
       'the wrong sample no longer closes on a tick, so it shows nothing');
  })();

  /* ---- F2: on blur, not on keystroke -------------------------------------- */
  (function () {
    var g = $('f2GoodEmail');
    g.value = 'a'; g.dispatchEvent(new Event('input'));
    ok('F2', $('f2GoodErr').hidden, 'the field complained while the user was still typing');
    g.dispatchEvent(new Event('blur'));
    ok('F2', !$('f2GoodErr').hidden, 'the field said nothing when the user left it');
    ok('F2', g.getAttribute('aria-invalid') === 'true',
       'the field is visibly invalid but not announced as invalid');
    g.value = 'a@b.co'; g.dispatchEvent(new Event('input'));
    ok('F2', $('f2GoodErr').hidden, 'the message survived the fix');
    g.value = '';

    var b = $('f2BadEmail');
    /* the wrong half opts out of form-check, which would report exactly this */
    ok('F2 (wrong sample)', b.type === 'text', 'the wrong field is no longer type="text"');
    b.value = 'a'; b.dispatchEvent(new Event('input'));
    ok('F2 (wrong sample)', !$('f2BadErr').hidden,
       'the wrong sample stopped complaining on keystroke, so it shows nothing');
    b.value = ''; b.dispatchEvent(new Event('input'));
  })();

  /* ---- F3: unsaved changes are not lost silently -------------------------- */
  (function () {
    $('f3GoodOpen').click();
    var t = $('f3GoodTxt');
    t.value = 'unsaved work'; t.dispatchEvent(new Event('input'));
    $('f3GoodClose').click();
    ok('F3', $('f3Good').open, 'the editor closed with unsaved changes and asked nothing');
    ok('F3', !$('f3Warn').hidden, 'no guard appeared for the unsaved changes');
    ok('F3', /\d/.test($('f3Warn').textContent), 'the guard does not name what is at stake');
    $('f3Discard').click();
  })();

  /* ---- F4: the field is the shape of its content -------------------------- */
  (function () {
    var g = $('f4Good'), b = $('f4Bad');
    var start = g.getBoundingClientRect().height;
    var was = g.value;
    g.value = was + ' ' + Array(12).join('one more line of the message ');
    g.dispatchEvent(new Event('input'));
    ok('F4', g.getBoundingClientRect().height > start,
       'the multi-line field did not grow with what was typed');
    ok('F4', g.getBoundingClientRect().height <= 133,
       'the field grew past its cap instead of scrolling inside itself');
    ok('F4', cs($('f4GoodPrev')).whiteSpace === 'pre-wrap',
       'the preview does not wrap, so it hides the message it is previewing');
    g.value = was; g.dispatchEvent(new Event('input'));
    /* the wrong sample must still be one line, or the pair proves nothing */
    /* an input cannot hold a line break, whatever its height - and on a phone every
       input is 44px tall for touch, so a height threshold fails the right page */
    ok('F4 (wrong sample)', b.tagName === 'INPUT', 'the wrong sample is no longer a one-line box');
  })();

  /* ---- F5: a digit-only field selects its value when it is entered -------- */
  (function () {
    var g = $('f5Good'), b = $('f5Bad');
    function typeIn(el, ch) {
      el.value = el.value.slice(0, el.selectionStart) + ch + el.value.slice(el.selectionEnd);
      el.dispatchEvent(new Event('input'));
    }
    /* Two things break this check rather than the rule, and both report as a failure
       of the field:
         - focusing an already-focused field fires nothing, so blur first;
         - a window that is not the focused window fires no focus event at all, however
           it moves activeElement. An unattended run is always in that state, so drive
           the handler directly there. What the rule is about is the handler. */
    function enter(el) {
      el.blur();
      el.focus();
      if (!document.hasFocus()) { el.dispatchEvent(new FocusEvent('focus')); }
    }
    g.value = '1200'; enter(g);
    ok('F5', g.selectionStart === 0 && g.selectionEnd === 4,
       'entering the field did not select the value');
    typeIn(g, '8');
    ok('F5', g.value === '8', 'one digit after entering gave ' + g.value + ', not 8');

    /* a second press inside the selection is the user saying "I do want to edit this" */
    g.value = '1200'; enter(g);
    g.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    g.setSelectionRange(2, 2);
    g.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    typeIn(g, '9');
    ok('F5', g.value === '12900',
       'a second tap inside the selection did not place a caret (' + g.value + ')');
    g.blur(); g.value = '1200'; g.dispatchEvent(new Event('input'));

    /* digits only - the restriction the rule turns on */
    g.value = '12a3'; g.dispatchEvent(new Event('input'));
    ok('F5', g.value === '123', 'a letter reached the value of a digit-only field');
    g.value = '1200'; g.dispatchEvent(new Event('input'));

    b.value = '1200'; enter(b); b.setSelectionRange(2, 2); typeIn(b, '8');
    ok('F5 (wrong sample)', b.value === '12800',
       'the wrong sample no longer misbehaves, so the pair shows nothing');
    b.value = '1200'; b.dispatchEvent(new Event('input'));
  })();

  /* ---- F6: an amount field does the sum ------------------------------------- */
  (function () {
    var g = $('f6Good'), b = $('f6Bad'), out = $('f6GoodOut');
    function commitWith(el, text) {
      el.value = text;
      el.dispatchEvent(new Event('input'));
      el.dispatchEvent(new Event('change'));
      return el.value;
    }
    ok('F6', commitWith(g, '1200+50') === '1250', '1200+50 did not become 1250 on commit');
    ok('F6', commitWith(g, '(2+3)*4') === '20', 'brackets and precedence: (2+3)*4 is not 20');
    ok('F6', commitWith(g, '2+3*4') === '14', 'precedence: 2+3*4 is not 14');
    /* the point belongs to the expression even in a whole-number field */
    ok('F6', commitWith(g, '2.5*4') === '10', '2.5*4 did not give 10 - was the point dropped?');
    ok('F6', commitWith(g, '0.1+0.2') === '0.1+0.2',
       '0.1+0.2 became ' + g.value + ' in a whole-number field instead of being refused');
    [['10/0', 'zero'], ['5+', 'operator'], ['(2+3', 'bracket'], ['10/3', 'whole'],
     ['50-80', 'below']].forEach(function (c) {
      var kept = commitWith(g, c[0]);
      ok('F6', kept === c[0], c[0] + ' was replaced by ' + kept + ' instead of kept');
      ok('F6', g.getAttribute('aria-invalid') === 'true', c[0] + ' is not marked invalid');
      ok('F6', out.textContent.indexOf(c[1]) >= 0,
         c[0] + ' does not say why: "' + out.textContent + '"');
    });
    /* nothing but the arithmetic reaches the value - the field never runs text as code */
    g.value = 'alert(1)'; g.dispatchEvent(new Event('input'));
    ok('F6', g.value === '(1)', 'letters reached an amount field: ' + g.value);
    /* while typing: a result when there is one, silence when there is not yet */
    g.value = '12*24'; g.dispatchEvent(new Event('input'));
    ok('F6', out.textContent === '= 288', 'no live result while typing 12*24');
    g.value = '12*'; g.dispatchEvent(new Event('input'));
    ok('F6', out.style.visibility === 'hidden', 'an unfinished expression is shown as something');
    /* an operator typed over the selected value extends it */
    commitWith(g, '1200');
    g.select();
    var ev = new InputEvent('beforeinput', { inputType: 'insertText', data: '+', cancelable: true });
    g.dispatchEvent(ev);
    ok('F6', ev.defaultPrevented && g.value === '1200+',
       'an operator typed over the selection replaced the value (' + g.value + ')');
    commitWith(g, '1200');
    /* identifiers are never evaluated */
    ok('F6', $('f6Phone').value === '+60 12-345 6789', 'the phone number was evaluated');
    ok('F6 (wrong sample)', commitWith(b, '1200+50') === '120050',
       'the wrong sample no longer drops the operator, so the pair shows nothing');
    commitWith(b, '1200');
  })();

  /* ---- F7: one anchored pattern per field ----------------------------------- */
  (function () {
    function verdict(id, text) {
      var el = $(id);
      el.value = text;
      el.dispatchEvent(new Event('input'));
      el.dispatchEvent(new Event('change'));
      return $(id + '-out').textContent;
    }
    var real = { name: "O'Brien", email: 'ana+quotes@shop.my', post: '50450',
                 phone: '012-345 6789' };
    var miss = { name: '   ', email: 'ana@shop', post: '504501', phone: '012' };
    Object.keys(real).forEach(function (k) {
      ok('F7', verdict('f7g-' + k, real[k]) === 'accepted', k + ' refused a real value: ' + real[k]);
      ok('F7', verdict('f7g-' + k, miss[k]).indexOf('refused - ') === 0,
         k + ' accepted a near miss: ' + miss[k]);
    });
    ok('F7', verdict('f7g-name', 'Nguy\u1ec5n') === 'accepted', 'a name with an accent was refused');
    ok('F7', verdict('f7g-post', 'ab12345') === 'refused - is five digits' ||
             $('f7g-post').value === '12345',
       'letters reached a digit-only postcode');
    /* the wrong column must still be wrong on every row, or the pair teaches nothing */
    ok('F7 (wrong sample)', verdict('f7b-name', "O'Brien") !== 'accepted', 'wrong name pattern now accepts');
    ok('F7 (wrong sample)', verdict('f7b-email', 'ana+quotes@shop.my') !== 'accepted', 'wrong email pattern now accepts');
    ok('F7 (wrong sample)', verdict('f7b-post', '123456') === 'accepted', 'wrong postcode pattern is now anchored');
    ok('F7 (wrong sample)', verdict('f7b-phone', '012-345 6789') !== 'accepted', 'wrong phone pattern now normalises');
    /* leave the page as it loads */
    verdict('f7g-name', "O'Brien"); verdict('f7g-email', 'ana+quotes@shop.my');
    verdict('f7g-post', '123456'); verdict('f7g-phone', '012-345 6789');
  })();

  /* ---- F8: typing is never interrupted (the full sweep is typing-check.js) -- */
  (function () {
    var set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    function type(el, ch) {
      set.call(el, el.value + ch);
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ch }));
    }
    /* measure after focusing: focus scrolls an off-screen field into view, and that
       scroll is not the typing's doing */
    var g = $('f8Good');
    g.focus();
    var top = g.getBoundingClientRect().top;
    type(g, 'b'); type(g, 'e');
    ok('F8', g.isConnected, 'the right sample replaced its own field while typing');
    ok('F8', Math.abs(g.getBoundingClientRect().top - top) <= 1, 'the right sample field moved while typing');
    ok('F8', /\d+ of \d+/.test($('f8GoodCount').textContent), 'the count did not follow the typing');
    set.call(g, ''); g.dispatchEvent(new Event('input', { bubbles: true })); g.blur();
    /* the wrong sample must still break, or the pair shows nothing */
    var b = $('f8Bad');
    type(b, 'b');
    ok('F8 (wrong sample)', !b.isConnected, 'the wrong sample no longer rebuilds its field');
    var b2 = $('f8Bad');
    set.call(b2, ''); b2.dispatchEvent(new InputEvent('input', { bubbles: true }));
  })();

  /* ---- B4: the halo is one cue, on state, and never moves the item -------------
     :hover cannot be set from script, so the demo mirrors it on a .force-hover class. */
  (function () {
    function box(el) { var r = el.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].join(); }
    var good = document.querySelectorAll('.act-good'), seen = {};
    ok('B4', good.length >= 3, 'the right-hand sample lost its clickable items');
    /* transitions off while measuring: a computed value read mid-transition is its first
       frame, so a halo that is on reads as none (the same trap as Appendix Z lesson 18) */
    Array.prototype.forEach.call(document.querySelectorAll('.act'), function (el) { el.style.transition = 'none'; });
    Array.prototype.forEach.call(good, function (el) {
      var rest = cs(el).boxShadow, was = box(el);
      ok('B4', rest === 'none', 'a halo is showing at rest - that is decoration, not a state cue');
      el.classList.add('force-hover');
      var sh = cs(el).boxShadow;
      ok('B4', /0px 0px 0px [1-9]\d*px/.test(sh), 'a clickable item shows no halo on hover (' + sh + ')');
      ok('B4', box(el) === was, 'the halo moved or resized the item');
      seen[sh] = 1;
      el.classList.remove('force-hover');
    });
    ok('B4', Object.keys(seen).length === 1, 'clickable items answer with different cues: ' + Object.keys(seen).join(' | '));
    /* The halo is also the focus indicator, so it has to be visible: 3:1 against the surface it
       sits on, in both themes. The first version used the pale accent tint and measured 1.14:1 -
       decoration, not a cue - and nothing had measured it. */
    (function () {
      function rgb(c) { var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c || ''); return m && [+m[1], +m[2], +m[3]]; }
      function lum(c) { var v = c.map(function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; }
      function ratio(a, b) { var l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
      function surfaceOf(e) { for (; e; e = e.parentElement) { var c = cs(e).backgroundColor; if (c && c !== 'rgba(0, 0, 0, 0)') { return rgb(c); } } return [255, 255, 255]; }
      var root = document.documentElement, was = root.getAttribute('data-theme'), el = good[0];
      ['light', 'dark'].forEach(function (t) {
        root.setAttribute('data-theme', t);
        el.classList.add('force-hover');
        var ring = rgb(cs(el).boxShadow), surf = surfaceOf(el.parentElement);
        el.classList.remove('force-hover');
        ok('B4', ring && ratio(ring, surf) >= 3,
           t + ': the halo is ' + (ring ? ratio(ring, surf).toFixed(2) : '?') + ':1 against its surface; it is also the focus indicator, so it needs 3:1');
      });
      if (was === null) { root.removeAttribute('data-theme'); } else { root.setAttribute('data-theme', was); }
    })();
    var quiet = document.querySelector('.act-quiet');
    quiet.classList.add('force-hover');
    ok('B4', cs(quiet).boxShadow === 'none', 'something that cannot act answered the pointer');
    quiet.classList.remove('force-hover');
    /* the wrong sample must still be wrong in each of its three ways */
    var b1 = document.querySelector('.act-bad1'), b2 = document.querySelector('.act-bad2'), b3 = document.querySelector('.act-bad3');
    [b1, b2].forEach(function (el, i) {
      var was = box(el); el.classList.add('force-hover');
      ok('B4 (wrong sample)', box(el) !== was, 'wrong sample ' + (i + 1) + ' no longer moves its item on hover');
      el.classList.remove('force-hover');
    });
    var before = cs(b3).boxShadow + cs(b3).transform + cs(b3).borderTopWidth;
    b3.classList.add('force-hover');
    ok('B4 (wrong sample)', cs(b3).boxShadow + cs(b3).transform + cs(b3).borderTopWidth === before,
       'wrong sample 3 now answers the pointer, so it no longer shows the silent case');
    b3.classList.remove('force-hover');
    Array.prototype.forEach.call(document.querySelectorAll('.act'), function (el) { el.style.transition = ''; });
  })();

  /* ---- C5: a mark's focus ring follows its outline, not its bounding box ------ */
  (function () {
    var good = $('ringGood'), bad = $('ringBad');
    good.classList.add('force-focus');          /* :focus-visible cannot be forced from script */
    ok('C5', cs(good).outlineStyle === 'none', 'the shape still has the browser outline: a bounding box');
    ok('C5', /drop-shadow/.test(cs(good).filter), 'the shape has no ring drawn from its own outline');
    ok('C5 (wrong sample)', cs(bad).outlineStyle === 'solid',
       'the wrong sample lost its box, so the pair shows nothing');
    var g = good.getBBox(), b = bad.getBBox();
    ok('C5', g.width > 0 && g.width === b.width, 'the two wedges are no longer the same shape');
    /* pressing selects a mark (.hot): it must be outlined along its edge, not just brightened */
    var wedge = document.querySelector('svg path.seg[data-id]'), had = wedge.classList.contains('hot');
    wedge.classList.add('hot');
    ok('C5', /drop-shadow/.test(cs(wedge).filter), 'a selected mark has no outline, only a brightness change: ' + cs(wedge).filter);
    ok('C5', cs(wedge).outlineStyle === 'none', 'a selected mark still carries the browser box outline');
    if (!had) { wedge.classList.remove('hot'); }
    /* the ring's contrast, as a figure, in BOTH themes. One colour is not enough: a ring that
       contrasts with the page can vanish against the mark beside it (1.2:1 on a black mark in
       the light theme, 1.5:1 on a mint wedge in the dark one). Outer ring vs the surface, and for
       every mark fill, the better of the two tones vs that fill, must reach 3:1. */
    function rgb(s) { var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(s || ''); return m && [+m[1], +m[2], +m[3]]; }
    function lum(c) { var v = c.map(function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; }
    function ratio(a, b) { var l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
    var root = document.documentElement, was2 = root.getAttribute('data-theme'), fills = {};
    Array.prototype.forEach.call(document.querySelectorAll('svg [data-id].seg, svg [data-id].bar'), function (e) {
      var f = cs(e).fill; if (f && f !== 'none') { fills[f] = 1; }
    });
    ['light', 'dark'].forEach(function (t) {
      root.setAttribute('data-theme', t);
      wedge.classList.add('hot');
      var cols = (cs(wedge).filter.match(/rgb\([^)]*\)/g) || []).map(rgb);
      wedge.classList.remove('hot');
      var inner = cols[0], outer = cols[cols.length - 1];
      var surf = rgb(cs(document.querySelector('.panel') || document.body).backgroundColor) || rgb(cs(document.body).backgroundColor);
      ok('C5', cols.length >= 8 && inner.join() !== outer.join(), t + ': the ring is not two-tone (' + cols.length + ' shadows)');
      ok('C5', ratio(outer, surf) >= 3, t + ': the outer ring is ' + ratio(outer, surf).toFixed(2) + ':1 against the surface');
      Object.keys(fills).forEach(function (f) {
        var c = rgb(f); if (!c) { return; }
        var best = Math.max(ratio(outer, c), ratio(inner, c));
        ok('C5', best >= 3, t + ': the ring is only ' + best.toFixed(2) + ':1 against a mark filled ' + f);
      });
    });
    if (was2 === null) { root.removeAttribute('data-theme'); } else { root.setAttribute('data-theme', was2); }
  })();

  /* ---- Y2: the contrast the rule states as a figure, in both themes ------------
     A rule that gives a figure gets measured against it. Y2 says 4.5:1; its right-hand sample
     once carried near-black text on a near-black plate in the dark theme and no check noticed. */
  (function () {
    function rgb(s) { var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(s || ''); return m && [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]]; }
    function lum(c) {
      var v = c.slice(0, 3).map(function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
      return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
    }
    function ratio(a, b) { var l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
    var root = document.documentElement, was = root.getAttribute('data-theme');
    var good = document.querySelector('.lbl-good'), bad = document.querySelector('.lbl-bad');
    var stops = (cs(document.querySelector('.overbg')).backgroundImage.match(/rgb\(\d+, \d+, \d+\)/g) || []).map(rgb);
    ok('Y2', !!good && !!bad && stops.length >= 3, 'the Y2 sample is missing its label or its gradient');
    ['light', 'dark'].forEach(function (t) {
      root.setAttribute('data-theme', t);
      var plate = rgb(cs(good).backgroundColor), text = rgb(cs(good).color);
      ok('Y2', plate && plate[3] === 1, t + ': the backing plate is translucent, so the contrast is still against whatever is behind it');
      ok('Y2', ratio(text, plate) >= 4.5, t + ': label on its plate is ' + ratio(text, plate).toFixed(2) + ':1, under the 4.5:1 the rule states');
      var worst = Math.min.apply(null, stops.map(function (s) { return ratio(rgb(cs(bad).color), s); }));
      ok('Y2 (wrong sample)', worst < 3, t + ': the wrong sample is readable everywhere (' + worst.toFixed(2) + ':1), so the pair shows nothing');
    });
    if (was === null) { root.removeAttribute('data-theme'); } else { root.setAttribute('data-theme', was); }
  })();

  /* ---- F1: the nudge is wired up, visible, and does not move the field -------- */
  (function () {
    function rgb(c) { var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c || ''); return m && [+m[1], +m[2], +m[3]]; }
    function lum(c) { var v = c.map(function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; }
    function ratio(a, b) { var l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
    function surfaceOf(e) { for (; e; e = e.parentElement) { var c = cs(e).backgroundColor; if (c && c !== 'rgba(0, 0, 0, 0)') { return rgb(c); } } return [255, 255, 255]; }
    var inp = $('r-site'), root = document.documentElement, was = root.getAttribute('data-theme');
    inp.value = '';
    var before = inp.getBoundingClientRect();
    ['light', 'dark'].forEach(function (t) {
      root.setAttribute('data-theme', t);
      inp.dispatchEvent(new Event('blur'));                       /* leaving it empty */
      var after = inp.getBoundingClientRect();
      var msg = $(inp.id + '-nudge');
      ok('F1', inp.getAttribute('aria-invalid') === 'true', t + ': the field is not marked invalid on the way out');
      ok('F1', msg && !msg.hidden && /needed/.test(msg.textContent), t + ': no message appeared beside the field');
      ok('F1', msg && inp.getAttribute('aria-describedby') === msg.id, t + ': the message is not tied to the field');
      ok('F1', msg && msg.previousElementSibling === inp, t + ': the message is not next to its field');
      ok('F1', Math.abs(after.width - before.width) < 0.5 && Math.abs(after.height - before.height) < 0.5,
         t + ': the field changed size when it was marked invalid (' + before.height + ' to ' + after.height + ')');
      var border = rgb(cs(inp).borderTopColor), surf = surfaceOf(inp.parentElement);
      ok('F1', border && ratio(border, surf) >= 3,
         t + ': the invalid border is ' + (border ? ratio(border, surf).toFixed(2) : '?') + ':1 against its surface; it needs 3:1');
    });
    /* it clears the moment the field is no longer empty, without waiting for another exit */
    inp.value = 'x'; inp.dispatchEvent(new Event('input'));
    ok('F1', !inp.hasAttribute('aria-invalid') && ($(inp.id + '-nudge') || { hidden: true }).hidden, 'the nudge stayed after the field was fixed');
    inp.value = ''; inp.removeAttribute('data-dirty');
    if (was === null) { root.removeAttribute('data-theme'); } else { root.setAttribute('data-theme', was); }
    /* the wrong half must still be wrong: no required marks, nothing nudges */
    ok('F1 (wrong sample)', !document.querySelector('#w-site[required]') && !$('w-site').closest('.demo').querySelector('[aria-invalid]'),
       'the wrong sample gained required marks or invalid state, so the pair shows nothing');
  })();

  /* ---- F9: Enter moves on, the last one submits, an irreversible form asks ----- */
  (function () {
    function enter(el, extra) {
      var ev = new KeyboardEvent('keydown', Object.assign({ key: 'Enter', code: 'Enter', bubbles: true, cancelable: true }, extra || {}));
      el.focus(); el.dispatchEvent(ev); return ev;
    }
    var a = $('f9g-site'), b = $('f9g-type'), c = $('f9g-note'), out = $('f9GoodOut');
    out.textContent = 'not submitted';
    var e1 = enter(a);
    ok('F9', document.activeElement === b && e1.defaultPrevented, 'Enter in the first field did not move to the second');
    enter(b);
    ok('F9', document.activeElement === c, 'Enter in the second field did not move to the third');
    ok('F9', out.textContent === 'not submitted', 'Enter submitted the form before the last field');
    /* the browser's own implicit submission is what the last Enter relies on: it must not be cancelled */
    var last = enter(c);
    ok('F9', !last.defaultPrevented, 'Enter in the last field was cancelled, so the form cannot submit from the keyboard');
    $('f9GoodForm').dispatchEvent(new Event('submit', { cancelable: true }));
    ok('F9', out.textContent === 'job created', 'the form does not submit');
    /* an IME composition owns Enter */
    var ime = enter(a, { isComposing: true });
    ok('F9', !ime.defaultPrevented && document.activeElement === a, 'Enter during an IME composition moved on');
    /* a form that cannot be undone: the last Enter lands on the button and deletes nothing */
    var name = $('f9s-name'), sout = $('f9SensOut'); sout.textContent = 'nothing deleted';
    name.value = 'Taman Sri Indah';
    var se = enter(name);
    ok('F9', document.activeElement === $('f9SensBtn') && se.defaultPrevented, 'Enter in the last field of a delete form did not land on the confirming button');
    ok('F9', sout.textContent === 'nothing deleted', 'Enter in the last field of a delete form deleted without a confirmation');
    name.value = '';
    /* the wrong half must still submit on the first Enter, or the pair shows nothing */
    var bo = $('f9BadOut'); bo.textContent = 'not submitted'; $('f9b-site').value = 'x';
    enter($('f9b-site'));
    ok('F9 (wrong sample)', /submitted with 1 of 3/.test(bo.textContent), 'the wrong sample no longer submits on the first Enter');
    $('f9b-site').value = ''; bo.textContent = 'not submitted'; document.activeElement.blur();
  })();

  /* ---- N2: a panel can be closed by every route ----------------------------------- */
  (function () {
    function tap(el) {
      ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(function (t) {
        var C = t.indexOf('pointer') === 0 ? PointerEvent : MouseEvent;
        el.dispatchEvent(new C(t, { bubbles: true, cancelable: true, view: window, pointerType: 'mouse', button: 0 }));
      });
    }
    function open() { return document.querySelector('.fpop[data-show="1"]'); }
    var btn = document.querySelector('#t1-filter .demo.right .ftrig') || document.querySelector('.demo.right .ftrig');
    if (!btn) { bad('N2', 'no filter trigger found to test'); return; }
    tap(btn);
    ok('N2', !!open() && btn.getAttribute('aria-expanded') === 'true', 'the trigger did not open its panel');
    tap(btn);
    ok('N2', !open() && btn.getAttribute('aria-expanded') === 'false',
       'tapping the trigger again did not close the panel - a trigger that only opens traps the user, and a phone has no Escape');
    tap(btn);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    ok('N2', !open(), 'Escape did not close the panel');
    ok('N2', document.activeElement === btn || !open(), 'closing with Escape did not return focus to the trigger');
    tap(btn); tap(document.body);
    ok('N2', !open(), 'a click outside did not close the panel');
    tap(btn);
    var done = open() && open().querySelector('.fdone');
    var minH = matchMedia('(hover: none), (pointer: coarse)').matches ? 44 : 24;      /* the rule's own figures */
    /* offsetHeight, not the client rect: the panel has just opened and is still scaling in from 0.985,
       so its rect reads a 44px button as 43.3 */
    ok('N2', !!done && done.offsetHeight >= minH && done.getClientRects().length > 0, 'the panel has no visible Done button of at least ' + minH + 'px');
    if (done) { tap(done); }
    ok('N2', !open(), 'the Done button did not close the panel');
    ok('N2', document.activeElement === btn, 'Done did not return focus to the trigger that opened the panel');
    /* the open panel never holds more than one at a time: a second trigger swaps, it does not stack */
    var all = document.querySelectorAll('.demo.right .ftrig');
    if (all.length > 1) { tap(all[0]); tap(all[1]); ok('N2', document.querySelectorAll('.fpop[data-show="1"]').length === 1, 'two filter panels are open at once'); tap(document.body); }
  })();

  /* ---- T1 on a chart: the chart's filter is the same panel as a column's ---------- */
  (function () {
    function tap(el) {
      ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(function (t) {
        var C = t.indexOf('pointer') === 0 ? PointerEvent : MouseEvent;
        el.dispatchEvent(new C(t, { bubbles: true, cancelable: true, view: window, pointerType: 'mouse', button: 0 }));
      });
    }
    function open() { return document.querySelector('.fpop[data-show="1"]'); }
    function bars(id) { return $(id).querySelectorAll('rect').length; }
    var sec = $('t1-chart-filter');
    if (!sec) { bad('T1', 'the chart filter pair (#t1-chart-filter) is missing'); return; }
    /* the wrong half must stay what agents build: more than six chips, no count, no panel, and
       still filtering, or the pair stops showing that the defect is the shape of the filter and
       not whether it works. Up to six chips with a count and a clear pass T1, so it has nine. */
    var wrong = sec.querySelector('.demo.wrong'), chips = wrong.querySelectorAll('#cfBadChips button[aria-pressed]');
    ok('T1 (wrong sample)', chips.length > 6 && !wrong.querySelector('[aria-haspopup]') &&
       !/\d+\s*(of|\/)\s*\d+/.test(wrong.querySelector('.cfbar').textContent),
       'the wrong half is no longer more than six chips with no count and no panel, so CHARTBOX would pass it');
    /* the real verdict, when the page is served from the repository root: table-check's CHARTBOX
       fails the wrong half (skip lifted for the run) and passes the panel and the six chips */
    var TC = null;
    try {
      var xr = new XMLHttpRequest();
      xr.open('GET', '../../skills/kz-uicheck/checks/table-check.js?t=' + Date.now(), false); xr.send();
      if (xr.status === 200 && /function tableCheck/.test(xr.responseText)) { TC = xr.responseText; }
    } catch (e) { TC = null; }
    if (TC) {
      wrong.removeAttribute('data-table-check');
      var tcr = (0, eval)(TC);
      wrong.setAttribute('data-table-check', 'skip');
      var cbx = (tcr && tcr.failures || []).filter(function (f) { return /^CHARTBOX/.test(f); });
      ok('T1 (wrong sample)', cbx.length === 1 && /September \(w/.test(cbx[0]) && /past six/.test(cbx[0]),
         'table-check CHARTBOX did not fail the nine chips (and only them): ' + cbx.join(' / '));
    }
    ok('T1 (wrong sample)', wrong.getAttribute('data-table-check') === 'skip',
       'the wrong half lost data-table-check="skip", so table-check would count the sample as a page defect');
    if (chips.length) {
      var b0 = bars('cfBad'); tap(chips[0]);
      ok('T1 (wrong sample)', bars('cfBad') === b0 - 1, 'a chip no longer filters the wrong chart');
      tap(wrong.querySelector('#cfBadChips button[aria-pressed="false"]'));
    }
    /* the right half: a trigger that opens the T1 panel, which filters the chart live */
    var trig = $('cfTrig'), all = bars('cfGood');
    ok('T1', trig && trig.getAttribute('aria-haspopup') && /6 of 6/.test(trig.textContent),
       'the chart filter trigger does not declare its panel or does not say "6 of 6"');
    tap(trig);
    var pop = open();
    ok('T1', !!pop && trig.getAttribute('aria-expanded') === 'true', 'the chart filter trigger did not open the panel');
    if (!pop) { return; }
    ok('T1', pop.querySelectorAll('.sortbtn').length === 2 && !!pop.querySelector('.fq') &&
       !!pop.querySelector('.selall') && !!pop.querySelector('.selnone') && !!pop.querySelector('.fdone'),
       'the chart panel is missing sort, value search, Select all, Clear selection or Done');
    var vals = pop.querySelectorAll('.vals label');
    ok('T1', vals.length === all && Array.prototype.every.call(vals, function (l) { return /^\d+$/.test(l.querySelector('.c').textContent); }),
       'the chart panel does not list every site with a count');
    ok('T1', pop.querySelector('.n').textContent === all + ' of ' + all, 'the chart panel count does not read "n of m"');
    var cb = pop.querySelector('.vals input:checked');
    tap(cb);
    ok('T1', bars('cfGood') === all - 1, 'unticking a site did not redraw the chart without it (live apply)');
    ok('T1', !!open(), 'unticking a site closed the panel: the next tick is the likely next action');
    ok('T1', /5 of 6/.test(trig.textContent) && /5 of 6/.test(open().querySelector('.n').textContent),
       'the trigger and the panel count did not follow the tick');
    tap(open().querySelector('.selnone'));
    ok('T1', bars('cfGood') === 0 && /0 of 6/.test(trig.textContent), 'Clear selection did not empty the chart');
    tap(open().querySelector('.selall'));
    ok('T1', bars('cfGood') === all && /6 of 6/.test(trig.textContent), 'Select all did not bring every site back');
    tap(open().querySelector('.fdone'));
    ok('T1', !open() && document.activeElement === trig, 'Done did not close the chart panel and return focus');
    /* also right, up to six values: chips that show their state, a live "n of m", All and Clear */
    var cset = sec.querySelectorAll('#cfChipSet button[aria-pressed]'), cnt = $('cfChipCount'), six = bars('cfChips');
    ok('T1', cset.length >= 2 && cset.length <= 6 && six === cset.length && cnt.textContent === six + ' of ' + six &&
       !!$('cfChipAll') && !!$('cfChipClear') && !sec.querySelector('#cfChipsDemo').closest('[data-table-check]'),
       'the six-chip sample lost its count, its All or Clear, went past six, or is skipped from table-check');
    tap(cset[0]);
    ok('T1', bars('cfChips') === six - 1 && cnt.textContent === (six - 1) + ' of ' + six &&
       sec.querySelector('#cfChipSet button[aria-pressed="false"]'), 'a chip did not filter the chart, update the count and show its off state');
    tap($('cfChipClear'));
    ok('T1', bars('cfChips') === 0 && cnt.textContent === '0 of ' + six, 'Clear did not empty the chips chart');
    tap($('cfChipAll'));
    ok('T1', bars('cfChips') === six && cnt.textContent === six + ' of ' + six, 'All did not bring every site back');
  })();

  /* ---- N2 sample: the wrong half is a trap, the right half has four ways out ---- */
  (function () {
    function tap(el) {
      ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(function (t) {
        var C = t.indexOf('pointer') === 0 ? PointerEvent : MouseEvent;
        el.dispatchEvent(new C(t, { bubbles: true, cancelable: true, view: window, pointerType: 'mouse', button: 0 }));
      });
    }
    var bb = $('n2cBadBtn'), bp = $('n2cBadPop'), gb = $('n2cGoodBtn'), gp = $('n2cGoodPop');
    tap(bb); tap(bb);
    ok('N2 (wrong sample)', !bp.hidden, 'the wrong sample closes on a second tap, so it no longer shows the trap');
    tap(document.body);
    tap(gb); ok('N2', !gp.hidden && gb.getAttribute('aria-expanded') === 'true', 'the right sample did not open');
    tap(gb); ok('N2', gp.hidden, 'tapping the trigger again did not close the right sample');
    tap(gb); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    ok('N2', gp.hidden && document.activeElement === gb, 'Escape did not close it and return focus to the trigger');
    tap(gb); tap(document.body); ok('N2', gp.hidden, 'a tap on empty page did not close it');
    tap(gb); tap($('n2cGoodDone')); ok('N2', gp.hidden && document.activeElement === gb, 'Done did not close it and return focus');
    tap(gb); var tick = gp.querySelector('input'); tap(tick);
    ok('N2', !gp.hidden, 'ticking a value closed the panel: the next tick is the likely next action');
    tap(document.body);
  })();

  /* ---- L3: the two comparisons the rule states ---------------------------- */
  (function () {
    var good = document.querySelector('.rhythm-good');
    if (!good) { bad('L3', 'the rhythm sample is missing'); return; }
    var h = good.querySelectorAll('h3')[1];
    var inside = px(cs(h.previousElementSibling).marginBottom);
    var above = px(cs(h).marginTop), below = px(cs(h).marginBottom);
    ok('L3', above > below, 'the space above the heading is not larger than below it');
    ok('L3', below > inside || inside < above,
       'the gap between groups is not larger than the gap inside one');
  })();

  /* ---- L4: a shadow has an offset ---------------------------------------- */
  (function () {
    var good = document.querySelector('.e2'), bad2 = document.querySelector('.bad-lift');
    ok('L4', /0px [1-9]/.test(cs(good).boxShadow), 'the right-hand shadow has no vertical offset');
    ok('L4 (wrong sample)', /0px 0px/.test(cs(bad2).boxShadow),
       'the wrong sample gained an offset, so it no longer shows a halo');
  })();

  /* ---- L6: bounded beside a neighbour ------------------------------------- */
  (function () {
    var b = $('l6GoodLog'), u = $('l6BadLog');
    var bh = b.getBoundingClientRect().height, uh = u.getBoundingClientRect().height;
    ok('L6', bh < uh, 'the bounded list is not shorter than the unbounded one');
    ok('L6', b.scrollHeight > b.clientHeight + 1, 'the bounded list has nothing to scroll');
    ok('L6', $('l6Expand').getAttribute('aria-expanded') === 'false',
       'the expand control does not report its state');
  })();

  /* ---- L11: a sequence wraps only while all of it stays in view ----------- */
  (function () {
    var good = $('l11Good'), wrong = $('l11Bad'), fits = $('l11Fits');
    /* the tests layout-audit.js runs for WRAPPED SEQUENCE: a second row is a child that starts at or
       below another's bottom; the area is the nearest ancestor that scrolls or clips vertically */
    function wraps(el) {
      var b = Array.prototype.map.call(el.children, function (k) { return k.getBoundingClientRect(); });
      return b.some(function (a, i) { return b.some(function (c, j) { return i !== j && a.top >= c.bottom - 1; }); });
    }
    function room(el) {
      for (var p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        if (/^(auto|scroll|hidden|clip)$/.test(cs(p).overflowY)) { return p.clientHeight; }
      }
      return window.innerHeight;
    }
    ok('L11', !wraps(good), 'the right sample wraps onto a second row');
    ok('L11', /^(auto|scroll)$/.test(cs(good).overflowX), 'the right sample cannot scroll sideways');
    ok('L11', good.scrollWidth > good.clientWidth + 1, 'the right sample has nothing to scroll');
    ok('L11', good.getAttribute('data-orientation') === 'horizontal',
       'the right sample is not marked, so layout-audit.js cannot find it');
    var now = good.querySelector('[aria-current]'), g = good.getBoundingClientRect(), c = now && now.getBoundingClientRect();
    ok('L11', c && c.left >= g.left - 1 && c.right <= g.right + 1,
       'the right sample does not open with its current item in view: the newest work is off to the side');
    var start = good.scrollLeft;
    good.scrollLeft = 0;
    var wheel = new WheelEvent('wheel', { deltaY: 60, bubbles: true, cancelable: true });
    good.dispatchEvent(wheel);
    ok('L11', good.scrollLeft > 0 && wheel.defaultPrevented, 'the wheel did not move the right sample sideways');
    good.scrollLeft = start;
    ok('L11 (wrong sample)', wraps(wrong) && wrong.getBoundingClientRect().height > room(wrong) + 1,
       'the wrong sample no longer wraps out of its panel, so it no longer shows the defect');
    ok('L11 (wrong sample)', wrong.getAttribute('data-orientation') === 'horizontal',
       'the wrong sample is not marked, so layout-audit.js would no longer fail it');
    ok('L11 (fits)', wraps(fits) && fits.getBoundingClientRect().height <= room(fits) + 1 &&
       fits.getAttribute('data-orientation') === 'horizontal' && fits.getAttribute('data-sequence') !== 'line',
       'the short grid no longer shows the allowed case: a marked sequence that wraps and still fits');
  })();

  /* ---- Y1: tabular figures where numbers stack ---------------------------- */
  (function () {
    var tab = document.querySelector('.numdemo.tab td');
    ok('Y1', /tabular-nums/.test(cs(tab).fontVariantNumeric),
       'the numeric column is not using tabular figures');
  })();

  /* ---- P1: the reserved box does not move what is below it ---------------- */
  (function () {
    var host = $('p1GoodHost');
    var note = host.nextElementSibling;
    var before = note.getBoundingClientRect().top;
    host.innerHTML = '<div class="loaded">Panel content</div>';
    var after = note.getBoundingClientRect().top;
    ok('P1', Math.abs(after - before) <= 1,
       'the reserved panel still shifted what follows it by ' + Math.round(after - before) + 'px');
    host.innerHTML = '<div class="skel"></div>';
  })();

  /* ---- P2: the defect is shown, and contained ----------------------------- */
  (function () {
    var wrong = document.querySelector('.bad-shrink');
    if (!wrong) { bad('P2', 'the shrink sample is missing'); return; }
    var row = wrong.closest('.rowx');
    var btn = row.querySelector('.btn');
    ok('P2 (wrong sample)', btn.getBoundingClientRect().right > row.getBoundingClientRect().right + 1,
       'the wrong sample no longer pushes its button out of the row');
    var demo = row.closest('.demo');
    ok('P2', demo.scrollWidth <= demo.clientWidth + 1,
       'the deliberate overflow escaped its sample and became a real page defect');
  })();

  /* ---- X2: each name states its own values -------------------------------- */
  (function () {
    var names = Array.prototype.map.call(document.querySelectorAll('#x2List [aria-label]'),
      function (b) { return b.getAttribute('aria-label'); });
    ok('X2', names.length > 1, 'the accessible bar list is missing');
    ok('X2', new Set(names).size === names.length,
       'two bars share an accessible name: ' + names.join(' / '));
    names.forEach(function (n) {
      ok('X2', /RM/.test(n), 'a name states a figure with no unit: "' + n + '"');
    });
    Array.prototype.forEach.call(document.querySelectorAll('#x2List button'), function (b) {
      var r = b.getBoundingClientRect();
      ok('X2', r.height >= 44, 'the bar target is ' + Math.round(r.height) + 'px tall, floor 44');
    });
  })();

  /* ---- structure: a wrong/right pair holds both halves ---------------------
     A scripted edit once swallowed a closing tag, so the right-hand demo ended up
     nested inside the wrong one: the pair had one child, the boxes stacked, and every
     other check stayed green because nothing was overflowing, clipped or mis-marked.
     Nesting is invisible to the eye and to the audit; it is visible to a count. */
  (function () {
    Array.prototype.forEach.call(document.querySelectorAll('section'), function (sec) {
      var pair = sec.querySelector('.pair');
      if (!pair) { return; }
      /* a section may add a further example in a pair of its own; every demo still sits in a pair */
      var held = Array.prototype.reduce.call(sec.querySelectorAll('.pair'), function (n, p) { return n + p.children.length; }, 0);
      var demos = sec.querySelectorAll('.demo').length;
      var name = (sec.querySelector('h2') || {}).textContent || 'a section';
      ok('structure', held === demos,
         name.slice(0, 34) + ': ' + demos + ' demos but the pairs hold ' +
         held + ' - one is nested inside another');
      ok('structure', pair.children.length >= 2,
         name.slice(0, 34) + ': a wrong/right pair with ' + pair.children.length + ' half');
    });
    /* and the wrapper that caused it: a scroller with no table is a stray container */
    Array.prototype.forEach.call(document.querySelectorAll('.tablescroll'), function (w) {
      ok('structure', !!w.querySelector('table'), 'a .tablescroll wraps no table');
      ok('structure', !w.querySelector('.demo'),
         'a .tablescroll swallowed a demo - its closing tag is missing');
    });
  })();

  /* ---- N5: the nav, swept - every destination, not the two you happened to try ---- */
  (function () {
    var links = Array.prototype.slice.call(document.querySelectorAll('.jump a'));
    ok('N5', links.length > 0, 'the section nav is missing');

    var targets = [];
    links.forEach(function (a) {
      var href = a.getAttribute('href');
      var el = document.querySelector(href);
      ok('N5', !!el, 'the nav points at ' + href + ', which does not exist');
      if (el) { targets.push({ href: href, el: el }); }
    });

    /* A destination that another destination starts on top of can never be marked: the
       later one is already past the decision line while the earlier one's own content is
       still being read. Containment is not the test - a group heading is a sibling of its
       sections, not their parent - the test is the distance between consecutive
       destinations against the line the nav decides on. */
    var nav0 = document.querySelector('.jump');
    var nb = nav0.getBoundingClientRect();
    var navTop = nb.width > nb.height ? nb.height : 0;
    var fold = navTop + (window.innerHeight - navTop) * 0.33;
    var byDoc = targets.slice().sort(function (a, b2) { return a.el.offsetTop - b2.el.offsetTop; });
    byDoc.forEach(function (t, i) {
      var next = byDoc[i + 1];
      if (!next) { return; }
      var gap = next.el.offsetTop - t.el.offsetTop;
      if (gap < fold) {
        bad('N5', t.href + ' is only ' + Math.round(gap) + 'px before ' + next.href +
            ', which is inside the ' + Math.round(fold) + 'px decision line, so ' +
            t.href + ' can never be the current section');
      }
    });
    targets.forEach(function (t, i) {
      if (byDoc[i] !== t) {
        bad('N5', 'the nav lists ' + t.href + ' where the page has ' + byDoc[i].href +
            ': nav order and document order disagree');
      }
    });

    /* The mark is painted asynchronously - a frame, or a timer when there is no frame -
       so a sweep cannot read it in the same tick that moves the page. The structural
       checks above are synchronous; the sweep runs after, and reports to the console,
       because that is the honest shape of a check for something that settles later. */
    var keep = window.scrollY;
    var missed = [];
    var i = 0;
    (function step() {
      if (i >= targets.length) {
        window.scrollTo(0, keep);
        if (missed.length) {
          console.warn('rules check | N5 | the mark disagrees with the section on screen: ' +
                       missed.join(', '));
        } else {
          console.log('%crules check | N5 | nav swept: ' + targets.length +
                      ' destinations, each one marks itself', 'color:#1f7a4d');
        }
        return;
      }
      var t = targets[i++];
      document.documentElement.scrollTop = t.el.offsetTop;
      window.dispatchEvent(new Event('scroll'));  /* a set scrollTop does not always emit one */
      setTimeout(function () {
        var marked = document.querySelector('.jump [aria-current]');
        if (!marked || marked.getAttribute('href') !== t.href) {
          missed.push(t.href + ' marked ' + (marked ? marked.getAttribute('href') : 'nothing'));
        }
        step();
      }, 180);
    })();

    /* the mark is the item's own, not a separate element that has to be kept in step */
    var cur = document.querySelector('.jump [aria-current]');
    if (cur) {
      var r = cur.getBoundingClientRect(), n = cur.closest('.jump').getBoundingClientRect();
      ok('N5', r.top >= n.top - 1 && r.bottom <= n.bottom + 1,
         'the marked entry is outside its own nav box');
    }
  })();

  /* ---- M2-M6: section M, each right sample passes and each wrong one still fails --- */
  (function () {
    function moving(el) { return el.getAnimations({ subtree: true }).length; }
    function key(id) { $(id).dispatchEvent(new KeyboardEvent('keydown', { key: 'k', bubbles: true })); }
    /* M2: opened from the keyboard, the right palette has nothing running on the next frame */
    key('m2Good');
    ok('M2', $('m2GoodPal').getAttribute('data-open') === '1', 'K did not open the right palette');
    ok('M2', moving($('m2GoodPal')) === 0, 'the keyboard-opened palette is animating (' + moving($('m2GoodPal')) + ')');
    key('m2Good');
    key('m2Bad');
    ok('M2 (wrong sample)', moving($('m2BadPal')) > 0, 'the wrong palette no longer animates, so it shows nothing');
    key('m2Bad');

    /* M3: start scale and origin, read from the closed state */
    function scaleOf(el) { var m = /matrix\(([-\d.e]+)/.exec(cs(el).transform); return m ? Math.abs(+m[1]) : 1; }
    var good = $('m3GoodPop'), badp = $('m3BadPop');
    ok('M3', scaleOf(good) >= 0.9 && scaleOf(good) < 1, 'the right menu starts at scale ' + scaleOf(good).toFixed(2) + ', not 0.9-0.97');
    ok('M3', /^0px 0px/.test(cs(good).transformOrigin), 'the right menu does not grow from its top left: ' + cs(good).transformOrigin);
    ok('M3 (wrong sample)', scaleOf(badp) < 0.05, 'the wrong menu no longer starts at scale(0)');
    /* the right menu opens on the button that opened it: left edges aligned, top just under it. The
       origin is the top left, so the closed menu's box already sits where the open one will. */
    var gb = $('m3GoodBtn').getBoundingClientRect(), gp = good.getBoundingClientRect();
    ok('M3', Math.abs(gp.left - gb.left) <= 2 && gp.top >= gb.bottom - 1 && gp.top - gb.bottom <= 12,
       'the right menu does not open on its button: ' + Math.round(gp.left - gb.left) + 'px across, ' + Math.round(gp.top - gb.bottom) + 'px below it');

    /* M4: the property list and the curve */
    var g = cs($('m4Good')), b = cs($('m4Bad'));
    ok('M4', !/\ball\b/.test(g.transitionProperty), 'the right card transitions all');
    ok('M4', !/ease-in\b/.test(g.transitionTimingFunction), 'the right card is timed ease-in');
    ok('M4 (wrong sample)', /\ball\b/.test(b.transitionProperty) && /ease-in/.test(b.transitionTimingFunction),
       'the wrong card is no longer all + ease-in');

    /* M5: an :active rule that reaches the button and changes something */
    function pressed(el) {
      var hit = false;
      Array.prototype.forEach.call(document.styleSheets, function (sh) {
        var rules; try { rules = sh.cssRules; } catch (e) { return; }
        (function walk(rs) {
          Array.prototype.forEach.call(rs, function (r) {
            if (r.cssRules) { walk(r.cssRules); }
            if (!r.selectorText || !/:active/.test(r.selectorText)) { return; }
            r.selectorText.split(',').forEach(function (sel) {
              if (!/:active/.test(sel)) { return; }
              try { if (el.matches(sel.replace(/:active/g, '')) && /transform|box-shadow|background/.test(r.style.cssText)) { hit = true; } } catch (e) {}
            });
          });
        })(rules);
      });
      return hit;
    }
    ok('M5', pressed($('m5Good')), 'the right button has no :active rule that changes it');
    ok('M5 (wrong sample)', !pressed($('m5Bad')), 'the wrong button gained a press state');

    /* M6: hover one, wait past the delay, move to the next: the right bar shows it at once */
    function over(el) { el.dispatchEvent(new PointerEvent('pointerover', { bubbles: true })); }
    function out(el) { el.dispatchEvent(new PointerEvent('pointerout', { bubbles: true })); }
    ['m6Good', 'm6Bad'].forEach(function (id) {
      var btns = $(id).querySelectorAll('[data-mtip]');
      over(btns[0]);
      setTimeout(function () {
        out(btns[0]); over(btns[1]);
        setTimeout(function () {
          var shown = $(id + 'Tip').getAttribute('data-show') === '1';
          out(btns[1]);
          if (id === 'm6Good' ? !shown : shown) {
            console.warn('rules check | ' + (id === 'm6Good' ? 'M6 | the next tooltip waited the full delay'
                                                             : 'M6 (wrong sample) | the wrong bar opened the next tooltip at once'));
          } else {
            console.log('%crules check | ' + (id === 'm6Good' ? 'M6' : 'M6 (wrong sample)') + ' | asserted', 'color:#1f7a4d');
          }
        }, 60);
      }, 450);
    });
  })();

  /* ---- G1-G10: section G, each wrong diagram still shows its defect and each right one does not ----
     Measured as drawn: every line is sampled along its length with getPointAtLength and mapped to
     the screen with getScreenCTM, boxes and plates are read with getBoundingClientRect, and
     distances are turned back into viewBox units, so the figures hold at any width. */
  (function () {
    if (!$('g3Good')) { bad('G', 'section G is missing'); return; }
    function unit(svg) { var w = svg.viewBox.baseVal.width; return w ? svg.getBoundingClientRect().width / w : 1; }
    function line(el) {
      var m = el.getScreenCTM(), len = el.getTotalLength(), arr = [];
      for (var d = 0; d <= len; d += 1) { var q = el.getPointAtLength(d); arr.push(new DOMPoint(q.x, q.y).matrixTransform(m)); }
      return arr;
    }
    function lines(svg) { return Array.prototype.map.call(svg.querySelectorAll('path.ln'), line); }
    function rects(svg, sel) { return Array.prototype.slice.call(svg.querySelectorAll(sel)); }
    function within(p, r, pad) { return p.x > r.left + pad && p.x < r.right - pad && p.y > r.top + pad && p.y < r.bottom - pad; }
    function overlap(a, b) {
      return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
             Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    }
    function contains(o, i) { return i.left >= o.left - 0.5 && i.right <= o.right + 0.5 && i.top >= o.top - 0.5 && i.bottom <= o.bottom + 0.5; }
    /* the longest straight slanted run in a line, in viewBox units */
    function slant(P, k) {
      var run = 0, worst = 0, start = null;
      for (var i = 4; i < P.length; i++) {
        var dx = P[i].x - P[i - 4].x, dy = P[i].y - P[i - 4].y, diag = Math.abs(dx) > 0.6 * k && Math.abs(dy) > 0.6 * k, dir = Math.atan2(dy, dx);
        if (diag && start !== null && Math.abs(dir - start) < 0.03) { run++; } else { run = 0; start = diag ? dir : null; }
        worst = Math.max(worst, run);
      }
      return worst / k;
    }
    /* the most stroke any two lines share, in viewBox units */
    function stacked(L, k) {
      var most = 0;
      for (var i = 0; i < L.length; i++) {
        for (var j = i + 1; j < L.length; j++) {
          var n = L[i].filter(function (a) { return L[j].some(function (b) { return Math.abs(a.x - b.x) < 1.5 && Math.abs(a.y - b.y) < 1.5; }); }).length;
          most = Math.max(most, n / k);
        }
      }
      return most;
    }
    /* how far, in viewBox units, a line runs inside a box that is neither of its ends */
    function behind(svg) {
      var k = unit(svg), boxes = rects(svg, 'rect.box').map(function (b) { return b.getBoundingClientRect(); }), most = 0;
      lines(svg).forEach(function (P) {
        function end(p) { return boxes.filter(function (r) { return p.x >= r.left - 12 && p.x <= r.right + 12 && p.y >= r.top - 12 && p.y <= r.bottom + 12; })[0]; }
        var a = end(P[0]), z = end(P[P.length - 1]);
        boxes.forEach(function (r) {
          if (r === a || r === z) { return; }
          most = Math.max(most, P.filter(function (p) { return within(p, r, 3 * k); }).length / k);
        });
      });
      return most;
    }
    /* each plate: does it cover a line, how far is it from the nearest line, is it under a later box */
    function plates(svg) {
      var k = unit(svg), L = lines(svg), all = Array.prototype.slice.call(svg.querySelectorAll('*'));
      return rects(svg, 'rect.plate').map(function (pl) {
        var r = pl.getBoundingClientRect(), covers = false, gap = Infinity;
        L.forEach(function (P) {
          if (P.filter(function (p) { return within(p, r, 0); }).length > 6) { covers = true; }
          P.forEach(function (p) { gap = Math.min(gap, Math.max(r.left - p.x, p.x - r.right, r.top - p.y, p.y - r.bottom) / k); });
        });
        var under = rects(svg, 'rect.box').some(function (b) {
          var br = b.getBoundingClientRect();
          return all.indexOf(b) > all.indexOf(pl) && overlap(br, r) > 0 && !contains(br, r);
        });
        return { name: (pl.nextElementSibling || {}).textContent, covers: covers, gap: gap, under: under };
      });
    }
    function legend(svg) {
      var key = svg.querySelector('g.legend').getBoundingClientRect(), boxes = rects(svg, 'rect.box').map(function (b) { return b.getBoundingClientRect(); });
      return {
        hits: boxes.some(function (b) { return overlap(b, key) > 0; }),
        above: key.top < Math.max.apply(null, boxes.map(function (b) { return b.bottom; })) - 2
      };
    }
    function scroller(svg) {
      for (var p = svg.parentElement; p && !p.classList.contains('demo'); p = p.parentElement) {
        if (/(auto|scroll)/.test(cs(p).overflowX)) { return p; }
      }
      return null;
    }

    /* G3 / G4 */
    var b3 = $('g3Bad'), g3 = $('g3Good');
    ok('G3 (wrong sample)', lines(b3).some(function (P) { return slant(P, unit(b3)) > 16; }), 'g3Bad no longer has a straight slanted run');
    ok('G4 (wrong sample)', stacked(lines(b3), unit(b3)) >= 12, 'g3Bad no longer has two lines drawn on top of each other');
    ok('G3', !lines(g3).some(function (P) { return slant(P, unit(g3)) > 16; }), 'g3Good has a straight slanted run');
    ok('G4', stacked(lines(g3), unit(g3)) < 12, 'g3Good has two lines sharing ' + Math.round(stacked(lines(g3), unit(g3))) + 'px of stroke');

    /* G5 */
    ok('G5 (wrong sample)', behind($('g5Bad')) > 4, 'g5Bad no longer runs a line behind a box that is not its end');
    ok('G5', behind($('g5Good')) <= 4, 'g5Good runs ' + Math.round(behind($('g5Good'))) + 'px of a line behind a box that is not its end');

    /* G6 */
    var p6b = plates($('g6Bad')), p6g = plates($('g6Good'));
    ok('G6 (wrong sample)', p6b.some(function (p) { return p.covers; }), 'no plate in g6Bad covers its line any more');
    ok('G6 (wrong sample)', p6b.some(function (p) { return p.under; }), 'no plate in g6Bad is under a box drawn after it any more');
    p6g.forEach(function (p) {
      ok('G6', !p.covers, 'g6Good: plate ' + p.name + ' covers its line');
      ok('G6', !p.under, 'g6Good: plate ' + p.name + ' is partly under a box drawn after it');
      ok('G6', p.covers || p.gap >= 4, 'g6Good: plate ' + p.name + ' is ' + p.gap.toFixed(1) + 'px from a line (4 or more)');
    });

    /* G7 */
    var k7b = legend($('g7Bad')), k7g = legend($('g7Good'));
    ok('G7 (wrong sample)', k7b.hits || k7b.above, 'the g7Bad key now sits clear below the drawing');
    ok('G7', !k7g.hits && !k7g.above, 'the g7Good key ' + (k7g.hits ? 'overlaps a box' : 'sits above the lowest box'));

    /* G8 */
    var b8 = $('g8Bad'), g8 = $('g8Good'), w8 = g8.viewBox.baseVal.width;
    ok('G8 (wrong sample)', px(cs(b8).minWidth) < b8.viewBox.baseVal.width && !scroller(b8),
       'g8Bad gained a min-width or a sideways scroller, so it no longer shrinks');
    ok('G8', px(cs(g8).minWidth) === w8, 'g8Good min-width is ' + cs(g8).minWidth + ', its viewBox is ' + w8 + ' wide');
    ok('G8', !!g8.parentElement && cs(g8.parentElement).overflowX === 'auto', 'g8Good is not inside an overflow-x:auto parent');
    /* G8: a right diagram that scrolls says so - an edge shadow, and the cue line while (and only while)
       it overflows. g8Good is wider than its card at every width, so this always runs at least once. */
    var overflowed = 0;
    ['g2Good', 'g3Good', 'g5Good', 'g6Good', 'g7Good', 'g8Good'].forEach(function (id) {
      var sc = scroller($(id)), cue = sc && sc.nextElementSibling, over = !!sc && sc.scrollWidth > sc.clientWidth + 1;
      if (!sc) { bad('G8', id + ' has no sideways scroller'); return; }
      var shown = !!cue && cue.getAttribute('data-diagram') === 'cue' && cue.getBoundingClientRect().height > 0;
      if (over) {
        overflowed++;
        ok('G8', shown, id + ' overflows its card (' + sc.scrollWidth + ' in ' + sc.clientWidth + 'px) and shows no cue line under it');
        ok('G8', /gradient\(/.test(cs(sc).backgroundImage), id + ' overflows its card with no edge shadow on its scroller');
      } else {
        ok('G8', !shown, id + ' fits its card but still says to scroll sideways');
      }
    });
    ok('G8', overflowed > 0, 'no right diagram overflows its card, so the scroll cue was never exercised');

    /* G2 / G10 */
    var nb = $('g2Bad').querySelectorAll('rect.box').length, ab = $('g2Bad').querySelectorAll('rect.box.acc').length;
    var ng = $('g2Good').querySelectorAll('rect.box').length, ag = $('g2Good').querySelectorAll('rect.box.acc').length;
    ok('G2 (wrong sample)', nb > 9, 'g2Bad is down to ' + nb + ' boxes');
    ok('G10 (wrong sample)', ab > 2, 'g2Bad is down to ' + ab + ' accent boxes');
    ok('G2', ng <= 9, 'g2Good holds ' + ng + ' boxes');
    ok('G10', ag === 1, 'g2Good has ' + ag + ' accent boxes, not one');

    /* G9: every right sample is a named figure */
    ['g3Good', 'g5Good', 'g6Good', 'g7Good', 'g8Good', 'g2Good'].forEach(function (id) {
      var svg = $(id), ids = (svg.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
      var nodes = ids.map(function (x) { return document.getElementById(x); });
      var filled = nodes.length > 0 && nodes.every(function (n) { return n && n.textContent.trim(); });
      var title = nodes.some(function (n) { return n && n.tagName.toLowerCase() === 'title'; });
      var desc = nodes.some(function (n) { return n && n.tagName.toLowerCase() === 'desc'; });
      ok('G9', svg.getAttribute('role') === 'img' && filled && title && desc,
         id + ' is not a named figure: needs role="img" and aria-labelledby naming a filled <title> and <desc>');
    });
  })();

  if (!problems.length) {
    console.log('%crules check: clean', 'color:#1f7a4d;font-weight:700');
  } else {
    console.warn('rules check: ' + problems.length + ' problem(s)');
    problems.forEach(function (p) { console.log('  ' + p); });
  }
  return problems.length ? problems : ['clean'];
}());
