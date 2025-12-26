# 介面流程摘要 (UI Flows)

> 來源：`docs-old/CONTRACT_UPLOAD_AND_PARSING.md`、`CONTRACT_UPLOAD_IMPLEMENTATION.md`、`OCR_WORKFLOW_README.md`。整理合約上傳/解析的前端流程與驗證點。

## 📋 合約上傳/解析流程
1. 使用者在 Blueprint 內啟動「上傳合約」→ 檔案前端驗證（型別/大小）。
2. 上傳至 Cloud Storage 指定路徑（含 `blueprintId`），回傳檔案 metadata。
3. 觸發解析任務（Functions/AI），UI 顯示進度與重試/取消。
4. 解析結果回寫 Firestore，UI 更新工作項/摘要並允許二次編輯。

## 🔐 驗證與提示
- 僅 Blueprint 成員可上傳；檔案型別/大小限制直接在 UI 阻擋。
- 上傳錯誤回饋：明確錯誤碼、重新上傳/重試入口。
- 解析中提供取消與重新整理；完成後顯示版本與來源檔名。

## 🧭 UX 建議
- 進度條 + 狀態標籤：`上傳中` / `解析中` / `失敗` / `完成`
- 空狀態：提供示例檔案/格式要求；引導至說明文件
- 詳細檢視：解析欄位對照原始檔，允許行內編輯與保存

## 相關來源
- `docs-old/CONTRACT_UPLOAD_AND_PARSING.md`
- `docs-old/CONTRACT_UPLOAD_IMPLEMENTATION.md`
- `docs-old/analysis/OCR_WORKFLOW_README.md`
