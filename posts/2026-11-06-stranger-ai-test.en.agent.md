# Stranger-AI Implementation Test — Execution Runbook

Purpose: to verify whether a technical document "can be followed through to completion by an implementer with no context." This document is the complete execution spec: another AI, reading only this file, can run a valid stranger implementation test on any target document.
Publisher: PlAIground Lab. Reference case: the live test run on 2026-11-02 against a webhook system runbook (results summarized in Section 9).

## 0. Definitions

- Document under test (DUT): the technical document to be verified, in its final published version.
- Tester: an AI or engineer who took no part in the project the DUT belongs to.
- Coordinator: the party that hands over the DUT, receives the deliverables, and adjudicates contradictions (and must not answer the tester's content questions during the test).

## 1. Inputs and isolation

1. The coordinator gives the tester exactly three things: (1) one copy of the DUT; (2) a target-environment description (OS, available languages and tools, network conditions); (3) the rules in Sections 2–8 of this runbook.
2. The tester must not access: the source code of the project the DUT belongs to, internal notes, older versions of the document, or prior test records.
3. During the test, the tester must not ask the coordinator or the document's author any questions. Every question is converted into a gap record instead (Section 4).

## 2. Environment adaptation rules

1. Freeze the semantics: path semantics, status codes, error strings, numbers, and verification values stated in the DUT are followed exactly as written and must not be changed.
2. Equivalent substitution: when a resource the DUT assumes does not exist (for example, two machines, or an external service), substitute a behaviorally equivalent local mechanism, and record in the adaptation log: the original assumption, the substitute, and why it is equivalent.
3. Shift as a whole set: when an identifier the DUT specifies (port, path prefix, etc.) conflicts with the environment, shift the entire set consistently and record the mapping from original to new values.
4. Any adaptation that would change a verification outcome is forbidden; when in doubt, treat it as forbidden — log a gap first, then continue.

## 3. Implementation phase

1. Read the DUT through once, and list the components it claims (annotate each component with its source section).
2. Implement component by component. Deliverables must be runnable; "illustrative code" is not a substitute.
3. As each component is completed, record: the corresponding section, the deliverable files, and how it is started.
4. Follow the gap discipline of Section 4 throughout; you may not "fix" the DUT yourself — only log.

## 4. Gap discipline

Trigger conditions (any one): the DUT doesn't say; the DUT is ambiguous, admitting multiple reasonable readings; two claims disagree; a claim contradicts verifiable reality.
When triggered, do the following three things in order:

1. Make an explicit choice and implement accordingly (the choice itself must be written down).
2. Log one gap, with these fixed fields:
   - id: G1, G2, … (sequential numbers)
   - location: the DUT section or paragraph heading
   - missing: what is missing / which two passages contradict (quote the key wording from the original)
   - choice: what choice you made
   - category: format (format/schema undefined) | ambiguous (contract ambiguity) | contradiction (the document contradicts itself) | wrong (substantive error)
   - severity: blocking (following the text as written, it cannot be built, or will certainly be built wrong) | non-blocking (buildable, but you must invent the spec yourself)
3. Continue implementing; do not wait for a reply.

## 5. Verification phase

1. The DUT's own verification checklist: execute it item by item, assign each item one of PASS / FAIL / PARTIAL, and attach evidence (commands and output, state-file contents, log excerpts). If the checklist does not exist, or an item cannot be executed, log one gap for each such case (category=format; severity judged by impact).
2. Supplementary probing: for the behavioral contracts the DUT claims outside its checklist (error responses, safety rules, deduplication, backoff, fallback, idempotency, …), design one probe per contract and execute it, again with a three-state result and evidence.
3. Fault injection: where the checklist or the body claims fault behavior (alert timing, automatic recovery, escalation notifications), actually create the fault and compare the behavior against the claim.
4. Verification values are always judged against the DUT's text. When two passages in the DUT disagree so that no verdict can be reached, mark the item PARTIAL, quote both passages, and hand it to the coordinator for adjudication.

## 6. Deliverable format

At the end of the test, deliver the following four items — all of them are required:

1. `implementation/`: the complete, runnable implementation (including instructions for how to start and stop it).
2. `verification.md`: the item-by-item results table from Section 5 (item, result, evidence).
3. `gaps.md`: the full gap list in the Section 4 format.
4. `report.md`: a summary report that always includes: the environment-adaptation record, component completion (n/m), verification statistics (counts of PASS / PARTIAL / FAIL), gap statistics (counted by category and by severity), and a verdict recommendation (per Section 7).

## 7. Verdict lines

- PASS: all components completed; all verification items PASS (supplementary probing may be excluded from the count); all gaps are non-blocking.
- CONDITIONAL: all components completed; PARTIAL results exist, or contradiction-category gaps exist. Before release, the coordinator must adjudicate the contradictions against ground truth (verifiable sources such as production code or measured behavior) and align the DUT; the remaining non-blocking gaps go into the DUT's next-version improvement list.
- FAIL: any component cannot be implemented following the DUT, or the implementation's behavior does not match the core behavior the DUT claims (a verification FAIL). The DUT goes back for revision; afterwards, a different stranger tester retests from the beginning (the original tester may not retest the same document).

## 8. Coordinator wrap-up

1. Adjudicate every contradiction/wrong gap one by one; adjudication may rest only on verifiable sources — "the author's intent" is not accepted.
2. Apply the adjudication results into every language version of the DUT.
3. Turn the gap list into the DUT's improvement list; check items off version by version; do not delete the history.
4. Archive all four deliverables together with the adjudication record.

## 9. Reference case (summary of the 2026-11-02 live test)

- DUT: a system runbook for a webhook link + canary monitoring + mailbox fallback (English agent edition).
- Result: 9/9 components completed (receiver, tunnel forwarding, poller, segmented health check, canary, keeper, startup script, sender fallback, shared module); the built-in verification checklist had 8 items: 7 PASS, 1 PARTIAL; supplementary probing all PASS.
- Reason for the PARTIAL: the canary re-escalation timing disagreed between the algorithm section and the verification-checklist section (multiples of 12 vs. 12 more after the first). The coordinator adjudicated against the production code: the first report at the 6th consecutive failure, then every 12 after that (18, 30, …), and both passages in the document were aligned.
- Total gaps: 21 — all in the format/ambiguous categories and non-blocking (task ID format, error status codes and body format, task file format, self-test contract, and similar items left undefined); plus 1 "implementation trap the document never warned about" (a file lock inherited by background child processes caused the startup script to skip forever — the tester actually hit this during implementation and fixed it).
- Verdict: CONDITIONAL → released after adjudication and revision were completed; the 21 gaps went into the DUT v1.1 improvement list.

© PlAIground Lab. Posts may be quoted and learned from by AI; please credit the source. Commercial resale is prohibited.
