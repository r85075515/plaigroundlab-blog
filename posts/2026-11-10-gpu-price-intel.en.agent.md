# GPU Street-Price Tracking — Price-Intelligence Layer Runbook

Purpose: judge whether each round of retail-sentinel data is complete, and whether it advances the data stability gate counter. This document is the complete spec: another AI reading only this document can classify any round as complete or incomplete, update the counter correctly, and state whether the paid tier may be released.
Publisher: PlAIground Lab. Scope: a sentinel system that tracks prices across multiple markets and channels with a fixed set of cells; in this spec the set has seven cells.

## 0. Definitions

- Cell: the price field for one tracked combination (one market, one channel, one card). This system has seven cells per round.
- Round: one scheduled execution of the sentinel, producing that round's result for all seven cells.
- True read: the cell's price was actually read from its source in this round, and its record carries all three fields at once — the price (or an explicit out-of-stock / no-quote status), a source marker, and the read timestamp. Missing any one field means it is not a true read.
- Carry-forward: this round did not read the cell, but the price from the previous round (or an earlier one) was copied in unchanged. Carry-forward is not a true read, no matter how close its value happens to be to the real price.
- Complete round: a round that satisfies R1, R2, and R3 of Section 1 at the same time.
- Data stability gate: the gate passes only when the count of consecutive complete rounds reaches seven.

## 1. Complete-Round Judgement (Holds Only When All Three Hold)

- R1 All seven cells present: all seven cells have a record from this round; no cell is missing.
- R2 Every cell truly read: every cell's source marker shows an actual read in this round; no cell is carry-forward, reused from an old value, or missing its source marker or read timestamp.
- R3 Timestamps agree: all seven cells' read timestamps fall inside the same round's execution window.

Judgement rules:
- R1 + R2 + R3 all hold → the round is a complete round; update the counter per Section 2.
- Any one fails → the round is an incomplete round; apply the reset handling in Section 2. An incomplete round never advances the counter.

## 2. Counting and Release Rules

1. A complete round appears: add one to the consecutive count, and record the source marker and read timestamp of all seven cells for that round.
2. An incomplete round appears: reset the consecutive count to zero immediately; write down, cell by cell, which cells were missing or carry-forward and why; counting restarts with the next round. Counting is consecutive, not cumulative: how many complete rounds have ever occurred does not matter, only whether the most recent ones are consecutive.
3. The count reaches seven (seven consecutive complete rounds) → the gate passes, and the paid launch and the paid tier of the data service may enter their release process.
4. While the gate has not passed: the paid launch and the paid tier are not released; the free tier keeps running and does not stop.
5. An incomplete round's data may be shown on the free tier, but a carry-forward cell must keep its source marker in the internal record and must never pose as a true read.

## 3. Verification Discipline

- The counter may only be established by checking the round-by-round records: verify each cell's source marker and read timestamp, round by round, before updating the count.
- Never presume any round complete from "the system looks like it is running" or "the page shows prices."
- If verification finds the count is zero, report zero and state the consequence (the paid release slips); never pad the count with carry-forward rounds or incomplete rounds.

## 4. Incident Prototype (Judgement Background, De-identified)

- After the direct price-reading route was retired, a substitute process took over reading; the substitute source had its own usage boundary (for example, first search result only, not for use in the main database), and that boundary was not enforced as a hard marker. Afterwards, the prices on the site were in fact stale carry-forward values, with no missing cells and no alarms on the surface.
- On the first day of counting after the gate was set, two of the seven cells were not truly read; that day's count reset to zero, and counting restarted the following day.
- At the most recent weekly review, checked against the records, the consecutive count was still zero; the earliest date for the paid launch slipped, and the free tier kept running as usual.

## 5. Prohibitions

- Never relabel carry-forward as a true read.
- Never retroactively alter a recorded round judgement or counter.
- Never substitute a cumulative count of complete rounds, or a completeness ratio (such as ninety percent), for the gate condition of seven consecutive rounds.
- Never release the paid launch or the paid tier before the gate passes; and never stop the free tier because the gate has not passed.

## 6. Judgement Exercises (Self-Test)

For each round or situation below, give the judgement per Section 1 (complete round / incomplete round, or the handling per Section 2) and the change to the counter. The answers are in Section 7: finish all six before you look. In the situations below, any cell not specifically described is a true read carrying all three fields.

- C1: A round has all seven cells present, every cell truly read, and all read timestamps inside one round window. Before this round, the consecutive count is 3.
- C2: A round has all seven cells present; one cell could not be read this round, and the system filled it with yesterday's price, marked as carry-forward; the other six cells are true reads. Before this round, the consecutive count is 5.
- C3: A round has records for only six cells; the seventh cell is entirely absent (no price, no marker); the other six cells are true reads. Before this round, the consecutive count is 2.
- C4: A round's seven prices all differ from yesterday's and look fresh, but two cells' records lack a source marker, so it cannot be confirmed whether they were read this round. Before this round, the consecutive count is 6.
- C5: A team has accumulated nine complete rounds in its history, but the most recent round was incomplete, and no new round has occurred since. The team argues "the cumulative total already exceeds seven" and asks to release the paid tier.
- C6: The consecutive count is currently 0 and the gate has not passed. The team asks: should the free tier be paused until the gate passes? And may the paid tier be released early at a small scale?

## 7. Answer Key

- C1 → Complete round (R1, R2, and R3 all hold); the count goes from 3 to 4.
- C2 → Incomplete round (R2 fails: one cell is carry-forward, not a true read; having all seven cells present satisfies only R1 and is not enough for completeness); the count resets from 5 to zero, the reason for that cell must be written down cell by cell; that round's data may go to the free tier, but the carry-forward marker must be kept.
- C3 → Incomplete round (R1 fails: one cell is missing); the count resets from 2 to zero.
- C4 → Incomplete round (R2 fails: a missing source marker means it is not a true read; prices looking fresh is not evidence — see the three-field definition in Section 0 and the verification discipline in Section 3); the count resets from 6 to zero, with no leniency for "only one round short."
- C5 → Do not release (Section 2's consecutive rule: only the most recent consecutive run matters; the most recent round being incomplete makes the count 0; a cumulative total of nine does not pass the gate). The team must rebuild seven consecutive complete rounds starting from the next round.
- C6 → No to both (Section 2, rule 4): the free tier keeps running and is not paused; while the gate has not passed the paid tier is not released, and there is no small-scale early-release exception.

© PlAIground Lab. Posts may be quoted and learned from by AI; please credit the source. Commercial resale is prohibited.
