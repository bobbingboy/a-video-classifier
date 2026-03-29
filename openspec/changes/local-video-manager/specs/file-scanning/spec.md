## ADDED Requirements

### Requirement: 掃描資料夾取得影片檔案清單
系統 SHALL 遞迴掃描指定的資料夾路徑，找出所有影片檔案（`.mp4`、`.mkv`、`.avi`、`.wmv`、`.mov`）。

#### Scenario: 掃描含影片的資料夾
- **WHEN** 使用者提供一個含有影片檔案的資料夾路徑
- **THEN** 系統回傳所有影片檔案的絕對路徑清單

#### Scenario: 掃描含子資料夾的目錄
- **WHEN** 資料夾內有多層子資料夾
- **THEN** 系統遞迴掃描並回傳所有層級的影片檔案

#### Scenario: 資料夾不存在
- **WHEN** 指定的路徑不存在或無法存取
- **THEN** 系統回傳明確的錯誤訊息，不中斷整體流程

### Requirement: 從檔名解析番號
系統 SHALL 從影片檔名中自動提取番號，支援常見命名格式。

#### Scenario: 標準番號格式
- **WHEN** 檔名為 `SSIS-123.mp4` 或 `ssis-123.mp4`
- **THEN** 解析出番號 `SSIS-123`（統一轉為大寫）

#### Scenario: 帶括號格式
- **WHEN** 檔名為 `[SSIS-123] 標題名稱.mp4`
- **THEN** 解析出番號 `SSIS-123`

#### Scenario: 無破折號格式
- **WHEN** 檔名為 `SSIS123.mp4`
- **THEN** 解析出番號 `SSIS-123`（自動補上破折號）

#### Scenario: 無法解析的檔名
- **WHEN** 檔名不含可識別的番號格式
- **THEN** 該檔案標記為 `unmatched`，記錄原始檔名，允許使用者手動輸入番號

### Requirement: 避免重複掃描已存在的檔案
系統 SHALL 在掃描時比對資料庫中已存在的檔案路徑，跳過已建立 metadata 的影片。

#### Scenario: 重複執行掃描
- **WHEN** 使用者對同一資料夾執行第二次掃描
- **THEN** 系統只處理新增的影片檔案，已存在的影片不重複抓取 metadata

#### Scenario: 檔案路徑已變更
- **WHEN** 資料庫中的影片檔案路徑已不存在
- **THEN** 系統標記該筆記錄為 `file_missing`，不自動刪除資料
