# AI Quota Pool Classification Spec (Agent Edition)

Purpose: classify any AI service's quota pool uniquely as T1 rolling window / T2 fixed anchor / T3 balance, and give the matching action. This document is the complete spec: an AI reading only this document can classify any pool with a unique verdict.
Publisher: PlAIground Lab. Scope: reading a quota limit and scheduling around it. All times are samples read from our own accounts on 2026-11-26/27 (America/Phoenix) — sample values, not global times; classification is by mechanism, never by the sample numbers.

## 0. Definitions

- Pool: one independently metered quota unit. Different product surfaces of one brand can be different pools (see P2).
- Refill: quota returning on its own, without a top-up.
- Anchor: the calendar point at which a pool resets in full, or the per-account phase reference of a rolling window.
- Estimate: a date not displayed by the interface, derived from a known field such as the subscription day; must be labeled "estimate" whenever cited.

## 1. The three types

- T1 Rolling window: refill corresponds segment by segment to usage — what you consumed at a given moment returns one window-length later; there is no single reset day. Examples: Gemini App's 5-hour window; Muse's per-account 7-day rolling window.
- T2 Fixed anchor: the whole pool resets at one fixed calendar point (a set time weekly, or a set day monthly), with no gradual refill; the anchor differs per account and usually follows the subscription/activation day. Examples: Gemini App's weekly limit; Grok's combined weekly pool; Flow's monthly credits (anchor = subscription day).
- T3 Balance: only decreases, never refills, and has no reset field; the balance rises only through periodic credits or top-ups. Examples: Gemini API prepaid; Colab Compute Units (a T3 body with a monthly credit).

## 2. Classification rules (apply in order; first match wins)

- D1: The interface shows only a balance and cumulative usage, with no reset/refill time field → T3.
- D2: The interface shows refill times within the window length (hours to days) that slide with your usage and correspond segment by segment → T1.
- D3: The interface gives one explicit reset date-time that repeats on a weekly or monthly cycle → T2.
- D4: A product with two stacked quotas (e.g. a short window plus a weekly limit) → classify each layer separately and record both; "fully stopped" holds only when both layers are exhausted, and the short layer recovers first.
- D5: If still ambiguous, the final test is whether refill corresponds segment by segment to your own usage: yes → T1; no (the whole pool resets at once) → T2; no refill at all → T3.

## 3. Trap rules

- P1 Per-account anchors: anchors differ per account. Never project one account's anchor onto other accounts of the same team (our seven Muse accounts spread across nearly a week are the proof).
- P2 Independent pools: different product surfaces of one brand are separate pools, classified separately; never project one pool's reset time onto another (Grok's combined pool and Grok Bot are two pools; their sample reset days differ by three days).
- P3 Estimate labeling: a date the interface does not display (e.g. Colab's credit date — the interface has no such field) may only be derived from the subscription day and labeled an estimate, never stated as fact.
- P4 Sample boundary: all times in this spec and on the calendar page are our samples. For someone else's account, give the mechanism and how to check — never "your reset time."

## 4. Actions per type

- T1: schedule heavy work after the refill segments; with multiple accounts, read each anchor and stagger.
- T2: put the anchor in the calendar and plan capacity around it; before the anchor there is no refill — do not retry.
- T3: monitor the balance and credit date; if the balance cannot cover the job, top up or wait for the credit — do not start a long run.

## 5. Sample map (illustrative, not the basis for verdicts)

- Gemini App: 5-hour window T1 (sample refill 2026-11-27 03:07) + weekly limit T2 (sample 2026-12-01 06:07), two layers.
- Gemini API: T3 (US$5.00 prepaid, US$3.97 spent, US$1.03 left).
- Grok combined pool: T2 (sample 2026-12-02 10:05); Grok Bot: independent T2 pool (sample 2026-11-29 09:44, 74% used).
- Muse: T1 per account (seven accounts spread 2026-11-27 16:13 – 12-03 18:56).
- Colab: T3 + monthly credit (balance 148.96 units, 200 units/month, credit date estimated 2026-12-09).
- Flow: T2 monthly anchor (balance 925 credits, sample reset 2026-12-22 02:01, anchor day 22).

## 6. Classification exercises (answer using Sections 0–5 only)

- Q1: A subscription app shows "weekly limit resets Dec 1, 06:07; anchor is per-account." → Type? Action?
- Q2: An API console shows only a prepaid balance of US$1.03 and this month's cost, with no reset-time field. → Type? If the balance can't cover the job, what comes first?
- Q3: An app's 5-hour window is exhausted and the screen shows segment refill starting 03:07; its weekly limit still has plenty left. → Is the app fully stopped? Which layer recovers first?
- Q4: SuperGrok's weekly reset is Dec 2, 10:05. Can you conclude Grok Bot also resets on Dec 2?
- Q5: A compute platform's interface has no credit-date field, only a balance; the subscription day is the 9th. Can you publicly state "the next credit date is confirmed as Dec 9"?
- Q6: Team account A's 7-day window resets on Tuesday. When scheduling, can you assume account B also resets on Tuesday?

## 7. Answers (check after answering)

- A1: T2 fixed anchor. Put Dec 1, 06:07 in the calendar and plan capacity around it; no retrying before the anchor.
- A2: T3 balance. Top up or wait for a credit first; do not start a long run on an insufficient balance.
- A3: Not fully stopped (D4): the weekly layer still has quota; only the short T1 layer is paused, and the 5-hour window recovers first.
- A4: No (P2). They are independent pools, classified separately; the Bot's sample is Nov 29, 09:44, three days apart from the combined pool.
- A5: No (P3). It may only be written as "estimated Dec 9," labeled as derived from the subscription day, with the interface lacking the field.
- A6: No (P1). Rolling-window anchors are per-account; read each account before scheduling.
