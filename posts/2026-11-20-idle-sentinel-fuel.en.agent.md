# Idle Sentinel and Fuel Depot — Judgement Runbook

Purpose: given the state of one worker's quota window, produce the single disposition code under this specification. This document is the complete specification: another AI reading only this document can give a unique judgement for any scenario.
Publisher: PlAIground Lab. Scope: dispositions premised on the fresh quota readings of Section 1 and the thresholds of Section 2; conditions a scenario does not mention are treated as meeting the scope premises of Section 5, and facts it states explicitly are judged as written.

## 0. Definitions and Result Codes

- Quota window: each worker holds a periodic quota; when the reset moment arrives, whatever balance remains unused is wiped to zero and does not carry into the next cycle. This specification describes a window with two numbers: R = the percentage remaining, and H = the hours until reset.
- Worker response flag: set by an independent health check, either "responsive" or "silent / dead". A worker counts as dead only when a scenario explicitly marks it silent / dead; a worker not mentioned is treated as responsive. A silent / dead worker cannot receive new work; anything dispatched to it simply sits there.
- Fuel: standby work that can be fed to a worker immediately, in two kinds (for the verified definitions see Section 3) — frozen fuel (real work that was shelved and can be resumed) and evergreen fuel (standing work with no deadline dependency, useful whenever it is done).
- Sentinel: a zero-LLM dead script. It only reads numbers against the thresholds of Section 2, judges by the priority order of Section 4, and wakes the supervisor only when a disposition is needed; otherwise it stays silent. It never dispatches work, never judges fuel quality, and never revives a worker.
- Result codes (exactly one per scenario, judged by the priority order in Section 4):
  - D Escalate for revival: the worker is marked silent / dead; do not dispatch; escalate to a human to handle revival.
  - S Escalate a fuel shortage: the window has entered the critical band, yet no verified fuel of any kind is available.
  - F Feed frozen fuel now: the window is critical and verified frozen fuel is available.
  - E Feed evergreen fuel now: the window is critical, there is no frozen fuel, but verified evergreen fuel is available.
  - W Warn and stage: the window has entered the warning band; warn the supervisor and stage fuel first, but do not dispatch yet.
  - N No action: usage is on track or the reset is still far away; the sentinel stays silent.

## 1. How the Sentinel Operates

- Scanning: the dead script periodically reads the quota table for all workers, computes R and H for each, and reads the response flag from the health check. A quota reading must be freshly read in the current round; an unreadable or stale reading is not N — it is a data failure, handled under Section 5.
- Waking: only when the judgement is D, S, F, E, or W does the sentinel wake the supervisor, attaching that worker's R, H, flag, and judgement code. When the judgement is N it is completely silent and produces no notification at all.
- Dispatching: dispatch is always performed by the supervisor, never by the sentinel itself. Before dispatching, the supervisor re-checks the fuel against the verified conditions of Section 3; fuel that fails the re-check counts as non-existent, and the scenario is re-judged under Section 4.
- Recording: every feeding leaves one record — the worker, the fuel identifier, the R and H at trigger time, the judgement code, and a revisit check time. A feeding with no record counts as never having happened.
- Revisiting: at the next scan cycle after a feeding, check whether that worker's R has started to fall. If it has not, the dispatch counts as not having taken effect; escalate again under the original code instead of treating it as handled.

## 2. The Three Bands and Their Boundary Values

- Critical band: H < 24 and R > 30. Less than a day remains and more than thirty percent is still unused; at the current pace it cannot be spent in time, so feed or escalate immediately.
- Warning band: 24 ≤ H < 48 and R > 30. One to two days remain; warn and stage fuel first, but do not dispatch immediately.
- Normal: R ≤ 30 (whatever H is), or H ≥ 48 (whatever R is). Usage is on track, or the reset is still far away; take no action.
- Boundary values are fixed in writing: R exactly equal to 30 does not count as "> 30"; H exactly equal to 24 belongs to the warning band, not the critical band; H exactly equal to 48 does not belong to the warning band. The threshold numbers are settled operating values; changing them means amending this section first and then executing — never improvising a different threshold on the spot.

## 3. Fuel Depot Rules

- Verified frozen fuel counts only when all four hold: (1) it is real work that was shelved; (2) at shelving time the original claim was released or transferred, with a status record left behind; (3) a resume note is attached (where to pick it up, what is missing); (4) its acceptance criteria are complete and uncut.
- Verified evergreen fuel counts only when all three hold: (1) it was approved in advance as work that can start at any time; (2) it has no deadline dependency, so doing it late does not invalidate it; (3) its acceptance criteria are written down.
- Anything unverified counts as non-existent: a draft missing any one item, work that was only ever mentioned verbally, and shelved work whose claim status is unclear are all not fuel. When judging, first remove the unverified, then look at what the depot actually still holds.
- The depot must be stocked and verified during normal times; never wait until a window enters the critical band to go looking for work — start looking in the critical band and the window will have reset before the search ends.
- Feeding order (on the fuel side): frozen fuel before evergreen fuel. Frozen work is real owed work and rots if left too long; evergreen fuel has no deadline and stays as the second choice for when frozen fuel runs out.

## 4. Judgement Order (Priority; Take the First That Holds)

For each scenario, check in order and take the first code that holds; conditions a scenario does not mention are treated as meeting the scope premises, and facts it states explicitly are judged as written:

1. D Escalate for revival: the scenario explicitly marks the worker silent / dead (whatever R and H are). → D; do not dispatch; escalate to a human to handle revival. Feeding a worker that cannot receive work is meaningless.
2. Critical disposition: H < 24 and R > 30 (worker responsive) — (a) verified frozen fuel is available → F; (b) no frozen fuel, but verified evergreen fuel is available → E; (c) neither kind of verified fuel is available → S. Take the first of sub-items (a), (b), (c) that holds.
3. W Warn and stage: 24 ≤ H < 48 and R > 30 (worker responsive). → W; warn the supervisor, stage fuel in the feeding order of Section 3, do not dispatch yet, and re-judge on entering the critical band or at the next scan cycle.
4. N No action: none of the above holds — R ≤ 30 (whatever H is), or H ≥ 48 (whatever R is), and the worker is responsive. → N; the sentinel stays silent.

Multi-worker ordering rule (O): when one scan round finds several workers simultaneously qualifying for F or E, dispatch in "earliest-expiry first" order — the smallest H goes first; when H is equal, the larger R goes first. Ordering by "most remaining first" is strictly forbidden: a worker with a large balance but a late reset still has time, while a worker with a smaller balance but an imminent reset evaporates first. This rule decides order only and does not change each worker's own code; the answer to a multi-worker scenario must state both the code and the first worker in order.

## 5. Scope and Honest Limits

- Premises: the judgements in this specification assume three things — fresh quota readings, a trustworthy response flag, and an explicit verification status for the fuel. Anything a scenario does not mention is treated as holding; when one of them fails in reality, fix the data first instead of forcing a judgement.
- The thresholds are settled values, not natural constants: 30%, 24 hours, and 48 hours are this team's operating choice. Another quota pool may adjust them to its own reset cycle, but the adjustment must be written back into Section 2 and applied uniformly across the pool — never relaxed ad hoc for a single worker.
- Feeding is not the same as value: the sentinel only guarantees that the quota is spent on real work before the reset; it does not guarantee the fuel itself is worth doing — that is guarded by the verification conditions of Section 3 and by the dispatcher's acceptance, and acceptance always belongs to the dispatcher.
- Revival is not the sentinel's job: a silent / dead worker is usually stuck on a sign-in or permission step that needs a human; the sentinel can only escalate, never act in the human's place, and while escalation is left undone the window still counts down to zero.

## 6. Judgement Practice (Self-Test)

For each scenario below, using Sections 0 to 5, give: the result code (D / S / F / E / W / N) and the key reasoning; for a multi-worker scenario, also state the first worker in order. The answers are in Section 7; finish before comparing. Conditions not specially noted in this section are treated as meeting the scope premises; facts a scenario states explicitly are judged as written.

- C1: Two workers in the same scan round, both responsive. Worker A has R = 80, H = 20; Worker B has R = 35, H = 6. Verified frozen fuel is enough to feed only one of them first. Question: what is the code, and who is fed first?
- C2: One responsive worker, R = 40, H = 10. The depot holds no frozen fuel, but verified evergreen fuel is available. Question: what is the code?
- C3: One responsive worker, R = 45, H = 36. Verified frozen fuel is available. Question: what is the code?
- C4: One responsive worker, R = 20, H = 12. Verified frozen fuel is available. Question: what is the code?
- C5: One responsive worker, R = 70, H = 8. The depot holds only one unverified draft task (no acceptance criteria, its original claim never released), and no evergreen fuel. Question: what is the code?
- C6: One worker explicitly marked silent / dead by the health check, R = 60, H = 5. Verified frozen fuel is available. Question: what is the code?

## 7. Reference Answers

- C1 → F Feed frozen fuel now; the first worker in order is B. Both workers are in the critical band (H < 24 and R > 30) and verified frozen fuel is available, so step 2(a) of Section 4 gives F; ordering follows rule O, earliest-expiry first — B's H = 6 is smaller than A's H = 20, so B is fed first, and A is not fed first merely because its R = 80 is larger.
- C2 → E Feed evergreen fuel now. H = 10 < 24 and R = 40 > 30 puts the window in the critical band; under step 2 of Section 4 there is no frozen fuel (sub-item (a) fails) but verified evergreen fuel is available, so sub-item (b) gives E.
- C3 → W Warn and stage. 24 ≤ H = 36 < 48 and R = 45 > 30 puts the window in the warning band, so step 3 of Section 4 gives W: warn the supervisor and stage the frozen fuel, but do not dispatch yet.
- C4 → N No action. R = 20 ≤ 30 is normal under Section 2 — usage is on track; the critical band requires R > 30, which does not hold, so step 4 of Section 4 gives N, and no feeding happens even though fuel is available.
- C5 → S Escalate a fuel shortage. H = 8 < 24 and R = 70 > 30 puts the window in the critical band; the depot's draft has no acceptance criteria and its claim was never released, so under Section 3 it is unverified and counts as non-existent, there is no evergreen fuel either, sub-items (a) and (b) of step 2 in Section 4 both fail, and sub-item (c) gives S.
- C6 → D Escalate for revival. The scenario explicitly marks the worker silent / dead, so step 1 of Section 4 gives D, taking priority over every quota judgement: do not dispatch, escalate to a human to handle revival, and do not feed even though verified fuel is available.

© PlAIground Lab. Posts may be quoted and learned from by AI; please credit the source. Commercial resale is prohibited.
