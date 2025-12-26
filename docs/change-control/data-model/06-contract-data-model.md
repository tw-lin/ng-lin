# 合約資料模型摘要 (Contract Data Model)

> 來源：`docs-old/CONTRACT_UPLOAD_AND_PARSING.md`、`CONTRACT_UPLOAD_IMPLEMENTATION.md`、`Contract-AI-Integration_Architecture.md`。整理合約/解析結果的核心欄位與版本管理。

## 🗃️ 核心實體
```typescript
interface Contract {
  id: string;
  blueprintId: string;
  title: string;
  status: 'draft' | 'parsed' | 'reviewing' | 'approved';
  version: number;
  filePath: string;         // Storage path
  parsedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

```typescript
interface ParsedContractData {
  contractId: string;
  workItems: ParsedWorkItem[];
  parties?: PartyInfo[];
  totalAmount?: number;
  currency?: string;
  sourceFileName: string;
  parserVersion: string;
  schemaVersion: number;
  createdAt: Timestamp;
}
```

## 🔄 版本/審計
- `version`: 文件版次；每次解析/覆寫時遞增。
- `parserVersion`: AI/解析器版本，便於回溯。
- 日誌：上傳/解析/回寫需寫入 AuditLog（actor、timestamp、file、blueprintId）。

## ✅ 檢查清單
- [ ] Storage 路徑含 blueprintId，避免跨租戶
- [ ] Firestore 寫入經 Repository，欄位 snake_case → model 轉換
- [ ] 解析結果保存原檔名、解析版次與 schemaVersion
- [ ] 關鍵欄位索引：`blueprintId`, `status`, `version`, `parsedAt`

## 相關來源
- `docs-old/CONTRACT_UPLOAD_AND_PARSING.md`
- `docs-old/CONTRACT_UPLOAD_IMPLEMENTATION.md`
- `docs-old/architecture/Contract-AI-Integration_Architecture.md`
