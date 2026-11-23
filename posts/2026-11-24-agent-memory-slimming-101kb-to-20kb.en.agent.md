# Cutting Always-On Agent Context by 80% (101 KB to 20 KB) Without Amnesia

When always-on agent instruction files balloon to **101.2 KB** (~25.3K input tokens per turn), every trivial loop pays massive prompt tax and middle-of-context rules quietly get ignored. This guide documents how PlAIground Lab reduced boot context by **79.8%** down to **20.4 KB** using Progressive Disclosure, 5 lazy-loaded domain runbooks, and a deterministic 0-token CI budget gate.

---

## 1. Before vs. After Production Benchmarks

| Metric | Monolithic Boot Context | Pointer Index + 5 Runbooks | Measured Impact |
| --- | --- | --- | --- |
| Total Boot Context | `101.2 KB` (~25.3K tokens) | `20.4 KB` (~5.1K tokens) | `-79.8%` boot size |
| Core Rules (`AGENTS.md`) | `74.7 KB` | `8.9 KB` | `-88.1%`, higher signal |
| Operational Index (`MEMORY.md`) | `25.7 KB` | `10.7 KB` | `-58.4%`, exact SSOT IDs only |
| Domain SOP Loading | Unconditional on every turn | `5` lazy `runbooks/*.md` files | `0 B` off-domain waste |
| Bloat Prevention | Manual discipline | `0-Token` CI byte + line guard | Blocks bloat on PRs |

---

## 2. Architecture Diagram

```text
┌────────────────────────────────────────────────────────────────────┐
│ Tier 1: Always-On Boot Context (<= 24 KB Hard Ceiling)             │
│   ├── AGENTS.md (8.9 KB)  -> Hard rules, role scopes, fail-safes   │
│   ├── MEMORY.md (10.7 KB) -> Exact SSOT IDs + action-pointer table │
└───────────────────────────────┬────────────────────────────────────┘
                                │ Read on demand when trigger matches
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
[docs/runbooks/deploy.md] [docs/runbooks/data.md] [docs/runbooks/ops.md]
        ▲
        │ Every PR / Daily Check (0 LLM Tokens)
┌────────────────────────────────────────────────────────────────────┐
│ Tier 0: scripts/context_watchdog.py — non-zero exit if oversized   │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3. Runnable Implementation

### 3.1 Context Routing & Budget Spec (`context_budget.yaml`)

```yaml
boot_files:
  - path: AGENTS.md
    max_bytes: 12288
    max_lines: 220
  - path: MEMORY.md
    max_bytes: 14336
    max_lines: 260

pointer_routes:
  - trigger: "deploy | pages | release"
    load: "docs/runbooks/deploy-and-smoke.md"
  - trigger: "schema | spreadsheet | ingest"
    load: "docs/runbooks/data-pipeline.md"
  - trigger: "budget | quota | incident"
    load: "docs/runbooks/ops-guardrails.md"
```

### 3.2 Zero-Token Budget Watchdog (`scripts/context_watchdog.py`)

```python
#!/usr/bin/env python3
from pathlib import Path
import sys

BUDGETS = {
    "AGENTS.md": {"max_bytes": 12288, "max_lines": 220},
    "MEMORY.md": {"max_bytes": 14336, "max_lines": 260},
}

def check_repo_budgets(root: Path) -> int:
    failures = []
    for rel, limits in BUDGETS.items():
        target = root / rel
        if not target.exists():
            failures.append(f"MISSING: {rel}")
            continue
        raw = target.read_bytes()
        lines = raw.decode("utf-8", errors="replace").splitlines()
        if len(raw) > limits["max_bytes"]:
            failures.append(f"OVERSIZE: {rel} = {len(raw)} B > {limits['max_bytes']} B")
        if len(lines) > limits["max_lines"]:
            failures.append(f"OVERLINE: {rel} = {len(lines)} lines > {limits['max_lines']}")
        else:
            print(f"OK: {rel} ({len(raw)} B, {len(lines)} lines)")

    if failures:
        for msg in failures:
            print(f"FAIL: {msg}", file=sys.stderr)
        return 1
    return 0

if __name__ == "__main__":
    raise SystemExit(check_repo_budgets(Path(".")))
```

---

## 4. Three Real Pitfalls Fixed

1. **Do not mask canonical SSOT values**: Keep exact canonical IDs and thresholds verbatim inside the index so agents never guess or open stale copies.
2. **Keep SHA-256 rollback snapshots before slimming**: Never overwrite multi-KB rules blindly without an untouched rollback reference.
3. **One-off cleanups decay in two weeks without CI**: Hard byte/line checks force contributors to move prose into `docs/runbooks/`.

---

- Related tool: [ComputeQuote GPU Payback Calculator](https://computequote.plaigroundlab.com/calculator/?utm_source=blog&utm_medium=housead&utm_campaign=memory-slimming)
- Published by PlAIground Lab (2026-11-24)
