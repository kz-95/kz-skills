"""Runs inside Laya's own Python. Reads {"items": [{"id", "text", "q"}]} on stdin and prints
{"model": ..., "answers": {id: p_yes}} on stdout. One process for the whole batch, because loading the
model is the slow part (minutes cold, seconds warm)."""
import json
import sys
import warnings

warnings.filterwarnings("ignore")
from laya import Router  # noqa: E402  (imported after the warning filter)

job = json.load(sys.stdin)
router, answers, model = Router(), {}, None
for it in job["items"]:
    out = router.predict({"text": it["text"]}, {"q": it["q"]})
    answers[it["id"]] = out["answers"]["q"]["noul"]
    model = out.get("routing", {}).get("model", model)
print(json.dumps({"model": "laya-" + str(model), "answers": answers}))
