### Core

**應/Should**
- 承載基礎設施與跨功能的能力：認證、守衛、攔截器、全域服務、跨功能的 repositories。
- 只暴露 Facade/Port 讓 feature 呼叫；隱藏實際的 Firebase/@delon/auth/token 細節。
- 保持 `providers` 為主，不放 UI。

**責任邊界**
- `core/auth`: 認證門面（`auth.facade.ts`）、能力定義（`auth.port.ts`）、狀態（signals）、與基礎實作（`infra/firebase-auth.service.ts`）。
  - @angular/fire/auth 只能出現在 `core/auth/infra`.
  - @delon/auth (DA_SERVICE_TOKEN) 只能在 core 層管理 token。
  - Features 只能呼叫 `AuthFacade`，不得直接觸碰 token 儲存或 Firebase SDK。
- `core/guards`, `core/interceptors`, `core/services`: 其他跨域基礎設施。

**禁止**
- Feature 直接操作 Firestore/Auth/Token。
- 在 feature 層存取 DA_SERVICE_TOKEN。
- 在 component/route 直接 new SDK 實例。
