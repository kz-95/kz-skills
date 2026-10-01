# Engineering Rules (Non-UI)

Rules that apply to all work. UI-specific rules live in [ui-rules.md](../../kz-uiuxrule/rules/ui-rules.md).

Three layers: **L0** always applies. **L1** applies to any code work. **S** rules are
standing, they fire in any layer whenever their trigger appears, including inside UI work.

---

## These are defaults, not laws

Every rule here is a **default**: what to do when the project has not decided otherwise.
A project rule always wins.

**Order of precedence, highest first:**

1. **An explicit instruction in the current task.** "Just sketch it, no polish" overrides
   the production-quality rules for that task.
2. **The project's own rules**, wherever they live: a `CLAUDE.md`, a design system, a
   documented convention, a lint or CI rule.
3. **The existing code**, when it is consistent. If every table in the codebase already
   uses one filter pattern, match it rather than introducing the one written here. A rule
   followed in one screen and nowhere else is worse than either choice applied
   consistently (rules 12, 13 and D4).
4. **These documents.**

**How to depart from a rule:**

- Say which rule and why, in one line, at the time. Do not depart silently: the next
  person cannot tell a decision from an oversight.
- If the project keeps departing from the same rule, the rule is wrong for this project.
  Change it here rather than overriding it every time.
- Record the project-specific version where the project's rules live, not in this file.
  This file stays general.

**What does not bend, whatever the project says:** the safety floor. Input validation at
trust boundaries, error handling that prevents data loss, security measures, accessibility
basics, and the confirmation guard on destructive actions (S2). A project convention that
removes one of those is a bug in the convention, so raise it rather than following it.

---


## L0, Always (behavior, honesty, attribution)

| # | Rule |
|---|---|
| 1 | **Think before acting.** Understand the task before changing anything. |
| 2 | **Never invent project facts.** No fabricated APIs, files, functions, dependencies, behavior, requirements, or test results. |
| 3 | **Ask only when blocked.** If reasonable assumptions allow progress, state them and continue. Ask only when being wrong would make the work useless or unsafe. |
| 4 | **Explain visually when it's clearer.** Diagrams, tables, flows over long prose. |
| 5 | **Change the explanation, not the volume.** If the first explanation didn't land, use a different method, don't repeat louder. |
| 6 | **Treat repeat mistakes as patterns.** Recognize recurrence, change the working approach, and record the lesson in the project's memory/rules file if one exists. |
| 7 | **ASCII only in source and docs.** No em dash, curly quotes, ellipsis character, arrows, box-drawing or decorative glyphs in any file. See Appendix: ASCII discipline. |
| 8 | **No AI attribution, anywhere.** No `Co-authored-by` for the AI, no "Generated with...", no AI as author/contributor/reviewer/committer/copyright holder. |
| 9 | **Finish with a concise summary.** What changed, extra issues fixed, assumptions made, remaining concerns. |

---

## L1, Any code work

### 1.1 Understand first

| # | Rule |
|---|---|
| 9a | **Read existing code first**, structure, dependencies, conventions, surrounding implementation. |
| 10 | **Find the root cause before fixing.** A report names a symptom, not the defect. |
| 10a | **The second one is a parameter, the third one is a bug.** Write it. When the same shape is needed again, make the difference an argument rather than a copy - `calculate(1+1)` becomes `calculate(a, b)`. When a variant needs more, compose on top of the existing one rather than beside it. Two near-identical functions are two places for the next fix to be applied to one of. |
| 10b | **A shared function inherits the invariants of every caller, not just the one in front of you.** Before folding the second case into the first, list what each caller guaranteed on its own and check the shared version still guarantees all of it. An invariant that was implicit in the code you deleted is the one that goes missing. |
| 11 | **Trace every caller** before editing a shared function. One guard in the shared path beats a guard in each caller, and fixing only the reported path leaves siblings broken. |

### 1.2 Fit the codebase

| # | Rule |
|---|---|
| 12 | **Follow the existing architecture.** No competing pattern without a strong, stated reason. |
| 13 | **Follow existing conventions**, naming, formatting, file organization, style, established behavior. |
| 14 | **Reuse existing abstractions**, utilities, components, hooks, services, schemas, helpers. Look before you write. |

### 1.3 Size the solution, climb until a rung holds, *after* understanding

| # | Rule |
|---|---|
| 15 | **Does it need to exist?** Speculative need -> skip it, say so in one line. |
| 16 | **Prefer, in order:** existing code in this repo -> stdlib -> native platform feature -> already-installed dependency -> minimum new code. Never add a dependency for what a few lines do. |
| 17 | **Smallest correct change.** Minimum surface area that *fully* solves the problem. A small diff in the wrong place is a second bug, not laziness. |
| 18 | **No unrequested abstractions.** No interface with one implementation, no factory for one product, no config for a value that never varies. |
| 19 | **Extract genuinely shared logic**, but **don't over-generalize**, abstract only when it serves multiple real use cases and improves clarity. |
| 20 | **Avoid unnecessary hardcoding** where a value genuinely needs to vary, and don't replace simple fixed behavior with config that doesn't. |
| 21 | **Simple over clever.** Boring code is what survives being read at 3am. |

### 1.4 Quality bar

| # | Rule |
|---|---|
| 22 | **Production-quality.** Clean, maintainable, idiomatic, understandable. |
| 23 | **Keep quality attributes in view**, performance, security, accessibility, scalability, maintainability. |
| 24 | **Avoid waste**, needless dependencies, complexity, rerenders, allocations, network calls, bundle growth. |
| 25 | **Optimize where there's real value**, not for its own sake. |
| 26 | **Never simplify away**: input validation at trust boundaries, error handling that prevents data loss, security measures, accessibility basics, or anything explicitly requested. |

### 1.5 Scope discipline

| # | Rule |
|---|---|
| 27 | **Fix relevant nearby problems** when obvious, safe, low-risk, and directly related, then mention them. |
| 28 | **Don't let opportunistic improvement expand the task.** Safe and relevant, or leave it and report it. |

### 1.6 Close out

| # | Rule |
|---|---|
| 29 | **Update tests when behavior changes.** Non-trivial logic leaves behind one runnable check that fails if the logic breaks. Trivial one-liners need none. |
| 30 | **Update documentation when behavior changes.** |
| 31 | **Mark deliberate corners** with a comment naming the ceiling and upgrade path (e.g. global lock, O(n^2) scan, naive heuristic). |
| 32a | **A scripted edit that matches nothing must fail loudly.** Assert on every replacement and stop on the first miss, so a silent no-match cannot report success. Re-run the thing being edited afterwards: a clean scan does not prove the file still works. |
| 29c | **Every cross-reference resolves.** A citation of a rule, an appendix or a document that does not exist is worse than no citation: it is believed, and the reader spends their time looking for it. Check the reference at the moment you write it, and check the index in the same change - which also means a rule is written before it is cited, not after. |
| 29b | **Make sure you are running the file you just edited.** A cached script, a stale build, a watcher that did not fire: the check runs an old copy and passes, and the pass is about code that no longer exists. Bust the cache, or assert on something the new version contains before trusting the result. |
| 29a1 | **A check needs something independent to check against.** Comparing a value with another view of the same value always passes: a flow diagram that summed its own links twice and compared the totals "verified" conservation that it could not have detected breaking. Introduce the second, declared figure, or admit there is no check. |
| 29a | **A check has to be shown failing.** Break the thing it guards, watch it fail, then put it back. A check that has never failed is a check that has never run the path it claims to cover: three assertions written for defects found in review passed against the page that still had those defects, because they never executed in the state that breaks them. |
| 32b | **A captured default is a copy, not a reference.** Snapshotting an array or object to restore later and then holding the live reference means every change to the state also changes the "default", and the reset quietly restores whatever the user last did. `d.slice()` / `{...d}` at capture time, not only at restore time. |
| 32 | **Final review before done**, correctness, consistency, regressions, unfinished work, leftover placeholders. |

---

## S: Standing rules

These fire in any situation, new or existing code. They are listed here and in
[ui-rules.md](../../kz-uiuxrule/rules/ui-rules.md) because they most often apply to UI but must never be
scoped out by a "this isn't a new UI task" reading.

| # | Rule |
|---|---|
| S1 | **Every table ships a search bar + sort on every column + a filter per column.** Search spans all columns; filters narrow one column; the two combine. **A "filter" is the panel of T1: a button in the filter row that shows the column's state (`All`, `3 of 12`) and opens sort, a searchable value list with counts and, for numbers, a range - never a bare text box or a select.** An empty typed box under each header is what an unread rule produces, and it is a defect: the user has to know the exact value to type, and cannot pick, exclude or see what exists. Before building any table, read T1-T3 and Appendix A of `ui-rules.md`. The title and filter rows form one header block with one line, under the filters. Numeric sort for numbers, `localeCompare(..., { numeric: true })` for text, `aria-sort` on the active column. Show the result count and a distinct no-matches empty state. Not a follow-up, not only when asked. |
| S2 | **Every destructive action is behind a confirm modal that names the target**, with a clearly labelled cancel. Bulk deletes state the count. Never a bare click, never only `window.confirm`. |

**Why these are standing and not situational:** they are the two things most often
left out of generated UI, and S2's absence loses real data.

---

## Open questions

- No rules yet for: debugging, database changes, API changes, refactoring, forms, agent handoffs.

---

## Appendix: ASCII discipline (rule 7)

**Why:** a non-ASCII byte is a character some machine in the chain cannot read. It breaks
in a terminal with the wrong code page, in a CSV opened by another tool, in a diff, in a
log, in a `grep`, and in any pipeline that assumes latin-1 or cp1252. It also survives
copy-paste into code and produces a syntax error far from where it was introduced.

The em dash is the worst offender because it is the one an LLM reaches for by default, so
its presence is both a portability bug and a tell (rule D6 in the UI rules).

### Substitutions

| Instead of | Write |
|---|---|
| em dash, en dash, minus sign | `-`, or restructure with a comma, colon or parentheses |
| curly quotes and apostrophes | `'` and `"` |
| ellipsis character | `...` |
| arrows | `->`, `<-`, `<->`, `^`, `v` |
| `<=`, `>=`, multiplication sign | `<=`, `>=`, `x` |
| box-drawing characters | `-`, `|`, `+` |
| check, cross, bullet glyphs, emoji | an SVG icon, or `[ok]` / `[x]` / `*` in plain text |
| superscripts | `^2` |

### Where a real glyph is genuinely needed

Keep the **source** ASCII and let the renderer produce the character:

- CSS: `content: " \25B2"` renders an up arrow from an ASCII-only stylesheet.
- JavaScript: `'\u2019'` in a string literal.
- HTML: a named entity, or better, an inline SVG icon.
- Never paste the literal character into the file.

### Two traps found the hard way

1. **Replacing a character inside a quoted string can break the file.** Converting a
   typographic apostrophe to `'` inside a single-quoted JavaScript string terminates the
   string early. The parse error appears at a line far from the change, and the whole
   script silently stops running. Prefer rewording (`Couldn't` -> `Could not`) over
   escaping.
2. **A shell heredoc eats backslashes.** Writing a conversion script inline through a
   heredoc mangles `\u` escapes and `\'`. Write the script to a file and run it.

After any bulk conversion, re-scan for remaining non-ASCII **and** re-run the thing that
was converted. A clean scan does not prove the file still parses.

### Enforce it with a hook, do not rely on remembering

A rule that depends on vigilance fails eventually. This project enforces rule 7
automatically: `.claude/hooks/ascii-punct.py` runs as a `PostToolUse` hook on
`Write|Edit|MultiEdit` and rewrites typographic punctuation to ASCII in the file that was
just written.

- **Conservative on purpose.** It maps only punctuation with an exact ASCII counterpart:
  dashes, curly quotes, ellipsis, non-breaking spaces, arrows, comparison signs. Letters,
  CJK, emoji and accented characters are untouched, because a file may legitimately
  contain them (content, i18n, a person's name).
- **Scoped by extension**, and it skips `node_modules`, `.git`, `dist`, `build`, and any
  file that is not valid UTF-8 text.
- **It reports what it changed.** A silent rewrite of a file you just wrote is worse than
  the character it fixed, so the hook prints which marks it replaced and how many.
- **It does not replace the check.** The hook fixes files this tool writes; it cannot fix
  a file written by something else, so the project-wide scan still has a job.

Promote it to `~/.claude/settings.json` to apply it to every project, but consider that
carefully first: a global rewrite hook will also touch repositories that hold deliberate
Unicode.

---

## Appendix: composing rather than copying (rule 10a)

Measured on the reference page mid-build: nineteen shared helpers were in use, and the
same six viewport constants were still written out seven times, the same gridline loop
five times, and the same empty guard nine times.

The empty guard is the one that mattered. [ui-rules.md](../../kz-uiuxrule/rules/ui-rules.md) rule V2 says the
empty path is a path, and nine copies of an empty path is nine chances for one of them to
drift. Extracting `chartFrame(cid, rows, opts)` - which renders the empty message and
returns null, or returns the geometry - made it one path that every chart composes on:

```js
var fr = chartFrame('area', rows, { empty: 'No months match the current filters' });
if (!fr) { return; }
```

### What the difference becomes

| Copied | Composed |
|---|---|
| Two draw functions for a stacked area and a stream | One `drawAreaLike(cid, rows, off, centred)`; the stream is the area with the baseline moved |
| Three legend builders for three stacked charts | One `categoryLegend(host, cats, off, onToggle, tail)` |
| Four hand-written passive legends | One `subsetLegend(cid, host, defs, rows)` |
| Six margin blocks and nine empty guards | One `chartFrame`, composed by every chart |

The test is the one in rule 10a: when the second case appears, is the difference between
them an **argument**, or a second copy of the whole thing?

### What extraction drops

Rule 10a's danger, found by a reviewer one hour after the appendix above was written.

Three hand-written legends became one `categoryLegend`. Two more charts were then built
on it. It worked, and it quietly lost one guarantee that the other shared legend builder
had: pruning its entries to the rows actually drawn.

For the three original callers the categories are **columns**, always present, so the
omission was invisible. For the two new ones the categories are **rows**, so filtering the
table to one customer left five legend entries over one mark - and worse, the never-zero
guard counted those five, so the one visible series could be switched off and the chart
went blank with four entries still reading "on".

One missing line, invisible in the callers that motivated the extraction, live in the
callers that came after.

- **Enumerate the invariants before merging**, per caller, and carry every one.
- **The callers that motivated the extraction are the worst test of it.** They are the
  cases you had in mind. The next caller is the one that finds what you dropped.
- A sibling helper that already solves the same problem is the specification: this one had
  `live = defs.filter(d => rows.some(d.has))` seven hundred lines away, and copying the
  shape without copying the guarantee is how the two drifted.

### Refactor behind a check, not in front of one

Halfway through this extraction a line that declared `iw`, `ih` **and** `n` had its `n`
dropped, and the stacked bar threw. It was visible within seconds because the checks were
already there and already green: the signal was unambiguous because the baseline was.

So the order is: get the checks passing, then refactor, then run them again. Extracting a
shared function without that baseline means a later failure has two candidate causes, and
the usual response to two candidate causes is to put the copies back.
