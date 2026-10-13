/* diagram-check.js - paste into the browser console on any page with an SVG diagram (rules G1-G10).

   Measures the diagram as drawn: every line is sampled along its length in screen pixels, after CSS,
   transforms and font fallback, and compared with the boxes and label plates around it. Distances are
   reported in the diagram's own units (viewBox px), so a rule's "6px" means the same at any zoom.

     BUDGET           more than 9 boxes or 12 lines, unless 10-24 boxes all sit in 2-4 labelled zones; a board of
                      cards with no arrows between them may hold 12 (G2).
     DIAGONAL         a straight slanted run between boxes; a rounded bend or a wide arc is not one (G3).
     CORNER           a line that ends within 8px of a box corner, so it is unclear which edge it leaves (G3).
     STACKED          two lines drawn on top of each other for 12px or more (G4). Lines that start at one
                      point and end apart (a tree fanning out from one trunk) are one bus, not stacked.
     SHARED PORT      two lines meeting one box less than 8px apart (G4; the rule asks 12, 8 on a small box);
                      not between lines of one fan.
     BEHIND BOX       a line running behind a box that is neither of its ends (G5).
     LABEL ON LINE    a label plate covering its own line (G6).
     LABEL GAP        a label plate under 4px from a line it does not cover (G6; 6 to 10 reads best).
                      Neither applies to an ER/UML multiplicity plate ("1", "0..*", "1..n").
     PLATE UNDER BOX  a label plate partly covered by a box drawn after it (G6).
     KEY INSIDE       a key (legend) that overlaps a box or sits above the bottom of the drawing (G7).
     SHRUNK           the diagram drawn narrower than its native viewBox width on a narrow screen (G8).
     PAGE SCROLL      the page scrolls sideways because of the diagram, instead of the diagram scrolling (G8).
     CLIPPED          the diagram runs past an ancestor that clips it, with no scroller in between (G8).
     NO NAME          no role="img" with aria-labelledby naming a filled <title> and <desc> (G9).
     DUP ID           an id the diagram is named by is used more than once on the page (G9).
     EMPHASIS         more than two boxes stroked in a saturated accent colour (G10).

   Advisory, never a failure:
     TRIVIAL          two boxes or fewer and at most one line - would a sentence do (G1)?

   What it reads as what. A box is a stroked <rect> at least 60x40 that holds no other box (one that does is
   a zone); a box drawn twice at one place (an opaque mask under a styled rect) counts once. A label plate
   is a filled, unstroked <rect> 20-200 wide and 8-14 tall. A line is a <path>, <line> or <polyline> with an
   arrow marker. Mark anything the shapes do not say with data-diagram="box", "label", "line" or "key", and
   a whole <svg> with data-diagram to have it measured even with no lines. A line of class "spoke" (a radial
   write-back in a loop) is exempt from DIAGONAL.
   A deliberately wrong sample opts out with data-diagram-check="skip" on itself or an ancestor.
   Reads geometry only: it never clicks or moves anything. Run it at a wide width and at 375px. */
(function diagramCheck() {
  var problems = [], advisory = [], seen = 0;

  function skipped(el) { return !!(el.closest && el.closest('[data-diagram-check="skip"]')); }
  function box(el) { return el.getBoundingClientRect(); }
  function role(el) { return el.getAttribute('data-diagram'); }
  function svgName(svg) {
    var t = svg.querySelector('title');
    return 'svg' + (svg.id ? '#' + svg.id : '') + (t && t.textContent.trim() ? ' "' + t.textContent.trim().slice(0, 40) + '"' : '');
  }
  function words(el) {
    var n = el.nextElementSibling;
    return n && n.tagName.toLowerCase() === 'text' ? n.textContent.trim() : '';
  }
  function text(el) { var w = words(el); return w ? ' "' + w.slice(0, 20) + '"' : ''; }
  function near(a, b, d) { return Math.abs(a.x - b.x) < d && Math.abs(a.y - b.y) < d; }
  function same(a, b) { return Math.abs(a.left - b.left) <= 1 && Math.abs(a.top - b.top) <= 1 && Math.abs(a.right - b.right) <= 1 && Math.abs(a.bottom - b.bottom) <= 1; }
  function inside(p, r, pad) { return p.x > r.left + pad && p.x < r.right - pad && p.y > r.top + pad && p.y < r.bottom - pad; }
  function area(a, b) {
    return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
           Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  }
  function holds(o, i) { return i.left >= o.left - 0.5 && i.right <= o.right + 0.5 && i.top >= o.top - 0.5 && i.bottom <= o.bottom + 0.5; }
  function painted(v) { return v && v !== 'none' && !/rgba\([^)]*,\s*0\)$/.test(v) && v !== 'transparent'; }
  function rgb(v) { var m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(v || ''); return m ? [+m[1], +m[2], +m[3]] : null; }
  function saturated(v) {
    var c = rgb(v); if (!c) { return false; }
    var mx = Math.max(c[0], c[1], c[2]) / 255, mn = Math.min(c[0], c[1], c[2]) / 255, l = (mx + mn) / 2;
    var s = mx === mn ? 0 : (l > 0.5 ? (mx - mn) / (2 - mx - mn) : (mx - mn) / (mx + mn));
    return s > 0.45 && l > 0.2 && l < 0.8;
  }
  function inDefs(el) { return !!el.closest('defs,marker,pattern,clipPath,mask,symbol'); }

  Array.prototype.forEach.call(document.querySelectorAll('svg'), function (svg) {
    if (skipped(svg) || svg.parentElement.closest('svg') || svg.closest('[aria-hidden="true"]')) { return; }
    var R = box(svg);
    if (R.width < 200 || R.height < 80) { return; }
    var vbw = svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width;
    var scale = vbw ? R.width / vbw : 1;
    var name = svgName(svg);
    function add(code, detail) { problems.push(code + ' | ' + name + ' | ' + detail); }

    var all = Array.prototype.slice.call(svg.querySelectorAll('*'));
        var rects = all.filter(function (e) { return e.tagName.toLowerCase() === 'rect' && !inDefs(e) && !skipped(e); });
    var unit = function (e) { var b = e.getBBox(); return { w: b.width, h: b.height }; };

    var boxes = rects.filter(function (r) {
      if (role(r) === 'box') { return true; }
      if (role(r)) { return false; }
      var u = unit(r); return u.w >= 60 && u.h >= 40 && painted(getComputedStyle(r).stroke);
    });
    /* a box drawn twice (an opaque mask under a styled rect) is one box: keep the later one */
    boxes = boxes.filter(function (b, i) { return !boxes.some(function (o, k) { return k > i && same(box(o), box(b)); }); });
    /* a box that holds another box is a zone, not a box */
    var zones = boxes.filter(function (z) { return role(z) !== 'box' && boxes.some(function (b) { return b !== z && holds(box(z), box(b)) && area(box(b), box(b)) < area(box(z), box(z)) * 0.9; }); });
    boxes = boxes.filter(function (b) { return zones.indexOf(b) < 0; });
    var plates = rects.filter(function (r) {
      if (role(r) === 'label') { return true; }
      if (role(r)) { return false; }
      var u = unit(r), cs = getComputedStyle(r);
      return u.w >= 20 && u.w <= 200 && u.h >= 8 && u.h <= 14 && painted(cs.fill) && !painted(cs.stroke);
    });
    var lines = all.filter(function (e) {
      var t = e.tagName.toLowerCase();
      if (inDefs(e) || skipped(e) || !/^(path|line|polyline)$/.test(t)) { return false; }
      if (role(e) === 'line') { return true; }
      var cs = getComputedStyle(e);
      return !!(e.getAttribute('marker-end') || e.getAttribute('marker-start') || (cs.markerEnd && cs.markerEnd !== 'none') || (cs.markerStart && cs.markerStart !== 'none'));
    });
    /* a diagram has lines with arrowheads, or boxes, or says so; a chart of unstroked bars is not one */
    if (!svg.hasAttribute('data-diagram') && !lines.length && boxes.length < 2) { return; }
    seen++;

    /* ---- sample each line once, in screen pixels ------------------------------------------------ */
    var pts = lines.map(function (l) {
      var len = l.getTotalLength ? l.getTotalLength() : 0, m = l.getScreenCTM(), arr = [];
      for (var d = 0; d <= len; d += 1) { var q = l.getPointAtLength(d); arr.push(new DOMPoint(q.x, q.y).matrixTransform(m)); }
      return arr;
    });
    function boxAt(p) {
      for (var i = 0; i < boxes.length; i++) {
        var r = box(boxes[i]);
        if (p.x >= r.left - 12 && p.x <= r.right + 12 && p.y >= r.top - 12 && p.y <= r.bottom + 12) { return boxes[i]; }
      }
      return null;
    }

    /* G1 / G2: is it worth drawing, and is it too much --------------------------------------------- */
    if (boxes.length && boxes.length <= 2 && lines.length <= 1) { advisory.push('TRIVIAL | ' + name + ' | ' + boxes.length + ' box(es) and ' + lines.length + ' line - would a sentence say it (G1)?'); }
    var zoned = zones.length >= 2 && zones.length <= 4 && boxes.length <= 24 &&
      boxes.every(function (b) { return zones.some(function (z) { return holds(box(z), box(b)); }); });
    var cap = lines.length ? 9 : 12;
    if ((boxes.length > cap || lines.length > 12) && !zoned) {
      add('BUDGET', boxes.length + ' boxes and ' + lines.length + ' lines (at most ' + cap + ' and 12; up to 24 boxes only in 2-4 zones) - cut in the G2 order or split');
    }

    pts.forEach(function (P, li) {
      var l = lines[li];
      if (P.length < 2) { return; }
      /* G3: a straight slanted run. A run counts while its direction stays within 0.03 rad of where it
         began, so a wide arc is not mistaken for a slanted line, and a rounded bend is too short. */
      if (!l.classList.contains('spoke')) {
        var run = 0, worst = 0, start = null;
        for (var i = 4; i < P.length; i++) {
          var dx = P[i].x - P[i - 4].x, dy = P[i].y - P[i - 4].y;
          var diag = Math.abs(dx) > 0.6 * scale && Math.abs(dy) > 0.6 * scale, dir = Math.atan2(dy, dx);
          if (diag && start !== null && Math.abs(dir - start) < 0.03) { run++; } else { run = 0; start = diag ? dir : null; }
          worst = Math.max(worst, run);
        }
        if (worst > 16 * scale) { add('DIAGONAL', 'a straight slanted run of ' + Math.round(worst / scale) + 'px - route it horizontally and vertically'); }
      }
      /* G3: an end at a corner */
      [P[0], P[P.length - 1]].forEach(function (p) {
        var b = boxAt(p); if (!b) { return; }
        var r = box(b), c = [[r.left, r.top], [r.right, r.top], [r.left, r.bottom], [r.right, r.bottom]];
        var near = Math.min.apply(null, c.map(function (k) { return Math.sqrt(Math.pow(p.x - k[0], 2) + Math.pow(p.y - k[1], 2)); })) / scale;
        if (near < 8) { add('CORNER', 'a line ends ' + near.toFixed(1) + 'px from a box corner (8 or more)'); }
      });
      /* G5: behind a box that is not an end */
      var a = boxAt(P[0]), z = boxAt(P[P.length - 1]);
      for (var k = 0; k < boxes.length; k++) {
        if (boxes[k] === a || boxes[k] === z) { continue; }
        var rr = box(boxes[k]), hit = P.filter(function (p) { return inside(p, rr, 3 * scale); }).length;
        if (hit > 4 * scale) { add('BEHIND BOX', Math.round(hit / scale) + 'px of a line runs behind a box that is not one of its ends' + (getComputedStyle(l).strokeDasharray !== 'none' ? ' (dashed: allowed only where no route exists)' : '')); break; }
      }
    });

    /* G4: stacked lines, and shared ports. Two lines that start at one point and end apart are a fan from
       one trunk (a tree bus): their common stem is one stroke on purpose. Two that also end together are
       one line drawn twice, and still count. */
    function fan(i, j) {
      var A = pts[i], B = pts[j];
      return near(A[0], B[0], 2) && !near(A[A.length - 1], B[B.length - 1], 2);
    }
    for (var i = 0; i < pts.length; i++) {
      for (var j = i + 1; j < pts.length; j++) {
        if (fan(i, j)) { continue; }
        var A = pts[i], B = pts[j], shared = 0;
        for (var s = 0; s < A.length; s += 2) {
          for (var t = 0; t < B.length; t++) { if (Math.abs(A[s].x - B[t].x) < 1.5 && Math.abs(A[s].y - B[t].y) < 1.5) { shared += 2; break; } }
        }
        if (shared / scale >= 12) { add('STACKED', 'two lines share ' + Math.round(shared / scale) + 'px of stroke - offset them 12px or more'); }
      }
    }
    var ends = [];
    pts.forEach(function (P, li) { [P[0], P[P.length - 1]].forEach(function (p) { var b = boxAt(p); if (b) { ends.push({ l: li, p: p, b: b }); } }); });
    for (var e = 0; e < ends.length; e++) {
      for (var f = e + 1; f < ends.length; f++) {
        if (ends[e].l === ends[f].l || ends[e].b !== ends[f].b || fan(ends[e].l, ends[f].l)) { continue; }
        var d = Math.sqrt(Math.pow(ends[e].p.x - ends[f].p.x, 2) + Math.pow(ends[e].p.y - ends[f].p.y, 2)) / scale;
        if (d < 8) { add('SHARED PORT', 'two lines meet one box ' + d.toFixed(1) + 'px apart - give each its own point, 12px apart'); }
      }
    }

    /* G6: label plates ------------------------------------------------------------------------------- */
    plates.forEach(function (m) {
      var r = box(m), inBox = boxes.some(function (b) { return holds(box(b), r); });
      var multiplicity = /^[0-9n*.,\s]+$/.test(words(m)); /* "1", "0..*", "1..n" sit on their line by convention */
      if (!inBox && !multiplicity) {
        for (var li = 0; li < pts.length; li++) {
          var P = pts[li], over = P.filter(function (p) { return inside(p, r, 0); }).length;
          if (over > 6) { add('LABEL ON LINE', 'plate' + text(m) + ' covers its own line - move it 6-10px beside the line'); break; }
          var gap = Math.min.apply(null, P.map(function (p) { return Math.max(r.left - p.x, p.x - r.right, r.top - p.y, p.y - r.bottom); })) / scale;
          if (gap >= 0 && gap < 3.5) { add('LABEL GAP', 'plate' + text(m) + ' is ' + gap.toFixed(1) + 'px from a line (at least 4; 6 to 10 reads best)'); break; }
        }
      }
      for (var k = 0; k < boxes.length; k++) {
        var br = box(boxes[k]);
        if (all.indexOf(boxes[k]) > all.indexOf(m) && area(br, r) > 0 && !holds(br, r)) { add('PLATE UNDER BOX', 'plate' + text(m) + ' is partly covered by a box drawn after it'); break; }
      }
    });

    /* G7: the key sits under the drawing -------------------------------------------------------------- */
    var keys = all.filter(function (el) {
      if (role(el) === 'key') { return true; }
      var c = (el.getAttribute('class') || '') + ' ' + (el.id || '');
      return el.tagName.toLowerCase() === 'g' && /(^|[\s_-])(legend|key)([\s_-]|$)/i.test(c);
    });
    var lowest = Math.max.apply(null, boxes.map(function (b) { return box(b).bottom; }).concat([-Infinity]));
    keys.forEach(function (k) {
      var r = box(k);
      if (!r.width) { return; }
      var hitsBox = boxes.some(function (b) { return area(box(b), r) > 0; });
      if (hitsBox || r.top < lowest - 2) { add('KEY INSIDE', 'the key ' + (hitsBox ? 'overlaps a box' : 'sits inside the drawing') + ' - put it in a strip below the diagram'); }
    });

    /* G8: holds its width on a narrow screen ---------------------------------------------------------- */
    if (vbw && innerWidth < vbw && R.width < vbw - 1) {
      add('SHRUNK', 'drawn ' + Math.round(R.width) + 'px wide, native ' + vbw + 'px: every label is ' + Math.round(R.width / vbw * 100) + '% of its size - min-width ' + vbw + 'px inside a scroller');
    }
    var page = document.scrollingElement || document.documentElement;
    if (page.scrollWidth > innerWidth + 1 && R.right > innerWidth + 1) {
      var scroller = null;
      for (var p = svg.parentElement; p && p !== document.body; p = p.parentElement) {
        if (/(auto|scroll)/.test(getComputedStyle(p).overflowX)) { scroller = p; break; }
      }
      if (!scroller) { add('PAGE SCROLL', 'the page is ' + page.scrollWidth + 'px wide in a ' + innerWidth + 'px window - wrap the diagram in its own sideways scroller'); }
    }
    for (var q = svg.parentElement; q && q !== document.body; q = q.parentElement) {
      var ox = getComputedStyle(q).overflowX;
      if (/(auto|scroll)/.test(ox)) { break; }
      if (/(hidden|clip)/.test(ox) && R.right > box(q).right + 1) { add('CLIPPED', 'cut off by a clipping ancestor (' + q.tagName.toLowerCase() + (q.className ? '.' + String(q.className).split(' ')[0] : '') + ') with no scroller inside it'); break; }
    }

    /* G9: a named figure ------------------------------------------------------------------------------ */
    var ids = (svg.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
    var named = svg.getAttribute('role') === 'img' && ids.length >= 1 && ids.every(function (id) { var n = document.getElementById(id); return n && n.textContent.trim(); });
    var hasDesc = ids.some(function (id) { var n = document.getElementById(id); return n && n.tagName.toLowerCase() === 'desc'; });
    if (!named || !hasDesc) { add('NO NAME', 'needs role="img" and aria-labelledby naming a filled <title> and <desc>'); }
    ids.forEach(function (id) {
      if (document.querySelectorAll('[id="' + id.replace(/"/g, '\\"') + '"]').length > 1) { add('DUP ID', 'id "' + id + '" is used more than once, so another figure can be announced with this name'); }
    });

    /* G10: emphasis on one or two things --------------------------------------------------------------- */
    var accented = boxes.filter(function (b) { return saturated(getComputedStyle(b).stroke); });
    if (accented.length > 2) { add('EMPHASIS', accented.length + ' boxes carry an accent stroke - keep it for the one or two that are the point'); }
  });

  if (problems.length) {
    console.warn('diagram check: ' + problems.length + ' problem(s) in ' + seen + ' diagram(s)');
    problems.forEach(function (p) { console.log('  ' + p); });
  } else {
    console.log('%cdiagram check: clean - ' + seen + ' diagram(s) measured', 'color:#1f7a4d;font-weight:700');
  }
  advisory.forEach(function (a) { console.log('  advisory: ' + a); });
  return problems.length ? problems.concat(advisory) : ['clean (' + seen + ' diagram(s) measured)'].concat(advisory);
})();
