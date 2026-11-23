# PR 合併不等於上線：替多站靜態架構打造 0-Token 合併後活頁煙霧測試

原始碼倉庫合併了 PR，不代表公開網域看得到頁面。我們在全站實測時曾抓到兩個真實斷鏈：跨倉庫建置缺 `push` 觸發導致新頁面回 **`HTTP 404`**，以及 DNS/Pages 未開通導致新網域直接回 **`HTTP 000`**。本文提供一套 **0-Token、零外部依賴的合併後活頁煙霧測試架構**。

---

## 1. 常見靜態部署失敗模式矩陣

| 異常模式 | 實測狀態碼 | 根因 | 自動防線 |
| --- | --- | --- | --- |
| 跨庫建置未自動觸發 | `HTTP 404` | Workflow 缺 `push` + `paths: ['web/**']` | 合併即自動建置發布 |
| 私人庫或 DNS CNAME 未通 | `HTTP 000` | Pages 未開啟或漏 CNAME | `CNAME` 入版控＋煙霧清單必查 |
| `rsync --delete` 誤清根檔 | `HTTP 404` | Dist 遺漏靜態資產 | 放進 `public/` 自動複製 |
| 空白殼／殘留頁 | `HTTP 200`（假正常） | 只測 HTTP 200 不測內容 | 同步斷言 DOM 關鍵字串 |

---

## 2. 流程架構圖

```text
[PR Merged to main] --(paths: web/**)--> [Build & Push Pages Repo] --(wait 30s)--> [live_smoke.py (0-Token)]
                                                                                       ├── 200 + Marker -> PASS
                                                                                       └── 404 / 000    -> FAIL (exit 1)
```

---

## 3. 核心程式碼（Python Stdlib + GitHub Actions）

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

## 4. 三個真實地雷

1. **PAT 缺 `workflow` scope 卡住 PR**：腳本應準備只附 diff 的備案，別讓前端修補因權限不足無法合併。
2. **Python 預設 User-Agent 吃邊緣 WAF `HTTP 403`**：永遠在健康探針內附明確 `User-Agent`。
3. **無 `paths:` 過濾白燒分鐘數**：用 `paths: ["web/**"]` 確保只於前端變更時重編建置。

---

- 延伸工具：[PlAIground Lab 全站產品入口](https://plaigroundlab.com/?utm_source=blog&utm_medium=housead&utm_campaign=live-smoke-ci)
- 發布者：PlAIground Lab（日期：2026-11-25）
