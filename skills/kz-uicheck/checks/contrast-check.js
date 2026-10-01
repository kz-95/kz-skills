/* contrast-check.js - paste into the browser console on any page (rule Y2).

   Measures every piece of visible text against the background it actually sits on, and fails any that
   is under the figure the rule states: 4.5:1 for body text, 3:1 for large text (24px, or 18.66px and
   bold). It composites transparent text and transparent backgrounds, and multiplies in the opacity of
   every ancestor, because a colour that passes on paper fails when something is half faded.

     LOW      text under its figure. Reported once per colour pair, with how many elements share it.
     UNKNOWN  the background is a gradient or an image, so no single ratio exists. Reported, never
              guessed: measure it at its worst point, or give the text a backing plate (Y2).
     PLACEHOLDER  placeholder text under 4.5:1, which people read as the field's label.

   Disabled controls are exempt, as the standard exempts them. Hidden text is not read.

   It measures the theme the page is in. If the page switches theme with a data-theme attribute it
   runs both; otherwise run it again after switching, because a colour pair verified in one theme
   says nothing about the other (a label that was fine in light was 1.04:1 in dark).

   Returns the problem list; also logs it. Opt an element out with data-contrast-check="skip". */
(function contrastCheck() {
  var BODY = 4.5, LARGE = 3;

  function parse(c) {
    var m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/.exec(c || '');
    if (!m) { return null; }
    var a = m[4] === undefined ? 1 : (/%$/.test(m[4]) ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
    return [+m[1], +m[2], +m[3], a];
  }
  function over(top, base) {                      /* top colour drawn over an opaque base */
    var a = top[3];
    return [top[0] * a + base[0] * (1 - a), top[1] * a + base[1] * (1 - a), top[2] * a + base[2] * (1 - a), 1];
  }
  function lum(c) {
    var v = c.slice(0, 3).map(function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function ratio(a, b) { var l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }

  /* the background a text element really sits on: the nearest opaque colour, with any translucent
     layers between composited onto it. Returns null when an image or gradient is in the way. */
  function backdrop(el) {
    var layers = [], node = el, unknown = false;
    while (node && node.nodeType === 1) {
      var cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') { unknown = true; break; }
      var bg = parse(cs.backgroundColor);
      if (bg && bg[3] > 0) { layers.push(bg); if (bg[3] >= 1) { break; } }
      node = node.parentElement;
    }
    if (unknown) { return null; }
    var base = [255, 255, 255, 1];                /* the canvas, when nothing opaque was found */
    var root = parse(getComputedStyle(document.documentElement).backgroundColor);
    if (root && root[3] > 0) { base = over(root, base); }
    var body = parse(getComputedStyle(document.body).backgroundColor);
    if (body && body[3] > 0) { base = over(body, base); }
    for (var i = layers.length - 1; i >= 0; i--) { base = over(layers[i], base); }
    return base;
  }
  function opacityOf(el) {
    var o = 1;
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) { o *= parseFloat(getComputedStyle(n).opacity); }
    return o;
  }
  function selector(el) {
    if (el.id) { return '#' + el.id; }
    var s = el.tagName.toLowerCase(), c = (el.getAttribute('class') || '').trim().split(/\s+/)[0];
    return s + (c ? '.' + c : '');
  }
  function isLarge(cs) {
    var px = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700 || cs.fontWeight === 'bold';
    return px >= 24 || (bold && px >= 18.66);
  }
  function visible(el) {
    var r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  }

  function measure() {
    var found = {}, unknown = {}, order = [], read = 0;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      var text = node.nodeValue.replace(/\s+/g, ' ').trim();
      if (!text) { continue; }
      var el = node.parentElement;
      if (!el || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(el.tagName)) { continue; }
      if (el.closest('[data-contrast-check="skip"], [inert], [hidden], svg defs')) { continue; }
      if (!visible(el) || (el.closest('button, input, select, textarea, fieldset') || {}).disabled) { continue; }
      var cs = getComputedStyle(el), fg = parse(cs.color);
      if (!fg) { continue; }
      var bg = backdrop(el);
      read++;
      var key = cs.color + '|' + cs.backgroundColor + '|' + (isLarge(cs) ? 'L' : 'B');
      if (!bg) {
        var uk = selector(el);
        if (!unknown[uk]) { unknown[uk] = { n: 0, text: text.slice(0, 30) }; }
        unknown[uk].n++;
        continue;
      }
      var alpha = fg[3] * opacityOf(el);
      var shown = over([fg[0], fg[1], fg[2], alpha], bg);
      var r = ratio(shown, bg), need = isLarge(cs) ? LARGE : BODY;
      if (r < need - 0.005) {
        var k2 = key + '|' + r.toFixed(2);
        if (!found[k2]) {
          found[k2] = { sel: selector(el), r: r, need: need, fg: shown.map(Math.round).join(','), bg: bg.map(Math.round).join(','), n: 0, text: text.slice(0, 28) };
          order.push(k2);
        }
        found[k2].n++;
      }
    }
    /* placeholders are read as labels */
    Array.prototype.forEach.call(document.querySelectorAll('input[placeholder], textarea[placeholder]'), function (inp) {
      if (!visible(inp) || inp.disabled || inp.closest('[data-contrast-check="skip"]')) { return; }
      var ph = parse(getComputedStyle(inp, '::placeholder').color), bg = backdrop(inp);
      if (!ph || !bg) { return; }
      var shown = over(ph, bg), r = ratio(shown, bg);
      read++;
      if (r < BODY - 0.005) {
        var k3 = 'ph|' + shown.join() + '|' + bg.join();
        if (!found[k3]) { found[k3] = { kind: 'PLACEHOLDER', sel: selector(inp), r: r, need: BODY, fg: shown.map(Math.round).join(','), bg: bg.map(Math.round).join(','), n: 0, text: inp.getAttribute('placeholder').slice(0, 28) }; order.push(k3); }
        found[k3].n++;
      }
    });
    return { found: found, order: order, unknown: unknown, read: read };
  }

  var root = document.documentElement, themes = [null], was = root.getAttribute('data-theme');
  var themed = Array.prototype.some.call(document.styleSheets, function (sh) {
    try { return Array.prototype.some.call(sh.cssRules, function (r) { return r.selectorText && r.selectorText.indexOf('[data-theme') > -1; }); }
    catch (e) { return false; }
  });
  if (themed) { themes = ['light', 'dark']; }

  var problems = [], advisory = [], totalRead = 0;
  /* A page that animates colour changes reports the MIDDLE of the animation if it is read right after a
     theme switch: dark-theme text on a light background, ratios of 1.08:1 that are not real. Switch
     transitions off while measuring, and force a style flush so the final values are the ones read. */
  var freeze = document.createElement('style');
  freeze.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}';
  document.head.appendChild(freeze);
  themes.forEach(function (t) {
    if (t) { root.setAttribute('data-theme', t); }
    void document.body.offsetWidth;
    var m = measure();
    totalRead += m.read;
    var tag = t ? t + ': ' : '';
    m.order.sort(function (a, b) { return m.found[a].r - m.found[b].r; }).forEach(function (k) {
      var f = m.found[k];
      problems.push((f.kind || 'LOW') + ' | ' + tag + f.sel + ' | ' + f.r.toFixed(2) + ':1, needs ' + f.need + ':1 | text ' +
                    f.fg + ' on ' + f.bg + (f.n > 1 ? ' | ' + f.n + ' elements share this' : '') + ' | "' + f.text + '"');
    });
    Object.keys(m.unknown).slice(0, 12).forEach(function (u) {
      advisory.push('UNKNOWN | ' + tag + u + ' | background is a gradient or image (' + m.unknown[u].n + ' text node(s)), no single ratio: measure the worst point or add a backing plate | "' + m.unknown[u].text + '"');
    });
  });
  if (themed) { if (was === null) { root.removeAttribute('data-theme'); } else { root.setAttribute('data-theme', was); } }
  freeze.remove();

  if (problems.length) {
    console.warn('contrast check: ' + problems.length + ' colour pair(s) under their figure (' + totalRead + ' text runs read' + (themed ? ', both themes' : '') + ')');
    problems.slice(0, 40).forEach(function (p) { console.log('  ' + p); });
  } else {
    console.log('%ccontrast check: clean - ' + totalRead + ' text runs read' + (themed ? ' in both themes' : ''), 'color:#1f7a4d;font-weight:700');
  }
  if (advisory.length) { console.log('  advisory (' + advisory.length + '):'); advisory.forEach(function (a) { console.log('    ' + a); }); }
  return problems.length ? problems.concat(advisory) : ['clean (' + totalRead + ' text runs)'].concat(advisory);
})();
