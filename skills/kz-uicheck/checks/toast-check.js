/* toast-check.js - paste into the browser console on any page (rules A1, A2; ui-rules.md Appendix B).

   Finds the page's toast system and measures it. It never presses a button of the page's own unless the
   page marks that button safe with data-kz-toast-test: a "Delete" pressed by a checker deletes.

     NO LIVE       a toast, or the region toasts appear in, is not a live region (role="status", role="alert"
                   or aria-live), so a screen reader never hears the outcome. (A1)
     NO CLOSE      a toast with no dismiss control: every toast has a manual dismiss. (Appendix B)
     STACK         more than three toasts on screen at once: cap the stack at three. (Appendix B)
     RESTACK       the same message fired twice put two copies on screen. (A2)
     REMOUNT       the same message fired twice removed the toast and mounted a new one in its place: the
                   entry animation replays and the stack reflows. Keep the node. (A2)
     NO COUNT      the same message fired twice kept one toast but nothing on it says it happened twice. (A2)
     UNDO GONE     a toast carrying Undo was removed or replaced by the next, unrelated toast, so the undo
                   went with it. (Appendix B)
     UNDO MERGED   two undoable toasts with the same words were merged into one: the earlier undo is lost.
                   (A2: never merge an undoable toast)
     ERROR SHORT   an error toast left the screen before an ordinary one did: errors stay longer. (Appendix B)
     TOO FAST      an ordinary toast was gone in under 2 seconds, too short to read. (Appendix B: about 3.5s)
     UNDER DIALOG  with a modal dialog open, the toast is underneath it: the point at its centre belongs to
                   something else. Measured by opening the page's first closed <dialog> with showModal()
                   (no button pressed) and by any sheet or dialog already open. (A1)
     NO HOOK       (advisory) no toast function to call and no data-kz-toast-test trigger, so only the
                   static findings ran. Expose window.kzToast(text, { kind, undo }) to have it measured.

   How a toast is made: window.kzToast, window.toast or window.showToast, called as fn(text, opts) and,
   if no text appears, as fn({ text, message, kind, type, undo }). opts.kind is 'info', 'err' or 'ok'
   (type 'error' or 'info' is passed too); opts.undo is a function that does nothing. Without a function,
   elements with data-kz-toast-test are clicked (the value "undo" marks one that makes an undoable toast).
   Every toast it made is dismissed afterwards. Opt a region out with data-toast-check="skip".
   Returns a promise of the problem list. */
(async function toastCheck() {
  var problems = [], advisory = [], notes = [], wait = function (ms) {
    /* setTimeout is throttled to about a second in a hidden tab or pane; a message channel is not */
    if (!document.hidden) { return new Promise(function (r) { setTimeout(r, ms); }); }   /* a visible page, or a headless run with virtual time */
    return new Promise(function (r) {
      var end = performance.now() + ms, ch = new MessageChannel();
      ch.port1.onmessage = function () { if (performance.now() >= end) { r(); } else { ch.port2.postMessage(0); } };
      ch.port2.postMessage(0);
    });
  };
  var TOASTY = /(^|[\s_-])(toasts?|toaster|snackbar|snack|notifications?|flash)([\s_-]|$)/i;
  var LIVE = '[aria-live]:not([aria-live="off"]), [role="status"], [role="alert"], [role="log"], output';
  var made = [], seq = 0;

  function skipped(el) { return !!(el.closest && el.closest('[data-toast-check="skip"]')); }
  function laidOut(el) {
    var r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  }
  function opacity(el) {
    var o = 1;
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) { o *= parseFloat(getComputedStyle(n).opacity); }
    return o;
  }
  function shown(el) { return !!el && el.isConnected && laidOut(el) && opacity(el) > 0.1; }
  /* entries and fades in flight are finished before measuring: a headless clock may never advance them.
     Only finite animations; a looping spinner is left alone. */
  function settle() {
    if (!document.getAnimations) { return; }
    document.getAnimations().forEach(function (an) {
      if (an.playState === 'running' && isFinite(an.effect && an.effect.getComputedTiming ? an.effect.getComputedTiming().endTime : Infinity)) { try { an.finish(); } catch (e) { /* done */ } }
    });
  }
  function live(el) { return !!(el && el.closest(LIVE)); }
  function closer(item) {
    return Array.prototype.filter.call(item.querySelectorAll('button, [role="button"], a[href]'), function (b) {
      var t = ((b.getAttribute('aria-label') || '') + ' ' + (b.textContent || '')).trim();
      return shown(b) && !/undo|restore|retry|view|open/i.test(t);
    })[0] || null;
  }
  function undoBtn(item) {
    return Array.prototype.filter.call(item.querySelectorAll('button, [role="button"], a'), function (b) {
      return shown(b) && /undo|restore/i.test((b.getAttribute('aria-label') || '') + ' ' + b.textContent);
    })[0] || null;
  }
  /* every visible element whose own text holds the marker */
  function holders(text) {
    var out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false), t;
    while ((t = w.nextNode())) {
      if (t.nodeValue.indexOf(text) > -1 && t.parentElement && shown(t.parentElement) && !skipped(t.parentElement)) { out.push(t.parentElement); }
    }
    return out;
  }
  function parse(c) { var m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) { return 0; } var v = m[1].split(/[\s,\/]+/); return v.length > 3 ? parseFloat(v[3]) : 1; }
  /* a card: something drawn - a background, a border or a shadow - which a toast is and its region is not */
  function card(el) {
    var cs = getComputedStyle(el);
    return parse(cs.backgroundColor) > 0 || (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none') || cs.boxShadow !== 'none';
  }
  function region(el) {
    var pos = getComputedStyle(el).position;
    return el.matches(LIVE) || pos === 'fixed' || pos === 'absolute' || pos === 'sticky' || el.hasAttribute('popover');
  }
  /* the toast that holds a piece of text: the outermost card between the text and the first live or
     floating element above it, or that element itself when nothing between is drawn */
  function itemOf(node) {
    var c = null;
    for (var p = node; p && p !== document.body; p = p.parentElement) {
      if (card(p)) { c = p; }
      if (region(p)) { return c || p; }
    }
    return c || node;
  }

  /* ---- static: what is on the page now ---- */
  /* toast-named, and either a live region or floating (itself or an ancestor): a section about toasts,
     or a settings row named "notifications", is neither */
  function floating(el) {
    for (var p = el; p && p !== document.body; p = p.parentElement) {
      var pos = getComputedStyle(p).position;
      if (pos === 'fixed' || pos === 'absolute' || pos === 'sticky' || p.hasAttribute('popover')) { return true; }
    }
    return false;
  }
  var regions = Array.prototype.filter.call(document.querySelectorAll('[class], [id]'), function (el) {
    return TOASTY.test((el.getAttribute('class') || '') + ' ' + (el.id || '')) && !skipped(el) &&
      el.tagName !== 'BUTTON' && el.tagName.toLowerCase() !== 'svg' && !el.closest('button') && (el.matches(LIVE) || floating(el));
  });
  var outer = regions.filter(function (r) { return !regions.some(function (o) { return o !== r && o.contains(r); }); });
  outer.forEach(function (r) {
    if (!live(r) && !r.querySelector(LIVE)) {
      problems.push('NO LIVE | ' + (r.id ? '#' + r.id : '.' + (r.getAttribute('class') || '').split(/\s+/)[0]) + ' | the toast region is not a live region (role="status" or aria-live="polite"), so the outcome is never announced');
    }
  });
  var onScreen = [];
  outer.forEach(function (r) {
    Array.prototype.forEach.call(r.children.length ? r.children : [r], function (c) { if (shown(c) && (c.textContent || '').trim()) { onScreen.push(c); } });
  });
  if (onScreen.length > 3) { problems.push('STACK | ' + onScreen.length + ' toasts on screen | cap the stack at three; drop the oldest that carries no Undo'); }
  onScreen.forEach(function (c) {
    if (!closer(c)) { problems.push('NO CLOSE | "' + (c.textContent || '').trim().slice(0, 40) + '" | a toast on screen has no dismiss control'); }
  });

  /* ---- live: make toasts and measure them ---- */
  var hookName = ['kzToast', 'toast', 'showToast'].filter(function (n) { return typeof window[n] === 'function'; })[0];
  var hook = hookName ? window[hookName] : null, mode = null;
  var triggers = Array.prototype.filter.call(document.querySelectorAll('[data-kz-toast-test]'), function (b) { return shown(b) && !skipped(b) && !b.disabled; });

  function watch() {
    var added = [], mo = new MutationObserver(function (list) {
      list.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) { added.push(n); } }); });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return { stop: function () { mo.disconnect(); return added; } };
  }
  function call(text, kind, undo) {
    var opts = { kind: kind, type: kind === 'err' ? 'error' : kind, variant: kind === 'err' ? 'error' : kind };
    if (undo) { opts.undo = function () {}; opts.undoText = 'Undo'; }
    if (mode === 'object') { opts.text = text; opts.message = text; return hook(opts); }
    return hook(text, opts);
  }
  /* make one toast and return its node, or null */
  async function make(text, kind, undo) {
    var w = watch();
    try { call(text, kind, undo); } catch (e) { w.stop(); return null; }
    await wait(250); settle();
    var added = w.stop(), h = holders(text);
    var node = h.length ? itemOf(h[h.length - 1]) : null;
    if (node) { made.push(node); }
    return { node: node, added: added, count: h.length };
  }
  async function dismissAll() {
    made.forEach(function (n) {
      if (!n.isConnected) { return; }
      var x = closer(n);
      if (x) { x.click(); } else { n.remove(); }
    });
    made = [];
    await wait(400); settle();
  }

  if (hook) {
    /* find the calling convention: text first, then a single options object */
    mode = hook.length >= 2 ? 'text' : 'object';
    var probe = await make('kz check ' + (++seq) + ' probe', 'info', false);
    if (!probe || !probe.node) {
      (probe && probe.added || []).forEach(function (n) { var x = n.isConnected && closer(n); if (x) { x.click(); } else if (n.isConnected && n.parentElement && n.parentElement !== document.body) { n.remove(); } });
      mode = mode === 'text' ? 'object' : 'text';
      probe = await make('kz check ' + (++seq) + ' probe', 'info', false);
    }
    if (!probe || !probe.node) {
      advisory.push('NO HOOK | window.' + hookName + ' exists, but calling it with a text (or { text }) put no visible toast on screen; only the static findings ran');
      hook = null;
    }
  }

  if (hook) {
    var t0 = probe.node;
    if (!live(t0) && !problems.some(function (p) { return /^NO LIVE/.test(p); })) { problems.push('NO LIVE | "' + t0.textContent.trim().slice(0, 40) + '" | the toast is not inside a live region (role="status" or aria-live="polite"), so it is never announced'); }
    if (!closer(t0)) { problems.push('NO CLOSE | "' + t0.textContent.trim().slice(0, 40) + '" | the toast has no dismiss control'); }
    await dismissAll();

    /* the same message twice */
    var same = 'kz check ' + (++seq) + ' same message';
    var a1 = await make(same, 'info', false), a2 = await make(same, 'info', false);
    if (a1 && a2 && a1.node) {
      if (a2.count > 1) {
        problems.push('RESTACK | "' + same + '" | the same message fired twice is on screen ' + a2.count + ' times (A2: keep the node, add a count, restart its timer)');
      } else if (!a1.node.isConnected || a1.node !== a2.node) {
        problems.push('REMOUNT | "' + same + '" | the same message fired twice removed the toast and mounted a new one: the entry replays and the stack reflows (A2)');
      } else if (!/(^|\D)2(\D|$)/.test(a1.node.textContent.split(same).join(' ') + ' ' + getComputedStyle(a1.node, '::after').content + ' ' + getComputedStyle(a1.node, '::before').content)) {
        problems.push('NO COUNT | "' + same + '" | the same message fired twice kept one toast, but nothing on it says it happened twice (A2)');
      }
    }
    await dismissAll();

    /* more than three */
    for (var k = 0; k < 5; k++) { await make('kz check ' + (++seq) + ' stack ' + k, 'info', false); }
    var up = made.filter(function (n) { return shown(n); }).length;
    if (up > 3) { problems.push('STACK | ' + up + ' toasts on screen | five toasts in a row left ' + up + ' showing; cap the stack at three'); }
    await dismissAll();

    /* an undoable toast survives the next toast, and two undoable toasts are never merged */
    var uText = 'kz check ' + (++seq) + ' archived', u = await make(uText, 'info', true);
    if (u && u.node && undoBtn(u.node)) {
      await make('kz check ' + (++seq) + ' saved', 'info', false);
      if (!shown(u.node) || !undoBtn(u.node)) {
        problems.push('UNDO GONE | "' + uText + '" | the next, unrelated toast removed or replaced the toast carrying Undo');
      } else {
        await make(uText, 'info', true);
        var undos = holders(uText).map(itemOf).filter(function (n, i, all) { return all.indexOf(n) === i && undoBtn(n); }).length;
        if (undos < 2) { problems.push('UNDO MERGED | "' + uText + '" | two undoable toasts with the same words became one, so the first undo is lost (A2: never merge an undoable toast)'); }
      }
    } else {
      notes.push('no Undo button appeared for opts.undo, so the Undo findings did not run');
    }
    await dismissAll();

    /* errors stay longer than ordinary toasts, and nothing goes before it can be read */
    var info = await make('kz check ' + (++seq) + ' info lifetime', 'info', false);
    var err = await make('kz check ' + (++seq) + ' error lifetime', 'err', false);
    if (info && info.node && err && err.node) {
      var start = performance.now(), infoGone = null, errGone = null;
      while (performance.now() - start < 12000 && (infoGone === null || errGone === null)) {
        await wait(250); settle();
        var now = performance.now() - start;
        if (infoGone === null && !shown(info.node)) { infoGone = now; }
        if (errGone === null && !shown(err.node)) { errGone = now; }
      }
      if (errGone !== null && (infoGone === null || errGone < infoGone)) {
        problems.push('ERROR SHORT | error gone after ' + (errGone / 1000).toFixed(1) + 's, ordinary toast after ' + (infoGone === null ? 'over 12' : (infoGone / 1000).toFixed(1)) + 's | errors stay longer than successes (about 8s, or until dismissed)');
      }
      if (infoGone !== null && infoGone + 250 < 2000) {
        problems.push('TOO FAST | ordinary toast gone after ' + (infoGone / 1000).toFixed(1) + 's | too short to read (about 3.5s for a success)');
      }
    }
    await dismissAll();

    /* a toast is above whatever modal or sheet is open */
    var dlg = Array.prototype.filter.call(document.querySelectorAll('dialog:not([open])'), function (d) { return !skipped(d) && typeof d.showModal === 'function'; })[0];
    var openSheet = Array.prototype.filter.call(document.querySelectorAll('dialog[open], [aria-modal="true"], [role="dialog"], [class*="sheet" i], [class*="drawer" i]'), function (d) {
      var cs = getComputedStyle(d);
      return !skipped(d) && shown(d) && (cs.position === 'fixed' || d.matches('dialog[open]'));
    })[0];
    var opened = false;
    if (!openSheet && dlg) { try { dlg.showModal(); opened = true; openSheet = dlg; } catch (e) { /* not allowed here */ } await wait(120); settle(); }
    if (openSheet) {
      var over = await make('kz check ' + (++seq) + ' over a dialog', 'info', false);
      if (over && over.node) {
        var r = over.node.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (!hit || !over.node.contains(hit)) {
          problems.push('UNDER DIALOG | ' + (openSheet.id ? '#' + openSheet.id : openSheet.tagName.toLowerCase()) + ' | with it open, a toast is underneath it (the point at the toast\'s centre is ' +
            (hit ? (hit.id ? '#' + hit.id : hit.tagName.toLowerCase()) : 'nothing') + '): mount the region inside the open dialog, or in the top layer');
        }
      }
      await dismissAll();
      if (opened) { dlg.close(); await wait(80); }
    } else {
      notes.push('no dialog or sheet on this page, so UNDER DIALOG was not measured');
    }
  } else if (triggers.length) {
    /* no function: press the triggers the page marked safe */
    for (var i = 0; i < triggers.length && i < 5; i++) {
      var tr = triggers[i], w1 = watch();
      tr.click(); await wait(250); settle();
      var add1 = w1.stop().filter(function (n) { return shown(n) && (n.textContent || '').trim() && !skipped(n); });
      var deep = add1.length ? add1[0] : null;
      while (deep && deep.firstElementChild && deep.children.length === 1 && !card(deep)) { deep = deep.firstElementChild; }
      var node1 = deep ? itemOf(deep) : null;
      if (!node1) { notes.push('trigger ' + (tr.id ? '#' + tr.id : tr.textContent.trim().slice(0, 24)) + ' made no new toast'); continue; }
      made.push(node1);
      if (!live(node1) && !problems.some(function (p) { return /^NO LIVE/.test(p); })) { problems.push('NO LIVE | "' + node1.textContent.trim().slice(0, 40) + '" | the toast is not inside a live region'); }
      if (!closer(node1)) { problems.push('NO CLOSE | "' + node1.textContent.trim().slice(0, 40) + '" | the toast has no dismiss control'); }
      if (tr.getAttribute('data-kz-toast-test') !== 'undo') {
        var w2 = watch(), words = node1.textContent.replace(/x\d+|\u00d7\s*\d+/g, '').trim().slice(0, 30);
        tr.click(); await wait(250); settle(); w2.stop();
        var copies = holders(words).map(itemOf).filter(function (n, k2, all) { return all.indexOf(n) === k2; });
        if (copies.length > 1) { problems.push('RESTACK | "' + words + '" | pressing the trigger twice put ' + copies.length + ' copies on screen (A2)'); }
        else if (!node1.isConnected) { problems.push('REMOUNT | "' + words + '" | pressing the trigger twice replaced the toast with a new node (A2)'); }
      }
      await dismissAll();
    }
  } else {
    advisory.push('NO HOOK | no window.kzToast / toast / showToast and no [data-kz-toast-test] trigger, so only the static findings ran');
  }

  if (!hook && !triggers.length && !outer.length) { notes.push('no toast region on this page'); }
  if (problems.length) {
    console.warn('toast check: ' + problems.length + ' problem(s)');
    problems.forEach(function (p) { console.log('  ' + p); });
  } else {
    console.log('%ctoast check: clean' + (hook ? ' - measured through window.' + hookName : ''), 'color:#1f7a4d;font-weight:700');
  }
  if (advisory.length) { console.log('  advisory (' + advisory.length + '):'); advisory.forEach(function (x) { console.log('    ' + x); }); }
  notes.forEach(function (n) { console.log('  note: ' + n); });
  return problems.length ? problems.concat(advisory, notes) :
    ['clean (' + (hook ? 'measured through window.' + hookName : triggers.length ? triggers.length + ' marked triggers' : 'static only') + ')'].concat(advisory, notes);
})();
