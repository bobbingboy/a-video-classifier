## Why

目前的 UI 存在幾個使用體驗問題：詳細頁的操作按鈕只有 icon 缺乏文字說明、分類標籤無法像演員一樣進行搜尋、後端封面圖片抓取功能完全失效導致所有影片無封面、整體圓角設計不夠圓潤、以及 Sidebar 演員列表缺少視覺對應的照片。這些問題累積起來明顯降低了使用品質，需要一次集中修正。

## What Changes

- 影片詳細頁的「編輯」與「重新抓取」按鈕加上文字標籤（icon + label 同時顯示，風格與返回按鈕一致）
- Sidebar 的分類標籤區新增搜尋輸入框，支援即時過濾分類名稱（與演員搜尋功能對等）
- 修正後端封面圖片搜尋邏輯，確保能正確找到並保存圖片
- 新增本地封面掃描功能：掃描影片所在資料夾，自動識別同名封面圖片（如 `SSIS-123.jpg`）並複製至 `covers/` 資料夾
- 全局提升 border-radius 數值，讓卡片、按鈕、對話框等元件更加圓潤
- Sidebar 演員列表每個項目前顯示演員頭像
- 新增後端 API 端點，用於查詢並快取演員照片

## Capabilities

### New Capabilities
- `actor-photo-api`: 提供按演員姓名查詢照片的 API 端點，從外部來源取得照片並快取至本地

### Modified Capabilities
- `cover-management`: 修正封面搜尋邏輯；新增從影片資料夾掃描並匯入本地封面的功能
- `library-ui`: 更新詳細頁按鈕文字、分類搜尋、演員頭像顯示、全局 border-radius 調整

## Impact

- **後端**：`backend/api/scan.py`（本地封面掃描）、`backend/api/videos.py`（封面搜尋修正）、新增 `backend/api/actors.py`（演員照片端點）
- **前端**：`frontend/src/pages/VideoDetail.tsx`（按鈕文字）、`frontend/src/components/FilterSidebar.tsx`（分類搜尋、演員頭像）、MUI theme（border-radius）
- **依賴**：演員照片查詢可能需要外部圖片搜尋 API 或爬蟲邏輯
