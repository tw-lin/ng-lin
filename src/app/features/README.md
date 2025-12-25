# Features Module

**應** 承載可重用的業務功能模組（如 module-manager、跨 Blueprint 功能），介於 `shared/` 的通用 UI 與 `routes/` 的頁面實作之間。  
**Should** host reusable business feature modules (e.g., module manager, cross-blueprint capabilities), sitting between `shared/` utilities and page-level implementations in `routes/`.

**應該** 為每個功能模組提供自己的 README/AGENTS.md，並維持清晰的目錄結構：

```
features/
├── <feature>/
│   ├── components/
│   ├── services/
│   ├── stores/
│   ├── models/
│   ├── README.md
│   └── AGENTS.md
```

**不應** 混入版面配置或僅 UI 級別的元件（請放入 `shared/`）。  
**Should not** include layout-only or purely generic UI pieces (place those in `shared/`).  
**不應** 直接操作 Firestore（透過 `core/` repositories 或服務）。  
**Should not** access Firestore directly (go through `core/` repositories or services).
**不應** 處理認證 Token 或 Firebase SDK，登入/註冊請只呼叫 `core/auth` 提供的 `AuthFacade`。  
**Should not** manage auth tokens or Firebase SDK; call `core/auth/AuthFacade` for login/sign-up flows.

### 現有功能模組 / Existing Feature Modules
- `account/`：帳戶領域的可重用能力（profile / dashboard / settings），遵循 Platform-1 的進化版資料夾結構。
- `blueprint/`：Blueprint 領域骨架，預留列表/詳情/成員等 slice，後續接上 @angular/fire DI 與 routes/blueprint。
