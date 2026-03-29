## ADDED Requirements

### Requirement: 查詢並快取演員頭像
系統 SHALL 提供 API 端點，依演員 ID 查詢其頭像圖片。若本地已有快取，直接回傳路徑；否則嘗試從 Javbus 演員頁面爬取並儲存至本地。

#### Scenario: 本地已有演員頭像快取
- **WHEN** 呼叫 `GET /api/actors/{id}/photo` 且 `Actor.photo_local_path` 非空
- **THEN** 回傳 `{ "photo_url": "actor_photos/{filename}" }`，不重新抓取

#### Scenario: 本地無快取，Javbus 有演員頁面
- **WHEN** 呼叫 `GET /api/actors/{id}/photo` 且 `Actor.photo_local_path` 為空，且 Javbus 能找到該演員
- **THEN** 下載頭像至 `actor_photos/{actor_name}.jpg`，更新 `Actor.photo_local_path`，回傳 `{ "photo_url": "actor_photos/{filename}" }`

#### Scenario: Javbus 無演員頁面或抓取失敗
- **WHEN** 呼叫 `GET /api/actors/{id}/photo` 且 Javbus 無法找到頭像
- **THEN** 回傳 `{ "photo_url": null }`，不寫入資料庫

### Requirement: 演員模型支援頭像路徑
系統 SHALL 在 `actors` 資料表新增 `photo_local_path` 欄位，用於儲存已下載的頭像本地路徑。

#### Scenario: 演員頭像首次寫入
- **WHEN** 成功從外部來源下載演員頭像
- **THEN** `Actor.photo_local_path` 寫入相對路徑（如 `actor_photos/山岸逢花.jpg`）

#### Scenario: 舊有演員無頭像欄位
- **WHEN** 系統啟動時 `actors` 資料表尚無 `photo_local_path` 欄位
- **THEN** 系統自動執行 migration，新增可為空的 `photo_local_path` 欄位，不影響現有資料

### Requirement: 透過靜態服務提供演員頭像
系統 SHALL 透過 FastAPI 靜態檔案掛載，讓前端能以 `/actor_photos/{filename}` 路徑存取已快取的演員頭像。

#### Scenario: 前端請求已存在的頭像
- **WHEN** 前端以 `/actor_photos/山岸逢花.jpg` 請求圖片
- **THEN** 後端回傳本地儲存的圖片檔案，HTTP 200
