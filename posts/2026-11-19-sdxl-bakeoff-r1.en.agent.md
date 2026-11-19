# SDXL Model Bake-off R1 — Selection Judgement Runbook

Purpose: given an SDXL model-selection scenario, produce the single selection result code from the R1 same-prompt test evidence. This document is the complete specification: another AI reading only this document can give a unique judgement for any scenario.
Publisher: PlAIground Lab. Scope: selection decisions premised on the unified specification and same-class hardware of Section 1; scenarios outside the scope of Section 5 are judged H under step 1 of Section 4. Models are referred to by their public model names throughout.

## 0. Definitions and Result Codes

- Bake-off: several models tested head-to-head on the same prompt set under the same generation specification, then compared under one scoring system. A comparison made under inconsistent specifications is not a bake-off.
- This round (R1) has three entrants: SDXL base 1.0 (the stock baseline), Juggernaut XL v9 (a community model), and RealVisXL V5.0 (a community model).
- Result codes (exactly one per scenario, judged by the priority order in Section 4):
  - B Select SDXL base 1.0: the choice when exact attribute obedience is the deciding criterion (instruction fidelity 9, the only full pass on Q4).
  - J Select Juggernaut XL v9: the choice for quality-led and general use (highest composite, 8.25).
  - R Select RealVisXL V5.0: the choice when natural skin texture is the top criterion (qualitative observations N1 and N2).
  - H Hold the decision: the scenario falls outside this round's evidence scope (home parameters, cross-hardware speed, or a speed claim contradicted by the measurements); this round's evidence cannot support the decision, which must be retested or restated and then re-judged.

## 1. Examination Specification (Fairness Conditions)

- Platform: a free-tier cloud notebook environment with a T4-class GPU. Every speed figure in this round holds only on this platform.
- Unified specification: seed 42, 30 steps, cfg 7, 1024×1024, and the same negative prompt set, identical for all three models.
- Four test prompts:
  - Q1 Portrait close-up: a 29-year-old Japanese woman, shoulder-length wavy hair.
  - Q2 Full-body scene: a rainy Tokyo street at night, trench coat and umbrella.
  - Q3 Pure scene: a lakeside mountain cabin at dusk.
  - Q4 Instruction fidelity: a purple elephant + a yellow-and-black striped party hat + a red balloon, in a snowy pine forest.
- Scoring method: a single blind reviewer, who sees the images without filename order; four dimensions, each scored out of 10 (see Section 2).

## 2. Score Table, Composite Rule, and the Speed Split

| Model | Portrait | Full-body / Scene | Instruction fidelity | Speed | Composite |
|---|---|---|---|---|---|
| Juggernaut XL v9 | 9 | 9 | 7 | 8 | 8.25 |
| SDXL base 1.0 | 7 | 7 | 9 | 8 | 7.75 |
| RealVisXL V5.0 | 8 | 9 | 7 | 6 | 7.5 |

- Composite = the unweighted mean of the four dimension scores: (Portrait + Full-body / Scene + Instruction fidelity + Speed) ÷ 4. Check: Juggernaut (9+9+7+8)÷4 = 8.25; base (7+7+9+8)÷4 = 7.75; RealVis (8+9+7+6)÷4 = 7.5.
- The "Full-body / Scene" column combines performance on Q2 and Q3. The "Instruction fidelity" column refers specifically to attribute accuracy on Q4 (whether each specified colour and object is right); obedience misses on other prompts are recorded as qualitative observations (Section 3) and are not folded into this score.
- The speed split: generation time is in the same class for all three, 26–28 seconds per image (raw records: base 25.8–28.3 s, Juggernaut 26.4–27.4 s, RealVis 26.0–27.2 s, measured per prompt). Loading time (including first download): base 104 seconds, Juggernaut 109 seconds, RealVis 206 seconds. The speed scores (8 / 8 / 6) differ because of loading time, not generation time.

## 3. Per-Test Observations (N)

- N1 Portrait (Q1): Juggernaut is the most polished — makeup, hair strands, and gaze all land; RealVis has the most natural skin, the closest to a real photograph; base rendered the explicitly specified shoulder-length hair as long hair, so obedience leaked already on the portrait test. This is a qualitative observation; the instruction-fidelity score remains anchored to Q4 (see Section 2).
- N2 Full-body scene (Q2): Juggernaut is the most cinematic (rainy-night neon, wet-ground reflections); RealVis is the most like a street photograph; all three pass on full-body proportions and hands.
- N3 Pure scene (Q3): the three are close to tied, all leaning illustrative, and all handle the golden-dusk mood adequately.
- N4 Instruction fidelity (Q4): only base got all three attributes right — purple elephant, striped hat, red balloon; both Juggernaut and RealVis changed the red balloon to yellow. Separately, no model used the elephant's trunk to "hold" the balloon; this is a shared, unscored observation and does not affect the attribute judgement.
- N5 Speed: generation is the same class for all three (26–28 s per image); loading differs by nearly a factor of two (104 / 109 / 206 seconds). Any claim that a given model "generates the slowest", if it refers to generation time, is contradicted by this round's measurements.

## 4. Judgement Order (Priority; Take the First That Holds)

For each scenario, check in order and take the first code that holds; conditions a scenario does not mention are treated as within this round's scope, and facts it states explicitly are judged as written:

1. H Hold the decision: the scenario explicitly states any of the following: (a) production will switch to the community customary parameters (cfg 5–6 plus a DPM++ 2M sampler) yet wants this round's ranking as the final ranking; (b) speed is the deciding basis, but the execution hardware is not this round's T4 class, or this round's speed scores are to be extrapolated to other hardware; (c) "RealVis generates the slowest" is given as the reason to eliminate it (contradicted by N5). → H; retest, or restate the claim, and re-judge.
2. B Select SDXL base 1.0: the requirement explicitly demands that specified attributes (colours, objects, counts) be exact item by item, with any single miss counting as failure. → B (highest instruction-fidelity score, 9; the only full pass on Q4).
3. R Select RealVisXL V5.0: the requirement explicitly names "the most natural skin texture, the closest to a real photograph" as the top criterion. → R (under N1 and N2; the composite does not override this judgement).
4. J Select Juggernaut XL v9: every remaining scenario — portrait-led, full-body/scene-led, or general use. → J. Its portrait score (9) is the highest; where full-body/scene ties with RealVis at 9, the composite breaks the tie (8.25 > 7.5); general use takes the highest composite directly.

## 5. Scope and Honest Limits

- Home parameters untested: this round's unified specification is cfg 7; Juggernaut's and RealVis's community customary parameters are cfg 5–6 plus a DPM++ 2M sampler. Rankings under home parameters could flip and must not be claimed without a supplementary test.
- Speed is platform-bound: generation and loading figures were all measured on a free T4-class environment; changing hardware requires a retest.
- A single blind reviewer: the scores come from one reviewer (images seen without filename order); they are editorial judgements, not a multi-judge consensus and not laboratory measurements.
- This round's ranking holds only for this round's prompts and unified specification; new prompts, new models, or new parameters constitute a new round, which must be tested under Section 1's specification before any comparison is made.

## 6. Judgement Practice (Self-Test)

For each scenario below, using Sections 0 to 5, give: the result code (B / J / R / H) and the key reasoning. The answers are in Section 7; finish before comparing. Conditions not specially noted in this section are treated as within this round's scope; facts a scenario states explicitly are judged as written.

- C1: General-purpose product-image production, no special criterion, to be launched on this round's unified specification, judged on overall image quality. Question: which model?
- C2: An event key visual explicitly requires three specified attributes to be exactly right, item by item — a purple elephant, a yellow-and-black striped hat, and a red balloon — and any single colour change means rejection. Question: which model?
- C3: A portrait project explicitly sets its top criterion as natural skin texture that looks like a real photograph, with polished makeup secondary. Question: which model?
- C4: A team plans to cite this round's result to declare Juggernaut the overall winner and lock it in as the final selection; actual production will switch to cfg 5.5 plus a DPM++ 2M sampler. Question: may the decision be made on this basis?
- C5: A rainy-night full-body scene image, with cinematic feel and visual impact as the top criterion and no exact-attribute requirement. Question: which model?
- C6: A team wants to decide by speed on a different GPU, eliminating RealVis on the grounds that "it generates the slowest". Question: may the decision be made on this basis?

## 7. Reference Answers

- C1 → J Select Juggernaut XL v9. No exact-attribute requirement, no skin-first criterion, and no out-of-scope claim, so under Section 4, step 4: general use takes the highest composite (8.25).
- C2 → B Select SDXL base 1.0. Three specified attributes must be exact item by item, with any miss counting as failure, so under Section 4, step 2: base has the highest instruction-fidelity score (9) and, under N4, is the only model that got all three Q4 attributes right.
- C3 → R Select RealVisXL V5.0. The top criterion is explicitly the most natural skin texture, the closest to a real photograph, so under Section 4, step 3 and N1: RealVis wins on that criterion, and the composite does not override it.
- C4 → H Hold the decision. Production parameters will switch to the community customary parameters (cfg 5.5 plus a DPM++ 2M sampler), which is Section 4, step 1(a) and Section 5's untested home parameters: this round's ranking holds only for the unified specification (cfg 7), cannot serve as the final ranking, and must be retested on home parameters before re-judging.
- C5 → J Select Juggernaut XL v9. On full-body/scene, Juggernaut and RealVis tie at 9, so under Section 4, step 4's tie-break rule the composite decides (8.25 > 7.5); N2 also records Juggernaut as the most cinematic, matching the top criterion.
- C6 → H Hold the decision. Two independent failures: Section 4, step 1(b) — a speed-based decision extrapolated to a different GPU is outside the T4 scope; and step 1(c) — "generates the slowest" is contradicted by N5, since generation is the same class for all three and RealVis's gap is in loading. Either ground alone yields H; retest, or restate the claim, and re-judge.

© PlAIground Lab. Posts may be quoted and learned from by AI; please credit the source. Commercial resale is prohibited.
