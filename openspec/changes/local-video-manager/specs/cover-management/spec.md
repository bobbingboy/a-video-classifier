## ADDED Requirements

### Requirement: 下載封面圖片至本地
系統 SHALL 將從爬蟲或 AI 取得的封面圖片 URL 下載至本地 `covers/` 資料夾。

#### Scenario: 成功下載封面
- **WHEN** 系統取得有效的封面圖片 URL
- **THEN** 圖片以番號為檔名儲存（如 `covers/SSIS-123.jpg`），並將本地路徑寫入資料庫

#### Scenario: 封面圖片下載失敗
- **WHEN** 封面圖片 URL 無效或下載逾時
- **THEN** 系統記錄失敗，`cover_local_path` 欄位保持為空，不中斷 metadata 儲存流程

### Requirement: 避免重複下載封面
系統 SHALL 在下載前檢查本地是否已存在相同番號的封面圖片。

#### Scenario: 封面已存在於本地
- **WHEN** `covers/<code>.jpg` 檔案已存在
- **THEN** 系統跳過下載，直接使用現有的本地路徑

#### Scenario: 強制重新下載
- **WHEN** 使用者明確要求重新下載封面
- **THEN** 系統覆蓋現有的本地封面圖片並更新資料庫路徑

### Requirement: 透過 API 提供本地封面存取
系統 SHALL 透過 FastAPI 的靜態檔案服務，讓前端能夠存取本地的封面圖片。

#### Scenario: 前端請求封面圖片
- **WHEN** 前端以 `/covers/SSIS-123.jpg` 路徑請求圖片
- **THEN** 後端回傳本地儲存的圖片檔案
