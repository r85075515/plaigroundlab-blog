# Page Registration and Self-Closing Judgement Runbook

Purpose: given a browser-page situation, produce exactly one disposition code under this specification. This document is the complete specification: another AI reading only this document can give a unique judgement for any situation.
Publisher: PlAIground Lab. Scope: judgements premised on the three mechanisms in Section 1 and the registration-field rules in Section 2; a condition a situation does not mention is treated as meeting the applicable premises in Section 5, and a fact a situation states explicitly is judged as stated.

## 0. Definitions and Result Codes

- Registration: the record written at the very moment automation opens a page, with four fields — window identifier, tab identifier, URL, and task number. Only with all four present is a registration complete; missing any one, the page counts as unregistered. A later account reconstructed from memory is not a registration.
- Dedicated window: a window reserved for automation (in the long run, a dedicated profile), kept separate from manual windows. A manual window is a window a person uses manually, and it is not touched at all, window-wide.
- Retention: keeping a page after its task has ended requires both a retention reason and a retention deadline added to its registration; only with both present is the retention valid, and the retention lapses the moment the deadline passes.
- Whitelist: the registered list of resident pages (such as sign-in pages, mailboxes, documents, and work dashboards). The list is what counts; a page whose type looks resident but which is not on the list enjoys no protection.
- Result codes (exactly one per situation, judged by the priority order in Section 4):
  - P Protected, Do Not Close: the page is on the whitelist, or sits in a manual window. Never close it automatically.
  - E Expired Retention: a valid retention registration exists, but its retention deadline has already passed. Close it and report the expiry.
  - R Retention on Record: the page is registered, its task has ended, and reason and deadline are both present with the deadline not yet reached. Keep it under retention until the deadline.
  - C Close at End: the page is registered, its task has ended, and there is no valid retention. The task that opened it closes it itself.
  - U Unregistered, Awaiting Claim: no complete registration can be found and ownership is unknown. Never close it directly; register it after the fact, establish whose it is, then judge it again.
  - W Working, Keep Open: the page has a complete registration, its task has not yet ended, and it is in use. Keep it open.

## 1. The Three-Mechanism Model

- Mechanism one (dedicated window): automation always opens pages in a dedicated window and never borrows a manual window; a manual window is not touched at all, window-wide, and no page is picked out of it to close.
- Mechanism two (registration on opening): every page is registered at the moment it is opened, in four fields; the registration is the only basis of ownership, and with no registration there is no basis for "definitely safe to close."
- Mechanism three (self-closing): when a task ends, whoever opened pages disposes of every page registered under that task, one by one; whoever opened a page closes it, leaving nothing for others or for a periodic sweep to guess at.
- Division of labour among the three mechanisms: the dedicated window governs where pages are opened, registration governs whose a page is, and self-closing governs who cleans up at the end. Protected goes to P, expired retention to E, valid retention to R, ended with no retention to C, no registration to U, and in progress to W.

## 2. Registration Field Rules

- Four required fields: window identifier, tab identifier, URL, and task number, written at the moment the page is opened.
- Missing any one field, the page counts as unregistered and is handled under U; nobody may write in a field on the opener's behalf to make it "registered" — registering after the fact is itself the disposition step of U, after which the page is judged again.
- Two retention additions: retention reason and retention deadline, added to the original registration when a page is to be kept after its task ends; missing either one, the retention does not stand.

## 3. Retention and Protection Rules

- Retention stands: registered, task ended, and both reason and deadline present → the retention stands; deadline not yet reached goes to R, deadline already passed goes to E.
- Retention does not stand: reason or deadline missing either one → the retention does not stand, and a page whose task has ended goes to C.
- Whitelist protection: a page on the registered whitelist → P, unaffected by any retention deadline, never closed automatically.
- Manual-window protection: a page sitting in a manual window → P, the window untouched window-wide; even if the page looks automation-opened, it is not picked out to close.
- In progress: complete registration, task not yet ended, and in use → W; once the task ends, the page is judged under E, R, or C instead, no longer W.

## 4. Judgement Order (Priority Order, Take the First That Applies)

For each situation, check in order and take the first code that applies; a condition the situation does not mention is treated as meeting the applicable premises, and a fact stated explicitly is judged as stated:

1. P Protected, Do Not Close: the page is on the registered resident whitelist, or the page sits in a manual window → P, never close it automatically; leave it exactly as it is.
2. E Expired Retention: the page is registered with a valid retention (reason and deadline both present), but the retention deadline has already passed → E, close the page and report the retention as expired.
3. R Retention on Record: the page is registered, its task has ended, and both retention reason and retention deadline are present with the deadline not yet reached → R, keep it under retention until the deadline.
4. C Close at End: the page is registered under a task, that task has ended, and there is no valid retention (reason or deadline not added, or neither) → C, the task that opened it closes it itself.
5. U Unregistered, Awaiting Claim: no complete registration can be found for the page (any of window identifier, tab identifier, URL, or task number missing), ownership is unknown, and P does not apply → U, never close it directly; register it after the fact, establish whose it is, then judge it again under this specification.
6. W Working, Keep Open: the page has a complete registration, its task has not yet ended, and it is in use → W, keep it open; when the task ends, dispose of it under E, R, or C.

## 5. Scope and Honest Boundaries

- Premise: this specification assumes the register and the whitelist can be consulted and a task's ended state can be confirmed. Anything a situation does not mention is treated as holding.
- When unsure, do not close: a page whose ownership or purpose cannot be established always goes to U first, never to direct closing on the grounds that it "looks like residue"; a page being open a long time or having an unfamiliar title is not evidence of ownership.
- Sweep scope: a periodic sweep may only close pages whose registration is explicit and which are judged C or E; P and U are never within a sweep's closing scope.
- The whitelist is the list: a page not on the registered whitelist enjoys no P protection, even if its type looks resident.
- Judge again after late registration: once a U page has been registered after the fact and its ownership established, return to Section 4 and judge again from the first position; no conclusion other than the re-judged one carries over.

## 6. Judgement Exercises (for Self-Testing)

For each situation below, give, under Sections 0 to 5: the result code (P / E / R / C / U / W) and the key reason. The answers are in Section 7; finish before checking. A condition not specially noted in this section is treated as meeting the applicable premises, and a fact stated explicitly is judged as stated.

- Q1: A page has a complete registration, its task has not yet ended, and it is in use. What is the code?
- Q2: A page has a complete registration and its task has ended; no retention reason has been added to the registration, and no retention deadline either. What is the code?
- Q3: No registration record can be found for a page at all — none of the four fields can be traced; the page is not on the whitelist and is not in a manual window. What is the code?
- Q4: A page has a complete registration and its task has ended; a retention reason and a retention deadline have been added to the registration, and the deadline has not yet been reached. What is the code?
- Q5: A page has a complete registration and its task has ended; a retention reason and a retention deadline have been added to the registration, but the retention deadline has already passed. What is the code?
- Q6: A page sits in a manual window, and the page appears in no automation registration. What is the code?

## 7. Reference Answers

- Q1 → W Working, Keep Open. Complete registration, task not yet ended, and in use, with no higher-priority code applying: judged W at position 6 of Section 4 — keep it open, and dispose of it under E, R, or C when the task ends.
- Q2 → C Close at End. Registered, task ended, and neither reason nor deadline added, so no valid retention: judged C at position 4 of Section 4 — the task that opened it closes it itself.
- Q3 → U Unregistered, Awaiting Claim. No complete registration can be found and ownership is unknown, and the page is neither on the whitelist nor in a manual window, so P does not apply: judged U at position 5 of Section 4 — never close it directly; register it after the fact, establish whose it is, then judge it again.
- Q4 → R Retention on Record. Registered, task ended, and both retention reason and retention deadline present with the deadline not yet reached: judged R at position 3 of Section 4 — keep it under retention until the deadline.
- Q5 → E Expired Retention. Registered with both retention items present, but the retention deadline has already passed and the retention has lapsed: judged E at position 2 of Section 4 — close the page and report the retention as expired.
- Q6 → P Protected, Do Not Close. The page sits in a manual window, and manual windows are untouched window-wide: judged P at position 1 of Section 4 — never close it automatically, leave it exactly as it is; its absence from any automation registration does not affect P's priority judgement.
