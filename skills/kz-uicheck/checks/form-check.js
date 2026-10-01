/* form-check.js - paste into the browser console on any page (rules F1, F2).

   Reads every form's fields, then exercises them the way a person would, and reports:

     NOLABEL    a field with no label of its own: no <label for>, no wrapping label, no aria-label or
                aria-labelledby. A placeholder is not a label; it disappears when the person types. (F2)
     TYPE       a field about an email, phone or address that is type="text", so the phone shows the wrong
                keyboard and autofill offers nothing. (F2)
     EAGER      the field flags an error while it is still being typed into: one character and it is red. (F2)
     NONUDGE    a required field was left empty on the way out and nothing changed: no mark, no message. (F1)
     SUBMIT     submitting with required fields empty did not put the cursor in the first empty one. (F1)
     NOCOUNT    (advisory) that submit did not say how many fields are missing. (F1)
     REQMARK    (advisory) a required field's label does not say so, or an optional one is not marked optional
                in a form that has required ones. (F1)

   It types into and leaves fields, and attempts one submit per form with its required fields empty (the
   submit is cancelled so nothing is sent, but the page's own handler runs). Run it on a fresh page, and
   reload afterwards: it leaves the error states it provoked showing. Opt a form or field out with
   data-form-check="skip". A form with data-confirm (a sensitive step that wants a deliberate submit) is
   not submitted. Returns a promise of the problem list. */
(async function formCheck() {
  var problems = [], advisory = [];
  var wait = function (ms) {
    return new Promise(function (r) {          /* setTimeout is throttled in a hidden tab; a message channel is not */
      var end = performance.now() + ms, ch = new MessageChannel();
      ch.port1.onmessage = function () { if (performance.now() >= end) { r(); } else { ch.port2.postMessage(0); } };
      ch.port2.postMessage(0);
    });
  };
  function visible(el) {
    var r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  }
  function skipped(el) { return !!el.closest('[data-form-check="skip"], [inert], [hidden]'); }
  function name(el) { return el.id ? '#' + el.id : (el.name || el.getAttribute('aria-label') || el.tagName.toLowerCase()); }
  function setValue(el, v) {
    var proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function labelText(el) {
    var t = '';
    if (el.id) { var l = document.querySelector('label[for="' + (window.CSS && CSS.escape ? CSS.escape(el.id) : el.id) + '"]'); if (l) { t += ' ' + l.textContent; } }
    var w = el.closest('label'); if (w) { t += ' ' + w.textContent; }
    var by = el.getAttribute('aria-labelledby');
    if (by) { by.split(/\s+/).forEach(function (i) { var n = document.getElementById(i); if (n) { t += ' ' + n.textContent; } }); }
    t += ' ' + (el.getAttribute('aria-label') || '');
    return t.replace(/\s+/g, ' ').trim();
  }
  /* what a person could see change around a field: its marks, its message, its border */
  function sig(el) {
    var cs = getComputedStyle(el), box = el.parentElement && el.parentElement.parentElement && !/FORM|BODY/.test(el.parentElement.parentElement.tagName) ? el.parentElement.parentElement : el.parentElement;
    return [el.getAttribute('aria-invalid') === 'true', cs.borderTopColor, cs.boxShadow, cs.outlineColor + cs.outlineStyle, box ? box.innerText : '', el.validationMessage && el.matches(':user-invalid') ? 'u' : ''].join('|');
  }
  function isHidden(el) { return el.type === 'hidden' || el.type === 'submit' || el.type === 'button' || el.type === 'checkbox' || el.type === 'radio' || el.type === 'file' || el.type === 'range' || el.type === 'color' || el.type === 'password'; }

  /* A border that is still transitioning from the focus ring reads as "something changed". Freeze transitions. */
  var freeze = document.createElement('style');
  freeze.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}';
  document.head.appendChild(freeze);

  var forms = Array.prototype.filter.call(document.querySelectorAll('form'), function (f) { return visible(f) && !skipped(f); });
  /* fields that sit in no <form> (a search box, a field wired by script) are checked as one group: they
     still need a label, the right type, and no scolding while typed into. They are never submitted. */
  var orphans = Array.prototype.filter.call(document.querySelectorAll('input, textarea, select'), function (el) { return !el.form && !el.disabled && el.type !== 'hidden' && visible(el) && !skipped(el); });
  var loose = { _orphans: orphans, id: '', hasAttribute: function () { return true; }, querySelectorAll: function () { return orphans; }, parentElement: null, innerText: '', loose: true };
  if (orphans.length) { forms.push(loose); }
  var fieldsRead = 0;

  for (var fi = 0; fi < forms.length; fi++) {
    var form = forms[fi], fname = form.loose ? '(no form)' : (form.id ? '#' + form.id : 'form' + fi);
    var fields = Array.prototype.filter.call(form.querySelectorAll('input, textarea, select'), function (el) {
      return !el.disabled && el.type !== 'hidden' && visible(el) && !skipped(el);
    });
    var required = fields.filter(function (el) { return el.required || el.getAttribute('aria-required') === 'true'; });
    fieldsRead += fields.length;

    /* labels, types, marks: reads only */
    fields.forEach(function (el) {
      if (el.type === 'submit' || el.type === 'button') { return; }
      var lab = labelText(el), hay = (el.id + ' ' + el.name + ' ' + (el.getAttribute('autocomplete') || '') + ' ' + lab + ' ' + (el.placeholder || '')).toLowerCase();
      if (!lab) { problems.push('NOLABEL | ' + fname + ' ' + name(el) + ' | no label, aria-label or aria-labelledby (a placeholder is not a label)'); }
      if (el.tagName === 'INPUT' && el.type === 'text') {
        var want = /e-?mail/.test(hay) ? 'email' : /\b(phone|mobile|tel|whatsapp)\b/.test(hay) ? 'tel' : /\b(url|website)\b/.test(hay) ? 'url' : '';
        if (want) { problems.push('TYPE | ' + fname + ' ' + name(el) + ' | looks like a ' + want + ' field but is type="text": wrong keyboard, no autofill (use type="' + want + '")'); }
      }
      if (required.length) {
        var isReq = required.indexOf(el) > -1;
        if (isReq && !/\*|required|wajib/i.test(lab + ' ' + ((el.closest('label') || {}).textContent || '') + ' ' + (document.querySelector('label[for="' + el.id + '"] .star, label[for="' + el.id + '"] [class*="req"]') ? '*' : ''))) {
          advisory.push('REQMARK | ' + fname + ' ' + name(el) + ' | required, but its label does not say so (asterisk or the word) before it is missed');
        }
        if (!isReq && el.type !== 'submit' && !/optional|pilihan/i.test(lab)) {
          advisory.push('REQMARK | ' + fname + ' ' + name(el) + ' | optional in a form that has required fields, but not marked optional');
        }
      }
    });

    /* F2: no error while typing. Only fields where one character is certainly not yet valid. */
    var eagerable = fields.filter(function (el) {
      return el.tagName === 'INPUT' && !el.value && (el.type === 'email' || el.type === 'url' ||
        (el.type === 'text' && /e-?mail/i.test(el.id + el.name + (el.getAttribute('autocomplete') || '') + labelText(el))));
    });
    for (var ei = 0; ei < eagerable.length; ei++) {
      var e = eagerable[ei];
      e.focus({ preventScroll: true });
      var s0 = sig(e);
      setValue(e, e.type === 'url' ? 'h' : 'a'); await wait(120);
      if (document.activeElement === e && sig(e) !== s0) { problems.push('EAGER | ' + fname + ' ' + name(e) + ' | an error shows after one character, while the person is still typing (check on blur, clear on input)'); }
      setValue(e, ''); await wait(40);
    }

    /* F1: leaving a required field empty nudges it */
    var nudgeable = required.filter(function (el) { return !el.value && !isHidden(el) && el.tagName !== 'SELECT'; }).slice(0, 3);
    for (var ni = 0; ni < nudgeable.length; ni++) {
      var n = nudgeable[ni];
      if (form.hasAttribute('data-confirm')) { break; }
      n.focus({ preventScroll: true }); await wait(40);
      var before = sig(n);
      n.blur();
      if (!document.hasFocus()) {               /* a window that is not focused fires no blur: send the events a person would cause */
        n.dispatchEvent(new FocusEvent('blur')); n.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      }
      await wait(140);
      if (sig(n) === before) { problems.push('NONUDGE | ' + fname + ' ' + name(n) + ' | left empty on the way out and nothing changed: no mark, no message beside it'); }
    }

    /* F1: submit with the required fields empty */
    if (required.length && !form.hasAttribute('data-confirm') && required.every(function (el) { return !el.value; })) {
      var cancel = function (ev) { ev.preventDefault(); };
      window.addEventListener('submit', cancel, true);
      var firstEmpty = required.filter(function (el) { return !isHidden(el); })[0];
      if (document.activeElement && document.activeElement.blur) { document.activeElement.blur(); }
      try { form.requestSubmit(); } catch (x) { /* no submit button: nothing to test */ }
      await wait(200);
      window.removeEventListener('submit', cancel, true);
      if (firstEmpty && document.activeElement !== firstEmpty) {
        problems.push('SUBMIT | ' + fname + ' | submitted with ' + required.length + ' required field(s) empty and the cursor did not land in the first one (' + name(firstEmpty) + ')');
      }
      var live = Array.prototype.map.call(document.querySelectorAll('[role="status"], [role="alert"], [aria-live]'), function (n) { return n.innerText; }).join(' ');
      var text = (form.innerText + ' ' + (form.parentElement ? form.parentElement.innerText : '') + ' ' + live).toLowerCase();   /* a count may sit in a toast */
      if (required.length > 1 && !/\b\d+\b[^.]{0,40}(missing|required|empty|fill|field|left)|(missing|required|empty|fill|field)[^.]{0,40}\b\d+\b|\b(two|three|four)\b[^.]{0,30}(missing|required|empty|field)/.test(text)) {
        advisory.push('NOCOUNT | ' + fname + ' | a refused submit with ' + required.length + ' empty required fields does not say how many are missing');
      }
    }
  }

  freeze.remove();
  if (problems.length) {
    console.warn('form check: ' + problems.length + ' problem(s) in ' + forms.length + ' form(s), ' + fieldsRead + ' fields');
    problems.forEach(function (p) { console.log('  ' + p); });
  } else {
    console.log('%cform check: clean - ' + forms.length + ' form(s), ' + fieldsRead + ' fields', 'color:#1f7a4d;font-weight:700');
  }
  if (advisory.length) { console.log('  advisory (' + advisory.length + '):'); advisory.forEach(function (a) { console.log('    ' + a); }); }
  console.log('  (reload the page: this check leaves the error states it provoked showing)');
  return problems.length ? problems.concat(advisory) : ['clean (' + forms.length + ' forms, ' + fieldsRead + ' fields)'].concat(advisory);
})();
