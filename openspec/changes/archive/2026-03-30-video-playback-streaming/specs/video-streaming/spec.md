## ADDED Requirements

### Requirement: Stream local video file by video ID
系統 SHALL 提供 `GET /api/videos/{video_id}/stream` endpoint，根據 video_id 查詢資料庫取得 `file_path`，並將本地影片檔案以串流方式回傳給瀏覽器。

#### Scenario: 成功串流 .mp4 影片
- **WHEN** 請求合法的 video_id，且對應 `file_path` 為存在的 `.mp4` 檔案
- **THEN** 回傳 200 OK，Content-Type 為 `video/mp4`，body 為完整檔案內容

#### Scenario: 支援 HTTP Range 請求
- **WHEN** 請求包含 `Range: bytes=<start>-<end>` header
- **THEN** 回傳 206 Partial Content，Content-Range header 正確，body 為指定範圍的資料

#### Scenario: video_id 不存在
- **WHEN** 請求的 video_id 在資料庫中不存在
- **THEN** 回傳 404 Not Found

#### Scenario: 影片檔案不是 .mp4 格式
- **WHEN** 對應 `file_path` 副檔名不是 `.mp4`
- **THEN** 回傳 415 Unsupported Media Type

#### Scenario: 影片檔案不存在於磁碟
- **WHEN** `file_path` 在資料庫中有記錄，但實際檔案已不存在
- **THEN** 回傳 404 Not Found

### Requirement: 安全路徑存取
系統 SHALL 僅能透過 video_id 間接存取 `file_path`，不得接受來自客戶端的任意路徑參數。

#### Scenario: 無法存取任意路徑
- **WHEN** 任何試圖直接指定路徑的請求（非 video_id）
- **THEN** 系統不提供此類 endpoint，拒絕存取
