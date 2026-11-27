/* Agree check: one quantity shows one value on every screen, and shown parts add up to the shown
   total (rule V4, Appendix V of kz-uiuxrule/rules/ui-rules.md).

   A balance, the amount left or a total that appears in two places is two chances to disagree,
   and a reviewer finds the mismatches one at a time. This reads what the page actually shows.
   The page marks what it shows:

     data-quantity="left-today"   every element that shows that quantity, on any screen
     data-total="trip"            the element that shows a total
     data-part-of="trip"          each element that shows one of its parts

   It reads the first number in each marked element's visible text (thousands separators, a
   currency sign, a leading minus or a bracketed negative), including elements that are hidden
   right now, because another screen is still a screen.

     DISAGREE     two elements marked with the same data-quantity show different numbers
     SUM          the parts of a total do not add up to the shown total, compared at the most
                  decimals any of them shows (33.33 + 33.33 + 33.33 against 100.00 fails)
     NO NUMBER    a marked element shows no number at all
     NO PARTS     a data-total with no data-part-of for it, or parts with no total
     NO MARKS     (advisory) nothing is marked; a page that shows a figure twice must mark it

   Opt a deliberately wrong sample out with data-agree-check="skip". Synchronous; returns the
   problem list, or ['clean ...']. */
(function agreeCheck() {
  var problems = [], advisory = [];
  var SKIP = '[data-agree-check="skip"]';
  function label(el) {
    return el.id ? '#' + el.id : '"' + (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28) + '"';
  }
  /* the first number in the text: "W12,500 left" -> 12500, "-RM 3.50" -> -3.5, "(1,200)" -> -1200 */
  function num(el) {
    var t = (el.textContent || '').replace(/\s+/g, ' ');
    var m = /(\(|[-\u2212]|\b)\s*[^\d\s(\-\u2212]{0,4}\s*([-\u2212])?\s*(\d[\d,]*(?:\.\d+)?)/.exec(t);
    if (!m) { return null; }
    var digits = m[3].replace(/,/g, ''), v = parseFloat(digits);
    if (m[1] === '(' || m[1] === '-' || m[1] === '\u2212' || m[2]) { v = -v; }
    return { v: v, dp: (digits.split('.')[1] || '').length, text: t.trim().slice(0, 40) };
  }
  function marked(attr) {
    var out = {};
    Array.prototype.forEach.call(document.querySelectorAll('[' + attr + ']'), function (el) {
      if (el.closest(SKIP)) { return; }
      var k = el.getAttribute(attr);
      (out[k] = out[k] || []).push(el);
    });
    return out;
  }

  var qty = marked('data-quantity'), totals = marked('data-total'), parts = marked('data-part-of');
  var count = 0;

  Object.keys(qty).forEach(function (k) {
    var seen = [];
    qty[k].forEach(function (el) {
      count++;
      var n = num(el);
      if (!n) { problems.push('NO NUMBER | ' + label(el) + ' | marked data-quantity="' + k + '" but shows no number (V4)'); return; }
      seen.push({ el: el, n: n });
    });
    var dp = Math.max.apply(null, seen.map(function (s) { return s.n.dp; }).concat([0]));
    var vals = seen.map(function (s) { return Math.round(s.n.v * Math.pow(10, dp)); });
    if (vals.some(function (v) { return v !== vals[0]; })) {
      problems.push('DISAGREE | ' + k + ' | the same quantity shows ' +
        seen.map(function (s) { return '"' + s.n.text + '"' + (s.el.id ? ' (#' + s.el.id + ')' : ''); }).join(' vs ') +
        ' - read every screen from one function (V4)');
    }
  });

  Object.keys(totals).concat(Object.keys(parts)).filter(function (k, i, a) { return a.indexOf(k) === i; }).forEach(function (k) {
    var t = totals[k] || [], p = parts[k] || [];
    count += t.length + p.length;
    if (!t.length || !p.length) {
      problems.push('NO PARTS | ' + k + ' | ' + (t.length ? 'a total with no data-part-of="' + k + '"' : p.length + ' part(s) with no data-total="' + k + '"') + ' (V4)');
      return;
    }
    var pn = p.map(num), tn = t.map(num);
    if (pn.concat(tn).some(function (n) { return !n; })) {
      problems.push('NO NUMBER | ' + k + ' | a marked total or part shows no number (V4)');
      return;
    }
    var dp = Math.max.apply(null, pn.concat(tn).map(function (n) { return n.dp; }));
    var f = Math.pow(10, dp), sum = pn.reduce(function (a, n) { return a + Math.round(n.v * f); }, 0);
    tn.forEach(function (n, i) {
      if (Math.round(n.v * f) !== sum) {
        problems.push('SUM | ' + k + ' | the parts add up to ' + (sum / f).toFixed(dp) + ' but ' + label(t[i]) + ' shows ' +
          n.text + ' - round the parts, then derive the last from the rounded others (V4)');
      }
    });
  });

  if (!count) { advisory.push('NO MARKS | nothing is marked data-quantity, data-total or data-part-of; a figure shown in two places must be marked (V4)'); }
  if (problems.length) {
    console.warn('agree check: ' + problems.length + ' problem(s)');
    problems.forEach(function (x) { console.log('  ' + x); });
  } else {
    console.log('%cagree check: clean (' + count + ' marked)', 'color:#1f7a4d;font-weight:700');
  }
  advisory.forEach(function (x) { console.log('  advisory: ' + x); });
  return problems.length ? problems.concat(advisory) : ['clean (' + count + ' marked element(s))'].concat(advisory);
})();
