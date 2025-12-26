# Firebase Adapter Roadmap

> 來源：`docs-old/architecture/firebase-adapter-implementation-roadmap.md`、`firebase-adapter-pattern-proposal.md`。描述 adapter 模式與導入里程碑。

## 🎯 目標
- 將 Firebase SDK 介面封裝為 Adapter，穩定 API、便於測試與遷移。
- 逐步替換直接 SDK 呼叫，降低耦合。

## 🛠️ 實作步驟
1) **定義 Adapter 介面**：Firestore/Auth/Storage/Functions。
2) **封裝 SDK**：提供重試、欄位轉換、日誌、權限前置檢查。
3) **分階段替換**：優先高風險/高頻呼叫；確保單元測試覆蓋。
4) **移除直呼**：完成替換後封鎖新直呼。

## ✅ 檢查清單
- [ ] Adapter 介面明確、可替換
- [ ] 重試與錯誤分類（permission/unauthenticated/retryable）
- [ ] 欄位轉換與驗證一致
- [ ] 單元測試/Emulator 覆蓋
- [ ] 日誌與指標可追蹤

## 相關來源
- `docs-old/architecture/firebase-adapter-implementation-roadmap.md`
- `docs-old/architecture/firebase-adapter-pattern-proposal.md`
