# 把 AI 代理人常駐記憶從 101 KB 砍到 20 KB 卻不失憶：漸進式揭露與防復胖哨兵實戰

當 AI 代理人的常駐設定檔膨脹到 **101.2 KB**（每輪約 25.3K tokens）時，不但白白消耗推論額度與延遲，關鍵硬規則更容易因上下文過長而被忽略。本文整理 PlAIground Lab 如何透過 **漸進式指標架構（Progressive Disclosure）＋ 5 份按需 Runbook ＋ 0-Token CI 預算哨兵**，把常駐載入壓縮 **79.8%** 至 **20.4 KB** 且零規則遺失。

---

## 1. 瘦身前後實測數據對比

| 指標 | 瘦身前（單體常駐檔） | 瘦身後（指標索引＋Runbooks） | 實測效果 |
| --- | --- | --- | --- |
| 常駐總容量 | `101.2 KB`（~25.3K tokens） | `20.4 KB`（~5.1K tokens） | `-79.8%` 啟動載入 |
| 核心規則檔（AGENTS） | `74.7 KB` | `8.9 KB` | `-88.1%`、紅線更聚焦 |
| 長期記憶索引（MEMORY） | `25.7 KB` | `10.7 KB` | `-58.4%`、僅留 SSOT 指標 |
| 領域細節載入 | 每輪無條件全灌 | `5` 份 `runbooks/*.md` 按需讀取 | 無關領域 `0 B` 浪費 |
| 防復胖控制 | 人工口頭約束 | `0-Token` Watchdog + PR CI 阻擋 | 超限即刻拒絕合併 |

---

## 2. 漸進式揭露架構圖

```text
┌────────────────────────────────────────────────────────────────────┐
│ Tier 1: Always-On Boot Context (<= 24 KB 硬上限)                   │
│   ├── AGENTS.md (8.9 KB)  -> 不可妥協紅線、分工邊界、退避機制      │
│   ├── MEMORY.md (10.7 KB) -> 單一正本指標 + 「場景 -> Runbook」表  │
└───────────────────────────────┬────────────────────────────────────┘
                                │ 命中特定任務關鍵字時才按需讀取
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
[docs/runbooks/deploy.md] [docs/runbooks/data.md] [docs/runbooks/ops.md]
        ▲
        │ 每次 PR / 每日排程 (0 Tokens)
┌────────────────────────────────────────────────────────────────────┐
│ Tier 0: context_watchdog.py — 超過 max_bytes / max_lines 直接 FAIL  │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3. 可直接複製之核心程式碼（已全面脫敏）

### 3.1 預算與指標路由設定 (`context_budget.yaml`)

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

### 3.2 0-Token 防復胖哨兵 (`scripts/context_watchdog.py`)

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

## 4. 三個真實地雷與解法

1. **禁止遮罩 SSOT 真值**：搬移說明段落到 Runbook 時，正本 ID 與關鍵數值必須原樣留在索引，避免代理人讀取錯誤副本。
2. **異動前先留 SHA-256 不可變快照**：確保萬一抽離過度可精準比對還原。
3. **沒有 CI 硬閘門就會兩週內復胖**：必須把 `max_bytes` 寫進 PR 必過檢查腳本，把規則抽離轉成結構強制力。

---

- 延伸工具：[ComputeQuote GPU 回本試算表](https://computequote.plaigroundlab.com/calculator/?utm_source=blog&utm_medium=housead&utm_campaign=memory-slimming)
- 發布者：PlAIground Lab（日期：2026-11-24）
