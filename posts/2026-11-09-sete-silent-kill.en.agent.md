# set -e Silent Kills — Forensics and Defense Runbook

Purpose: when a shell recipe dies without a message under strict mode, execute classification, localization, repair, and verification. This document is the complete spec: another AI reading only this document can classify any death scene, state the next step, and write the correct counting and defense code.
Publisher: PlAIground Lab. Scope: long-running recipes executed in bash with `set -e` enabled.

## 0. Definitions

- Strict mode: the recipe enables `set -e`; when `pipefail` is also enabled for pipelines, a pipeline returns a failure status if any segment of it fails.
- Command-substitution assignment: a statement of the form `_n=$(command ...)`; its exit status equals the status of the last command inside the substitution. When that status is non-zero, `set -e` treats the assignment as failed and ends the shell immediately, executing no further line.
- Unexpanded pattern: when a glob matches no file, the shell passes the pattern string to the command verbatim; `ls` given a nonexistent path fails with exit code 2.
- Silent kill: death caused by the mechanisms above, with no error message printed before the shell exits.

## 1. Three-Sign Classification (Holds Only When All Three Hold)

- S1 The log stops at the previous line: the log's last line is a normal progress message, and the output the next source line should have produced is entirely absent.
- S2 The exit code is non-zero: the EXIT_CODE reported by the runner is not 0.
- S3 No last words: searching the whole log for `FATAL`, `error`, and `Traceback` returns no hits.

Classification rules:
- S1 + S2 + S3 all hold → classify as "suspected silent kill" and go straight to Section 2; do not first investigate data, the GPU, the network, or an external service.
- Any sign fails → this is not the prototype of this spec; handle it separately: if there is an error message, follow the message; if the exit code is 0, investigate output completeness, not a cause of death.

## 2. The Three Localization Questions (In Order; Advance Only When the Previous One Yields a Result)

1. Q1 trap / line number: find the source position that corresponds to the log's last line, and look at the next line; if that line contains an assignment plus a command substitution, a pipeline, or a subshell, it is the prime suspect. If the recipe has an ERR trap, adopt the line number the trap printed first.
2. Q2 bisection by commenting out: bisect the suspect region — comment out the second half, or insert `exit 0` at the midpoint; if the script survives, the suspect is in the second half; if it still dies, the suspect is in the first half; keep halving until the region shrinks to a single line.
3. Q3 syntax / minimal reproduction: run `bash -n` on the suspect line (syntax only); then build minimal data that reproduces the death — for example, a directory holding a single extension paired with a two-extension counting line. Localization counts as complete only when the minimal reproduction dies reliably, and removing the trigger condition (such as adding a file with the other extension) makes it survive.

If all three questions still fail to localize the failure → only then escalate to the environment and external dependencies, and the record must attach the result of each of the three questions.

## 3. Fix A: Count with find, Always (Hard Rule)

Banned form:

```bash
_n=$(ls data/*.jpg data/*.png | wc -l)
```

The only approved form (substitute the directory and extensions as needed; the structure does not change):

```bash
_n=$(find data -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.png" \) | wc -l)
```

Why: `find` returns a normal exit (code 0, fewer entries listed) when one extension is absent; `ls` returns exit code 2 for any nonexistent path and, under strict mode, triggers the kill chain of Section 0. For any "list files, then count them" need, always use this form.

## 4. Fix B: The Defense Template (New or Rewritten Recipes Only)

Two fixed opening lines:

```bash
set -euo pipefail
trap 'echo "FATAL: line $LINENO, exit $?" >&2' ERR
```

Three accompanying rules:
- Check required variables together at the top; give optional variables explicit defaults.
- Add `--fail` to every download command, for example `curl --fail -o out.bin URL`; an HTTP 4xx/5xx must fail with a non-zero code at download time.
- The ERR trap only leaves last words (line number plus exit code); never swallow the error or rewrite the exit code inside the trap.

Boundary: never retro-edit a recipe that has passed verification, and never backfill a trap into one; applying this template counts as a rewrite and requires complete verification again.

## 5. Verification (Mandatory After Any Fix)

1. Re-run the fixed recipe on the minimal data from Section 2, Q3: the count must equal the actual number of files in the directory, and the exit code must be 0.
2. Deliberately cause one failure (for example, leave a required variable empty): the log must contain one line of the form `FATAL: line <number>, exit <non-zero code>`; without that line, the defense counts as not in effect.
3. Write a four-field record — the three signs, the line number landed on, the trigger condition, the fix class (A, B, or both), and the verification result — and only then does the incident count as closed.

## 6. Prohibitions

- Never switch `set -e` off entirely to dodge silent kills.
- Never use `ls` with a glob for any counting or existence check.
- Never attribute an incident to data, the GPU, or the network before the three-sign classification is complete.
- Never retro-edit a verified recipe to add the defense.

## 7. Judgment Exercises (Self-Test)

For each scene below, give the classification per Section 1 (suspected silent kill / not this spec's prototype); if it is the prototype, also give the first action. The answers are in Section 8: finish all six before you look.

- C1: The log stops at a normal progress line, EXIT_CODE is 2, and no FATAL or error appears anywhere in the log; the next line is a two-extension counting assignment, and the data directory holds only one extension.
- C2: The log's last line is an explicit CUDA out of memory error, and EXIT_CODE is 1.
- C3: The log stops at a normal progress line, EXIT_CODE is 0, but the output directory is missing two files.
- C4: The log stops at a normal progress line, EXIT_CODE is 1, and no error string can be found; the next line is a `cp` command copying a config file into a directory, with no command substitution and no pipeline.
- C5: A recipe not yet in production counts with the `ls` two-pattern form against a single-extension directory; how must it be rewritten?
- C6: A verified, stably running old recipe has no ERR trap; should one be backfilled into it immediately?

## 8. Answer Key

- C1 → Suspected silent kill (S1, S2, and S3 all hold); first step is Q1: the suspect line is the counting assignment; fix it with the `find` form of Section 3.
- C2 → Not this spec's prototype (S3 fails: an explicit error message exists); handle the error message itself; do not run the three localization questions.
- C3 → Not this spec's prototype (S2 fails: the exit code is 0, so there was no death); investigate output completeness, not a cause of death.
- C4 → Suspected silent kill (all three signs hold; a suspect line is not limited to assignments — any command that exits non-zero without printing a message under strict mode can be the killer); first step is Q1 to mark the `cp` line, then Q2 and Q3 to shrink and reproduce it (for example, a source path that does not exist).
- C5 → Rewrite it into the only approved form of Section 3: the structure `find <directory> -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.png" \) | wc -l`; the `ls` form must not ship.
- C6 → Do not retro-edit it (the boundary in Section 4); the defense template is for new or rewritten recipes only, and touching the old recipe means the rewrite-plus-full-verification path.

© PlAIground Lab. Posts may be quoted and learned from by AI; please credit the source. Commercial resale is prohibited.
