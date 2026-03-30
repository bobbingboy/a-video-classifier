## Why

掃描流程在兩個維度上有明顯缺陷：無法識別的影片（unmatched）即使位於已知演員資料夾中也完全失去演員關聯；爬蟲以瀑布式優先順序執行，導致標籤覆蓋率不足，且回傳的標籤夾雜大量無意義的雜訊（畫質指標、演員名、片商名等），降低了分類的實用性。

## What Changes

- 掃描 unmatched 影片時，向上遍歷目錄路徑，找出第一個與 actors 表中已知演員名稱相符的資料夾，並自動建立 VideoActor 關聯
- 將爬蟲架構從純瀑布式改為「主欄位瀑布、標籤全收」：三個 scrapers 並行執行，title / cover / studio / actors 取優先序第一個非 null，tags 則合併所有來源的結果
- 新增 AI 標籤清洗步驟：合併後的標籤經 OpenRouter 模型過濾，移除品質詞、演員名、片商名、無意義發行描述，僅保留描述影片類型與情節的有效標籤

## Capabilities

### New Capabilities
- `folder-actor-inference`: 掃描時從影片路徑推斷演員歸屬，unmatched 影片也能依資料夾結構建立演員關聯
- `tag-cleaning`: AI 驅動的標籤後處理，移除雜訊標籤，僅保留有意義的類型／情節標籤

### Modified Capabilities
- `scan`: 爬蟲執行策略由純瀑布改為並行合併，標籤蒐集擴展為多來源 union

## Impact

- **後端**：`backend/scanner.py`（路徑遍歷邏輯）、`backend/api/scan.py`（unmatched 寫入段）、`backend/scrapers/dispatcher.py`（並行執行、標籤合併）、新增 `backend/scrapers/tag_cleaner.py`
- **API**：無外部 API 變更，新增 OpenRouter 呼叫（tag cleaning）
- **依賴**：沿用現有 `OPENROUTER_API_KEY` 環境變數
