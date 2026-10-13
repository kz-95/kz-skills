/* motion-check.js - paste into the browser console on any page (rules M1, M3, M4, M5).

   Reads every element's transitions and animations, and every stylesheet the page can see, and reports
   the motion that was written without a decision behind it.

     ALL        `transition: all` (or a transition-property list holding `all`) with a duration: it animates
                whatever changes next, including layout and every colour a theme switch flips (M4).
     EASEIN     a transition or animation timed ease-in, or a curve that never decelerates: the first frames,
                the ones the user is watching, barely move, so the UI reads as slow to answer (M4).
     LAYOUTPROP a transition on width, height, top, left, margin or padding: the page re-measures every frame (M1).
     SCALE0     an entry or exit at scale(0) in a rule, a keyframe or @starting-style: nothing in the world
                appears from nothing; start at 0.9 to 0.97 with opacity (M3).
     ORIGIN     an anchored panel (menu, listbox, tooltip, popover, dropdown) that animates transform from its
                centre, so it grows from the middle of the page rather than from the control that opened it (M3).
     NOPRESS    a button with no :active rule anywhere, so a press changes nothing until the action lands (M5).
                Read on native buttons and anything classed .btn or .button; a custom role=button (a chart mark,
                a selectable row) answers through its selection and is not read.

   Advisory, never a failure:
     NOREDUCE   transforms move on this page and no stylesheet holds a prefers-reduced-motion query (M1).
     UNREAD     a stylesheet the browser will not let a script read (cross-origin), so its rules were not seen.

   Reports once per kind of element (tag + first class), with how many share it. A deliberately wrong sample
   opts out with data-motion-check="skip" on itself or an ancestor. Reads computed styles only: it never
   clicks, hovers or moves anything, so it is safe on any page and needs no reload after. */
(function motionCheck() {
  var LAYOUT = /^(width|height|min-width|max-width|min-height|max-height|top|right|bottom|left|inset|margin|padding)(-|$)/;
  var ANCHORED = '[role=menu],[role=listbox],[role=tooltip],[popover]:not(dialog),.popover,.dropdown,.menu,.tooltip';
  var PRESSABLE = 'button,input[type=button],input[type=submit],input[type=reset],a.btn,a.button,.btn,.button';
  var found = {}, order = [], advisory = [];

  function skipped(el) { return !!(el.closest && el.closest('[data-motion-check="skip"]')); }
  function kind(el) {
    var c = (el.getAttribute('class') || '').trim().split(/\s+/)[0];
    return el.tagName.toLowerCase() + (c ? '.' + c : '');
  }
  function add(code, el, detail) {
    var key = code + '|' + kind(el);
    if (!found[key]) { found[key] = { msg: code + ' | ' + kind(el) + ' | ' + detail, n: 0 }; order.push(key); }
    found[key].n++;
  }
  function list(v) { return String(v || '').split(/,(?![^(]*\))/).map(function (s) { return s.trim(); }); }
  function secs(v) { return /ms$/.test(v) ? parseFloat(v) / 1000 : parseFloat(v) || 0; }
  /* ease-in, or a cubic-bezier that ends at full speed (x2,y2 at 1,1) after a slow start */
  function easeIn(t) {
    if (t === 'ease-in') { return true; }
    var m = /cubic-bezier\(\s*([\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*([\d.]+)\s*,\s*(-?[\d.]+)\s*\)/.exec(t);
    return !!m && +m[3] >= 0.9 && +m[4] >= 0.9 && +m[1] > 0.2 && +m[2] < +m[1];
  }
  var SCALE0 = /scale(?:3d)?\(\s*0(?:\.0+)?\s*(?:,\s*0(?:\.0+)?\s*)*\)|(?:^|[\s;{])scale\s*:\s*0(?:\.0+)?\s*(?:;|$)/;

  /* ---- 1. computed transitions and animations, element by element --------------------------------- */
  var all = document.querySelectorAll('body *');
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    if (skipped(el)) { continue; }
    var cs = getComputedStyle(el);
    var props = list(cs.transitionProperty), durs = list(cs.transitionDuration), fns = list(cs.transitionTimingFunction);
    props.forEach(function (p, k) {
      if (secs(durs[k % durs.length]) <= 0) { return; }
      if (p === 'all') { add('ALL', el, 'transition: all - name the properties it moves (transform, opacity, a colour)'); }
      else if (LAYOUT.test(p)) { add('LAYOUTPROP', el, 'transitions ' + p + ' - move it with transform, or let it change without a transition'); }
      if (easeIn(fns[k % fns.length])) { add('EASEIN', el, 'transition on ' + p + ' is timed ' + fns[k % fns.length] + ' - an arrival decelerates; use an ease-out'); }
    });
    if (cs.animationName && cs.animationName !== 'none') {
      var an = list(cs.animationTimingFunction);
      if (an.some(easeIn)) { add('EASEIN', el, 'animation ' + cs.animationName + ' is timed ' + cs.animationTimingFunction + ' - use an ease-out'); }
    }
  }

  /* ---- 2. anchored panels that grow from their own centre ----------------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll(ANCHORED), function (el) {
    if (skipped(el) || el.closest('dialog,[aria-modal=true]')) { return; }
    var cs = getComputedStyle(el);
    var moves = list(cs.transitionProperty).some(function (p, k) {
      return (p === 'transform' || p === 'scale' || p === 'all') && secs(list(cs.transitionDuration)[k % list(cs.transitionDuration).length]) > 0;
    }) || (cs.animationName && cs.animationName !== 'none');
    if (!moves) { return; }
    var o = cs.transformOrigin.split(' ').map(parseFloat), w = el.offsetWidth, h = el.offsetHeight;
    if (w && h && Math.abs(o[0] - w / 2) < 1 && Math.abs(o[1] - h / 2) < 1) {
      add('ORIGIN', el, 'an anchored panel animates from its centre - set transform-origin on the side facing its trigger');
    }
  });

  /* ---- 3. the stylesheets: scale(0), :active coverage, reduced motion ------------------------------ */
  var activeSel = [], reduce = false, unread = 0;
  function used(selector) {
    var bare = selector.replace(/::?[a-z-]+(\([^)]*\))?/gi, '').trim() || '*';
    try { return Array.prototype.slice.call(document.querySelectorAll(bare)); } catch (e) { return []; }
  }
  function keyframeUsers(name) {
    return Array.prototype.filter.call(all, function (el) { return list(getComputedStyle(el).animationName).indexOf(name) >= 0; });
  }
  function scale0(where, users) {
    if (users.length && users.every(skipped)) { return; }
    var el = users.filter(function (u) { return !skipped(u); })[0];
    var label = el ? kind(el) : where;
    var key = 'SCALE0|' + where;
    if (!found[key]) { found[key] = { msg: 'SCALE0 | ' + label + ' | ' + where + ' starts or ends at scale(0) - start at 0.9 to 0.97 with opacity 0', n: 0 }; order.push(key); }
    found[key].n += Math.max(1, users.length);
  }
  function walk(rules, starting) {
    for (var r = 0; r < rules.length; r++) {
      var rule = rules[r], text = rule.cssText || '';
      if (rule.type === 4 && /prefers-reduced-motion/.test(rule.conditionText || rule.media && rule.media.mediaText || '')) { reduce = true; }
      if (rule.type === 7) {                                   /* @keyframes */
        if (SCALE0.test(text)) { scale0('@keyframes ' + rule.name, keyframeUsers(rule.name)); }
        continue;
      }
      var isStart = starting || /^@starting-style/.test(text);
      if (rule.selectorText) {
        if (/:active/.test(rule.selectorText)) {
          rule.selectorText.split(/,(?![^(]*\))/).forEach(function (s) {
            if (/:active/.test(s)) { activeSel.push(s.replace(/:active/g, '').trim() || '*'); }
          });
        }
        var body = rule.style ? rule.style.cssText : '';
        if (SCALE0.test(body) && (isStart || /enter|starting|closed|hidden|from|leave|exit/i.test(rule.selectorText) || /opacity\s*:\s*0(?:\.0+)?\s*;/.test(body))) {
          scale0((isStart ? '@starting-style ' : '') + rule.selectorText, used(rule.selectorText));
        }
      }
      if (rule.cssRules && rule.cssRules.length) { walk(rule.cssRules, isStart); }
    }
  }
  Array.prototype.forEach.call(document.styleSheets, function (sheet) {
    var rules;
    try { rules = sheet.cssRules; } catch (e) { unread++; return; }
    if (rules) { walk(rules, false); }
  });

  Array.prototype.forEach.call(document.querySelectorAll(PRESSABLE), function (el) {
    if (skipped(el) || el.closest('svg') || el.disabled || el.getAttribute('aria-disabled') === 'true') { return; }
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) { return; }
    var pressed = activeSel.some(function (s) { try { return el.matches(s); } catch (e) { return false; } });
    if (!pressed) { add('NOPRESS', el, 'no :active rule reaches it - a press should answer at once (a 0.95 to 0.98 scale, or the halo deepening)'); }
  });

  var moving = Array.prototype.some.call(all, function (el) {
    var cs = getComputedStyle(el);
    return /transform|all|translate|scale|rotate/.test(cs.transitionProperty) && list(cs.transitionDuration).some(function (d) { return secs(d) > 0; }) ||
           (cs.animationName && cs.animationName !== 'none');
  });
  if (moving && !reduce && !unread) { advisory.push('NOREDUCE | things move on this page and no stylesheet has a prefers-reduced-motion query - give it a gentler transition (a fade), not none (M1)'); }
  if (unread) { advisory.push('UNREAD | ' + unread + ' stylesheet(s) could not be read (cross-origin), so their :active, @keyframes and reduced-motion rules were not seen'); }

  var problems = order.map(function (k) { return found[k].msg + (found[k].n > 1 ? ' | ' + found[k].n + ' elements share this' : ''); });
  if (problems.length) {
    console.warn('motion check: ' + problems.length + ' kind(s) of motion with a problem');
    problems.forEach(function (p) { console.log('  ' + p); });
  } else {
    console.log('%cmotion check: clean - ' + all.length + ' elements read', 'color:#1f7a4d;font-weight:700');
  }
  advisory.forEach(function (a) { console.log('  advisory: ' + a); });
  return problems.length ? problems.concat(advisory) : ['clean (' + all.length + ' elements read)'].concat(advisory);
})();
