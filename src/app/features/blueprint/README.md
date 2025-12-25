# Blueprint Feature (`features/blueprint`)

Blueprint 領域的可重用功能模組骨架，對應 Platform-1 演進版資料夾結構。此層僅提供業務能力，UI 入口仍由 `routes/blueprint` 維持。

## 目錄結構

```
features/
  blueprint/
    components/   # 頁面/區塊元件（無資料存取）
    services/     # 用例協調與 facade（呼叫 store/repo）
    stores/       # Signals 狀態
    models/       # 型別與 domain 模型
    README.md
    AGENTS.md
```

## 原則
- **禁止** 直接使用 Firebase SDK；僅透過 `@angular/fire` 注入的服務與集中 providers。
- **禁止** 直接耦合 routes/core/shared 內部實作；若需跨層，請定義公開介面或 facade。
- 使用 `inject()` + signals；避免 Subject/BehaviorSubject。
- Repository/Service/Store 職責分離：Repository 只存取資料；Service 統籌用例；Store 管理狀態。

## TODO
- [ ] 定義 Blueprint Firestore collection 常數與 converters（共用 `src/app/firebase/constants` / `utils`）。
- [x] 定義 Blueprint Firestore collection 常數與 converters（共用 `src/app/firebase/constants` / `utils`）。
- [x] 實作 Blueprint repository/service/store（列表/詳情 CRUD 範圍）。
- [x] 建立 facade 匯出於 `features/blueprint/index.ts` 供 routes 使用。
- [ ] 與 `routes/blueprint` 的 resolver/guard 串接（保持 DI、無直接 SDK）。
