#!/usr/bin/env python3
"""Reference implementation of the Tamil Train word-knowledge model.

This file is the executable spec. The Swift and TypeScript ports must match it
exactly; they prove it by running shared/test-vectors/scoring.json.

    python3 tools/scoring_reference.py            # regenerate the vectors
    python3 tools/scoring_reference.py --check    # fail if the vectors are stale

Model (per word):
  p      probability he knows the word (starts at a prior set by how often
         the word is heard at home)
  n, c   attempts, correct first attempts
  days   distinct calendar days (YYYY-MM-DD) with a correct first attempt,
         oldest dropped after maxTrackedDays
  lastDay  calendar day of the most recent attempt

Update on a first attempt with guess rate g (1/choices for pictures,
actionGuess for action stops):
  correct:  post = p(1-s) / (p(1-s) + (1-p)g)
  wrong:    post = p s / (p s + (1-p)(1-g))
  p' = post + (1-post) * learnRate
Retries after a miss are never recorded.

Status: new (n == 0) | known (p >= knownThreshold and >= knownMinDistinctDays
days) | emerging (p >= emergingThreshold) | notyet.
"""
from __future__ import annotations

import json
import sys
from dataclasses import dataclass, field, asdict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RULES = json.loads((ROOT / "shared/content/rules.json").read_text())["scoring"]
PICKER = json.loads((ROOT / "shared/content/rules.json").read_text())["picker"]
VECTORS = ROOT / "shared/test-vectors/scoring.json"


@dataclass
class WordProgress:
    p: float
    n: int = 0
    c: int = 0
    days: list[str] = field(default_factory=list)
    lastDay: str | None = None


def prior(home_frequency: int) -> float:
    return RULES["priorByHomeFrequency"][str(home_frequency)]


def record(s: WordProgress, correct: bool, guess: float, day: str) -> WordProgress:
    slip, p = RULES["slip"], s.p
    if correct:
        post = p * (1 - slip) / (p * (1 - slip) + (1 - p) * guess)
    else:
        post = p * slip / (p * slip + (1 - p) * (1 - guess))
    days = list(s.days)
    c = s.c
    if correct:
        c += 1
        if day not in days:
            days.append(day)
            if len(days) > RULES["maxTrackedDays"]:
                days.pop(0)
    return WordProgress(p=post + (1 - post) * RULES["learnRate"], n=s.n + 1, c=c, days=days, lastDay=day)


def status(s: WordProgress | None) -> str:
    if s is None or s.n == 0:
        return "new"
    if s.p >= RULES["knownThreshold"] and len(s.days) >= RULES["knownMinDistinctDays"]:
        return "known"
    if s.p >= RULES["emergingThreshold"]:
        return "emerging"
    return "notyet"


def day_gap(last_day: str | None, today: str) -> int:
    if last_day is None:
        return PICKER["maxGapDays"]
    d = (date.fromisoformat(today) - date.fromisoformat(last_day)).days
    return max(0, min(PICKER["maxGapDays"], d))


def pick_score(s: WordProgress, today: str, jitter: float = 0.0) -> float:
    """Higher = more useful to ask now. Uncertain words (p near .5) and words
    not seen for a while float up. jitter is rand()*picker.jitter in the apps;
    vectors use 0 so they are deterministic."""
    return s.p * (1 - s.p) + PICKER["gapWeight"] * day_gap(s.lastDay, today) + jitter


# ---------------------------------------------------------------- vectors
def _r(x: float) -> float:
    return round(x, 10)


def build_vectors() -> dict:
    scenarios = [
        ("common word, right three times over two days", 3,
         [(True, 1 / 3, "2026-09-20"), (True, 1 / 3, "2026-09-20"), (True, 1 / 3, "2026-09-21")]),
        ("rare word, lucky guess with 2 choices then a miss", 1,
         [(True, 0.5, "2026-09-20"), (False, 0.5, "2026-09-20")]),
        ("mid word, four choices, right on 3 separate days", 2,
         [(True, 0.25, "2026-09-18"), (True, 0.25, "2026-09-19"), (True, 0.25, "2026-09-21")]),
        ("action stop, done then not done", 2,
         [(True, 0.25, "2026-09-20"), (False, 0.25, "2026-09-22")]),
        ("high p but only one day stays emerging", 3,
         [(True, 1 / 3, "2026-09-20")] * 5),
        ("day list capped at maxTrackedDays", 3,
         [(True, 1 / 3, f"2026-09-{d:02d}") for d in range(1, 16)]),
    ]
    out = []
    for name, freq, events in scenarios:
        s = WordProgress(p=prior(freq))
        steps = []
        for correct, g, day in events:
            s = record(s, correct, g, day)
            steps.append({"input": {"correct": correct, "guess": _r(g), "day": day},
                          "expect": {"p": _r(s.p), "n": s.n, "c": s.c, "days": s.days,
                                     "lastDay": s.lastDay, "status": status(s)}})
        out.append({"name": name, "homeFrequency": freq, "prior": prior(freq), "steps": steps})

    picks = []
    for p, last, today in [(0.5, "2026-09-24", "2026-09-25"), (0.9, None, "2026-09-25"),
                           (0.15, "2026-09-10", "2026-09-25"), (0.6, "2026-09-25", "2026-09-25")]:
        s = WordProgress(p=p, n=1, lastDay=last)
        picks.append({"p": p, "lastDay": last, "today": today, "expectScore": _r(pick_score(s, today))})

    return {"_doc": "Generated by tools/scoring_reference.py. Do not edit by hand. Compare floats with tolerance 1e-9.",
            "rules": RULES, "picker": PICKER, "scenarios": out, "pickScores": picks}


def main() -> None:
    v = json.dumps(build_vectors(), ensure_ascii=False, indent=2) + "\n"
    if "--check" in sys.argv:
        if not VECTORS.exists() or VECTORS.read_text() != v:
            sys.exit("scoring vectors are stale: run python3 tools/scoring_reference.py")
        print("scoring vectors up to date")
        return
    VECTORS.write_text(v)
    print(f"wrote {VECTORS.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
