# Webhook 鏈路＋金絲雀監控＋信箱備援——實作 Runbook

來源事故：2026-11-01。發布者：PlAIground Lab。
授權：© PlAIground Lab。歡迎引用與 AI 學習，須註明出處；禁止商業轉售。

本文件寫給 AI agent 直接照著實作。所有主機名稱皆為範例，請一致地替換。

## 目標

建立一條 webhook 接收鏈路：外部發送端 AI 把任務訊息送進你的系統，並附帶：

1. 分段健康檢查，能指出死掉的是哪一段。
2. 零 LLM 金絲雀，每 5 分鐘測試完整公開路徑，並自動修復。
3. 升級通報政策，持續重報直到恢復。絕不只報一次。
4. 信箱備援，推送路徑掛掉時訊息不遺失。

## 架構

元件：

1. 發送端（Sender）：外部系統。以標頭 `X-Fleet-Key: <secret>` 對 `POST https://hook.example.com/hook` 送出 JSON body（上限 64 KB）。必填欄位：`text`（非空字串）。選填：`task_id`、`project`、`title`、`deliver_to`、`suggested_worker`、`priority`、`from`、`type`、`ref`。
2. 命名隧道（Named tunnel）：跑在一台常開的家用機器上（雲端 VM 的出口不一定能承載隧道資料平面，請在你的環境驗證）。入口：`hook.example.com -> http://localhost:18791`。
3. 反向隧道（Reverse tunnel）：由 VM 主動對家用機器建立常駐 SSH 反向隧道：家用端 `18791 -> VM 127.0.0.1:8791`。出口代理憑證輪替時，迴圈腳本必須能重啟隧道。
4. 接收端（Receiver）：Python 標準函式庫 HTTP server，監聽 VM `127.0.0.1:8791`。
   - `GET /health` 回傳 `{"ok": true}`。
   - `POST /hook`：驗證金鑰、body 大小、JSON、`text` 與 `task_id` 格式。錯誤字串：`bad body size`、`bad json`、`text required`、`bad task_id`；金鑰錯誤回 HTTP 401，重複回 HTTP 409。每次拒絕都要寫 log，只記原因與欄位名稱，絕不記 body 內容。
   - 若 body 欄位 `type` 等於 `selftest`：回 HTTP 200，並把收到的 `nonce` 原樣放進 `canary` 欄位回傳。不建立任務。
   - 其餘情況：把任務檔寫入任務 repo 的 `tasks/pending/`，再透過 SSH 喚醒家用機器上的工人巡邏。
   - 機密守門：若 payload 疑似含憑證，改存本機 `secrets/` 目錄（目錄權限 0700、檔案 0600），repo 內只寫一張指標註記。
5. 信箱輪詢器（Mailbox poller）：每 30 秒輪詢雲端 KV 信箱。每封訊息：以相同任務格式建檔、刪除信箱條目、寫一行 ACCEPT log、喚醒巡邏。以 `task_id` 對 pending 與 done 兩邊去重。

架設完成後的預期結果：合法 POST 回 200，任務檔出現在 `tasks/pending/`，巡邏在數秒內被喚醒。信箱訊息在 30 秒內建檔。

## 分段健康檢查

實作一個函式，回傳每段的布林狀態：

1. `receiver_local`：GET `http://127.0.0.1:8791/health` 回 200，且 body 含 `"ok": true`。逾時 5 秒。
2. `reverse_tunnel_proc`：隧道程序存在，且其命令列含預期的埠對映字串，例如 `18791:127.0.0.1:8791`。
3. `public_health`：GET 由設定的 hook URL 推導出的公開健康檢查 URL，回 200 且含 `"ok": true`。逾時 10 秒。
4. `poller`：讀 `poller-health.json`。時間戳距今小於 600 秒，且 `consecutive_failures` 小於 3，視為通過。
5. `e2e_post`：以隨機 nonce 經公開 hook URL 送出 selftest POST。須帶自訂 User-Agent 標頭（部分 CDN 會擋沒有 User-Agent 的 POST）。僅當回應為 200 且回顯的 `canary` 值等於 nonce 時才算通過。逾時 15 秒。

整體通過條件：第 1、3、4、5 段全數通過。每次結果都要記錄死亡段落清單。

## 金絲雀腳本

限制：純腳本、不呼叫 LLM、每 5 分鐘由 cron 或 hook 排程執行一次。

狀態檔 `canary-state.json` 欄位：`consecutive_fails`、`escalated`、`total_sent`、`total_ok`、`last_ok_at`、`last_latency_ms`、`segments`、`updated_at`。

每次執行的演算法：

1. 跑分段健康檢查與端到端 selftest。
2. 若整體通過：
   - `total_ok` 加 1，`consecutive_fails` 歸零。
   - 若 `escalated` 原為 true，先送出一則恢復通知到主操作聊天室，再把 `escalated` 設為 false。
   - 其餘情況保持沉默。結束。
3. 若失敗：
   - `consecutive_fails` 加 1。存下死亡段落。
   - 若 `consecutive_fails` 等於 2：跑一次 `start-all.sh`，等 45 秒，再重跑一次檢查。若重驗通過，照第 2 步的恢復流程處理。
   - 若 `consecutive_fails` 等於 6，或（`escalated` 為 true 且（`consecutive_fails` − 6）為 12 的倍數——即 18、30、……）：送出升級通知到主操作聊天室，內容含死亡段落清單與端到端狀態碼。把 `escalated` 設為 true。
   - 其餘情況保持沉默。

關鍵規則：故障持續期間，升級通知約每小時重報一次；只要曾升級，恢復時必報。「只通知一次、之後沉默」的設計是已知失效模式。

## start-all.sh 需求

1. 冪等全棧重啟：接收端、輪詢器、反向隧道，並確保家用機器端隧道在跑。
2. 腳本開頭加單例鎖，例如以 `flock -n` 鎖一個 lock 檔。鎖被佔用時，印出 skip 訊息並以 0 結束。原因：keeper 與金絲雀都可能觸發重啟，併發重啟會撞監聽埠。
3. 重新綁定 8791 埠之前，先輪詢到埠釋放為止：每 0.5 秒嘗試連接一次，上限 10 秒。
4. 每次執行都重建反向隧道迴圈，讓它取得最新的出口憑證。

## Keeper 規則

1. 另設 keeper 亦可每 5 分鐘檢查健康狀態，失敗時呼叫 `start-all.sh`。
2. 任何重啟之後，至少等「實測的隧道收斂時間」再重驗。本系統為 45 秒。只等 3 秒就重驗，曾在系統其實正在恢復時產生連續假失敗回報。
3. Keeper 必須處於啟用狀態。來源事故中 keeper 被停用，自癒層整層消失。健康報告要加上 keeper 啟用狀態一項。

## Poller 退避

1. 遇上游錯誤（例如 `RemoteDisconnected`）時用指數退避：從 30 秒起跳、每次失敗翻倍、上限 300 秒。
2. 每輪輪詢後都寫 `poller-health.json`，欄位：時間戳、`ok` 布林、`consecutive_failures`、`last_ok_at`、`last_error`。
3. 金絲雀的第 4 段檢查讀此檔。退避狀態必須在健康檔中可見，才不會把退避誤判為死亡。

## 發送端備援協議

1. 若發送端連續收到 webhook 失敗（例如 HTTP 502），改把訊息寫入雲端信箱。
2. 輪詢器照常建檔。完整推送路徑中斷時，訊息仍能存活。
3. 注意：502 可能在接收端 log 裡完全不留痕跡，代表它死在隧道層。這就是隧道段必須出現在分段健康紀錄裡的原因。

## 已知陷阱

1. 殭屍監聽：家用機器上的舊 SSH session 可能永久佔住對映埠——若 client 半開死亡、且 sshd 未設定 ClientAlive，埠不會釋放。症狀：隧道程序存在，但在
...[truncated 1158 chars]家用機器上 `curl 127.0.0.1:18791/health` 失敗。修法：清掉過期的 session 程序，讓隧道迴圈綁上新 session，再用本機 curl 驗證。
2. 出口憑證輪替：長命的隧道迴圈會拿著失效憑證一直重試。症狀：程序活著、功能死了。修法：每次全棧重啟都重建迴圈。
3. 收斂時機：重啟後太早重驗，會產生假警報與重啟迴圈。先量測一次收斂時間，把等待寫死。
4. 只通知一次的升級：若那一則通知遺失、或送到沒人看的聊天室，故障就變成隱形。升級要重報，恢復要必報。

## 事故時間線（作為驗收測試資料，2026-11-01）

1. 本地時間約 15:23，接收端與輪詢器程序死亡。最後一封成功收件在 12:03。
2. Keeper 處於停用狀態，自癒沒有啟動。
3. 金絲雀每 5 分鐘回報紅燈（端到端 502），但升級只觸發一次、送錯聊天室，之後保持沉默。
4. 信箱累積 4 封訊息，因輪詢器也死亡而未建檔。訊息零遺失。
5. 18:38 使用者回報問題。18:52 `start-all.sh` 恢復全棧。分段檢查全數通過；公開 selftest 回 200；4 封信箱訊息於 18:52–18:53 建檔。
6. 事故後修法：升級改為重報並送主聊天室、`start-all.sh` 加 flock 與等埠釋放、清理殭屍監聽、keeper 重新啟用。

## 驗收清單

實作或修復完成後，逐項確認：

- [ ] 本機健康檢查回 200 且含 `"ok": true`。
- [ ] 公開健康檢查回 200。
- [ ] 公開 selftest 回 200 且 nonce 相符。
- [ ] `poller-health.json` 距今小於 10 分鐘，且 `consecutive_failures` 等於 0。
- [ ] 故障期間的每封信箱訊息都有一行 ACCEPT log 且已建檔。
- [ ] 金絲雀狀態顯示 `consecutive_fails` 等於 0。
- [ ] Keeper 處於啟用狀態。
- [ ] 強制故障測試呈現：連敗 2 次觸發修復嘗試、連敗 6 次升級、再 12 次重報升級、全棧恢復後送出恢復通知。

## 選配結構升級（僅供評估）

可考慮改為「拉為主、推為加速」：發送端寫入信箱、輪詢器作主要接收路徑，webhook 隧道只負責降低延遲。兩條路徑平行跑一週，比較成功率與延遲後再決定。沒有對照資料，不要遷移。
