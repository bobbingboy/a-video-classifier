## Architecture

### 資料流

```
使用者操作（Sidebar 點分類 / Chip 區點擊 / Autocomplete 選取）
      │
      ▼
  URL 狀態更新：?actor=X&tag=A&tag=B
      │
      ▼
  GET /api/videos?actor=X&tag=A&tag=B&include_facets=true
      │
      ▼
  回傳 { items, total, tag_facets }
      │
      ├──→ items → VideoGrid 顯示影片
      └──→ tag_facets → TagFacetBar 更新數量
```

### UI 結構

```
┌──────────────────────────────────────────────────┐
│  [搜尋番號、標題...]                              │
│                                                   │
│  已篩選：[巨乳 ×] [中出 ×]              共 5 部  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  加入條件：[人妻 (1)] [痴女 (0)] ...  [+ 更多 ▼] │
│                                                   │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │ vid │ │ vid │ │ vid │ │ vid │ │ vid │       │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘       │
└──────────────────────────────────────────────────┘
```

## Key Decisions

### 1. Facets 搭載在影片列表 API 回傳

不另開獨立 facet 端點，而是在 `GET /api/videos` 加上 `include_facets=true` 參數。每次篩選條件變動本來就會重新拉影片列表，搭便車回傳 facets 可少一次 round trip。

### 2. Tag 篩選使用 AND 邏輯

選越多 tag，結果越精確（交集）。這符合 faceted search 的標準行為，也讓數字的遞減變化合理可預期。

### 3. 已篩選區與加入條件區分離

避免使用者困惑「哪些是我選的」與「數字為什麼變了」。已篩選區不顯示數字（或僅顯示匹配總數），加入條件區顯示每個 tag 在當前條件下的交集數量。

### 4. Sidebar 分類與 Chip 區共用狀態

Sidebar 分類點擊不再是獨立篩選路徑，而是操作同一個 URL `tag[]` 參數。兩邊 UI 是同一狀態的不同投影，Sidebar 該 tag 顯示已選中狀態。

### 5. 飛行動畫使用 framer-motion layoutId

`framer-motion` 的 `layoutId` 可自動計算 FLIP 動畫路徑，Chip 從加入條件區飛到已篩選區（或反向），實作成本最低。

### 6. Edge Case：選了演員後，已選 tag 無匹配

保留 Chip 但在加入條件區對應項灰顯標 `(0)`，讓使用者自己決定是否移除。不自動移除。

## API Design

### GET /api/videos（擴展）

```
Parameters:
  tag: list[str]        # 多值，AND 邏輯
  include_facets: bool   # 是否回傳 tag facets

Response (when include_facets=true):
{
  items: [...],
  total: 5,
  page: 1,
  page_size: 24,
  tag_facets: [
    { name: "人妻", count: 1 },
    { name: "痴女", count: 0 },
    ...
  ]
}
```

`tag_facets` 回傳的是：在當前 actor + 已選 tags 條件下，每個「未選 + 已選」tag 的影片數量。按 count 降序排列。

### GET /api/actors/{actor_name}/tags

用於 Autocomplete 搜尋該演員的所有分類（不受當前已選 tag 影響的完整清單）。

```
Response:
[
  { name: "巨乳", video_count: 12 },
  { name: "中出", video_count: 8 },
  ...
]
```

## Component Design

### TagFacetBar (new)

```
Props:
  selectedTags: string[]
  tagFacets: { name: string, count: number }[]
  onAdd: (tag: string) => void
  onRemove: (tag: string) => void
  totalCount: number
  actorName?: string   # 影響 Autocomplete 的資料來源
```

- 使用 `framer-motion` 的 `<LayoutGroup>` + `layoutId={`tag-${name}`}`
- 已篩選區：`<AnimatePresence>` 包裹已選 Chip
- 加入條件區：前 N 個熱門 + Autocomplete
- `(0)` 的 Chip 灰顯（`disabled` 樣式）
