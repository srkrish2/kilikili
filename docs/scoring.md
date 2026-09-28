# Word-knowledge model

Goal: tell a parent which Tamil words their child understands, from a game where a lucky
tap is common. The spec is `tools/scoring_reference.py`. The golden cases are in
`shared/test-vectors/scoring.json`, and both apps test against them.

## State per word

| field | meaning |
|---|---|
| `p` | P(he knows the word). Starts at a prior set by `homeFrequency` (3 -> .60, 2 -> .35, 1 -> .15) |
| `n`, `c` | first attempts / correct first attempts |
| `days` | distinct local days with a correct first attempt (last 12 kept) |
| `lastDay` | day of the most recent attempt |

## Update (first attempt only)

With slip `s = 0.1` and guess rate `g` (1/number of pictures; 0.25 for action stops):

```
correct: post = p(1-s) / (p(1-s) + (1-p)g)
wrong:   post = p s    / (p s    + (1-p)(1-g))
p'      = post + (1 - post) * learnRate      # learnRate = 0.03
```

A retry after a miss is never scored: the hint makes it a different, easier question.

## Status

- **known**: p >= 0.9 **and** at least 2 distinct days correct
- **emerging**: p >= 0.5
- **notyet**: otherwise
- **new**: never tried

The two-day rule keeps one lucky session from marking a word known. In the vectors, five
correct in one day reaches p = .996 and still stays *emerging*.

## Picking the next word

- The first 2 stops, and 20% of later ones, are **warm-ups**: a random pick from the 4 most
  likely known words, so the trip opens with a win.
- Otherwise it picks the word with the highest `p(1-p) + 0.04 * min(3, days since last seen) + jitter`.
  That favours words whose status is most uncertain, plus words not seen recently.
- Pictures shown: the target, one distractor from the same category (harder) and the rest
  from other categories. It never shows two words that share a picture.

## Known limitations (worth revisiting after more dogfooding)

- A single miss from p = .67 drops to .24. With slip .1 the model assumes a knowing child
  rarely misses; distracted 4-year-olds miss more than that. Consider slip .15-.2 if words
  bounce between emerging and not-yet.
- It has no forgetting over time, only the recency boost in picking. A slow decay of `p` for
  words unseen for more than 2 weeks would keep "known" honest.
- The priors are guesses. After a few weeks, fitting them to his real first-attempt data is
  a small logistic-regression job.
