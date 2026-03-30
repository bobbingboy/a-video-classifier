## Why

目前前端使用純 inline style 撰寫，缺乏一致的設計系統，且以 state 管理頁面切換，無法直接透過 URL 導覽。引入 MUI 與 React Router 可提升可維護性並支援瀏覽器原生導覽行為。

## What Changes

- 安裝 `@mui/material`、`@emotion/react`、`@emotion/styled` 作為 UI 元件庫
- 安裝 `react-router-dom` v6 管理路由
- 以 MUI 元件取代所有 inline style 元件（Button、TextField、Card、AppBar 等）
- 建立 MUI 深色主題設定
- 以 React Router 取代現有的 page state 切換機制，路由規劃：
  - `/` → 影片庫（VideoGrid + FilterSidebar + SearchBar + 分頁）
  - `/scan` → 掃描頁
  - `/video/:id` → 影片詳情頁
- 保留所有現有功能，不變更 API 呼叫邏輯

## Capabilities

### New Capabilities

- `routing`: 以 React Router v6 管理應用程式路由，支援 URL 導覽與瀏覽器上下頁
- `mui-theme`: MUI 深色主題設定與 ThemeProvider 整合

### Modified Capabilities

- （無 spec 層級的行為變更，現有功能保持不變）

## Impact

- `frontend/src/App.tsx`：重構為 Router 根元件
- `frontend/src/pages/`：各頁面改用 MUI 元件
- `frontend/src/components/`：所有元件改用 MUI 元件
- `frontend/package.json`：新增 MUI 與 React Router 依賴
