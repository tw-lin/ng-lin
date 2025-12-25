## Identity & Auth 完整實現結構樹圖

```
src/app/
├── core/
│   ├── auth/                                    # 身份認證核心模組
│   │   ├── services/
│   │   │   ├── auth.service.ts                  # 核心認證服務 (整合 Firebase + DELON)
│   │   │   ├── token.service.ts                 # Token 管理 (實作 ITokenService)
│   │   │   ├── session.service.ts               # Session 管理
│   │   │   ├── user-context.service.ts          # 當前用戶上下文
│   │   │   └── auth-state.service.ts            # 認證狀態管理 (Signals)
│   │   │
│   │   ├── guards/
│   │   │   ├── auth.guard.ts                    # 基礎認證守衛
│   │   │   ├── role.guard.ts                    # 角色守衛
│   │   │   ├── permission.guard.ts              # 權限守衛
│   │   │   ├── email-verified.guard.ts          # Email 驗證守衛
│   │   │   └── mfa.guard.ts                     # 多因素認證守衛
│   │   │
│   │   ├── interceptors/
│   │   │   ├── auth-token.interceptor.ts        # 自動注入 Firebase ID Token
│   │   │   ├── auth-error.interceptor.ts        # 401/403 統一處理
│   │   │   └── token-refresh.interceptor.ts     # Token 自動刷新
│   │   │
│   │   ├── providers/
│   │   │   ├── delon-auth.provider.ts           # DELON Auth 配置
│   │   │   ├── firebase-auth.provider.ts        # Firebase Auth 配置
│   │   │   └── auth-config.provider.ts          # 統一認證配置
│   │   │
│   │   ├── strategies/
│   │   │   ├── firebase-token.strategy.ts       # Firebase Token 策略
│   │   │   ├── jwt.strategy.ts                  # JWT 解析策略
│   │   │   └── session.strategy.ts              # Session 持久化策略
│   │   │
│   │   ├── models/
│   │   │   ├── auth-user.model.ts               # 認證用戶模型
│   │   │   ├── auth-token.model.ts              # Token 模型
│   │   │   ├── auth-state.model.ts              # 認證狀態
│   │   │   ├── login-credentials.model.ts       # 登入憑證
│   │   │   ├── oauth-provider.enum.ts           # OAuth 提供者
│   │   │   └── auth-error.model.ts              # 認證錯誤
│   │   │
│   │   ├── validators/
│   │   │   ├── password-strength.validator.ts   # 密碼強度驗證
│   │   │   ├── email-domain.validator.ts        # Email 域名驗證
│   │   │   └── username-format.validator.ts     # 用戶名格式驗證
│   │   │
│   │   ├── decorators/
│   │   │   ├── require-auth.decorator.ts        # 方法級認證裝飾器
│   │   │   ├── require-role.decorator.ts        # 角色要求裝飾器
│   │   │   └── audit-auth.decorator.ts          # 認證操作審計
│   │   │
│   │   └── auth.module.ts                       # 認證模組
│   │
│   ├── tenant/                                  # 租戶管理 (與 Auth 緊密關聯)
│   │   ├── services/
│   │   │   ├── tenant.service.ts                # 租戶上下文服務
│   │   │   ├── tenant-resolver.service.ts       # 租戶解析 (subdomain/path)
│   │   │   ├── tenant-membership.service.ts     # 用戶-租戶關係
│   │   │   └── tenant-switcher.service.ts       # 租戶切換邏輯
│   │   │
│   │   ├── guards/
│   │   │   ├── tenant.guard.ts                  # 租戶邊界守衛
│   │   │   └── tenant-membership.guard.ts       # 租戶成員守衛
│   │   │
│   │   ├── interceptors/
│   │   │   └── tenant-context.interceptor.ts    # 注入 X-Tenant-ID
│   │   │
│   │   ├── models/
│   │   │   ├── tenant.model.ts
│   │   │   ├── tenant-membership.model.ts
│   │   │   └── tenant-context.model.ts
│   │   │
│   │   └── tenant.module.ts
│   │
│   ├── permission/                              # 權限管理 (RBAC)
│   │   ├── services/
│   │   │   ├── permission.service.ts            # 權限計算引擎
│   │   │   ├── role.service.ts                  # 角色管理
│   │   │   ├── acl.service.ts                   # ACL (訪問控制列表)
│   │   │   └── permission-cache.service.ts      # 權限緩存
│   │   │
│   │   ├── guards/
│   │   │   └── permission.guard.ts              # 細粒度權限守衛
│   │   │
│   │   ├── directives/
│   │   │   ├── has-permission.directive.ts      # *appHasPermission
│   │   │   └── has-role.directive.ts            # *appHasRole
│   │   │
│   │   ├── pipes/
│   │   │   ├── can.pipe.ts                      # {{ 'repo:write' | can }}
│   │   │   └── is-role.pipe.ts                  # {{ 'admin' | isRole }}
│   │   │
│   │   ├── models/
│   │   │   ├── permission.model.ts
│   │   │   ├── role.model.ts
│   │   │   ├── resource.model.ts
│   │   │   └── permission-matrix.model.ts
│   │   │
│   │   └── permission.module.ts
│   │
│   ├── global-event-bus/                                   # 全域事件總線 (Global Event Bus)
│   │   ├── USAGE.md
│   │   ├── README.md
│   │   ├── index.ts
│   │   ├── IMPLEMENTATION.md
│   │   ├── constants/
│   │   │   ├── index.ts
│   │   │   ├── event-types.constants.ts
│   │   │   └── event-bus-tokens.ts
│   │   ├── consumers/
│   │   │   ├── search-indexer.consumer.ts
│   │   │   ├── notification.consumer.ts
│   │   │   ├── index.ts
│   │   │   ├── audit-log.consumer.ts
│   │   │   ├── analytics.consumer.ts
│   │   │   └── activity-feed.consumer.ts
│   │   ├── decorators/
│   │   │   ├── event-handler.decorator.ts
│   │   │   ├── index.ts
│   │   │   ├── retry.decorator.ts
│   │   │   └── subscribe.decorator.ts
│   │   ├── domain-events/
│   │   │   ├── index.ts
│   │   │   ├── task-events.ts
│   │   │   ├── user-events.ts
│   │   │   └── blueprint-events.ts
│   │   ├── errors/
│   │   │   ├── serialization.error.ts
│   │   │   ├── index.ts
│   │   │   ├── event-handler.error.ts
│   │   │   └── event-bus.error.ts
│   │   ├── examples/
│   │   │   ├── decorators-example.ts
│   │   │   ├── index.ts
│   │   │   ├── demo.component.ts
│   │   │   ├── analytics.consumer.ts
│   │   │   ├── notification.consumer.ts
│   │   │   ├── phase5-integration-demo.component.ts
│   │   │   ├── versioning-example.ts
│   │   │   ├── task-events.ts
│   │   │   └── task.service.ts
│   │   ├── implementations/
│   │   │   ├── index.ts
│   │   │   ├── in-memory/
│   │   │   │   ├── index.ts
│   │   │   │   ├── in-memory-event-bus.ts
│   │   │   │   ├── in-memory-event-store.ts
│   │   │   │   ├── in-memory-event-store.spec.ts
│   │   │   │   ├── in-memory-event-bus.spec.ts
│   │   │   │   └── in-memory-event-store.spec.ts
│   │   │   └── firebase/
│   │   │       ├── index.ts
│   │   │       ├── firebase-event-store.ts
│   │   │       └── firebase-event-bus.ts
│   │   ├── interfaces/
│   │   │   ├── index.ts
│   │   │   ├── event-store.interface.ts
│   │   │   ├── event-handler.interface.ts
│   │   │   ├── event-bus.interface.ts
│   │   │   ├── subscription.interface.ts
│   │   │   └── retry-policy.interface.ts
│   │   ├── models/
│   │   │   ├── index.ts
│   │   │   ├── auth-audit-event.model.ts
│   │   │   ├── permission-audit-event.model.ts
│   │   │   ├── subscription.ts
│   │   │   ├── event-metadata.ts
│   │   │   ├── event-envelope.ts
│   │   │   └── base-event.ts
│   │   ├── services/
│   │   │   ├── index.ts
│   │   │   ├── auth-audit.service.ts            # 認證事件審計
│   │   │   ├── permission-audit.service.ts      # 權限變更審計
│   │   │   ├── event-dispatcher.service.ts
│   │   │   ├── event-serializer.service.ts
│   │   │   ├── in-memory-event-bus.service.ts
│   │   │   ├── in-memory-event-bus.service.spec.ts
│   │   │   ├── in-memory-event-store.service.ts
│   │   │   ├── in-memory-event-store.service.spec.ts
│   │   │   ├── event-consumer.base.ts
│   │   │   ├── event-validator.service.ts
│   │   │   ├── retry-manager.service.ts
│   │   │   └── dead-letter-queue.service.ts
│   │   ├── testing/
│   │   │   ├── index.ts
│   │   │   ├── mock-event-bus.ts
│   │   │   ├── test-event.ts
│   │   │   └── event-bus-test.utils.ts
│   │   ├── utils/
│   │   │   ├── index.ts
│   │   │   ├── event-matcher.util.ts
│   │   │   ├── event-id-generator.util.ts
│   │   │   └── correlation-tracker.util.ts
│   │   └── versioning/
│   │       ├── index.ts
│   │       ├── upcaster-chain.ts
│   │       ├── event-version.interface.ts
│   │       ├── versioned-event-bus.ts
│   │       ├── event-upcaster.base.ts
│   │       └── version-migration.service.ts
│   │
│   └── core.module.ts
│
├── firebase/
│   ├── auth/                                    # Firebase Auth 封裝層
│   │   ├── services/
│   │   │   ├── firebase-auth-adapter.service.ts # Firebase Auth 適配器
│   │   │   ├── firebase-token.service.ts        # Firebase Token 操作
│   │   │   ├── firebase-user.service.ts         # Firebase User 資料
│   │   │   ├── email-password.service.ts        # Email/Password 認證
│   │   │   ├── oauth-provider.service.ts        # OAuth 提供者 (Google, GitHub)
│   │   │   ├── phone-auth.service.ts            # 手機號認證
│   │   │   ├── email-verification.service.ts    # Email 驗證
│   │   │   ├── password-reset.service.ts        # 密碼重置
│   │   │   └── mfa.service.ts                   # 多因素認證 (2FA/TOTP)
│   │   │
│   │   ├── operators/
│   │   │   ├── auth-state.operator.ts           # RxJS 認證狀態操作符
│   │   │   └── token-refresh.operator.ts        # Token 刷新操作符
│   │   │
│   │   ├── models/
│   │   │   ├── firebase-user.model.ts
│   │   │   ├── firebase-credential.model.ts
│   │   │   └── firebase-auth-error.model.ts
│   │   │
│   │   └── firebase-auth.module.ts
│   │
│   ├── firestore/
│   │   ├── services/
│   │   │   ├── user-profile.service.ts          # 用戶擴展資料 (Firestore)
│   │   │   ├── tenant-membership-db.service.ts  # 用戶-租戶關係存儲
│   │   │   └── permission-db.service.ts         # 權限數據存儲
│   │   │
│   │   └── collections/
│   │       ├── users.collection.ts              # users 集合操作
│   │       ├── tenants.collection.ts            # tenants 集合操作
│   │       └── memberships.collection.ts        # memberships 集合操作
│   │
│   ├── functions/
│   │   ├── services/
│   │   │   ├── auth-functions.service.ts        # 認證相關 Cloud Functions
│   │   │   └── user-functions.service.ts        # 用戶管理 Functions
│   │   │
│   │   └── models/
│   │       └── auth-function-request.model.ts
│   │
│   └── firebase.module.ts
│
├── features/
│   ├── auth/                                    # 認證功能模組 (UI + 業務)
│   │   ├── pages/
│   │   │   ├── login/
│   │   │   │   ├── login.component.ts
│   │   │   │   ├── login.component.html
│   │   │   │   └── login.component.less
│   │   │   │
│   │   │   ├── register/
│   │   │   │   ├── register.component.ts
│   │   │   │   ├── register.component.html
│   │   │   │   └── register.component.less
│   │   │   │
│   │   │   ├── forgot-password/
│   │   │   │   └── forgot-password.component.ts
│   │   │   │
│   │   │   ├── reset-password/
│   │   │   │   └── reset-password.component.ts
│   │   │   │
│   │   │   ├── email-verification/
│   │   │   │   └── email-verification.component.ts
│   │   │   │
│   │   │   ├── mfa-setup/
│   │   │   │   ├── mfa-setup.component.ts
│   │   │   │   └── qrcode-display/
│   │   │   │
│   │   │   ├── mfa-verify/
│   │   │   │   └── mfa-verify.component.ts
│   │   │   │
│   │   │   ├── oauth-callback/
│   │   │   │   └── oauth-callback.component.ts
│   │   │   │
│   │   │   └── tenant-select/
│   │   │       └── tenant-select.component.ts   # 多租戶選擇頁面
│   │   │
│   │   ├── components/
│   │   │   ├── login-form/                      # 登入表單組件
│   │   │   ├── register-form/                   # 註冊表單組件
│   │   │   ├── oauth-buttons/                   # OAuth 按鈕組
│   │   │   ├── password-strength-meter/         # 密碼強度指示器
│   │   │   ├── mfa-input/                       # MFA 驗證碼輸入
│   │   │   └── auth-error-display/              # 認證錯誤顯示
│   │   │
│   │   ├── services/
│   │   │   ├── auth-flow.service.ts             # 認證流程編排
│   │   │   └── auth-analytics.service.ts        # 認證事件追蹤
│   │   │
│   │   ├── auth-routing.module.ts
│   │   └── auth.module.ts
│   │
│   ├── user-profile/                            # 用戶資料管理
│   │   ├── pages/
│   │   │   ├── profile-view/
│   │   │   ├── profile-edit/
│   │   │   ├── security-settings/               # 安全設定
│   │   │   │   ├── password-change/
│   │   │   │   ├── mfa-management/
│   │   │   │   ├── sessions-management/         # 活動會話管理
│   │   │   │   └── access-tokens/               # 個人訪問令牌
│   │   │   │
│   │   │   └── account-settings/
│   │   │
│   │   ├── components/
│   │   │   ├── avatar-upload/
│   │   │   ├── profile-form/
│   │   │   └── linked-accounts/                 # 關聯的 OAuth 帳號
│   │   │
│   │   └── user-profile.module.ts
│   │
│   ├── tenant-management/                       # 租戶管理功能
│   │   ├── pages/
│   │   │   ├── tenant-list/                     # 用戶所屬租戶列表
│   │   │   ├── tenant-create/                   # 創建租戶
│   │   │   ├── tenant-settings/
│   │   │   │   ├── general/
│   │   │   │   ├── members/                     # 成員管理
│   │   │   │   │   ├── member-list/
│   │   │   │   │   ├── member-invite/
│   │   │   │   │   └── member-roles/
│   │   │   │   │
│   │   │   │   ├── teams/                       # 團隊管理
│   │   │   │   ├── sso-settings/                # SSO 設定
│   │   │   │   └── security-policies/           # 安全策略
│   │   │   │
│   │   │   └── tenant-audit-logs/               # 租戶審計日誌
│   │   │
│   │   └── tenant-management.module.ts
│   │
│   └── admin/                                   # 系統管理功能
│       ├── pages/
│       │   ├── user-management/                 # 全局用戶管理
│       │   ├── tenant-management/               # 全局租戶管理
│       │   ├── auth-audit-logs/                 # 認證審計日誌
│       │   └── security-monitoring/             # 安全監控
│       │
│       └── admin.module.ts
│
├── layout/
│   ├── components/
│   │   ├── main-layout/
│   │   │   ├── header/
│   │   │   │   ├── user-dropdown/              # 用戶下拉選單
│   │   │   │   │   ├── user-info/
│   │   │   │   │   ├── tenant-switcher/        # 租戶切換器
│   │   │   │   │   ├── profile-link/
│   │   │   │   │   ├── settings-link/
│   │   │   │   │   └── logout-button/
│   │   │   │   │
│   │   │   │   └── auth-status-indicator/      # 認證狀態指示器
│   │   │   │
│   │   │   └── sidebar/
│   │   │       └── user-panel/                 # 側邊欄用戶面板
│   │   │
│   │   └── auth-layout/                        # 認證頁面專用佈局
│   │       ├── auth-layout.component.ts
│   │       ├── auth-header/
│   │       └── auth-footer/
│   │
│   └── layout.module.ts
│
├── shared/
│   ├── components/
│   │   ├── avatar/                             # 用戶頭像組件
│   │   │   ├── avatar.component.ts
│   │   │   └── avatar-group.component.ts       # 頭像組
│   │   │
│   │   ├── user-badge/                         # 用戶徽章
│   │   ├── role-badge/                         # 角色徽章
│   │   ├── permission-badge/                   # 權限徽章
│   │   ├── tenant-badge/                       # 租戶徽章
│   │   │
│   │   └── auth-guard-fallback/                # 守衛失敗時的提示組件
│   │
│   ├── directives/
│   │   ├── authenticated.directive.ts          # *appAuthenticated
│   │   ├── has-permission.directive.ts         # *appHasPermission="'repo:write'"
│   │   ├── has-role.directive.ts               # *appHasRole="'admin'"
│   │   └── tenant-scope.directive.ts           # *appTenantScope
│   │
│   ├── pipes/
│   │   ├── user-display-name.pipe.ts           # 顯示用戶名
│   │   ├── role-name.pipe.ts                   # 角色名稱轉換
│   │   ├── permission-check.pipe.ts            # 權限檢查
│   │   └── tenant-name.pipe.ts                 # 租戶名稱
│   │
│   └── shared.module.ts
│
├── app.config.ts                               # Angular 20 App Config
├── app.routes.ts                               # 路由配置
└── app.component.ts
```

---

## 交互拓撲圖

### 1. 整體架構層級

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI Layer                                 │
│  (features/auth, layout, shared components)                      │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Core Auth Module (統一認證門面)                          │  │
│  │  - AuthService (整合層)                                   │  │
│  │  - TokenService (實作 DA_SERVICE_TOKEN)                   │  │
│  │  - UserContextService                                     │  │
│  └────────────┬─────────────────────────────────────────────┘  │
│               │                                                  │
│  ┌────────────┼─────────────────┬──────────────────┐           │
│  │            │                 │                  │           │
│  ↓            ↓                 ↓                  ↓           │
│ Tenant     Permission        Audit            Session          │
│ Service    Service           Service          Service          │
└──────┬──────────┬──────────────┬─────────────────┬─────────────┘
       │          │              │                 │
       └──────────┴──────────────┴─────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│              Firebase Integration Layer                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Firebase Auth Adapter (封裝 @angular/fire/auth)         │  │
│  │  - Email/Password, OAuth, Phone, MFA                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Firestore User Data (用戶擴展資料)                       │  │
│  │  - User Profile, Tenant Membership, Permissions          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Firebase Backend                              │
│  - Firebase Authentication                                       │
│  - Cloud Firestore                                               │
│  - Cloud Functions (Custom Claims, Triggers)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. DELON Auth 整合拓撲

```
┌─────────────────────────────────────────────────────────────────┐
│                      DELON Framework                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  @delon/auth                                             │  │
│  │  - DA_SERVICE_TOKEN (Interface)                          │  │
│  │  - SimpleGuard (內建守衛)                                │  │
│  │  - JWTGuard (內建守衛)                                   │  │
│  └────────────────┬─────────────────────────────────────────┘  │
└───────────────────┼──────────────────────────────────────────────┘
                    │
                    │ 實作
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│              Core Auth Module (自訂實作)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  TokenService implements ITokenService                   │  │
│  │  - get/set/clear/change                                  │  │
│  │  - 橋接 Firebase Auth 與 DELON                           │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                              │
│  ┌────────────────┼─────────────────────────────────────────┐  │
│  │  AuthService (業務門面)                                  │  │
│  │  - login/logout/register                                 │  │
│  │  - 協調 Firebase + DELON + Tenant + Permission           │  │
│  └────────────────┬─────────────────────────────────────────┘  │
└───────────────────┼──────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ↓                       ↓
┌──────────────────┐   ┌───────────────────┐
│ Firebase Auth    │   │ DELON Guards      │
│ Adapter          │   │ - SimpleGuard     │
│                  │   │ - JWTGuard        │
└──────────────────┘   └───────────────────┘
```

---

### 3. 完整認證流程

```
用戶訪問受保護路由
    ↓
┌────────────────────────────────────────┐
│  Route Guard (AuthGuard)               │
│  - 檢查 TokenService.get()             │
└────────────┬───────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ↓             ↓
   有 Token      無 Token
      │             │
      │             └──► 重定向到 /auth/login
      │
      ↓
┌────────────────────────────────────────┐
│  驗證 Token 有效性                      │
│  - Firebase Auth.currentUser           │
│  - Token 未過期?                        │
└────────────┬───────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ↓             ↓
   有效          無效/過期
      │             │
      │             └──► 觸發 Token 刷新
      │                      │
      │                      ├─► 成功 → 繼續
      │                      └─► 失敗 → 重定向登入
      │
      ↓
┌────────────────────────────────────────┐
│  載入用戶上下文                         │
│  1. UserContextService.load()          │
│  2. TenantService.resolveTenant()      │
│  3. PermissionService.loadPermissions()│
└────────────┬───────────────────────────┘
             │
             ↓
┌────────────────────────────────────────┐
│  權限檢查 (PermissionGuard)            │
│  - 檢查當前路由所需權限                 │
└────────────┬───────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ↓             ↓
   有權限        無權限
      │             │
      │             └──► 顯示 403 頁面
      │
      ↓
   允許訪問路由
```

---

### 4. 登入流程詳細拓撲

```
用戶輸入 Email/Password 點擊登入
    ↓
┌─────────────────────────────────────────────────────────┐
│  LoginComponent                                          │
│  - 表單驗證                                               │
│  - 呼叫 AuthService.login(credentials)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│  AuthService.login()                                     │
│  1. 呼叫 FirebaseAuthAdapter.signInWithEmail()           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│  FirebaseAuthAdapter (firebase/auth)                     │
│  - signInWithEmailAndPassword(auth, email, password)     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
        Firebase Authentication Backend
                     │
             ┌───────┴───────┐
             │               │
             ↓               ↓
         成功              失敗
             │               │
             │               └──► 返回錯誤 → 顯示提示
             │
             ↓
┌─────────────────────────────────────────────────────────┐
│  獲取 Firebase User                                      │
│  - user.getIdToken() 獲取 ID Token                       │
│  - user.getIdTokenResult() 獲取 Custom Claims           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│  AuthService 處理登入成功                                 │
│  1. TokenService.set(token, user) → 存儲到 DELON         │
│  2. UserContextService.setUser(user)                     │
│  3. 查詢 Firestore: users/{uid} 獲取擴展資料              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│  TenantService.resolveTenant()                           │
│  1. 查詢 memberships 集合: where('user_id', '==', uid)   │
│  2. 獲取用戶所屬租戶列表                                  │
│  3. 決定當前租戶 (單租戶直接設定 / 多租戶顯示選擇器)       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│  PermissionService.loadPermissions()                     │
│  1. 根據 tenant_id + user_id 查詢角色                    │
│  2. 載入角色對應的權限矩陣                                │
│  3. 緩存到 PermissionCacheService                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│  發出事件                                                 │
│  - EventBus.emit('auth:login', { userId, tenantId })     │
│  - AuditLogService 自動記錄                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│  重定向                                                   │
│  - 有 returnUrl → 回到原頁面                             │
│  - 無 returnUrl → 跳轉到 Dashboard                       │
└─────────────────────────────────────────────────────────┘
```

---

### 5. Token 管理流程

```
┌─────────────────────────────────────────────────────────┐
│  TokenService (實作 ITokenService)                       │
│  - 橋接 Firebase Auth 與DELON Auth                      │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ↓            ↓            ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│   get()  │  │   set()  │  │  clear() │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
     ↓             ↓             ↓
┌─────────────────────────────────────────────────────────┐
│              Storage Strategy (可配置)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │  LocalStorage (預設)                             │  │
│  │  - 持久化,重新整理後仍有效                         │  │
│  │  - 存儲結構:                                      │  │
│  │    {                                              │  │
│  │      token: string (Firebase ID Token),          │  │
│  │      user: { uid, email, displayName, ...},      │  │
│  │      tenant_id: string,                          │  │
│  │      permissions: string[],                      │  │
│  │      exp: number (過期時間)                       │  │
│  │    }                                              │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  SessionStorage (可選)                           │  │
│  │  - 分頁關閉即清除                                 │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Memory (可選)                                   │  │
│  │  - 最安全但無持久化                               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│  Token 自動刷新機制                                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  TokenRefreshInterceptor                         │  │
│  │  1. 每次 HTTP 請求前檢查 Token                    │  │
│  │  2. 距離過期 < 5分鐘 → 自動刷新                   │  │
│  │  3. 呼叫 Firebase user.getIdToken(true)          │  │
│  │  4. 更新 TokenService                            │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  後台定時刷新 (可選)                              │  │
│  │  - setInterval 每 50 分鐘刷新一次                 │  │
│  │  - Firebase Token 預設 1 小時過期                 │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

### 6. 多租戶用戶登入後租戶選擇流程

```
用戶登入成功
    ↓
TenantService.resolveTenant()
    ↓
查詢 Firestore: memberships collection
    query(where('user_id', '==', currentUser.uid))
    ↓
┌─────────────────────────────────────────┐
│  獲取用戶所屬租戶列表                    │
│  [                                       │
│    { tenant_id: 'org_1', role: 'owner' },│
│    { tenant_id: 'org_2', role: 'member' }│
│  ]                                       │
└────────────┬────────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ↓             ↓
   單一租戶      多個租戶
      │             │
      │             └──► 重定向到 /auth/tenant-select
      │                      │
      │                      ↓
      │            ┌──────────────────────────┐
      │            │  顯示租戶選擇器           │
      │            │  - 列出所有租戶           │
      │            │  - 顯示角色徽章           │
      │            │  - 用戶選擇一個           │
      │            └──────────┬───────────────┘
      │                       │
      │                       ↓
      │            TenantService.setCurrentTenant(selectedId)
      │                       │
      └───────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────┐
│  TenantService.setCurrentTenant()       │
│  1. 設定 currentTenant$ Signal          │
│  2. 存儲到 LocalStorage                 │
│  3. 更新 TokenService (加入 tenant_id)  │
│  4. 發出事件: tenant:changed            │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  PermissionService.reload()             │
│  - 重新載入該租戶的權限                  │
└────────────┬────────────────────────────┘
             │
             ↓
     重定向到 Dashboard
```

---

### 7. OAuth 登入流程 (Google/GitHub)

```
用戶點擊 "Login with Google"
    ↓
┌─────────────────────────────────────────┐
│  OAuthProviderService.signInWithGoogle()│
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  FirebaseAuthAdapter                    │
│  - signInWithPopup(GoogleAuthProvider)  │
│  或 signInWithRedirect                  │
└────────────┬────────────────────────────┘
             │
             ↓
    打開 Google OAuth 視窗
             │
             ↓
    用戶授權 Google 帳號
             │
             ↓
    Firebase 接收 OAuth Token
             │
             ↓
┌─────────────────────────────────────────┐
│  Firebase 建立或連結帳號                 │
│  - 檢查 Email 是否已存在                │
│  - 新用戶 → 建立 Firebase User          │
│  - 既有用戶 → 連結 OAuth Provider       │
└────────────┬────────────────────────────┘
             │
             ↓
    返回 Firebase User + Credential
             │
             ↓
┌─────────────────────────────────────────┐
│  AuthService 處理 OAuth 登入成功         │
│  1. 檢查 Firestore users/{uid} 是否存在  │
│  2. 不存在 → 建立用戶資料 + 預設租戶     │
│  3. 存在 → 載入既有資料                  │
└────────────┬────────────────────────────┘
             │
             ↓
    後續流程同 Email/Password 登入
    (Token 設定 → 租戶解析 → 權限載入)
```

---

### 8. MFA (多因素認證) 流程

```
┌────────── MFA 設定流程 ──────────┐

用戶在安全設定頁面啟用 MFA
    ↓
┌─────────────────────────────────────────┐
│  MFAService.setupTOTP()                 │
│  1. 呼叫 Firebase multiFactor API       │
│  2. 生成 Secret Key                     │
│  3. 生成 QR Code                        │
└────────────┬────────────────────────────┘
             │
             ↓
    顯示 QR Code 給用戶掃描
    (使用 Google Authenticator / Authy)
             │
             ↓
    用戶輸入驗證碼確認
             │
             ↓
┌─────────────────────────────────────────┐
│  MFAService.verifyAndEnroll()           │
│  - 驗證碼正確 → Enroll MFA              │
│  - 保存 Recovery Codes                  │
└────────────┬────────────────────────────┘
             │
             ↓
    MFA 啟用完成


┌────────── MFA 登入流程 ──────────┐

用戶輸入 Email/Password 登入
    ↓
Firebase Auth 驗證成功
    ↓
┌─────────────────────────────────────────┐
│  檢測到用戶啟用 MFA                      │
│  - 拋出 MultiFactorError                │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  重定向到 /auth/mfa-verify               │
│  - 保存 MultiFactorResolver 到 Session  │
└────────────┬────────────────────────────┘
             │
             ↓
    用戶輸入 TOTP 驗證碼
             │
             ↓
┌─────────────────────────────────────────┐
│  MFAService.verifyTOTP(code)            │
│  - 使用 MultiFactorResolver 驗證        │
└────────────┬────────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ↓             ↓
   驗證成功      驗證失敗
      │             │
      │             └──► 顯示錯誤,重新輸入
      │
      ↓
    完成登入流程
    (Token 設定 → 租戶解析 → 權限載入)
```

---

### 9. 權限檢查詳細流程

```
用戶嘗試執行操作 (例如:刪除 Repository)
    ↓
┌─────────────────────────────────────────┐
│  PermissionGuard.canActivate()          │
│  或 PermissionService.check()           │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  提取上下文信息                          │
│  1. 當前用戶 (UserContextService)       │
│  2. 當前租戶 (TenantService)            │
│  3. 目標資源 (從路由/參數獲取)           │
│  4. 所需權限 (從 Route Data 或參數)      │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  查詢用戶在租戶的角色                    │
│  Firestore: memberships                 │
│    .where('user_id', '==', uid)         │
│    .where('tenant_id', '==', tenantId)  │
│  → 獲取 role: 'owner' / 'admin' / ...   │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  查詢資源的權限規則 (如果有)             │
│  例如: Repository 的 Collaborators       │
│  Firestore: repositories/{id}           │
│    .collection('collaborators')         │
│    .where('user_id', '==', uid)         │
│  → 獲取資源級別權限                      │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  權限計算 (RBAC 矩陣)                   │
│  ┌─────────────────────────────────┐  │
│  │  Permission Matrix              │  │
│  │  owner:   [all]                 │  │
│  │  admin:   [read, write, delete] │  │
│  │  member:  [read, write]         │  │
│  │  guest:   [read]                │  │
│  └─────────────────────────────────┘  │
│  比對: role + action                   │
└────────────┬────────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ↓             ↓
   有權限        無權限
      │             │
      │             └──► 拋出 PermissionDeniedError
      │                  → 顯示 403 或提示訊息
      │
      ↓
┌─────────────────────────────────────────┐
│  記錄審計日誌                            │
│  AuditLogService.log({                  │
│    type: 'permission:check',            │
│    result: 'allowed',                   │
│    user_id, tenant_id, resource, action │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ↓
    允許操作執行
```

---

### 10. Session 管理與多設備登入

```
┌─────────────────────────────────────────┐
│  SessionService (追蹤活動會話)           │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  用戶登入時建立 Session                  │
│  Firestore: sessions collection         │
│  {                                       │
│    session_id: UUID,                    │
│    user_id: string,                     │
│    device_info: {                       │
│      user_agent, ip, location           │
│    },                                   │
│    created_at: Timestamp,               │
│    last_active: Timestamp,              │
│    expires_at: Timestamp                │
│  }                                       │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  前端定期更新 last_active               │
│  - 每 5 分鐘 Heartbeat                  │
│  - SessionService.updateHeartbeat()     │
└─────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  用戶可查看所有活動會話                  │
│  /profile/security/sessions              │
│  - 列出所有設備                          │
│  - 顯示最後活動時間                      │
│  - 提供"登出此設備"按鈕                  │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  遠程登出 (Revoke Session)              │
│  1. 刪除 Firestore sessions 文檔        │
│  2. 該設備下次請求時 Token 無效         │
│  3. 強制重新登入                        │
└─────────────────────────────────────────┘
```

---

### 11. HTTP Interceptor Chain (認證相關)

```
Component 發起 HTTP 請求
    ↓
HttpClient
    ↓
┌─────────────────────────────────────────┐
│  AuthTokenInterceptor (優先級: 1)       │
│  - 從 TokenService 獲取 Firebase Token  │
│  - 注入 Authorization: Bearer <token>   │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  TenantContextInterceptor (優先級: 2)   │
│  - 注入 X-Tenant-ID: <tenant_id>        │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  TokenRefreshInterceptor (優先級: 3)    │
│  - 檢查 Token 距離過期 < 5 分鐘         │
│  - 自動刷新 Token                       │
└────────────┬────────────────────────────┘
             │
             ↓
    發送到 Firebase Backend
             │
             ↓ (Response)
┌─────────────────────────────────────────┐
│  AuthErrorInterceptor (Error Handler)   │
│  - 401 Unauthorized                     │
│    → TokenService.clear()               │
│    → 重定向到 /auth/login               │
│  - 403 Forbidden                        │
│    → 顯示權限不足提示                    │
│  - 其他錯誤                              │
│    → 統一錯誤處理                        │
└─────────────────────────────────────────┘
```

---

## 關鍵實作範例

### TokenService (橋接 Firebase + DELON)

```typescript
// core/auth/services/token.service.ts
import { Injectable } from '@angular/core';
import { ITokenService } from '@delon/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { Auth, User as FirebaseUser } from '@angular/fire/auth';

interface TokenModel {
  token: string;           // Firebase ID Token
  user: FirebaseUser;      // Firebase User
  tenant_id?: string;      // 當前租戶
  permissions?: string[];  // 權限列表
  exp: number;            // 過期時間
}

@Injectable({ providedIn: 'root' })
export class TokenService implements ITokenService {
  private readonly STORAGE_KEY = 'auth_token';
  private token$ = new BehaviorSubject<TokenModel | null>(null);

  constructor(private firebaseAuth: Auth) {
    // 初始化時從 Storage 恢復
    this.loadFromStorage();
    
    // 監聽 Firebase Auth 狀態變化
    this.firebaseAuth.onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        this.set({ token, user, exp: Date.now() + 3600000 });
      } else {
        this.clear();
      }
    });
  }

  get(): TokenModel | null {
    return this.token$.value;
  }

  get$(): Observable<TokenModel | null> {
    return this.token$.asObservable();
  }

  set(data: Partial<TokenModel>): boolean {
    const current = this.token$.value;
    const updated = { ...current, ...data } as TokenModel;
    
    this.token$.next(updated);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    return true;
  }

  clear(): void {
    this.token$.next(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  change(): Observable<TokenModel | null> {
    return this.token$;
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // 檢查是否過期
        if (data.exp > Date.now()) {
          this.token$.next(data);
        } else {
          this.clear();
        }
      } catch {
        this.clear();
      }
    }
  }
}
```

### AuthService (統一門面)

```typescript
// core/auth/services/auth.service.ts
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseAuthAdapterService } from '@app/firebase/auth';
import { TokenService } from './token.service';
import { TenantService } from '@app/core/tenant';
import { PermissionService } from '@app/core/permission';
import { EventBusService } from '@app/core/event-bus';
import { AuditLogService } from '@app/core/audit';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isAuthenticated = signal(false);
  currentUser = signal<AuthUser | null>(null);

  constructor(
    private firebaseAuth: FirebaseAuthAdapterService,
    private token: TokenService,
    private tenant: TenantService,
    private permission: PermissionService,
    private eventBus: EventBusService,
    private audit: AuditLogService,
    private router: Router
  ) {
    // 監聽 Token 變化更新狀態
    this.token.change().subscribe(token => {
      this.isAuthenticated.set(!!token);
      this.currentUser.set(token?.user ?? null);
    });
  }

  async login(email: string, password: string): Promise<void> {
    try {
      // 1. Firebase 認證
      const user = await this.firebaseAuth.signInWithEmail(email, password);
      
      // 2. 獲取 Token
      const token = await user.getIdToken();
      this.token.set({ token, user, exp: Date.now() + 3600000 });
      
      // 3. 載入用戶資料
      await this.loadUserProfile(user.uid);
      
      // 4. 解析租戶
      await this.tenant.resolveTenant(user.uid);
      
      // 5. 載入權限
      await this.permission.loadPermissions(user.uid, this.tenant.currentId);
      
      // 6. 發出事件
      this.eventBus.emit({
        type: 'auth:login',
        payload: { userId: user.uid, tenantId: this.tenant.currentId }
      });
      
      // 7. 審計記錄 (由 EventBus 訂閱者自動處理)
      
      // 8. 重定向
      this.router.navigate(['/dashboard']);
      
    } catch (error) {
      // 統一錯誤處理
      throw this.handleAuthError(error);
    }
  }

  async logout(): Promise<void> {
    const userId = this.currentUser()?.uid;
    const tenantId = this.tenant.currentId;
    
    // 1. Firebase 登出
    await this.firebaseAuth.signOut();
    
    // 2. 清除本地狀態
    this.token.clear();
    this.tenant.clear();
    this.permission.clear();
    
    // 3. 發出事件
    this.eventBus.emit({
      type: 'auth:logout',
      payload: { userId, tenantId }
    });
    
    // 4. 重定向
    this.router.navigate(['/auth/login']);
  }

  // ... 其他方法: register, resetPassword, OAuth 等
}
```

---

## 總結:關鍵設計原則

1. **三層整合**: Firebase Auth → Core Auth → DELON Auth
2. **統一門面**: AuthService 作為唯一入口
3. **租戶感知**: 認證成功後立即解析租戶上下文
4. **權限綁定**: Token 包含租戶 ID + 權限列表
5. **自動刷新**: Interceptor 自動處理 Token 過期
6. **事件驅動**: 認證狀態變化透過 EventBus 通知其他系統
7. **審計記錄**: 所有認證操作自動記錄
8. **多因素認證**: 支持 TOTP/SMS 二次驗證
9. **會話管理**: 追蹤多設備登入,支持遠程登出

這種架構讓你可以靈活組合 Firebase 的認證能力、DELON 的企業級功能、以及自訂的多租戶邏輯。