## 1. 安裝依賴套件

- [x] 1.1 在 `frontend/` 安裝 MUI：`npm install @mui/material @emotion/react @emotion/styled @mui/icons-material`
- [x] 1.2 在 `frontend/` 安裝 React Router：`npm install react-router-dom`

## 2. 建立 MUI 主題

- [x] 2.1 建立 `frontend/src/theme.ts`，定義深色主題（`palette.mode: 'dark'`，主色調 indigo `#4f46e5`）
- [x] 2.2 修改 `frontend/src/main.tsx`，以 `ThemeProvider` 包裹 App，注入主題

## 3. 設定 React Router

- [x] 3.1 修改 `frontend/src/main.tsx`，以 `BrowserRouter` 包裹 App
- [x] 3.2 重構 `frontend/src/App.tsx`：移除 `page` state，改用 `Routes` / `Route` 定義三條路由（`/`、`/scan`、`/video/:id`）
- [x] 3.3 修改 AppBar 導覽列，以 `<Link>` 或 `useNavigate` 處理頁面切換，以 `useMatch` 判斷高亮狀態

## 4. 重構元件為 MUI

- [x] 4.1 重構 `frontend/src/components/SearchBar.tsx`：以 `<TextField>` 取代 `<input>`
- [x] 4.2 重構 `frontend/src/components/VideoGrid.tsx`：以 `<Grid2>` 排列、`<Card>` + `<CardMedia>` + `<CardActionArea>` 取代影片卡片
- [x] 4.3 重構 `frontend/src/components/FilterSidebar.tsx`：以 `<List>` + `<ListItemButton>` 取代演員/標籤清單
- [x] 4.4 重構 `frontend/src/pages/VideoDetail.tsx`：以 MUI `<Typography>`、`<Chip>`、`<Button>`、`<Stack>` 等取代 inline style
- [x] 4.5 重構 `frontend/src/pages/ScanPage.tsx`：以 `<TextField>`、`<Button>`、`<LinearProgress>`、`<Alert>` 取代 inline style

## 5. 重構分頁與路由導覽

- [x] 5.1 修改 `frontend/src/App.tsx` 影片庫頁分頁：以 MUI `<Pagination>` 取代自製分頁按鈕
- [x] 5.2 修改影片卡片點擊事件：以 `useNavigate('/video/:id')` 取代 `onSelect` callback
- [x] 5.3 修改 VideoDetail 返回按鈕：以 `useNavigate(-1)` 或 `useNavigate('/')` 取代 `onBack` prop
- [x] 5.4 修改 FilterSidebar 演員點擊：以 URL query param 或 navigate 取代 `onActorClick` callback
