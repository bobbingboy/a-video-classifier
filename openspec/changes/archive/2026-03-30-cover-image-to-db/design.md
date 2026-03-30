## Architecture

### 獨立圖片表設計

```
videos 表（輕量，列表查詢用）     video_images 表（圖片，單獨存取）
┌─────┬──────────┬───────┐       ┌──────────┬──────────────┬──────────────┐
│ id  │ code     │ title │       │ video_id │ image_data   │ content_type │
└─────┴──────────┴───────┘       │ (FK, UQ) │ (LargeBinary)│ (String)     │
                                  └──────────┴──────────────┴──────────────┘

actors 表                         actor_images 表
┌─────┬──────────┐               ┌──────────┬──────────────┬──────────────┐
│ id  │ name     │               │ actor_id │ image_data   │ content_type │
└─────┴──────────┘               │ (FK, UQ) │ (LargeBinary)│ (String)     │
                                  └──────────┴──────────────┴──────────────┘
```

物理隔離確保 `SELECT * FROM videos` 永遠不碰圖片資料。

### 圖片存取流程

```
前端 <img src="/api/videos/123/cover">
         │
         ▼
Backend: GET /api/videos/{id}/cover
         │
         ▼
    SELECT image_data, content_type
    FROM video_images
    WHERE video_id = 123
         │
         ▼
    Response(content=image_data, media_type=content_type)
    + Cache-Control: max-age=86400
```

加上 `Cache-Control` header 讓瀏覽器快取，避免重複查詢。

### 前端 Skeleton 載入

```
VideoGrid 卡片
┌─────────────┐
│ ┌─────────┐ │  1. 先渲染 Skeleton（灰色波紋動畫）
│ │ Skeleton│ │  2. <img> 設 display:none，背景載入
│ │ ░░░░░░░ │ │  3. onLoad 觸發後，淡入替換 Skeleton
│ └─────────┘ │
│ SSIS-123    │  metadata 先顯示，圖片逐張填入
└─────────────┘
```

### 遷移工具流程

```
$ python -m backend.migrate_covers

1. 掃描 covers/ 目錄
   ├─ 讀取每張圖片
   ├─ 透過檔名或 cover_local_path 匹配 Video record
   └─ 寫入 video_images 表

2. 掃描 actor_photos/ 目錄
   ├─ 讀取每張圖片
   ├─ 透過 photo_local_path 匹配 Actor record
   └─ 寫入 actor_images 表

3. 顯示結果摘要
   ├─ 成功 / 失敗 / 跳過 數量
   └─ 失敗清單（檔案損壞、無對應 record）

4. 可選：清除已遷移的本地檔案
```

## Key Decisions

### 1. 獨立表而非 BLOB 欄位

物理隔離比 `deferred()` 更安全。不可能因為 ORM 操作意外載入圖片。未來要遷移到 S3 也只需改這張表。

### 2. 保留 cover_local_path / photo_local_path 欄位

遷移期間保持向下相容。圖片讀取優先查 DB 表，fallback 到本地檔案。全部遷移完成後可考慮移除。

### 3. 瀏覽器快取

封面圖片不常變動，設定 `Cache-Control: max-age=86400`（24 小時），減少重複請求。

### 4. Skeleton + 淡入

列表 metadata 瞬間載入，圖片各自非同步請求。Skeleton 避免版面跳動，淡入提升視覺體驗。
