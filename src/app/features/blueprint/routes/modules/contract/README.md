# Contract Module (Scaffold)

雛形遵循 `/src/app/routes/blueprint/modules/README.md`：standalone、UI → Service → Repository、signals。

## 結構

```
contract/
├─ README.md
├─ routes.ts
├─ contract-shell.component.ts
├─ components/
│   └─ contract-list.component.ts
├─ services/
│   └─ contract.facade.ts
└─ data-access/
    ├─ models/contract.model.ts
    └─ repositories/contract.repository.ts
```

> TODO: 依實際需求擴充欄位、權限與 UI。
