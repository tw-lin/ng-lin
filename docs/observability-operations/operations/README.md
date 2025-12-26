# 維運 (Operations)

> 本目錄包含 GigHub 專案的監控、日誌、錯誤處理、備援與版本發佈流程文件。

## 📋 目錄結構

```
operations/
├── README.md                    # 本檔案
├── 01-monitoring.md            # 監控指南
├── 02-logging.md               # 日誌管理
├── 03-error-handling.md        # 錯誤處理
├── 04-backup-recovery.md       # 備份與恢復
├── 05-release-process.md       # 發佈流程
├── 06-monitoring-executive-summary.md # 監控/模組管理摘要（docs-old 提取）
├── 07-contract-module-fixes-summary.md # 合約模組修復摘要（docs-old 提取）
└── runbooks/                   # 運維手冊
    ├── incident-response.md
    ├── rollback-procedure.md
    ├── security-incident.md
    └── contract-verification-checklist.md # 合約模組驗證清單（docs-old 提取）
```

## 📊 監控系統

### 1. Firebase 監控

**Firebase Console 監控面板**:
- Hosting 流量與錯誤率
- Functions 執行次數與延遲
- Firestore 讀寫次數
- Authentication 使用量
- Storage 使用量

**關鍵指標** (KPIs):
```
- 可用性: > 99.9%
- P50 延遲: < 500ms
- P95 延遲: < 2000ms
- 錯誤率: < 0.1%
- 函數成功率: > 99%
```

### 2. 應用程式監控

**Firebase Performance Monitoring**:

```typescript
import { trace } from '@angular/fire/performance';

// 追蹤關鍵操作
const taskLoadTrace = trace(performance, 'load_tasks');
taskLoadTrace.start();

try {
  const tasks = await this.taskService.getTasks();
  taskLoadTrace.stop();
  return tasks;
} catch (error) {
  taskLoadTrace.putAttribute('error', 'true');
  taskLoadTrace.stop();
  throw error;
}
```

**自訂指標**:
```typescript
const metric = trace(performance, 'custom_metric');
metric.putMetric('task_count', tasks.length);
metric.putMetric('load_time_ms', loadTime);
```

### 3. 告警設定

**Firebase Alerts**:
- 異常錯誤率 (> 1%)
- 高延遲 (P95 > 3000ms)
- 配額超限 (> 80%)
- 成本異常 (每日增長 > 20%)

**告警通知**:
- Email 通知
- Slack 整合
- PagerDuty (生產環境)

## 📝 日誌管理

### 1. 日誌層級

| 層級 | 用途 | 範例 |
|------|------|------|
| ERROR | 錯誤事件 | 資料庫連接失敗 |
| WARN | 警告訊息 | 配額接近上限 |
| INFO | 一般資訊 | 使用者登入 |
| DEBUG | 除錯資訊 | 函數執行細節 |

### 2. 結構化日誌

```typescript
// Logger Service
@Injectable({ providedIn: 'root' })
export class LoggerService {
  log(level: 'info' | 'warn' | 'error', message: string, context?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: this.authService.currentUserId,
      blueprintId: this.contextService.currentBlueprintId
    };
    
    console.log(JSON.stringify(logEntry));
    
    // 發送到日誌收集服務
    if (level === 'error') {
      this.sendToErrorTracking(logEntry);
    }
  }
}
```

### 3. Cloud Functions 日誌

```typescript
import * as functions from 'firebase-functions';

export const processTask = functions.https.onCall(async (data, context) => {
  functions.logger.info('Processing task', {
    taskId: data.taskId,
    userId: context.auth?.uid
  });
  
  try {
    // Process task...
    functions.logger.info('Task processed successfully', {
      taskId: data.taskId
    });
  } catch (error) {
    functions.logger.error('Task processing failed', {
      taskId: data.taskId,
      error: error.message
    });
    throw error;
  }
});
```

### 4. 日誌查詢

```bash
# 查看最近的日誌
firebase functions:log

# 過濾特定 Function
firebase functions:log --only functions-ai-document

# 查看錯誤日誌
gcloud logging read "severity>=ERROR" --limit 50
```

## ⚠️ 錯誤處理

### 1. 前端錯誤處理

**Global Error Handler**:

```typescript
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private logger = inject(LoggerService);
  private notification = inject(NzNotificationService);
  
  handleError(error: Error): void {
    // 記錄錯誤
    this.logger.error('Unhandled error', error);
    
    // 顯示使用者友善訊息
    this.notification.error(
      '發生錯誤',
      '操作失敗，請稍後再試'
    );
    
    // 發送到錯誤追蹤服務
    this.sendToSentry(error);
  }
}
```

**Service 層錯誤處理**:

```typescript
async createTask(task: Task): Promise<Result<Task, AppError>> {
  try {
    const created = await this.taskRepository.create(task);
    return Result.ok(created);
  } catch (error) {
    this.logger.error('Failed to create task', error);
    
    if (error.code === 'permission-denied') {
      return Result.err(new PermissionError('無權限建立任務'));
    }
    
    return Result.err(new UnknownError('建立任務失敗'));
  }
}
```

### 2. Cloud Functions 錯誤處理

```typescript
export const processTask = functions.https.onCall(async (data, context) => {
  try {
    // Validate input
    if (!data.taskId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'taskId is required'
      );
    }
    
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }
    
    // Process task
    const result = await processTaskInternal(data.taskId);
    return { success: true, data: result };
    
  } catch (error) {
    functions.logger.error('Error processing task', { error });
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Failed to process task'
    );
  }
});
```

## 💾 備份與恢復

### 1. Firestore 備份

**自動備份**:

```bash
# 使用 gcloud 設定自動備份
gcloud firestore backups schedules create \
  --database='(default)' \
  --recurrence=daily \
  --retention=14d
```

**手動備份**:

```bash
# 匯出到 Cloud Storage
gcloud firestore export gs://your-bucket/backup-$(date +%Y%m%d)

# 匯出特定 collection
gcloud firestore export gs://your-bucket/backup \
  --collection-ids=tasks,blueprints
```

### 2. 恢復程序

```bash
# 從備份恢復
gcloud firestore import gs://your-bucket/backup-20251221

# 恢復特定 collection
gcloud firestore import gs://your-bucket/backup \
  --collection-ids=tasks
```

### 3. 資料保留政策

| 資料類型 | 保留期限 | 備份頻率 |
|---------|---------|---------|
| 使用者資料 | 永久 | 每日 |
| 藍圖與任務 | 永久 | 每日 |
| 審計日誌 | 1 年 | 每週 |
| 臨時資料 | 30 天 | 不備份 |

## 🚀 發佈流程

### 1. 版本號規則

遵循 [Semantic Versioning](https://semver.org/):
- **MAJOR**: 重大變更、不相容的 API 變更
- **MINOR**: 新增功能、向後相容
- **PATCH**: 錯誤修正、向後相容

範例: `v1.2.3`

### 2. 發佈檢查清單

**發佈前**:
- [ ] 所有測試通過 (單元、整合、E2E)
- [ ] 程式碼審查完成
- [ ] 變更日誌已更新
- [ ] 文檔已更新
- [ ] Security Rules 已驗證
- [ ] 效能測試通過
- [ ] 備份已建立

**發佈中**:
- [ ] 建置生產版本
- [ ] 部署到 Staging 環境
- [ ] Staging 驗證
- [ ] 部署到 Production
- [ ] 煙霧測試 (Smoke Test)

**發佈後**:
- [ ] 監控錯誤率
- [ ] 檢查效能指標
- [ ] 使用者回饋收集
- [ ] 文檔發佈

### 3. 發佈指令

```bash
# 1. 建立發佈分支
git checkout -b release/v1.2.3

# 2. 更新版本號
npm version 1.2.3

# 3. 建置與測試
npm run build:prod
npm test

# 4. 部署到 Staging
firebase deploy --project staging

# 5. Staging 驗證通過後，部署到 Production
firebase deploy --project production

# 6. 標記版本
git tag v1.2.3
git push origin v1.2.3

# 7. 合併到 main
git checkout main
git merge release/v1.2.3
git push origin main
```

## 🔧 維運手冊 (Runbooks)

### 緊急事件處理

**嚴重性層級**:
- **P0 (Critical)**: 服務完全中斷 - 立即處理
- **P1 (High)**: 主要功能受影響 - 1 小時內處理
- **P2 (Medium)**: 次要功能受影響 - 24 小時內處理
- **P3 (Low)**: 輕微問題 - 下個衝刺處理

**事件響應流程**:
1. **偵測**: 監控告警或使用者回報
2. **確認**: 驗證問題並評估嚴重性
3. **溝通**: 通知相關人員與使用者
4. **解決**: 執行修復措施
5. **驗證**: 確認問題已解決
6. **檢討**: 事後分析與改進

### 回滾程序

```bash
# 1. 確認需要回滾的版本
firebase hosting:channel:list

# 2. 回滾 Hosting
firebase hosting:clone SOURCE:CHANNEL TARGET:live

# 3. 回滾 Functions (使用 gcloud)
gcloud functions deploy FUNCTION_NAME \
  --source=gs://BUCKET/PREVIOUS_VERSION

# 4. 驗證回滾
# 執行煙霧測試

# 5. 通知團隊與使用者
```

## �� 效能優化

### 定期檢查

**每週**:
- 檢查 Firestore 查詢效能
- 審查 Cloud Functions 冷啟動時間
- 監控前端載入時間

**每月**:
- 分析成本趨勢
- 檢討配額使用
- 優化熱點查詢

**每季**:
- 架構審查
- 安全審計
- 效能基準測試

## 📚 相關文件

- [部署指南](../deployment(部署)/README.md)
- [架構設計](../architecture(架構)/README.md)
- [監控指標](01-monitoring.md)
- [錯誤處理](03-error-handling.md)

## 🔄 變更記錄

### v1.0.0 (2025-12-21)
- ✅ 建立維運指南
- ✅ 定義監控指標
- ✅ 制定備份策略
- ✅ 說明發佈流程

---

**維護者**: GigHub 開發團隊  
**最後更新**: 2025-12-21  
**版本**: v1.0.0
