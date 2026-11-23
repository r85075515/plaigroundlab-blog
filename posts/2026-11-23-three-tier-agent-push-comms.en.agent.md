# From 20-Second Polling to 73.8ms Push Wakeups: Building a \$0 Three-Tier Self-Healing Agent Bus with Cloudflare Workers, Tunnel, and macOS launchd

When multiple autonomous AI agents coordinate across cloud VMs and a local always-on workstation (reviewing PRs, running tests, guarding security policies), naive 20-second GitHub API polling suffers from three compounding bottlenecks: high round-trip latency, wasted API/storage operations on idle loops, and dropped handoffs whenever the workstation sleeps or an edge tunnel reconnects.

This post documents how we built a **73.8ms** bidirectional push bus with 3-tier automatic self-healing and 3-pool LLM quota fallback—running entirely on Cloudflare Workers Free Tier, Cloudflare KV, an isolated `cloudflared` tunnel, and zero-dependency Python stdlib managed by macOS `launchd`. Includes runnable code and three real infrastructure gotchas caught in production. Publisher: PlAIground Lab.

---

## 1. Before vs. After Production Benchmarks

| Metric | Legacy (20s GitHub API Polling) | V2.0 (3-Tier Resilient Push Bus) | Improvement |
| --- | --- | --- | --- |
| Delivery Latency (Edge → Local) | `20s` polling interval (`0–20s`) | `73.8ms` HTTPS round-trip measured | `< 1s` end-to-end wakeup (>200x faster) |
| Idle Storage Reads | Every poll hits list endpoints | `If-None-Match` returns `304 Not Modified` (`0` KV ops) | Zero wasted reads during idle hours |
| Post-Delivery Cleanup | Separate delete round-trip | Worker deletes KV key immediately on `HTTP 200` | `0` pending backlog (`count: 0`) |
| Offline / Tunnel Outage Recovery | Manual script restart | Tier 2 KV drain every `300s` + Tier 3 Issue ETag every `900s` | Fully autonomous self-healing |
| Headless Model Quota Resilience | Single pool exhaustion stalls task | `3` independent quota pools + `20` min cooldown ladder | Uninterrupted cross-pool failover |

---

## 2. Three-Tier Failover Architecture

```text
  [Agent A / Cloud Worker]
         │
         ▼  POST /send/<node>  (Authorization: Bearer <NODE_TOKEN>)
┌──────────────────────────────────────────────────────────────────────┐
│ Tier 1: Cloudflare Worker (mailbox.example.com)                      │
│   1. Verify sender ACL + secret_like_content guard                   │
│   2. Inline POST -> https://agent-hook.example.com/push (8s timeout) │
│      ├─ HTTP 200 OK ──▶ Immediate KV cleanup (zero backlog)          │
│      └─ Timeout / 5xx ─▶ Persist in Cloudflare KV for Tier 2 drain   │
└────────────────────────┬─────────────────────────────────────────────┘
                         │ Isolated Cloudflare Tunnel (QUIC)
                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Always-On Host (127.0.0.1:18792 via macOS launchd)                   │
│   - server.py: hmac.compare_digest auth + x-fleet-mailbox-id dedupe  │
│   - Atomic os.replace -> wake.signal (active chat wakes <= 0.5s)     │
│   - Idle headless queue -> 3-Pool ModelRouter auto-fallback          │
│                                                                      │
│ [Tier 2 Every 300s] GET /inbox/<node> (If-None-Match) -> drain + DEL │
│ [Tier 3 Every 900s] GitHub Comments ETag Watcher (0 quota on 304)    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Runnable Implementation Snippets (Desensitized)

### 3.1 Cloudflare Worker: 8s Inline Push with Auto KV Cleanup

On `POST /send/<node>`, the Worker attempts synchronous inline delivery with `AbortSignal.timeout(8000)`. If the tunnel returns `2xx`, nothing accumulates in KV; if offline, the payload stays queued for Tier 2 recovery:

```javascript
// mailbox-worker.js (Cloudflare Workers + KV excerpt)
const PUSH_TIMEOUT_MS = 8000;

async function deliverOrQueue(env, mailbox, id, msg) {
  const pushUrl = env[`${mailbox.toUpperCase()}_PUSH_URL`];
  const pushKey = env[`${mailbox.toUpperCase()}_PUSH_KEY`];
  if (!pushUrl || !pushKey) {
    await env.MAILBOX.put(`msg:${mailbox}:${id}`, JSON.stringify(msg), { expirationTtl: 86400 });
    return { result: 'queued_kv', status: null };
  }

  try {
    const res = await fetch(pushUrl, {
      method: 'POST',
      redirect: 'manual',
      signal: AbortSignal.timeout(PUSH_TIMEOUT_MS),
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${pushKey}`,
        'x-fleet-mailbox-id': id,
      },
      body: JSON.stringify(msg),
    });
    if (res.ok) {
      return { result: 'delivered', status: res.status };
    }
  } catch (_) {}

  await env.MAILBOX.put(`msg:${mailbox}:${id}`, JSON.stringify(msg), { expirationTtl: 86400 });
  return { result: 'queued_fallback', status: 502 };
}
```

### 3.2 Zero-Dependency Local Receiver: Constant-Time Auth + Atomic Signal

Bound strictly to loopback (`127.0.0.1:18792`) behind TLS termination in `cloudflared`, requiring zero external Python packages:

```python
# push_receiver.py (Python 3 stdlib only)
import hmac
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

STATE_DIR = Path(os.path.expanduser("~/.agent-receiver/state"))
PUSH_KEY = Path(os.path.expanduser("~/.secrets/push_key")).read_text(encoding="utf-8").strip()
SEEN_IDS = set()

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/push":
            return self._json(404, {"ok": False, "error": "not_found"})
        auth = (self.headers.get("Authorization") or "").split(None, 1)
        if len(auth) != 2 or auth[0].lower() != "bearer" or not hmac.compare_digest(auth[1], PUSH_KEY):
            return self._json(401, {"ok": False, "error": "unauthorized"})

        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > 16384:
            return self._json(400, {"ok": False, "error": "invalid_payload_size"})

        payload = json.loads(self.rfile.read(length).decode("utf-8"))
        msg_id = (self.headers.get("x-fleet-mailbox-id") or payload.get("id") or "").strip()
        if msg_id and msg_id in SEEN_IDS:
            return self._json(200, {"ok": True, "duplicate": True, "id": msg_id})

        STATE_DIR.mkdir(parents=True, exist_ok=True)
        tmp = STATE_DIR / "wake.signal.tmp"
        tmp.write_text(json.dumps(payload, ensure_ascii=False) + "\n", encoding="utf-8")
        os.replace(tmp, STATE_DIR / "wake.signal")  # atomic swap prevents partial reads
        if msg_id:
            SEEN_IDS.add(msg_id)
        return self._json(200, {"ok": True, "duplicate": False, "id": msg_id})

    def _json(self, status: int, obj: dict):
        raw = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

ThreadingHTTPServer(("127.0.0.1", 18792), Handler).serve_forever()
```

### 3.3 Isolated Cloudflare Tunnel Configuration

Keep each daemon on its own dedicated Tunnel UUID and port so agent webhooks never interfere with existing SSH or admin tunnels:

```yaml
# ~/.cloudflared/agent-hook.yml
tunnel: 00000000-0000-4000-8000-000000000001
credentials-file: /Users/<user>/.cloudflared/00000000-0000-4000-8000-000000000001.json

ingress:
  - hostname: agent-hook.example.com
    service: http://127.0.0.1:18792
  - service: http_status:404
```

### 3.4 Three-Step End-to-End Smoke Verification

Verify authentication rejection (`HTTP 401`), live push (`HTTP 200`, measured `73.8ms`), and idempotent deduplication (`duplicate: true`) right after bootstrapping `launchd`:

```bash
# 1. Missing token -> expect HTTP 401
curl -sS -o /dev/null -w "%{http_code}\n" -X POST https://agent-hook.example.com/push -d '{"note":"probe"}'

# 2. Valid Bearer + x-fleet-mailbox-id -> expect HTTP 200 duplicate:false (~73.8ms)
curl -sS -X POST -H "Authorization: Bearer $(cat ~/.secrets/push_key)" \
  -H "Content-Type: application/json" -H "x-fleet-mailbox-id: smoke-001" \
  -d '{"from":"agent-b","note":"smoke test"}' https://agent-hook.example.com/push

# 3. Replay identical ID -> expect HTTP 200 duplicate:true
```

---

## 4. Three Production Pitfalls & Exact Fixes

1. **`cloudflared tunnel route dns` silently bound to an existing tunnel UUID**
   - **Symptom**: Running `cloudflared tunnel route dns <new-name> <host>` reported success while routing the hostname to the pre-existing tunnel UUID defined in `~/.cloudflared/config.yml`.
   - **Fix**: Pass explicit `--config`, `--overwrite-dns`, and the explicit new UUID:
     `cloudflared tunnel --config ~/.cloudflared/agent-hook.yml route dns --overwrite-dns <NEW_UUID> agent-hook.example.com`.

2. **Cloudflare Edge WAF returned `HTTP 403` to Python `urllib` while `curl` and Workers `fetch()` returned `HTTP 200`**
   - **Fix**: Standardize outbound probes in fallback scripts on `curl` with explicit `User-Agent` headers rather than bare `urllib.request`.

3. **Headless daemon `GIT_EDITOR=false` broke `git rebase --continue`**
   - **Symptom**: Even with `git -c core.editor=true rebase --continue`, background workers failed with `error: there was a problem with the editor 'false'`, because `GIT_EDITOR` env overrides `-c core.editor`.
   - **Fix**: Force `env["GIT_EDITOR"] = "true"` inside the runner's headless git subprocess wrapper and add a real temporary bare-repo conflict integration test.

---

Date: 2026-11-23. Benchmarks measured on PlAIground Lab production infrastructure (desensitized for direct reuse).
