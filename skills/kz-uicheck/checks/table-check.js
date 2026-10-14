/* table-check.js - paste into the browser console on any page (rules S1, T1, T2, T3).

   Reads every data table on the page and reports what the standing table rule requires
   and agents most often leave out. It measures structure, so it works on any stack.

     BOX       a column filter that is a bare text box or a select sitting in the table
               head. T1: a filter is a control that opens a panel (sort, value list with
               counts, range for numbers) - a box can say one value and nothing else.
     NOFILTER  a column with a header and no filter control at all (T2).
     FILTERGAP the title row and the filter row are not one header block: a line sits
               between the titles and their filters, or a filter control is under 4px
               from a line above or below it. Measured from computed style and layout,
               never judged by eye - a 0px gap is invisible in a scaled-down screenshot.
     NOSORT    a table of several rows with no sortable header (S1).
     NOSEARCH  no search field for the table (S1). Advisory: it may live in a toolbar
               this check cannot tie to the table, so it is reported, not counted as a
               failure.
     NOCOUNT   no live result count - "5 items" / "2 of 5" in an aria-live region (S1).
               Advisory, for the same reason.
     NOHELP    a header with no explainer - a title, a data-tip, or a [?] button (T3).
               Advisory.
     CHARTBOX  a filter that drives a chart, not a table column, built as a <select>, a
               bare text box, or a row of toggle chips (aria-pressed) or inline checkboxes
               that has more than six values, or no visible count ("4 of 6", "4 selected")
               or no one-tap Clear / All / Reset beside it. T1 covers it: a chart's or
               dashboard's filter is the same panel as a column filter - a trigger showing
               "Sites: 6 of 6" that opens sort, value search, Select all / Clear selection,
               an "n of m" count and a value list with counts - except that up to six values
               may be chips that show their state, a count and a clear. A chart is an <svg> wider than 200px with
               role="img" or at least three marks, a <canvas> wider than 200px, or an
               HTML chart (bars drawn as elements) whose id, class or role says chart. A
               control drives it when it sits in the same card or section (or a filter
               bar two levels out from it), or points at it with aria-controls, and its label or nearby text says filter, show, site,
               pick, choose or which - or it carries data-filter. A trigger with
               aria-haspopup is the panel and passes; a legend's own toggles (C20) pass;
               a search box beside a table is that table's search (S1) and passes. Its own
               code, because BOX's message names a column and a table head.

   BOX, NOFILTER, FILTERGAP, NOSORT and CHARTBOX are failures. The rest are listed below them.

   A table that is deliberately wrong (a "wrong" sample in a rules page) opts out with
   data-table-check="skip" on the table or any ancestor.

   Only data tables are read: a table needs a thead with headers, at least two columns
   and at least one body row, and must not be role="presentation". The CHARTBOX pass reads
   every chart the same way, and data-table-check="skip" opts a chart's sample out too.
   Returns the list. */
(function tableCheck() {
  var fail = [], note = [];
  function name(t, i) {
    var cap = t.querySelector('caption');
    var lab = t.getAttribute('aria-label') || (cap && cap.textContent.trim()) || t.id || '';
    return 'table ' + (i + 1) + (lab ? ' "' + lab.slice(0, 32) + '"' : '');
  }
  function cellText(c) { return (c.textContent || '').replace(/\s+/g, ' ').trim(); }

  var tables = Array.prototype.filter.call(document.querySelectorAll('table'), function (t) {
    if (t.getAttribute('role') === 'presentation' || t.getAttribute('role') === 'none') { return false; }
    if (t.closest('[data-table-check="skip"]')) { return false; }
    if (!t.offsetParent && getComputedStyle(t).position !== 'fixed') { return false; }  /* not shown */
    var head = t.tHead;
    if (!head || !head.querySelector('th')) { return false; }
    if (!t.tBodies.length || !t.tBodies[0].rows.length) { return false; }
    return head.rows[0].cells.length >= 2;
  });

  tables.forEach(function (t, i) {
    var who = name(t, i), rows = t.tHead.rows, hdr = rows[0], cols = hdr.cells.length;

    /* the filter row: any head row after the first that holds controls or triggers */
    var filterRows = Array.prototype.slice.call(rows, 1);
    var boxes = [], covered = {}, panel = 0;
    filterRows.forEach(function (r) {
      Array.prototype.forEach.call(r.cells, function (c, ci) {
        var trig = c.querySelector('button[aria-haspopup], [aria-haspopup="dialog"], [aria-haspopup="listbox"], [aria-haspopup="true"]');
        var box = c.querySelector('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea');
        if (trig) { covered[ci] = true; panel++; }
        else if (box) { covered[ci] = true; boxes.push(hdr.cells[ci] ? cellText(hdr.cells[ci]) : '#' + (ci + 1)); }
      });
    });
    /* a filter field inside the header cell itself is the same defect, one row up */
    Array.prototype.forEach.call(hdr.cells, function (c, ci) {
      if (c.querySelector('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select')) {
        covered[ci] = true; boxes.push(cellText(c) || '#' + (ci + 1));
      }
    });

    if (boxes.length) {
      fail.push('BOX | ' + who + ' | ' + boxes.length + ' of ' + cols + ' column filters are a bare ' +
                'text box or select (' + boxes.slice(0, 4).join(', ') + (boxes.length > 4 ? ', ...' : '') +
                ') - T1: the filter is a button that opens a panel with sort, a value list and counts');
    }

    /* columns with a label and no filter */
    var bare = [];
    Array.prototype.forEach.call(hdr.cells, function (c, ci) {
      if (!cellText(c) || covered[ci]) { return; }
      bare.push(cellText(c));
    });
    if (bare.length && (panel || boxes.length || filterRows.length)) {
      fail.push('NOFILTER | ' + who + ' | no filter on: ' + bare.slice(0, 5).join(', ') +
                (bare.length > 5 ? ', ...' : '') + ' - T2: every column gets one');
    } else if (bare.length === cols || (!panel && !boxes.length)) {
      fail.push('NOFILTER | ' + who + ' | the table has no column filters at all - S1: a filter per column');
    }

    /* FILTERGAP. The title row and the filter row are ONE header block: no line between them,
       and the only header line sits under the filters. Agents style every cell with a bottom
       border and then zero the filter row's top padding, which glues the boxes to a line that
       cuts each title off from its own filter. Measured, in px. */
    var MINGAP = 4;
    if (filterRows.length && (panel || boxes.length)) {
      var collapsed = getComputedStyle(t).borderCollapse === 'collapse';
      function bw(el, side) {
        var cs = getComputedStyle(el);
        return cs['border' + side + 'Style'] === 'none' ? 0 : (parseFloat(cs['border' + side + 'Width']) || 0);
      }
      var titleLine = bw(hdr, 'Bottom');
      Array.prototype.forEach.call(hdr.cells, function (c) { titleLine = Math.max(titleLine, bw(c, 'Bottom')); });
      if (titleLine > 0) {
        fail.push('FILTERGAP | ' + who + ' | the title row has a ' + titleLine + 'px line under it, between ' +
                  'the titles and their filters - one header block: no line there, one line under the filters');
      }
      var gaps = [];
      filterRows.forEach(function (r) {
        Array.prototype.forEach.call(r.cells, function (c, ci) {
          var ctl = c.querySelector('button[aria-haspopup], [aria-haspopup], input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select');
          if (!ctl) { return; }
          var cr = c.getBoundingClientRect(), kr = ctl.getBoundingClientRect();
          if (!kr.height) { return; }
          var col = hdr.cells[ci] ? cellText(hdr.cells[ci]).slice(0, 20) : '#' + (ci + 1);
          /* the line above: the title row's bottom border, or this row's / cell's own top border */
          var above = Math.max(titleLine, bw(r, 'Top'), bw(c, 'Top'));
          if (above > 0) {
            var top = cr.top + (collapsed ? above / 2 : Math.max(bw(c, 'Top'), 0));
            var g = Math.round((kr.top - top) * 10) / 10;
            if (g < MINGAP - 0.01) { gaps.push('"' + col + '" ' + g + 'px below the line above'); }
          }
          /* the line below: the header/data separator under the filter row */
          var below = Math.max(bw(r, 'Bottom'), bw(c, 'Bottom'));
          if (below > 0) {
            var bot = cr.bottom - (collapsed ? below / 2 : below);
            var g2 = Math.round((bot - kr.bottom) * 10) / 10;
            if (g2 < MINGAP - 0.01) { gaps.push('"' + col + '" ' + g2 + 'px above the line below'); }
          }
        });
      });
      if (gaps.length) {
        fail.push('FILTERGAP | ' + who + ' | filter control too close to a line (needs ' + MINGAP + 'px): ' +
                  gaps.slice(0, 4).join('; ') + (gaps.length > 4 ? '; +' + (gaps.length - 4) + ' more' : ''));
      }
    }

    /* sort */
    var sortable = hdr.querySelectorAll('[aria-sort], th button, th [role=button], th.sortable, th[data-k]').length;
    if (!sortable && t.tBodies[0].rows.length > 1) {
      fail.push('NOSORT | ' + who + ' | no sortable header - S1: sort on every column');
    }

    /* the advisory three: look at the table and the region that holds it */
    var scope = t.closest('section, article, [role=region], .panel, .card, form, main') || t.parentElement;
    if (!scope.querySelector('input[type=search], input[role=searchbox], [role=search] input, input[placeholder*="earch" i], input[aria-label*="earch" i]')) {
      note.push('NOSEARCH | ' + who + ' | no search field found for this table (S1) - it may live in a toolbar outside ' + (scope.tagName || 'its container').toLowerCase());
    }
    var live = scope.querySelector('[aria-live]');
    var counted = /\b\d+\s+(of\s+\d+\s+)?(items?|results?|rows?|matches|records?|products?)\b|\b\d+\s+of\s+\d+\b/i.test(scope.textContent);
    if (!live && !counted) {
      note.push('NOCOUNT | ' + who + ' | no live result count (S1): "5 items" unfiltered, "2 of 5" narrowed, in an aria-live region');
    } else if (!live) {
      note.push('NOCOUNT | ' + who + ' | a count is shown but is not in an aria-live region, so a screen reader is not told it changed');
    }
    var mute = Array.prototype.filter.call(hdr.cells, function (c) {
      return cellText(c) && !c.getAttribute('title') && !c.getAttribute('data-tip') &&
             !c.querySelector('[data-help], [data-tip], [title], button[aria-label*="hat is" i], button[aria-label*="elp" i]');
    });
    if (mute.length) {
      note.push('NOHELP | ' + who + ' | ' + mute.length + ' header(s) with no explainer (T3): ' +
                mute.slice(0, 4).map(cellText).join(', ') + (mute.length > 4 ? ', ...' : ''));
    }
  });

  /* CHARTBOX. The filter that drives a chart or a dashboard is the T1 panel too. Agents who
     build the panel for a table column build chips, a row of tick boxes or a select the moment
     the same dimension filters a chart instead - 0 of 12 benchmark runs built the panel. Up to
     six values may be chips instead, if they show their state, a count and a clear (T1). */
  function shown(el) {
    if (!el.getClientRects().length) { return false; }
    var cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  }
  function txt(el) { return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  var charts = Array.prototype.filter.call(document.querySelectorAll('svg, canvas'), function (el) {
    if (el.closest('[data-table-check="skip"]') || !shown(el)) { return false; }
    var r = el.getBoundingClientRect();
    if (r.width <= 200 || r.height < 60) { return false; }
    if (el.tagName.toLowerCase() === 'canvas') { return true; }
    if (el.parentElement && el.parentElement.closest('svg')) { return false; }
    if (el.getAttribute('role') === 'img' || el.getAttribute('role') === 'graphics-document') { return true; }
    return el.querySelectorAll('rect, path, polyline, polygon, circle, line').length >= 3;
  });
  /* an HTML chart - bars drawn as divs - in an element whose id, class or role says so; the
     innermost one, never a whole section, and never one that holds a table or an svg chart */
  var htmlCharts = Array.prototype.filter.call(document.querySelectorAll('[role=img], [id*="chart" i], [class*="chart" i]'), function (el) {
    var tag = el.tagName.toLowerCase();
    if (['section', 'main', 'body', 'article', 'svg', 'canvas'].indexOf(tag) > -1) { return false; }
    if (el.closest('svg, [data-table-check="skip"]') || !shown(el) || el.querySelector('table, svg, canvas')) { return false; }
    var r = el.getBoundingClientRect();
    return r.width > 200 && r.height >= 60 && el.querySelectorAll('*').length >= 6;
  });
  htmlCharts.forEach(function (el) {
    if (!htmlCharts.some(function (o) { return o !== el && el.contains(o); })) { charts.push(el); }
  });
  var BOUND = 'section, article, figure, aside, [role=region], [class*="card"], [class*="panel"], [class*="widget"]';
  var POPUP = '[role=dialog], [role=menu], [role=listbox], [aria-modal], [popover], .fpop';
  var CANDS = 'select, input, [role=checkbox], [role=menuitemcheckbox], button[aria-pressed], [role=button][aria-pressed]';
  function boxOf(chart) {
    /* the chart's card: the nearest bounding ancestor, or the next one out when the nearest is
       only a wrapper with no controls in it */
    var b = chart.parentElement && chart.parentElement.closest(BOUND);
    if (b && !b.querySelector(CANDS) && !b.matches('section, article, [role=region]')) {
      b = (b.parentElement && b.parentElement.closest(BOUND)) || b;
    }
    return b || (chart.parentElement && chart.parentElement.parentElement) || chart.parentElement;
  }
  var boxes2 = charts.map(boxOf);
  function chartName(c) {
    return (c.getAttribute('aria-label') || c.id || c.tagName.toLowerCase()).slice(0, 40);
  }
  function labelText(el) {
    var out = [el.getAttribute('aria-label') || '', el.getAttribute('title') || '',
               el.getAttribute('placeholder') || ''];
    var by = el.getAttribute('aria-labelledby');
    if (by) { by.split(/\s+/).forEach(function (id) { out.push(txt(document.getElementById(id))); }); }
    if (el.labels) { Array.prototype.forEach.call(el.labels, function (l) { out.push(txt(l)); }); }
    if (el.tagName.toLowerCase() === 'fieldset') { out.push(txt(el.querySelector('legend'))); }
    var fs = el.closest('fieldset');
    if (fs) { out.push(txt(fs.querySelector('legend'))); }
    var g = el.parentElement && el.parentElement.closest('[role=group], [role=toolbar]');
    if (g) { out.push(g.getAttribute('aria-label') || ''); }
    /* the words just before it: "Sites:" in front of a row of chips */
    var prev = el.previousElementSibling;
    for (var i = 0; prev && i < 2; i++, prev = prev.previousElementSibling) {
      if (!prev.querySelector || !prev.querySelector(CANDS)) { out.push(txt(prev).slice(0, 60)); }
    }
    var seenW = {};
    return out.join(' ').split(/\s+/).filter(function (w) {
      var k = w.toLowerCase();
      if (!w || seenW[k]) { return false; }
      seenW[k] = true; return true;
    }).join(' ');
  }
  var KEY = /filter|\bshow|\bsites?\b|\bpick|\bchoos|\bwhich\b/i;
  function idsUnder(el) {
    var ids = [];
    if (el.getAttribute('aria-controls')) { ids = ids.concat(el.getAttribute('aria-controls').split(/\s+/)); }
    Array.prototype.forEach.call(el.querySelectorAll('[aria-controls]'), function (x) {
      ids = ids.concat(x.getAttribute('aria-controls').split(/\s+/));
    });
    return ids;
  }
  function chartFor(g) {
    for (var i = 0; i < charts.length; i++) {
      if (boxes2[i] && boxes2[i].contains(g)) { return i; }
    }
    /* a filter bar just outside the chart's card - "Sites: [x] [x] [x]" above it in the same
       column of the page - drives it as surely as one inside: two levels up, never further */
    var up = g.parentElement;
    for (var u = 0; up && u < 2 && up !== document.body; u++, up = up.parentElement) {
      for (var m = 0; m < charts.length; m++) {
        if (up.contains(charts[m])) { return m; }
      }
    }
    var ids = idsUnder(g);
    for (var k = 0; k < ids.length; k++) {
      var t = document.getElementById(ids[k]);
      if (!t) { continue; }
      for (var j = 0; j < charts.length; j++) {
        if (t === charts[j] || t.contains(charts[j]) || boxes2[j] === t) { return j; }
      }
    }
    return -1;
  }
  if (charts.length) {
    var groups = [], seenG = [];
    Array.prototype.forEach.call(document.querySelectorAll(CANDS), function (el) {
      if (el.closest('table, [data-table-check="skip"], ' + POPUP) || !shown(el)) { return; }
      var tag = el.tagName.toLowerCase(), type = (el.getAttribute('type') || '').toLowerCase();
      if (tag === 'input' && ['', 'text', 'search', 'checkbox'].indexOf(type) === -1) { return; }
      if (tag === 'select' || (tag === 'input' && type !== 'checkbox')) {
        groups.push({ g: el, kind: tag === 'select' ? 'a <select>' : 'a bare text box', n: 1, search: tag === 'input' });
        return;
      }
      /* a set of tick boxes or chips: grouped by the element that holds the set */
      var chip = el.hasAttribute('aria-pressed');
      if (chip && el.closest('[class*="legend"]') && !el.closest('[data-filter]')) { return; }   /* C20: a legend acts */
      var holder = el.closest('fieldset, [role=group], [role=toolbar], ul, ol') ||
                   (el.closest('label') || el).parentElement;
      var at = seenG.indexOf(holder);
      if (at === -1) {
        seenG.push(holder);
        groups.push({ g: holder, kind: chip ? 'toggle chips' : 'inline checkboxes', n: 1 });
      } else {
        groups.filter(function (x) { return x.g === holder; })[0].n++;
      }
    });
    /* up to six chips pass (T1) when a count and a Clear / All sit beside them: in the set, or
       up to two levels out, never across into another chart's card */
    var CLEARW = /^\s*(select |show )?(all|none|clear|reset)\b|\b(clear|reset)( all| selection)?\s*$/i;
    var COUNTW = /\b\d+\s*(of|\/)\s*\d+\b|\b\d+\s+(selected|shown|on)\b/i;
    function near(g, ci) {
      var out = [g], up = g.parentElement;
      for (var u = 0; up && u < 2 && up !== document.body; u++, up = up.parentElement) {
        if (charts.some(function (c, k) { return k !== ci && up.contains(c); })) { break; }
        out.push(up);
      }
      return out;
    }
    function hasCount(scope) {
      return scope.some(function (el) {
        var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false), n;
        while ((n = w.nextNode())) {
          var pe = n.parentElement;
          if (!pe || pe.closest('svg, canvas, table, ' + POPUP) || !shown(pe)) { continue; }
          if (COUNTW.test(n.nodeValue)) { return true; }
        }
        return false;
      });
    }
    function clearIn(scope) {
      return scope.some(function (el) {
        return Array.prototype.some.call(el.querySelectorAll('button, [role=button], input[type=button], input[type=reset], a[href]'), function (b) {
          return shown(b) && !b.closest(POPUP) && CLEARW.test(b.getAttribute('aria-label') || txt(b));
        });
      });
    }
    groups.forEach(function (x) {
      if ((x.kind === 'toggle chips' || x.kind === 'inline checkboxes') && x.n < 2) { return; }
      var ci = chartFor(x.g);
      if (ci === -1) { return; }
      var words = labelText(x.g);
      var marked = !!x.g.closest('[data-filter]') || !!x.g.querySelector('[data-filter]');
      if (!marked && !KEY.test(words)) { return; }
      /* a search box beside a table is that table's search (S1), not a filter on a dimension */
      if (x.search && /search/i.test(words) && boxes2[ci] && boxes2[ci].querySelector('table')) { return; }
      var lack = '', set = x.kind === 'toggle chips' || x.kind === 'inline checkboxes';
      if (set) {
        /* a chip that is itself All / Clear is the clear, not a value */
        var vals = Array.prototype.filter.call(x.g.querySelectorAll('input[type=checkbox], [role=checkbox], [aria-pressed]'), function (el) {
          return shown(el.closest('label') || el) && !CLEARW.test(el.getAttribute('aria-label') || txt(el.closest('label') || el));
        }).length;
        x.n = vals;
        if (vals < 2) { return; }
        var sc = near(x.g, ci), nc = !hasCount(sc), nx = !clearIn(sc);
        if (vals <= 6 && !nc && !nx) { return; }
        lack = vals > 6 ? ', past six values - chips wrap, cannot be searched and hide the counts'
                        : ' with no ' + (nc ? 'count ("4 of 6")' : '') + (nc && nx ? ' and no ' : '') +
                          (nx ? 'one-tap Clear or All' : '') + ' - up to six chips pass only with both';
      }
      var what = x.n > 1 ? x.n + ' ' + x.kind : x.kind;
      var said = words.replace(/\s+/g, ' ').trim().slice(0, 40);
      fail.push('CHARTBOX | chart "' + chartName(charts[ci]) + '" | its filter is ' + what +
                (said ? ' ("' + said + '")' : '') + lack + ' - T1: a chart\'s filter is the same panel as a ' +
                'column filter: a trigger showing "Sites: 6 of 6" that opens sort, value search, ' +
                'Select all / Clear selection, an n-of-m count and a value list with counts');
    });
  }

  var head = 'table check: ' + tables.length + ' table(s), ' + charts.length + ' chart(s) read';
  if (fail.length) {
    console.warn(head + ', ' + fail.length + ' failure(s)');
    fail.forEach(function (p) { console.log('  ' + p); });
  } else {
    console.log('%c' + head + ' - no failures', 'color:#1f7a4d;font-weight:700');
  }
  if (note.length) {
    console.log('  advisory (' + note.length + '):');
    note.forEach(function (p) { console.log('    ' + p); });
  }
  return { tables: tables.length, charts: charts.length, failures: fail, advisory: note };
})();
