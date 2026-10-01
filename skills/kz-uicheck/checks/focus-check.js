/* focus-check.js - paste into the browser console on any page (rules A1 keyboard, Y2 contrast of the ring).

   Focuses every control on the page and reads what changed, so a keyboard user can always see where they are.

     NOFOCUS    focusing it changed nothing visible: no outline, no shadow, no border or background change.
                (outline: none with nothing in its place is the classic.)
     WEAK       there is an indicator but it is under 3:1 against what it sits on, in the theme the page is in.
     TABINDEX   a tabindex above 0, which rips the control out of the page's reading order.
     UNREACHABLE  something that behaves as a control (role=button/link/tab/menuitem/checkbox/switch, or a
                click handler on a pointer-cursor element) but the keyboard cannot reach it: no tabindex.

   Both themes are read when the page switches with a data-theme attribute. Reports once per kind of control
   (tag + first class), with how many share it. Opt out with data-focus-check="skip".
   Needs the page's own focus ring to appear on a programmatic focus(); a browser that treats that as pointer
   focus will hide :focus-visible rules, which is reported as a note rather than as a failure. */
(function focusCheck() {
  var NEED = 3;
  /* :focus does not match in a window that is not focused (a background tab, an unfocused pane, devtools
     holding the focus), so every control would read as NOFOCUS. Refuse to guess. */
  if (!document.hasFocus()) {
    var msg = 'focus check: not run - this page does not have focus, so :focus never matches and every control would look unfocused. Click into the page (or bring its tab forward), then run it again.';
    console.warn(msg); return [msg];
  }
  function parse(c) {
    var m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/.exec(c || '');
    if (!m) { return null; }
    var a = m[4] === undefined ? 1 : (/%$/.test(m[4]) ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
    return [+m[1], +m[2], +m[3], a];
  }
  function over(t, b) { var a = t[3]; return [t[0] * a + b[0] * (1 - a), t[1] * a + b[1] * (1 - a), t[2] * a + b[2] * (1 - a), 1]; }
  function lum(c) { var v = c.slice(0, 3).map(function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function backdrop(el) {
    var layers = [], n = el;
    while (n && n.nodeType === 1) {
      var cs = getComputedStyle(n), bg = parse(cs.backgroundColor);
      if (bg && bg[3] > 0) { layers.push(bg); if (bg[3] >= 1) { break; } }
      n = n.parentElement;
    }
    var base = [255, 255, 255, 1];
    [document.documentElement, document.body].forEach(function (e) { var c = parse(getComputedStyle(e).backgroundColor); if (c && c[3] > 0) { base = over(c, base); } });
    for (var i = layers.length - 1; i >= 0; i--) { base = over(layers[i], base); }
    return base;
  }
  function visible(el) {
    var r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  }
  function kind(el) { return el.tagName.toLowerCase() + ((el.getAttribute('class') || '').trim().split(/\s+/)[0] ? '.' + (el.getAttribute('class') || '').trim().split(/\s+/)[0] : ''); }

  function snap(el) {
    var cs = getComputedStyle(el);
    return { ol: cs.outlineStyle, olw: parseFloat(cs.outlineWidth) || 0, olc: cs.outlineColor, sh: cs.boxShadow, fl: cs.filter,
             bc: cs.borderTopColor + cs.borderRightColor + cs.borderBottomColor + cs.borderLeftColor, bg: cs.backgroundColor, tx: cs.color,
             td: cs.textDecorationLine, bgi: cs.backgroundImage };
  }
  /* the colour of the strongest indicator the focus added, or 'changed' when it cannot be named, or null */
  function indicator(a, b, el) {
    var bd = backdrop(el.parentElement || el);   /* a ring is drawn outside the control, so it sits on the parent's backdrop, not its own fill */
    if (b.ol === 'auto' && a.ol !== 'auto') { return 99; }                       /* the browser's own two-tone ring */
    if (b.ol !== 'none' && b.olw > 0 && (a.ol === 'none' || a.olw === 0 || a.olc !== b.olc || a.olw !== b.olw)) {
      var c = parse(b.olc); return c ? ratio(over(c, bd), bd) : 99;
    }
    if (b.sh !== 'none' && b.sh !== a.sh) {
      var m = /(rgba?\([^)]*\))/.exec(b.sh), c2 = m && parse(m[1]);
      return c2 ? ratio(over(c2, bd), bd) : 99;
    }
    if (b.fl !== 'none' && b.fl !== a.fl) { return 99; }
    if (b.bc !== a.bc) { var c3 = parse(getComputedStyle(el).borderTopColor); var c4 = parse(a.bc.slice(0, a.bc.indexOf(')') + 1)); return c3 && c4 ? ratio(over(c3, bd), over(c4, bd)) : 99; }
    if (b.bg !== a.bg) { var n1 = parse(b.bg), o1 = parse(a.bg); return n1 && o1 ? ratio(over(n1, bd), over(o1, bd)) : 99; }
    if (b.tx !== a.tx || b.td !== a.td || b.bgi !== a.bgi) { return 99; }
    return null;
  }

  var root = document.documentElement, was = root.getAttribute('data-theme'), hasTheme = Array.prototype.some.call(document.styleSheets, function (sh) {
    try { return Array.prototype.some.call(sh.cssRules, function (r) { return r.selectorText && r.selectorText.indexOf('[data-theme') > -1; }); } catch (e) { return false; }
  });
  var themes = hasTheme ? ['light', 'dark'] : [null];
  var freeze = document.createElement('style');
  freeze.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}';
  document.head.appendChild(freeze);

  var keep = document.activeElement, sx = window.scrollX, sy = window.scrollY;
  var sel = 'a[href],button,input:not([type="hidden"]),select,textarea,summary,[tabindex],[contenteditable="true"],[role="button"],[role="link"],[role="tab"],[role="menuitem"],[role="checkbox"],[role="switch"],[role="option"]';
  var all = Array.prototype.filter.call(document.querySelectorAll(sel), function (el) {
    return visible(el) && !el.disabled && !el.closest('[data-focus-check="skip"], [inert], [hidden]') && el.getAttribute('data-focus-check') !== 'skip';
  });
  var found = {}, order = [], seenFV = 0, read = 0;
  function add(k, msg, el) { if (!found[k]) { found[k] = { msg: msg + (el ? ' | e.g. ' + (el.id ? '#' + el.id : '"' + (el.textContent || el.getAttribute('aria-label') || el.name || '').trim().slice(0, 24) + '"') : ''), n: 0 }; order.push(k); } found[k].n++; }

  themes.forEach(function (t) {
    if (t) { root.setAttribute('data-theme', t); }
    void document.body.offsetWidth;
    var tag = t ? t + ': ' : '';
    all.forEach(function (el) {
      var ti = el.getAttribute('tabindex');
      var first = t === themes[0];                       /* structure does not change with the theme: report it once */
      if (first && ti !== null && parseInt(ti, 10) > 0) { add('TABINDEX|' + kind(el), 'TABINDEX | ' + kind(el) + ' | tabindex=' + ti + ' reorders the keyboard path', el); }
      if (el.tabIndex < 0 && ti !== null && !el.matches('[role="option"]')) { return; }     /* deliberately out of the tab order (managed focus) */
      if (el.tabIndex < 0) {
        if (first && !el.matches('[role="option"]') && ti === null) { add('UNREACH|' + kind(el), 'UNREACHABLE | ' + kind(el) + ' | role=' + (el.getAttribute('role') || '?') + ' but no tabindex: the keyboard cannot reach it', el); }
        return;
      }
      var wraps = [], up = el.parentElement;
      for (var h = 0; h < 3 && up && up !== document.body; h++, up = up.parentElement) { wraps.push({ n: up, s: snap(up) }); }
      var a = snap(el);
      try { el.focus({ preventScroll: true }); } catch (e) { return; }
      if (document.activeElement !== el) { return; }
      read++;
      if (el.matches(':focus-visible')) { seenFV++; }
      var b = snap(el), r = indicator(a, b, el);
      wraps.forEach(function (w) { var wr = indicator(w.s, snap(w.n), w.n); if (wr !== null && (r === null || wr > r)) { r = wr; } });   /* a wrapper that lights up (:focus-within) counts */
      el.blur();
      if (r === null) { add('NOFOCUS|' + tag + kind(el), 'NOFOCUS | ' + tag + kind(el) + ' | focusing it changes nothing visible (no outline, shadow, border or background change)', el); }
      else if (r < NEED) { add('WEAK|' + tag + kind(el), 'WEAK | ' + tag + kind(el) + ' | the focus indicator is ' + r.toFixed(2) + ':1, under ' + NEED + ':1', el); }
    });
  });
  if (hasTheme) { if (was === null) { root.removeAttribute('data-theme'); } else { root.setAttribute('data-theme', was); } }
  freeze.remove();
  if (keep && keep.focus) { keep.focus({ preventScroll: true }); }
  window.scrollTo(sx, sy);

  var problems = order.map(function (k) { return found[k].msg + (found[k].n > 1 ? ' | ' + found[k].n + ' elements share this' : ''); });
  var notes = [];
  if (read && !seenFV) { notes.push('no control matched :focus-visible on a scripted focus(), so rules written only for :focus-visible were not exercised; click nothing in the page, reload, and run again'); }
  if (problems.length) {
    console.warn('focus check: ' + problems.length + ' kind(s) of control with a problem (' + read + ' focus tests' + (hasTheme ? ', both themes' : '') + ')');
    problems.forEach(function (p) { console.log('  ' + p); });
  } else {
    console.log('%cfocus check: clean - ' + read + ' focus tests' + (hasTheme ? ' in both themes' : ''), 'color:#1f7a4d;font-weight:700');
  }
  notes.forEach(function (n) { console.log('  note: ' + n); });
  return problems.length ? problems.concat(notes) : ['clean (' + read + ' focus tests)'].concat(notes);
})();
