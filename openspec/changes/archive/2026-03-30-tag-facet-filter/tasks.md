## Tasks

### Phase 1: 後端 API 擴展

- [x] 1.1 `backend/schemas.py` — 新增 `TagFacet` schema，修改 `VideoListResponse` 加入 `tag_facets` 欄位
- [x] 1.2 `backend/api/videos.py` — `tag` 參數改為 `list[str]`，實作 AND 篩選邏輯
- [x] 1.3 `backend/api/videos.py` — 實作 `include_facets` 參數，查詢當前條件下各 tag 的影片數量
- [x] 1.4 `backend/api/actors.py` — 新增 `GET /api/actors/{actor_name}/tags` 端點
- [x] 1.5 後端 API 手動測試驗證

### Phase 2: 前端依賴與元件

- [x] 2.1 `frontend/package.json` — 安裝 `framer-motion`
- [x] 2.2 `frontend/src/api/videos.ts` — API 呼叫支援多 tag 參數及 `include_facets`
- [x] 2.3 `frontend/src/api/videos.ts` — 新增 actor tags API 呼叫
- [x] 2.4 `frontend/src/components/TagFacetBar.tsx` — 新建元件：已篩選區 + 加入條件區 + Autocomplete
- [x] 2.5 `frontend/src/components/TagFacetBar.tsx` — 加入 framer-motion 飛行動畫（layoutId + AnimatePresence）

### Phase 3: 整合與 Sidebar 同步

- [x] 3.1 `frontend/src/App.tsx` (LibraryPage) — 多 tag URL 狀態管理，整合 TagFacetBar
- [x] 3.2 `frontend/src/components/FilterSidebar.tsx` — 分類點擊改為操作共用 tag 狀態，顯示已選中狀態
- [x] 3.3 整合測試：Sidebar 點分類 ↔ Chip 區同步、演員切換時 facets 更新、動畫效果
