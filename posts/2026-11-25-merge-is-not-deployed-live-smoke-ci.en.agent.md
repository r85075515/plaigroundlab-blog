# Merged Is Not Shipped: Building a Zero-Token Post-Merge Live Smoke CI

A green merge button proves source history updated—not that public visitors see a live page. Across a multi-site static fleet, missing `push` triggers produced **`HTTP 404`** on new sub-routes while unlinked DNS/Pages produced **`HTTP 000`**. Here is a zero-dependency live smoke CI pattern that eliminates deployment drift in under `2s`.

---

## 1. Failure Matrix Observed in Static Fleets

| Failure Mode | Live HTTP Code | Root Cause | Automated Guard |
| --- | --- | --- | --- |
| Cross-repo build skipped | `HTTP 404` | Workflow lacked `push` + `paths: ['web/**']` | Auto-build on `main` push |
| Private repo / unlinked DNS | `HTTP 000` | Pages disabled or DNS missing | Commit `CNAME` + live URL probe |
| `rsync --delete` wipes CNAME | `HTTP 404` / drop | Build `dist/` omitted CNAME | Place `CNAME` inside `public/` |
| Empty shell page | `HTTP 200` (false positive) | Probe checked code only | Assert required marker text |

---

## 2. Pipeline Diagram

```text
[PR Merged to main] --(paths: web/**)--> [Build & Push Pages] --(30s edge settle)--> [live_smoke.py (0-Token)]
                                                                                          ├── 200 + Marker -> PASS
                                                                                          └── 404 / 000    -> FAIL (exit 1)
```

---

## 3. Runnable Code (Stdlib + GitHub Actions)

### 3.1 `scripts/live_smoke.py`

```python
#!/usr/bin/env python3
from dataclasses import dataclass
import sys, time, urllib.error, urllib.request

@dataclass(frozen=True)
class SmokeTarget:
    name: str
    url: str
    expected_status: int = 200
    required_marker: str = ""

TARGETS = [
    SmokeTarget("Portal", "https://plaigroundlab.com/", 200, "PlAIground Lab"),
    SmokeTarget("Blog", "https://blog.plaigroundlab.com/", 200, "AI Geek Blog"),
    SmokeTarget("ComputeQuote", "https://computequote.plaigroundlab.com/", 200, "ComputeQuote"),
    SmokeTarget("Calculator", "https://computequote.plaigroundlab.com/calculator/", 200, "Payback Calculator"),
]

def probe(target: SmokeTarget, timeout: float = 12.0) -> bool:
    req = urllib.request.Request(target.url, headers={"User-Agent": "PlAIgroundLab-LiveSmoke/1.0"})
    t0 = time.monotonic()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status = int(resp.getcode() or 0)
            body = resp.read().decode("utf-8", errors="replace")
            ms = round((time.monotonic() - t0) * 1000.0, 1)
            ok = (status == target.expected_status) and (target.required_marker.lower() in body.lower())
            print(f"[{'PASS' if ok else 'FAIL'}] {status} ({ms}ms) {target.name} -> {target.url}")
            return ok
    except urllib.error.HTTPError as e:
        print(f"[FAIL] {e.code} {target.name} -> {target.url}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"[FAIL] 000 ({e}) {target.name} -> {target.url}", file=sys.stderr)
        return False

if __name__ == "__main__":
    raise SystemExit(0 if all(probe(t) for t in TARGETS) else 1)
```

### 3.2 `.github/workflows/publish-site.yml`

```yaml
on:
  workflow_dispatch: {}
  push:
    branches: [main]
    paths: ["web/**"]
jobs:
  deploy-and-verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd web && npm ci && npm run build
      - run: sleep 30 && python3 scripts/live_smoke.py
```

---

## 4. Three Real Gotchas

1. **Missing `workflow` PAT scope**: Always include a fallback when shipping workflow edits via PR automation.
2. **Default `Python-urllib` hits edge `HTTP 403`**: Always set an explicit custom `User-Agent` header.
3. **Missing `paths:` filters waste CI minutes**: Gate builds strictly on frontend source paths.

---

- Related: [PlAIground Lab Tools Portal](https://plaigroundlab.com/?utm_source=blog&utm_medium=housead&utm_campaign=live-smoke-ci)
- Published by PlAIground Lab (2026-11-25)
