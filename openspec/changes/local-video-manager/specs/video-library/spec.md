## ADDED Requirements

### Requirement: 儲存影片核心資料
系統 SHALL 使用 SQLite 資料庫儲存每部影片的核心 metadata，schema 如下：

`videos` 表：`id`, `code`（番號，唯一索引）, `title`, `file_path`, `cover_url`, `cover_local_path`, `studio_id`, `release_date`, `duration`, `metadata_source`（`javbus`/`javdb`/`ai`/`manual`）, `status`（`ok`/`unmatched`/`needs_manual_review`/`file_missing`）, `created_at`, `updated_at`

#### Scenario: 新增影片記錄
- **WHEN** 系統成功解析番號並抓取 metadata
- **THEN** 以番號為唯一鍵寫入 `videos` 表，若番號已存在則更新而非重複新增

#### Scenario: 查詢不存在的影片
- **WHEN** 以不存在的 `id` 或 `code` 查詢
- **THEN** 系統回傳 404，不回傳空物件

### Requirement: 管理演員與影片的多對多關聯
系統 SHALL 維護 `actors` 表與 `video_actors` 關聯表，支援一部影片多位演員。

#### Scenario: 新增演員關聯
- **WHEN** metadata 中包含多位演員
- **THEN** 每位演員寫入 `actors` 表（若不存在），並在 `video_actors` 建立關聯

#### Scenario: 同名演員不重複建立
- **WHEN** 不同影片的 metadata 包含相同演員名稱
- **THEN** `actors` 表中只存在一筆記錄，多部影片共用同一 `actor_id`

### Requirement: 管理分類標籤與出版商
系統 SHALL 維護 `tags` 表、`video_tags` 關聯表，以及 `studios` 表。

#### Scenario: 新增分類標籤
- **WHEN** metadata 包含分類資訊
- **THEN** 每個分類寫入 `tags` 表（若不存在），並在 `video_tags` 建立關聯

#### Scenario: 出版商資料不重複
- **WHEN** 多部影片屬於同一出版商
- **THEN** `studios` 表只存一筆，`videos.studio_id` 指向同一筆記錄

### Requirement: 支援手動更新 metadata
系統 SHALL 允許使用者手動修改任何影片的 metadata 欄位，修改後 `metadata_source` 更新為 `manual`。

#### Scenario: 手動修改標題
- **WHEN** 使用者透過 UI 修改影片標題並儲存
- **THEN** 資料庫更新對應記錄，`metadata_source` 設為 `manual`，`updated_at` 更新
