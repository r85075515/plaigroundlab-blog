# Platform Integration Last-Mile Judgement Runbook

Purpose: given a scenario in which a platform integration is stuck, produce exactly one disposition code under this specification. This document is the complete specification: another AI reading only this document can produce a unique judgement for any scenario.
Publisher: PlAIground Lab. Scope: judgements premised on the two-layer model in Section 1 and the diagnosis order in Section 2. Conditions a scenario does not mention are treated as satisfying the applicability premises in Section 5; facts a scenario states explicitly are judged as stated.

## 0. Definitions and Result Codes

- Account verification layer: identity, tax, phone, and business information managed inside the platform dashboard. Every item has an explicit status; a missing item appears in the dashboard pending list, naming what must be supplied.
- Integration authorization layer: the judgement a third-party connector or authorization flow makes when establishing a connection; its prompt may be a single generic sentence with no itemised detail.
- Dashboard fully passed: after an item-by-item in-place check of the dashboard, identity, tax, phone, and business information are all in a complete state, and the pending list is zero.
- Generic-prompt block: the authorization prompt is only a generic sentence of the "please complete your verification first" kind, naming no missing item.
- Same result on reproduction: walking the authorization flow through in full once more produces exactly the same prompt as the first time.
- Real-read verification: after authorization goes through, one item of real data is actually read back through that connection. Seeing only a success screen in the authorization flow does not count as real-read verification.
- Owner-only step: a step that, by law or explicit platform rule, can be completed only by the account owner in person (for example, the owner's own identity authentication). Ordinary remedy items are not owner-only.
- Manual-read path: a legitimate path by which real data can be read directly in the platform dashboard, under the account's existing entitlement, without going through integration authorization.
- Result codes (exactly one per scenario, judged in the priority order of Section 4):
  - E Escalate to the owner: an explicit pending item exists, and that item is an owner-only step. Hand only that step to the owner.
  - R Remedy and continue: an explicit pending item exists, or the authorization prompt names a specific missing item, and the item is not owner-only. Supply it, then walk the authorization again.
  - P Integration pass: the dashboard is fully passed, the authorization has actually gone through, and one real-read verification has been completed. The integration may be claimed to work.
  - L Loop blocked: the case has already been judged a platform defect (or the fallback is already active), and the proposed action is to resubmit verification, delete and rebuild the account, or repeatedly ask the owner to re-authenticate, with no evidence of any new missing item. Block it; do not do it.
  - F Fallback manual read: the dashboard is fully passed, a generic prompt blocks authorization with the same result on reproduction, and a usable manual-read path exists. File the defect report and activate the manual read; label downstream use as not obtained through a verified integration, read manually.
  - D Defect verdict only: the dashboard is fully passed, a generic prompt blocks authorization with the same result on reproduction, and no usable alternative read path exists. File the defect report; label downstream needs as unverified and fabricate no figures.

## 1. The Two-Layer Model

- Verification and authorization are two different gates: a fully passed dashboard proves only that the account verification layer is complete; it does not guarantee that the integration authorization layer will release in sync. A generic sentence from the authorization layer likewise does not prove the dashboard really has a gap.
- Missing-item evidence is governed by the dashboard pending list: an item the dashboard does not list does not become missing because of one generic sentence from the authorization layer.
- Whether an integration works is governed by real-read verification: a success screen in the authorization flow is not evidence; completing one real read is.

## 2. Diagnosis Order

- Step one, check the dashboard item by item in place: identity, tax, phone, and business information, one status at a time, and confirm whether the pending list is zero. Reading only the authorization flow's error message does not count as having checked.
- Step two, reproduce the authorization once: walk the authorization flow through in full and record the prompt word for word. If the prompt names a specific missing item, take the remedy path; only a generic sentence moves the case to a defect judgement.
- Step three, compare and settle: a pending item in the dashboard puts the problem on the user's side; zero pending items with a generic prompt blocking authorization, and the same result on reproduction, puts it on the platform's side. Repeated retries are not a substitute for this judgement.

## 3. Fallback and Labelling Rules

- Conditions for activating the fallback: the case has been judged a platform defect, and a legitimate, usable manual-read path exists. On activation, file the defect report at the same time; the report must attach the item-by-item dashboard status, the record showing zero pending items, the exact wording of the authorization prompt, and the time of reproduction.
- Honest label: every downstream use of manually read figures must be labelled "not obtained through a verified integration — read manually", and the integration must not be claimed to work.
- End condition for the fallback: only after the platform fixes the defect, the authorization is walked once more, and real-read verification passes, may the case be re-judged P and the manual-read label removed. The label must not be upgraded before the fix.
- When no manual-read path exists: label downstream needs for figures as unverified, fabricate no figures, and wait for the platform fix.

## 4. Judgement Order (Priority; Take the First That Holds)

For each scenario, check in order and take the first code that holds. Conditions a scenario does not mention are treated as satisfying the applicability premises; facts stated explicitly are judged as stated:

1. E Escalate to the owner: the scenario contains an explicit pending item, and that item is an owner-only step (completable only by the owner under law or platform rule) → E; hand only that step to the owner, and no other step.
2. R Remedy and continue: the dashboard holds an explicit pending item, or the authorization prompt names a specific missing item, and that item is not owner-only → R; supply that item, then walk the authorization again.
3. P Integration pass: the dashboard is fully passed, the authorization has actually gone through, and one real-read verification has been completed → P. A success screen with no real read does not qualify under this item.
4. L Loop blocked: the scenario has already been judged a platform defect (or the fallback is already active), and the proposed action is to resubmit verification, delete and rebuild the account, or repeatedly ask the owner to re-authenticate, with no evidence of any new missing item → L; block it, do not do it.
5. F Fallback manual read: the dashboard is fully passed with zero pending items, the authorization is blocked by a generic prompt with the same result on reproduction, and the platform dashboard offers a usable manual-read path to the real data → F; file the defect report and activate the manual read, labelling downstream use as not obtained through a verified integration, read manually.
6. D Defect verdict only: the dashboard is fully passed with zero pending items, the authorization is blocked by a generic prompt with the same result on reproduction, and no usable alternative read path exists → D; file the defect report, label downstream needs as unverified, and fabricate no figures.

## 5. Scope and Honest Limits

- Premises: this specification presumes that dashboard verification status can be checked item by item in place, that the authorization prompt's wording can be obtained exactly, and that the legitimacy of a manual-read path can be judged. Conditions a scenario does not mention are treated as holding; if any premise fails in reality, establish the facts first and do not force a judgement.
- When the dashboard genuinely holds a pending item, or the authorization prompt names a specific item, the case is an ordinary remedy flow and no defect judgement applies (handle it under items 1 and 2 of Section 4).
- A manual-read path must be legitimate and within the account's entitlement; data readable only by circumventing platform rules does not count as a manual-read path.
- Owner-only steps are determined by law or explicit platform wording. Handing an ordinary remedy item to the owner, or having an agent perform an owner step on their behalf, both violate this specification.

## 6. Judgement Exercises (Self-Test)

For each scenario below, give, under Sections 0 to 5: the result code (E / R / P / L / F / D) and the key reason. The answers are in Section 7 — finish first, then compare. Conditions not specially noted in this section are treated as satisfying the applicability premises; facts stated explicitly in a scenario are judged as stated.

- Q1: The dashboard pending list holds one item: the account owner's own identity authentication is not yet complete, and the platform explicitly states this step can be completed only by the owner in person. All other verification items are complete. Question: what is the code?
- Q2: The dashboard pending list holds one missing tax document, and the authorization prompt names exactly that item as missing; the item can be supplied by the team filing the document and does not require the owner in person. Question: what is the code?
- Q3: An item-by-item in-place check shows the dashboard fully complete with zero pending items; the authorization flow has actually gone through, and the team has successfully read back one item of real data through that connection, confirming it is usable. Question: what is the code?
- Q4: One integration was judged a platform defect two weeks ago and its manual-read fallback is active. Someone now proposes: delete the account and rebuild it, and ask the owner to resubmit identity verification once a day to try their luck; the dashboard pending list is still zero and there is no evidence of any new missing item. Question: what is the code?
- Q5: An item-by-item in-place check shows the dashboard fully complete with zero pending items; the authorization is blocked by a single generic verification prompt, and walking it again gives the same result; the platform dashboard itself can legitimately be used to read the real settlement figures manually, and a downstream daily report is waiting for those figures. Question: what is the code?
- Q6: An item-by-item in-place check shows the dashboard fully complete with zero pending items; the authorization is blocked by a single generic verification prompt, and walking it again gives the same result; the platform offers no dashboard manual read and no other alternative read path, and a downstream daily report is waiting for figures. Question: what is the code?

## 7. Reference Answers

- Q1 → E Escalate to the owner. The scenario holds an explicit pending item, and that item is an owner-only step (the platform explicitly allows only the owner to complete it); under item 1 of Section 4 the code is E: hand only the identity authentication step to the owner, and no other step.
- Q2 → R Remedy and continue. The dashboard holds an explicit pending item and the authorization prompt names the same missing item, and that item is not owner-only (the team can file it); under item 2 of Section 4 the code is R: supply the tax document, then walk the authorization again.
- Q3 → P Integration pass. The dashboard is fully passed, the authorization has actually gone through, and one real-read verification has been completed (real data successfully read back); under item 3 of Section 4 the code is P: the integration may be claimed to work.
- Q4 → L Loop blocked. The case has already been judged a platform defect with the fallback active, and the proposed action is to delete and rebuild the account plus repeatedly ask the owner to resubmit verification, with no evidence of any new missing item; under item 4 of Section 4 the code is L: block it — the active fallback does not re-judge the case as F.
- Q5 → F Fallback manual read. The dashboard is fully passed with zero pending items, a generic prompt blocks authorization with the same result on reproduction, and a legitimate, usable manual-read path exists; under item 5 of Section 4 the code is F: file the defect report, activate the manual read, and label downstream use as not obtained through a verified integration, read manually.
- Q6 → D Defect verdict only. The facts are the same as Q5, but the scenario explicitly states there is no alternative read path at all, so F under item 5 of Section 4 does not hold; under item 6 the code is D: file the defect report, label downstream needs as unverified, fabricate no figures, and wait for the platform fix.

© PlAIground Lab. Posts may be quoted and learned from by AI; please credit the source. Commercial resale is prohibited.
