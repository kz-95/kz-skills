/* explain-check.js - paste into the browser console on any page (rules B2, M6; ui-rules.md Appendix D).

   Finds every icon-only button (an icon, an SVG or a single glyph, and no visible words) and asks it to
   explain itself the way the device in hand can: hover and keyboard focus on a pointer that hovers, a
   long-press or a [?] beside it on touch. An accessible name is owed too, but it is not the explanation:
   nobody sighted ever sees it.

     NO EXPLAIN    on a hovering pointer, neither hovering it nor focusing it shows anything, and there is
                   no [?] beside it. A title attribute alone counts as nothing: it never shows on focus or
                   on touch. (B2)
     HOVER ONLY    hovering shows an explanation and keyboard focus does not. Appendix D: on hover AND on
                   focus, with no delay on focus. (B2)
     FOCUS ONLY    focus shows it and hovering does not. (B2)
     NO TOUCH PATH on a device that cannot hover, an icon-only button with no long-press explanation and no
                   [?] beside it. Appendix D: on touch the label is the only disclosure, so it does not
                   collapse there. (B1, B2)
     NO NAME       an icon-only button with no accessible name at all: it announces as "button". (B2 floor)
     SLOW NEXT     with one tooltip open, moving to the next button took more than 100ms to show its
                   tooltip. Measured once, on the first two neighbours that both explain on hover. (M6)
     REPEATS NAME  (advisory) the explanation only repeats the accessible name; it should add the
                   consequence or the shortcut.

   What counts as an explanation: something with words that becomes visible because of the hover, the
   focus or the long-press - a tooltip element, an aria-describedby target, a ::before/::after with
   content, or a CSS :hover rule that reveals one (read from the stylesheet, since a script cannot hover).
   A [?] toggle (a button reading "?", or named help, with aria-expanded or aria-controls) within 48px
   explains it on every device.

   Skipped: disabled buttons, [inert] and aria-hidden regions, the [?] toggles themselves, and dismiss
   buttons (a close glyph named Close or Dismiss). Opt out with data-explain-check="skip".
   Synthetic events: a :hover style cannot be triggered from a script, which is why CSS hover rules are
   read instead. Headless Chrome reports no pointer at all unless told otherwise, which reads as touch here
   and is noted. Restores the page. Returns a promise of the problem list. */
(async function explainCheck() {
  var problems = [], advisory = [], notes = [], wait = function (ms) {
    /* setTimeout is throttled to about a second in a hidden tab or pane; a message channel is not */
    if (!document.hidden) { return new Promise(function (r) { setTimeout(r, ms); }); }   /* a visible page, or a headless run with virtual time */
    return new Promise(function (r) {
      var end = performance.now() + ms, ch = new MessageChannel();
      ch.port1.onmessage = function () { if (performance.now() >= end) { r(); } else { ch.port2.postMessage(0); } };
      ch.port2.postMessage(0);
    });
  };
  var HOVER = matchMedia('(hover: hover)').matches;
  if (matchMedia('(pointer: none)').matches) {
    notes.push('the browser reports no pointer at all (headless Chrome does unless told otherwise), so this ran as touch; check the hover and focus paths in a real browser or with pointer emulation');
  }
  var MAX = 60;

  function name(el) {
    var n = el.getAttribute('aria-label');
    if (!n && el.getAttribute('aria-labelledby')) {
      n = el.getAttribute('aria-labelledby').split(/\s+/).map(function (id) { var x = document.getElementById(id); return x ? x.textContent : ''; }).join(' ');
    }
    if (!n) { n = (el.textContent || '').replace(/\s+/g, ' '); }
    if (!n || !n.trim()) { var img = el.querySelector('img[alt]'); n = img ? img.getAttribute('alt') : ''; }
    if (!n || !n.trim()) { var t = el.querySelector('svg title'); n = t ? t.textContent : ''; }
    if (!n || !n.trim()) { n = el.getAttribute('title') || ''; }
    return n.trim();
  }
  function label(el) { return el.id ? '#' + el.id : (name(el).slice(0, 30) || el.tagName.toLowerCase() + '.' + (el.getAttribute('class') || '').split(/\s+/)[0]); }
  function laidOut(el) {
    var r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  }
  function opacity(el) {
    var o = 1;
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) { o *= parseFloat(getComputedStyle(n).opacity); }
    return o;
  }
  /* shown: laid out, mostly opaque, has words, and at least partly inside the viewport */
  function shown(el) {
    if (!el || !el.isConnected || !laidOut(el) || opacity(el) < 0.5) { return false; }
    var r = el.getBoundingClientRect();
    if (r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) { return false; }
    return (el.textContent || '').trim().length > 1;
  }
  /* the words a sighted user can see on the button: text nodes with a real box, not visually hidden */
  function visibleText(el) {
    var out = '', w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false), t;
    while ((t = w.nextNode())) {
      if (!t.nodeValue.trim()) { continue; }
      var p = t.parentElement;
      if (!p || !laidOut(p) || opacity(p) < 0.1) { continue; }
      var rg = document.createRange(); rg.selectNodeContents(t);
      var r = rg.getBoundingClientRect(), x0 = r.left, y0 = r.top, x1 = r.right, y1 = r.bottom;
      /* cut the text's box by every clipping ancestor up to the button: the 1px visually-hidden label
         still has a full-width text box, so the box alone would count it as visible */
      for (var a = p; a && a !== el.parentElement; a = a.parentElement) {
        var cs = getComputedStyle(a);
        if (/rect\(\s*0(px)?[\s,]+0(px)?[\s,]+0(px)?[\s,]+0(px)?\s*\)/.test(cs.clip) || /inset\(\s*50%/.test(cs.clipPath)) { x1 = x0; break; }
        if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
          var ar = a.getBoundingClientRect();
          x0 = Math.max(x0, ar.left); y0 = Math.max(y0, ar.top); x1 = Math.min(x1, ar.right); y1 = Math.min(y1, ar.bottom);
        }
      }
      if (x1 - x0 > 0.5 && y1 - y0 > 0.5) { out += t.nodeValue; }
    }
    return out.replace(/\s+/g, ' ').trim();
  }
  function hasIcon(el) { return !!el.querySelector('svg, img, i, [class*="icon" i], [data-icon]'); }
  function isHelpToggle(el) {
    var txt = (el.textContent || '').trim(), nm = (el.getAttribute('aria-label') || '');
    return (txt === '?' || /\bhelp\b|what is|explain/i.test(nm) || /(^|\s)help(\s|$)/.test(el.getAttribute('class') || '')) &&
      (el.hasAttribute('aria-expanded') || el.hasAttribute('aria-controls') || el.hasAttribute('aria-haspopup') || txt === '?');
  }
  function isDismiss(el, vt) {
    return /^(close|dismiss)\b/i.test(name(el)) && (vt === '' || /^[x\u00d7\u2715\u2716]$/i.test(vt));
  }
  function pseudo(el) {
    var out = [];
    ['::before', '::after'].forEach(function (p) {
      var c = getComputedStyle(el, p).content;
      out.push(c && c !== 'none' && c !== 'normal' && c.replace(/["']/g, '').trim().length > 1 ? c : '');
    });
    return out.join('|');
  }
  function dist(a, b) {
    var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    var dx = Math.max(0, rb.left - ra.right, ra.left - rb.right), dy = Math.max(0, rb.top - ra.bottom, ra.top - rb.bottom);
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* CSS hover rules that reveal something for this element: a script cannot hover, so read them */
  var hoverRules = [];
  Array.prototype.forEach.call(document.styleSheets, function (sh) {
    var rules; try { rules = sh.cssRules; } catch (e) { return; }
    (function walk(list) {
      Array.prototype.forEach.call(list || [], function (r) {
        if (r.cssRules && !r.selectorText) { walk(r.cssRules); return; }
        if (!r.selectorText || r.selectorText.indexOf(':hover') < 0) { return; }
        var st = r.style;
        if (!(st.content && st.content !== 'none') && !st.opacity && !st.visibility && !st.display) { return; }
        r.selectorText.split(',').forEach(function (sel) {
          var m = /^(.*?):hover/.exec(sel.trim());
          if (m && m[1].trim()) { hoverRules.push(m[1].trim()); }
        });
      });
    })(rules);
  });
  function cssHover(el) {
    return hoverRules.some(function (s) { try { return el.matches(s) && s !== '*' && !/^(button|a|\.btn)$/i.test(s); } catch (e) { return false; } });
  }

  function hoverIn(el) {
    var r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    [['pointerover', 1], ['pointerenter', 0], ['mouseover', 1], ['mouseenter', 0], ['pointermove', 1], ['mousemove', 1]].forEach(function (p) {
      var C = p[0].indexOf('pointer') === 0 ? PointerEvent : MouseEvent;
      el.dispatchEvent(new C(p[0], { bubbles: !!p[1], cancelable: true, view: window, clientX: x, clientY: y, pointerType: 'mouse' }));
    });
  }
  function hoverOut(el) {
    [['pointerout', 1], ['pointerleave', 0], ['mouseout', 1], ['mouseleave', 0]].forEach(function (p) {
      var C = p[0].indexOf('pointer') === 0 ? PointerEvent : MouseEvent;
      el.dispatchEvent(new C(p[0], { bubbles: !!p[1], cancelable: true, view: window, relatedTarget: document.body, pointerType: 'mouse' }));
    });
  }
  function longPress(el) {
    var r = el.getBoundingClientRect();
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, view: window, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerType: 'touch', isPrimary: true }));
    try { el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true })); } catch (e) { /* no TouchEvent constructor */ }
  }
  function longPressEnd(el) {
    /* pointercancel, not pointerup: nothing that could count as a tap, so nothing is activated */
    el.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, cancelable: true, view: window, pointerType: 'touch', isPrimary: true }));
    try { el.dispatchEvent(new TouchEvent('touchcancel', { bubbles: true, cancelable: true })); } catch (e) { /* no TouchEvent constructor */ }
  }

  /* A fade in flight is finished before anything is measured: a headless run on virtual time may never
     advance a CSS transition or entry animation, which would read a correct tooltip as still invisible.
     Only finite ones are finished; a looping animation such as a spinner is left alone. */
  function settle() {
    if (!document.getAnimations) { return; }
    document.getAnimations().forEach(function (an) {
      if (an.playState === 'running' && isFinite(an.effect && an.effect.getComputedTiming ? an.effect.getComputedTiming().endTime : Infinity)) { try { an.finish(); } catch (e) { /* already done */ } }
    });
  }
  /* Watch what an interaction changes, then ask whether any of it is a newly shown explanation. */
  function local(el) {
    var set = [el], p = el.parentElement;
    Array.prototype.forEach.call(el.querySelectorAll('*'), function (c) { set.push(c); });
    for (var s = el.nextElementSibling, k = 0; s && k < 3; s = s.nextElementSibling, k++) { set.push(s); }
    if (p) { Array.prototype.forEach.call(p.children, function (c) { if (set.indexOf(c) < 0) { set.push(c); } }); }
    (el.getAttribute('aria-describedby') || '').split(/\s+/).forEach(function (id) { var d = id && document.getElementById(id); if (d) { set.push(d); } });
    Array.prototype.forEach.call(document.querySelectorAll('[role="tooltip"]'), function (t) { set.push(t); });
    return set;
  }
  async function probe(el, act, undo, ms) {
    /* finish the last probe's fade-out first: a shared tooltip still fading would read as already shown */
    settle();
    var near = local(el), before = near.map(shown), beforeText = near.map(function (c) { return (c.textContent || '').trim(); }),
      pBefore = pseudo(el), touched = [];
    var mo = new MutationObserver(function (list) {
      list.forEach(function (m) {
        var t = m.target.nodeType === 1 ? m.target : m.target.parentElement;
        if (t) { touched.push(t); }
        Array.prototype.forEach.call(m.addedNodes || [], function (n) { if (n.nodeType === 1) { touched.push(n); } });
      });
    });
    mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
    act(el);
    await wait(ms);
    settle();
    mo.disconnect();
    var vt = visibleText(el), found = null;
    function candidate(c) {
      if (!c || c === el || c.contains(el) || !shown(c)) { return false; }
      var r = c.getBoundingClientRect(), txt = (c.textContent || '').trim();
      if (r.width * r.height > innerWidth * innerHeight * 0.25 || txt.length > 400 || txt === vt) { return false; }
      return true;
    }
    /* new: not shown before, or a tooltip that was showing something else and now explains this one */
    near.forEach(function (c, i) {
      var changed = before[i] && c.getAttribute('role') === 'tooltip' && (c.textContent || '').trim() !== beforeText[i];
      if (!found && (!before[i] || changed) && candidate(c)) { found = c; }
    });
    touched.forEach(function (c) { if (!found && near.indexOf(c) < 0 && candidate(c)) { found = c; } });
    var pAfter = pseudo(el), text = found ? (found.textContent || '').trim() : (pAfter !== pBefore && pAfter.replace(/\|/g, '') ? pAfter : '');
    undo(el);
    await wait(60);
    return { ok: !!(found || text), text: text, node: found };
  }

  var buttons = Array.prototype.filter.call(
    document.querySelectorAll('button, [role="button"], input[type="button"], input[type="image"], a[href][aria-label]'),
    function (el) {
      if (el.closest('[data-explain-check="skip"]') || el.closest('[inert]') || el.closest('[aria-hidden="true"]')) { return false; }
      if (el.disabled || el.getAttribute('aria-disabled') === 'true' || !laidOut(el) || opacity(el) < 0.1) { return false; }
      if (el.tagName === 'INPUT') { return el.type === 'image' || !(el.value || '').trim(); }
      var vt = visibleText(el);
      if (vt.length > 1) { return false; }                       /* a word on it: B1's label is there */
      if (vt.length === 0 && !hasIcon(el)) { return false; }     /* an empty box is not an icon button */
      if (isHelpToggle(el) || isDismiss(el, vt)) { return false; }
      return true;
    });
  if (buttons.length > MAX) { notes.push(buttons.length + ' icon-only buttons; the first ' + MAX + ' were tested'); buttons = buttons.slice(0, MAX); }
  var helps = Array.prototype.filter.call(document.querySelectorAll('button, [role="button"]'), function (b) { return isHelpToggle(b) && laidOut(b); });

  var hoverTipped = [];
  for (var i = 0; i < buttons.length; i++) {
    var b = buttons[i], nm = name(b), who = label(b);
    b.scrollIntoView({ block: 'center', behavior: 'instant' });
    await wait(20);
    if (!nm) { problems.push('NO NAME | ' + who + ' | an icon-only button with no accessible name: it announces as just "button" (aria-label)'); }
    var helper = helps.filter(function (h) { return h !== b && dist(b, h) <= 48; })[0];
    if (helper) { continue; }                                    /* a [?] beside it explains it on every device */
    var titleOnly = b.hasAttribute('title') ? ' (a title attribute is not enough: it never shows on focus or touch)' : '';

    if (!HOVER) {
      var lp = await probe(b, longPress, longPressEnd, 700);
      if (!lp.ok) {
        problems.push('NO TOUCH PATH | ' + who + ' | an icon-only button on a device that cannot hover: no long-press explanation and no [?] beside it. Keep its label visible on touch (Appendix D)' + titleOnly);
      }
      continue;
    }
    var h = await probe(b, hoverIn, hoverOut, 700);
    await wait(400);                                             /* let any warm window close, so the next hover is a cold one */
    var f = await probe(b, function (el) { el.focus({ preventScroll: true }); }, function (el) { el.blur(); }, 150);
    var cssH = !h.ok && cssHover(b);
    if (!h.ok && !cssH && !f.ok) {
      problems.push('NO EXPLAIN | ' + who + ' | neither hover nor focus shows an explanation, and no [?] is beside it' + titleOnly);
    } else if ((h.ok || cssH) && !f.ok) {
      problems.push('HOVER ONLY | ' + who + ' | hovering explains it, keyboard focus shows nothing (Appendix D: hover and focus, no delay on focus)');
    } else if (!h.ok && !cssH && f.ok) {
      problems.push('FOCUS ONLY | ' + who + ' | focus explains it, hovering shows nothing');
    }
    var said = (h.text || f.text || '').replace(/["']/g, '').trim();
    if (said && nm && said.toLowerCase() === nm.toLowerCase()) {
      advisory.push('REPEATS NAME | ' + who + ' | the explanation only repeats the name "' + nm + '"; say the consequence or the shortcut');
    }
    if (h.ok && h.node) { hoverTipped.push({ el: b, text: (h.node.textContent || '').trim() }); }
  }

  /* M6: hover the first until its tooltip shows, move to its neighbour, and time the second tooltip */
  for (var j = 0; j + 1 < hoverTipped.length; j++) {
    var a = hoverTipped[j].el, c = hoverTipped[j + 1].el, cText = hoverTipped[j + 1].text;
    if (dist(a, c) > 48 || a.parentElement !== c.parentElement) { continue; }
    a.scrollIntoView({ block: 'center', behavior: 'instant' });
    await wait(60); settle();
    hoverIn(a); await wait(700);
    hoverOut(a); hoverIn(c);
    var got = false;
    for (var k = 0; k < 4 && !got; k++) {
      await wait(25);
      settle();
      got = local(c).some(function (n) { return n !== c && shown(n) && (n.textContent || '').trim() === cText; });
    }
    hoverOut(c); await wait(400); settle();
    if (!got) {
      problems.push('SLOW NEXT | ' + label(a) + ' -> ' + label(c) + ' | with one tooltip open, the next took more than 100ms to show (M6: the toolbar is warm once one is open)');
    }
    break;
  }

  if (problems.length) {
    console.warn('explain check: ' + problems.length + ' problem(s) in ' + buttons.length + ' icon-only button(s)');
    problems.forEach(function (p) { console.log('  ' + p); });
  } else {
    console.log('%cexplain check: clean - ' + buttons.length + ' icon-only button(s) explained', 'color:#1f7a4d;font-weight:700');
  }
  if (advisory.length) { console.log('  advisory (' + advisory.length + '):'); advisory.forEach(function (x) { console.log('    ' + x); }); }
  notes.forEach(function (n) { console.log('  note: ' + n); });
  if (!buttons.length) { notes.push('no icon-only button on this page: nothing to explain'); }
  return problems.length ? problems.concat(advisory, notes) :
    ['clean (' + buttons.length + ' icon-only buttons' + (HOVER ? ', hover and focus' : ', touch') + ')'].concat(advisory, notes);
})();
