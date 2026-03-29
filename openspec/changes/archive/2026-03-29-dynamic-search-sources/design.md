## Context

目前系統的四個 scraper（javbus、javdb、avsox、javlib）以硬編碼方式存在於 Python 模組，`dispatcher.py` 固定平行呼叫全部來源並以固定優先順序合併結果。這個設計對無效請求（被封鎖的來源）沒有保護，也無法從 UI 管理。

本次重構目標是讓來源設定成為「資料」而非「程式碼」，同時保留現有 scraper 的解析邏輯。

## Goals / Non-Goals

**Goals:**
- 搜尋來源設定存入 DB，可從 UI 進行 CRUD
- Dispatcher 動態讀取來源，按 weight 決定執行策略
- 連續失敗超過 barrier 後自動冷卻，降低無效請求
- 支援 CSS Selectors 模式讓開發者新增任意網站
- Preset 機制讓用戶一鍵匯入推薦來源

**Non-Goals:**
- AI 自動解析模式（未來可擴充，此版本不實作）
- 用戶可手動解除冷卻（初版自動管理即可）
- 分類/分群權重（來源層級的全局權重已足夠）
- 請求代理/VPN 整合

## Decisions

### D1：解析模式分為 builtin 與 selectors

**決策**：`parse_mode` 欄位支援兩種值：
- `builtin`：保留現有 `javbus.py`、`javdb.py` 等 Python 模組的解析邏輯，以 `builtin_key` 字串對應
- `selectors`：由用戶提供 JSON 格式的 CSS selector 設定，dispatcher 以通用解析引擎執行

**理由**：現有四個 scraper 的解析邏輯已穩定且精準，沒有必要重寫；`selectors` 模式讓開發者在不修改 Python 的情況下新增任意網站。兩種模式共存，未來可再增加 `ai` 模式。

**Alternative considered**：全部改成 selectors——風險是現有解析精準度下降，不值得。

---

### D2：存取模式分為 direct 與 search

**決策**：每個來源有 `access_mode`：
- `direct`：直接以 `{base_url}/{code}` 存取詳情頁（如 javbus）
- `search`：先至 `search_url_pattern` 取得搜尋結果，再用 `result_link_selector` 找到並跟進詳情頁連結（如 javdb）

**理由**：兩種存取模式對應真實網站的差異，且 search 模式需要額外的 `result_link_selector` 與 `result_code_selector` 來比對正確結果。

---

### D3：Weight 以成功率計算，Cooldown 以連續失敗計

**決策**：
- `weight = successes / attempts`（成功率，0.0–1.0）
- 新來源預設 weight = 1.0（給予初始信任，避免從不使用）
- `consecutive_failures >= barrier` 時設定 `cooldown_until = now + cooldown_duration`
- `barrier` 和 `cooldown_duration` 為全域設定（初版 hardcode：barrier=5, cooldown=30分鐘）
- Cooldown 自動到期，無需手動干預

**Alternative considered**：衰減加權平均——過於複雜，且對用戶不透明。

---

### D4：Dispatcher 執行策略——過濾後平行

**決策**：每次 `fetch_metadata` 時：
1. 從 DB 讀取所有 enabled 來源
2. 排除 `cooldown_until > now` 的來源
3. 剩餘來源按 weight 降序排列
4. 全部平行執行（保留現有平行語意）
5. 合併時以 weight 高的來源欄位優先（取代固定優先順序）

**理由**：平行執行保持速度；冷卻過濾減少無效請求；weight 決定合併優先順序讓系統自我學習。

---

### D5：Preset 定義為 JSON，儲存於 backend

**決策**：`backend/scrapers/presets/jav_databases.json` 存放推薦來源設定。匯入 API 讀取此檔案並批次寫入 DB（已存在的來源 by name 跳過）。前端首次進入搜尋來源 Tab 時，若來源列表為空則顯示匯入提示。

---

### D6：CSS Selectors Schema

```json
{
  "access_mode": "direct | search",
  "search_url_pattern": "{base}/search?q={code}",
  "result_link_selector": "div.item a",
  "result_code_selector": "div.item strong",
  "fields": {
    "title":        { "selector": "div.container h3" },
    "cover_url":    { "selector": "a.bigImage img", "attr": "src" },
    "studio":       { "selector": "span.studio a" },
    "release_date": { "selector": "span.date" },
    "actors":       { "selector": "a.avatar-box span", "multiple": true },
    "tags":         { "selector": "span.genre a", "multiple": true }
  }
}
```

`attr` 缺省時取 `.text.strip()`；`multiple: true` 時取所有匹配元素的 text。

## Risks / Trade-offs

- **CSS Selectors 脆弱性** → 目標網站改版後 selector 失效，需用戶手動更新。Mitigation：`selectors` 模式的失敗會正常進入 stats，weight 下降後被降權，不影響系統整體運作。
- **DB 讀取開銷** → 每次 fetch 都查詢 DB 來源列表。Mitigation：來源數量少（個位數），加上簡單 query cache 即可；初版可先不加 cache。
- **Builtin key 對應失效** → 若 `builtin_key` 對應的 Python 模組被刪除，dispatcher 會 log error 並跳過。需要在文件中明確 builtin key 清單。

## Migration Plan

1. 新增 DB migration：建立 `scraper_sources`、`scraper_stats` 資料表
2. 新 dispatcher 讀取 DB；若 DB 無來源則 fallback 回舊行為（保持舊系統可用）
3. 待 UI 就緒後，用戶透過 preset 匯入來源，舊 dispatcher fallback 邏輯可移除
4. 舊的 `dispatcher.py` 固定呼叫邏輯刪除

## Open Questions

- `barrier` 和 `cooldown_duration` 是否需要 per-source 設定，或全域統一即可？（目前傾向全域）
- 當所有來源都在冷卻中時，是否要 fallback 到 AI fallback，或直接回傳 None？
