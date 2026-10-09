# Glossary

Domain: Language Learning (Ako)

Source: [Ako PoC spec, section 11](../../changes/2026/10/09/k7m2qa-ako-poc/01-ako-poc/SPEC.md)

| Term | Definition | First Defined In |
|------|------------|------------------|
| Ako | To learn / to teach (reciprocal learning); the app name | [Ako PoC](../../changes/2026/10/09/k7m2qa-ako-poc/01-ako-poc/SPEC.md) |
| Te reo Māori | The Māori language | [Ako PoC](../../changes/2026/10/09/k7m2qa-ako-poc/01-ako-poc/SPEC.md) |
| Kupu | Word | [Ako PoC](../../changes/2026/10/09/k7m2qa-ako-poc/01-ako-poc/SPEC.md) |
| Macron (tohutō) | Long-vowel mark: ā ē ī ō ū | [Ako PoC](../../changes/2026/10/09/k7m2qa-ako-poc/01-ako-poc/SPEC.md) |
| Learned item | An item answered correctly at least once (`first_correct_at` set) | [Ako PoC](../../changes/2026/10/09/k7m2qa-ako-poc/01-ako-poc/SPEC.md) |
| First try / Retry / Missed | Question result categories driving XP (10 / 5 / 0) | [Ako PoC](../../changes/2026/10/09/k7m2qa-ako-poc/01-ako-poc/SPEC.md) |
| Re-queue | Replaying a missed question once at the end of a round | [Ako PoC](../../changes/2026/10/09/k7m2qa-ako-poc/01-ako-poc/SPEC.md) |
| Decoy | A plausible wrong tile in Order mode | [Ako PoC](../../changes/2026/10/09/k7m2qa-ako-poc/01-ako-poc/SPEC.md) |
| Board | A multi-pair question (Match: 5 pairs, Picture: 4 pairs) | [Ako PoC](../../changes/2026/10/09/k7m2qa-ako-poc/01-ako-poc/SPEC.md) |
| Streak | Consecutive local days with at least one completed round | [Ako PoC](../../changes/2026/10/09/k7m2qa-ako-poc/01-ako-poc/SPEC.md) |
| Unit | One step of the learning path with 10-14 words, 5-7 sentences and a grammar note | [Ako v2](../../changes/2026/10/09/k7m2qa-ako-poc/02-ako-curriculum/SPEC.md) |
| Learn / Practice / Unit check | The three steps of a unit; the check needs 10 of 12 to pass | [Ako v2](../../changes/2026/10/09/k7m2qa-ako-poc/02-ako-curriculum/SPEC.md) |
| Review | A round of up to 15 learned items that are due, scheduled by spaced repetition | [Ako v2](../../changes/2026/10/09/k7m2qa-ako-poc/02-ako-curriculum/SPEC.md) |
| Grammar note | A short Markdown note of at most 200 words for each unit | [Ako v2](../../changes/2026/10/09/k7m2qa-ako-poc/02-ako-curriculum/SPEC.md) |
| Tohutō | The Māori word for macron | [Ako v2](../../changes/2026/10/09/k7m2qa-ako-poc/02-ako-curriculum/SPEC.md) |

## Entities

| Entity | Definition |
|--------|------------|
| [Learner](definitions/learner.md) | A signed-in user (auth user plus profile) |
| [Item](definitions/item.md) | A unit of content: Word or Sentence |
| [Level](definitions/level.md) | Beginner, Intermediate or Advanced tier |
| [Unit](definitions/unit.md) | One step on the learning path |
| [Mode](definitions/mode.md) | Exercise style: Match, Picture, Translate, Write, Fill the gap, Order, Mixed |
| [Round](definitions/round.md) | A 10-question session in one level and mode |
| [Question](definitions/question.md) | One exercise within a round |
| [ItemProgress](definitions/item-progress.md) | A learner's attempt and mastery record for an item |
| [UnitProgress](definitions/unit-progress.md) | A learner's Learn, check and completion record for a unit |
| [ReviewSchedule](definitions/review-schedule.md) | Spaced-repetition columns on ItemProgress |

## Bounded contexts

- **Learning**: content, units, rounds, marking, modes, grammar and reference screens
- **Progress**: item and unit progress, review schedule, XP, streak, history, unlock
- **Identity**: auth, profile, privacy, account deletion
