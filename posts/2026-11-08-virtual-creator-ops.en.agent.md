# SFW Content Pipeline for a Virtual Creator — Routing and Screening Runbook

Purpose: when running an AI virtual creator with an official face anchor, execute routing, generation, machine screening, and record-keeping for every SFW content brief. This document is the complete spec: another AI reading only this document can make a routing decision for any brief and state what happens next.
Publisher: PlAIground Lab. Scope: SFW content only.

## 0. Definitions

- Anchor image: the character's official face reference image; the sole baseline for similarity comparison.
- Engine A: strong face consistency, free / low-cost capacity; weak body presence.
- Engine B: strong body presence; image quota counted weekly, and production stops when it runs out.
- brief: a content request stating the type, the format (still / short video), how face-led it is, how body-readable it is, and a deadline (optional).

## 1. Routing Rules (Decide in Order; Stop at the First Match)

- R1 Pure background / scene (no person) → A primary.
- R2 Needs body presence (body readable and magnitude is a focus of the content) and the face is not dominant → B primary, A backup.
- R3 Gray zone: face-led and body presence both needed → B primary, A backup, and a decision record is mandatory (brief ID, conclusion, one-line reason).
- R4 Face-led stills / CG, fully covered lifestyle photos → A primary; lifestyle photos move to B as backup when A's first-pass rate falls short.
- R5 SFW everyday short videos → A limited primary (cap in Section 3), B backup.
- Deadline override: when a brief has a hard deadline and the primary engine's quota / capacity is insufficient, delivery takes priority (Section 4); routing may reroute, and every reroute is logged.

## 2. Machine Screening

1. Compute the ArcFace cosine similarity of every generated piece against the anchor image.
2. Band handling: ≥0.55 candidate (goes to human selection); 0.40–0.55 visible to reviewers only; <0.40 automatically voided.
3. Add the body-magnitude axis for body-readable stills: pieces whose magnitude clearly deviates from the locked spec are voided regardless of face score (reviewer's visual judgment, entered into the selection record).

## 3. Retry Caps

- Short videos on A: at most 3 tries per clip; if all fail the screen → reroute to B, no re-rolling.
- Stills: pieces that fail the screen are not regenerated in the same batch; shortfalls are made up by the next batch; record the first-pass rate batch by batch.
- Three consecutive batches with a first-pass rate <10% for the same (content type × engine) → file a proposal to revise the routing table.

## 4. Quota Guardrails and Priority

- B's weekly quota: hard stop at 95%, keeping 5% for committed hard deliveries.
- Priority: hard-deadline deliveries > routine schedule > experimental attempts.
- Types A can lead do not occupy B's quota.

## 5. The Prompt Boundary (Hard Rule)

- Allowed in the prompt: the hairstyle lock wording (verbatim), neutral silhouette language, scene and story description.
- Banned from the prompt: body measurements, cup-size numbers, body-part adjectives. Such specs are written only in the acceptance field, for screening and selection.
- A batch intercepted by an engine guard for violating the boundary: void the whole batch, record the incident, no image-by-image appeals.

## 6. Record Format (Four Fields per Output)

`brief_id` | `route` (engine + R number; gray zone adds a one-line reason) | `attempts` (engine and count) | `screen` (ArcFace score + disposition). Outputs without a record do not enter the release pool.

## 7. Decision Exercises (Self-Test)

For each brief below, give the route and a one-line reason per Section 1, then check against Section 8:

- B1: Face close-up still, showcasing a new hairstyle, no deadline.
- B2: Full-body street-style lifestyle photo, everyday outfit fully covered, no deadline.
- B3: Café background asset with no person in it.
- B4: Swimwear-look still; the body is the focus of the frame and the face is secondary.
- B5: Promotional short video, half face close-ups and half full-body shots, hard deadline (tomorrow).
- B6: SFW everyday short video, cooking in a kitchen scene, no deadline.
- B7: Half-body photo, face-led, but the outfit styling emphasizes the body's curves, no deadline.
- B8: Product photo still; the character holds the product, face-led, body not readable.

## 8. Answer Key

- B1 → A (R4, face-led still).
- B2 → A primary (R4 lifestyle photo; move to B only when the first-pass rate falls short).
- B3 → A (R1, pure background).
- B4 → B primary, A backup (R2, body presence dominant).
- B5 → B primary, A backup (R3 gray zone) + deadline priority: log the reroute / decision reason; the 3-try cap for shorts on A does not apply to primary engine B.
- B6 → A limited primary (R5; cap of 3 tries per clip, reroute to B if it fails the screen).
- B7 → B primary, A backup (R3 gray zone: face-led, but the body's curves are the styling focus) + decision record mandatory.
- B8 → A (R4: face-led, body not readable, so neither R2 nor R3 applies).

© PlAIground Lab. Posts may be quoted and learned from by AI; please credit the source. Commercial resale is prohibited.
