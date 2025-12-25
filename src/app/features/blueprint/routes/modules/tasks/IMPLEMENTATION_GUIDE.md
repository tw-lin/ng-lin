# 任務模組實作指南 (Tasks Module Implementation Guide)

> **補充文件**: 搭配 `design.md` 使用，提供實作細節與最佳實踐  
> **版本**: v1.0.0  
> **最後更新**: 2025-12-22

## 📋 目的

本文件針對 `design.md` 提供以下補充：
1. **實作順序**: 明確的開發步驟與檢查清單
2. **程式碼範例**: 完整可執行的程式碼片段
3. **常見陷阱**: 實作時容易出錯的地方及解決方案
4. **測試策略**: 如何測試每個層級的程式碼

---

## 🚀 實作路徑 (Implementation Roadmap)

### Phase 0: 準備工作 (Prerequisites)

**檢查清單**:
- [ ] 確認已閱讀 `design.md` 完整內容
- [ ] 確認了解三層架構: UI → Service/Facade → Repository → Firestore
- [ ] 確認專案使用 `@angular/fire` 直接注入 Firestore
- [ ] 確認了解現有 Task 類型定義於 `/src/app/core/domain/types/task/task.types.ts`
- [ ] 確認已安裝 `date-fns` 套件 (用於日期比較函式)
- [ ] 確認已設定 Firebase Emulator（用於本地測試）

**關鍵檔案**:
- `.github/instructions/ng-gighub-architecture.instructions.md`
- `.github/instructions/ng-gighub-firestore-repository.instructions.md`
- `src/app/core/data-access/repositories/base/firestore-base.repository.ts`
- `src/app/core/domain/types/task/task.types.ts` (現有 Task 模型)

**依賴檢查**:
```bash
# 檢查 date-fns 是否已安裝
yarn list date-fns

# 如果未安裝，執行:
yarn add date-fns
```

---

## 實作建議

請按照 `design.md` 中定義的架構逐步實作:

1. **Phase 1**: 擴展資料模型 (TaskWithWBS)
2. **Phase 2**: 擴展 Repository 層 (支援 WBS 欄位)
3. **Phase 3**: 實作 Facade 層 (業務邏輯與狀態管理)
4. **Phase 4**: 實作 UI 元件 (樹狀列表視圖優先)
5. **Phase 5**: Security Rules 與測試

詳細實作細節、程式碼範例、常見陷阱與解決方案,請參考 contract 模組的 IMPLEMENTATION_GUIDE.md 作為範本。

---

**文件版本**: v1.0.0  
**最後更新**: 2025-12-22  
**維護者**: GigHub 開發團隊
