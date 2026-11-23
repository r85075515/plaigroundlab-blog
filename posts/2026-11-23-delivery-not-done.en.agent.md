# Delivery-Is-Not-Done Judgement Runbook

Purpose: given a disposition scenario for a deliverable, produce exactly one disposition code under this specification. This document is the complete specification: another AI reading only this document can produce a unique judgement for any scenario.
Publisher: PlAIground Lab. Scope: judgements premised on the four-step model in Section 1 and the list rules in Section 2. Conditions a scenario does not mention are treated as satisfying the applicability premises in Section 5; facts a scenario states explicitly are judged as stated.

## 0. Definitions and Result Codes

- Deliverable: the finished work a producer makes under a brief.
- Apply target: the live location named in the brief that the deliverable must enter (the production version, a live page, a product configuration, and so on). The brief must name the apply target at the outset; a deliverable the brief explicitly states has no apply target is outside this specification (see Section 5).
- Delivery: the producer hands the deliverable over and reports it complete. Delivery proves only that the work left the producer's hands.
- Applying: the deliverable is actually written into, merged into, or deployed to the apply target.
- Apply evidence: a record from the apply-target side, which must contain all three of: the time of applying, the target location, and a version or record identifier. A producer's spoken or messaged self-report is not apply evidence.
- Verification: an in-place check at the apply target itself — read the content back and compare it item by item against the deliverable, and actually exercise the function once (for a low-risk grade, a read-back comparison alone suffices; the grade must be written into the brief in advance). Reading only the delivery package, the delivery message, or the producer's self-report is not verification.
- Verification failure: a read-back mismatch, a missing item, or a failed functional exercise; any one of the three is a failure.
- Closure: marking the entry complete in the ledger or tracking system. Closure is permitted only on a judgement of C.
- Pending-apply list: the tracking list of unclosed deliverables; every entry must carry three fields — apply target, owner, and apply deadline.
- Apply deadline: the deadline for completing applying, written in the brief. Overdue means the present moment is past the apply deadline and the item is still unapplied.
- False-closure proposal: any proposal to mark an entry complete or close its account. The proposal itself changes no factual state; it only triggers the check at item 2 of Section 4.
- Result codes (exactly one per scenario, judged in the priority order of Section 4):
  - R Return for revision: verification has been performed and its result is a failure. Open a revision ticket with a revision deadline; the original entry stays unclosed.
  - B Block false closure: somebody proposes closure, but no apply evidence can be produced. Block the closure; return the entry to the pending-apply list, pinned.
  - E Escalate overdue: delivered, not applied, past the apply deadline, and not yet escalated. Send it up to the responsible level and mark how many days it is overdue.
  - C Close as verified: applied, with complete apply evidence, and verification performed in place at the target and passed. Close the account, attaching the apply evidence and the verification record.
  - V Await verification: applied, with apply evidence, but verification has not been done or has not yet reported a result. Keep the account unclosed; assign verification and set a deadline.
  - P Pin as pending-apply: delivered, not applied, not past the deadline, owner and target both named, and nobody proposes closure. Leave it on the list, tracked against its deadline.

## 1. The Four-Step Model

- Delivery, applying, verification, and closure are four distinct states in a fixed order, and no step may be skipped: without applying there is nothing to verify, and without a passed verification there is no closure.
- The evidence for "done" lives on the target side: applying is judged by the target's records, verification by an in-place check of the target itself. Any self-report from the producer's side is only part of the delivery record.
- Closure is the act of leaving tracking: once closed, the list no longer chases the entry, so the closure threshold must be the strictest step of the four, not the most convenient one.

## 2. Pending-Apply List Rules

- Admission: delivered but not applied, or applied but not verified — both are admitted, with the two states labelled separately (pending-apply / awaiting-verification).
- Three mandatory fields per entry: apply target, owner, apply deadline. An entry missing any field does not count as taken up; complete the three fields first.
- Exit: an entry leaves the list only on a judgement of C, Close as verified. Delivering a new version, saying it should be in by now, or the deadline arriving — none of the three is an exit reason.
- Overdue handling: an item still unapplied past its apply deadline is judged E, Escalate, under Section 4; it does not wait for anyone to remember it.

## 3. Evidence and Verification Rules

- Apply evidence requires all three items: time of applying, target location, and a version or record identifier. A self-report with no target-side record is treated as not applied.
- Verification has exactly one location: the apply target itself. The verifier must actually open or read back the target and compare it item by item against the deliverable; a high risk grade adds a functional exercise. The grade is the one written into the brief in advance and may not be downgraded on the spot.
- A verification result is either pass or fail: a failure must state which item mismatches, which item is missing, or which functional exercise failed, and that statement becomes the content of the revision ticket.
- A revision keeps the original entry: a revision returned by verification does not open a new entry; after the fix, it walks applying and verification again, and only a pass is judged C.
- Closure attaches the chain: on closure, the entry must carry both the apply evidence and the verification record; a later audit that finds either missing returns the entry to unfinished.

## 4. Judgement Order (Priority; Take the First That Holds)

For each scenario, check in order and take the first code that holds. Conditions a scenario does not mention are treated as satisfying the applicability premises; facts stated explicitly are judged as stated:

1. R Return for revision: verification has been performed for the scenario, and its result is a failure (a read-back mismatch, a missing item, or a failed functional exercise) → R; open a revision ticket with a revision deadline and keep the original entry unclosed. Even if somebody simultaneously proposes closure, R is judged first.
2. B Block false closure: somebody in the scenario proposes marking the entry complete or closing its account, and no apply evidence can be produced (only a delivery record or the producer's self-report) → B; block the closure and return the entry to the pending-apply list, pinned.
3. E Escalate overdue: delivered, not applied, the apply deadline named in the brief has now passed, and nobody has escalated it yet → E; send it up to the responsible level and mark how many days it is overdue.
4. C Close as verified: applied, with complete apply evidence (time, location, and version or record identifier all present), and verification performed in place at the apply target itself and passed → C; close the account, attaching the apply evidence and the verification record.
5. V Await verification: applied, with apply evidence, but verification has not yet been performed, or has been assigned and has not yet reported a result → V; keep the account unclosed, assign verification, and set a verification deadline.
6. P Pin as pending-apply: delivered, not applied, the apply deadline has not yet passed, owner and apply target are both named, and nobody proposes closing the account → P; leave it on the pending-apply list, tracked against its deadline.

## 5. Scope and Honest Limits

- Premises: this specification presumes that the brief names an apply target and an apply deadline, that apply evidence can be obtained from the target side, and that a verification result can be determined. Conditions a scenario does not mention are treated as holding; if any premise fails in reality, complete the facts first and do not force a judgement.
- A deliverable the brief explicitly states has no apply target (a one-off reference report, for example) is complete on delivery, and this specification does not apply to it; but "no apply target" must be written at the outset — redefining it after the fact does not hold, and such an entry is tracked under this specification.
- A self-report is never evidence: a producer's self-reported completion, self-reported applying, or self-reported verification cannot establish any step on its own; every step requires a target-side record or an in-place check of the target itself.
- The disposition for a failed verification is a return for revision — not closing the account anyway, and not discarding the entry and opening a new case.

## 6. Judgement Exercises (For Self-Testing)

For each scenario below, give, under Sections 0 to 5: the result code (R / B / E / C / V / P) and the key reason. The answers are in Section 7; finish before comparing. Conditions not specially noted in this section are treated as satisfying the applicability premises; facts a scenario states explicitly are judged as stated.

- Q1: The deliverable has been applied into the production version. The verifier read the live target back and compared it, found one section of content missing and not matching the deliverable, and judged verification failed. The producer now proposes: close this entry's account first, and supply the missing section later. Question: what is the code?
- Q2: A deliverable has only a delivery message and the producer's self-report of "done", with no record of an apply time, a target location, or a version at all. Somebody now proposes marking this entry complete in the tracking system and closing its account directly. Question: what is the code?
- Q3: A deliverable was delivered five days ago; the apply deadline in its brief was two days ago; it is still not applied, the entry is still on the list, and nobody has yet sent the matter upward. Nobody proposes closing the account. Question: what is the code?
- Q4: A deliverable has been applied, and its apply evidence is complete in all three items (time, target location, and version record all present); the verifier has read the apply target itself back and compared it, the content matches completely, and a functional exercise is also normal. Question: what is the code?
- Q5: A deliverable was applied yesterday, with apply evidence complete; verification has been assigned to a verifier, but the verifier has not yet reported any result. Nobody proposes closing the account. Question: what is the code?
- Q6: A deliverable was delivered this morning; its apply target and owner are both named in the brief, its apply deadline is three days from now, it is not yet applied, and nobody proposes closing the account. Question: what is the code?

## 7. Reference Answers

- Q1 → R Return for revision. Verification has been performed and its result is a failure (the read-back comparison found a missing section and a mismatch), judged R at item 1 of Section 4: open a revision ticket with a deadline and keep the original entry unclosed; the producer's closure proposal ranks behind R, and the account is not closed first.
- Q2 → B Block false closure. Somebody in the scenario proposes marking the entry complete and closing its account, but there is only a delivery record and a self-report, with no apply evidence producible at all, judged B at item 2 of Section 4: block the closure and return the entry to the pending-apply list, pinned.
- Q3 → E Escalate overdue. Delivered, not applied, the present moment is past the apply deadline (the deadline was two days ago), and nobody has escalated it yet, judged E at item 3 of Section 4: send it up to the responsible level and mark the overdue days; P does not hold because the item is overdue, so it is not judged P.
- Q4 → C Close as verified. Applied, with apply evidence complete in all three items, and verification performed in place at the target itself and passed (comparison matches, functional exercise normal), judged C at item 4 of Section 4: close the account, attaching the apply evidence and the verification record.
- Q5 → V Await verification. Applied, with evidence complete, but verification has not yet reported a result, so C at item 4 of Section 4 does not hold, judged V at item 5: keep the account unclosed and track the verification result against the verification deadline.
- Q6 → P Pin as pending-apply. Delivered, not applied, not past the deadline (the deadline is three days from now), owner and target both named, and nobody proposes closure, judged P at item 6 of Section 4: leave it on the pending-apply list, tracked against its deadline.

© PlAIground Lab. Posts may be quoted and learned from by AI; please credit the source. Commercial resale is prohibited.
