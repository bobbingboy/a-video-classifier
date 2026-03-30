## Tasks

### Phase 1: 後端 Schema 與 API

- [ ] 1.1 `backend/models.py` — 新增 `VideoImage` model（video_id FK unique, image_data LargeBinary, content_type String）
- [ ] 1.2 `backend/models.py` — 新增 `ActorImage` model（actor_id FK unique, image_data LargeBinary, content_type String）
- [ ] 1.3 `backend/api/videos.py` — 新增 `GET /api/videos/{video_id}/cover` endpoint，從 video_images 讀取圖片回傳，設定 Cache-Control header
- [ ] 1.4 `backend/api/actors.py` — 新增 `GET /api/actors/{actor_id}/photo-image` endpoint，從 actor_images 讀取圖片回傳，設定 Cache-Control header

### Phase 2: 爬蟲改寫

- [ ] 2.1 `backend/scrapers/dispatcher.py` — 封面下載後寫入 video_images 表而非存檔案
- [ ] 2.2 `backend/scrapers/actor_photo.py` — 頭像下載後寫入 actor_images 表而非存檔案

### Phase 3: 遷移工具

- [ ] 3.1 `backend/migrate_covers.py` — 建立 CLI 遷移工具：掃描 covers/ 目錄，匹配 Video record，寫入 video_images 表
- [ ] 3.2 `backend/migrate_covers.py` — 擴展：掃描 actor_photos/ 目錄，匹配 Actor record，寫入 actor_images 表
- [ ] 3.3 `backend/migrate_covers.py` — 進度顯示、結果摘要、失敗清單、可選清除本地檔案

### Phase 4: 前端適配

- [ ] 4.1 `frontend/src/components/VideoGrid.tsx` — 封面 URL 改為 `/api/videos/{id}/cover`，加入 Skeleton 佔位
- [ ] 4.2 `frontend/src/components/VideoGrid.tsx` — 圖片 onLoad 後淡入替換 Skeleton
- [ ] 4.3 `frontend/src/components/FilterSidebar.tsx` — 演員頭像 URL 改為新 endpoint
- [ ] 4.4 `frontend/src/pages/VideoDetail.tsx` — 封面 URL 改為新 endpoint

### Phase 5: 驗證

- [ ] 5.1 執行遷移工具，確認現有圖片正確寫入 DB
- [ ] 5.2 驗證前端圖片載入正常，Skeleton 動畫正確
- [ ] 5.3 驗證爬蟲新下載的封面/頭像直接寫入 DB
