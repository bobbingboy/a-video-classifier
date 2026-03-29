## ADDED Requirements

### Requirement: Dispatcher 動態讀取來源並過濾冷卻來源
每次呼叫 `fetch_metadata(code)` 時，dispatcher SHALL 從 DB 讀取所有 `enabled=true` 的來源，排除 `cooldown_until > now` 的來源，以 weight 降序排列後平行執行 fetch。

#### Scenario: 正常執行
- **WHEN** `fetch_metadata("SSIS-123")` 被呼叫
- **THEN** 系統從 DB 讀取 enabled 來源，跳過冷卻中的來源，剩餘來源平行執行，結果按 weight 優先順序合併

#### Scenario: 所有來源均在冷卻中
- **WHEN** 全部 enabled 來源均處於冷卻期
- **THEN** dispatcher 回傳 None（無法取得 metadata）

---

### Requirement: 每次 fetch 後更新 Stats
Dispatcher SHALL 在每個來源的 fetch 完成後（無論成功或失敗）更新 `scraper_stats`：
- 成功（回傳 dict）：`attempts++`、`successes++`、`consecutive_failures = 0`
- 失敗（回傳 None 或拋出例外）：`attempts++`、`consecutive_failures++`
- 每次更新 `last_attempt = now`

#### Scenario: Fetch 成功後 stats 更新
- **WHEN** 某來源成功回傳 metadata dict
- **THEN** 該來源的 `successes` 加一，`consecutive_failures` 重設為 0

#### Scenario: Fetch 失敗後 stats 更新
- **WHEN** 某來源回傳 None 或發生連線錯誤
- **THEN** 該來源的 `consecutive_failures` 加一，`successes` 不變

---

### Requirement: 連續失敗超過 Barrier 後進入冷卻
當某來源的 `consecutive_failures >= FAILURE_BARRIER` 時，系統 SHALL 設定 `cooldown_until = now + COOLDOWN_DURATION`，並重設 `consecutive_failures = 0`。

初版常數：`FAILURE_BARRIER = 5`，`COOLDOWN_DURATION = 30 分鐘`。

#### Scenario: 觸發冷卻
- **WHEN** 某來源連續失敗第 5 次
- **THEN** 系統設定 `cooldown_until = now + 30min`，`consecutive_failures` 重設為 0，下次 dispatch 跳過此來源

#### Scenario: 冷卻自動解除
- **WHEN** `cooldown_until` 時間已過
- **THEN** 下次 dispatch 時該來源重新參與執行，不需人工干預

---

### Requirement: Weight 計算
系統 SHALL 以 `successes / attempts` 計算 weight（成功率）。新來源（`attempts = 0`）的有效 weight SHALL 視為 `1.0`（給予初始信任）。

Weight 僅用於：
1. 合併結果時的欄位優先順序（weight 高的來源欄位優先）
2. 前端顯示的視覺排序（高 weight 排前面）

#### Scenario: 新來源的初始 weight
- **WHEN** 新來源建立後第一次執行 dispatch
- **THEN** 系統將該來源視為 weight=1.0，納入平行執行

#### Scenario: Weight 影響結果合併順序
- **WHEN** 多個來源均成功回傳 metadata
- **THEN** weight 較高的來源的 title、cover_url 等主要欄位優先採用

---

### Requirement: API 提供 Stats 資訊
`GET /api/scrapers/sources` 回應 SHALL 包含每個來源的以下計算欄位：
- `success_rate`: Float（0.0–1.0，`attempts=0` 時為 null）
- `in_cooldown`: Boolean
- `cooldown_until`: DateTime nullable

#### Scenario: 回傳 Stats
- **WHEN** 前端呼叫 `GET /api/scrapers/sources`
- **THEN** 每筆來源回應包含 `success_rate`、`in_cooldown`、`cooldown_until`
