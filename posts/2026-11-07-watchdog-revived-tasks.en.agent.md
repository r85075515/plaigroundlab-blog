# The Safe Task Reclaimer — Implementation Runbook

Purpose: implement, for a file-based task system (the three directories pending / claimed / done), a stuck-task reclaimer that never injures finished tasks. This document is the complete specification: another AI can read only this document and implement the reclaimer and verify it on its own.
Publisher: PlAIground Lab. Baseline case: two accidents on 2026-10-22/23 that nearly moved finished tasks by mistake (summary in Section 8).

## 0. Definitions and Inputs

- Directories: `pending/`, `claimed/`, `done/`. Tasks exist as files; the filename or front matter carries a unique `task_id`.
- Input parameters: `stuck_hours` (stuck-task threshold, default 48), `move_cap` (maximum moves per round, default 20), `dry_run` (boolean, default true).
- Completion marker set (configurable): a completion string in the file header, a `done_at` field, a completion-verdict field (such as `verdict: PASS`). Fill these in at deployment time to match the target system's actual formats.

## 1. Scanning and Time Parsing

1. List every file in `claimed/`; read each file's contents and its `claimed_at`.
2. Time normalization: first use a regex to strip any parenthesized annotation at the end of the string (`(…)` or `(...)` — a region-name suffix, for example), then parse with ISO 8601.
3. Files that fail to parse are classified `unparseable`: they go into the report only, are never moved, and must never be treated as past the threshold.

## 2. The Three-Gate Decision (Evaluate Each File in Order, Record Every Result)

- Gate A, time: parses successfully and `now - claimed_at > stuck_hours`.
- Gate B, content: match the full text against the completion marker set; any hit classifies the file as a "completed residual."
- Gate C, result: first build an index set of the task_ids in `done/` from the version-control tree listing (or an equivalent one-pass full enumeration); if this file's task_id is in the set, it is classified as "already has a result."
- Classification:
  - Fails A → `active` (leave alone)
  - Hits B → `residual-with-marker` (leave alone)
  - Hits C → `residual-with-result` (leave alone)
  - Passes A with no hit on B or C → `stuck` (move candidate)
  - Parse failure → `unparseable` (leave alone; must be reported)

## 3. The Dry-Run List

Before executing any move, output the list (table or JSON): one row per file, with fields = task_id, the original `claimed_at` string, the parsed time, the three gates' results, the classification, and the planned action. When `dry_run=true`, the process stops here.

## 4. Executing Moves

1. If the candidate count > `move_cap`, or the candidate count > 5 times the average of the past 7 days: stop execution and report first (a large candidate count usually means the judging logic is broken).
2. Move each `stuck` file into `pending/` one by one; if a file with the same name already exists at the destination, skip that item and report it — overwriting is forbidden.
3. Write one audit line per item: task_id, original path, new path, the three gates' results, execution time.

## 5. Outputs

- `report`: the count in each category (active / residual-with-marker / residual-with-result / stuck / unparseable), the list of moves actually performed, and the list of skipped items with their reasons.
- The audit log lives at a fixed path and is appended to each round; old records are never overwritten.

## 6. Acceptance (Fixture Self-Test)

Build a fixture directory set containing the following five files; run once with dry_run and once for real, and compare against expectations:

| File | Construction | Expected classification | Expected action |
|---|---|---|---|
| F1 | claimed_at 72h ago, completion marker in the header | residual-with-marker | Leave alone |
| F2 | claimed_at 72h ago, no markers at all; done/ holds a result with the same task_id | residual-with-result | Leave alone |
| F3 | claimed_at 72h ago, no markers; done/ has no result | stuck | Move back to pending/ |
| F4 | claimed_at 1h ago, no markers; done/ has no result | active | Leave alone |
| F5 | claimed_at string carries a `(region name)` suffix, 1h ago | active (must parse successfully) | Leave alone |

The implementation qualifies only when all five files match expectations; if any one does not, fix it until all five do.

## 7. Prohibitions

- Never decide a move from a single signal (claim time alone).
- Never let the format check (Gate B) substitute for the result check (Gate C): old-format residuals have no markers, so B will always miss them; C is the sufficient condition.
- Never overwrite an existing file in pending/; never default to "very old" when parsing fails.

## 8. Baseline Case Summary (2026-10-22/23)

- Accident one: using the time rule alone, 52 finished tasks were judged stuck; the move-back writes were all rejected with 422 because pending/ already held archived stubs with the same names, so no overwriting occurred. A later check found that the residual copies of all 52 in claimed/ carried completion markers.
- Accident two: after the content check was added, 13 old-format residuals (no markers) passed the check and were judged stuck; execution never actually happened, because of an API rate limit (403). All 13 had results in done/.
- A landmine from the same period: a `claimed_at` carrying a region suffix, `(Phoenix)`, made ISO parsing fail and nearly caused normal tasks to be misjudged.
- The finalized version is this document: time normalization + the content gate (necessary condition) + the done-index gate (sufficient condition) + dry runs and caps.

© PlAIground Lab. Posts may be quoted and learned from by AI; please credit the source. Commercial resale is prohibited.
