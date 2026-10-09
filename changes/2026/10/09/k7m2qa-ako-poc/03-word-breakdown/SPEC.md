| W8 | Rewards | "Just show a greyed-out hidden icon every so often that you reach to unlock: an icon, gem or kiwiana" (10 kiwiana treasures on the Path) | User |
| W9 | Rewards | "There should be a page called Kiwiana showing 0/10 etc. You should get the first one from doing the first course, to sell people into it. Make 20 kiwiana" | User |
| W10 | Rewards | "Each unlock should have a history or meaning behind it. When you unlock one you should get an animation saying you've unlocked it, with the history/meaning" | User |
| W11 | Naming | "Only call it New Zealand" | User |
| W12 | Rewards | "On Progress make kiwiana the big thing to collect, it's too hidden away, needs gamification" | User |
| W13 | Practice | "Why is ata mārie part of numbers? It shouldn't be" (unit practice now uses only the unit's own items) | User |
| W14 | Marking | "I put 'e hia' for how many but it only accepts 'hia'; this should be close enough" | User |
| W15 | Rewards | "Clicking on the kiwiana box should also open the history box" | User |
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

- FR2.7 Wherever the meaning of a multi-word word item is shown (Learn card, Glossary, Write prompt, Translate and Write after answering), a muted line "Literally: "{literal}"" sits directly under it when the literal differs from the meaning (ignoring case and punctuation). It is not hidden behind the Word by word toggle. For example kia ora is shown as "hello" with Literally: "be healthy, be well".

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

### FR6: Kiwiana
- FR6.1 Twenty collectible kiwiana treasures, one per unit. Treasure N unlocks when unit N is complete (its Kiwiz passed), for units 1 to 19, so a new learner gets the first one after Unit 1. The 20th, the Golden kiwi, unlocks when the final unit (22) is complete. In order: Pāua, Jandals, Silver fern, Pōhutukawa, Gumboot, Pavlova, Fish and chips, Hokey pokey ice cream, Tūī, Pūkeko, Kūmara, Kōwhai, Wētā, Tuatara, Kererū, Pīwakawaka, Feijoa, Chilly bin, Number 8 wire, Golden kiwi. Each is an original illustration in one style with an accurate one-line caption. There are no brand items and no sacred taonga.
- FR6.2 Unlocking is derived from unit completion, so units already complete (including through the PoC migration rule) unlock their treasures at once. There is no new stored data.
- FR6.3 A Kiwiana page at /kiwiana has its own tab in the main navigation (the Account link moves to an icon in the header so the tabs fit at 360px). It shows "N / 20 collected" with a progress bar and a grid of all twenty: unlocked ones in colour with name and caption, locked ones as a silhouette with "?" and "Finish {unit title} to unlock". The next one to unlock is highlighted.
- FR6.4 The collection is sold, confidently: a Home card "Collect all 20 kiwiana" with the count, the next silhouette, "Finish {unit} to unlock it" and a "See your Kiwiana" link; a line on each Unit screen with the silhouette (or the icon once earned); a clear unlock card on Results, "New kiwiana: {name}!", with the icon, caption and a "See your Kiwiana" button, and a bigger celebration for the Golden kiwi; and a small "N/20" count in the header that links to the page.
- FR6.5 Path nodes stay small and quiet (a small silhouette or icon between unit rows, "Keep going to unlock"). Progress shows one "Kiwiana N / 20" tile that links to the page, not a second grid.

- FR6.6 A locked treasure reveals nothing: every locked tile (Kiwiana page, Home card, Unit screen, Path, Progress shelf) is the same neutral padlock tile, with no shape, name or caption. The hint "Finish {unit} to unlock" stays, the next one is marked "Next", and the screen reader hears "Locked treasure. Finish {unit} to unlock."
- FR6.7 Each treasure has a short story (two to four sentences) on its history or meaning, using well-attested facts, with disputed origins phrased as "often said" or as a claim by both sides. English text says "New Zealand", not "Aotearoa".
- FR6.8 When a Kiwiz pass unlocks a treasure, an accessible modal dialog (focus kept inside, Escape or "Ka pai!" closes it, labelled by its heading) plays the reveal: the padlock tile shakes, fades away and the treasure appears with a soft glow, then "You unlocked: {name}!" and the story. With reduced motion it shows the revealed state with a simple fade. The Golden kiwi version is bigger, with sparkles. Tapping an unlocked treasure on the Kiwiana page or the Progress shelf opens the same dialog without the animation.
- FR6.9 Collector ranks: 0 Ready to start, 1 to 4 Kiwiana rookie, 5 to 9 Explorer, 10 to 14 Collector, 15 to 19 Treasure hunter, 20 Kiwiana legend. An unlock that crosses a threshold also shows "New rank: {rank}!" in the dialog. The rank shows on the Kiwiana page and as a chip on Home's Kiwiana card.
- FR6.10 The top of Progress is the "Your Kiwiana" hero: a ring with N / 20, the rank and what the next rank needs, a progress bar for the next treasure's unit ("{unit}: X of Y items learned, pass the Kiwiz to unlock"), a scrollable shelf of all 20, the last three unlocked with dates, and a "See all Kiwiana" button. The other stats and the history come below it.

- FR6.11 Every unlocked treasure, wherever it is drawn (Home card, Path nodes, Unit screen, Results card, Kiwiana page, Progress shelf and recent list), is a button "Read about {name}" that opens the story dialog (finished state, no replay). The header N/20 links to the Kiwiana page. A locked tile opens nothing; tapping it shows "Finish {unit} to unlock".

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
| AC17 | b01 complete | the Path and Kiwiana page render | the Pāua is in colour with its caption, 1 / 20 is shown, and the next locked treasure says "Finish Family to unlock" and is highlighted |
| AC18 | a new learner | Home renders | a "Collect all 20 kiwiana" card shows 0 / 20, the next silhouette and a link to Kiwiana |
| AC19 | a Kiwiz pass that completes unit 1 | Results opens | a card says "New kiwiana: Pāua!" with a "See your Kiwiana" button |
| AC20 | the last unit is completed | Results opens | the Golden kiwi card is larger and says all 20 are collected |
| AC21 | Beginner finished in the PoC | the Path renders | the first eight treasures are already unlocked |
| AC22 | Progress | it renders | a single Kiwiana N / 20 tile links to /kiwiana and there is no second grid |

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
| W6 | Naming | "Don't call it unit check, it sounds like code. Call it something friendly, a play on the word kiwi" (named Kiwiz) | User |
| W7 | Naming | "We don't have XP, we have Kiwi XP" | User |