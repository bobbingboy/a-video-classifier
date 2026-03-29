## Context

前端目前以純 inline style 構成，頁面切換透過 React state（`page` 變數）控制，無法使用瀏覽器上下頁或直接貼 URL 導覽。所有樣式散落在元件內，難以維護一致的視覺語言。

## Goals / Non-Goals

**Goals:**
- 以 MUI v6 統一 UI 元件與深色主題
- 以 React Router v6 建立三條路由（`/`、`/scan`、`/video/:id`）
- 所有現有功能完整保留

**Non-Goals:**
- 不變更後端 API 或資料結構
- 不新增功能（搜尋、過濾、掃描邏輯均保持現狀）
- 不引入狀態管理套件（Redux、Zustand 等）

## Decisions

### 1. MUI v6 + Emotion

選擇 MUI 而非 shadcn/ui 或 Ant Design，因為 MUI 的深色主題設定最完整，`createTheme` + `ThemeProvider` 即可全局套用，無需逐一覆寫。

使用 `@mui/material` + `@emotion/react` + `@emotion/styled`，這是 MUI 官方推薦組合。

### 2. React Router v6（`BrowserRouter`）

使用 `BrowserRouter` 搭配 `Routes` / `Route`，路由結構：
```
<BrowserRouter>
  <Routes>
    <Route path="/" element={<LibraryPage />} />
    <Route path="/scan" element={<ScanPage />} />
    <Route path="/video/:id" element={<VideoDetailPage />} />
  </Routes>
</BrowserRouter>
```
導覽一律使用 `useNavigate` 或 `<Link>`，移除 App.tsx 的 `page` state。

### 3. 主題設定集中管理

建立 `frontend/src/theme.ts`，定義 `palette.mode: 'dark'`，以及主色調（indigo `#4f46e5`）。在 `main.tsx` 透過 `ThemeProvider` 注入。

### 4. 元件對應

| 原元件 | MUI 替換 |
|--------|---------|
| `<input>` 搜尋欄 | `<TextField>` |
| 影片卡片 | `<Card>` + `<CardMedia>` + `<CardActionArea>` |
| 導覽列 | `<AppBar>` + `<Toolbar>` |
| 掃描按鈕 | `<Button variant="contained">` |
| 進度條 | `<LinearProgress>` |
| 側欄過濾 | `<List>` + `<ListItemButton>` |
| 分頁 | `<Pagination>` |

## Risks / Trade-offs

- **Bundle size 增加** → MUI 支援 tree-shaking，實際只打包使用到的元件，影響可接受
- **樣式覆寫複雜度** → 深色主題統一設定後，個別元件幾乎不需要覆寫
- **Vite + MUI 相容性** → MUI v6 對 Vite 支援良好，無需額外設定
