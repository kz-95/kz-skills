"""Every judgement kz-judge asks, in one reviewed place: the question, the rule it serves, the threshold,
and the labelled examples that decide whether an engine is trusted with it.

A question is asked of an engine only after that engine has sorted every labelled example to the right side
of the threshold (`judge.py calibrate`). An engine that cannot tell the examples apart is not asked; its
answer would be noise dressed as a finding.

Each question is a yes/no (noul) phrased so that YES means the text is GOOD. Optional "criteria" spell out
what true and false look like; on a short text they decide whether the engine can tell the cases apart. A finding is raised when the
probability is under the threshold.
"""

QUESTIONS = {
    "error-says-fix": {
        "rule": "K1",
        "kind": "error",
        "ask": "Does `text` say both what went wrong and what the person should do to fix it?",
        "finding": "error message does not say what went wrong and what to do next",
        "threshold": 0.5,
        "good": [
            "Phone number is missing a digit: enter 10 or 11 digits, for example 012-345 6789.",
            "The file is over 5 MB. Choose a smaller file or compress it, then upload again.",
            "Site is needed before this can be saved. Type the site name in the Site field.",
            "Your session expired after 30 minutes idle. Sign in again to continue.",
        ],
        "bad": [
            "Something went wrong.",
            "Error 500.",
            "Invalid input.",
            "Oops! Please try again later.",
        ],
    },
    "button-names-action": {
        "rule": "K1",
        "kind": "button",
        "ask": "Does the button label `text` name a specific action?",
        "criteria": {"true": "a verb with its object, like Save quotation or Export to CSV",
                     "false": "a generic reply or prompt, like OK, Yes, Go or Click here"},
        "finding": "button label does not name its action",
        "threshold": 0.5,
        "good": ["Save quotation", "Delete 3 jobs", "Send invoice", "Export to CSV", "Create job"],
        "bad": ["OK", "Click here", "Yes", "Go"],
    },
    "empty-says-how-to-start": {
        "rule": "K1",
        "kind": "empty",
        "ask": "Does the empty-state text `text` tell the person what to do next to get content here?",
        "finding": "empty state does not say how to start",
        "threshold": 0.5,
        "good": [
            "No jobs match. Clear a filter or the search.",
            "No quotations yet. Create one with New quotation.",
            "Nothing scheduled this week. Drag a job onto a day to schedule it.",
            "No customers found. Check the spelling or add a new customer.",
        ],
        "bad": ["No data.", "Empty.", "Nothing here.", "No results."],
    },
    "confirm-names-target": {
        "rule": "S2",
        "kind": "confirm",
        "ask": "Does `text` name the specific thing that will be deleted, removed or cleared - by its name, its ID or how many there are?",
        "finding": "delete confirmation does not name what will be deleted",
        "threshold": 0.5,
        "good": [
            "Delete job Taman Sri Indah P2 reroof? This cannot be undone.",
            "Remove 3 selected quotations (Q-104, Q-107, Q-112)?",
            "Delete customer Lim Ah Kow and their 2 open jobs?",
            "Clear all 14 items from the Bandar Baru Lot 14 order?",
        ],
        "bad": [
            "Are you sure?",
            "Delete this item?",
            "Do you want to continue?",
            "This action cannot be undone. Proceed?",
        ],
    },
}


# every question must point at the text it judges
assert all("`text`" in q["ask"] for q in QUESTIONS.values()), "each ask must reference `text`"
