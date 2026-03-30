## 1. Folder Actor Inference（scanner 層）

- [x] 1.1 在 `backend/scanner.py` 新增 `infer_actor_from_path(file_path, db)` 函式：從 `file_path` 向上遍歷父資料夾，對每層資料夾名稱查詢 `actors` 表，回傳第一個匹配的 `Actor` 物件或 `None`
- [x] 1.2 在 `backend/api/scan.py` 的 unmatched 寫入段，呼叫 `infer_actor_from_path()` 並在找到演員時建立 `VideoActor` 記錄

## 2. 並行爬蟲與標籤合併（dispatcher 層）

- [x] 2.1 修改 `backend/scrapers/dispatcher.py` 的 `fetch_metadata()`：改用 `asyncio.gather()` 同時執行 Javbus、JavDB、AI fallback 三個爬蟲
- [x] 2.2 實作主欄位合併邏輯：title、cover_url、studio、actors、release_date 取優先序（Javbus > JavDB > AI）第一個非 null 值
- [x] 2.3 實作 tags 合併邏輯：收集所有來源的 tags 取 union 後去重

## 3. AI 標籤清洗（新模組）

- [x] 3.1 建立 `backend/scrapers/tag_cleaner.py`，實作 `clean_tags(tags: list[str]) -> list[str]`：呼叫 OpenRouter 輕量模型（`google/gemini-flash-1.5`）清洗標籤，移除畫質詞、演員名、片商名、無意義發行描述
- [x] 3.2 在 `clean_tags()` 加入 try/except，任何例外均 fallback 回傳原始 tags
- [x] 3.3 在 `dispatcher.py` 的 `fetch_metadata()` 合併 tags 後呼叫 `clean_tags()`

## 4. 整合測試

- [ ] 4.1 手動觸發掃描，確認 unmatched 影片在已知演員資料夾下能正確建立 `VideoActor` 關聯
- [ ] 4.2 確認已知番號的影片 tags 來自多來源合併且雜訊標籤已被移除
- [ ] 4.3 確認 OpenRouter key 不存在時，tag cleaning fallback 正常（使用原始 tags，不中斷掃描）

