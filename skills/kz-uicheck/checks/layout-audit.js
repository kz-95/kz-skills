/* Layout audit: run after every visual change, at more than one width.
   Behaviour tests pass while layout silently breaks, so this checks the geometry.
   Includes COVERED: a fixed or sticky rail sitting on the content it should leave room for. */
(function () {
  var problems = [];
  function note(kind, el, detail) {
    problems.push(kind + ' | ' + (el.id ? '#' + el.id : el.getAttribute('class') || el.tagName) +
      ' | ' + detail);
  }

  /* 1. anything scrolling horizontally that was not meant to */
  if (document.documentElement.scrollWidth > innerWidth + 1) {
    problems.push('PAGE OVERFLOW | html | scrollWidth ' +
      document.documentElement.scrollWidth + ' vs ' + innerWidth);
  }
  Array.prototype.forEach.call(document.querySelectorAll('.chartside, .panel, .demo, .kpi'),
    function (el) {
      if (el.scrollWidth > el.clientWidth + 1) {
        note('OVERFLOW', el, el.scrollWidth + ' > ' + el.clientWidth);
      }
    });

  /* 2. text clipped by its own box */
  /* content inside something that scrolls sideways is reachable, not clipped: a table
     header in a .tablescroll reported 43 times at phone width while nothing on screen
     was actually cut off. A check that cries wolf is a check people learn to skip. */
  function inScroller(el) {
    for (var n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      var ox = getComputedStyle(n).overflowX;
      if ((ox === 'auto' || ox === 'scroll') && n.scrollWidth > n.clientWidth + 1) {
        return true;
      }
    }
    return false;
  }
  /* scrollWidth also counts an invisible touch hit-area - a 44px ::after round a small
     button reaches past its cell by design, and was reported as a clipped header in five
     tables at phone width. What a person can see cut off is the content itself: its text
     and child boxes, which a Range measures and a pseudo-element never enters. */
  function contentOverflows(el) {
    var r = document.createRange();
    r.selectNodeContents(el);
    var c = r.getBoundingClientRect(), b = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (!c.width) { return false; }
    return c.right > b.right - parseFloat(cs.borderRightWidth) + 2 ||
           c.left < b.left + parseFloat(cs.borderLeftWidth) - 2;
  }
  Array.prototype.forEach.call(
    document.querySelectorAll('.vl, .nm, .rt, .rr, .mem, .chip, .lbl, td, th'),
    function (el) {
      if (!el.offsetParent) { return; }
      /* a screen-reader-only element is 1px wide by design: its scrollWidth always
         exceeds its clientWidth, and 25 false positives hide every real one */
      if (el.clientWidth <= 1) { return; }
      if (inScroller(el)) { return; }
      if (el.scrollWidth > el.clientWidth + 2 && contentOverflows(el) &&
          getComputedStyle(el).textOverflow !== 'ellipsis') {
        note('CLIPPED', el, JSON.stringify(el.textContent.trim().slice(0, 28)));
      }
    });

  /* 3. the two panes of a split must not overlap */
  Array.prototype.forEach.call(document.querySelectorAll('.split'), function (sp) {
    var a = sp.querySelector('.chartside'), b = sp.querySelector('.tableside');
    if (!a || !b) { return; }
    var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    var sideBySide = Math.abs(ra.top - rb.top) < 4;
    if (sideBySide && ra.right > rb.left + 1) {
      note('PANES OVERLAP', sp, Math.round(ra.right - rb.left) + 'px');
    }
  });

  /* 4. rows inside a chart must not overlap each other */
  ['#hbar .hbar-row', '#bullets .bul', '.gantt .gr'].forEach(function (sel) {
    var rows = document.querySelectorAll(sel);
    for (var i = 1; i < rows.length; i++) {
      var p = rows[i - 1].getBoundingClientRect(), c = rows[i].getBoundingClientRect();
      if (c.top < p.bottom - 1) { note('ROWS OVERLAP', rows[i], sel); }
    }
  });

  /* 5. controls that share a row share a height */
  Array.prototype.forEach.call(document.querySelectorAll('.tablebar, .measures'),
    function (bar) {
      var kids = Array.prototype.filter.call(bar.children, function (k) {
        return k.offsetParent && !k.hidden;
      });
      if (kids.length < 2) { return; }
      var tops = kids.map(function (k) { return Math.round(k.getBoundingClientRect().top); });
      var sameRow = tops.every(function (t) { return t === tops[0]; });
      if (!sameRow) { return; }   /* wrapped: heights need not match across lines */
      var hs = kids.map(function (k) { return Math.round(k.getBoundingClientRect().height); });
      var odd = hs.filter(function (h) { return Math.abs(h - hs[0]) > 2; });
      if (odd.length) { note('RAGGED ROW', bar, hs.join('/')); }
    });

  /* 6. nothing with a size of zero that should have one */
  Array.prototype.forEach.call(document.querySelectorAll('svg.chart, #hbar, #bullets'),
    function (el) {
      var r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) { note('ZERO SIZE', el, r.width + 'x' + r.height); }
    });

  /* 7. anything marked hidden must actually be hidden. A class that sets `display`
        overrides the user-agent rule for [hidden], so the attribute stops working and
        the element stays on screen reporting an empty state. */
  Array.prototype.forEach.call(document.querySelectorAll('[hidden]'), function (el) {
    if (el.offsetParent !== null || el.getBoundingClientRect().width > 0) {
      note('HIDDEN BUT VISIBLE', el, JSON.stringify(el.textContent.trim().slice(0, 30)));
    }
  });

  /* 8. a control too small to use. Flex children with min-width:0 crush silently:
        the row still looks tidy and the field is 18px wide. */
  Array.prototype.forEach.call(
    document.querySelectorAll('input, select, button, .srch'), function (el) {
      if (!el.offsetParent || el.hidden) { return; }
      var r = el.getBoundingClientRect();
      /* an icon-only control is legitimately small; it is judged on its TAP target
         instead, which is checked separately below */
      if (el.classList.contains('help') || el.classList.contains('ftrig')) { return; }
      var floor = el.tagName === 'BUTTON' ? 24 : 60;
      if (r.width > 0 && r.width < floor) {
        note('TOO SMALL', el, Math.round(r.width) + 'px wide, floor ' + floor);
      }
    });

  /* 9. on a touch device every control needs a 44px target, counting padding and any
        pseudo-element used to enlarge the hit area. Measuring the element's own box
        alone reported 58 false positives against controls that carry exactly the
        ::after overlay Appendix D prescribes, which is the audit being wrong about the
        rule it is checking. */
  function hitBox(el) {
    var r = el.getBoundingClientRect();
    var w = r.width, h = r.height;
    ['::after', '::before'].forEach(function (pseudo) {
      var cs = getComputedStyle(el, pseudo);
      if (!cs || cs.content === 'none') { return; }
      var pw = parseFloat(cs.width), ph = parseFloat(cs.height);
      if (cs.position === 'absolute' && pw > w) { w = pw; }
      if (cs.position === 'absolute' && ph > h) { h = ph; }
    });
    return { width: w, height: h };
  }
  if (matchMedia('(hover: none)').matches) {
    Array.prototype.forEach.call(
      document.querySelectorAll('button, input, select, a'), function (el) {
        if (!el.offsetParent || el.hidden) { return; }
        var b = hitBox(el);
        if (b.height < 44 || b.width < 24) {
          note('SMALL TOUCH TARGET', el, Math.round(b.width) + 'x' + Math.round(b.height));
        }
      });
  }

  /* 10a. SVG text must stay inside its own viewBox, and must not sit on top of other
         text. The page shipped four clipped labels and three overlapping stacks while
         every other check was green, because nothing had ever measured a text box
         against the frame it is drawn in (rule Y2). */
  Array.prototype.forEach.call(document.querySelectorAll('svg.chart'), function (svg) {
    var vb = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
    if (vb.length !== 4) { return; }
    var texts = Array.prototype.filter.call(svg.querySelectorAll('text'), function (t) {
      return (t.textContent || '').trim();
    });
    /* Measured on screen, not in user units. getBBox reports the box BEFORE any
       transform, so a rotated label looks like it sits somewhere it is never drawn -
       and skipping transformed text would exempt exactly the labels most likely to
       collide, which is a check with a hole in it rather than a check. */
    var svgBox = svg.getBoundingClientRect();
    var boxes = [];
    texts.forEach(function (t) {
      var b;
      try { b = t.getBoundingClientRect(); } catch (e) { return; }
      if (!b.width) { return; }
      if (b.left < svgBox.left - 0.5 || b.top < svgBox.top - 0.5 ||
          b.right > svgBox.right + 0.5 || b.bottom > svgBox.bottom + 0.5) {
        note('TEXT OUTSIDE VIEWBOX', svg,
          JSON.stringify(t.textContent.trim().slice(0, 18)) + ' overruns by ' +
          Math.round(Math.max(svgBox.left - b.left, b.right - svgBox.right,
                              svgBox.top - b.top, b.bottom - svgBox.bottom)) + 'px');
      }
      boxes.push({ b: b, t: t });
    });
    boxes.forEach(function (a, i) {
      boxes.slice(i + 1).forEach(function (c) {
        var ox = Math.min(a.b.right, c.b.right) - Math.max(a.b.left, c.b.left);
        var oy = Math.min(a.b.bottom, c.b.bottom) - Math.max(a.b.top, c.b.top);
        /* a couple of pixels of kerning overlap is not a collision; half a character is */
        if (ox > 3 && oy > 3) {
          note('TEXT OVERLAP', svg,
            JSON.stringify(a.t.textContent.trim().slice(0, 14)) + ' over ' +
            JSON.stringify(c.t.textContent.trim().slice(0, 14)));
        }
      });
    });
  });

  /* 9b. two text blocks in one box must share a left edge.
     This is the check that was missing: every note in the reference page sat 1px from
     its border while its sibling body was inset 16px, so one box had two left edges.
     Nothing here reported it - overflow was fine, nothing was clipped, every target was
     big enough - and it is the first thing the eye sees. */
  function textLeft(el) {
    var r = el.getBoundingClientRect();
    return r.left + parseFloat(getComputedStyle(el).paddingLeft || 0);
  }
  Array.prototype.forEach.call(document.querySelectorAll('.demo, .card, .panel, section'),
    function (box) {
      var kids = Array.prototype.filter.call(box.children, function (el) {
        if (!el.offsetParent) { return false; }
        if (!el.textContent.trim()) { return false; }
        var pos = getComputedStyle(el).position;
        if (pos === 'absolute' || pos === 'fixed') { return false; }
        /* compare text blocks, not the containers that hold them: a wrapper's own left
           edge means nothing, its children carry the padding */
        var w = el.getBoundingClientRect().width;
        if (w <= box.getBoundingClientRect().width * 0.6) { return false; }
        var wide = Array.prototype.filter.call(el.children, function (c) {
          return c.getBoundingClientRect().width > w * 0.6;
        });
        if (wide.length) { return false; }
        /* and it has to be a block of prose, not a layout box whose own children happen
           to carry the words - a two-column split has no left edge of its own */
        var own = Array.prototype.filter.call(el.childNodes, function (n) {
          return n.nodeType === 3 && n.textContent.trim();
        });
        return own.length > 0;
      });
      if (kids.length < 2) { return; }
      var edges = kids.map(textLeft);
      var min = Math.min.apply(null, edges), max = Math.max.apply(null, edges);
      if (max - min > 2) {
        note('RAGGED LEFT EDGE', box, kids.length + ' full-width blocks start at ' +
          edges.map(function (e) { return Math.round(e - box.getBoundingClientRect().left); })
            .join(', ') + 'px from the box');
      }
    });

  /* 10. a fixed overlay must stay inside the viewport */
  Array.prototype.forEach.call(document.querySelectorAll('.readout[data-show], .fpop[data-show], #tip[data-show]'),
    function (el) {
      var r = el.getBoundingClientRect();
      if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) {
        note('OFF SCREEN', el, JSON.stringify(r));
      }
    });

  /* 11. a focus ring on an SVG shape must follow the shape. The browser's own outline on an
     SVG element is its BOUNDING BOX - a rectangle round a wedge or a circle. A focusable
     path, circle or group needs an author rule that removes the outline AND draws the ring
     from the shape (a filter or a stroke). Rects are exempt: their box is their shape.
     Static, because :focus cannot be forced from script. Opt a shape out with
     data-focus-check="skip". */
  (function () {
    var shapes = Array.prototype.filter.call(document.querySelectorAll('svg [tabindex]'), function (e) {
      return /^(path|circle|ellipse|polygon|polyline|g)$/i.test(e.tagName) &&
             e.getAttribute('tabindex') !== '-1' && !e.closest('[data-focus-check="skip"]');
    });
    if (!shapes.length) { return; }
    var ringed = new Set(), unboxed = new Set();
    function walk(rules) {
      Array.prototype.forEach.call(rules, function (r) {
        if (!r.selectorText) { if (r.cssRules) { walk(r.cssRules); } return; }
        if (r.selectorText.indexOf(':focus') < 0) { return; }
        var st = r.style;
        var drawsRing = (st.filter && st.filter !== 'none') || st.stroke || st.strokeWidth;
        var noBox = st.outlineStyle === 'none' || st.outline === 'none';
        r.selectorText.split(/,(?![^(]*\))/).forEach(function (sel) {
          if (sel.indexOf(':focus') < 0 || sel.indexOf(':focus-within') >= 0) { return; }
          var hits;
          try { hits = document.querySelectorAll(sel.replace(/:focus(-visible)?/g, '').trim() || '*'); }
          catch (e) { return; }
          Array.prototype.forEach.call(hits, function (e) {
            if (drawsRing) { ringed.add(e); }
            if (noBox) { unboxed.add(e); }
          });
        });
      });
    }
    Array.prototype.forEach.call(document.styleSheets, function (sh) {
      try { walk(sh.cssRules); } catch (e) { /* a cross-origin sheet cannot be read */ }
    });
    var bad = {};
    shapes.forEach(function (e) {
      if (ringed.has(e) && unboxed.has(e)) { return; }
      var k = e.tagName.toLowerCase() + '.' + (e.getAttribute('class') || '').split(' ')[0];
      (bad[k] = bad[k] || []).push(e);
    });
    Object.keys(bad).forEach(function (k) {
      note('FOCUS BOX', bad[k][0], bad[k].length + ' x ' + k + ': the focus ring is the bounding box, ' +
        'a rectangle round the shape - remove the outline and draw the ring from the shape (a ' +
        'drop-shadow filter or a stroke); see chart-rules Appendix CC');
    });
  })();

  /* 12. a var(--x) that nothing defines. The whole declaration is then dropped without a word:
     an outline, a colour, a shadow just is not there, and nothing reports it. Found when a
     focus ring written as `outline: 2px solid var(--fg)` never drew, on a page whose token
     was --text. Static: every var() with no fallback must name a property that something
     declares - a stylesheet, an inline style, or script. */
  (function () {
    var declared = {}, used = {};
    function scan(text, into) {
      var re = into === declared ? /(--[\w-]+)\s*:/g : /var\(\s*(--[\w-]+)\s*\)/g, m;
      while ((m = re.exec(text))) { (into[m[1]] = into[m[1]] || []).push(1); }
    }
    function walk(rules, src) {
      Array.prototype.forEach.call(rules, function (r) {
        if (r.cssRules && !r.style) { walk(r.cssRules, src); return; }
        if (!r.style) { return; }
        scan(r.style.cssText, declared);
        var txt = r.style.cssText, m, re = /var\(\s*(--[\w-]+)\s*\)/g;
        while ((m = re.exec(txt))) { (used[m[1]] = used[m[1]] || []).push(r.selectorText || ''); }
      });
    }
    Array.prototype.forEach.call(document.styleSheets, function (sh) {
      try { walk(sh.cssRules); } catch (e) { /* a cross-origin sheet cannot be read */ }
    });
    Array.prototype.forEach.call(document.querySelectorAll('[style*="--"]'), function (e) {
      scan(e.getAttribute('style'), declared);
    });
    var rootStyle = getComputedStyle(document.documentElement);
    Object.keys(used).forEach(function (name) {
      if (declared[name] || rootStyle.getPropertyValue(name).trim()) { return; }
      note('UNDEFINED TOKEN', document.documentElement, 'var(' + name + ') is used ' + used[name].length +
        ' time(s), e.g. in "' + String(used[name][0]).slice(0, 50) + '", and nothing defines it - ' +
        'every declaration using it is silently dropped');
    });
  })();

  /* 13. a sequence wraps only while all of it stays in view (rule L11). A container marked
     data-orientation="horizontal" (or aria-orientation, where its role allows it) holds items in
     order. Wrapping is allowed while the whole wrapped sequence fits the area that shows it - the
     nearest ancestor that scrolls or clips vertically, else the window. It fails when the wrap makes
     it taller than that area (the later items are out of sight below), when it wraps while marked
     data-sequence="line" (a kanban board, a timeline or stepper: the line breaks at the wrap), or
     when it overflows sideways with nothing to scroll it. A second row is a child that starts at or
     below another's bottom, so a row of unequal heights is not mistaken for two. Opt a deliberately
     wrong sample out with data-layout-check="skip". */
  function shownHeight(el) {
    for (var p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
      if (/^(auto|scroll|hidden|clip)$/.test(getComputedStyle(p).overflowY)) { return p.clientHeight; }
    }
    return window.innerHeight;
  }
  Array.prototype.forEach.call(
    document.querySelectorAll('[aria-orientation="horizontal"], [data-orientation="horizontal"]'),
    function (seq) {
      if (!seq.offsetParent || seq.closest('[data-layout-check="skip"]')) { return; }
      var boxes = Array.prototype.filter.call(seq.children, function (k) {
        return k.offsetParent && !k.hidden;
      }).map(function (k) { return k.getBoundingClientRect(); }).filter(function (r) {
        return r.width > 0 && r.height > 0;
      });
      if (boxes.length < 2) { return; }
      var ox = getComputedStyle(seq).overflowX;
      var wrapped = boxes.some(function (a, i) {
        return boxes.some(function (b, j) { return i !== j && a.top >= b.bottom - 1; });
      });
      if (wrapped) {
        var tall = seq.getBoundingClientRect().height, room = shownHeight(seq);
        if (seq.getAttribute('data-sequence') === 'line') {
          note('WRAPPED SEQUENCE', seq, boxes.length + ' items drawn as a line wrap onto more than one row - ' +
            'the line breaks at the wrap; lay them in one row that scrolls sideways');
        } else if (tall > room + 1) {
          note('WRAPPED SEQUENCE', seq, boxes.length + ' items wrap to ' + Math.round(tall) + 'px in an area ' +
            Math.round(room) + 'px high, so the later ones are out of sight below - lay them in one row ' +
            'that scrolls sideways');
        }
      } else if (seq.scrollWidth > seq.clientWidth + 1 && ox !== 'auto' && ox !== 'scroll') {
        note('WRAPPED SEQUENCE', seq, 'items overflow by ' + (seq.scrollWidth - seq.clientWidth) +
          'px and it cannot scroll sideways (overflow-x ' + ox + ')');
      }
    });

  /* 14. a fixed rail must not sit on the content (rules L8, L10). A fixed or sticky element that is
     most of the window tall covers the same strip at every scroll position, so what is under it never
     scrolls free: the reference page's jump rail hid the right 52px of every card at 1280px while this
     audit said clean. Things meant to overlay are exempt: an open dialog, a popover, a tooltip, a toast
     or status region, anything modal, and a bar spanning the full width (content scrolls under a
     header by design). A short fixed element (a header, a back-to-top button) is not judged here:
     content passes under it and out again. Sticky counts only when it sticks to the window, not inside
     a scroller (a sticky table header covers rows by design). Reports what is under the rail and by
     how many pixels. Opt an element out with data-layout-check="skip". */
  (function () {
    var vw = document.documentElement.clientWidth, vh = innerHeight, box;
    var OVERLAY = 'dialog, [popover], [role="dialog"], [role="alertdialog"], [role="tooltip"], ' +
      '[role="status"], [role="alert"], [aria-live], [aria-modal="true"], [data-layout-check="skip"]';
    function scrollsInside(el) {
      for (var p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        if (/^(auto|scroll|hidden|clip)$/.test(getComputedStyle(p).overflowY)) { return true; }
      }
      return false;
    }
    function draws(e) {                 /* paints something a person would miss if it were covered */
      if (/^(IMG|SVG|CANVAS|VIDEO|INPUT|BUTTON|SELECT|TEXTAREA|IFRAME)$/i.test(e.tagName)) { return true; }
      var cs = getComputedStyle(e), bg = /rgba?\(([^)]+)\)/.exec(cs.backgroundColor);
      if (bg && !/,\s*0\s*$/.test(bg[1])) { return true; }
      if (cs.backgroundImage !== 'none' || cs.boxShadow !== 'none') { return true; }
      if (['Top', 'Right', 'Bottom', 'Left'].every(function (s) {
        return parseFloat(cs['border' + s + 'Width']) > 0 && cs['border' + s + 'Style'] !== 'none';
      })) { return true; }
      /* its own text, where the text actually is: a heading's box is the column's width, its words are not */
      return Array.prototype.some.call(e.childNodes, function (n) {
        if (n.nodeType !== 3 || !n.textContent.trim()) { return false; }
        var rg = document.createRange(); rg.selectNodeContents(n);
        return Array.prototype.some.call(rg.getClientRects(), function (q) {
          return q.right > box.L && q.left < box.R && q.bottom > box.T && q.top < box.B;
        });
      });
    }
    function name(e) {
      var c = (e.getAttribute('class') || '').trim().split(/\s+/)[0];
      return e.id ? '#' + e.id : e.tagName.toLowerCase() + (c ? '.' + c : '');
    }
    Array.prototype.forEach.call(document.querySelectorAll('body *'), function (bar) {
      var cs = getComputedStyle(bar);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') { return; }
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) { return; }
      if (bar.matches(OVERLAY) || bar.closest(OVERLAY)) { return; }
      if (cs.position === 'sticky' && scrollsInside(bar)) { return; }
      var r = bar.getBoundingClientRect();
      var L = Math.max(0, r.left), R = Math.min(vw, r.right), T = Math.max(0, r.top), B = Math.min(vh, r.bottom);
      if (R - L < 2 || B - T < vh * 0.75) { return; }          /* not a rail: content passes under it */
      if (R - L >= vw - 2) { return; }                          /* full width: a sheet or a menu, not a rail */
      box = { L: L, R: R, T: T, B: B };
      var hits = new Map();
      for (var x = L + 2; x < R; x += 8) {
        for (var y = T + 2; y < B; y += 8) {
          var stack = document.elementsFromPoint(x, y);
          for (var i = 0; i < stack.length; i++) {
            var e = stack[i];
            if (bar.contains(e) || e.contains(bar) || e === document.body || e === document.documentElement) { continue; }
            if (e.closest(OVERLAY)) { break; }
            for (var b = e; b && b !== document.body && !b.contains(bar); b = b.parentElement) {
              if (draws(b)) { hits.set(b, true); break; }
            }
            break;
          }
        }
      }
      var found = [];
      hits.forEach(function (v, e) {
        var q = e.getBoundingClientRect();
        var w = Math.min(q.right, R) - Math.max(q.left, L), h = Math.min(q.bottom, B) - Math.max(q.top, T);
        if (w >= 2 && h >= 2) { found.push({ e: e, w: Math.round(w), h: Math.round(h) }); }
      });
      /* report the outermost boxes: a card and the paragraph inside it are one finding */
      found = found.filter(function (f) {
        return !found.some(function (g) { return g !== f && g.e.contains(f.e); });
      }).sort(function (a, b) { return b.w * b.h - a.w * a.h; });
      if (!found.length) { return; }
      note('COVERED', bar, 'a ' + Math.round(R - L) + 'x' + Math.round(B - T) + 'px ' + cs.position +
        ' rail sits on ' + found.length + ' element(s) of content, e.g. ' +
        found.slice(0, 3).map(function (f) { return name(f.e) + ' by ' + f.w + 'x' + f.h + 'px'; }).join(', ') +
        ' - reserve its width for the content column, or move it');
    });
  })();

  return problems.length ? problems : ['clean'];
})();
