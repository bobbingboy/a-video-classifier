## Context

目前掃描流程分為兩段：能解析番號的影片進入 `matched` 清單，經非同步爬蟲取得 metadata；無法解析的進入 `unmatched` 清單，直接以 `UNMATCHED_{filename}` 為 code 寫入 DB，不帶任何演員資訊。

爬蟲層（`dispatcher.py`）採瀑布式策略：Javbus → JavDB → AI fallback，第一個成功即回傳。這在主欄位（title、cover）上合理，但對 tags 而言意味著放棄了其他來源可能提供的更豐富標籤。此外，爬蟲回傳的 tags 未經過濾，包含大量與影片類型無關的噪訊。

片庫規模約 600 部，掃描速度非關鍵需求。

## Goals / Non-Goals

**Goals:**
- unmatched 影片能依父資料夾名稱自動關聯已知演員
- 標籤來源從單一改為多來源合併，提升覆蓋率
- 引入 AI 後處理步驟，移除無意義標籤

**Non-Goals:**
- 自動建立 DB 中不存在的演員（資料夾名稱對應不到既有演員時，不新增）
- 修改影片詳細頁或前端顯示邏輯
- 改動封面下載或其他非標籤欄位的合併策略

## Decisions

### D1：演員推斷的路徑遍歷方向

從 `file_path` 的直接父資料夾往上遍歷，對每一層資料夾名稱查詢 `actors` 表。找到第一個匹配即停止，找不到則不建立關聯。

**選擇理由**：使用者資料夾結構為 `/Videos/演員名/[可能有子資料夾]/影片`，往上遍歷能處理多層子資料夾的情況。只匹配 DB 中既有演員，避免因系統資料夾名稱（如 `Downloads`）誤建演員記錄。

**替代方案**：只看直接父資料夾 → 無法處理子資料夾；自動建立演員 → 可能產生雜訊記錄。

### D2：資料夾名稱比對策略

使用精確字串比對（`Actor.name == folder_name`），不做模糊匹配。

**選擇理由**：演員名稱通常是精確的日文全名，模糊匹配容易誤配。若未來有需求可單獨擴充。

### D3：並行爬蟲策略

`fetch_metadata()` 改為以 `asyncio.gather()` 同時呼叫三個 scrapers，主欄位（title、cover_url、studio、actors、release_date）取優先序（Javbus > JavDB > AI）第一個非 null 值，tags 則取所有來源的 union 後去重。

**選擇理由**：主欄位以 Javbus 為可信來源，不需合併邏輯；tags 則各來源互補，合併能最大化覆蓋率。並行執行不增加總延遲（原本瀑布式在多次失敗時更慢）。

**替代方案**：僅對 tags 保留瀑布並在後端補查 → 邏輯複雜且仍有遺漏；全欄位合併 → 衝突解決規則難以定義。

### D4：AI 標籤清洗模型選擇

沿用 `OPENROUTER_API_KEY`，使用輕量模型（預設 `google/gemini-flash-1.5`）。Prompt 為純文字轉換（不需 web search），比 AI fallback 使用的 Perplexity Sonar 便宜許多。

**清洗規則（Prompt 層定義）**：
- 移除：畫質/解析度（高畫質、4K、8K、HD、FHD）、演員名、片商名、無意義發行描述（独占、単体、完全版、数量限定）
- 保留：描述影片類型、情節、場景的標籤

如果 OpenRouter 呼叫失敗，fallback 為原始 tags（不中斷掃描流程）。

## Risks / Trade-offs

- **演員比對時序問題**：unmatched 影片寫入時，同批次 matched 影片的演員可能尚未進 DB（非同步掃描尚未完成）。緩解：本次不處理跨批次情況，使用者可對已有演員的 unmatched 影片重新掃描補關聯。
- **AI 清洗成本**：每部影片多一次 API 呼叫，600 部約 600 次輕量請求，費用可忽略。
- **並行爬蟲對外部站點的請求量**：原本失敗才往下，現在全部打。考慮到 Javbus/JavDB 有 rate limit，若大量掃描可能被封鎖。緩解：三個 scrapers 已有獨立的 httpx client，現有 timeout 設定保留；如未來需要可加 delay。
