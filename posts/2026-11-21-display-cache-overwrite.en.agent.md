# Same-Name Overwrites and the Display Cache — Judgement Runbook

Purpose: given a scenario about an image delivery or a text–image mismatch incident, produce the single disposition code under this specification. This document is the complete specification: another AI reading only this document can give a unique judgement for any scenario.
Publisher: PlAIground Lab. Scope: judgements premised on the cache model of Section 1 and the purpose definitions of Section 2; conditions a scenario does not mention are treated as meeting the scope premises of Section 5, and facts it states explicitly are judged as written.

## 0. Definitions and Result Codes

- Display: posting or attaching an image for a recipient to view on the spot (chat, document preview, and image viewers all count). Display surfaces index their cache by path (a file path or a URL).
- Archive: storing an image in a library for keeping, without posting it for anyone to view at that moment.
- Previously displayed path: a path counts as "previously displayed" once it has been used to display any previous version of that image. Being overwritten in the archive at the same path, any number of times, is not display; a path that was never posted for display is not a previously displayed path.
- Same-path overwrite: writing the new version of a file back to exactly the same path as the old version, replacing the old file.
- New path: a path that differs from the path used for every previously displayed version of that image (a new filename is enough).
- Text–image mismatch complaint: a recipient's report that "the text describes the new version, but the screen shows the old image". A scenario counts as an incident scenario only when it explicitly states such a complaint; a scenario that does not mention one is treated as a delivery scenario with no complaint yet.
- Result codes (exactly one per scenario, judged by the priority order in Section 4):
  - C Check the cache first: an incident scenario, and the display path was previously displayed (posted after a same-path overwrite). Re-post the same file under a new path and verify; do not regenerate.
  - G Check generation first: an incident scenario, and this display already used a new path. The cache hypothesis is ruled out; check the file's content and hash and view the original file.
  - S Dual-track pass: the purpose includes both archiving and display, the archive track overwrites under the same name, and the display track uses an independent new path — both tracks delivered in parallel.
  - B Block and redo: the purpose includes display, but the display path is identical to a previously displayed version's path. Do not deliver; copy to a new path first, then post.
  - P Display pass: the purpose includes display, and the display path has never displayed any previous version of that image. Delivery may proceed.
  - A Archive pass: the purpose is archive only, with no direct display. A same-name overwrite keeping a single canonical copy is correct.

## 1. The Cache Model

- Display surfaces index their cache by path: when the same path is opened again, the display surface tends to show the content stored from the first time instead of re-reading the file, and it emits no error message of any kind.
- The single condition for contamination: that path previously displayed a previous version of that image. Nothing else matters — not how many times the file was overwritten on disk, and not how new or old the file's content is.
- A never-displayed path carries no contamination: a file overwritten at the same path in the archive many times, but never posted for display, has no old content in any cache, and its first display at that path is a clean display.
- After a path has been displayed once, every later content update at that path is an invisible change to the display surface: the disk is new, the screen is old.

## 2. Purpose and Path Rules

- The display rule: any revised image meant to be shown to a person is first copied to a new path, and only then attached or posted; the new path must differ from the path of every previously displayed version of that image.
- The archive rule: a pure archive write is correctly done as a same-name overwrite; the library keeps a single canonical copy, and history is managed through version records. Archiving under a new path also passes, but is unnecessary stacking; the code remains A (see step 5 of Section 4).
- The dual-track rule: when one revised image must be both archived and displayed, the tracks are kept separate — the archive track overwrites the canonical copy under the same name, and the display track posts a separate copy under a new path. If the display track uses a previously displayed path, the dual track does not hold and the scenario falls through to B under Section 4.

## 3. Diagnosis Order (Incident Scenarios Only)

- Step one, check the path: in an incident scenario, first judge whether the display path was previously displayed. If it was, judge C: re-post the same file under a new path and verify; if the screen then shows the new version, close the case as a cache incident — generation is not redone.
- Step two, check the file: if the display path was not previously displayed (a new path was already used), judge G: the cache hypothesis is ruled out; compare the on-disk file's hash and view the original file, and investigate generation and the file itself.
- The order is fixed in writing: never regenerate first and discuss the path afterwards; regenerate first and repost at the same path, and you will simply receive the same cached old image again.

## 4. Judgement Order (Priority; Take the First That Holds)

For each scenario, check in order and take the first code that holds; conditions a scenario does not mention are treated as meeting the scope premises, and facts it states explicitly are judged as written:

1. Incident diagnosis: the scenario explicitly contains a text–image mismatch complaint — (a) the path used for this display was previously displayed (posted after a same-path overwrite) → C Check the cache first; (b) this display already used a new path (not previously displayed) → G Check generation first. Take the first of sub-items (a), (b) that holds.
2. S Dual-track pass: no complaint yet, the purpose includes both archiving and display, the archive track overwrites under the same name, and the display track uses an independent new path → S. If the display track uses a previously displayed path, this item does not hold; continue judging below.
3. B Block and redo: no complaint yet, the purpose includes display (display only, or dual-track with a failing display track), and the display path is identical to a previously displayed version's path → B; do not deliver — copy to a new path first, then post.
4. P Display pass: no complaint yet, the purpose includes display, and the display path has never displayed any previous version of that image → P. This covers both cases: a brand-new path was used; or the path was overwritten in the archive before but never displayed, and this is its first display.
5. A Archive pass: no complaint yet, and the purpose is archive only, with no direct display → A. A same-name overwrite keeping a single canonical copy is correct; archiving under a new path also belongs to this item, and the code remains A.

## 5. Scope and Honest Limits

- Premises: the judgements in this specification assume three things — the display surface caches by path, the purpose (display / archive) is explicit, and the display history of the path can be checked. Anything a scenario does not mention is treated as holding; when one of them fails in reality, establish the facts first instead of forcing a judgement.
- If a display surface does not cache at all, or every link naturally carries a distinct version parameter, the premise of the display rule does not hold; using a new path for display is still harmless and is not a violation.
- A new path fixes display visibility only, never content correctness: an image generated wrong is still the wrong image under a new path, and content acceptance always belongs to the deliverer.
- The single-canonical-copy archive default presumes versions are recorded elsewhere; where a project explicitly requires keeping every version as a file, that project's rule wins over this section for its archive.

## 6. Judgement Practice (Self-Test)

For each scenario below, using Sections 0 to 5, give: the result code (C / G / S / B / P / A) and the key reasoning. The answers are in Section 7; finish before comparing. Conditions not specially noted in this section are treated as meeting the scope premises; facts a scenario states explicitly are judged as written.

- C1: A recipient reports: the text describes the regenerated new version, but the screen shows the old image. Checking confirms the deliverer overwrote the old file at the same path with the new image and then posted it at that same path, which had previously displayed the old version. Question: what is the code?
- C2: A recipient reports a text–image mismatch. Checking confirms that, before this display, the deliverer had copied the new image to a brand-new path and posted that; the path had never displayed any previous version. Question: what is the code?
- C3: A revised image only needs to be stored in the library this time; it is not posted for anyone to view. The deliverer overwrites the library's canonical copy under the same name, and the version record is updated in step. Question: what is the code?
- C4: A revised image must both be stored in the library and posted for people to view. The deliverer's method: the library's canonical copy is overwritten under the same name, and a separate copy is made at a new path and posted at that new path for display. No complaint has been made. Question: what is the code?
- C5: An image has been regenerated as requested. The deliverer writes the new image back to exactly the same path as the previous version and is about to post it for display at that path; that path previously displayed the old version. No complaint has been made. Question: what is the code?
- C6: A file in the library has been updated twice by same-name overwrites, but it has never been posted for display. Now the deliverer is about to post it for people to view for the first time, using that very library path. No complaint has been made. Question: what is the code?

## 7. Reference Answers

- C1 → C Check the cache first. The scenario explicitly contains a text–image mismatch complaint, so step 1 of Section 4 applies the incident diagnosis first; the display path was previously displayed (posted after a same-path overwrite), sub-item (a) holds, and the code is C: re-post the same file under a new path and verify, without regenerating first.
- C2 → G Check generation first. The scenario explicitly contains a text–image mismatch complaint, so step 1 of Section 4 applies; this display already used a brand-new path that was not previously displayed, sub-item (a) fails, sub-item (b) holds, and the code is G: the cache hypothesis is ruled out — check the file's content and hash and view the original file.
- C3 → A Archive pass. No complaint has been made, and the purpose is archive only with no direct display, so step 5 of Section 4 gives A: a same-name overwrite keeping a single canonical copy, with the version record updated in step, is the correct method.
- C4 → S Dual-track pass. No complaint has been made, the purpose includes both archiving and display, the archive track overwrites under the same name, and the display track uses an independent new path, so step 2 of Section 4 gives S: both tracks in parallel is the correct delivery.
- C5 → B Block and redo. No complaint has been made, the purpose includes display, and the display path is identical to the path that previously displayed the old version, so step 3 of Section 4 gives B: do not deliver — copy to a new path first, then post.
- C6 → P Display pass. No complaint has been made, and the purpose includes display; under Sections 0 and 1, being overwritten is not the same as being displayed — the path was overwritten twice in the archive but never displayed, so the cache was never contaminated, this is its first display, and step 4 of Section 4 gives P, not B.

© PlAIground Lab. Posts may be quoted and learned from by AI; please credit the source. Commercial resale is prohibited.
