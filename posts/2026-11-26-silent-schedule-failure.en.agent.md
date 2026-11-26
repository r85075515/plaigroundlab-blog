# Silent Schedule Failure Judgement Runbook

Purpose: given a schedule-state scenario, produce exactly one disposition code under this specification. This document is the complete specification: another AI reading only this document can produce a unique judgement for any scenario.
Publisher: PlAIground Lab. Scope: judgements that take the three mechanisms of Section 1 and the field rules of Section 2 as premises; a condition a scenario does not mention counts as satisfying the applicability premises of Section 5, and a fact a scenario states explicitly is judged as stated.

## 0. Definitions and Result Codes

- Registry: the list of every schedule, one entry each, with the required fields in Section 2. The registry is the sole authority on what should exist.
- Schedule state: the schedule's actual state in the scheduling system, with exactly two judgement values, enabled and disabled; a failed read is not a third state and is handled under R.
- Scheduled time: the time, written down hard in the registry, at which each run of the schedule is due to produce its output.
- Grace period: sixty minutes after the scheduled time. Output that has not appeared before the grace period fully elapses does not yet count as missed.
- Missed output: once the scheduled time plus the sixty-minute grace period has fully elapsed and the expected output still has not appeared and cannot be verified present, one missed output is established.
- Make-up: an expected output missed during a failure, produced afterwards one by one and verified. Make-up counts only when the output can be opened for inspection and its content matches what it was originally supposed to produce; making up only a title or an empty shell does not count.
- Approved pause: a schedule disabled with all three parts present — explicit approval (who approved it, and which schedule they approved disabling), a disable record (when it was disabled and why), and a revisit date (when restoration will be reconsidered). If any one part is missing, no approved pause exists.
- Silent disable: the schedule's actual state is disabled, and no approved pause can be found (any one of the three parts missing counts as none found).
- State reconciliation: a zero-LLM dead script that, once an hour, reads each schedule's actual state and most recent run record and compares them against the registry's expectations; it reports facts only and judges neither cause nor blame.
- Read failure: reading a state or a run record has failed (insufficient permission, an interface error, records missing to the point that the state cannot be judged), so it cannot be confirmed whether the schedule is enabled or disabled.
- Result codes (exactly one per scenario, judged in the priority order of Section 4):
  - C Recovered and closed: the schedule did fail, it has been re-enabled, and every missed output has been made up and verified complete. Close the case; this round ends.
  - E Silent-disable escalation: the state is disabled and no approved pause can be found. Escalate at once and record it as a silent-disable event.
  - M Make-up pending: the schedule is currently enabled, but missed output has not all been made up and verified. Inventory and make up one by one; the case stays open.
  - A Approved pause: the state is disabled and an approved pause is complete in all three parts. Track it by its revisit date, with no escalation and no make-up.
  - R Read failure, to investigate: a state or record read has failed, so enabled or disabled cannot be confirmed. Report it as a read failure and retry.
  - W Running normally: enabled, the most recent output appeared within the grace period and was verified present, no missed output, and no unclosed failure event. Keep observing by reconciliation.

## 1. The Three-Mechanism Model

- Mechanism one (the registry): registration comes first, expectation second; a schedule that is not registered can be disabled without anybody noticing. A schedule whose registration is incomplete gets its registration completed first, before reconciliation or judgement is discussed.
- Mechanism two (state reconciliation): reconciliation answers exactly two mechanical questions — is the actual state the expected enabled state, and did the most recent expected output appear within its grace period. It does not read the owner's account of things and does not judge content quality.
- Mechanism three (make-up): output missed during a failure is made up one by one and verified. Re-enabling and making up are two separate things: re-enabling alone, without make-up, does not constitute closure.
- The division of labour among the three: the registry governs what should exist, reconciliation governs what actually is, and make-up governs how what is missing gets repaid. A disable belongs to E, missed output belongs to M, and only when both are fully cleared does a case belong to C.

## 2. Registry Field Rules

- Four required fields: the name (findable directly in the scheduling system), the cadence and scheduled time, the owner (who handles it and to what level escalation goes), and the expected output (what is produced, where it lives, and how its presence is verified).
- If any field is missing: the schedule counts as not fully registered; complete the registration first. This specification's missed-output and reconciliation judgements take complete fields as a premise.
- The scheduled time is the anchor of the missed-output judgement: with no scheduled time there is no starting point for a grace period, and missed output may not be judged from impression.

## 3. Evidence and Reconciliation Rules

- State evidence is recognised only from the scheduling system's actual state and run records. An owner saying "it should still be running", or a screen that looks normal, changes no state fact.
- A missed output is established only when two things both hold: the scheduled time plus the sixty-minute grace period has fully elapsed, and the expected output has not appeared and cannot be verified present. Before the grace period elapses, no missed output is established.
- Make-up is established only when two things both hold: the output can be opened for inspection, and its content matches what it was originally supposed to produce. If either is missing, that output still counts as not made up.
- A failed reconciliation read is a read-failure event, judged and reported under R in Section 4 with a retry; it is judged neither E, nor M, nor A, nor W, because this specification's judgements require the actual state as a factual input.
- An approved pause is checked against the record: the approval, the disable record, and the revisit date must all be findable in the record; a spoken "it was approved" with nothing findable in the record counts as none found.

## 4. Judgement Order (Priority Order, Take the First That Holds)

For each scenario, check in order and take the first code that holds; a condition a scenario does not mention counts as satisfying the applicability premises, and a fact a scenario states explicitly is judged as stated:

1. C Recovered and closed: in the scenario the schedule did fail (a silent disable or missed output), it has now been re-enabled, and every expected output missed during the failure has been made up and verified complete → C; close the case, and this round ends. Even if the case was previously escalated or alerted, completion closes that case under C.
2. E Silent-disable escalation: the schedule's actual state is disabled, and no approved pause can be found (explicit approval, a disable record, or a revisit date — any one missing counts as none found) → E; escalate to the responsible level at once, record it as a silent-disable event, and do not quietly just switch it back on and call it done. Even where missed output already exists at the same time, judge E first.
3. M Make-up pending: the schedule is currently in the enabled state, but one or more expected outputs have passed the missed-output threshold (the scheduled time plus the sixty-minute grace period fully elapsed without appearing) and have not all been made up and verified → M; inventory the missed outputs one by one, queue the make-up, and keep the case open. Even where the missed output came from an earlier silent disable, as long as the schedule is now enabled and the make-up is incomplete, judge M, not C.
4. A Approved pause: the schedule's actual state is disabled, and an approved pause is complete in all three parts (explicit approval, a disable record, and a revisit date) → A; track it by its revisit date, with no escalation and no make-up required for output during the pause.
5. R Read failure, to investigate: reading the schedule's actual state or run record has failed, so it cannot be confirmed whether it is enabled or disabled → R; report it as a read failure and retry the read; treat it neither as disabled nor as normal.
6. W Running normally: the schedule is in the enabled state, its most recent expected output appeared within the grace period and was verified present, and there is no missed output and no unclosed failure event → W; keep observing on the hourly reconciliation rhythm, with no early alert and no early escalation.

## 5. Scope and Honest Limits

- Premises: this specification takes three things as premises — the registry's fields are complete, the schedules' actual states and run records are readable, and the presence or absence of expected output can be verified. A scenario that does not mention one counts it as holding; where one does not hold in reality, complete the facts first instead of forcing a judgement (a read failure is reported under R per Section 3, never forced into E, M, A, or W).
- Output during a pause is not made up: during an approved pause there is supposed to be no output at all, so absence in that period is not missed output and requires no make-up.
- An overdue pause is a separate case: if, once an approved pause's revisit date arrives, the schedule has neither been restored nor had its pause extended, absence from the revisit date onward is no longer protected by A and is judged afresh under the missed-output and silent-disable rules as a separate case.
- Re-enabling does not close a case by itself: after a silent disable is discovered, even if the schedule is re-enabled immediately, as long as missed output has not been fully made up the case stays open under M; only when every missed output has been made up and verified does it close under C.
- Reconciliation reports facts only: reconciliation reports facts such as "the state is disabled and no approval record can be found" and "a given output did not appear past its grace period"; it judges neither the cause nor the blame. The cause is reported by the owner after receiving the escalation, and the disposition still follows these codes.

## 6. Judgement Exercises (For Self-Testing)

For each scenario below, give, under Sections 0 to 5: the result code (C / E / M / A / R / W) and the key reason. The answers are in Section 7; finish before comparing. A condition this section does not specially note counts as satisfying the applicability premises; a fact a scenario states explicitly is judged as stated.

- Q1: The hourly reconciliation finds that a daily schedule's actual state is disabled; searching the record turns up no explicit approval, no disable record, and no revisit date. That schedule's expected output for today has also not appeared. Question: what is the code?
- Q2: A schedule's actual state is disabled; the record contains an explicit approval (naming this schedule as the one approved for disabling), a disable record (when it was disabled and why), and a revisit date — all three parts present. Question: what is the code?
- Q3: A daily schedule that was found silently disabled yesterday has been re-enabled and is currently in the enabled state; of the two expected outputs missed during the failure, one has been made up and the other has not yet been made up. Question: what is the code?
- Q4: A daily schedule that was previously escalated for a silent disable has now been re-enabled; every expected output missed during the failure has been made up and verified one by one as complete. Question: what is the code?
- Q5: When the hourly reconciliation tries to read a schedule's actual state, the query fails for insufficient permission, and the run record cannot be read either; it currently cannot be confirmed whether this schedule is enabled or disabled. Question: what is the code?
- Q6: A daily schedule is currently in the enabled state; today's expected output appeared twenty minutes after the scheduled time and has been verified present; there is no missed output and no unclosed failure event. Question: what is the code?

## 7. Reference Answers

- Q1 → E Silent-disable escalation. The actual state is disabled, and the approval, the disable record, and the revisit date are all missing, so under item 2 of Section 4 the code is E: escalate at once and record it as a silent-disable event. Today's output not appearing is a consequence of the same event, but E comes before M — escalate first, then discuss make-up.
- Q2 → A Approved pause. The actual state is disabled, but the explicit approval, the disable record, and the revisit date are all present, so an approved pause is established, and under item 4 of Section 4 the code is A: track it by its revisit date, with no escalation and no make-up required for output during the pause.
- Q3 → M Make-up pending. The schedule has been re-enabled and is currently in the enabled state, but of the two missed outputs only one has been made up and the other has not yet been made up and verified, so under item 3 of Section 4 the code is M: the case stays open, and C is not judged until the make-up is complete.
- Q4 → C Recovered and closed. The schedule did fail by silent disable, it has now been re-enabled, and every missed output has been made up and verified one by one as complete, so under item 1 of Section 4 the code is C: close the case, and this round ends.
- Q5 → R Read failure, to investigate. The state and record reads have failed, so enabled or disabled cannot be confirmed, and under item 5 of Section 4 the code is R: report it as a read failure and retry; unreadable is not the same as disabled, and not the same as normal either.
- Q6 → W Running normally. The schedule is enabled, today's output appeared twenty minutes after the scheduled time — inside the sixty-minute grace period — and has been verified present, with no missed output and no unclosed event, so under item 6 of Section 4 the code is W: keep observing by hourly reconciliation.

© PlAIground Lab. Posts may be quoted and learned from by AI; please credit the source. Commercial resale is prohibited.
