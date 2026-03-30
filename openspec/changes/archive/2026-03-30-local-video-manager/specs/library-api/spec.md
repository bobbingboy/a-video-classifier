## ADDED Requirements

### Requirement: 影片列表查詢 API
系統 SHALL 提供 `GET /api/videos` 端點，支援分頁、關鍵字搜尋與多條件過濾。

#### Scenario: 取得預設影片列表
- **WHEN** 發送 `GET /api/videos`
- **THEN** 回傳第一頁影片列表（預設每頁 24 筆），包含 `total`、`page`、`items` 欄位

#### Scenario: 以演員名稱過濾
- **WHEN** 發送 `GET /api/videos?actor=演員名`
- **THEN** 只回傳含有該演員的影片

#### Scenario: 以分類過濾
- **WHEN** 發送 `GET /api/videos?tag=分類名`
- **THEN** 只回傳含有該分類標籤的影片

#### Scenario: 關鍵字搜尋
- **WHEN** 發送 `GET /api/videos?q=關鍵字`
- **THEN** 系統在番號、標題、演員名稱中進行模糊搜尋並回傳結果

### Requirement: 單部影片詳細資料 API
系統 SHALL 提供 `GET /api/videos/{id}` 端點，回傳完整 metadata 含演員、分類、出版商。

#### Scenario: 取得存在的影片
- **WHEN** 發送 `GET /api/videos/1`
- **THEN** 回傳該影片完整資料，包含演員陣列、標籤陣列、出版商名稱

### Requirement: 更新影片 metadata API
系統 SHALL 提供 `PUT /api/videos/{id}` 端點，允許更新標題、演員、分類等欄位。

#### Scenario: 成功更新 metadata
- **WHEN** 發送含有有效欄位的 `PUT /api/videos/1`
- **THEN** 資料庫更新成功，回傳更新後的完整影片資料

### Requirement: 掃描與抓取觸發 API
系統 SHALL 提供以下管理端點：
- `POST /api/scan`：觸發資料夾掃描，接受 `folder_path` 參數
- `POST /api/videos/{id}/fetch`：對單部影片重新抓取 metadata
- `GET /api/scan/status`：取得目前掃描/抓取的進度狀態

#### Scenario: 觸發資料夾掃描
- **WHEN** 發送 `POST /api/scan` 含有效的 `folder_path`
- **THEN** 系統非同步開始掃描，立即回傳 `{ "status": "started" }`，可透過 `GET /api/scan/status` 輪詢進度

#### Scenario: 查詢掃描進度
- **WHEN** 發送 `GET /api/scan/status`
- **THEN** 回傳 `{ "running": true, "processed": 45, "total": 120, "failed": 2 }`

### Requirement: 演員與分類列表 API
系統 SHALL 提供 `GET /api/actors` 與 `GET /api/tags` 端點，供前端過濾器使用。

#### Scenario: 取得所有演員
- **WHEN** 發送 `GET /api/actors`
- **THEN** 回傳所有演員列表，包含每位演員的影片數量
