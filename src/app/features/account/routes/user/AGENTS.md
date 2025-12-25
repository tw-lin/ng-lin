# User Routes – AGENTS

> **Parent**: [`../AGENTS.md`](../AGENTS.md) - Account routes

## Scope
User profile and account routes (`features/account/routes/user/`). User-facing profile, settings, and account management.

## Purpose
Provide user profile and account management pages. Handle user preferences, settings, and personal information.

## Constraints (Must NOT)
- ❌ Access Firebase directly (use services)
- ❌ Include admin functions (use admin routes)
- ❌ Include UI beyond user scope
- ❌ Use constructor injection (use `inject()`)

## Allowed Content
- ✅ User profile pages (view, edit)
- ✅ Account settings UI
- ✅ Preference management
- ✅ User-specific flows and permissions

## Structure
```
user/
├── pages/                    # User pages
├── components/               # User-specific UI
└── routes.ts                 # User routes
```

## Dependencies
**Depends on**: `../../` (account services), `../../../../core/` (auth services)  
**Used by**: Router

## Key Rules
1. **User-centric**: Focus on individual user experience
2. **Privacy**: Respect user data privacy
3. **Signals**: Use signals for reactive state
4. **DI**: Use `inject()` exclusively
5. **Validation**: Validate user inputs
6. **Accessibility**: Maintain WCAG compliance
7. **Security**: Validate user identity

## Related
- `../AGENTS.md` - Account routes
- `../../AGENTS.md` - Account feature
- `../../profile/AGENTS.md` - Profile components
- `../../settings/AGENTS.md` - Settings components

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
- **Avatar Management** - Profile picture upload
- **Notification Preferences** - Email and in-app notifications
- **Privacy Settings** - Data sharing and visibility

## Module Structure

```
src/app/routes/user/
├── AGENTS.md              # This file
├── routes.ts              # Module routing
└── settings/              # User settings
    ├── profile.component.ts
    ├── security.component.ts
    ├── notifications.component.ts
    └── preferences.component.ts
```

## Data Models

### FirebaseUser (Firebase Auth User)

**規則**:
- 使用 Firebase Authentication 提供的核心用戶身份
- `uid` 為唯一用戶識別碼
- `email` 為必填欄位
- `emailVerified` 追蹤郵件驗證狀態
- `displayName` 和 `photoURL` 可為 null
- `metadata` 包含創建時間和最後登入時間

### UserProfile (Extended Profile in Firestore)

**規則**:
- `user_id` 必須對應 Firebase Auth UID
- 基本資訊欄位：`display_name`（必填）、`email`（必填）、`avatar_url`（選填）、`phone`（選填）、`bio`（選填）
- 專業資訊欄位：`job_title`、`company`、`department`（皆選填）
- 偏好設定：`language` 必須為 'zh-TW' 或 'en-US'，`timezone` 必填，`theme` 必須為 'light'、'dark' 或 'auto'
- 通知設定：`email_notifications` 和 `push_notifications` 為布林值
- 隱私設定：`profile_visibility` 必須為 'public'、'organization' 或 'private'
- 必須包含 `created_at` 和 `updated_at` 時間戳記

## Key Features

### User Profile Page

**規則**:
- 必須顯示用戶基本資訊
- 必須支援編輯個人資料欄位
- 必須支援上傳/更換頭像功能
- 必須顯示活動歷史記錄

### Account Settings

#### Profile Settings

**規則**:
- 基本資訊欄位：姓名、電子郵件（唯讀）、電話號碼
- 專業資訊欄位：職稱、公司、部門
- 個人簡介欄位：Bio 描述
- 頭像上傳必須使用 Firebase Storage

#### Security Settings

**規則**:
- 必須支援變更密碼功能
- 必須支援雙因素驗證（2FA）設定
- 必須顯示活躍的登入工作階段
- 必須顯示登入歷史記錄

#### Notification Preferences

**規則**:
- 必須提供電子郵件通知開關
- 必須提供推播通知開關
- 必須支援通知類別設定（任務、提及、更新）
- 必須支援頻率設定（即時、每日摘要、每週）

#### Preferences

**規則**:
- 必須支援語言選擇（zh-TW、en-US）
- 必須支援時區設定
- 必須支援主題切換（light/dark/auto）
- 必須支援日期/時間格式設定

## Routing

**規則**:
- `/profile` 路由必須使用 `authGuard` 保護
- `/settings` 路由必須使用 `authGuard` 保護
- `/settings` 下必須包含子路由：`profile`、`security`、`notifications`、`preferences`
- 所有路由必須設定 `title` 資料屬性

## Component Implementation Rules

### ProfileSettingsComponent

**規則**:
- 必須使用 `signal()` 管理 `loading` 和 `avatarUrl` 狀態
- 必須使用 `FormBuilder` 建立表單
- 必須使用 `computed()` 計算用戶名稱首字母
- 必須在 `ngOnInit()` 中載入個人資料
- 必須使用 `UserProfileService` 更新個人資料
- 必須同時更新 Firebase Auth 的 `displayName`
- 必須處理表單驗證錯誤
- 必須顯示成功/失敗訊息

### NotificationSettingsComponent

**規則**:
- 必須定義通知類別陣列（taskAssigned、taskCompleted、mentioned、blueprintUpdated）
- 必須使用 Reactive Forms 管理通知偏好設定
- 必須支援儲存通知偏好設定
- 必須顯示載入狀態

## Firebase/Firestore Collections

### Collections

**規則**:
- `user_profiles` collection 儲存擴展的用戶個人資料資料
- `user_preferences` collection 儲存用戶設定和偏好
- `user_sessions` collection 儲存活躍工作階段（選用）

### Security Rules

**規則**:
- `user_profiles/{userId}` 文件只能由該用戶本人讀寫
- `user_preferences/{userId}` 文件只能由該用戶本人讀寫
- 所有規則必須檢查 `request.auth.uid == userId`

## Best Practices

**規則**:
1. 必須尊重用戶資料隱私，僅允許用戶存取自己的資料
2. 必須驗證所有輸入欄位
3. 必須使用 Firebase Auth 狀態監聽器進行即時同步
4. 頭像圖片必須使用 Firebase Storage 儲存
5. 偏好設定必須在本地快取以提升效能
6. 必須使用 Signals 管理元件狀態
7. 必須使用 `inject()` 進行依賴注入
8. 必須實作錯誤處理和載入狀態

## Related Documentation

- **[App Module](../../AGENTS.md)** - Application structure
- **[Core Services](../../core/AGENTS.md)** - Auth service
- **[Passport Module](../passport/AGENTS.md)** - Authentication

---

**Module Version**: 1.1.0  
**Last Updated**: 2025-12-09  
**Status**: Active Development
