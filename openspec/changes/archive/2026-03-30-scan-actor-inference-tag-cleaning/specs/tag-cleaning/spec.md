## ADDED Requirements

### Requirement: AI 標籤清洗
爬蟲取得 tags 後，系統 SHALL 呼叫 AI 模型對標籤清單進行後處理，移除與影片類型無關的雜訊標籤，僅保留描述影片類型、情節或場景的有效標籤。若 AI 呼叫失敗，系統 SHALL fallback 使用原始未清洗的標籤，不中斷掃描流程。

#### Scenario: 成功清洗含雜訊的標籤
- **WHEN** 爬蟲回傳 tags 包含 `["高畫質", "天使もえ", "S1", "巨乳", "劇情", "4K完全版"]`
- **THEN** 清洗後 tags 僅保留 `["巨乳", "劇情"]`（移除畫質詞、演員名、片商名、發行描述）

#### Scenario: AI 呼叫失敗時的 fallback
- **WHEN** OpenRouter API 呼叫失敗（網路錯誤、key 無效、rate limit 等）
- **THEN** 系統使用原始 tags，掃描繼續執行，不拋出例外

#### Scenario: 標籤清洗不修改其他欄位
- **WHEN** AI 清洗步驟完成
- **THEN** title、studio、actors、cover_url 等欄位不受影響

### Requirement: 清洗規則範疇
AI 清洗步驟 SHALL 移除以下類型的標籤：
- 畫質/解析度指標（高畫質、HD、4K、8K、FHD 等）
- 演員姓名（已由 actors 欄位承載）
- 片商/品牌名稱（已由 studio 欄位承載）
- 無意義的發行描述（独占配信、単体作品、完全版、数量限定 等）

#### Scenario: 僅保留類型情節標籤
- **WHEN** 清洗後的 tags 為空（所有標籤均為雜訊）
- **THEN** 系統儲存空的 tags 陣列，不補填任何預設標籤
