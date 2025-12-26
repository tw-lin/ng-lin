# 響應式設計 (Responsive Design)

> 來源：`docs-old/ui-theme/COLOR_SYSTEM.md`、`IMPLEMENTATION_GUIDE.md`。定義斷點、排版與適配策略。

## 📐 斷點
```
xs: <576px
sm: ≥576px
md: ≥768px
lg: ≥992px
xl: ≥1200px
xxl: ≥1400px
```

## 🧭 佈局策略
- Mobile First：基礎樣式為手機版，逐步在 md/lg/xl 增加間距與佈局。
- Grid：使用 ng-zorro Grid；12 欄配置，支援 gutter 與響應式欄位設定。
- 固定區塊：工具列/操作欄需在桌面版固定，行動版可折疊。

## ✅ 檢查清單
- [ ] 主要頁面在 xs/sm/md/lg 均無水平捲軸
- [ ] 表格在行動版提供卡片/摺疊呈現
- [ ] 導航在行動版可摺疊或抽屜化
- [ ] 間距、字級隨斷點調整，不影響可讀性

## 相關來源
- `docs-old/ui-theme/COLOR_SYSTEM.md`
- `docs-old/ui-theme/IMPLEMENTATION_GUIDE.md`
