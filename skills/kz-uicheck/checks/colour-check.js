/* Colour check: a colour means one thing (rule Y4, Appendix Y of kz-uiuxrule/rules/ui-rules.md).

   Status colours carry status, the accent marks what can be acted on, and identity colours (a
   category, a currency, a person) stay clear of both and of each other. It reads the page's own
   tokens, resolved through the cascade, so it measures the theme that is on screen:

     the accent   --accent (or --primary, --brand when there is no --accent)
     status       --ok --success --good --up --positive, --warn --warning --caution,
                  --danger --error --bad --down --negative --over (and their -fg, -bg, -soft
                  variants are ignored: the base token is the hue)
     identity     every visible element marked data-identity="<name>" (a currency, a category,
                  a person); its colour is its background, or its text colour when the
                  background is transparent. One name shown many times is one identity

     ACCENT STATIC   text in the accent colour, or text on an accent background, on an element that
                     cannot be acted on and is not inside one that can (a button, link, field,
                     summary, label, [role=button|link|tab|option|checkbox|switch|menuitem] or
                     [tabindex]) - the accent then stops meaning "tap this"
     NEAR STATUS     an identity colour within 30 degrees of hue of a status colour, and
                     saturated enough to read as one, so a category reads as an alert. A
                     colour the user picked (data-user-colour on the element) is advisory
     TOO CLOSE       two identity colours under delta-E 18 (CIE76, in Lab), so neighbours blur
     NO ACCENT       (advisory) no accent token to measure ACCENT STATIC against
     NO IDENTITY     (advisory) nothing is marked data-identity

   Opt a deliberately wrong sample out with data-colour-check="skip". SVG and canvas content is
   left to the chart rules (C7). Synchronous; returns the problem list, or ['clean ...']. */
(function colourCheck() {
  var problems = [], advisory = [];
  var SKIP = '[data-colour-check="skip"], svg, canvas';
  var ACT = 'a[href], button, input, select, textarea, summary, label, [role="button"], [role="link"], [role="tab"], ' +
    '[role="option"], [role="checkbox"], [role="switch"], [role="menuitem"], [role="radio"], [tabindex]:not([tabindex="-1"])';

  function rgb(s) {
    var m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(s || '');
    if (!m) { return null; }
    var a = m[4] === undefined ? 1 : +m[4];
    return a < 0.5 ? null : [+m[1], +m[2], +m[3]];
  }
  /* a token resolved through the cascade: a probe element takes color: var(--x) */
  var probe = document.createElement('i');
  probe.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  document.body.appendChild(probe);
  function token(name) {
    probe.style.color = 'rgba(1, 2, 3, 0.01)';
    probe.style.color = 'var(' + name + ')';
    var c = getComputedStyle(probe).color;
    return /rgba\(1, 2, 3, 0\.01\)/.test(c) ? null : rgb(c);
  }
  function hsl(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    var l = (mx + mn) / 2, s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)), h = 0;
    if (d) { h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; }
    return { h: h, s: s, l: l };
  }
  function lab(c) {
    var v = c.map(function (x) { x /= 255; return x > 0.04045 ? Math.pow((x + 0.055) / 1.055, 2.4) : x / 12.92; });
    var X = (v[0] * 0.4124 + v[1] * 0.3576 + v[2] * 0.1805) / 0.95047, Y = v[0] * 0.2126 + v[1] * 0.7152 + v[2] * 0.0722,
      Z = (v[0] * 0.0193 + v[1] * 0.1192 + v[2] * 0.9505) / 1.08883;
    var f = function (t) { return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116; };
    return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
  }
  function dE(a, b) { var p = lab(a), q = lab(b); return Math.sqrt(Math.pow(p[0] - q[0], 2) + Math.pow(p[1] - q[1], 2) + Math.pow(p[2] - q[2], 2)); }
  function hueGap(a, b) { var d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }
  function same(a, b) { return a && b && Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) <= 6; }
  function hex(c) { return '#' + c.map(function (x) { return ('0' + Math.round(x).toString(16)).slice(-2); }).join(''); }
  function label(el) {
    if (el.getAttribute('data-identity')) { return el.getAttribute('data-identity'); }
    return el.id ? '#' + el.id : '"' + (el.textContent || el.getAttribute('aria-label') || el.tagName.toLowerCase()).replace(/\s+/g, ' ').trim().slice(0, 24) + '"';
  }
  function visible(el) {
    var r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && parseFloat(s.opacity) > 0;
  }

  var accent = token('--accent') || token('--primary') || token('--brand');
  var status = [];
  ['--ok', '--success', '--good', '--up', '--positive', '--warn', '--warning', '--caution',
    '--danger', '--error', '--bad', '--down', '--negative', '--over'].forEach(function (n) {
    var c = token(n);
    if (c && hsl(c).s > 0.25) { status.push({ name: n, c: c }); }
  });
  probe.remove();

  /* ACCENT STATIC */
  if (!accent) {
    advisory.push('NO ACCENT | no --accent, --primary or --brand token, so ACCENT STATIC was not measured (Y4)');
  } else if (hsl(accent).s > 0.15) {
    var flagged = 0, first = null;
    Array.prototype.forEach.call(document.querySelectorAll('body *'), function (el) {
      if (el.closest(SKIP) || el.closest(ACT) || el.matches(ACT) || !visible(el)) { return; }
      var s = getComputedStyle(el), own = Array.prototype.some.call(el.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); });
      /* only what carries words: a swatch or a bar with no text is a chart mark, left to C7 */
      if (own && (same(rgb(s.color), accent) || same(rgb(s.backgroundColor), accent))) {
        if (el.querySelector(ACT)) { return; }                 /* a wrapper whose content is the action */
        flagged++; first = first || el;
      }
    });
    if (flagged) {
      problems.push('ACCENT STATIC | ' + flagged + ' element(s) | the accent ' + hex(accent) + ' colours something that cannot be acted on, e.g. ' +
        label(first) + ' - the accent means "you can act on this"; use the text or a status colour (Y4)');
    }
  }

  /* NEAR STATUS and TOO CLOSE */
  var ids = [], byName = {};
  Array.prototype.forEach.call(document.querySelectorAll('[data-identity]'), function (el) {
    if (el.closest('[data-colour-check="skip"]') || !visible(el)) { return; }
    var s = getComputedStyle(el), c = rgb(s.backgroundColor) || rgb(s.color), name = el.getAttribute('data-identity');
    if (!c) { return; }
    if (name && byName[name]) { return; }                    /* one identity shown again */
    var it = { el: el, c: c, name: name, user: el.hasAttribute('data-user-colour') };
    if (name) { byName[name] = it; }
    ids.push(it);
  });
  if (!ids.length) { advisory.push('NO IDENTITY | nothing is marked data-identity, so NEAR STATUS and TOO CLOSE were not measured (Y4)'); }
  ids.forEach(function (it) {
    var h = hsl(it.c);
    if (h.s < 0.25 || h.l < 0.15 || h.l > 0.9) { return; }    /* a grey, near-black or near-white reads as no hue */
    status.forEach(function (st) {
      var gap = hueGap(h.h, hsl(st.c).h);
      if (gap < 30) {
        var line = 'NEAR STATUS | ' + label(it.el) + ' | identity ' + hex(it.c) + ' is ' + Math.round(gap) + ' degrees from ' + st.name + ' ' +
          hex(st.c) + ', so it reads as that status; keep 30 or more (Y4)';
        (it.user ? advisory : problems).push(it.user ? line.replace('NEAR STATUS', 'NEAR STATUS (user-chosen: warn, do not ban)') : line);
      }
    });
  });
  for (var i = 0; i < ids.length; i++) {
    for (var j = i + 1; j < ids.length; j++) {
      if (!ids[i].name && !ids[j].name && same(ids[i].c, ids[j].c)) { continue; }   /* unnamed: the same colour is taken as one identity */
      var d = dE(ids[i].c, ids[j].c);
      if (d < 18) {
        problems.push('TOO CLOSE | ' + label(ids[i].el) + ' and ' + label(ids[j].el) + ' | identity colours ' + hex(ids[i].c) + ' and ' + hex(ids[j].c) +
          ' are delta-E ' + d.toFixed(1) + ' apart, under 18, so they blur (Y4)');
      }
    }
  }

  if (problems.length) {
    console.warn('colour check: ' + problems.length + ' problem(s)');
    problems.forEach(function (x) { console.log('  ' + x); });
  } else {
    console.log('%ccolour check: clean (' + status.length + ' status token(s), ' + ids.length + ' identity colour(s))', 'color:#1f7a4d;font-weight:700');
  }
  advisory.forEach(function (x) { console.log('  advisory: ' + x); });
  return problems.length ? problems.concat(advisory) :
    ['clean (' + status.length + ' status token(s), ' + ids.length + ' identity colour(s)' + (accent ? ', accent ' + hex(accent) : '') + ')'].concat(advisory);
})();
