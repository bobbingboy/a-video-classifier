## Context

本次變更涵蓋五個獨立但都屬於 polish/fix 層面的問題：

1. **VideoDetail 按鈕文字缺失**：目前「編輯」與「重新抓取」使用 `IconButton`（無文字），與「返回」的 `Button + startIcon` 風格不一致。
2. **分類搜尋缺失**：`FilterSidebar` 已有演員搜尋輸入框，但分類區段沒有，造成功能不對等。
3. **封面下載失效**：`download_cover()` 使用通用 User-Agent 向 Javbus 請求圖片，但 Javbus 封面圖片需要正確的 `Referer` header 才會回傳（否則 403）。另外部分使用者已在影片資料夾中放置同名封面，目前沒有掃描機制。
4. **Border radius 不夠圓潤**：MUI 主題的 `shape.borderRadius` 目前為預設值 4px，希望提升至 12px 以上。
5. **演員照片**：Sidebar 演員列表純文字，希望每項前面有頭像。需要查詢演員照片並本地快取，避免每次重新請求。

## Goals / Non-Goals

**Goals:**
- 修正封面下載（Referer header）並新增本地封面掃描 API
- VideoDetail 的編輯/重新抓取改為帶文字的 Button
- FilterSidebar 分類區段加入搜尋欄
- MUI 主題 border-radius 全局調升
- Actor 模型新增 `photo_local_path` 欄位；新增演員照片取得 API；Sidebar 顯示頭像

**Non-Goals:**
- 不修改掃描/metadata 抓取的核心邏輯
- 不引入新的外部 AI 服務（演員照片來源使用既有爬蟲能力）
- 不重構資料庫 migration 工具（直接 `ALTER TABLE` 或 recreate）

## Decisions

### 1. 封面下載修正：加入 Referer header

Javbus 的封面圖片位於 `imgs.javbus.com`，伺服器會驗證 `Referer`。在 `download_cover()` 的 headers 加入 `"Referer": "https://www.javbus.com/"` 即可解決 403。

**替代方案**：換用 proxy/mirror — 太複雜，且維護成本高。

### 2. 本地封面掃描：新端點 `POST /api/scan/local-covers`

掃描所有有 `file_path` 的 Video，在同一資料夾中尋找符合以下命名模式的圖片：
- `{code}.jpg` / `{code}.png` / `{code}.webp`
- `poster.jpg` / `fanart.jpg`（次要）

找到後複製至 `covers/` 資料夾並更新 `cover_local_path`。只處理 `cover_local_path` 為空的影片（預設），支援 `force=true` 參數強制覆蓋。

**理由**：獨立端點比修改主掃描流程更安全，不影響現有 metadata 抓取。

### 3. 演員照片來源：Javbus 演員頁面爬蟲

Javbus 每個演員有專屬頁面（`/star/{id}`），上面有頭像圖片。策略：
- 從演員姓名反查 Javbus 搜尋頁取得演員 ID
- 下載頭像至 `actor_photos/{actor_id_or_name}.jpg`
- 將本地路徑寫入 `Actor.photo_local_path` 欄位（需 migration）

端點：`GET /api/actors/{id}/photo` — 如果本地已有快取直接回傳路徑，否則嘗試從 Javbus 抓取。

**替代方案**：使用通用圖片搜尋 API — 需要 API key，且結果品質不穩定。

### 4. Actor model migration

新增 `photo_local_path: String, nullable=True` 欄位。由於專案尚未使用 Alembic migration，採用啟動時執行 `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE` 的方式。具體做法：在 `database.py` 的 `create_all()` 呼叫後加入 safe ALTER。

### 5. VideoDetail 按鈕：IconButton → Button

將 `IconButton` 替換為 `Button size="small" startIcon={...}`，與「返回」按鈕保持風格一致。`Tooltip` 可移除（文字已說明意圖）。

### 6. 分類搜尋：新增 tagQ state

仿照 `actorQ` 模式在分類區段前新增 `TextField`，同時移除 `slice(0, 60)` 上限改為過濾後取前 80 筆（有搜尋時不限）。

### 7. 全局 border-radius

在 `frontend/src/theme.ts` 的 `createTheme` 中設定 `shape: { borderRadius: 12 }`（預設為 4）。MUI 元件的 `borderRadius` 屬性使用 `theme.shape.borderRadius` 倍數，全局生效無需逐一修改。

## Risks / Trade-offs

- **Javbus 封面爬蟲穩定性** → 站點結構改變會導致失效。以 `try/except` 包裹，失敗靜默記錄 log 而不崩潰。
- **演員照片抓取失敗率高** → 部分演員在 Javbus 無頁面（如舊片）。API 回傳 `null` 時前端顯示 fallback avatar（姓名首字），不阻塞渲染。
- **border-radius 全局調升影響所有元件** → 部分 Dialog、Snackbar 可能需要個別調整。初次調整後視覺測試確認。
- **本地封面路徑衝突** → 如果 code 含特殊字元（空格、斜線）需要 sanitize。掃描時對 code 做 `re.sub(r'[<>:"/\\|?*]', '_', code)` 處理。

## Migration Plan

1. 後端先行：修正 Referer、新增 `Actor.photo_local_path`、新增兩個 API 端點（local-covers、actor photo）
2. 前端同步更新：按鈕文字、tag 搜尋、演員頭像、theme border-radius
3. 本地封面掃描需使用者手動觸發（一次性操作，不自動執行）

## Open Questions

- 演員照片搜尋要從 Javbus 的哪個路徑抓取？需要先確認 `javbus.com/star/` 的 HTML 結構。若抓取成功率過低，可考慮先以姓名縮寫的 MUI `Avatar` fallback 為主，照片為加分項。
