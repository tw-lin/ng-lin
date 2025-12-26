# 快速開始 (Getting Started)

> 本目錄包含 GigHub 專案的開發者上手指引、環境設定、本地啟動步驟與測試指令。

## 📋 目錄結構

```
getting-started/
├── README.md                    # 本檔案
├── 01-dev-quickstart.md         # 開發環境快速開始（docs-old 提取）
├── 02-prerequisites.md          # 前置需求
├── 03-environment-setup.md      # 環境設定
├── 04-local-development.md      # 本地開發
├── 05-testing-guide.md          # 測試指南
└── 06-troubleshooting.md        # 問題排解
```

## 🎯 前置需求

### 必要軟體

| 軟體 | 版本 | 用途 |
|------|------|------|
| Node.js | 20.x | JavaScript 運行環境 |
| npm | 10.x | 套件管理器 |
| Angular CLI | 20.x | Angular 開發工具 |
| Firebase CLI | 13.x | Firebase 部署工具 |
| Git | 2.x | 版本控制 |

### 安裝指令

```bash
# 安裝 Node.js (使用 nvm 建議)
nvm install 20
nvm use 20

# 安裝 Angular CLI
npm install -g @angular/cli@20

# 安裝 Firebase CLI
npm install -g firebase-tools

# 驗證安裝
node --version      # v20.x.x
ng version         # Angular CLI: 20.x.x
firebase --version # 13.x.x
```

## 🚀 快速開始

### 1. Clone 專案

```bash
git clone https://github.com/your-org/ng-gighub.git
cd ng-gighub
```

### 2. 安裝相依套件

```bash
# 安裝前端相依套件
npm install

# 安裝 Functions 相依套件
cd functions-ai && npm install && cd ..
cd functions-ai-document && npm install && cd ..
# ... 其他 functions 目錄
```

### 3. 環境配置

```bash
# 複製環境變數範本
cp .env.example .env.local

# 編輯環境變數
nano .env.local
```

**`.env.local` 範例**:
```bash
# Firebase Configuration
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id

# Development
NODE_ENV=development
DEBUG=true
```

### 4. 啟動 Firebase Emulator

```bash
# 啟動所有 Emulator
firebase emulators:start

# 啟動特定 Emulator
firebase emulators:start --only hosting,firestore,functions
```

**Emulator 端口**:
- Hosting: `http://localhost:5000`
- Firestore: `http://localhost:8080`
- Functions: `http://localhost:5001`
- Auth: `http://localhost:9099`
- Emulator UI: `http://localhost:4000`

### 5. 啟動開發伺服器

```bash
# 啟動 Angular 開發伺服器
npm start

# 或使用自訂配置
ng serve --configuration development
```

開啟瀏覽器訪問: `http://localhost:4200`

## 🔧 開發工作流程

### 日常開發

```bash
# 1. 拉取最新程式碼
git pull origin develop

# 2. 建立功能分支
git checkout -b feature/your-feature-name

# 3. 啟動開發環境
npm start

# 4. 開發與測試
# ... 進行程式碼修改 ...

# 5. 執行測試
npm test

# 6. Commit 變更
git add .
git commit -m "feat: add your feature"

# 7. Push 到遠端
git push origin feature/your-feature-name

# 8. 建立 Pull Request
```

### 程式碼檢查

```bash
# ESLint 檢查
npm run lint

# 自動修正
npm run lint:fix

# TypeScript 類型檢查
npm run type-check

# 格式化程式碼
npm run format
```

### 建置專案

```bash
# 開發建置
npm run build

# 生產建置
npm run build:prod

# 建置並分析大小
npm run build:analyze
```

## 🧪 測試指南

### 單元測試

```bash
# 執行所有測試
npm test

# 執行特定測試檔案
npm test -- src/app/core/services/task.service.spec.ts

# 監聽模式
npm test -- --watch

# 產生覆蓋率報告
npm test -- --coverage
```

### E2E 測試

```bash
# 執行 E2E 測試 (Cypress)
npm run e2e

# 開啟 Cypress UI
npm run e2e:open
```

### Firebase Emulator 測試

```bash
# 執行 Emulator 測試
npm run test:emulator

# 測試 Security Rules
npm run test:rules

# 測試 Functions
cd functions-ai && npm test
```

## 📁 專案結構

```
ng-gighub/
├── src/                        # 前端源碼
│   ├── app/
│   │   ├── core/              # 核心服務
│   │   ├── routes/            # 功能模組
│   │   └── shared/            # 共享資源
│   ├── assets/                # 靜態資源
│   └── environments/          # 環境配置
├── functions-ai/               # AI Functions
├── functions-ai-document/      # Document AI Functions
├── functions-*/                # 其他 Functions
├── firestore.rules            # Firestore 規則
├── firestore.indexes.json     # Firestore 索引
├── firebase.json              # Firebase 配置
└── angular.json               # Angular 配置
```

## 🎓 學習資源

### 官方文檔

- [Angular 文檔](https://angular.dev)
- [Firebase 文檔](https://firebase.google.com/docs)
- [ng-alain 文檔](https://ng-alain.com)
- [ng-zorro-antd 文檔](https://ng.ant.design)

### 專案文檔

- [架構設計](../architecture(架構)/README.md)
- [設計原則](../principles(原則)/principles.md)
- [API 規格](../api(API/介面規格)/README.md)
- [資料模型](../data-model(資料模型)/README.md)

### 開發指南

- [TypeScript 風格指南](.github/instructions/typescript-5-es2022.instructions.md)
- [Angular 最佳實踐](.github/instructions/angular.instructions.md)
- [Repository 模式](.github/instructions/ng-gighub-firestore-repository.instructions.md)

## ❓ 常見問題

### Q: Firebase Emulator 無法啟動？

**A**: 確認端口未被佔用：
```bash
# 檢查端口佔用
lsof -i :5000
lsof -i :8080

# 釋放端口或使用不同端口
firebase emulators:start --only hosting --port 5001
```

### Q: npm install 失敗？

**A**: 清除快取重試：
```bash
# 清除 npm 快取
npm cache clean --force

# 刪除 node_modules
rm -rf node_modules package-lock.json

# 重新安裝
npm install
```

### Q: Angular 編譯錯誤？

**A**: 檢查 TypeScript 版本：
```bash
# 檢查版本
ng version

# 更新 Angular CLI
npm install -g @angular/cli@latest

# 更新專案相依套件
ng update
```

### Q: Firestore Security Rules 測試失敗？

**A**: 確認 Emulator 正在執行：
```bash
# 重新啟動 Emulator
firebase emulators:start --only firestore

# 執行測試
npm run test:rules
```

## 🔗 有用的指令

```bash
# 清理專案
npm run clean

# 重新安裝相依套件
npm run reinstall

# 檢查相依套件版本
npm outdated

# 更新相依套件
npm update

# 檢查安全漏洞
npm audit

# 修復安全漏洞
npm audit fix
```

## 📞 尋求協助

遇到問題？

1. 查閱 [問題排解指南](05-troubleshooting.md)
2. 搜尋 [GitHub Issues](https://github.com/your-org/ng-gighub/issues)
3. 查看 [SUPPORT.md](../../SUPPORT.md)
4. 聯繫團隊成員

## 📚 下一步

完成環境設定後，建議閱讀：

1. [架構概覽](../architecture(架構)/01-architecture-overview.md)
2. [三層架構](../architecture(架構)/02-three-layer-architecture.md)
3. [開發規範](../principles(原則)/rules.md)
4. [測試指南](04-testing-guide.md)

---

**維護者**: GigHub 開發團隊  
**最後更新**: 2025-12-21  
**版本**: v1.0.0
