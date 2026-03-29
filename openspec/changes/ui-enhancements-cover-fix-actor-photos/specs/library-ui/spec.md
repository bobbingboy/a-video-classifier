## MODIFIED Requirements

### Requirement: 手動編輯 metadata
系統 SHALL 在影片詳細頁提供編輯功能，允許修改所有 metadata 欄位。操作按鈕 SHALL 同時顯示圖示與文字標籤，風格與「返回」按鈕一致（`Button` + `startIcon`）。

#### Scenario: 進入編輯模式
- **WHEN** 使用者點擊詳細頁的「編輯」按鈕（顯示編輯圖示與「編輯」文字）
- **THEN** 所有可編輯欄位變為可輸入狀態

#### Scenario: 儲存編輯結果
- **WHEN** 使用者修改欄位後點擊「儲存」按鈕
- **THEN** 呼叫 `PUT /api/videos/{id}` 儲存，頁面顯示更新後的資料

#### Scenario: 重新抓取 Metadata
- **WHEN** 使用者點擊「重新抓取」按鈕（顯示刷新圖示與「重新抓取」文字）
- **THEN** 系統呼叫 metadata 抓取流程並重新整理頁面資料

### Requirement: 搜尋與過濾
系統 SHALL 提供關鍵字搜尋欄與多維度過濾器，結果即時更新。分類標籤區段 SHALL 提供搜尋輸入框，支援即時過濾分類名稱，功能對等於演員搜尋。

#### Scenario: 關鍵字搜尋
- **WHEN** 使用者在搜尋欄輸入文字
- **THEN** 影片列表即時過濾，顯示番號、標題或演員名稱符合的結果

#### Scenario: 以演員過濾
- **WHEN** 使用者點選某位演員名稱
- **THEN** 頁面只顯示含有該演員的影片

#### Scenario: 以分類過濾
- **WHEN** 使用者選擇一個或多個分類標籤
- **THEN** 頁面只顯示符合所有選取分類的影片

#### Scenario: 搜尋分類標籤
- **WHEN** 使用者在分類搜尋欄輸入文字
- **THEN** 分類 Chip 列表即時過濾，只顯示名稱包含輸入文字的分類

## ADDED Requirements

### Requirement: Sidebar 顯示演員頭像
系統 SHALL 在 FilterSidebar 的演員列表中，每個演員姓名前顯示對應的頭像圖片。若無頭像，顯示以姓名首字為內容的 MUI `Avatar` fallback。

#### Scenario: 演員有頭像快取
- **WHEN** 渲染演員列表，且 `GET /api/actors/{id}/photo` 回傳非 null 的 `photo_url`
- **THEN** 演員項目前顯示 24×24 圓形頭像圖片

#### Scenario: 演員無頭像
- **WHEN** 渲染演員列表，且 API 回傳 `photo_url: null` 或請求失敗
- **THEN** 顯示以演員姓名首字為文字的 MUI Avatar fallback（不顯示破圖或空白）

### Requirement: 全局圓角樣式
系統 SHALL 套用更圓潤的 border-radius，MUI 主題的 `shape.borderRadius` SHALL 設定為 12，所有 MUI 元件自動繼承此設定。

#### Scenario: 影片卡片圓角
- **WHEN** 渲染影片列表
- **THEN** 每張 Card 的四個角均顯示明顯圓角（至少 12px）

#### Scenario: 按鈕與輸入框圓角
- **WHEN** 渲染 Button、TextField、Chip 等 MUI 元件
- **THEN** 元件邊框圓角符合 `theme.shape.borderRadius` 倍數設定
