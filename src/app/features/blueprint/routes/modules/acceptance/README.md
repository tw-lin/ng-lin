# Acceptance Module (Refactored)

驗收管理模組 - 採用功能導向架構設計

## 🎯 架構原則

本模組遵循以下核心原則:
- **高內聚 (High Cohesion)**: 相關功能組織在同一 feature 中
- **低耦合 (Low Coupling)**: Features 間透過明確接口溝通
- **可擴展性 (Extensibility)**: 易於新增 features 或擴展現有功能
- **可維護性 (Maintainability)**: 清晰結構，小型專注元件

## 📁 目錄結構 (Feature-Based)

```
acceptance/
├── acceptance-module-view.component.ts      # 主協調器 (thin orchestrator)
├── index.ts                                 # Public API
├── README.md                                # 本文件
│
├── features/                                # 功能模組
│   ├── request/                             # 📝 驗收申請功能
│   │   ├── acceptance-request.component.ts  # Feature 主元件
│   │   ├── components/
│   │   │   ├── request-form.component.ts    # 申請表單
│   │   │   ├── request-list.component.ts    # 申請列表
│   │   │   └── request-statistics.component.ts # 統計卡片
│   │   └── index.ts
│   │
│   ├── review/                              # 👀 驗收審核功能
│   │   ├── acceptance-review.component.ts   # Feature 主元件
│   │   ├── components/
│   │   │   ├── review-form.component.ts     # 審核表單
│   │   │   ├── review-list.component.ts     # 審核列表
│   │   │   └── review-checklist.component.ts # 審核檢查清單
│   │   └── index.ts
│   │
│   ├── preliminary/                         # 🔍 初驗功能
│   │   ├── acceptance-preliminary.component.ts # Feature 主元件
│   │   ├── components/
│   │   │   ├── preliminary-form.component.ts   # 初驗表單
│   │   │   ├── preliminary-list.component.ts   # 初驗列表
│   │   │   └── preliminary-report.component.ts # 初驗報告
│   │   └── index.ts
│   │
│   ├── re-inspection/                       # 🔄 複驗功能
│   │   ├── acceptance-re-inspection.component.ts # Feature 主元件
│   │   ├── components/
│   │   │   ├── re-inspection-form.component.ts   # 複驗表單
│   │   │   ├── re-inspection-list.component.ts   # 複驗列表
│   │   │   └── re-inspection-comparison.component.ts # 複驗對比
│   │   └── index.ts
│   │
│   └── conclusion/                          # ✅ 驗收結論功能
│       ├── acceptance-conclusion.component.ts # Feature 主元件
│       ├── components/
│       │   ├── conclusion-form.component.ts     # 結論表單
│       │   ├── conclusion-list.component.ts     # 結論列表
│       │   └── conclusion-summary.component.ts  # 結論摘要
│       └── index.ts
│
├── shared/                                  # 🔄 共享元件
│   ├── components/
│   │   ├── acceptance-status-badge.component.ts # 狀態標籤
│   │   ├── acceptance-timeline.component.ts     # 時間軸
│   │   └── acceptance-attachments.component.ts  # 附件列表
│   └── index.ts
│
└── [legacy files]                           # 📦 舊版檔案（待移除）
    └── acceptance-module-view.component.ts
```

## 🎨 架構設計

### 主協調器 (Main Orchestrator)

**`AcceptanceModuleViewComponent`** - Thin orchestration layer

責任:
- 管理高層狀態 (acceptance records, loading, active feature)
- 協調 features 互動
- 處理 feature 事件
- 載入資料並分發給 features

特點:
- **Thin Layer**: 最小化邏輯，委託給 features
- **Event-Driven**: 透過 inputs/outputs 與 features 溝通
- **Stateful**: 只管理必要的全域狀態

### Features 架構

每個 feature 是自包含的功能模組，詳細說明請見上方目錄結構。

## 技術棧

- Angular 20.x
- ng-alain 20.x
- ng-zorro-antd 20.x
- Signals for state management
- Standalone Components
- TypeScript 5.x

## 維護者

GigHub Development Team

---

**更新日期**: 2025-12-19  
**重構版本**: v2.0  
**基於**: Contract Module Refactoring Pattern (#75)
