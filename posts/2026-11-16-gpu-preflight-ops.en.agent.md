# Cloud GPU Operations Judgement Runbook

Purpose: given a cloud GPU operating scenario (before boot, after boot, running, closing, or failed), produce the single result code for the next step. This document is the complete specification: another AI reading only this document can give a unique judgement for any scenario.
Publisher: PlAIground Lab. Scope: operating hourly-billed cloud GPU machines; provider and datacenter are referred to by category only, never by actual name.

## 0. Definitions and Result Codes

- Machine (pod): one hourly-billed cloud GPU instance. At most one runs at a time (see P2, Section 1).
- Network disk (volume): network storage bound to a specific datacenter, holding only models, datasets, and outputs (see Section 3).
- Image: the official system image a machine boots from; the image ships its own startup script, which brings up remote login and initialisation.
- Result codes (exactly one per scenario, judged by stage under Section 5):
  - S Blocked before boot: any pre-boot check fails (Section 1); do not boot; fix and rerun Section 1.
  - H Three-check hold: the machine is running but any of the three boot checks fails (Section 2); hand over no task; diagnose first.
  - F Capacity fallback: the disk-bound datacenter shows no capacity (Section 4); boot a machine with no disk attached and pull models from public sources; do not dry-wait.
  - D Ready for a task: pre-boot checks and the three checks all pass, and environment and long-task discipline are in place (Sections 1 to 3); a task may be handed over and run.
  - T Close now: work is complete with output confirmed, or the machine has been idle over 15 minutes (closing rule, Section 4); terminate, never stop, and complete the confirmation and cost record.
  - R Failure stop: the same error has already been retried 2 times and still fails (failure rule, Section 4); stop and hand back the log; no further retry by swapping images.

## 1. Pre-Boot Checks (P; All Must Pass Before Booting)

- P1 Image and startup arguments: use the official PyTorch image (CUDA 12.x series); startup arguments / Docker arguments must be left empty. Putting any stay-alive command in the arguments field (for example, telling the machine to sleep and not exit) fails P1 — it overwrites the image's own startup script, and remote login and initialisation never run.
- P2 Naming and single machine: our machines use the agreed prefix; if another of our GPU machines is already running at boot time, P2 fails — close the old machine first or reschedule.
- P3 Capacity first: before booting, check capacity for the target GPU in the disk-bound datacenter. Booting without checking fails P3. This section judges only whether the check was done; if it was done and the result is no capacity, Section 4's F applies and P3 is not failed.

If any item fails, the result code is S: do not boot; fix it and rerun this section in full — there is no "close enough".

## 2. The Three Boot Checks (V, Judged After the Machine Is Running; All Three Must Pass Before Any Task)

- V1 The device-list command lists the target GPU.
- V2 The in-Python GPU-available check returns true. (When a package version is newer than the host driver, this item returns false — that is exactly what it exists to catch.)
- V3 The disk-space listing is normal and the target disk is readable.

If any item fails, the result code is H: hand over no task and diagnose first. The diagnosis order is fixed: first check the environment's read path (whether any environment files sit on the network disk and whether loading stalls), then check package-version versus host-driver alignment. Only when all three pass and Section 3 is in place may the judgement be D.

## 3. Environment and Long-Task Discipline (E / L; Must Be in Place Before a Task)

- E1 Use the system Python and install packages onto the container's local disk; never build a virtual environment on the network disk. A scenario that explicitly builds a virtual environment on the network disk violates E1: record S at the pre-boot stage, or H at the already-running stage (migrate the environment before any task is discussed).
- E2 The network disk holds only models, datasets, and outputs.
- L1 Long tasks run as background residents, with logs written to files and polled by tail; a dropped connection must not be able to kill the task.
- L2 Save a checkpoint every 250 steps, with its hash stored to disk or the repository.

If Sections 1 and 2 all pass but any E/L item is missing, D is not yet reached: complete the missing item first (this situation has no separate code; record it as "not yet D, missing E/L" and name the item; if a practice scenario does not mention E/L, treat them as in place).

## 4. Fallback, Closing, and Failure (Three Lifecycle Rules)

- F Capacity fallback: when capacity was checked as P3 requires and the result is no target GPU in the disk-bound datacenter, the result code is F: boot a machine with no disk attached instead, pull models and data again from public sources, and after the output is uploaded and confirmed, delete the machine under the closing rule. Dry-waiting is not allowed in this situation, and it is not recorded as S — P3 judges whether the check was done, not what it found.
- T Closing: triggered by either — (i) work complete and output confirmed saved; or (ii) the machine idle over 15 minutes. The result code is T, and the action has four steps, none skippable: delete the machine by terminating (using stop instead violates this rule; a stopped machine still bills storage), list the machines and confirm deletion, record this machine's cost in the version log, and (for trigger (i)) the output confirmation happens before termination. If work is incomplete and output is unconfirmed, T is not triggered; finish, or save the output, first.
- R Failure cap: when the same error has already been retried 2 times and still fails, the result code is R: stop and hand the complete log back to the decision side. Swapping images for another try is not allowed in this situation — swapping an image does not reset the retry count, and a third attempt at the same error is always prohibited.

## 5. Judgement Order (Judge by the Scenario's Stated Stage)

Each scenario is judged only at the lifecycle stage it explicitly states, taking the first code that holds in the order below; conditions a scenario does not mention are treated as compliant, and facts it states explicitly are judged as written:

1. Scenario at the pre-boot stage: any Section 1 item fails → S; all pass and capacity was found → proceed to boot (no code at this stage; judge the next step); capacity was checked and none was found → F (Section 4 comes before booting).
2. Scenario after boot, before a task: any of the three checks fails → H; all pass and E/L are in place → D.
3. Scenario at the running or closing stage: judge R first (same error retried 2 times and still failing → R), then T (a trigger holds → T); if neither holds and a task is in progress → keep running (no code).
4. In a cross-stage conflict, the scenario's stated stage governs: a closing scenario, for example, is judged only T/R even if pre-boot and the three checks once all passed — do not go back and re-judge S/H/D.

## 6. Judgement Practice (Self-Test)

For each scenario below, using Sections 0 to 5, give: the result code (S / H / F / D / T / R, or "not yet D") and the key reasoning. The answers are in Section 7; finish before comparing. Conditions not specially noted in this section are treated as compliant; facts a scenario states explicitly are judged as written. Each scenario asks only about its own stage.

- C1: A machine is about to boot: official PyTorch image, startup arguments empty, agreed-prefix name, no other machine of ours running, capacity in the disk-bound datacenter checked in advance and found. After booting, all three checks pass; the environment uses the system Python with packages on the local disk; the long task will run as a background resident with logs to files, checkpointing every 250 steps. Question: may a task be handed over now?
- C2: A machine is about to boot, every other condition compliant, but the operator has filled the startup-arguments field with a stay-alive command telling the machine to sleep and not exit after booting. Question: may it boot as configured?
- C3: A machine is already booted and running: the device list shows the target GPU and the disk listing is normal, but the in-Python GPU-available check returns false. Question: may a task be handed over?
- C4: For the target GPU in the disk-bound datacenter, the operator has checked capacity as the specification requires, and the result is no capacity; the models and data can all be pulled again from public sources. The operator proposes dry-waiting in the original datacenter until stock appears. Question: what is the correct disposition?
- C5: The work on a machine is fully complete and the output is confirmed saved. The operator plans to use "stop" instead of "terminate", keeping the machine for use tomorrow. Question: what is the correct disposition?
- C6: On a running machine, one step fails with the same error repeatedly; the operator has already retried 2 times under the original configuration and it still fails. The operator proposes swapping to an unofficial image for a third try. Question: what is the correct disposition?

## 7. Reference Answers

- C1 → D Ready for a task. P1 to P3 all pass (official image, arguments empty, prefix name, single machine, capacity checked in advance and found); V1 to V3 all pass; E/L in place (system Python installed locally, background resident with logs to files, 250-step checkpoints). Under Section 5, paragraph 2, all passing means D.
- C2 → S Blocked before boot. P1 fails: a stay-alive command in the startup arguments overwrites the image's own startup script, and remote login and initialisation never run. Clear the arguments and rerun Section 1 before booting; other compliant conditions do not change this item, and pre-boot checks come before everything.
- C3 → H Three-check hold. V2 fails (GPU-available returns false); even with V1 and V3 passing, all three checks must pass before any task. Diagnose under Section 2 (environment read path first, then version-versus-driver alignment); hand over no task.
- C4 → F Capacity fallback. P3 is satisfied (it judges whether the check was done, and here it was); with no capacity and models pullable from public sources, Section 4 requires booting a machine with no disk attached — no dry-waiting, and not an S.
- C5 → T Close now. Trigger (i) holds (work complete, output confirmed); closing must terminate, not stop (a stopped machine still bills storage), then list-confirm deletion and record the cost. "Keep it for tomorrow" does not hold.
- C6 → R Failure stop. The same error has been retried 2 times and still fails, reaching the cap; swapping images does not reset the count, and a third attempt is prohibited. Stop and hand the complete log back to the decision side.

© PlAIground Lab. Posts may be quoted and learned from by AI; please credit the source. Commercial resale is prohibited.
