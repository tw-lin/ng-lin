# Functions 架構摘要 (GigHub Functions Architecture)

> 來源：`docs-old/architecture/GigHub-Functions_Architecture.md`。整理 Functions 分層、通訊模式與部署重點。

## 🏗️ 架構重點
- **模組化**：依職責拆分 functions-* 子專案，避免巨型 functions。
- **邊界**：UI → Service → Repository → Functions；前端不直接呼叫管理性質函式。
- **通訊**：HTTP Callable / HTTPS Endpoint；事件使用 Firestore 觸發或 Pub/Sub（避免未授權訂閱）。
- **部署隔離**：可單獨部署模組；敏感模組需獨立配額/環境變數。

## 🔌 主要流程
1) 前端經 Service 呼叫 functions（經 permission / blueprint 驗證）。
2) Functions 透過 Repository/Adapter 存取 Firestore / Storage。
3) 事件或回寫後，發布審計與通知（避免跨 Blueprint）。

## ✅ 檢查清單
- [ ] functions-* 使用單一責任，避免跨模組耦合
- [ ] I/O 模型清晰：Callable / HTTPS / PubSub / Firestore Trigger
- [ ] 權限：驗證 blueprintId 與角色；拒絕跨藍圖
- [ ] 環境：專案/階段分離（dev/stage/prod），機密不入前端
- [ ] 監控：日誌/指標/告警配置，成本與配額監控

## 相關來源
- `docs-old/architecture/GigHub-Functions_Architecture.md`
