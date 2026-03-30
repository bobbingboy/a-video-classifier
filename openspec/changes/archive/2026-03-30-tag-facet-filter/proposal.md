## Why

目前使用者在瀏覽影片時，只能透過左側 Sidebar 的分類列表進行單一 tag 篩選，且缺乏上下文數量資訊。使用者無法直覺地知道「加上這個條件後還剩幾部影片」，也無法多選 tag 做交集篩選。此外，選了演員後沒有針對該演員影片的分類快速篩選入口。

## What Changes

### 後端

- 擴展 `GET /api/videos` 支援多 tag 篩選（`tag` 參數改為 list，AND 邏輯）
- 新增 `include_facets` 參數，回傳當前篩選條件下每個 tag 的影片數量（tag facets）
- 新增 `GET /api/actors/{actor_name}/tags` 端點，回傳該演員影片涵蓋的所有 tag 及數量

### 前端

- 主內容區上方新增兩區：
  - **已篩選區**：顯示使用者已選取的 tag Chip，可點 × 移除
  - **加入條件區**：顯示未選取的 tag Chip + 數量，點擊加入篩選；熱門 tag 直接顯示，其餘透過 Autocomplete 搜尋
- Sidebar 分類點擊行為改為操作同一組 tag 狀態（與 Chip 區同步）
- tag 參數改為多值（`?tag=A&tag=B`），AND 邏輯
- 加入 `framer-motion` 依賴，Chip 在已篩選區與加入條件區之間切換時使用 FLIP 飛行動畫（`layoutId`）

## Capabilities

### New Capabilities

- `tag-facet-filter`: 主內容區的分類 facet 篩選，支援多選、數量顯示、飛行動畫

### Modified Capabilities

- `video-list-api`: 影片列表 API 支援多 tag 參數及 facet 回傳
- `filter-sidebar`: Sidebar 分類點擊改為與 Chip 區同步

## Impact

- `backend/api/videos.py`: 擴展 tag 參數為 list、新增 facets 邏輯
- `backend/api/actors.py`: 新增演員 tag 端點
- `backend/schemas.py`: 新增 TagFacet schema、修改 VideoListResponse
- `frontend/package.json`: 新增 `framer-motion` 依賴
- `frontend/src/components/FilterSidebar.tsx`: 分類點擊行為修改
- `frontend/src/components/TagFacetBar.tsx`: 新元件（已篩選 + 加入條件 + 動畫）
- `frontend/src/App.tsx` (LibraryPage): 整合 TagFacetBar、管理多 tag 狀態
- `frontend/src/api/videos.ts`: API 呼叫支援多 tag 及 facets

## Non-goals

- 不改變 tag 的 CRUD（新增/刪除/編輯 tag 本身）
- 不做 OR 邏輯篩選（只做 AND）
- 不做 tag 的拖放排序
