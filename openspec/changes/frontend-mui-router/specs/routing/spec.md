## ADDED Requirements

### Requirement: 應用程式以 URL 路由管理頁面
應用程式 SHALL 使用 React Router v6 `BrowserRouter`，以 URL 路徑決定顯示的頁面，支援瀏覽器上下頁導覽。

#### Scenario: 訪問根路徑顯示影片庫
- **WHEN** 使用者訪問 `/`
- **THEN** 系統顯示影片庫頁面（VideoGrid、FilterSidebar、SearchBar、分頁）

#### Scenario: 訪問 /scan 顯示掃描頁
- **WHEN** 使用者訪問 `/scan`
- **THEN** 系統顯示 ScanPage

#### Scenario: 訪問 /video/:id 顯示影片詳情
- **WHEN** 使用者訪問 `/video/123`
- **THEN** 系統顯示 id 為 123 的影片詳情頁

#### Scenario: 點擊影片卡片導覽至詳情頁
- **WHEN** 使用者點擊影片卡片
- **THEN** 瀏覽器 URL 變更為 `/video/:id`，並顯示對應詳情頁

#### Scenario: 詳情頁返回影片庫
- **WHEN** 使用者在詳情頁點擊返回
- **THEN** 瀏覽器導覽至 `/`

### Requirement: 導覽列提供頁面切換連結
AppBar SHALL 包含「影片庫」連結（`/`）與「掃描」連結（`/scan`），當前頁面的連結 SHALL 顯示高亮狀態。

#### Scenario: 當前頁面連結高亮
- **WHEN** 使用者在 `/scan` 頁面
- **THEN** 導覽列的「掃描」連結顯示高亮樣式，「影片庫」連結不高亮
