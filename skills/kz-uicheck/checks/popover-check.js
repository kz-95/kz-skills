/* popover-check.js - paste into the browser console on any page (rule N2).

   Opens every dropdown, menu and popover on the page and asserts it can be CLOSED, by every route:

     STUCK    clicking the trigger a second time did not close it (it re-opened it, or did nothing).
              The commonest bug: the trigger's handler always opens, and the outside-click handler
              exempts the trigger, so nothing ever closes it. On a phone there is no Escape and the
              panel can cover the screen, so the user is trapped.
     ESCAPE   Escape did not close it.
     OUTSIDE  a click on empty page did not close it.
     PICKCLOSE  choosing one value closed a MULTI-select panel. A multi-select stays open until the
              user dismisses it, so applying a choice from inside it must leave it open - including
              when applying changes the page behind it. Checked with the region behind the panel
              scrolled first: when applying the choice shrinks that region the browser clamps its
              scrollTop, and a dismiss-on-scroll handler can read the clamp as a user scroll. At
              scrollTop 0 nothing clamps, so an unscrolled check cannot see that failure.
     NODONE   (advisory, touch widths) a panel with controls in it has no visible close control - a Done or
              close button. A read-only bubble with nothing to leave open is not asked for one.
              With no Escape key, and a panel that may cover its own trigger, a touch user has only
              the outside tap.

   A trigger is any visible element with aria-expanded, or aria-haspopup other than "false". A tap is
   sent as the whole pointer sequence, because handlers hang off pointerdown, mousedown or click.
   A trigger that does not open anything is skipped. Opt a trigger out with data-popover-check="skip".
   Restores the page: everything it opened is closed again. Returns a promise of the problem list. */
(async function popoverCheck() {
  var problems = [], advisory = [], wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var TOUCH = window.innerWidth < 768 || matchMedia('(pointer: coarse)').matches;

  function label(el) {
    return el.id ? '#' + el.id : (el.getAttribute('aria-label') || (el.textContent || '').trim().slice(0, 24) || el.tagName.toLowerCase());
  }
  function visible(el) {
    var r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
  }
  function tap(el) {
    ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(function (t) {
      var Ctor = t.indexOf('pointer') === 0 ? PointerEvent : MouseEvent;
      el.dispatchEvent(new Ctor(t, { bubbles: true, cancelable: true, view: window, pointerType: 'mouse', button: 0 }));
    });
  }
  function laidOut(el) {
    /* Like visible(), but ignores opacity. A panel that fades in is laid out at opacity 0 for
       the length of its transition; treating that as hidden resolved no panel at all, which
       SKIPPED the routes below instead of failing them - seven filter panels reported clean
       without being tested. Known limit: a panel parked at opacity 0 while closed is laid out
       too, so it stays in `before` and the diff still cannot see it open. */
    var r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  }
  function scrollerFor(el) {       /* the scrollable region the trigger sits in, if any */
    for (var p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      var oy = getComputedStyle(p).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight + 1) { return p; }
    }
    return null;
  }
  function openPanels() {          /* what is laid out that looks like a floating panel */
    return Array.prototype.filter.call(
      document.querySelectorAll('[role="dialog"],[role="menu"],[role="listbox"],[role="tooltip"],[popover],[data-show],.popover,.dropdown-menu'),
      laidOut);
  }
  function isOpen(trigger, before) {
    if (trigger.hasAttribute('aria-expanded')) { return trigger.getAttribute('aria-expanded') === 'true'; }
    return openPanels().some(function (p) { return before.indexOf(p) < 0; });
  }
  async function close(trigger, before) {
    for (var i = 0; i < 3 && isOpen(trigger, before); i++) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await wait(40); }
    if (isOpen(trigger, before)) { tap(document.body); await wait(40); }
  }

  var triggers = Array.prototype.filter.call(
    document.querySelectorAll('[aria-expanded], [aria-haspopup]:not([aria-haspopup="false"])'),
    function (el) {
      return visible(el) && !el.disabled && !el.closest('[data-popover-check="skip"]') &&
             el.getAttribute('data-popover-check') !== 'skip' && !el.closest('[inert]');
    });

  for (var i = 0; i < triggers.length; i++) {
    var t = triggers[i], before = openPanels();
    t.scrollIntoView({ block: 'center', behavior: 'instant' });
    await wait(30);
    tap(t); await wait(60);
    if (!isOpen(t, before)) { continue; }                          /* it opens nothing: not a popover */
    var panel = openPanels().filter(function (p) { return before.indexOf(p) < 0; })[0] ||
                (t.getAttribute('aria-controls') && document.getElementById(t.getAttribute('aria-controls')));

    /* a visible close control on touch - looked for while the panel is OPEN, not after the toggle tests closed it */
    if (TOUCH && panel) {
      var closer = Array.prototype.filter.call(panel.querySelectorAll('button, [role="button"], a'), function (b) {
        return visible(b) && /^(done|close|cancel|dismiss|ok|apply|x|×|✕)$/i.test((b.textContent || b.getAttribute('aria-label') || '').trim());
      })[0];
      var hasControls = !!panel.querySelector('input, select, textarea, button, [role="option"], [role="menuitem"], a[href]');
      if (!closer && hasControls) { advisory.push('NODONE | ' + label(t) + ' | on touch the panel has no visible Done or close button'); }
    }
    /* 0. a multi-select panel stays open while its own options are chosen */
    if (panel) {
      var opts = Array.prototype.filter.call(
        panel.querySelectorAll('input[type="checkbox"], [role="option"]'), visible);
      if (opts.length > 1) {
        var region = scrollerFor(t), restore = region ? region.scrollTop : 0;
        if (region) { region.scrollTop = region.scrollHeight; await wait(50); }
        var from = region ? region.scrollTop : 0;
        /* Empty the selection FIRST. Ticking one value out of a full set changes the result by one
           row and nothing reflows; going from nothing selected to one selected is what collapses the
           region behind the panel and then grows it back, and that reflow is what scrolls the page.
           Checking the full-set case only is why this passed over a live instance of the defect. */
        var clearer = Array.prototype.filter.call(panel.querySelectorAll('button, a, [role="button"]'), function (b) {
          return visible(b) && /^(clear|clear selection|clear all|none|deselect all|select none)$/i
            .test((b.textContent || b.getAttribute('aria-label') || '').trim());
        })[0];
        if (clearer) { tap(clearer); await wait(160); }
        else { for (var c = 0; c < opts.length; c++) { if (opts[c].checked) { tap(opts[c]); await wait(30); } } }
        if (!isOpen(t, before)) {
          problems.push('PICKCLOSE | ' + label(t) + ' | clearing the selection closed the multi-select panel');
          tap(t); await wait(60);
        }
        opts = Array.prototype.filter.call(
          panel.querySelectorAll('input[type="checkbox"], [role="option"]'), visible);
        if (!opts.length) { if (region) { region.scrollTop = restore; } continue; }
        tap(opts[0]); await wait(160);
        if (!isOpen(t, before)) {
          problems.push('PICKCLOSE | ' + label(t) + ' | choosing one value closed the multi-select panel' +
            (region && region.scrollTop !== from
              ? ' - the region behind it was scrolled to ' + from + ' and applying the choice clamped it to ' +
                region.scrollTop + ', which a dismiss-on-scroll handler reads as a user scroll'
              : ''));
          tap(t); await wait(60);                      /* reopen, so the routes below are still tested */
        }
        var again = Array.prototype.filter.call(
          panel.querySelectorAll('input[type="checkbox"], [role="option"]'), visible)[0];
        if (again) { tap(again); await wait(80); }     /* put the selection back */
        if (region) { region.scrollTop = restore; }
        if (!isOpen(t, before)) { tap(t); await wait(60); }
      }
    }
    var wasFloating = !!(panel && (before.indexOf(panel) < 0 || getComputedStyle(panel).position !== 'static'));
    /* 1. its own trigger toggles it */
    tap(t); await wait(60);
    if (isOpen(t, before)) {
      problems.push('STUCK | ' + label(t) + ' | tapping the trigger again did not close it' +
                    ' - the trigger opens and nothing closes it; on a phone there is no Escape');
      await close(t, before);
    }
    /* An inline disclosure (expand / collapse) opens nothing floating: only the toggle applies to it. */
    if (!wasFloating) { continue; }
    /* 2. Escape */
    tap(t); await wait(60);
    if (isOpen(t, before)) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
      (document.activeElement || document.body).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
      await wait(60);
      if (isOpen(t, before)) { problems.push('ESCAPE | ' + label(t) + ' | Escape did not close it'); await close(t, before); }
    }
    /* 3. a click on empty page */
    tap(t); await wait(60);
    if (isOpen(t, before)) {
      tap(document.body); await wait(60);
      if (isOpen(t, before)) { problems.push('OUTSIDE | ' + label(t) + ' | a click outside did not close it'); await close(t, before); }
    }
    if (isOpen(t, before)) { await close(t, before); }
  }

  if (problems.length) {
    console.warn('popover check: ' + problems.length + ' problem(s) in ' + triggers.length + ' trigger(s)');
    problems.forEach(function (p) { console.log('  ' + p); });
  } else {
    console.log('%cpopover check: clean - ' + triggers.length + ' trigger(s) opened and closed', 'color:#1f7a4d;font-weight:700');
  }
  if (advisory.length) { console.log('  advisory (' + advisory.length + '):'); advisory.forEach(function (a) { console.log('    ' + a); }); }
  return problems.length ? problems.concat(advisory) : ['clean (' + triggers.length + ' triggers)'].concat(advisory);
})();
