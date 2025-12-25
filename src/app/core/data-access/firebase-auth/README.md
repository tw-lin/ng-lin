## core/auth

基礎設施層的認證邏輯集中在此，Feature 只能呼叫門面，不得直接碰 Firebase/Token。

### 結構
```
core/auth/
  ├─ auth.port.ts        # 能力定義 (Feature 依賴此介面)
  ├─ auth.facade.ts      # App 層門面，對外暴露登入/註冊/登出/重設
  ├─ auth.state.ts       # signals 狀態 (loading/currentUser/isAuthenticated)
  └─ infra/
       └─ firebase-auth.service.ts  # 實作：@angular/fire/auth + @delon/auth token 存取
```

### 責任分界
- Firebase 身分驗證：`firebase-auth.service.ts` 使用 `@angular/fire/auth`
- Token/Session：`firebase-auth.service.ts` 寫入/清空 `DA_SERVICE_TOKEN`（@delon/auth）
- 對 Feature 的唯一入口：`AuthFacade`（實作 `AuthPort`）
- Feature 不得知道 token 存放位置，也不得直接 import Firebase SDK

### 使用方式（Feature）
```ts
// 在頁面/元件中
private readonly auth = inject(AuthFacade);

await this.auth.signIn(email, password);
// or
await this.auth.signUp(email, password);
```
