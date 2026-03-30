## MODIFIED Requirements

### Requirement: 爬蟲執行策略（多來源標籤合併）
metadata 擷取時，系統 SHALL 並行執行所有可用的 scrapers（Javbus、JavDB、AI fallback）。主欄位（title、cover_url、studio、actors、release_date）SHALL 採優先序取第一個非 null 值（Javbus > JavDB > AI fallback）。tags 欄位 SHALL 收集所有來源的回傳結果取 union 後去重，再經 AI 清洗步驟處理。

#### Scenario: 多個 scrapers 均有結果時，主欄位採優先序
- **WHEN** Javbus 與 JavDB 均成功回傳 metadata
- **THEN** title、cover_url、studio 使用 Javbus 的值；tags 為兩者的 union（去重後清洗）

#### Scenario: 主 scraper 失敗時，主欄位 fallback 至次要來源
- **WHEN** Javbus 回傳 None，JavDB 成功回傳 metadata
- **THEN** title、cover_url、studio 使用 JavDB 的值；tags 來自 JavDB（清洗後）

#### Scenario: 所有 scrapers 均失敗
- **WHEN** Javbus、JavDB、AI fallback 均回傳 None
- **THEN** 系統將影片標記為 `status = "needs_manual_review"`，不寫入任何 metadata
