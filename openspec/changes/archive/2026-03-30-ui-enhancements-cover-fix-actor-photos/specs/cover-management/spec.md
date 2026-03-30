## MODIFIED Requirements

### Requirement: 下載封面圖片至本地
系統 SHALL 將從爬蟲或 AI 取得的封面圖片 URL 下載至本地 `covers/` 資料夾。HTTP 請求 MUST 包含正確的 `Referer` header（`https://www.javbus.com/`）以通過來源驗證。

#### Scenario: 成功下載封面
- **WHEN** 系統取得有效的封面圖片 URL
- **THEN** 圖片以番號為檔名儲存（如 `covers/SSIS-123.jpg`），並將本地路徑寫入資料庫

#### Scenario: 封面圖片下載失敗（403 或網路錯誤）
- **WHEN** 封面圖片 URL 回傳非 200 狀態碼，或請求逾時
- **THEN** 系統記錄失敗，`cover_local_path` 欄位保持為空，不中斷 metadata 儲存流程

#### Scenario: 封面已存在於本地
- **WHEN** `covers/<code>.jpg` 檔案已存在
- **THEN** 系統跳過下載，直接使用現有的本地路徑

#### Scenario: 強制重新下載
- **WHEN** 使用者明確要求重新下載封面
- **THEN** 系統覆蓋現有的本地封面圖片並更新資料庫路徑

## ADDED Requirements

### Requirement: 從影片資料夾掃描現有封面
系統 SHALL 提供 `POST /api/scan/local-covers` 端點，掃描所有已記錄影片的所在資料夾，自動識別並匯入與番號相符的本地封面圖片。

#### Scenario: 觸發本地封面掃描
- **WHEN** 呼叫 `POST /api/scan/local-covers`
- **THEN** 系統逐一掃描所有 `cover_local_path` 為空的 Video（`force=true` 時掃描全部），並回傳 `{ "matched": N, "skipped": M }` 統計

#### Scenario: 找到相符封面圖片
- **WHEN** 影片所在資料夾存在 `{code}.jpg`、`{code}.png`、`{code}.webp` 或 `poster.jpg`
- **THEN** 圖片複製至 `covers/{code}{ext}`，更新 `Video.cover_local_path`

#### Scenario: 找不到相符封面圖片
- **WHEN** 影片所在資料夾無任何符合命名模式的圖片
- **THEN** 該影片跳過，`cover_local_path` 保持為空

#### Scenario: 番號含非法檔名字元
- **WHEN** Video.code 含有 `< > : " / \ | ? *` 等字元
- **THEN** 系統對 code 進行 sanitize 後再比對檔名
