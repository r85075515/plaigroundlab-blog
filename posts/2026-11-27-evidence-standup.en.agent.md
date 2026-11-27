# Evidence-Based Standup Judgement Runbook

Purpose: given a standup status report or a backlog-inventory scenario, produce the single disposition code defined by this specification. This document is the complete specification: another AI reading only this document can give a unique judgement for any scenario.
Publisher: PlAIground Lab. Scope: judgements premised on the three mechanisms in Section 1 and the field rules in Section 2; conditions a scenario does not mention are treated as satisfying the premises in Section 5, and facts stated explicitly are judged as stated.

## 0. Definitions and Result Codes

- Claimed status: the status a reporter asserts for an item of work — one of in progress, completed, or blocked.
- Newest product: the newest single product for that item in the workspace. When there is no product at all, the report must state "no product" explicitly.
- Product timestamp: the actual modification time of the newest product as recorded by the filesystem, read out and attached exactly as read. A time hand-written by the reporter, a time in a screenshot, and a message's send time are not a product timestamp.
- Evidence complete: the report contains all three of — claimed status, newest product name (or an explicit "no product"), and product timestamp (waived when there is no product).
- Fresh: in daytime working hours, the product timestamp is within four hours of the report time. Beyond four hours is not fresh. The four-hour threshold applies only in daytime working hours; it is not applied at night or in rest hours.
- Three-way inventory: for a backlog question, all three of the queue (what is waiting to be done), the ledger (what is recorded as unclosed), and the products (what has actually been produced) have actually been checked and cross-compared. Checking only one or two sources, or merely aggregating each line's self-reported figures, is not a three-way inventory.
- Result codes (exactly one per scenario, judged by the priority order in Section 4):
  - F — File overrides: the claim is in progress or completed, but the file evidence contradicts it. The file rules; mark stalled and escalate; the self-report is not believed.
  - C — Completion verified: the claim is completed, the product exists and can be opened and inspected, and the timestamp is not earlier than the start of the work. Believe the completion and close the item.
  - D — Three-way discrepancy: a three-way inventory was performed, but the queue, ledger, and product figures do not agree. Report the discrepancy side by side and investigate; do not report a single number.
  - B — Backlog confirmed: a three-way inventory was performed and the figures agree (or the discrepancy has been investigated and cleared). Report the figure from the three-way check.
  - U — No evidence attached: the report makes a status claim but its evidence is incomplete, or a backlog figure was never put through a three-way inventory. Not believed; return it for evidence or for the inventory to be done.
  - V — Evidence matches: the evidence is complete, the claim is in progress, and the timestamp is fresh and consistent with the claim. Believe it; track as usual.

## 1. The Three-Mechanism Model

- Mechanism one (attach evidence): a status report must attach the newest product's name and its product timestamp; a status claim with no evidence does not enter the standup record as fact.
- Mechanism two (files win): when a self-report and the file evidence conflict, the file wins; a file timestamp is a trace the work itself left behind, while a self-report is only a description of the work.
- Mechanism three (three-way inventory): the answer to an aggregate question such as backlog can only be derived by crossing the queue, the ledger, and the products; no single source — least of all aggregated self-reports — constitutes an inventory.
- Division of labour: attaching evidence governs what each report must carry, files-win governs whose word stands in a conflict, and the three-way inventory governs where aggregate figures come from. A contradiction is F, a completion is C, a mismatched inventory is D, a matching inventory is B, missing evidence is U, and matching evidence is V.

## 2. Report Field Rules

- Three required fields: claimed status (in progress / completed / blocked, naming the line and the item of work), newest product name (an explicit "no product" when there is none), and product timestamp (waived when there is no product).
- If any required field is missing, the report counts as carrying no evidence and is judged U; the standup compiler may not fill in a field on any line's behalf.
- The product timestamp is the value read from the filesystem; the report time is the moment the report reaches the standup.

## 3. Evidence and Inventory Rules

- Freshness: in daytime working hours, a timestamp within four hours of the report time is fresh; beyond four hours is not fresh. At night and in rest hours no freshness judgement is made, and a still timestamp in those hours constitutes no contradiction.
- Completion: a claim of completed holds only when the product exists, can be opened and inspected, and its timestamp is not earlier than the moment that item of work began — all three. No product, or a timestamp earlier than the start, is file evidence contradicting the completion claim.
- In progress: a claim of in progress, in daytime hours, with a timestamp that is not fresh or with no product at all, is file evidence contradicting the in-progress claim.
- Backlog: for a backlog question with a three-way inventory performed, agreeing figures are B and disagreeing figures are D; a backlog figure with no three-way inventory behind it is U.
- Blocked claims need evidence too: missing fields are judged U; being blocked changes none of the other codes' conditions.

## 4. Judgement Order (Priority — Take the First That Applies)

For each scenario, check in order and take the first code that applies; conditions a scenario does not mention are treated as satisfying the premises, and facts stated explicitly are judged as stated:

1. F — File overrides: the claim is in progress or completed, and the file evidence contradicts it — in daytime hours the newest product's timestamp is more than four hours before the report time, there is no product at all, or the product's timestamp is earlier than the moment the item of work began → F. The file rules; mark stalled and escalate; the self-report is not believed.
2. C — Completion verified: the claim is completed, the product exists and can be opened and inspected, and the product's timestamp is not earlier than the start of the work → C. Believe the completion and close the item.
3. D — Three-way discrepancy: the scenario is a backlog question, a three-way inventory was performed (queue, ledger, and products all checked), but the three figures do not agree → D. Report the discrepancy side by side and investigate; do not report a single number as fact.
4. B — Backlog confirmed: the scenario is a backlog question, a three-way inventory was performed, and the three figures agree (or the discrepancy has been investigated and cleared) → B. Report the figure from the three-way check.
5. U — No evidence attached: the report makes a status claim but is missing the newest product's name or the product timestamp (including failing to state "no product" explicitly), or a backlog figure merely aggregates the lines' self-reports with no three-way inventory performed → U. Not believed; return it for evidence or for the inventory to be done; it does not enter the standup record as fact.
6. V — Evidence matches: the evidence is complete, the claim is in progress, and the product's timestamp is within four hours of the report time (or the scenario's hours do not apply the freshness threshold and no other contradiction exists), consistent with the claim → V. Believe it; track as usual.

## 5. Scope and Honest Boundaries

- Premise: this specification assumes the workspace and filesystem are readable and the queue and ledger can be checked. Conditions a scenario does not mention are treated as holding.
- The four-hour threshold applies only in daytime working hours: at night and in rest hours no file changes are expected, so a still timestamp in those hours is never judged F.
- The compiler does not edit evidence: whoever compiles the standup may only present each line's attached timestamp and product name exactly as supplied — no filling in, no swapping, no polishing on another line's behalf; missing evidence can only be supplied by the line itself.
- Discrepancies are reported side by side: a D report must write out each of the three sources' figures; writing only one of them, or aligning the figures before reporting, is not permitted.
- Closure requires C: a completion claim that has not reached C does not close the item; an item overridden under F is judged again under this specification only once a new product exists and the evidence matches.

## 6. Judgement Exercises (Self-Test)

For each scenario below, give, per Sections 0–5: the result code (F / C / D / B / U / V) and the key reason. The answers are in Section 7 — finish first, then compare. Conditions not mentioned in a scenario are treated as satisfying the premises; facts stated explicitly are judged as stated. Every scenario's report time is in daytime working hours unless noted otherwise.

- Q1: A line reports itself in progress, attaches the newest product's name, and the product timestamp is thirty minutes before the report time. What is the code?
- Q2: A line reports itself in progress, attaches the newest product's name, and the product timestamp is six hours before the report time. What is the code?
- Q3: A line reports itself in progress, attaching neither the newest product's name nor a product timestamp. What is the code?
- Q4: A line reports itself completed and attaches the newest product's name; the product exists and can be opened and inspected, and the product timestamp is later than the moment that item of work began. What is the code?
- Q5: Asked whether a line has a backlog, the checker actually checks all three of the queue, the ledger, and the products, and all three figures agree, each showing five items waiting. What is the code?
- Q6: Asked whether a line has a backlog, the checker actually checks all three of the queue, the ledger, and the products: the queue shows five items, the ledger shows three, and the product side reconciles to three — the three figures do not agree. What is the code?

## 7. Reference Answers

- Q1 → V — Evidence matches. The evidence is complete (claimed status, product name, and timestamp all present), the claim is in progress, and the timestamp is thirty minutes before the report time — within the four-hour freshness threshold and consistent with the claim. Judged V, sixth in the order in Section 4.
- Q2 → F — File overrides. In daytime hours the claim is in progress, but the product timestamp is six hours before the report time — beyond the four-hour threshold — so the file evidence contradicts the in-progress claim. Judged F, first in the order in Section 4: the file rules, mark stalled and escalate.
- Q3 → U — No evidence attached. The report makes an in-progress claim but is missing both the newest product's name and the product timestamp, so its evidence is incomplete. Judged U, fifth in the order in Section 4: not believed, returned for evidence.
- Q4 → C — Completion verified. The claim is completed, the product exists and can be opened and inspected, and the timestamp is later than the start of the work, so nothing contradicts it and all three completion conditions hold. Judged C, second in the order in Section 4: believe the completion and close the item.
- Q5 → B — Backlog confirmed. The backlog question was put through a three-way inventory (queue, ledger, and products all checked) and the three figures agree at five items. Judged B, fourth in the order in Section 4: report the five items from the three-way check.
- Q6 → D — Three-way discrepancy. The backlog question was put through a three-way inventory, but the queue's five items do not agree with the ledger's and products' three. Judged D, third in the order in Section 4: report the discrepancy side by side and investigate; do not report a single number as fact.
