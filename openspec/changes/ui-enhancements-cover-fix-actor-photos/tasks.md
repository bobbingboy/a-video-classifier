## 1. 後端：修正封面下載 Referer header

- [x] 1.1 在 `backend/scrapers/dispatcher.py` 的 `download_cover()` headers 中加入 `"Referer": "https://www.javbus.com/"`
- [ ] 1.2 手動測試一個已知番號的封面下載，確認不再回傳 403

## 2. 後端：本地封面掃描 API

- [x] 2.1 在 `backend/api/scan.py` 新增 `POST /api/scan/local-covers` 端點
- [x] 2.2 實作資料夾掃描邏輯：對每個 `cover_local_path` 為空的 Video，在 `file_path` 所在資料夾尋找 `{code}.jpg/png/webp` 及 `poster.jpg`
- [x] 2.3 對 `video.code` 進行檔名 sanitize（移除 `< > : " / \ | ? *`）
- [x] 2.4 找到圖片後複製至 `covers/` 資料夾，更新 `Video.cover_local_path`
- [x] 2.5 回傳 `{ "matched": N, "skipped": M }` 統計結果

## 3. 後端：演員頭像 API 與資料模型

- [x] 3.1 在 `backend/models.py` 的 `Actor` 模型新增 `photo_local_path = Column(String, nullable=True)` 欄位
- [x] 3.2 在 `backend/database.py` 的啟動初始化中加入 safe migration（如 `photo_local_path` 欄位不存在則執行 `ALTER TABLE actors ADD COLUMN`）
- [x] 3.3 在 `backend/scrapers/` 新增 `actor_photo.py`，實作從 Javbus 搜尋演員並下載頭像的邏輯
- [x] 3.4 在 `backend/api/actors.py` 新增 `GET /api/actors/{id}/photo` 端點：有快取回傳路徑，無則呼叫爬蟲抓取
- [x] 3.5 在 `backend/main.py` 掛載 `actor_photos/` 靜態資料夾（與 `covers/` 相同方式）

## 4. 後端：更新 schemas

- [x] 4.1 在 `backend/schemas.py` 新增 `ActorPhotoResponse` schema（`photo_url: str | None`）

## 5. 前端：影片詳細頁按鈕文字

- [x] 5.1 在 `frontend/src/pages/VideoDetail.tsx` 將「編輯」的 `IconButton` 改為 `Button size="small" startIcon={<EditIcon />}`，顯示「編輯」文字
- [x] 5.2 將「重新抓取」的 `IconButton` 改為 `Button size="small" startIcon={<RefreshIcon />}`，顯示「重新抓取」文字
- [x] 5.3 移除對應的 `Tooltip` 包裝（已由文字說明）

## 6. 前端：分類標籤搜尋

- [x] 6.1 在 `frontend/src/components/FilterSidebar.tsx` 新增 `tagQ` state
- [x] 6.2 在分類區段標題下方新增搜尋 `TextField`（樣式與演員搜尋輸入框一致）
- [x] 6.3 將 `tags.slice(0, 60)` 改為：無搜尋時取前 80 筆，有搜尋時過濾後不限數量

## 7. 前端：演員頭像顯示

- [x] 7.1 在 `frontend/src/api/videos.ts` 新增 `actorsApi.getPhoto(id)` 方法（呼叫 `GET /api/actors/{id}/photo`）
- [x] 7.2 在 `FilterSidebar.tsx` 演員列表的每個項目前加入 `Avatar` 元件（24×24）
- [x] 7.3 實作頭像載入邏輯：初次渲染後非同步取得照片 URL；無照片時顯示姓名首字 fallback
- [x] 7.4 考慮 performance：不對每個演員個別發請求，可在演員列表 API 回傳時批次查詢，或改為懶載入（視需求）

## 8. 前端：全局 border-radius 調升

- [x] 8.1 在 `frontend/src/theme.ts` 的 `createTheme` 中新增 `shape: { borderRadius: 12 }`
- [x] 8.2 確認 VideoGrid 卡片、按鈕、Chip、對話框等元件視覺圓角正確
