## ADDED Requirements

### Requirement: 全局套用 MUI 深色主題
應用程式 SHALL 透過 `ThemeProvider` 全局套用 MUI 深色主題，所有 MUI 元件 SHALL 自動繼承主題設定，不得使用 inline style 覆寫主題色彩。

#### Scenario: 應用程式載入時套用深色主題
- **WHEN** 應用程式載入
- **THEN** 背景為深色（`#111` 或 MUI 預設 dark background），文字為淺色

#### Scenario: 主色調為 indigo
- **WHEN** 渲染 MUI `primary` 色彩元件（Button、連結高亮等）
- **THEN** 顯示 indigo 色系（`#4f46e5` 或 MUI indigo）

### Requirement: 以 MUI 元件取代 inline style 實作
所有 UI 元件 SHALL 使用對應的 MUI 元件實作，不得保留大量 inline style。

#### Scenario: 影片卡片使用 MUI Card
- **WHEN** 渲染影片清單
- **THEN** 每張卡片使用 `<Card>` + `<CardMedia>` + `<CardActionArea>` 實作

#### Scenario: 搜尋欄使用 MUI TextField
- **WHEN** 渲染搜尋欄
- **THEN** 使用 `<TextField>` 元件，套用深色主題樣式

#### Scenario: 分頁使用 MUI Pagination
- **WHEN** 影片總數超過單頁數量
- **THEN** 使用 `<Pagination>` 元件顯示頁碼控制
