/* popover-check.js - paste into the browser console on any page (rule N2).

   Opens every dropdown, menu and popover on the page and asserts it can be CLOSED, by every route:

     STUCK    clicking the trigger a second time did not close it (it re-opened it, or did nothing).
              The commonest bug: the trigger's handler always opens, and the outside-click handler
              exempts the trigger, so nothing ever closes it. On a phone there is no Escape and the
              panel can cover the screen, so the user is trapped.
     ESCAPE   Escape did not close it.
     OUTSIDE  a click on empty page did not close it.
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
  function openPanels() {          /* what is visible that looks like a floating panel */
    return Array.prototype.filter.call(
      document.querySelectorAll('[role="dialog"],[role="menu"],[role="listbox"],[role="tooltip"],[popover],[data-show],.popover,.dropdown-menu'),
      visible);
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
