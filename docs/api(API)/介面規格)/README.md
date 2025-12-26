# API 介面規格 (API Interface Specifications)

> 本目錄包含 GigHub 專案的 API 介面規格、資料契約與版本控制文件。

## 📋 目錄結構

```
api/interface-spec/
├── README.md                    # 本檔案
├── 01-api-overview.md          # API 總覽與架構
├── 02-rest-api-spec.md         # RESTful API 規格
├── 03-firebase-api.md          # Firebase API 使用指南
├── 04-data-contracts.md        # 資料契約定義
├── 05-contract-module-docs-index.md # 合約模組文檔索引（角色導向導覽）
├── 06-contract-implementation-quickstart.md # 合約模組實作快速開始（docs-old 提取）
├── 07-contract-module-architecture.md # 合約模組架構摘要（docs-old 提取）
├── 08-contract-upload-and-parsing.md # 合約上傳與解析指南（docs-old 提取）
├── contracts/                  # API 契約檔案目錄
│   ├── task.contract.md
│   ├── blueprint.contract.md
│   └── user.contract.md
└── schemas/                    # JSON Schema 定義
    ├── task.schema.json
    ├── blueprint.schema.json
    └── user.schema.json
```

## 🎯 文件用途

### 1. API 規格文件

定義系統對外與對內的 API 介面：
- HTTP 端點規格
- 請求/回應格式
- 驗證規則
- 錯誤代碼

### 2. 資料契約 (Data Contracts)

契約導向設計的核心文件：
- 介面定義語言 (IDL)
- 資料結構規範
- 版本相容性
- 演進策略

### 3. JSON Schema

結構化資料驗證：
- TypeScript 介面定義
- Firestore 文件結構
- 欄位驗證規則
- 預設值與約束

## 📐 設計原則

### 契約優先 (Contract-First)

1. **明確定義**: 在實作前先定義清楚的契約
2. **版本管理**: 使用語意化版本控制 API 變更
3. **向後相容**: 新版本保持與舊版本的相容性
4. **文件同步**: 保持程式碼與文件的一致性

### 模組專用索引

- `05-contract-module-docs-index.md`：統整合約模組技術債修復與實施文檔的角色導向導航，對應 `docs-old/` 的完整內容。

### API 設計準則

1. **RESTful 原則**: 遵循 REST 架構風格
2. **資源導向**: URL 代表資源而非動作
3. **HTTP 動詞**: 正確使用 GET、POST、PUT、DELETE
4. **狀態碼**: 使用標準 HTTP 狀態碼
5. **分頁與過濾**: 大型集合提供分頁機制

## 🔗 Firebase API 整合

### Firestore Database API

```typescript
// 範例：使用 Firebase SDK
import { collection, doc, getDoc, setDoc } from '@angular/fire/firestore';

// 讀取文件
const taskDoc = await getDoc(doc(firestore, 'tasks', taskId));

// 寫入文件
await setDoc(doc(firestore, 'tasks', taskId), taskData);
```

### Firebase Authentication API

```typescript
// 範例：使用 Firebase Auth
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';

// 登入
const userCredential = await signInWithEmailAndPassword(
  auth, 
  email, 
  password
);
```

### Cloud Functions API

```typescript
// 範例：呼叫 Cloud Function
import { httpsCallable } from '@angular/fire/functions';

const processTask = httpsCallable(functions, 'processTask');
const result = await processTask({ taskId: 'task-123' });
```

## 📝 版本控制策略

### 語意化版本 (Semantic Versioning)

格式：`MAJOR.MINOR.PATCH`

- **MAJOR**: 不相容的 API 變更
- **MINOR**: 向後相容的功能新增
- **PATCH**: 向後相容的問題修正

### 版本策略

1. **URL 版本**: `/api/v1/tasks`, `/api/v2/tasks`
2. **Header 版本**: `Accept: application/vnd.gighub.v1+json`
3. **Query 版本**: `/api/tasks?version=1`

建議使用 URL 版本，清晰直觀。

## 🔍 範例：Task API 規格

### 取得任務列表

**端點**: `GET /api/v1/blueprints/{blueprintId}/tasks`

**請求參數**:
```typescript
interface GetTasksQuery {
  status?: 'pending' | 'in-progress' | 'completed';
  assigneeId?: string;
  page?: number;
  limit?: number;
}
```

**回應格式**:
```typescript
interface GetTasksResponse {
  data: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**範例回應**:
```json
{
  "data": [
    {
      "id": "task-123",
      "blueprintId": "blueprint-456",
      "title": "完成基礎架構設計",
      "status": "in-progress",
      "assigneeId": "user-789",
      "createdAt": "2025-12-21T10:00:00Z",
      "updatedAt": "2025-12-21T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

## 📊 錯誤處理規範

### 標準錯誤格式

```typescript
interface ApiError {
  error: {
    code: string;           // 錯誤代碼 (如: INVALID_INPUT)
    message: string;        // 使用者友善的錯誤訊息
    details?: unknown;      // 詳細錯誤資訊 (開發環境)
    timestamp: string;      // ISO 8601 時間戳
    path: string;          // API 路徑
  };
}
```

### HTTP 狀態碼使用

| 狀態碼 | 用途 | 範例 |
|-------|------|------|
| 200 | 成功 | 取得資源成功 |
| 201 | 已建立 | 建立資源成功 |
| 204 | 無內容 | 刪除成功 |
| 400 | 錯誤請求 | 欄位驗證失敗 |
| 401 | 未授權 | 缺少或無效的認證 |
| 403 | 禁止存取 | 權限不足 |
| 404 | 找不到 | 資源不存在 |
| 409 | 衝突 | 資源已存在 |
| 500 | 伺服器錯誤 | 內部處理錯誤 |

## 🔐 認證與授權

### Firebase Authentication

所有 API 請求必須包含 Firebase ID Token：

```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

### 權限檢查

API 層級權限由 Firestore Security Rules 控制：
- 讀取權限：`allow read: if isAuthenticated() && isBlueprintMember(blueprintId)`
- 寫入權限：`allow write: if isAuthenticated() && hasPermission(blueprintId, 'task:create')`

參考：[security(安全)/README.md](../security(安全)/README.md)

## 📚 相關文件

- [架構設計](../architecture(架構)/README.md) - 系統架構與設計模式
- [資料模型](../data-model(資料模型)/README.md) - Firestore 資料結構
- [安全規範](../security(安全)/README.md) - 認證與授權
- [Functions](../functions(函數)/README.md) - Cloud Functions 使用指南

## 🔄 變更記錄

### v1.0.0 (2025-12-21)
- ✅ 建立 API 介面規格文件結構
- ✅ 定義 RESTful API 設計準則
- ✅ 制定版本控制策略
- ✅ 建立錯誤處理規範

## 📞 聯絡與貢獻

- 如需修改或新增 API 規格，請開 PR 並說明變更原因
- API 變更必須經過架構審查
- 重大變更需要版本升級並提供遷移指南

---

**維護者**: GigHub 開發團隊  
**最後更新**: 2025-12-21  
**版本**: v1.0.0
