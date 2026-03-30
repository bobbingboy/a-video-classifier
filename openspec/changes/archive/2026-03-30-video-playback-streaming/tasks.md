## 1. 後端：Streaming Endpoint

- [x] 1.1 在 `backend/api/videos.py` 新增 `GET /{video_id}/stream` endpoint，查詢 DB 取得 `file_path`，非 .mp4 回傳 415，檔案不存在回傳 404
- [x] 1.2 實作 HTTP Range request 解析，支援 `Range: bytes=start-end` header，回傳 206 Partial Content 及正確 Content-Range header
- [x] 1.3 使用 streaming generator（chunk size 1MB）回傳檔案內容，避免整個載入記憶體

## 2. 前端：VideoDetail 播放器

- [x] 2.1 在 `VideoDetail.tsx` 中，根據 `file_path` 是否以 `.mp4` 結尾，條件渲染 `<video>` 播放器區塊
- [x] 2.2 `<video>` 的 `src` 指向 `/api/videos/{id}/stream`，加上 `controls` 屬性，寬度填滿容器

## 3. 驗證

- [ ] 3.1 手動測試：在 VideoDetail 頁面點選一部 .mp4 影片，確認播放器出現且可播放、可 seek
- [ ] 3.2 手動測試：確認非 .mp4 影片的 VideoDetail 頁面不顯示播放器
