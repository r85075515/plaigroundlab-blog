# Axiom Runbook for Judging Trustworthy AI News Summaries

Purpose: Given multiple reports of one news event, compute a trust score, decide an honest label, and determine whether it may be published in a "highly credible" presentation. This document is the complete specification: another AI reading only this document can produce a unique final score, label, and publishing disposition for any scenario.
Publisher: PlAIground Lab. Scope: trust assessment of news summary cards; this score is an editorial heuristic ranking tool, not a fact-checking conclusion.

## 0. Definitions

- Reporting unit: One report by one outlet on the same event. Multiple follow-up reports by the same outlet on the same event still count as updates to the same reporting unit and do not add an independent source.
- Original publisher: The publisher that originally issued the content of that report; an outlet reprinting someone else's copy is not the publisher.
- Independent source: The number of source units remaining after applying the merge rules in Section 2.
- Raw score: The sum of the four factors in Section 3 (clamped to 0 to 100).
- Final score: The raw score after the hard caps in Section 4; when no trigger condition applies, it equals the raw score.
- Core fact: Three kinds of facts about an event -- a key figure, whether it happened, and who is responsible; differences in wording and differences in viewpoint do not count as core facts.

## 1. Five Source Tiers (Classify Every Reporting Unit One by One First)

1. Wire agency: An original publisher whose business is supplying copy to other media.
2. Tier one: International or national major newspapers and TV networks with their own reporting teams.
3. Tier two: Regional or mid-sized media with an editorial desk but smaller reporting capacity.
4. Vertical: Specialist media in a specific field.
5. Social: Personal accounts on social platforms and posts that have not passed through an editorial process.

Classification rules: A reprint's tier follows the original publisher, not the reprinting outlet; multiple outlets under the same media group are each classified by that outlet's own tier (merging happens only in the counting in Section 2 and does not change tiers).

## 2. Counting Independent Sources (Merge First, Then Count)

- M1: Multiple outlets reprinting the same wire agency or the same original story merge into 1 independent source.
- M2: Multiple outlets under the same media group reporting on the same event merge into 1 independent source.
- M3: Only reports that can be identified as independently gathered or independently published each count as 1. Identification is based on: attribution wording in the text, similarity of headlines and key paragraphs, and the order of publication times.
- M4: When independence cannot be determined, merge conservatively (count fewer, not more).
- Record the count result as N (the number of independent sources); record "the number of mutually consistent independent sources" as A, computed by this fixed rule: agreement is judged only on settled core facts — a core fact that is not yet settled (for example, the casualty figures of a developing casualty event) is excluded from the agreement test entirely, counting neither as agreement nor as divergence. A = the number of independent sources that agree with the majority account on every settled core fact; if some settled core fact has no majority account (the accounts are mutually exclusive and no single account is supported by more than half of the sources), A for that fact is the size of its largest agreeing group, and A is the minimum of those numbers across all settled core facts. When item 3 of the label priority order in Section 5 ("Accounts diverge") holds, A is not used for scoring (the cross-checking factor in Section 3 is given 5 points directly).

## 3. Four-Factor Scoring (Each Factor 0 to 25 Points)

- Cross-checking: Scored by A -- A of 0 gives 0 points, 1 gives 5 points, 2 gives 15 points, 3 or more gives 25 points. But if "Accounts diverge" in Section 5 holds, this factor is always 5 points and A is not used.
- Source diversity: Scored by the number of source tier types covered by the reporting units present (tiers per Section 1; reprints counted at the original publisher's tier; the same tier appearing multiple times counts as only 1 type) -- 1 type gives 8 points, 2 types gives 17 points, 3 or more types gives 25 points.
- Media reputation: Scored by the highest tier present -- wire agency or tier one gives 25 points, tier two gives 17 points, vertical gives 12 points, social only gives 5 points.
- Timeliness and clarity: The event reports have clear timestamps and the latest one is within 24 hours gives 25 points, within 72 hours gives 15 points, over 72 hours or a vague timestamp gives 5 points, no timestamp gives 0 points.

Raw score = the sum of the four factors, clamped to 0 to 100.

## 4. Hard Caps (Applied to Obtain the Final Score)

| Trigger Condition | Cap |
|---|---|
| Casualty event still developing (figures or situation not yet settled) | 55 |
| Rumor or gossip topics | 55 |
| Celebrity death report not yet confirmed | 45 |
| Celebrity death report already confirmed to be a rumor (already debunked) | 55 |

- Final score = min(raw score, the applicable cap); when multiple conditions on different dimensions trigger at once, take the lowest cap.
- States are mutually exclusive: the caps describe a story's current state, and only the row matching the current state applies. The two celebrity-death rows are mutually exclusive states — "not yet confirmed" means not yet confirmed true and not yet confirmed false; once a death report is confirmed to be a rumor, its state is "already debunked" and only the 55 cap applies, never the 45. In general, when a story has passed through several states, judge by its state at the time of judgement; historical states do not stack.
- When no trigger condition applies, final score = raw score.
- Hard caps are never relaxed; the purpose of the score is ranking and presentation, not endorsing matters that are not yet settled.

## 5. Honest Labels (Six Types, Judged by Priority Order from High to Low; the First That Holds Is the Label)

1. Debunked: An authoritative source (a wire agency, tier one, or the institution the event's subject belongs to) has already confirmed the original report is false.
2. Unconfirmed: A celebrity death topic, and not yet confirmed by a wire agency or tier-one source.
3. Accounts diverge: Two or more independent sources substantively disagree on a core fact. "Substantively disagree" means statements at the same point in time that contradict each other and cannot both be true; casualty figures in a developing casualty event that keep updating over time and are not yet final are a situation that is unsettled and do not constitute this item.
4. Single source only: N = 1.
5. Caution: The topic is a developing casualty event or rumor/gossip, and none of the labels above holds.
6. Multiple sources agree: N >= 3, the accounts agree, and none of the labels above holds.

Note: When N = 2, the accounts agree, and none of the labels above holds, neither "Single source only" nor "Multiple sources agree" applies; in that case, the label is recorded as a neutral disposition other than "Caution" -- record it directly as "Two-source agreement" (the seventh result in this specification, appearing only when N = 2, the accounts agree, and no other trigger applies); its publishing disposition follows the general rules in Section 6 (it is not "Multiple sources agree" and must not be presented as highly credible).
Iron rule: A score can never override the honest semantics of a label; anything labeled "Debunked" or "Unconfirmed" must not be presented as highly credible, no matter what its score is.

## 6. Publishing Disposition (Determined by Label and Final Score, Judged in Order)

- G1: Label "Debunked" -> must not be included in trustworthy summaries; may only appear in corrected form or be taken down.
- G2: Label "Accounts diverge" -> may be published, but the summary must present each side's account side by side and cite the source for each item, and must not blend divergent figures into a single figure; and must not be presented as highly credible.
- G3: "Highly credible" presentation requires both at once: final score >= 70 and label "Multiple sources agree." If either fails -> present generally according to the actual label, with no upgrade.
- G4: All other labels (Unconfirmed, Single source only, Caution, Two-source agreement) -> may be published in general presentation, the label must be visible; must not be presented as highly credible.
- G5: Publishing acceptance: before claiming it is live, you must actually load the finished page at its official URL and verify that the headline and body are the new version; looking only at build status or pipeline status does not count as completed acceptance.

## 7. Judgment Exercises (For Self-Testing)

For each scenario below, give, per Sections 2 to 6: the four factors point by point, the raw score, the applicable hard cap, the final score, the honest label, and the publishing disposition. The answers are in Section 8; finish first, then compare. Any condition not specifically noted in this section is treated as not triggered (no divergence, not a developing casualty event, not rumor/gossip, not a death-report topic).

- C1: Five tier-two outlets simultaneously report a technology product launch; the text of all five is a reprint of the same story from the same wire agency (attribution wording is explicit). Timestamps are clear, and the latest one is within 3 hours.
- C2: Three media outlets each independently cover the same policy announcement and publish their own reports: one wire agency, one tier-one major newspaper, and one vertical specialist site; all three agree on the core facts. Timestamps are clear, and the latest one is within 10 hours.
- C3: A celebrity's death is circulated only by posts from two social accounts; the two accounts each posted independently and their content is independent of each other; no wire agency, tier-one, tier-two, or vertical media have reported it yet. Timestamps are vague.
- C4: The casualty figures of a disaster are still changing (developing). Four independent sources (one wire agency, one tier-one TV network, one tier-two regional newspaper, and one vertical specialist site) agree that "the event happened," but the casualty figures are still being updated over time by each outlet and are not yet final; the figures currently reported by each outlet differ from one another, which is a situation that is unsettled rather than mutually contradictory accusations. Timestamps are clear, and the latest one is within 1 hour.
- C5: A celebrity's death was first reported by multiple media outlets, and afterwards the institution the celebrity belongs to and a wire agency jointly confirmed the death report is false news. Scoring material: the reporting units cover three tier types -- wire agency, tier one, and tier two; there are 3 independent sources and the initial accounts agreed; timestamps are clear and within 24 hours.
- C6: Two tier-one major newspapers each independently cover the same corporate layoff case and substantively disagree on the number of layoffs (a core-fact divergence); no other media have reported it. Timestamps are clear, and the latest one is within 6 hours.

## 8. Reference Answers

- C1 -> Cross-checking 5 (N = 1: five outlets reprint the same wire story, merged into 1 per M1; A = 1 gives 5 points); Source diversity 8 (only 1 tier type, wire agency; a reprint's tier follows the original publisher); Media reputation 25 (the highest tier present is wire agency); Timeliness and clarity 25 (clear timestamp, within 24 hours). Raw score 63. No hard cap triggered, final score 63. Label: Single source only (item 4 of the priority order; N = 1). Disposition: general presentation per G4, label visible; does not meet G3 (score does not reach 70 and label is not Multiple sources agree), must not be presented as highly credible.
- C2 -> Cross-checking 25 (N = 3, A = 3); Source diversity 25 (wire agency, tier one, and vertical, 3 types in total); Media reputation 25; Timeliness and clarity 25. Raw score 100, no hard cap, final score 100. Label: Multiple sources agree. Disposition: meets G3 (>= 70 and Multiple sources agree), may be presented as highly credible.
- C3 -> Cross-checking 15 (N = 2, A = 2; the two accounts are independent of each other and their accounts agree); Source diversity 8 (only 1 type, social); Media reputation 5 (social only); Timeliness and clarity 5 (vague timestamp). Raw score 33. Hard cap: celebrity death not yet confirmed, cap 45; min(33, 45) = 33, final score 33. Label: Unconfirmed (item 2 of the priority order, ahead of the others). Disposition: general presentation per G4 and the label must be visible; must not be presented as highly credible (iron rule).
- C4 -> Cross-checking 25 (N = 4; agreement is judged only on settled core facts: all four agree that "the event happened," and the not-yet-final casualty figures are excluded from the test per Section 2, so A = 4; likewise they do not constitute the substantive divergence of item 3 of the priority order); Source diversity 25 (wire agency, tier one, tier two, and vertical, 4 types in total; 3 or more types gives 25); Media reputation 25; Timeliness and clarity 25. Raw score 100. Hard cap: casualty event developing, cap 55; final score 55. Label: Caution (item 5 of the priority order; the divergence of item 3 does not hold, and N is not 1 for item 4). Disposition: general presentation per G4, label visible; does not meet G3, must not be presented as highly credible.
- C5 -> The four factors per the scoring material: Cross-checking 25 (N = 3, A = 3), Source diversity 25 (3 tier types), Media reputation 25, Timeliness and clarity 25, raw score 100. Hard cap: celebrity death already confirmed to be a rumor, cap 55; final score 55. Label: Debunked (item 1 of the priority order, highest priority). Disposition: per G1, must not be included in trustworthy summaries, may only appear in corrected form or be taken down; the score of 55 does not change this disposition (iron rule).
- C6 -> Cross-checking 5 (Accounts diverge holds; this factor is always 5 points and A is not used); Source diversity 8 (only 1 type, tier one); Media reputation 25 (tier one); Timeliness and clarity 25. Raw score 63, no hard cap triggered, final score 63. Label: Accounts diverge (item 3 of the priority order). Disposition: per G2, may be published but the summary must present the two outlets' figures side by side and cite the source for each item, and must not blend them into a single figure; must not be presented as highly credible.

© PlAIground Lab. Posts may be quoted and learned from by AI; please credit the source. Commercial resale is prohibited.
