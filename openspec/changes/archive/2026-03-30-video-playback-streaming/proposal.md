## Why

影片 metadata 已完整建立（番號、演員、封面），但目前只能在本地用播放器開啟，無法在 web 介面直接觀看。透過在 app 內串流播放，讓瀏覽與觀看整合在同一介面。

## What Changes

- 新增 FastAPI streaming endpoint，根據 `video_id` 讀取本地影片檔案，支援 HTTP Range requests（讓瀏覽器可 seek）
- 僅支援 `.mp4` 格式（PoC 範圍，瀏覽器原生支援 H.264）
- VideoDetail 頁面新增 `<video>` 播放器區塊，影片存在且為 `.mp4` 時顯示

## Capabilities

### New Capabilities

- `video-streaming`: FastAPI 串流 endpoint，透過 video_id 安全存取本地影片檔案，支援 HTTP Range requests

### Modified Capabilities

- `library-ui`: VideoDetail 頁面新增 video player UI 區塊

## Impact

- 後端新增 `GET /api/videos/{id}/stream` endpoint（`backend/api/videos.py`）
- 前端 `VideoDetail.tsx` 新增條件渲染的 `<video>` 播放器
- 安全性：僅能存取資料庫中已記錄的 `file_path`，不暴露任意路徑
- 僅限 `.mp4` 副檔名，非 `.mp4` 影片在 UI 上不顯示播放器（不報錯）
