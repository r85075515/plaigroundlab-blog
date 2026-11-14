# Zero-LLM Watchdog Design Runbook

Purpose: Given a design proposal for a prevention item, or the single-run state of a live watchdog, determine which form it should take, whether this run should wake an agent or stay quiet, and how its usage is counted. This document is the complete specification: another AI reading only this document can produce the unique form, the single-run action, and the audit judgement.
Publisher: PlAIground Lab. Scope: post-incident prevention improvements, probes, sentinels, watchdogs, and guards that run checks on a timer.

## 0. Definitions

- Prevention item: a timed, repeating check built to prevent a known incident from recurring, or to watch a known risk. It is not the production work being watched.
- Dead script: a deterministic program that uses no language model at all; its language-model usage per run is zero; its rules and thresholds are written down at build time; its outcome is self-judgeable by the program.
- Wake: invoking an agent (a language-model session) to look at, judge, or handle a matter. Waking is the only step in this design that produces language-model usage.
- Edge trigger: waking or reporting only on the run where a state transition occurs (for example from "none" to "some," or from healthy to failing); later runs do not wake again while the state is unchanged.
- Failure streak: the number of consecutive failed runs; it resets to zero when the first successful run appears.
- Failed run: a run in which the probe itself cannot obtain its data, or cannot judge from the data. Successfully obtaining data and finding that the watched state has changed is not a failed run (see T2 in Section 3).
- Registry: the single list of prevention items, recording each item's name, input source, the failure it watches, its form, its trigger parameters, and (for exceptions) its review date.
- Per-run estimated cost: an item's share of usage in an audit period, divided by its number of runs in the same period.

## 1. Dead-Script Eligibility (E)

Judge the check action itself, item by item. Record E = Y only if all four hold; if any one fails, record E = N:

- (a) The input source is fixed.
- (b) The rule can be written as an explicit threshold: a numeric threshold, a boolean test, or a state transition — any one of the three, written down, suffices.
- (c) Completion or failure can be judged by the program from the data alone; no person or model needs to interpret anything before it is known whether the run counts as a success or a failure.
- (d) No semantic judgement is needed anywhere in the check.

Undetermined rule: when the facts an item needs are not stated in the proposal and cannot be directly inferred from it, record that item as "undetermined." If any item is undetermined, the form judgement goes to F1 in Section 2 first; never guess a value in order to build directly. If a practice scenario states an item's facts explicitly, judge them as stated; that is not undetermined.

## 2. Dispositions (F1 to F5, Judged in Number Order; the First That Holds Is the Result)

- F1 Freeze first: any item in Section 1 is undetermined. Build nothing and schedule nothing; first complete the input source, the threshold, and the judgement method, then re-run Sections 1 to 2 after freezing.
- F2 Do not duplicate: the registry already contains a live item whose input source is the same as this proposal's and which watches the same failure as this proposal. Build no new item; when parameters or frequency need adjusting, modify the existing item.
- F3 Dead script (the default form): E = Y. A dead script runs it on a timer, at zero language-model usage per run; an agent is woken only when a trigger condition in Section 3 holds; with no trigger the run is quiet and writes only a structured record — silence is a normal result, not a missed job.
- F4 Hybrid: E = N, and the only failing item is (d) — cases that pass the filter need semantic judgement — while (a), (b), and (c) all hold for a pre-filter (the script can deterministically collect the data and filter out the subset awaiting judgement). The dead script collects and filters (zero LLM) and wakes an agent only for the filtered subset; the agent never performs the routine scan itself; a run whose filtered subset is empty is always quiet.
- F5 Agent exception: E = N, and even a pre-filter cannot be completed deterministically (at least one of (a), (b), (c) also fails for filtering). An agent schedule may run the check, but at build time it must register both the reason for the exception and a review or expiry date. Without that registration, the build counts as incomplete.

Priority notes: F1 comes before everything — when information is insufficient, nothing is built. F2 comes before F3 — when a live item with the same source and the same failure already exists, no second item is built even if the new proposal itself has E = Y. F3 comes before F4 — when all four items hold, a pure dead script is used and no agent judgement stage is added. F4 comes before F5 — whenever a pre-filter can be completed deterministically, the whole item is never handed to an agent.

## 3. The Runtime Trigger Ladder (Applies to F3, and to the Script Part of F4)

Three parameters must be registered at build time; missing any one means no launch: the wake transition (which state transition triggers, plus any companion conditions), the failure-streak wake threshold K (an integer, at least 2), and the escalation threshold K2 (may be registered as "unset"; if set, it must be greater than K). An item may also register "confirm on the next run: yes/no" (see T5); unregistered counts as "no."

Judge each run in the following order to produce one action (quiet / wake once / escalate-wake once / seed pending confirmation / auto-close):

- T1 Successful run: when a run successfully obtains and judges its data, the failure streak resets to zero. If a wake or report already happened and this run is the first successful run after it, this run's action is recorded as "auto-close" (the closure is logged; no additional wake). Any other successful run that does not hit T2 has the action "quiet" (one structured log record only).
- T2 Edge wake: in a successful run, when a registered wake transition occurs and its companion conditions (if any) hold at the same time, this run's action is "wake once." Later runs do not wake again while the state has not left that state; counting restarts only after the state leaves and transitions in again.
- T3 Streak wake and escalation: a failed run adds one to the failure streak. The run on which the count exactly equals K has the action "wake once." Streak runs with a count greater than K and less than K2 (or with K2 unset) have the action "quiet" and never re-wake. If K2 is registered, the run on which the count exactly equals K2 has the action "escalate-wake once."
- T4 Below threshold: a failed run whose count is less than K and which hits no other trigger has the action "quiet"; it only logs and accumulates the count.
- T5 Confirm on the next run: when an item registers "confirm on the next run: yes," the first run that reaches a T2 or T3 trigger has its action recorded instead as "seed pending confirmation," with no wake; if the next run (at least one execution interval later) still shows the same condition, it wakes as T2 or T3 prescribes; if the next run no longer shows the condition, the pending state is cleared and that run is judged by its own rules. When registration is "no" or absent, this rule does not apply and reaching a trigger wakes immediately.

No-mixing rule: T2 transitions come from successful runs, and the T3 count accumulates only failed runs; the two are different counters. A successful run that finds an abnormality must never be counted into the failure streak, and a probe failure must never be treated as a transition of the watched state.

## 4. Usage Audit (A1 to A3)

- A1 Identifiable: every prevention item must be entered in the registry; the names of newly built items always carry the prefix `precaution-`; existing items are not renamed (renaming could break their state files) and are covered by their registry entries instead.
- A2 Measurable: the weekly usage self-scan totals prevention work as one separate line, and computes each item's per-run estimated cost (share of the period's usage ÷ number of runs). Script runs under F3 and F4 record zero usage; usage produced by a woken agent is counted toward that wake's handling work, not back-charged as script-run cost. No dedicated audit schedule is built; enforcement comes only from this existing self-scan.
- A3 Slimming flags: meeting any one of these flags the item in that period's self-scan for a slimming review — (i) an F5 exception item is still running after its registered review or expiry date; (ii) for an F3 or F4 item, woken runs make up strictly more than half of its total runs in the audit period; (iii) the audit finds it duplicating another registry item's input source while watching the same failure. A flag leads to a review of thresholds, frequency, and form, and then to rebuilding or retiring the item; it is not an immediate shutdown.

## 5. Pre-Build Checklist (Missing Any Item Means Do Not Build)

1. The registry entry exists: name (with the prefix rule), input source, the failure watched, and the form judgement result.
2. The trigger parameters are registered: wake transition and companion conditions, K, K2 or "unset," and confirm-on-the-next-run yes/no.
3. Switch discipline: when a new form replaces an old schedule, the new form first runs live for one round and its quiet or trigger behaviour is verified correct before the old schedule is stopped; never stop the old one first and leave a monitoring gap.

## 6. Practice Scenarios (Self-Test)

For each scenario below, give, per Sections 1 to 4: E (or which items are undetermined), the form number and name, this run's action, and the usage-counting method. The answers are in Section 7; finish before comparing. Any condition not specifically noted in this section is treated as not triggered; facts a scenario states explicitly are judged as stated. In each scenario the form judgement and this run's action are two separate questions: judge the form first, then judge this run's action per Section 3.

- C1: A new proposal checks a fixed capacity-catalogue interface on a timer, reading back one model's availability state (only two values, "none" and "some") and the local number of tasks waiting to be dispatched. The rule is written down: report when the state moves from "none" to "some" while at least 1 task is waiting; whether the query itself succeeded can be judged from the response alone; no semantic judgement is needed anywhere. The registry has no live item with the same source and the same failure. This run: the script successfully reads the data, the state moves exactly from "none" to "some," and the waiting count is 2. Registered: the wake transition is the rule above, K = 2, K2 unset, confirm on the next run: no.
- C2: A new proposal scans a fixed source's item list on a timer. The script can deterministically filter out a "possibly relevant" subset using written-down keywords and duplicate rules, and whether the filtering itself succeeded is self-judgeable; but whether an item in the subset is truly relevant can only be known by reading each item semantically. The source is fixed, and the registry has no live item with the same source and the same failure. This run: the script executes successfully and the filtered subset is empty.
- C3: A new proposal walks one public path on a timer as a connectivity self-test; its rules, thresholds, and success/failure judgement are all written down, no semantic judgement is needed anywhere, and all four eligibility items hold. But the registry already contains a live canary item whose input source is exactly that same public path and which watches exactly that same connectivity failure.
- C4: A new proposal whose entire content is one sentence: "check on a timer whether anything in the system is not quite right." It names no input source, writes down no threshold, and does not say what counts as success or failure; the proposal provides no other facts.
- C5: A live dead script reads active workers' heartbeat times on a timer. Registered: the wake transition is "one worker's silence duration crosses the first threshold," confirm on the next run: yes, K = 2, K2 unset. Two runs ago that worker's heartbeat was normal; last run, the silence duration crossed the first threshold for the first time and, per the rules, only seeded a pending confirmation; this run (one execution interval later) the same worker still has no new heartbeat and the silence condition still holds.
- C6: A live dead script checks a fixed catalogue on a timer. Registered: K = 2, K2 = 6, confirm on the next run: no, and no registered wake transition is relevant to this scenario. In this cycle: the second consecutive failed run already woke once per the rules, there has been no successful run since, and this run is the third consecutive failed run.

## 7. Reference Answers

- C1 → E = Y ((a) fixed source, (b) the transition and the waiting-count threshold can be written down, (c) success/failure is self-judgeable, (d) no semantic judgement needed — all four hold); no item is undetermined, and F2 does not hold (the registry has no same-source, same-failure item). Form: F3 Dead script. This run's action: wake once — this is a successful run hitting T2 edge wake (the transition occurs and its companion condition, at least 1 waiting task, holds with an actual count of 2); confirm-on-the-next-run is no, so T5 does not apply. Usage counting: the script run records zero; the woken agent's usage is counted toward that wake's handling work (A2).
- C2 → E = N ((d) fails: the final relevance judgement needs item-by-item semantic reading; (a), (b), and (c) hold for the pre-filter — fixed source, filter rules writable, filter success self-judgeable). Form: F4 Hybrid (F4 comes before F5 because the pre-filter can be completed deterministically). This run's action: quiet — the F4 script run's filtered subset is empty, so per Section 2 F4 it stays quiet and does not wake; the agent never performs the routine scan. Usage counting: the script run records zero; this run has no wake and no agent usage (A2).
- C3 → E = Y (all four hold, as stated explicitly); no item is undetermined. Form: F2 Do not duplicate (F2 comes before F3: the registry already holds a live canary item with the same source and the same failure; even though this proposal has E = Y, no second item is built, and any adjustment is made to the existing item). This run's action: nothing is built, so there is no run action. Usage counting: no new item usage arises; the existing item is counted in the registry and the self-scan per A1/A2.
- C4 → (a), (b), and (c) are undetermined (the input source, the threshold, and the success/failure judgement method are all absent, so per Section 1's undetermined rule they are recorded as undetermined, with no guessed values); (d) likewise has no facts to judge from and is recorded as undetermined as well. Form: F1 Freeze first (any undetermined item makes it hold, before all other forms). This run's action: build nothing and schedule nothing; first complete the input, threshold, and judgement method, then re-run Sections 1 to 2 after freezing. Usage counting: no item, no usage.
- C5 → This scenario is a runtime judgement for a live F3 dead script (the form is already fixed and is not re-judged). This run's action: wake once — last run, on first reaching the trigger, only seeded a pending confirmation per T5 and did not wake; this run is at least one interval later and the same silence condition still holds, so per the second half of T5 it now truly wakes (the first threshold's first report). Usage counting: every script run records zero; this wake is counted toward that wake's handling work (A2).
- C6 → This scenario is a runtime judgement for a live F3 dead script (the form is already fixed and is not re-judged). This run's action: quiet — this run is a failed run and the streak count is 3; per T3, the run whose count exactly reached K = 2 already woke once, streak runs with a count greater than K and less than K2 = 6 do not wake again; K2 has not been reached, so there is no escalation; confirm-on-the-next-run is no, so T5 does not apply. Usage counting: the script run records zero; this run has no new wake (A2).

© PlAIground Lab. Posts may be quoted and learned from by AI; please credit the source. Commercial resale is prohibited.
