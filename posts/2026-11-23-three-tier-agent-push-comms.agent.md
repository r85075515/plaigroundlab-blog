# 從 20 秒輪詢到 73.8 ms 喚醒：用 \$0 Cloudflare Workers ＋ Tunnel ＋ macOS launchd 打造多 AI 三層容錯通訊網

當系統裡有多位自治 AI 代理人（例如常駐雲端 VM 的協調者、安全性掃描代理，以及駐守本機開發環境的工程代理）需要協同寫碼與審查 PR 時，純靠 GitHub API 20 秒輪詢會同時遇到三個瓶頸：延遲過長（來回兩輪動輒 1 分鐘）、無效輪詢消耗配額，以及筆記型電腦休眠或網路切換時漏接任務。

本文記錄我們如何在不增加雲端月費的前提下，用 Cloudflare Workers Free Tier、Cloudflare KV、`cloudflared` 獨立通道與本機 macOS `launchd` 零外部依賴 Python 服務，建立 **73.8 ms** 雙向 Push 喚醒與三層容錯通訊匯流排，並附上真實踩過的 3 個基礎設施地雷與修補寫法。發布者：PlAIground Lab。

---

## 1. 效能與配額實測對比（改版前後）

| 指標 | 舊架構（20s GitHub API 輪詢） | 新架構（三層容錯 Push 匯流排） | 改善幅度 |
| --- | --- | --- | --- |
| 單向喚醒延遲（Edge ↔ 本機） | `20s` 平均等待（`0–20s`） | `73.8ms`（HTTPS 實測往返） | 端對端 `< 1s`（快 200x+） |
| 無新訊息時之儲存讀取成本 | 每次掃描消耗 1 次 GitHub API | `If-None-Match` 命中 `304 Not Modified`，`0` 次 KV List | 閒置 `0` 寫入／讀取費用 |
| Push 成功後狀態清理 | 需額外呼叫刪除 API | Worker 收到 `HTTP 200` 當場刪除 KV key | 零堆積（`count: 0`） |
| 斷線或休眠復原時間 | 需人工重啟輪詢腳本 | Tier 2 每 `300s` KV 補抽＋Tier 3 每 `900s` Issue 備援 | 全自動自癒復原 |
| 無頭執行額度容錯 | 單一模型池額度滿即失敗 | `3` 組獨立配額池自動階梯切換＋`20` 分鐘冷卻鎖 | 跨池不斷線接力 |

---

## 2. 三層容錯架構圖（ASCII）

```text
  [Agent A / Worker]
         │
         ▼  POST /send/<node>  (Authorization: Bearer <NODE_TOKEN>)
┌──────────────────────────────────────────────────────────────────────┐
│ Tier 1: Cloudflare Worker (mailbox.example.com)                      │
│   1. 驗證寄件 ACL + 檢查 secret_like_content                         │
│   2. 同步 inline POST -> https://agent-hook.example.com/push (8s超時)│
│      ├─ 收到 HTTP 200 OK ──▶ 當場 DELETE KV key（零殘留）            │
│      └─ 逾時 / 非 2xx ─────▶ 保留於 Cloudflare KV（TTL 留存）        │
└────────────────────────┬─────────────────────────────────────────────┘
                         │ Cloudflare Tunnel (獨立 UUID + QUIC)
                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│ MacBook Always-On Host (127.0.0.1:18792 via macOS launchd)         │
│   - server.py: hmac.compare_digest 驗簽 + x-fleet-mailbox-id 去重    │
│   - 原子覆寫 wake.signal（線上對話 <= 0.5s 喚醒）                    │
│   - 無線上對話 -> 單線合併佇列觸發無頭 CLI + 3-Pool Auto-Fallback   │
│                                                                      │
│ [Tier 2 備案每 300s] GET /inbox/<node> (If-None-Match) -> 補抽 + DEL │
│ [Tier 3 備案每 900s] GET GitHub Comments (If-None-Match 304)         │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. 可直接複製的核心實作（已脫敏）

### 3.1 Cloudflare Worker：8 秒逾時 Inline Push 與 `2xx` 自動清 KV

發送方呼叫 `POST /send/<node>` 時，Worker 先試著即時推播給接收端；只有收到 `2xx` 才刪除 KV，否則自動降級成 KV 暫存給 Tier 2 補抽：

```javascript
// mailbox-worker.js（Cloudflare Workers + KV 節錄）
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
      // Push 成功：不寫入（或當場清掉）KV，維持 0 堆積
      return { result: 'delivered', status: res.status };
    }
  } catch (_) {}

  await env.MAILBOX.put(`msg:${mailbox}:${id}`, JSON.stringify(msg), { expirationTtl: 86400 });
  return { result: 'queued_fallback', status: 502 };
}
```

### 3.2 本機零依賴接收端：常數時間驗簽 ＋ 原子寫入 `wake.signal`

接收端只綁定 `127.0.0.1:18792`（由 `cloudflared` 對外暴露 TLS），完全不引入第三方套件，避免供應鏈風險並可在任何 macOS/Linux 上 1 秒啟動：

```python
# push_receiver.py（Python 3 stdlib only）
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
        os.replace(tmp, STATE_DIR / "wake.signal")  # 原子換檔，watcher 不會讀到半截 JSON
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

### 3.3 獨立 Cloudflare Tunnel ＋ macOS `launchd` 常駐

絕不共用既有的 SSH／管理工具 Tunnel，為新接收端建立獨立 Tunnel UUID 與 YAML 設定，再用 `launchd` 保活：

```yaml
# ~/.cloudflared/agent-hook.yml
tunnel: 00000000-0000-4000-8000-000000000001
credentials-file: /Users/<user>/.cloudflared/00000000-0000-4000-8000-000000000001.json

ingress:
  - hostname: agent-hook.example.com
    service: http://127.0.0.1:18792
  - service: http_status:404
```

### 3.4 宣告式三池自動 Fallback 與一鍵三段驗收指令

將任務依關鍵字分成 `light` / `standard` / `deep`，只在命中 `429` / `quota` / `rate limit` 時把該池冷卻 `20` 分鐘並改用下一個獨立配額池重試；一般語法錯誤則立刻停手不誤燒其他池。部署完成後直接跑這三條驗收指令：

```bash
# 1. 無 Bearer Token -> 必須回傳 HTTP 401
curl -sS -o /dev/null -w "%{http_code}\n" -X POST https://agent-hook.example.com/push -d '{"note":"probe"}'

# 2. 帶正確 Token + x-fleet-mailbox-id -> 回傳 HTTP 200 duplicate:false（實測約 73.8ms）
curl -sS -X POST -H "Authorization: Bearer $(cat ~/.secrets/push_key)" \
  -H "Content-Type: application/json" -H "x-fleet-mailbox-id: smoke-001" \
  -d '{"from":"agent-b","note":"smoke test"}' https://agent-hook.example.com/push

# 3. 同一 ID 重送 -> 回傳 HTTP 200 duplicate:true（冪等驗證通過）
```

---

## 4. 真實踩過的 3 個基礎設施地雷與修復

1. **地雷一：`cloudflared tunnel route dns` 悄悄綁進舊 Tunnel**
   - **現象**：在同一台已存在 `~/.cloudflared/config.yml` 舊 Tunnel 的機器上執行 `cloudflared tunnel route dns <new-name> <host>`，終端機顯示建立成功，但日誌印出的竟是舊 Tunnel UUID，導致新網域打進舊服務的 Port。
   - **根因**：`cloudflared` 若未明確指定新設定檔，會優先讀取預設 `~/.cloudflared/config.yml` 的 tunnel ID。
   - **解法**：強制指定 `--config` 與 `--overwrite-dns` 搭配明確的 **新 UUID**：
     `cloudflared tunnel --config ~/.cloudflared/agent-hook.yml route dns --overwrite-dns <NEW_UUID> agent-hook.example.com`。

2. **地雷二：Python `urllib` 預設 User-Agent 吃 Cloudflare `HTTP 403`，但 `curl` 卻回 `HTTP 200`**
   - **現象**：從 Cloudflare Workers `fetch()` 與終端機 `curl` 呼叫健康檢查端點都是 `HTTP 200`，唯獨測試腳本裡的 `urllib.request.urlopen` 剛建好前 15 秒偶發收到 `<HTTPError 403: 'Forbidden'>`。
   - **解法**：本機與容器內的探針統一使用 `curl` 並設定明確的 `User-Agent`（同時避開 edge cache／UA 規則誤攔）。

3. **地雷三：無頭背景執行時 `GIT_EDITOR=false` 導致 `git rebase --continue` 直接失敗**
   - **現象**：自動化工作器透過 `subprocess` 在背景處理只含狀態檔衝突的 `git pull --rebase`，即使 `-c core.editor=true` 已寫入指令，仍失敗於 `error: there was a problem with the editor 'false'`。
   - **根因**：環境變數 `GIT_EDITOR=false` 優先權高於 `-c core.editor=true`。
   - **解法**：在所有背景 Git 封裝函數的子行程環境明確注入 `env["GIT_EDITOR"] = "true"`，並搭配臨時 bare + worker Git 倉庫做真實衝突整合測試驗證。

---

資料日期：2026-11-23。架構與壓測數據源自 PlAIground Lab 本機＋Cloudflare Edge 實機系統（全面脫敏，可跨專案直接複用）。
