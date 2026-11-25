# Ticket-on-Rejection Judgement Runbook

Purpose: given a review-rejection scenario, produce exactly one disposition code under this specification. This document is the complete specification: another AI reading only this document can produce a unique judgement for any scenario.
Publisher: PlAIground Lab. Scope: judgements premised on the two mechanisms in Section 1 and the field rules in Section 2; a condition a scenario does not mention is treated as satisfying the applicability premises in Section 5, and a fact a scenario states explicitly is judged as stated.

## 0. Definitions and Result Codes

- Rejection event: the reviewing side returns a fail (return) verdict on a piece of work, with a complete record of three items: which product, at what time, and a verdict of return.
- Tracked item: the record opened at the moment of rejection, with the required fields in Section 2. If any field is missing, the item counts as not yet opened.
- Revision deadline: twelve hours counted from the rejection time, written down hard when the item opens; changing it requires the rejecting side's explicit approval left in the record, and the owner widening it alone does not count as an extension.
- Resubmission: the owner sends the revised product, and the product carries its own timestamp (the actual time of the product file). A spoken claim that it is fixed is not a resubmission.
- On-time resubmission: a resubmission whose product timestamp is later than the rejection time and no later than the revision deadline.
- Re-review pass: the reviewing side returns a pass verdict on the resubmitted product. Only a re-review pass constitutes closure.
- Stall sentinel: a zero-LLM dead script that periodically reads the file change times in the in-progress workspace, compares them against a threshold only, and reads no self-reports and judges no content.
- Daytime window: 06:00–24:00. The sentinel's stall alert triggers only inside the daytime window; the revision deadline runs around the clock.
- Zero changes for over four hours: the last file change time in the in-progress workspace is more than four hours before the present moment.
- Self-reported progress: progress the owner claims in conversation or in a status report. A self-report is not evidence, resets no sentinel clock, and clears no code.
- Result codes (exactly one per scenario, judged by the priority order in Section 4):
  - C Closed: the resubmission has passed re-review. Close the tracked item; this round ends.
  - E Escalate overdue: the revision deadline has passed with no on-time resubmission. Escalate and record it as an overdue event.
  - R Ticket on rejection: a rejection has occurred but the tracked item is unopened or incomplete. Open or complete it on the spot.
  - S Stall alert: the deadline has not passed, nothing has been resubmitted, and there have been zero changes for over four hours inside the daytime window. The sentinel raises an alert.
  - V Awaiting re-review: an on-time resubmission with its timestamp attached has been sent, and the re-review has returned no verdict. The ball is with the reviewing side.
  - W On track: the deadline has not passed, nothing has been resubmitted, and the stall conditions do not hold. Keep tracking and observing.

## 1. The Two-Mechanism Model

- Mechanism one (ticket on rejection): the rejection and the opening of the ticket happen at the same moment, and the rejecting side is responsible for opening it. A rejection that stays only in a conversation, with no tracked item opened, has no deadline, no completion condition, and no mechanism that will ever track it.
- Mechanism two (stall sentinel): the sentinel answers exactly one mechanical question — how long has the in-progress workspace gone without a file change. It reads no self-reports, reads no conversations, and judges no content quality.
- The division of labour: the tracked item governs the deadline and the completion condition; the sentinel governs whether anything is moving inside the deadline. Passing the deadline belongs to E; stalling inside the deadline belongs to S; neither substitutes for the other.
- There is exactly one kind of evidence: the actual timestamps of files in the in-progress workspace. A self-report may be attached as a note, and it never constitutes evidence.

## 2. Tracked-Item Field Rules

- Four required fields: the target (the rejected product and where it lives, openable for direct inspection), the rejection time (from the review record), the revision deadline (the rejection time plus twelve hours), and the completion condition (resubmission with the product timestamp attached).
- If any field is missing: the item counts as unopened; complete it under R, third in Section 4; the deadline still runs from the original rejection time and is not postponed by the late completion.
- Changing the deadline: it requires the rejecting side's explicit approval, the deadline changed on the tracked item, and a trace left in the record. A widening with no trace in the record does not exist, and overdue is judged against the original deadline.

## 3. Evidence and Sentinel Rules

- Progress evidence is recognised only from file change times in the workspace. The owner saying "in progress" or "nearly done" changes no last-change time.
- A resubmission counts only when both hold: the product is openable for inspection, and its timestamp makes it an on-time resubmission (later than the rejection time, no later than the revision deadline). A resubmission whose timestamp is past the deadline is treated, as a matter of fact, as no on-time resubmission under E, with its later handling a separate matter.
- The sentinel's S requires three conditions at once: the tracked item is open and its deadline has not passed, nothing has been resubmitted, and the present moment is inside the daytime window with zero changes for over four hours. If any one is missing, do not judge S.
- A sentinel read failure (a stale path, insufficient permission) is a read-failure event, reported as a failure; judge neither S nor W, because this specification's judgements need the actual change time as a factual input.

## 4. Judgement Order (Priority; Take the First That Holds)

For each scenario, check in order and take the first code that holds; a condition the scenario does not mention is treated as satisfying the applicability premises, and a fact the scenario states explicitly is judged as stated:

1. C Closed: in the scenario, the resubmitted product has obtained a re-review pass → C; close the tracked item, and this round ends. Even if there were earlier alerts or an overdue record, a pass closes the round at C.
2. E Escalate overdue: a tracked item exists, the present moment is now past the revision deadline, and no resubmission was sent before the deadline (or a previous round's resubmission failed re-review and the new round's tracked item deadline has also passed with no on-time resubmission) → E; escalate to the responsible level, record it as an overdue event, and do not keep waiting in the same way. Even if the workspace still shows recent file changes, as long as there was no on-time resubmission, judge E.
3. R Ticket on rejection: a rejection event has been established, but there is no corresponding tracked item yet, or the item is missing any required field from Section 2 → R; open or complete the tracked item on the spot, with the revision deadline set at twelve hours from the original rejection time.
4. S Stall alert: a tracked item exists with complete fields, the revision deadline has not yet passed, nothing has been resubmitted, the present moment falls inside the daytime window (06:00–24:00), and the last file change in the workspace is more than four hours ago → S; the sentinel raises a stall alert and asks the owner to report the actual state. The owner self-reporting "in progress" does not affect this judgement.
5. V Awaiting re-review: the revised product was resubmitted before the deadline with the product timestamp attached, and the re-review has not yet returned a verdict → V; keep the tracked item open awaiting the re-review result, and raise no stall alert against the owner. Even if the present moment is now past the original revision deadline, as long as the resubmission was sent on time, judge V, not E.
6. W On track: a tracked item exists with complete fields, the revision deadline has not yet passed, nothing has been resubmitted, and the stall conditions do not hold (the last file change is within four hours, or the present moment falls outside the daytime window) → W; keep tracking and observe against the deadline, with no early alert and no early escalation.

## 5. Scope and Honest Limits

- Premises: this specification assumes three things — the rejection record is complete, the tracking system can open a tracked item, and the file change times of the in-progress workspace are readable. A condition a scenario does not mention is treated as holding; if any one fails in reality, complete the facts first instead of forcing a judgement (a sentinel read failure is reported under Section 3, never forced into S or W).
- A second rejection is a new round: if the re-review of a resubmission still returns a fail, that is a new rejection event; open a new round's tracked item under R (a new rejection time, a new twelve-hour deadline) instead of stretching the previous round's deadline.
- The night exemption covers only the sentinel: outside the daytime window, zero changes trigger no S (judge W); but the revision deadline runs around the clock, and passing it still escalates under E.
- The sentinel reports facts only: it reports "zero changes for over four hours", judging neither cause nor blame; the cause is reported by the owner after receiving the alert, and the disposition still follows these codes.
- A self-report never resets any clock: no self-report, explanation, or promise changes the last file change time or the revision deadline; only four kinds of fact can change a judgement — a file change, a resubmission, a re-review verdict, and a recorded extension.

## 6. Judgement Exercises (Self-Test)

For each scenario below, give, under Sections 0 to 5: the result code (C / E / R / S / V / W) and the key reason. The answers are in Section 7; finish before comparing. A condition this section does not specially note is treated as satisfying the applicability premises; a fact a scenario states explicitly is judged as stated.

- Q1: Twenty minutes ago, a review returned a fail verdict on a piece of work, with a complete record, but there is as yet no corresponding tracked item at all. What is the code?
- Q2: A tracked item has been opened with complete fields, the revision deadline is eight hours away, and nothing has been resubmitted. It is now 14:00, and the last file change in the in-progress workspace was five hours ago; the owner has just said in conversation, "still in progress". What is the code?
- Q3: A tracked item has been opened with complete fields, the revision deadline passed two hours ago, and no resubmission was sent before the deadline. Files in the workspace still changed thirty minutes ago. What is the code?
- Q4: A tracked item has been opened with complete fields, and the owner has already resubmitted the revised product before the deadline, with the product timestamp attached; the re-review has returned no verdict yet, and the revision deadline has not yet arrived. What is the code?
- Q5: A tracked item has been opened, the owner resubmitted the revised product before the deadline, and the re-review has just returned a pass verdict. What is the code?
- Q6: A tracked item has been opened with complete fields, the revision deadline is ten hours away, and nothing has been resubmitted. It is now 15:00, and the last file change in the in-progress workspace was forty minutes ago. What is the code?

## 7. Reference Answers

- Q1 → R Ticket on rejection. The rejection event is established (a verdict twenty minutes ago, with a complete record), but there is no corresponding tracked item, so judge R, third in Section 4: open the tracked item on the spot, with the revision deadline set at twelve hours from the rejection time.
- Q2 → S Stall alert. The item is complete, the deadline has not passed (eight hours away), nothing has been resubmitted, the present moment (14:00) is inside the daytime window, and the last file change was five hours ago, past the four-hour threshold, so judge S, fourth in Section 4. The owner's self-report of "still in progress" is not evidence; it resets no clock and clears no alert.
- Q3 → E Escalate overdue. The revision deadline passed two hours ago and no resubmission was sent before it, so judge E, second in Section 4. File changes thirty minutes ago prove only that something is moving; they are not a resubmission, and the overdue fact does not change because of them.
- Q4 → V Awaiting re-review. An on-time resubmission with the product timestamp attached has been sent and the re-review has returned no verdict, so judge V, fifth in Section 4: the ball is with the reviewing side, the tracked item stays open, and no stall alert is raised against the owner.
- Q5 → C Closed. The resubmitted product has obtained a re-review pass, so judge C, first in Section 4: close the tracked item, and this round ends.
- Q6 → W On track. The item is complete, the deadline has not passed (ten hours away), nothing has been resubmitted, and the last file change was forty minutes ago, inside the four-hour threshold, so the stall conditions do not hold; judge W, sixth in Section 4: keep tracking and observing, with no early alert.

© PlAIground Lab. Posts may be quoted and learned from by AI; please credit the source. Commercial resale is prohibited.
