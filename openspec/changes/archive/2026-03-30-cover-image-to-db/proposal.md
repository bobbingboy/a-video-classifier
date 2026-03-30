## Why

封面圖片和演員頭像目前以檔案形式存放在本地 `covers/` 和 `actor_photos/` 目錄。當從工作筆電或其他設備存取時，這些圖片無法取得。將圖片遷移至資料庫的獨立表，使所有設備透過 DB 即可取得完整的影片資訊和封面。

## What Changes

### 後端

- 新增 `video_images` 表（`video_id`, `image_data BLOB`, `content_type`）
- 新增 `actor_images` 表（`actor_id`, `image_data BLOB`, `content_type`）
- 新增 `GET /api/videos/{id}/cover` — 從 DB 讀取封面圖片回傳
- 新增 `GET /api/actors/{id}/photo-image` — 從 DB 讀取演員頭像回傳
- 修改爬蟲下載邏輯 — 下載封面/頭像後寫入 DB 而非存檔案
- 新增遷移工具 `backend/migrate_covers.py` — 掃描本地 `covers/` 和 `actor_photos/`，將現有圖片寫入 DB

### 前端

- 圖片 URL 從靜態路徑改為 API endpoint
- VideoGrid 封面載入加入 Skeleton 佔位動畫
- 圖片載入完成後淡入顯示

## Capabilities

### New Capabilities

- `cover-migration-tool`: CLI 遷移工具，將本地圖片批次寫入 DB
- `skeleton-loading`: 圖片載入時的 Skeleton 佔位動畫

### Modified Capabilities

- `cover-management`: 封面儲存從本地檔案改為 DB 獨立表
- `actor-photo-api`: 演員頭像儲存從本地檔案改為 DB 獨立表

## Impact

- `backend/models.py`: 新增 `VideoImage`、`ActorImage` models
- `backend/api/videos.py`: 新增封面圖片 endpoint
- `backend/api/actors.py`: 修改頭像 endpoint
- `backend/scrapers/dispatcher.py`: 封面下載改寫入 DB
- `backend/scrapers/actor_photo.py`: 頭像下載改寫入 DB
- `backend/migrate_covers.py`: 新增遷移工具
- `frontend/src/components/VideoGrid.tsx`: Skeleton + 淡入動畫
- `frontend/src/components/FilterSidebar.tsx`: 演員頭像 URL 變更
- `frontend/src/pages/VideoDetail.tsx`: 封面 URL 變更

## Non-goals

- 不遷移影片檔案本身（仍保留本地）
- 不做圖片壓縮或格式轉換
- 不做 CDN（未來可從獨立表遷至 S3）
