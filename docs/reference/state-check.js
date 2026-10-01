/* State check: every table and its chart, at 0 rows, 1 row and all rows, then sorted.
   Rule 29 says a view is not finished until those states have been seen. They are the
   states a demo never reaches and a real user reaches on day one, and the defects they
   expose are silent: a chart that keeps its last marks, a legend that describes marks
   nobody can see, a count that still says 12, a time axis running Apr, Aug, Dec.

   Paste into the console on ui-rules-visual.html. It drives every table through each
   state and puts it back the way it found it. */
(function () {
  var problems = [];
  function bad(cid, state, detail) { problems.push(cid + ' @ ' + state + ' | ' + detail); }

  var errs = [];
  var prevErr = window.onerror;
  window.onerror = function (m) { errs.push(String(m)); };

  /* the count chip is the one in this chart's own section, found rather than named:
     the ids are barCount, cCount, bulCount ... and a lookup table would rot */
  function secOf(cid) {
    var host = document.getElementById(cid);
    return host ? host.closest('section') : null;
  }
  function chipFor(cid) {
    var sec = secOf(cid);
    return sec ? sec.querySelector('[id$="Count"]') : null;
  }
  /* data rows only: the empty state is itself a <tr>, and counting it makes an empty
     table look like a table with one row in it */
  function rowsOf(t) {
    return Array.prototype.slice.call(t.el.tBodies[0].querySelectorAll('tr[data-id]'));
  }
  /* a row a legend toggle has withheld from the chart is in the table on purpose and
     marked as not drawn, so it is not a missing mark. The check has to know the
     difference, or it reports the correct behaviour as a defect. */
  function drawnRowsOf(t) {
    return rowsOf(t).filter(function (tr) { return !tr.classList.contains('offrow'); });
  }
  function marksOf(cid) {
    var host = document.getElementById(cid);
    return host ? Array.prototype.slice.call(host.querySelectorAll('[data-id]')) : [];
  }
  function textOf(cid) {
    var host = document.getElementById(cid);
    return host ? host.textContent.replace(/\s+/g, ' ').trim() : '';
  }
  function legendOf(cid) {
    var sec = secOf(cid);
    return sec ? sec.querySelector('.legend') : null;
  }

  function checkLegend(cid, state) {
    /* checked on EVERY path including the empty one. Left below the early return, this
       is exactly the assertion that would have caught a legend whose toggles changed
       state while their labels did not (C15). */
    var lg = legendOf(cid);
    if (!lg) { return; }
    if (!lg.querySelector('li')) { bad(cid, state, 'legend is empty'); }
    Array.prototype.forEach.call(lg.querySelectorAll('button'), function (b) {
      var pressed = b.getAttribute('aria-pressed');
      var tip = b.dataset.tip || b.getAttribute('aria-label') || '';
      if (pressed === null) { return; }
      /* the label says which way the click will go, so it has to agree with the state */
      if (pressed === 'true' && /click to show|^show /i.test(tip)) {
        bad(cid, state, 'legend entry is on but offers to show it: ' + JSON.stringify(tip));
      }
      if (pressed === 'false' && /click to hide|^hide /i.test(tip)) {
        bad(cid, state, 'legend entry is off but offers to hide it: ' + JSON.stringify(tip));
      }
    });
  }

  /* A legend toggle must survive being used, and must never be able to empty the
     chart: both are C16, and both passed every earlier check because nothing here had
     ever clicked a legend twice. */
  function checkLegendControls(cid) {
    var lg = legendOf(cid);
    if (!lg) { return; }
    var before = lg.querySelectorAll('button').length;
    /* C20: a legend made entirely of keys is the smell. Four charts sat like that for
       five rounds of review because nothing ever asked. An entry that names a set of
       marks acts on it - hides, filters or highlights - and only an entry that names no
       subset at all (an encoding note, a single marker) is passive. */
    if (!before) {
      bad(cid, 'legend', 'every entry is a passive key: nothing in this legend acts on ' +
        'the marks it names (C20)');
      return;
    }
    var names = Array.prototype.map.call(lg.querySelectorAll('button'), function (b) {
      return b.textContent.trim();
    });
    lg.querySelectorAll('button')[0].click();
    var after = Array.prototype.map.call(legendOf(cid).querySelectorAll('button'),
      function (b) { return b.textContent.trim(); });
    if (after.indexOf(names[0]) === -1) {
      bad(cid, 'legend', 'using the toggle for "' + names[0] +
        '" removed the control that turns it back on (C16)');
    }
    /* re-run the full check in the toggled state. Without this the assertions above
       exist and never execute in the one state that breaks them, which is how a
       legend-hidden row stayed in the footer total while the check passed. */
    checkDrawn(cid, 'legend toggled');
    /* Drive every toggle to OFF and verify it got there. Clicking blindly three times
       over gave the first button an even number of clicks across the whole probe, so it
       ended up back on and the assertion below was evaluated in a state where one series
       was always still drawn - a check that could not fail (rule 29a). */
    for (var pass = 0; pass < 4; pass++) {
      Array.prototype.forEach.call(legendOf(cid).querySelectorAll('button'),
        function (b) {
          if (b.getAttribute('aria-pressed') === 'true') { b.click(); }
        });
    }
    var stillOn = Array.prototype.filter.call(
      legendOf(cid).querySelectorAll('button'), function (b) {
        return b.getAttribute('aria-pressed') === 'true';
      }).length;
    if (stillOn > 1) {
      bad(cid, 'legend', stillOn + ' entries are still on after driving every toggle ' +
        'off: the probe never reached the state it is meant to test');
    }
    if (!marksOf(cid).length && drawnRowsOf(TABLES[cid]).length) {
      bad(cid, 'legend', 'every series can be switched off, leaving a chart with ' +
        'nothing drawn and rows still in the table (C16)');
    }
    checkDrawn(cid, 'legend all toggled');
    /* and with the view narrowed to something the legend has switched off: the guard
       that refuses the last series is easy to write against the wrong count */
    var t = TABLES[cid];
    var offRow = rowsOf(t).filter(function (tr) {
      return tr.classList.contains('offrow');
    })[0];
    if (offRow) {
      var txt = (offRow.cells[0] ? offRow.cells[0].textContent : '').trim();
      if (txt) {
        t.search(txt);
        var msg = textOf(cid);
        if (!marksOf(cid).length && !/legend|switched off|hidden/i.test(msg)) {
          bad(cid, 'legend + search', 'chart is empty because the matching rows are ' +
            'switched off, and does not say so: ' + JSON.stringify(msg.slice(0, 60)));
        }
        t.reset();
      }
    }
    if (!legendOf(cid).querySelectorAll('button').length) {
      bad(cid, 'legend', 'switching everything off left no controls to switch back on');
    }
  }

  /* The readout is shared state the chart does not own. Every chart's empty guard
     returns before its own mark binding, so this probe selects a mark FIRST and then
     empties the table: without it, ten charts reported a selection that no longer
     existed and every check still passed (rule V2). */
  function checkSelectionPruned(cid) {
    var t = TABLES[cid];
    var first = t.el.tBodies[0].querySelector('tr[data-id]');
    if (!first || typeof toggleMark !== 'function') { return; }
    toggleMark(cid, first.dataset.id);
    t.search('zzq-no-such-value');
    var sec = secOf(cid);
    var ro = sec && sec.querySelector('.readout');
    if (ro && ro.getAttribute('data-show') === '1') {
      bad(cid, '0 rows', 'readout still on screen, describing marks that are gone: ' +
        JSON.stringify(ro.textContent.replace(/\s+/g, ' ').trim().slice(0, 50)));
    }
    if (SEL[cid] && SEL[cid].length) {
      bad(cid, '0 rows', SEL[cid].length + ' ids still selected with 0 rows on screen');
    }
    var cs = sec && sec.querySelector('[id$="ClearSel"]');
    if (cs && !cs.hidden) {
      bad(cid, '0 rows', 'Clear selection is still offered with nothing selected');
    }
    t.reset();
  }

  function checkDrawn(cid, state) {
    var t = TABLES[cid];
    var rows = rowsOf(t);
    var marks = marksOf(cid);
    var markIds = {};
    marks.forEach(function (m) { markIds[m.getAttribute('data-id')] = 1; });

    checkLegend(cid, state);

    if (!rows.length) {
      /* 0 rows: the chart must SAY it is empty, and say the true reason. Marks left over
         from the last draw are the worst failure here, because the page looks right and
         is lying. */
      if (marks.length) { bad(cid, state, marks.length + ' marks still drawn with 0 rows'); }
      var msg = textOf(cid);
      if (!msg) { bad(cid, state, 'no empty message: the chart area is simply blank'); }
      if (/every series is hidden|switch one back on/i.test(msg)) {
        var lg = legendOf(cid);
        var offs = lg ? lg.querySelectorAll('button[aria-pressed="false"]').length : 0;
        if (!offs) {
          bad(cid, state, 'empty message blames hidden series, but none is hidden: ' +
            JSON.stringify(msg.slice(0, 60)));
        }
      }
      return;
    }

    var drawnRows = drawnRowsOf(t);
    if (!marks.length && drawnRows.length) {
      bad(cid, state, drawnRows.length + ' rows and no marks at all');
    }
    drawnRows.forEach(function (tr) {
      if (tr.dataset.id && !markIds[tr.dataset.id]) {
        bad(cid, state, 'row "' + tr.dataset.id + '" is in the table and not on the chart');
      }
    });
    /* and the reverse: a row marked "not drawn" must actually not be drawn */
    rows.forEach(function (tr) {
      if (tr.classList.contains('offrow') && markIds[tr.dataset.id]) {
        bad(cid, state, 'row "' + tr.dataset.id + '" is marked not drawn and is on the chart');
      }
    });
    /* and nothing on the chart that the table is not showing (C2) */
    Object.keys(markIds).forEach(function (id) {
      var inTable = rows.some(function (tr) { return tr.dataset.id === id; });
      if (!inTable && id !== 'total') {
        bad(cid, state, 'mark "' + id + '" is on the chart and not in the table');
      }
    });

    var chip = chipFor(cid);
    if (chip && /\d/.test(chip.textContent)) {
      var n = parseInt(chip.textContent.match(/\d+/)[0], 10);
      /* the chip's FIRST number is what is drawn, whether or not anything is withheld */
      if (n !== drawnRows.length) {
        bad(cid, state, 'count leads with ' + n + ', ' + drawnRows.length +
          ' rows are drawn');
      }
    }
  }

  /* Charts whose x axis carries its own order (C18). Sorting the table must NOT reorder
     these; sorting the table must reorder every other ordered chart. Both directions are
     defects, so both are checked. */
  /* Charts where each MARK is a position on an ordered axis: the table may be sorted
     any way, the marks may not move. The radar is here because its axes are alphabetical
     by rule, so sorting the table must not reshape it.

     Deliberately NOT here: the bump chart. Each of its marks is a series, so the order
     the marks appear in is row order and follows the table correctly; its ordered axis
     is the quarter axis, which lives INSIDE each series and is iterated structurally.
     Asserting mark order there tests the wrong thing and fails on correct behaviour. */
  var AXIS_ORDER = { bars: 1, candle: 1, stack: 1, wf: 1, area: 1, stream: 1,
                     step: 1, fun: 1, radar: 1 };

  function markOrder(cid) {
    /* first mark per id, in document order */
    var seen = {}, out = [];
    marksOf(cid).forEach(function (m) {
      var id = m.getAttribute('data-id');
      if (!seen[id]) { seen[id] = 1; out.push(id); }
    });
    return out;
  }

  function checkSort(cid) {
    var t = TABLES[cid];
    var before = markOrder(cid);
    var ths = Array.prototype.slice.call(t.el.querySelectorAll('th.sortable'));
    if (!ths.length) { bad(cid, 'sort', 'no sortable columns at all'); return; }

    ths.forEach(function (th) {
      /* both directions: one click is ascending, and a check that never clicks twice
         never sees a descending sort at all */
      [1, 2].forEach(function (nth) {
      th.click();
      var k = th.dataset.k;
      /* the header must announce the sort it actually applied */
      if (t.state.sort.k === k && th.getAttribute('aria-sort') === 'none') {
        bad(cid, 'sort', 'sorted by ' + k + ' but the header announces aria-sort="none"');
      }
      var others = ths.filter(function (o) { return o !== th; })
        .filter(function (o) { return o.getAttribute('aria-sort') !== 'none'; });
      if (others.length) {
        bad(cid, 'sort', 'two columns announce a sort at once: ' + k + ' and ' +
          others[0].dataset.k);
      }
      var after = markOrder(cid);
      var tableOrder = rowsOf(t).filter(function (tr) {
        return !tr.classList.contains('offrow');
      }).map(function (tr) { return tr.dataset.id; });
      if (AXIS_ORDER[cid]) {
        if (after.join('|') !== before.join('|')) {
          bad(cid, 'sort by ' + k, 'the axis re-ordered itself to follow the table (C18): ' +
            after.slice(0, 4).join(', '));
        }
      } else if (document.querySelectorAll('#' + cid + ' [data-group]').length) {
        /* A hierarchical chart has a third kind of order: the GROUPS are its own (a
           sunburst that reshuffled its phases every time the table was sorted would not
           be a hierarchy), while the leaves inside a group follow the table. Asserting
           either of the other two rules here fails on correct behaviour, so what is
           checked is the thing that would actually be broken: a group's leaves must stay
           contiguous, or the ring stops meaning anything. */
        var seenGroups = [], lastGroup = null, broken = null;
        Array.prototype.forEach.call(
          document.querySelectorAll('#' + cid + ' [data-id]'), function (el) {
            var g = el.closest('[data-grp-of]');
            g = el.getAttribute('data-grp') || (g && g.getAttribute('data-grp-of')) || '';
            if (g === lastGroup) { return; }
            if (seenGroups.indexOf(g) > -1) { broken = g; }
            seenGroups.push(g);
            lastGroup = g;
          });
        if (broken) {
          bad(cid, 'sort by ' + k, 'group "' + broken +
            '" is split into more than one run, so the hierarchy no longer reads (C18)');
        }
      } else if (after.length && tableOrder.length &&
                 after.join('|') !== tableOrder.join('|')) {
        /* the other half of the same rule, which the comment claimed and the code did
           not: every chart WITHOUT its own axis order follows the table exactly (C2) */
        bad(cid, 'sort by ' + k, 'the chart did not follow the table order (C2): chart ' +
          after.slice(0, 3).join(', ') + ' against table ' + tableOrder.slice(0, 3).join(', '));
      }
      checkDrawn(cid, 'sorted by ' + k + ' (' + (nth === 1 ? 'asc' : 'desc') + ')');
      });
    });
    /* for a series chart the inner axis is what must not move: the points of any one
       series run left to right, whatever the table is sorted by */
    Array.prototype.forEach.call(
      document.querySelectorAll('#' + cid + ' polyline[points]'), function (pl) {
        var xs = pl.getAttribute('points').split(' ')
          .map(function (pt) { return parseFloat(pt.split(',')[0]); });
        for (var i = 1; i < xs.length; i++) {
          if (xs[i] < xs[i - 1]) {
            bad(cid, 'sort', 'a series runs backwards along its own axis (C18)');
            return;
          }
        }
      });
    t.reset();
    if (markOrder(cid).join('|') !== before.join('|')) {
      bad(cid, 'sort', 'Clear did not restore the original order');
    }
  }

  /* Clear must put back everything it claims to put back, including the chart-side
     state that the table knows nothing about (rule A3). */
  var GLOBALS = ['pieOff', 'barsOff', 'ixOff', 'stackOff', 'dvShow', 'hbarSel', 'bulSel',
                 'stackMode', 'bulShowTarget', 'bulShowBand'];
  function snapshot() {
    var out = {};
    GLOBALS.forEach(function (k) {
      try { out[k] = JSON.stringify(window[k]); } catch (e) { out[k] = 'unreadable'; }
    });
    return out;
  }

  /* ------------------------------------------------------------------ overlays
     A modal claims the whole screen. Four things have to be true while it is open and
     none of them is true by default in a hand-rolled overlay; `<dialog>.showModal()`
     gives three of them and silently leaves the fourth, which is the one that gets
     shipped: the page behind goes on scrolling under a box that has stopped the world.

     Checked by opening the real dialog and trying to break each one. */
  function checkModal() {
    var dlg = document.getElementById('dlg');
    if (!dlg || typeof confirmDelete !== 'function') { return; }
    var beforeY = window.scrollY;
    /* Park where there is definitely room to scroll DOWN. Probed from wherever the page
       happened to be, this assertion passes whenever that spot is the bottom - a check
       that cannot fail because it cannot move (rule 29a). */
    window.scrollTo(0, 0);
    if (document.documentElement.scrollHeight < window.innerHeight + 300) {
      problems.push('modal | the page is too short to test a background scroll lock');
      return;
    }
    /* The opener is parked off-screen and focused WITHOUT scrolling. Appended to the end
       of the body and focused normally, the browser scrolled it into view - to the very
       bottom of a 34,000px page - so the scroll assertion below had nowhere left to
       scroll and passed against a page that was not locked at all. The probe moved the
       thing it was measuring, which is the quietest way for a check to stop working. */
    var opener = document.createElement('button');
    opener.textContent = 'probe';
    opener.style.cssText = 'position:fixed;top:0;left:-9999px';
    document.body.appendChild(opener);
    opener.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    if (window.scrollY !== 0) {
      problems.push('modal | could not park the page at the top to test the lock');
      document.body.removeChild(opener);
      return;
    }

    confirmDelete({ title: 'Probe', body: 'probe', ok: 'Delete', done: 'done',
                    restored: 'restored', undo: function () {}, onOk: function () {} });

    if (!dlg.open) {
      problems.push('modal | the confirm dialog did not open');
      document.body.removeChild(opener);
      return;
    }
    if (!dlg.matches(':modal')) {
      problems.push('modal | opened non-modally, so nothing behind it is inert');
    }

    /* 1. the page behind must not scroll.

       This one asserts the MECHANISM, not the behaviour, and that is a deliberate
       choice rather than a shortcut. Measured on this page: `overflow:hidden` on the
       root does not stop `scrollBy` (moved 200px) or `scrollTop` (moved 150px), because
       programmatic scrolling ignores it by design; and a synthetic wheel event scrolls
       nothing at all whether the page is locked or not, because untrusted events never
       scroll. So a script can neither perform the user's gesture nor be blocked by the
       lock, and any assertion written as "try to scroll and see" is a coin that always
       lands the same way up.

       What is checkable is that one of the two mechanisms that DO stop a real wheel or
       a real finger is in force. Both are listed, so a page using either passes. */
    var de = document.documentElement;
    var rootHidden = getComputedStyle(de).overflow === 'hidden' ||
                     getComputedStyle(document.body).overflow === 'hidden';
    var bodyPinned = getComputedStyle(document.body).position === 'fixed';
    if (!rootHidden && !bodyPinned) {
      problems.push('modal | nothing stops the background scrolling: the root is not ' +
        'overflow:hidden and the body is not position:fixed, so a wheel over the page ' +
        'behind the overlay still moves it');
    }

    /* 2. nothing behind may take focus */
    var behind = document.querySelector('input, select, a[href]');
    if (behind && !dlg.contains(behind)) {
      behind.focus();
      if (document.activeElement === behind) {
        problems.push('modal | focus reached ' +
          (behind.id || behind.tagName) + ' behind the overlay');
      }
    }

    /* 3. nothing behind may be clickable: whatever is on top at a background point
          must be the dialog or its backdrop, never the element itself */
    if (behind) {
      var r = behind.getBoundingClientRect();
      if (r.width) {
        var top = document.elementFromPoint(r.left + 3, r.top + 3);
        if (top === behind || (top && behind.contains(top))) {
          problems.push('modal | a click at a background point still lands on ' +
            (behind.id || behind.tagName));
        }
      }
    }

    /* 4. dismissed the way a user dismisses it, and the lock comes off with it.
          Escape is not simulated here: a synthetic keydown does not drive the browser's
          own dialog handling, so an assertion on it would pass whatever the page did.
          What guarantees Escape is `:modal`, which is asserted above. */
    var cancel = document.getElementById('dlgCancel');
    if (cancel) { cancel.click(); } else { dlg.close('cancel'); }

    if (document.documentElement.getAttribute('data-scroll-locked')) {
      problems.push('modal | the scroll lock was not released when the overlay closed');
    }
    if (document.documentElement.style.overflow === 'hidden') {
      problems.push('modal | the page is still unscrollable after the overlay closed');
    }
    document.body.removeChild(opener);
    window.scrollTo(0, beforeY);
  }

  /* a NON-modal popover is the opposite contract: the page behind stays live, so it
     must not lock anything, and it must take itself out of the way on an outside scroll */
  function checkPopovers() {
    ['pop', 'fpop'].forEach(function (cls) {
      var el = document.getElementById(cls) || document.querySelector('.' + cls);
      if (!el) { return; }
      if (el.getAttribute('aria-modal') === 'true' &&
          !document.documentElement.getAttribute('data-scroll-locked')) {
        problems.push(cls + ' | says aria-modal="true" and locks nothing behind it');
      }
    });
  }

  var boot = snapshot();

  Object.keys(TABLES).forEach(function (cid) {
    var t = TABLES[cid];
    if (!document.getElementById(cid)) { bad(cid, 'setup', 'no chart element #' + cid); return; }
    var all = rowsOf(t).length;

    /* 0 rows: a search no value can contain */
    t.search('zzq-no-such-value');
    checkDrawn(cid, '0 rows');

    /* 1 row: search by what the row SHOWS, not by its id. The time series is keyed
       "2025-09" and displays "Sep 2025", and search matches the displayed values, which
       is the right behaviour and would make an id-based probe report a false defect. */
    /* Any cell will do. Searching only the first column cannot isolate a row in a table
       whose first column repeats - a sankey lists four flows from one source - and that
       is a limit of the probe, not a defect in the table. */
    var one = null;
    t.reset();
    var candidates = [];
    rowsOf(t).forEach(function (tr) {
      Array.prototype.forEach.call(tr.cells, function (td) {
        var txt = (td.textContent || '').trim();
        if (txt && candidates.indexOf(txt) === -1) { candidates.push(txt); }
      });
    });
    candidates.forEach(function (txt) {
      if (one) { return; }
      t.search(txt);
      if (rowsOf(t).length === 1) { one = txt; }
    });
    if (one) { t.search(one); checkDrawn(cid, '1 row'); } else {
      bad(cid, '1 row', 'no search term isolates a single row');
    }

    t.reset();
    checkDrawn(cid, 'all rows');
    if (rowsOf(t).length !== all) {
      bad(cid, 'restore', 'started at ' + all + ' rows, ended at ' + rowsOf(t).length);
    }

    checkSort(cid);
    checkSelectionPruned(cid);
    checkLegendControls(cid);
  });

  /* required fields (rule F1) and a repeated toast (rule A2) */
  checkRequiredForm();
  checkToastRepeat();

  /* every legend control, switched, then cleared: the page must be back where it began */
  checkModal();
  checkPopovers();

  Array.prototype.forEach.call(document.querySelectorAll('.legend button'), function (b) {
    b.click();
  });
  Array.prototype.forEach.call(document.querySelectorAll('button[id$="Clear"]'), function (b) {
    b.click();
  });
  var after = snapshot();
  GLOBALS.forEach(function (k) {
    if (boot[k] !== after[k]) {
      problems.push('clear | ' + k + ' | started ' + boot[k] + ', ended ' + after[k]);
    }
  });

  /* A form whose required fields are empty must refuse, mark all of them, and land the
     cursor in the first. Each half of that has been shipped without the others before. */
  function checkRequiredForm() {
    var form = document.getElementById('reqForm');
    if (!form) { problems.push('required | reqForm is gone'); return; }
    Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (i) {
      i.value = '';
    });
    var created = false;
    form.addEventListener('submit', function () { created = true; }, { once: true });
    form.querySelector('button[type="submit"]').click();
    var marked = form.querySelectorAll('[aria-invalid="true"]').length;
    var shown = form.querySelectorAll('.nudge:not([hidden])').length;
    var need = form.querySelectorAll('[required]').length;
    if (marked !== need) {
      problems.push('required | marked ' + marked + ' of ' + need + ' empty fields');
    }
    if (shown !== need) {
      problems.push('required | ' + shown + ' nudges shown for ' + need + ' empty fields');
    }
    if (document.activeElement !== form.querySelector('[required]')) {
      problems.push('required | focus did not land in the first missing field');
    }
    /* and it stops complaining as soon as it is filled, without another exit */
    var first = form.querySelector('[required]');
    first.value = 'Taman Sri Indah';
    first.dispatchEvent(new Event('input', { bubbles: true }));
    if (first.getAttribute('aria-invalid') === 'true') {
      problems.push('required | still marked invalid after being filled');
    }
    Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (i) {
      i.value = '';
      i.dispatchEvent(new Event('input', { bubbles: true }));
    });
    Array.prototype.forEach.call(document.querySelectorAll('#toasts .toast'), function (t) {
      t.remove();
    });
  }

  /* The same message three times is one toast carrying a count, not three nodes and not
     one node removed and re-added, which is what made it flicker. */
  function checkToastRepeat() {
    if (typeof toast !== 'function') { return; }
    var host = document.getElementById('toasts');
    Array.prototype.forEach.call(host.children, function (t) { t.remove(); });
    var a = toast({ text: 'state check repeat' });
    toast({ text: 'state check repeat' });
    var c = toast({ text: 'state check repeat' });
    if (host.children.length !== 1) {
      problems.push('toast | ' + host.children.length + ' nodes for one repeated message');
    }
    if (a !== c) { problems.push('toast | the node was replaced instead of counted'); }
    var n = host.querySelector('.n');
    if (!n || n.textContent !== 'x3') {
      problems.push('toast | count reads ' + (n ? n.textContent : 'nothing') + ', not x3');
    }
    /* a different kind is a different event, and an undoable one is never merged */
    toast({ kind: 'err', text: 'state check repeat' });
    toast({ text: 'state check repeat', undo: function () {} });
    if (host.children.length !== 3) {
      problems.push('toast | merged across kind or undo: ' + host.children.length + ' nodes');
    }
    Array.prototype.forEach.call(host.children, function (t) { t.remove(); });
  }

  window.onerror = prevErr;
  errs.forEach(function (m) { problems.push('THREW | ' + m); });

  if (!problems.length) {
    console.log('%cstate check: clean across ' + Object.keys(TABLES).length + ' charts',
      'color:#1f7a4d;font-weight:700');
  } else {
    console.warn('state check: ' + problems.length + ' problem(s)');
    problems.forEach(function (p) { console.log('  ' + p); });
  }
  return problems;
}());
