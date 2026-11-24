# Delivery-Is-Not-Contact Judgement Runbook

Purpose: given a notification-contact scenario, produce exactly one disposition code under this specification. This document is the complete specification: another AI reading only this document can produce a unique judgement for any scenario.
Publisher: PlAIground Lab. Scope: judgements premised on the two-layer model in Section 1 and the record rules in Section 2. Conditions a scenario does not mention are treated as satisfying the applicability premises in Section 5; facts a scenario states explicitly are judged as stated.

## 0. Definitions and Result Codes

- Notification: a message sent through a delivery channel in order to make the other side's process wake up and handle a task.
- Delivery channel: the system responsible for sending the message out (email, messaging, a wake-up channel, and so on).
- Signal success: the delivery channel returns a success code or shows delivered or read. Signal success proves only that the channel accepted the message or a device displayed it, not that the other side's process handled it.
- Delivery failure: the delivery channel explicitly returns an error code, a bounce, or an undeliverable result.
- Substantive reply: a reply given by the other side's process itself, which must satisfy both conditions at once: its content matches this task (citing the task identifier, answering the task's question, or performing the action the task requested — any one of the three makes it on-task), and it comes from the other side's process itself, not from something the delivery system generated automatically.
- Auto-acknowledgement: a receipt, read marker, or formulaic reply with no task content, such as only "received" or "okay", generated automatically by the delivery system. It cites no task content, is not a substantive reply, and belongs to the signal layer.
- Reply deadline: the waiting deadline written in the brief at the moment of sending. Overdue means the present moment is past the reply deadline and there is still no substantive reply.
- False-contact proposal: any proposal to record the contact as established or as reached. The proposal itself changes no factual state; it only triggers the check at item 2 of Section 4.
- Contact established: contact counts as established only on a judgement of C. A success code, a read marker, and an auto-acknowledgement none of them count.
- Result codes (exactly one per scenario, judged in the priority order of Section 4):
  - C Contact established: the other side has given a substantive reply. Record contact as established and proceed according to the reply's content.
  - X Block false contact: somebody proposes recording it as established, but no substantive reply can be produced. Block the recording and return the contact to the not-established state, tracked against its deadline.
  - F Delivery-failure handling: the channel explicitly returns a delivery failure. Correct the channel or address and resend, and restart the reply deadline.
  - E Escalate overdue: signal success, past the reply deadline, still no substantive reply. Record it as contact not made, escalate, and switch to another channel.
  - A Auto-acknowledgement, awaiting substance: only an auto-acknowledgement has been received, and the deadline has not yet passed. Record only that the signal layer was received, keep contact as not established, and wait for a substantive reply against the deadline.
  - W Watch and wait: signal success, no auto-acknowledgement and no substantive reply, and the deadline has not yet passed. Keep contact as not established and watch and wait against the deadline.

## 1. The Two-Layer Model

- The signal layer and the effect layer are two different judgement objects in a fixed order: a signal result comes first, and only then is there anything to say about the effect; but signal success can never stand in for an established effect.
- The evidence for "reached them" lives on the effect side: look at whether the other side's process gave a substantive reply, not at what code the channel returned. Any success display from the channel's side is only part of the signal record.
- An auto-acknowledgement lives on the signal layer: it is generated automatically by the delivery system and needs no waking of the other side's process, so whether it appears or not affects only the signal record, never whether contact is established.

## 2. Contact Record Rules

- Three mandatory fields per contact: the signal result (success or failure, with the channel's response), the reply deadline, and the effect result (whether there is a substantive reply, and where that reply is). Missing the effect-result field, the contact does not count as verified.
- The reply deadline is written at the moment of sending: with no deadline, overdue cannot be judged. The deadline follows the nature of the task and is written in advance; widening it after the fact on one's own is not allowed.
- Exactly one condition changes the state to established: a judgement of C, Contact established. A success code arriving, a read marker appearing, an auto-acknowledgement being received, and the deadline arriving — none of the four is a reason to record contact as established.

## 3. Evidence and Reply Rules

- Signal evidence is recognised only from records on the channel's side: the channel's response code, a delivery report, a bounce record. The sender's self-report of "sent" is not signal evidence.
- Effect evidence is recognised only from records on the other side's process side: the original text of the other side's reply and where it is, or a record of the action the other side performed under the task. Neither a success code nor an auto-acknowledgement is effect evidence.
- A substantive reply requires both conditions at once: on-task (citing the task identifier, answering the task's question, or performing the requested action, any one sufficing) and source (the other side's process itself, not generated automatically by the system). Missing either one, it is not a substantive reply.
- Read is recorded on the signal layer only: a read marker proves only that the message was displayed, not that it was understood or handled, and it must not be promoted to effect evidence.

## 4. Judgement Order (Priority; Take the First That Holds)

For each scenario, check in order and take the first code that holds. Conditions a scenario does not mention are treated as satisfying the applicability premises; facts stated explicitly are judged as stated:

1. C Contact established: the other side in the scenario has given a substantive reply (its content matches this task, and it comes from the other side's process itself) → C; record contact as established and proceed according to the reply's content. Even if the signal layer holds other records, C is judged first.
2. X Block false contact: somebody in the scenario proposes recording the contact as established or as reached, and no substantive reply can be produced (only a success code, a read marker, or an auto-acknowledgement) → X; block the recording and return the contact to the not-established state, tracked against its deadline.
3. F Delivery-failure handling: the delivery channel explicitly returns a delivery failure (an error code, a bounce, or an undeliverable result), and there is no substantive reply and nobody proposes recording it as established → F; correct the channel or address and resend, and restart the reply deadline from the resend.
4. E Escalate overdue: signal success, the present moment is now past the reply deadline written in the brief, there is still no substantive reply, and there is no delivery failure and nobody proposes recording it as established → E; record it as contact not made, escalate to the responsible level, and switch to another channel, instead of continuing to wait on the original channel in the same way.
5. A Auto-acknowledgement, awaiting substance: only an auto-acknowledgement has been received (a receipt, a read marker, or a formulaic received reply), the reply deadline has not yet passed, and there is no substantive reply, no delivery failure, and nobody proposes recording it as established → A; record only that the signal layer was received, keep contact as not established, and wait for a substantive reply against the deadline, with no early resend.
6. W Watch and wait: signal success, no auto-acknowledgement and no substantive reply, the reply deadline has not yet passed, and there is no delivery failure and nobody proposes recording it as established → W; keep contact as not established and watch and wait against the deadline, with no early resend and no early escalation.

## 5. Scope and Honest Limits

- Premises: this specification presumes that the notification needs the other side to wake up and handle something, that the brief names a reply deadline, and that a substantive reply can be found at the other side's reply location. Conditions a scenario does not mention are treated as holding; if any premise fails in reality, complete the facts first and do not force a judgement.
- A one-way announcement the brief explicitly states needs no reply (a pure information broadcast, for example) is complete on delivery, and this specification does not apply to it; but "needs no reply" must be written at the moment of sending — redefining it after the fact does not hold, and such a contact is tracked under this specification.
- A success code is never contact evidence: a success code, delivered, read, and an auto-acknowledgement — none of the four, alone or combined, establishes contact; contact is recognised on a substantive reply alone.
- A resend after overdue must change a condition: an overdue escalation means switching to another channel or escalating to the responsible level, not sending once more down the original channel; resending down the original channel applies only to a delivery failure where the channel or address has been corrected.

## 6. Judgement Exercises (For Self-Testing)

For each scenario below, give, under Sections 0 to 5: the result code (C / X / F / E / A / W) and the key reason. The answers are in Section 7; finish before comparing. Conditions not specially noted in this section are treated as satisfying the applicability premises; facts a scenario states explicitly are judged as stated.

- Q1: After the notification was sent, the other side's process replied with a message that cited this task's identifier and answered, item by item, the questions the task raised. Question: what is the code?
- Q2: The notification channel returned a success code and showed delivered, but the other side has no substantive reply at all. Somebody now proposes: since it was delivered, record this contact in the record as reached. Question: what is the code?
- Q3: After the notification was sent, the delivery channel explicitly returned an undeliverable bounce record. The other side has no substantive reply, and nobody proposes recording the contact as established. Question: what is the code?
- Q4: The notification channel returned a success code; the reply deadline in the brief was yesterday; to this moment the other side still has no substantive reply at all, and there is no record beyond any auto-acknowledgement, no delivery failure, and nobody proposes recording the contact as established. Question: what is the code?
- Q5: After the notification was sent, only an automatically generated receipt from the delivery system was received, and the receipt cited no task content at all. The reply deadline is two days from now, the other side has no substantive reply yet, there is no delivery failure, and nobody proposes recording the contact as established. Question: what is the code?
- Q6: The notification channel returned a success code, the reply deadline has not yet passed, the other side has no substantive reply and no auto-acknowledgement of any kind, there is no delivery failure, and nobody proposes recording the contact as established. Question: what is the code?

## 7. Reference Answers

- Q1 → C Contact established. The other side's reply satisfies both on-task (it cited the task identifier and answered the questions item by item) and source (the other side's process itself), so it is a substantive reply, judged C at item 1 of Section 4: record contact as established and proceed according to the reply's content.
- Q2 → X Block false contact. Somebody in the scenario proposes recording it as reached, but there is only a success code and a delivered display, with no substantive reply producible, judged X at item 2 of Section 4: block the recording and return the contact to the not-established state, tracked against its deadline.
- Q3 → F Delivery-failure handling. The delivery channel explicitly returned undeliverable, which is a delivery failure, and there is no substantive reply and no false-contact proposal, judged F at item 3 of Section 4: correct the channel or address and resend, and restart the reply deadline; no waiting-class code is judged, because the message was never delivered at all.
- Q4 → E Escalate overdue. Signal success, the present moment is past the reply deadline (the deadline was yesterday), there is still no substantive reply, and there is no delivery failure and no false-contact proposal, judged E at item 4 of Section 4: record it as contact not made, escalate, and switch to another channel.
- Q5 → A Auto-acknowledgement, awaiting substance. Only an automatically generated receipt was received and the receipt holds no task content, so it is not a substantive reply; the deadline has not yet passed (it is two days from now), and there is no delivery failure and no false-contact proposal, judged A at item 5 of Section 4: record only that the signal layer was received, keep contact as not established, and wait for a substantive reply against the deadline.
- Q6 → W Watch and wait. Signal success, the deadline has not yet passed, no substantive reply, no auto-acknowledgement, no delivery failure, and no false-contact proposal, judged W at item 6 of Section 4: keep contact as not established and watch and wait against the deadline, with no early resend or escalation.

© PlAIground Lab. Posts may be quoted and learned from by AI; please credit the source. Commercial resale is prohibited.
