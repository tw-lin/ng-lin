# 部署 (Deployment)

> 本目錄包含 GigHub 專案的 Firebase 部署流程、CI/CD 指南、環境配置與成本控制文件。

## 📋 目錄結構

```
deployment/
├── README.md                    # 本檔案
├── 01-deployment-overview.md   # 部署總覽
├── 02-firebase-setup.md        # Firebase 專案設定
├── 03-cicd-pipeline.md         # CI/CD 流程
├── 04-environment-config.md    # 環境配置
├── 05-cost-optimization.md     # 成本控制
└── scripts/                    # 部署腳本
    ├── deploy-prod.sh
    ├── deploy-staging.sh
    └── rollback.sh
```

## 🎯 部署環境

### 環境分層

| 環境 | 用途 | Firebase 專案 | 分支 |
|------|------|--------------|------|
| **Development** | 本地開發 | Firebase Emulator | feature/* |
| **Staging** | 測試環境 | gighub-staging | develop |
| **Production** | 生產環境 | gighub-prod | main |

## 🚀 部署流程

### 1. 前端部署 (Firebase Hosting)

```bash
# 建置生產版本
npm run build:prod

# 部署到 Firebase Hosting
firebase deploy --only hosting

# 部署特定環境
firebase deploy --only hosting --project staging
firebase deploy --only hosting --project production
```

### 2. Functions 部署 (Cloud Functions)

```bash
# 部署所有 Functions
firebase deploy --only functions

# 部署單一模組
firebase deploy --only functions:functions-ai-document

# 部署多個模組
firebase deploy --only functions:functions-ai,functions:functions-auth
```

### 3. Firestore 規則部署

```bash
# 部署 Security Rules
firebase deploy --only firestore:rules

# 部署索引
firebase deploy --only firestore:indexes
```

### 4. 完整部署

```bash
# 部署所有資源
firebase deploy

# 部署到特定專案
firebase deploy --project production
```

## ⚙️ CI/CD 整合

### GitHub Actions 工作流程

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build:prod
        
      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only hosting,functions
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
          PROJECT_ID: gighub-prod
```

### 部署檢查清單

在部署前確認：
- [ ] 所有測試通過
- [ ] 程式碼已審查
- [ ] 環境變數已設定
- [ ] Security Rules 已更新
- [ ] 資料庫遷移已完成
- [ ] 備份已建立
- [ ] 回滾計畫已準備

## 🔧 環境配置

### Firebase 專案初始化

```bash
# 登入 Firebase
firebase login

# 初始化專案
firebase init

# 選擇服務
? Which Firebase features do you want to set up?
  ◉ Hosting
  ◉ Functions
  ◉ Firestore
  ◉ Storage
```

### 環境變數設定

```bash
# 設定 Functions 環境變數
firebase functions:config:set api.key="YOUR_API_KEY"

# 查看當前配置
firebase functions:config:get

# 本地開發使用 .env 檔案
# .env.local
FIREBASE_API_KEY=your-api-key
FIREBASE_PROJECT_ID=your-project-id
```

### Angular 環境檔案

```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  firebase: {
    apiKey: 'YOUR_PRODUCTION_API_KEY',
    authDomain: 'gighub-prod.firebaseapp.com',
    projectId: 'gighub-prod',
    storageBucket: 'gighub-prod.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID'
  }
};
```

## 💰 成本優化策略

### 1. Firestore 成本控制

**讀取優化**:
- 使用快取減少重複讀取
- 實作分頁限制查詢結果
- 使用 `onSnapshot` 取代輪詢

**寫入優化**:
- 批次寫入 (Batch Write)
- 避免不必要的更新
- 使用 `FieldValue.serverTimestamp()`

**儲存優化**:
- 定期清理已刪除資料
- 壓縮大型文件
- 使用 Cloud Storage 儲存大型檔案

### 2. Cloud Functions 成本控制

**執行時間優化**:
- 減少冷啟動時間
- 使用更小的執行環境
- 設定適當的超時時間

**記憶體配置**:
```typescript
export const processTask = functions
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .https.onCall(async (data, context) => {
    // Function logic
  });
```

**區域選擇**:
- 選擇靠近使用者的區域
- 考慮定價差異

### 3. Hosting 成本控制

- 啟用 CDN 快取
- 壓縮靜態資源
- 使用適當的快取策略

```json
{
  "hosting": {
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

## 🔄 回滾策略

### 前端回滾

```bash
# 查看部署歷史
firebase hosting:channel:list

# 回滾到上一個版本
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID \
  TARGET_SITE_ID:live
```

### Functions 回滾

```bash
# 查看 Function 版本
gcloud functions list

# 回滾到特定版本
gcloud functions deploy FUNCTION_NAME \
  --source https://source.developers.google.com/projects/PROJECT_ID/repos/REPO_NAME/revisions/COMMIT_SHA/paths/FUNCTION_PATH
```

### Firestore 資料回滾

```bash
# 從備份還原
gcloud firestore import gs://BUCKET_NAME/BACKUP_PATH \
  --collection-ids=COLLECTION_NAME
```

## 📊 監控與日誌

### Firebase Console

- Hosting 流量監控
- Functions 執行統計
- Firestore 使用量追蹤
- 錯誤報告

### 自訂監控

```typescript
// 使用 Firebase Performance Monitoring
import { trace } from '@angular/fire/performance';

const taskLoadTrace = trace(performance, 'load_tasks');
taskLoadTrace.start();
// Load tasks...
taskLoadTrace.stop();
```

### 告警設定

在 Firebase Console 設定告警：
- 異常錯誤率
- 高延遲警告
- 配額超限警告
- 成本超支警告

## 🔐 安全檢查

部署前安全檢查：
- [ ] Security Rules 已驗證
- [ ] API 金鑰已保護
- [ ] CORS 設定正確
- [ ] CSP 標頭已配置
- [ ] 敏感資料已加密

## 📚 相關文件

- [架構設計](../architecture(架構)/README.md) - 系統架構
- [安全規範](../security(安全)/README.md) - 安全設定
- [Functions](../functions(函數)/README.md) - Cloud Functions 指南
- [維運](../operations(維運)/README.md) - 監控與維護

## 🔄 變更記錄

### v1.0.0 (2025-12-21)
- ✅ 建立部署流程文件
- ✅ 定義 CI/CD 工作流程
- ✅ 制定成本優化策略
- ✅ 說明回滾機制

---

**維護者**: GigHub 開發團隊  
**最後更新**: 2025-12-21  
**版本**: v1.0.0
