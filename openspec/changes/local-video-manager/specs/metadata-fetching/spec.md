## ADDED Requirements

### Requirement: 從 Javbus 抓取 metadata
系統 SHALL 以番號為查詢條件向 Javbus 發送請求，解析並回傳結構化的影片 metadata。

#### Scenario: 番號在 Javbus 存在
- **WHEN** 以有效番號（如 `SSIS-123`）查詢 Javbus
- **THEN** 系統回傳包含標題、演員列表、出版商、分類列表、發行日期、封面圖片 URL 的結構化資料

#### Scenario: 番號在 Javbus 不存在
- **WHEN** Javbus 查無該番號
- **THEN** 系統標記為 Javbus 未命中，自動進入 JavDB 查詢流程

### Requirement: 從 JavDB 作為備用來源抓取 metadata
系統 SHALL 在 Javbus 查無結果時，自動向 JavDB 查詢相同番號。

#### Scenario: 番號在 JavDB 存在
- **WHEN** Javbus 未命中，JavDB 查到該番號
- **THEN** 系統從 JavDB 回傳結構化 metadata，標記來源為 `javdb`

#### Scenario: 兩個來源均未命中
- **WHEN** Javbus 與 JavDB 均查無結果
- **THEN** 系統自動進入 AI fallback 流程

### Requirement: AI Fallback 查詢
系統 SHALL 在爬蟲兩個來源均失敗時，使用 OpenRouter Perplexity Sonar Small 進行網路搜尋。

#### Scenario: AI 成功回傳結構化資料
- **WHEN** 向 OpenRouter 發送番號查詢請求
- **THEN** 系統解析 AI 回傳的 JSON，取得可用的 metadata，標記來源為 `ai`

#### Scenario: AI 回傳不完整或失敗
- **WHEN** AI 無法提供有效的 metadata（拒絕回應或格式錯誤）
- **THEN** 系統將該影片標記為 `needs_manual_review`，不寫入不完整的資料

### Requirement: 批次抓取 metadata
系統 SHALL 支援對多筆影片批次執行 metadata 抓取，並提供進度回報。

#### Scenario: 批次處理進行中
- **WHEN** 使用者觸發批次掃描
- **THEN** 系統逐一處理每部影片，每處理完一部即即時更新進度（已處理數/總數）

#### Scenario: 單筆抓取失敗不中斷批次
- **WHEN** 某部影片的 metadata 抓取失敗
- **THEN** 系統記錄失敗原因，繼續處理下一部影片，批次結束後回報失敗清單
