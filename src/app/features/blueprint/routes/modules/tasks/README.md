# Tasks Module (Scaffold)

本模組為 Blueprint 底下任務功能的雛形，遵循 `/src/app/routes/blueprint/modules/README.md` 的 standalone、UI → Service → Repository 規範。

## 結構

```
tasks/
├─ README.md
├─ routes.ts
├─ tasks-shell.component.ts
├─ components/
│   └─ tasks-list.component.ts
├─ services/
│   └─ tasks.facade.ts
└─ data-access/
    ├─ models/task.model.ts
    └─ repositories/task.repository.ts
```

## 說明

- `tasks-shell`：薄協調層，負責 children route 容器。
- `tasks-list`：頁面元件示範，待接資料。
- `tasks.facade`：未連接實際資料，只示範介面與 signals 狀態持有。
- `task.repository`：唯一資料入口；使用 FirestoreBaseRepository 範例方法。

> TODO: 依實際需求擴充欄位、權限檢查與 UI。
