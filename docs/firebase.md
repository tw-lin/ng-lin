src/
├─ app/
│  ├─ core/
│  │  ├─ firebase/                           # 🔥 Firebase 核心基礎設施
│  │  │  │
│  │  │  ├─ config/                          # Firebase 配置
│  │  │  │  ├─ firebase.config.ts            # Firebase 主配置
│  │  │  │  └─ firebase.providers.ts         # Firebase Providers (提供給 app.config.ts)
│  │  │  │
│  │  │  ├─ models/                          # Firebase 資料模型
│  │  │  │  ├─ firebase-user.model.ts
│  │  │  │  └─ firestore-base.model.ts       # 基礎文檔模型
│  │  │  │
│  │  │  ├─ guards/                          # Firebase Guards
│  │  │  │  └─ auth.guard.ts
│  │  │  │
│  │  │  ├─ utils/                           # Firebase 工具函數
│  │  │  │  ├─ firestore-converter.util.ts   # Firestore 轉換器
│  │  │  │  └─ timestamp.util.ts             # 時間戳處理
│  │  │  │
│  │  │  └─ constants/                       # Firebase 常數
│  │  │     └─ collection-names.const.ts     # Firestore 集合名稱
│  │  │
│  │  └─ services/
│  │
│  ├─ shared/
│  │  └─ components/
│  │
│  └─ features/
│     │
│     ├─ auth/                               # 🔐 Authentication 功能模組
│     │  ├─ services/
│     │  │  └─ auth.service.ts               # 直接注入 Auth
│     │  └─ pages/
│     │     ├─ login/
│     │     ├─ register/
│     │     └─ forgot-password/
│     │
│     ├─ account/                            # 👤 帳戶管理
│     │  ├─ services/
│     │  │  ├─ account.service.ts            # 直接注入 Firestore
│     │  │  └─ user-storage.service.ts       # 直接注入 Storage
│     │  └─ pages/
│     │
│     ├─ blueprint/                          # 📋 藍圖管理
│     │  ├─ services/
│     │  │  ├─ blueprint.service.ts          # 直接注入 Firestore
│     │  │  └─ blueprint-storage.service.ts  # 直接注入 Storage
│     │  └─ pages/
│     │
│     └─ notifications/                      # 🔔 通知系統
│        ├─ services/
│        │  └─ notification.service.ts       # 直接注入 Messaging
│        └─ pages/
│
├─ environments/
│  ├─ environment.ts                         # 開發環境 Firebase 配置
│  └─ environment.prod.ts                    # 生產環境 Firebase 配置
│
└─ firebase/                                 # 🔥 Firebase 專案配置 (專案根目錄)
   ├─ firestore.rules                        # Firestore 安全規則
   ├─ firestore.indexes.json                 # Firestore 索引
   ├─ storage.rules                          # Storage 安全規則
   └─ firebase.json                          # Firebase 專案配置