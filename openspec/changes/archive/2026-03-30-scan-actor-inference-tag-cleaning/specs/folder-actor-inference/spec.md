## ADDED Requirements

### Requirement: Unmatched 影片依資料夾推斷演員歸屬
掃描時，對無法解析番號的影片（unmatched），系統 SHALL 從其 `file_path` 向上遍歷父資料夾，對每一層資料夾名稱查詢 `actors` 表，找到第一個精確匹配的演員後建立 `VideoActor` 關聯。若遍歷至根目錄仍未找到匹配，則不建立任何演員關聯。

#### Scenario: 父資料夾名稱為已知演員
- **WHEN** unmatched 影片的路徑為 `/Videos/天使もえ/unknown.mkv`，且 `actors` 表中存在 `name = "天使もえ"` 的記錄
- **THEN** 系統建立該影片與演員「天使もえ」的 `VideoActor` 關聯

#### Scenario: 多層子資料夾，演員名在較上層
- **WHEN** unmatched 影片的路徑為 `/Videos/三上悠亜/系列A/unknown.mkv`，且 `actors` 表中存在 `name = "三上悠亜"` 的記錄，但 `name = "系列A"` 不存在
- **THEN** 系統跳過「系列A」，找到「三上悠亜」並建立 `VideoActor` 關聯

#### Scenario: 路徑中無已知演員資料夾
- **WHEN** unmatched 影片的路徑為 `/Videos/雜項/unknown.mkv`，且路徑中所有資料夾名稱在 `actors` 表中均無匹配
- **THEN** 系統不建立任何 `VideoActor` 關聯，影片僅以 `status = "unmatched"` 儲存

#### Scenario: 路徑中無資料夾資訊（根目錄檔案）
- **WHEN** unmatched 影片的 `file_path` 無父資料夾（或父資料夾為掃描根目錄本身）
- **THEN** 系統不建立任何 `VideoActor` 關聯
