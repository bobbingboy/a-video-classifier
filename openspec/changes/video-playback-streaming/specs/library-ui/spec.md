## ADDED Requirements

### Requirement: VideoDetail 頁面顯示內嵌影片播放器
系統 SHALL 在 VideoDetail 頁面中，當影片 `file_path` 存在且副檔名為 `.mp4` 時，顯示原生 HTML5 `<video>` 播放器。

#### Scenario: .mp4 影片顯示播放器
- **WHEN** 使用者開啟某部影片的 VideoDetail 頁面，且該影片 `file_path` 以 `.mp4` 結尾
- **THEN** 頁面顯示 `<video>` 播放器，src 指向 `/api/videos/{id}/stream`，具備 controls 屬性

#### Scenario: 非 .mp4 影片不顯示播放器
- **WHEN** 使用者開啟某部影片的 VideoDetail 頁面，且該影片 `file_path` 副檔名不是 `.mp4`
- **THEN** 頁面不顯示播放器區塊，其餘 metadata 正常顯示

#### Scenario: 無 file_path 時不顯示播放器
- **WHEN** 影片的 `file_path` 為 null 或空字串
- **THEN** 頁面不顯示播放器區塊
