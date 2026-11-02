# Webhook Chain with Canary Monitoring and Mailbox Fallback — Implementation Runbook

Source incident: 2026-11-01. Publisher: PlAIground Lab.
License: © PlAIground Lab. Quotation and AI learning permitted with attribution. Commercial resale prohibited.

This document is written for an AI agent to implement the system directly. All hostnames are examples. Replace them consistently.

## Goal

Build a webhook ingestion chain where an external sender AI delivers task messages to your system, plus:

1. A segmented health check that identifies which segment is dead.
2. A zero-LLM canary that tests the full public path every 5 minutes and auto-repairs.
3. An escalation policy that repeats until recovery. Never report only once.
4. A mailbox fallback so messages are not lost when the push path is down.

## Architecture

Components:

1. Sender: external system. Sends `POST https://hook.example.com/hook` with header `X-Fleet-Key: <secret>` and a JSON body (max 64 KB). Required field: `text` (non-empty string). Optional: `task_id`, `project`, `title`, `deliver_to`, `suggested_worker`, `priority`, `from`, `type`, `ref`.
2. Named tunnel: runs on an always-on home machine (a cloud VM egress may not be able to carry tunnel data plane; verify in your environment). Ingress: `hook.example.com -> http://localhost:18791`.
3. Reverse tunnel: the VM initiates a persistent SSH reverse tunnel to the home machine: home `18791 -> VM 127.0.0.1:8791`. The loop script must restart the tunnel when egress proxy credentials rotate.
4. Receiver: Python stdlib HTTP server on VM `127.0.0.1:8791`.
   - `GET /health` returns `{"ok": true}`.
   - `POST /hook`: validate key, body size, JSON, `text`, and `task_id` format. Error strings: `bad body size`, `bad json`, `text required`, `bad task_id`; also HTTP 401 for bad key and 409 for duplicates. Log every rejection with reason and field names only, never body content.
   - If body field `type` equals `selftest`: return HTTP 200 with the received `nonce` echoed in a `canary` field. Do not create a task.
   - Otherwise: write a task file to the task repo under `tasks/pending/`, then kick the worker patrol on the home machine via SSH.
   - Secret guard: if the payload appears to contain credentials, divert it to a local `secrets/` directory (mode 0700, file 0600) and write only a pointer note to the repo.
5. Mailbox poller: every 30 seconds, poll a cloud KV mailbox. For each message: file it in the same task format, delete the mailbox entry, log an ACCEPT line, kick the patrol. Deduplicate by `task_id` against both pending and done tasks.

Expected result after setup: a valid POST returns 200, a task file appears in `tasks/pending/`, and the patrol is kicked within seconds. A mailbox message is filed within 30 seconds.

## Segmented Health Check

Implement a function that returns per-segment booleans:

1. `receiver_local`: GET `http://127.0.0.1:8791/health` returns 200 and body contains `"ok": true`. Timeout 5 s.
2. `reverse_tunnel_proc`: the tunnel PID exists and its command line contains the expected port mapping string, e.g. `18791:127.0.0.1:8791`.
3. `public_health`: GET the public health URL derived from the configured hook URL returns 200 and `"ok": true`. Timeout 10 s.
4. `poller`: read `poller-health.json`. Pass if its timestamp is less than 600 seconds old and `consecutive_failures` is less than 3.
5. `e2e_post`: POST a selftest with a random nonce through the public hook URL. Send a custom User-Agent header (some CDNs block POSTs without one). Pass only if the response is 200 and the echoed `canary` value equals the nonce. Timeout 15 s.

Overall pass requires segments 1, 3, 4 and 5 to pass. Record the list of dead segments with every result.

## Canary Script

Constraints: plain script, no LLM calls, runs every 5 minutes via cron or a hook scheduler.

State file `canary-state.json` fields: `consecutive_fails`, `escalated`, `total_sent`, `total_ok`, `last_ok_at`, `last_latency_ms`, `segments`, `updated_at`.

Algorithm per run:

1. Run the segmented health check and the end-to-end selftest.
2. If overall pass:
   - Increment `total_ok`, reset `consecutive_fails` to 0.
   - If `escalated` was true, emit one recovery notification to the primary operator chat, then set `escalated` to false.
   - Otherwise stay silent. Exit.
3. If fail:
   - Increment `consecutive_fails`. Save dead segments.
   - If `consecutive_fails` equals 2: run `start-all.sh` once, wait 45 seconds, re-run the check once. If the recheck passes, treat as recovery per step 2.
   - If `consecutive_fails` is 6, or (`escalated` is true and `consecutive_fails` is a multiple of 12): emit an escalation notification to the primary operator chat containing the dead segments list and the end-to-end status code. Set `escalated` to true.
   - Otherwise stay silent.

Critical rule: escalation repeats roughly every hour while the outage persists, and recovery is always reported if an escalation happened. A notify-once-then-silent design is a known failure mode.

## start-all.sh Requirements

1. Idempotent full-stack restart: receiver, poller, reverse tunnel, and ensure the home-machine tunnel is running.
2. Single-instance lock at the top, for example with `flock -n` on a lock file. If the lock is held, print a skip message and exit 0. Reason: keeper and canary can both trigger a restart; concurrent restarts collide on the listen port.
3. Before rebinding port 8791, poll until the port is free: try connecting every 0.5 seconds, up to 10 seconds.
4. Recreate the reverse tunnel loop on every run so it picks up fresh egress credentials.

## Keeper Rules

1. A separate keeper may also check health every 5 minutes and call `start-all.sh` on failure.
2. After any restart, wait at least the measured tunnel convergence time before rechecking. For this system that is 45 seconds. Rechecking after 3 seconds produced repeated false failure reports while the stack was actually recovering.
3. The keeper must be enabled. In the source incident the keeper was disabled, which removed the self-healing layer entirely. Add keeper enabled state to the health report.

## Poller Backoff

1. On upstream errors such as `RemoteDisconnected`, apply exponential backoff: start at 30 seconds, double each failure, cap at 300 seconds.
2. After every poll cycle, write `poller-health.json` with: timestamp, `ok` boolean, `consecutive_failures`, `last_ok_at`, `last_error`.
3. The canary reads this file for segment 4. Backoff state must be visible in the health file so backoff is not mistaken for death.

## Sender Fallback Agreement

1. If the sender gets consecutive webhook failures (for example HTTP 502), it writes the message to the cloud mailbox instead.
2. The poller files it normally. Messages survive a full push-path outage.
3. Note: a 502 may leave no trace in the receiver log, which means it died in the tunnel layer. This is why the tunnel segment must appear in segmented health records.

## Known Traps

1. Zombie listener: an old SSH session on the home machine can hold the mapped port forever if the client died half-open and sshd has no ClientAlive configured. Symptom: tunnel process exists, but `curl 127.0.0.1:18791/health` on the home machine fails. Fix: kill the stale session processes, let the tunnel loop bind a new session, verify with the local curl.
2. Rotating egress credentials: a long-lived tunnel loop retries with dead credentials. Symptom: process alive, function dead. Fix: recreate the loop in every full-stack restart.
3. Convergence timing: rechecking too early after restart creates false alarms and restart loops. Measure convergence once and hard-code the wait.
4. Notify-once escalation: if the single notification is lost or delivered to an unwatched channel, the outage becomes invisible. Repeat escalations and always send a recovery notice.

## Incident Timeline Used as Acceptance Test Data (2026-11-01)

1. Around 15:23 local time, receiver and poller processes died. Last accepted message was at 12:03.
2. The keeper was disabled, so no self-healing ran.
3. The canary reported red every 5 minutes (end-to-end 502) but its escalation fired once, to the wrong chat, then stayed silent.
4. The mailbox accumulated 4 messages, unfiled, because the poller was also dead. No message was lost.
5. At 18:38 the user reported the problem. At 18:52 `start-all.sh` restored the stack. Segment checks all passed; a public selftest returned 200; the 4 mailbox messages were filed at 18:52–18:53.
6. Post-incident fixes: repeating escalation to the primary chat, flock plus port-wait in `start-all.sh`, zombie listener cleanup, keeper re-enabled.

## Verification Checklist

After implementation or repair, confirm each item:

- [ ] Local health returns 200 with `"ok": true`.
- [ ] Public health returns 200.
- [ ] Public selftest returns 200 with matching nonce.
- [ ] `poller-health.json` is less than 10 minutes old with `consecutive_failures` equal to 0.
- [ ] Every mailbox message from the outage window has an ACCEPT log line and a filed task.
- [ ] Canary state shows `consecutive_fails` equal to 0.
- [ ] Keeper is in enabled state.
- [ ] A forced failure test shows: repair attempt at 2 consecutive fails, escalation at 6, re-escalation after 12 more, and a recovery notice after the stack returns.

## Optional Structural Upgrade (Evaluation Only)

Consider making pull the primary path and push the accelerator: sender writes to the mailbox, your poller is the main ingestion, and the webhook tunnel only reduces latency. Run both paths in parallel for one week, compare success rate and latency, then decide. Do not migrate without that comparison data.
