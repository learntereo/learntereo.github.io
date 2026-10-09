---
title: Ako v2.1: Word-by-word breakdowns and layout polish
type: feature
change_id: ako-poc-3
workflow: k7m2qa-ako-poc
status: approved
created: 2026-10-09
depends_on: ako-poc-2 (merged, live)
---

# Ako v2.1: Word-by-word breakdowns and layout polish

## 1. Problem
Learners are told what a phrase means as a whole ("Ngā Mihi: Greetings") but never what each word does. They can't learn how Māori is built: "ngā" is the plural "the", "mihi" means greeting(s), so "Ngā Mihi" is literally "the greetings". The Account screen layout is also broken on desktop (no container, unstyled Sign out, full-width delete button, Review badge misaligned in the nav).

## 2. Requirements

### FR1: Breakdown data
- FR1.1 Every Māori text with **more than one word** gets a breakdown. That covers all sentences, multi-word "words" (e.g. *kia ora*, *tekau mā tahi*, *ata mārie*) and every unit `titleMi` (e.g. *Ngā Mihi*, *Ngā Nama Nui*).
- FR1.2 Shape:
  ```ts
  interface GlossToken { mi: string; en: string; ref?: string } // ref = particle id
  interface Breakdown { tokens: GlossToken[]; literal?: string; note?: string }
  ```
  `tokens` cover the Māori text in order. Multi-word units that only make sense together may be one token (e.g. `kei te` = "is ...ing (present tense)"). `literal` is the word-for-word English ("the greetings"). `note` (optional, one sentence) explains how the parts combine ("Ngā makes mihi plural, so Ngā Mihi is a heading meaning Greetings.").
- FR1.3 Items get an optional `breakdown`. Units get `titleBreakdown`. Single-word items don't need one.
- FR1.4 **Particles dictionary** `src/content/particles.json`: id, form(s), short gloss, 2–4 sentence plain-English explanation and an example. It must cover at least: te, ngā, he, ko, kei, kei te, i (past / object / at), ka, e … ana, ki, ki te, mā, tēnei/tēnā/tērā, a/o possessives (taku, tōku, tāku, tō, tāu, tōna, tāna and plurals), ahau/au, koe, ia, mātou/tātou/rātou, kua, kia, me, kaua, nō, nā, hoki, engari, nō reira, ahakoa, rā (in greetings), mai/atu, ai. Glosses use `ref` to link to these.
- FR1.5 Accuracy over coverage: glosses use standard modern te reo (Te Aka conventions). Where a word is idiomatic (e.g. *kia ora*: "be well/healthy", used as hello), say so in `note`.

### FR2: Where breakdowns appear
- FR2.1 **Learn deck**: multi-word word cards and every example sentence show the breakdown. Show a row of Māori words, each with its English gloss underneath in smaller text (interlinear style, wraps on mobile), then `literal` and `note`.
- FR2.2 **Unit screen and Path**: the Māori unit title has a "What does this mean?" toggle that shows its breakdown.
- FR2.3 **After answering** any question involving a sentence or multi-word item (correct, or after the answer is revealed): the feedback panel shows the breakdown, collapsed behind "Word by word" on mobile and open on wide screens.
- FR2.4 **Tap any Māori word** in a shown sentence (Learn, feedback, Glossary, Grammar examples where data exists) to open a small popover with its gloss and, if it has a `ref`, the particle explanation and a link to the particle in Reference.
- FR2.5 **Reference** gets a **Little words** (particles) screen listing the dictionary, searchable with the Glossary's accent-insensitive search.
- FR2.6 **Glossary** entries for multi-word items show their breakdown.

### FR3: Layout polish (bug)
- FR3.1 Account page uses the shared page container (centred max-width, side padding) like other screens.
- FR3.2 Sign out uses the app's secondary button style. The delete button uses danger style at auto width (not full-bleed). The delete card sits inside the container.
- FR3.3 Nav: the Review badge sits inline (on the icon or after the label) so every tab shares one height and baseline, on the desktop row and the mobile bottom bar. The header row (logo, XP/streak) aligns to the same container width as the nav and content.
- FR3.4 Audit every screen at 360, 768 and 1280px for the same class of issue (missing container or padding, unstyled default controls, misalignment) and fix what you find.

### FR4: Unlock window
- FR4.1 Units are taken in course order (b01 to b08, then i01 to i08, then a01 to a06). The first 3 units that are not complete are always available. Completed units stay open.
- FR4.2 Completing a unit (passing its check) opens the next one, so 3 are open at a time until the course runs out. The window crosses level boundaries: the old rule that every unit of the previous level must be complete is replaced by this.
- FR4.3 Free Practice for a level is open when any unit in that level is available or complete.
- FR4.4 The PoC migration rule is kept: a learner who finished Beginner in the PoC has every Beginner unit complete, and a unit whose items were all learned already counts as complete.
- FR4.5 The Path lists the open units under "Next up", and copy no longer says units open one at a time.

### FR5: Write mode keyboard
- FR5.1 Write mode has an on-screen keyboard in Māori alphabet order: a e h i k m n o p r t u w, ng and wh (each one key that inserts two letters), then the macron vowels ā ē ī ō ū, plus Space and Backspace.
- FR5.2 Keys insert at (and Backspace deletes before) the cursor in the answer box, and keep focus and the caret position. A real keyboard still works.
- FR5.3 On touch devices a "Use phone keyboard" switch is shown. It is off by default, so tapping the answer box does not open the phone's keyboard (inputMode none). The choice is remembered in local storage, which may be unavailable.
- FR5.4 Keys are buttons at least 44px square with labels such as "letter ng" and "backspace", and they wrap at 360px.

## 3. Acceptance Criteria
| # | Given | When | Then |
|---|---|---|---|
| AC1 | Unit b01 | the learner opens "What does this mean?" on its Māori title | they see Ngā = "the (plural)", Mihi = "greeting(s)", literal "the greetings" |
| AC2 | a Learn card for *kia ora* | it is shown | kia = "be / may it be", ora = "well, healthy, alive", with a note that it is used as hello and thanks |
| AC3 | the sentence *Kei te pai ahau* after an Order question | the answer is revealed or correct | the breakdown shows kei te = "is ...ing / am (present)", pai = "good", ahau = "I / me" |
| AC4 | any shown sentence | the learner taps *ngā* | a popover shows "the (plural)" and the particle explanation |
| AC5 | Reference | the learner opens Little words and searches "nga" | the ngā entry is found |
| AC6 | the content tests | they run | every sentence, multi-word item and unit title has a breakdown whose tokens join to the Māori text (case and punctuation insensitive), and every `ref` exists in particles.json |
| AC7 | Account on desktop | it renders | content is in the centred container, Sign out is styled and the delete button is not full width |
| AC8 | the nav with Review due | it renders | the badge doesn't change the tab's height; all tabs align |
| AC9 | a new learner | they open the Path | b01, b02 and b03 are available and everything else is locked |
| AC10 | b01 passed | the Path renders | b01 is complete and b02, b03 and b04 are available |
| AC11 | b01 to b03 complete | the Path renders | b04, i01 and i02 are available (the window crosses into Intermediate) |
| AC12 | a unit later in the window is completed first | the Path renders | it stays complete, the earlier units stay open, and the window still holds 3 not-yet-complete units |
| AC13 | a learner whose first unit in Intermediate is open | they open Free Practice | Intermediate is open even though Beginner is not finished |
| AC14 | Write mode | the learner taps ng then e r u | the answer box shows "ngeru" with the caret at the end |
| AC15 | the caret in the middle of a word | they tap Backspace | the letter before the caret is removed and the caret stays put |
| AC16 | a touch device | Write mode opens | the phone keyboard stays closed until "Use phone keyboard" is switched on, and the switch is remembered |

## 4. Testing
Unit tests: content breakdown coverage and token-join (AC6), particle refs, breakdown component rendering (interlinear, popover), layout snapshot-free checks where practical. No em dashes. No references to the tools that built the app.

## 5. Out of Scope
Audio, morphology beyond word level (e.g. splitting *whakarongo* into *whaka* + *rongo* is allowed only inside `note`, not as separate tokens).

## 6. Requirements Discovery
| # | Question | Answer | Source |
|---|---|---|---|
| W1 | What's missing? | "You need to explain individual words as well. You can't just say NGĀ MIHI is a greeting; explain what NGĀ is and what MIHI means, and combined it means a greeting." | User |
| W2 | Layout | "The sign out screen is fucked looking" (screenshot: Account page flush left, default buttons, misaligned Review badge) | User |
| W3 | Where breakdowns show, data shape, particles dictionary | Learn, unit title, after-answer feedback, tap-a-word popover, Little words reference | Dev team (delegated) |
| W4 | Unlocking | "Have 3 courses available at a time, rather than one by one; each completion opens a new one" | User |
| W5 | Spelling | "To spell the words I'm only given vowels, there are no letters. I should be able to select from a list of letters" | User |
