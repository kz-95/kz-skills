/* typing-check.js - paste into the browser console on any page (rule F8).

   Types into the MIDDLE of every visible text field and asserts that typing was never
   interrupted:

     REBUILT  the field was replaced or lost focus mid-word - on a phone the keyboard
              closes. Something redrew the region holding it.
     CARET    the caret jumped to the end - the value was written back on the keystroke.
     MOVED    the field moved on screen while being typed into - something above it
              changed height, or the page scrolled on input.
     ENTER    in a form of several fields, Enter in a field that is not the last does not go
              to the next one (rule F9): it submits the form half-filled, or does nothing.
     ZOOM     at phone width, a field's text is under 16px, so the browser zooms the page
              when it takes focus (the floor is in Appendix Q).

   Why the middle: typing at the end hides the caret defect, because "jumped to the end"
   and "stayed at the end" look the same. Why the native value setter: frameworks that
   track the last value they rendered ignore a plain `el.value = ...`, and the check would
   then test nothing.

   It restores every value it touched. Returns a promise of the problem list, and logs it.
   No requestAnimationFrame: a background tab never paints, and a wait on a frame that
   never comes reports every field as broken (Appendix Z, lessons 11 and 14). */
(async function typingCheck() {
  var PHONE = window.innerWidth < 768 || matchMedia('(pointer: coarse)').matches;
  var TYPED = '123';
  var problems = [];
  function note(kind, el, msg) {
    var name = el.id ? '#' + el.id : el.name ? '[name=' + el.name + ']' :
               el.tagName.toLowerCase() + (el.getAttribute('aria-label') ? '[' + el.getAttribute('aria-label') + ']' : '');
    problems.push(kind + ' | ' + name + ' | ' + msg);
  }
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  var TEXTY = /^(text|search|email|tel|url|)$/;
  var fields = Array.prototype.filter.call(
    document.querySelectorAll('input, textarea'),
    function (el) {
      if (el.tagName === 'INPUT' && !TEXTY.test(el.type)) { return false; }  /* password, number, checkbox... */
      if (el.disabled || el.readOnly || !el.offsetParent) { return false; }
      if (el.closest('dialog:not([open]), [hidden], [inert]')) { return false; }
      /* a deliberate wrong sample opts out; rules-check.js asserts that it does break */
      if (el.closest('[data-typing-check="skip"]')) { return false; }
      return true;
    });

  for (var n = 0; n < fields.length; n++) {
    var el = fields[n];
    var proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    var setValue = Object.getOwnPropertyDescriptor(proto, 'value').set;
    var original = el.value;

    if (PHONE) {
      var fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 16) { note('ZOOM', el, fs + 'px text - a phone zooms the page when this takes focus'); }
    }

    el.scrollIntoView({ block: 'center', behavior: 'instant' });  /* a smooth scroll still moving would read as MOVED */
    el.focus();
    if (!document.hasFocus()) { el.dispatchEvent(new FocusEvent('focus')); }  /* lesson 19 */
    await wait(60);                                   /* let a focus handler (F5) finish */
    var start = el.value;
    var pos = Math.min(1, start.length);              /* inside the value, not at its end */
    try { el.setSelectionRange(pos, pos); } catch (e) { continue; }
    var top0 = el.getBoundingClientRect().top, scroll0 = window.scrollY;

    var broke = '';
    for (var i = 0; i < TYPED.length && !broke; i++) {
      var v = el.value, at = el.selectionStart;
      setValue.call(el, v.slice(0, at) + TYPED[i] + v.slice(el.selectionEnd));
      el.setSelectionRange(at + 1, at + 1);
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: TYPED[i] }));
      await wait(40);                                 /* async state updates land here */
      if (!el.isConnected) { broke = 'REBUILT'; note('REBUILT', el, 'the field was replaced after keystroke ' + (i + 1)); }
      else if (document.activeElement !== el && document.hasFocus()) {
        broke = 'REBUILT'; note('REBUILT', el, 'focus left the field after keystroke ' + (i + 1));
      }
    }
    if (!broke) {
      /* a field that refuses these characters (a digit-only filter refusing nothing here,
         an email field) still must not send the caret to the end */
      var len = el.value.length;
      if (el.value !== start && el.selectionStart === len && len > pos + TYPED.length) {
        note('CARET', el, 'typing at position ' + pos + ' left the caret at the end (' + len + ')');
      }
      var moved = el.getBoundingClientRect().top - top0;
      if (Math.abs(moved) > 1) {
        note('MOVED', el, 'moved ' + Math.round(moved) + 'px while typing' +
             (window.scrollY !== scroll0 ? ' (the page scrolled)' : ''));
      }
    }
    if (el.isConnected) {
      setValue.call(el, original);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.blur();
    }
  }


  /* ENTER (rule F9): in a form of several single-line fields, Enter must go to the next one.
     A script cannot press the browser's own implicit submission, so a page that relies on the
     browser default shows no handler here, and that is the finding: Enter in the first field will
     submit a half-filled form. Wrong samples opt out with data-typing-check="skip". */
  var ENTERY = /^(text|search|email|tel|url|number|password|)$/;
  var forms = Array.prototype.filter.call(document.querySelectorAll('form, [role="form"], dialog[open]'),
    function (f) { return f.offsetParent !== null || f.tagName === 'DIALOG'; });
  for (var fi = 0; fi < forms.length; fi++) {
    var form = forms[fi];
    if (form.closest('[data-typing-check="skip"]')) { continue; }
    var singles = Array.prototype.filter.call(form.querySelectorAll('input'), function (el) {
      return ENTERY.test(el.type) && !el.disabled && !el.readOnly && el.offsetParent !== null;
    });
    if (singles.length < 2) { continue; }
    var missed = [];
    for (var si = 0; si < singles.length - 1; si++) {
      singles[si].focus();
      singles[si].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true }));
      await wait(30);
      if (document.activeElement !== singles[si + 1]) { missed.push(singles[si]); }
      if (singles[si].isConnected) { singles[si].blur(); }
    }
    if (missed.length) {
      var lab = function (el) { return el.id ? '#' + el.id : el.name || el.getAttribute('aria-label') || el.type; };
      note('ENTER', form, 'Enter does not go to the next field in ' + missed.length + ' of ' + (singles.length - 1) +
           ' places (first: ' + lab(missed[0]) + '): it will submit the form half-filled, or do nothing');
    }
  }

  window.scrollTo(0, 0);
  if (problems.length) {
    console.warn('typing check: ' + problems.length + ' problem(s) in ' + fields.length + ' fields');
    problems.forEach(function (p) { console.log('  ' + p); });
  } else {
    console.log('%ctyping check: clean - ' + fields.length + ' fields typed into' +
                (PHONE ? ', at phone width' : ''), 'color:#1f7a4d;font-weight:700');
  }
  return problems.length ? problems : ['clean (' + fields.length + ' fields)'];
})();
