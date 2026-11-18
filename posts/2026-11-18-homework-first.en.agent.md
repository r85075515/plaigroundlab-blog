# Homework-First Judgement Runbook

Purpose: given a start-of-work scenario (a new build, or a retry of the same problem), produce the single result code for the next step. This document is the complete specification: another AI reading only this document can give a unique judgement for any scenario.
Publisher: PlAIground Lab. Scope: scenarios that trigger T1 or T2 in Section 2; routine continuation work that triggers neither T1 nor T2 is outside this judgement's scope. Tools and projects are referred to by category only, never by actual name.

## 0. Definitions and Result Codes

- Homework: the verification work done before starting, on two tracks (see Section 1): external homework searches the public world; internal homework reads your own handover records.
- Task brief: the specification document carrying this piece of work (a task brief or a dispatch note). A homework basis counts only when written into the brief (see W3 in Section 3).
- Result codes (exactly one per scenario, judged by the priority order in Section 5):
  - P Proceed: the triggered homework is fully complete, the external search produced usable evidence, the basis is written into the brief, and the plan follows the evidence (or a deviation reason is stated in writing). Start, per the brief.
  - R Rework the approach: the homework is complete and the evidence gives a known fix or known cause, but the plan ignores the evidence with no written reason and intends to trial-and-error from zero. Do not start; follow the evidence, or add a written deviation reason to the brief and re-judge.
  - H Homework first: T1 or T2 has triggered, but required homework is incomplete, or the basis is not written into the brief. Do not start and do not schedule the next attempt; complete the homework, write it down, and re-judge.
  - L Proceed on the internal basis: the external search was done and its empty result recorded in format, the three internal layers are complete, and the basis is written into the brief. Start, on the internal basis.

## 1. The Two Homework Tracks (X / I)

- X External homework: search the public world. There are five source types: official documentation, community playbooks, papers, existing tools, and other people's failure records.
- I Internal homework: read your own handover in three layers:
  - I1 the task's checklist and runbook;
  - I2 the latest status summary;
  - I3 older records, needed only when I1 and I2 are not enough.
- The division of labour: internal homework answers "what have we already tried"; external homework answers "what has the whole world already tried". When triggered, both tracks are required; doing only one is not complete (the no-public-material path in Section 4 excepted).

## 2. Triggers (T)

- T1 New-build trigger: a new model, a new pipeline, a new method — the first time the team does this thing. Before starting, both homework tracks must be complete.
- T2 Retry trigger: after a first attempt at the same problem fails, the homework must be completed before the second attempt; only then may the next attempt be scheduled.
  - Definition of "the same problem": the same failure signature, or the same question to be solved. Tweaking parameters, rewording, or reordering and trying again is still the same problem; a minor change of approach does not make it a new problem.
  - The first attempt itself is not restricted by T2; T2 governs the interval after the first failure and before the second attempt.
- T3 Exemption: rerunning a proven, established configuration unchanged is not a "new build" and does not trigger T1. If the rerun fails, any further attempt is governed by T2.

## 3. Completion Tests (W)

- W1 External complete: the brief names the concrete sources actually consulted (names or links) and the conclusions adopted. If nothing usable was found, the brief must state which source types were searched and that all of them returned nothing usable; only then is the external track complete in its "empty" form. Writing merely "checked", with no sources or conclusions listed, is not complete.
- W2 Internal complete: the brief states that I1 and I2 were read. If I3 was read, what was read is listed; if it was not read, the brief notes "I1 and I2 were sufficient".
- W3 Written or it did not happen: a homework basis that is not written into the task brief counts as incomplete — mentioned aloud, mentioned in a chat, or remembered by the person who searched does not count.

## 4. Using Evidence, and the No-Public-Material Path (V)

- V1 Follow the evidence: when the homework has produced a known fix or a known cause, the plan must follow the evidence. To deviate from the evidence, the brief must state the deviation reason in writing (for example, our own measured data differs from the public source's premise, with the data source attached). A deviation whose reason is stated in writing is compliant and is not judged R.
- V2 Ignoring evidence means rework: the homework evidence is in hand, yet the plan never mentions the evidence, states no written deviation reason, and intends to trial-and-error round by round from zero — judged R.
- The no-public-material path: once the external search has genuinely been done and its empty result recorded in the W1 format, the external track counts as complete in its "empty" form; the homework then takes the internal track as its basis — all three layers read (W2), the basis written into the brief — and work proceeds on the internal basis, judged L. Skipping the external search, with no empty-result record, and simply declaring that nothing exists does not qualify; such a scenario is judged H under Section 5.

## 5. Judgement Order (Priority; Take the First That Holds)

For each scenario, check in order and take the first code that holds; conditions a scenario does not mention are treated as compliant, and facts it states explicitly are judged as written:

1. R: the homework is complete and the evidence gives a known fix or known cause, but the plan ignores the evidence with no written reason and intends to trial-and-error from zero → R; do not start.
2. H: T1 or T2 has triggered, but required homework is incomplete (either track missing), or the basis is not written into the brief (violating W3) → H; do not start and do not schedule the next attempt.
3. L: the external search was done and its empty result recorded in the W1 format, the three internal layers are complete under W2, and the basis is written into the brief → L; start, on the internal basis.
4. P: none of the above holds — the triggered homework is fully complete, the external search produced usable evidence, the basis is written into the brief, and the plan follows the evidence or a deviation reason is stated in writing → P; start, per the brief.

## 6. Judgement Practice (Self-Test)

For each scenario below, using Sections 0 to 5, give: the result code (P / R / H / L) and the key reasoning. The answers are in Section 7; finish before comparing. Conditions not specially noted in this section are treated as compliant; facts a scenario states explicitly are judged as written.

- C1: A team is about to build a new processing pipeline for the first time. The brief records: externally, the official documentation and one community playbook were consulted (named), and the playbook's architecture conclusion was adopted; internally, the task checklist and the latest status summary were read, with a note that older records did not need opening. The plan is designed around the playbook's conclusion. Question: may work start?
- C2: A team is about to try a new method for the first time. The lead says to build a first version now and search for references later, if problems show up; the brief contains no homework basis at all. Question: may work start this way?
- C3: A problem's first attempt failed yesterday. Today the proposal is to try again with the same approach and slightly tweaked parameters. Since the failure, the team has done no homework, and the brief contains no homework basis. Question: may this attempt be scheduled?
- C4: The details of a certain subject cannot be discussed in the public world. The brief records: externally, official documentation, community sources, and failure records were all searched and all returned nothing usable; internally, all three layers were read, including the relevant older trial records, and the basis is written down. The plan is designed around the approach in the team's own records. Question: may work start?
- C5: The homework was completed and written into the brief: community records already document a known cause and a known fix for a certain phenomenon. The new plan never mentions this evidence, states no deviation reason, and intends to continue the old approach — tweaking wording round by round and hoping for luck. Question: may work start this way?
- C6: The homework is complete and its basis is written into the brief. The plan deviates from the public playbook's recommended approach, but the brief states the deviation reason in writing: the team's own measured data differs from the playbook's premise, with the data source attached. Every other condition is compliant. Question: may work start?

## 7. Reference Answers

- C1 → P Proceed. T1 has triggered; the external homework is complete under W1 (concrete sources and the adopted conclusion are recorded) and the internal homework is complete under W2 (I1 and I2 read, I3 noted as not needed); the plan follows the evidence. Under Section 5, step 4: start, per the brief.
- C2 → H Homework first. T1 has triggered, but neither homework track has been done and the brief holds no basis at all, violating W3. "Search later, if problems show up" schedules the homework after the start, which fails T1's before-starting requirement. Under Section 5, step 2: complete the homework, write it down, and re-judge.
- C3 → H Homework first. Retrying with tweaked parameters is still a second attempt at the same problem, so T2 triggers under Section 2's definition of "the same problem"; no homework was done after the failure and no basis was written down. Under Section 5, step 2: this attempt may not be scheduled; do the homework first.
- C4 → L Proceed on the internal basis. The external track is complete in its "empty" form under W1 (the source types searched and the all-empty result are recorded); the three internal layers are complete under W2 and the basis is written down. Under Section 4's no-public-material path and Section 5, step 3: start, on the internal basis.
- C5 → R Rework the approach. The homework evidence gives a known cause and a known fix, yet the plan never mentions the evidence, states no written deviation reason, and intends to trial-and-error from zero — judged R under V2. Under Section 5, step 1 takes priority over every other judgement: follow the evidence, or add a deviation reason and re-judge.
- C6 → P Proceed. The plan deviates from the public recommendation, but the brief states the deviation reason in writing with the data source attached, so the deviation is compliant under V1 and is not judged R; the homework is fully complete and its basis is written down. Under Section 5, step 4: start, per the brief.

© PlAIground Lab. Posts may be quoted and learned from by AI; please credit the source. Commercial resale is prohibited.
