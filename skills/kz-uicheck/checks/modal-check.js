/* modal-check.js - paste into the browser console on any page (rule N1).

   Opens every modal dialog it can find and checks the four things a modal owes the page:

     SCROLL    the page behind can still scroll (html and body are not locked). showModal() does
               not lock it for you; this is the one that ships.
     SHIFT     the page jumped sideways when the lock removed the scrollbar. Reserve the gutter
               (scrollbar-gutter: stable) or pad by the scrollbar's width. Not measurable where
               scrollbars overlay, which is reported as a note.
     FOCUS     focus did not move inside the dialog when it opened.
     BACKDROP  the page behind is not really blocked: the dialog is not :modal and nothing is inert,
               or a click on the opener's own spot still reaches the opener.
     ESCAPE    Escape is cancelled (the cancel event is default-prevented) or does not close it.
     RETURN    after closing, focus is not back on the opener.

   Finds openers: any visible button or link with aria-haspopup="dialog", aria-controls pointing at a
   dialog, or data-modal-check. A modal that opens from elsewhere: put data-modal-check on its opener.
   A role=dialog box without aria-modal="true" is a popover and is skipped; popover-check.js covers those.
   Opt out with data-modal-check="skip". Restores the page. Returns a promise of the problem list. */
(async function modalCheck() {
  var problems = [], notes = [], wait = function (ms) {
    /* setTimeout is throttled to about a second in a hidden tab or pane, which turns a 3 second check into minutes.
       Spin on a message channel instead: the same elapsed time, never throttled. */
    return new Promise(function (r) {
      var end = performance.now() + ms, ch = new MessageChannel();
      ch.port1.onmessage = function () { if (performance.now() >= end) { r(); } else { ch.port2.postMessage(0); } };
      ch.port2.postMessage(0);
    });
  };

  function label(el) {
    return el.id ? '#' + el.id : (el.getAttribute('aria-label') || (el.textContent || '').trim().slice(0, 24) || el.tagName.toLowerCase());
  }
  function visible(el) {
    var r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  }
  function tap(el) {
    ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(function (t) {
      var C = t.indexOf('pointer') === 0 ? PointerEvent : MouseEvent;
      el.dispatchEvent(new C(t, { bubbles: true, cancelable: true, view: window, pointerType: 'mouse', button: 0 }));
    });
  }
  function surfaces() {
    return Array.prototype.filter.call(
      document.querySelectorAll('dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"]'), visible);
  }
  /* a native <dialog> is modal once opened with showModal(); a role=dialog box is a modal only if it says so, otherwise it is a popover */
  function isModal(d) { return d.matches('dialog') || d.getAttribute('aria-modal') === 'true'; }
  function locked() {
    var h = getComputedStyle(document.documentElement), b = getComputedStyle(document.body);
    return h.overflowY === 'hidden' || b.overflowY === 'hidden' || b.position === 'fixed' || h.overflowY === 'clip' || b.overflowY === 'clip';
  }
  function scrollable() { return document.documentElement.scrollHeight > window.innerHeight + 1; }
  function isOpen(d) { return d.matches('dialog') ? d.open : visible(d); }
  async function closeIt(d, opener) {
    if (!isOpen(d)) { return; }
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    (document.activeElement || document.body).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    await wait(80);
    if (isOpen(d) && d.matches('dialog')) { d.close(); await wait(60); }
    if (isOpen(d)) { var x = d.querySelector('[data-close],[aria-label*="lose" i],button'); if (x) { tap(x); await wait(60); } }
  }

  var openers = Array.prototype.filter.call(
    document.querySelectorAll('[aria-haspopup="dialog"], [aria-controls], [data-modal-check]'),
    function (el) {
      if (el.closest('[data-modal-check="skip"]') || el.getAttribute('data-modal-check') === 'skip') { return false; }
      if (!visible(el) || el.disabled || el.closest('[inert]')) { return false; }
      if (el.hasAttribute('data-modal-check') || el.getAttribute('aria-haspopup') === 'dialog') { return true; }
      var t = document.getElementById(el.getAttribute('aria-controls'));
      return !!(t && (t.matches('dialog, [role="dialog"], [role="alertdialog"]')));
    });

  /* a page can have a hundred identical triggers (one per table column): test the first three of each kind */
  var seen = {};
  openers = openers.filter(function (el) {
    var k = el.tagName + '.' + (el.getAttribute('class') || '').split(/\s+/)[0] + '|' + (el.getAttribute('aria-controls') || '');
    seen[k] = (seen[k] || 0) + 1;
    return seen[k] <= 3 || el.hasAttribute('data-modal-check');
  });

  var gutter = window.innerWidth - document.documentElement.clientWidth;
  var tested = 0;
  for (var i = 0; i < openers.length; i++) {
    var op = openers[i], before = surfaces();
    op.scrollIntoView({ block: 'center', behavior: 'instant' });
    await wait(40);
    var left0 = op.getBoundingClientRect().left, canScroll = scrollable();
    op.focus({ preventScroll: true });
    tap(op); await wait(160);
    var dlg = surfaces().filter(function (d) { return before.indexOf(d) < 0; })[0];
    if (!dlg || !isModal(dlg)) { if (dlg) { await closeIt(dlg, op); } continue; }
    tested++;
    var name = label(op);

    /* 1. the page behind does not scroll, and does not jump */
    if (canScroll && !locked()) { problems.push('SCROLL | ' + name + ' | the page behind the dialog can still scroll (html and body are not locked)'); }
    if (gutter > 0 && Math.abs(op.getBoundingClientRect().left - left0) > 0.5) {
      problems.push('SHIFT | ' + name + ' | the page moved ' + (op.getBoundingClientRect().left - left0).toFixed(1) + 'px sideways when the scrollbar went away: reserve the gutter');
    } else if (gutter === 0 && i === 0) { notes.push('scrollbars overlay here, so SHIFT cannot be measured; check in a browser with classic scrollbars'); }

    /* 2. focus is inside */
    if (!dlg.contains(document.activeElement)) { problems.push('FOCUS | ' + name + ' | focus did not move into the dialog when it opened'); }

    /* 3. the page behind is blocked */
    var blocked = dlg.matches(':modal') || !!document.querySelector('[inert]');
    var r = op.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    var leak = hit && (hit === op || op.contains(hit)) && !dlg.contains(op);
    if (!blocked || leak) {
      problems.push('BACKDROP | ' + name + ' | ' + (leak ? 'a click on the opener\'s own spot still reaches the opener' : 'the dialog is not :modal and nothing behind it is inert') + ' (use showModal(), or inert the rest)');
    }

    /* 4. Escape closes it. A native dialog is closed by the browser on a real Escape, which a script cannot
          send, so the test is that nothing cancels the cancel event. */
    var closedByEscape;
    if (dlg.matches('dialog')) {
      var ev = new Event('cancel', { cancelable: true });
      dlg.dispatchEvent(ev);
      closedByEscape = !ev.defaultPrevented;
      if (!closedByEscape) { problems.push('ESCAPE | ' + name + ' | the cancel event is default-prevented, so Escape does not close the dialog'); }
      dlg.close();
    } else {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
      dlg.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
      await wait(100);
      closedByEscape = !isOpen(dlg);
      if (!closedByEscape) { problems.push('ESCAPE | ' + name + ' | Escape did not close the dialog'); await closeIt(dlg, op); }
    }
    await wait(100);

    /* 5. focus returns to what opened it */
    if (closedByEscape && document.activeElement !== op) {
      problems.push('RETURN | ' + name + ' | after closing, focus is on ' + (document.activeElement ? label(document.activeElement) : 'nothing') + ', not the opener');
    }
    if (isOpen(dlg)) { await closeIt(dlg, op); }
  }

  if (problems.length) {
    console.warn('modal check: ' + problems.length + ' problem(s) in ' + tested + ' modal(s)');
    problems.forEach(function (p) { console.log('  ' + p); });
  } else {
    console.log('%cmodal check: clean - ' + tested + ' modal(s) opened and closed', 'color:#1f7a4d;font-weight:700');
  }
  if (!tested) { console.log('  no modal opener found: give an opener aria-haspopup="dialog" or data-modal-check'); }
  notes.forEach(function (n) { console.log('  note: ' + n); });
  return problems.length ? problems.concat(notes) : ['clean (' + tested + ' modals)'].concat(notes);
})();
