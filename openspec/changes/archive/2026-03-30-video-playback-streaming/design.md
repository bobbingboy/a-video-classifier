## Context

影片 `file_path` 已存在於 SQLite DB，但目前沒有任何機制讓瀏覽器存取本地影片。影片散落於多個本地磁碟路徑（`F:\OnlyForResearch`、`F:\Temporary`、`D:\`），不適合用 static file mount（路徑不統一、D:\ 範圍太廣）。後端為 FastAPI，已有 `/covers` 和 `/actor_photos` static mount 作為先例。

## Goals / Non-Goals

**Goals:**
- 在 VideoDetail 頁面嵌入原生 `<video>` 播放器
- FastAPI 串流 endpoint 支援 HTTP Range requests（seek / 不佔滿記憶體）
- 透過 video_id 查 DB 存取，防止路徑穿越
- PoC 僅支援 `.mp4`

**Non-Goals:**
- transcoding（不支援 .mkv / .avi 等格式）
- 字幕、多音軌支援
- 影片管理（移動、重命名檔案）
- 行動裝置 HLS 串流

## Decisions

### 決定 1：Streaming endpoint 而非 static mount

**選擇**：`GET /api/videos/{id}/stream` 透過 DB 查詢再串流

**原因**：影片路徑任意分散，無法像 covers 一樣 mount 單一目錄。透過 DB 查詢天然限制只能存取已登錄的檔案，不暴露任意路徑。

**替代方案考慮**：直接讓前端讀 `file_path` 組成 `file://` URL → 瀏覽器安全政策封鎖，不可行。

### 決定 2：HTTP Range requests 支援

**選擇**：手動實作 Range header 解析，回傳 206 Partial Content

**原因**：瀏覽器 `<video>` 需要 Range 支援才能 seek。FastAPI 的 `FileResponse` 不支援 Range，需要自訂 streaming。

**實作方式**：讀取 `Range: bytes=start-end` header，用 Python `open(file, 'rb')` + `file.seek()` 回傳對應區段。

### 決定 3：副檔名白名單限制在 `.mp4`

**選擇**：endpoint 檢查 `file_path` 副檔名，非 `.mp4` 回傳 415 Unsupported Media Type

**原因**：瀏覽器原生支援 H.264 MP4；其他格式需要 codec 支援不確定，PoC 以可行性為主。前端依此決定是否顯示播放器。

## Risks / Trade-offs

- **大檔案記憶體壓力** → 使用 streaming generator，每次讀取固定 chunk size（1MB），不整個載入記憶體
- **非 .mp4 影片無法在 app 內播放** → 屬於 PoC 已知限制，VideoDetail 對非 .mp4 隱藏播放器區塊，不影響其他功能
- **並發串流效能** → 本地單人使用，不需考慮
