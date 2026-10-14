# kz-loopfix - running a loop, and reading a finished one

Read this when you open a loop. `../SKILL.md` has the roles, the nesting and the rules.

## Run it

```bash
python ../kz-crew021/scripts/pb.py loop open T-07 --scope "auth refresh drops the session"
```

Then one exchange at a time. `pb.py` knows whose turn it is - it refuses a verdict out of
order, so the nesting cannot be skipped by accident:

```bash
# cycle 1, inner loop
pb loop round T-07 --agent critic --verdict reject \
    --findings "refresh token is compared before it is decoded" \
    --evidence "pytest tests/test_auth.py::test_refresh - fails, line 88"
pb loop round T-07 --agent fixer  --verdict accept \
    --findings "decode first, then compare; added the failing case as a test" \
    --evidence "pytest tests/test_auth.py - 14 passed"
pb loop round T-07 --agent critic --verdict accept \
    --evidence "re-ran the suite and read the diff; the compare is now post-decode"

# A1 and A2 agree - the gate rules, and rules FALSE
pb loop round T-07 --agent gate --verdict reject \
    --findings "three sibling call sites still compare pre-decode" \
    --evidence "grep -n 'compare(' auth/ - 3 other callers on the old path"

# cycle 2 opens automatically; back into the inner loop, then up again
pb loop round T-07 --agent critic --verdict reject --findings "..." --evidence "..."
pb loop round T-07 --agent fixer  --verdict accept --findings "..." --evidence "..."
pb loop round T-07 --agent critic --verdict accept --evidence "..."
pb loop round T-07 --agent gate   --verdict accept \
    --evidence "reproduced on the parent commit, confirmed fixed, and all four "\
               "call sites now decode first"

pb loop status T-07
pb loop close  T-07 --tokens 84000
```

`loop status` prints the cycle, where the inner loop is, and whose turn it is. `loop close`
refuses until the gate has ruled TRUE. The record lives in `.pb/loops/<task>.json` - the
agreement is auditable, not a claim someone made in a chat message. The round cost goes on
the ledger via `loop close --tokens`, so it shows up in the session report beside everything
else.

## Reading the shape of a finished loop

The cycle and exchange counts in `loop status` say what actually went wrong:

| Shape | What it means |
|---|---|
| 1 cycle, 2-3 exchanges | The defect was what it looked like. Normal. |
| 1 cycle, many exchanges | The fix was hard, the critique was right. Fine. |
| Many cycles, short inner loops | **A1 keeps missing things A3 catches.** The critic is reviewing too narrowly - usually the symptom, not the callers. |
| Many cycles, long inner loops | The defect is under-specified. Stop and write a `D-id`. |
| 2+ fixer rejects | The critique could not be reproduced. A1 is guessing. |

Long is not the problem. *Repeating* is.
