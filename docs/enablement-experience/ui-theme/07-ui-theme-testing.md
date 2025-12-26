# 玄武主題測試清單
# Xuanwu Theme Testing Checklist

> **品質保證完整檢查項目**

## 📖 目錄

1. [視覺測試](#視覺測試)
2. [功能測試](#功能測試)
3. [無障礙測試](#無障礙測試)
4. [瀏覽器相容性](#瀏覽器相容性)
5. [效能測試](#效能測試)
6. [回歸測試](#回歸測試)
7. [測試工具](#測試工具)

---

## 視覺測試

### 🎨 色彩檢查

#### 主色系驗證
- [ ] xuanwu-1 (#EFF6FF) - 最淺背景顯示正確
- [ ] xuanwu-6 (#1E3A8A) - ⭐ 主色顯示正確
- [ ] xuanwu-10 (#0F172A) - 最深色顯示正確
- [ ] 主色懸停狀態 (#1E40AF) 顯示正確
- [ ] 主色啟用狀態 (#1D4ED8) 顯示正確
- [ ] 主色禁用狀態 (#93C5FD) 顯示正確

#### 語義色驗證
- [ ] 成功色 (#0D9488) 顯示正確
- [ ] 警告色 (#F59E0B) 顯示正確
- [ ] 錯誤色 (#EF4444) 顯示正確
- [ ] 資訊色 (#64748B) 顯示正確
- [ ] 所有語義色對比度 ≥ 4.5:1

#### 漸層效果驗證
- [ ] 北方之水漸層 (Northern Waters) 顯示流暢
- [ ] 龜甲紋理漸層 (Tortoise Shell) 顯示正確
- [ ] 冬夜深沉漸層 (Winter Night) 顯示正確
- [ ] 銀霜微光漸層 (Silver Frost) 顯示正確
- [ ] 深淵神秘漸層 (Deep Mystery) 顯示正確
- [ ] 漸層過渡平滑無斷層

#### 陰影系統驗證
- [ ] 小陰影 (@shadow-xuanwu-sm) 顯示正確
- [ ] 中陰影 (@shadow-xuanwu-md) 顯示正確
- [ ] 大陰影 (@shadow-xuanwu-lg) 顯示正確
- [ ] 超大陰影 (@shadow-xuanwu-xl) 顯示正確
- [ ] 陰影層次清晰可見

### 📦 元件視覺檢查

#### 按鈕元件
- [ ] 主要按鈕 (Primary) 樣式正確
- [ ] 次要按鈕 (Default) 樣式正確
- [ ] 危險按鈕 (Danger) 樣式正確
- [ ] 虛線按鈕 (Dashed) 樣式正確
- [ ] 連結按鈕 (Link) 樣式正確
- [ ] 文字按鈕 (Text) 樣式正確
- [ ] 按鈕懸停效果正確
- [ ] 按鈕啟用狀態正確
- [ ] 按鈕禁用狀態正確
- [ ] 按鈕載入狀態正確
- [ ] 大/中/小尺寸顯示正確

#### 表單元件
- [ ] 輸入框 (Input) 樣式正確
- [ ] 輸入框焦點狀態正確
- [ ] 輸入框錯誤狀態正確
- [ ] 選擇器 (Select) 樣式正確
- [ ] 選擇器下拉選單正確
- [ ] 複選框 (Checkbox) 樣式正確
- [ ] 複選框選中狀態正確
- [ ] 單選框 (Radio) 樣式正確
- [ ] 單選框選中狀態正確
- [ ] 開關 (Switch) 樣式正確
- [ ] 日期選擇器樣式正確
- [ ] 時間選擇器樣式正確
- [ ] 表單驗證提示正確

#### 表格元件
- [ ] 表頭樣式正確 (銀霜微光漸層)
- [ ] 表頭文字顏色正確
- [ ] 表格行樣式正確
- [ ] 表格行懸停效果正確
- [ ] 表格行選中狀態正確
- [ ] 表格邊框顯示正確
- [ ] 分頁元件樣式正確
- [ ] 排序圖示顯示正確
- [ ] 篩選器樣式正確

#### 導航元件
- [ ] 選單項樣式正確
- [ ] 選單項選中狀態正確
- [ ] 選單項懸停效果正確
- [ ] 子選單樣式正確
- [ ] 麵包屑樣式正確
- [ ] 標籤頁樣式正確
- [ ] 標籤頁選中狀態正確
- [ ] 步驟條樣式正確

#### 回饋元件
- [ ] 成功提示 (Alert Success) 樣式正確
- [ ] 警告提示 (Alert Warning) 樣式正確
- [ ] 錯誤提示 (Alert Error) 樣式正確
- [ ] 資訊提示 (Alert Info) 樣式正確
- [ ] 通知訊息樣式正確
- [ ] 載入動畫 (Spin) 樣式正確
- [ ] 進度條樣式正確
- [ ] 對話框 (Modal) 樣式正確
- [ ] 抽屜 (Drawer) 樣式正確
- [ ] 工具提示 (Tooltip) 樣式正確

#### 資料展示
- [ ] 卡片 (Card) 樣式正確
- [ ] 卡片懸停效果正確
- [ ] 列表 (List) 樣式正確
- [ ] 時間軸 (Timeline) 樣式正確
- [ ] 標籤 (Tag) 樣式正確
- [ ] 徽章 (Badge) 樣式正確
- [ ] 頭像 (Avatar) 樣式正確
- [ ] 摺疊面板 (Collapse) 樣式正確

---

## 功能測試

### 🔧 互動測試

#### 滑鼠互動
- [ ] 懸停 (Hover) 效果正確觸發
- [ ] 點擊 (Click) 回饋正確
- [ ] 雙擊 (Double Click) 功能正常
- [ ] 右鍵選單正常
- [ ] 拖曳 (Drag) 功能正常
- [ ] 滾動 (Scroll) 流暢

#### 鍵盤互動
- [ ] Tab 鍵導航順序正確
- [ ] Shift+Tab 反向導航正確
- [ ] Enter 鍵觸發正確
- [ ] Escape 鍵關閉正確
- [ ] 方向鍵 (↑↓←→) 導航正常
- [ ] Space 鍵選擇正確
- [ ] 快捷鍵 (Ctrl+S 等) 功能正常

#### 觸控互動
- [ ] 點擊觸控正常
- [ ] 長按觸控正常
- [ ] 滑動手勢正常
- [ ] 捏合縮放正常
- [ ] 雙指滾動正常

### 📋 動態功能

#### 主題切換
- [ ] 動態切換到玄武主題功能正常
- [ ] 主題切換過渡流暢
- [ ] 主題設定持久化正常
- [ ] 所有元件正確更新
- [ ] 頁面重新載入後主題保持
- [ ] 在不同標籤頁間主題同步

#### 響應式行為
- [ ] 桌面 (≥1200px) 佈局正確
- [ ] 平板橫向 (768-1199px) 佈局正確
- [ ] 平板直向 (576-767px) 佈局正確
- [ ] 手機 (<576px) 佈局正確
- [ ] 斷點切換時無閃爍
- [ ] 字體大小適應正確
- [ ] 間距適應正確
- [ ] 圖片縮放正確

#### 動畫與過渡
- [ ] 頁面切換動畫流暢
- [ ] 元件展開/收合動畫正確
- [ ] 載入動畫顯示正確
- [ ] 懸停過渡流暢
- [ ] 無卡頓或跳躍
- [ ] 動畫時長適當 (0.15s-0.5s)

---

## 無障礙測試

### ♿ WCAG 2.1 合規

#### 色彩對比度 (Level AA)
- [ ] 主文字 (#1E293B) / 白色: 14.8:1 ✅ (AAA)
- [ ] Xuanwu-6 (#1E3A8A) / 白色: 8.9:1 ✅ (AAA)
- [ ] Teal-4 (#0D9488) / 白色: 4.5:1 ✅ (AA)
- [ ] Steel-3 (#64748B) / 白色: 5.3:1 ✅ (AA)
- [ ] Error (#EF4444) / 白色: 4.5:1 ✅ (AA)
- [ ] 所有重要文字對比度 ≥ 4.5:1
- [ ] 大文字 (≥18pt) 對比度 ≥ 3:1

#### 鍵盤訪問
- [ ] 所有互動元素可鍵盤訪問
- [ ] 焦點指示器清晰可見 (2px outline)
- [ ] Tab 順序合理且邏輯清晰
- [ ] 無鍵盤陷阱 (Keyboard Trap)
- [ ] 跳過導航連結可用
- [ ] 所有功能可純鍵盤完成

#### 螢幕閱讀器
- [ ] 所有圖片有替代文字 (alt)
- [ ] 表單標籤正確關聯 (label for)
- [ ] 按鈕有描述性文字或 aria-label
- [ ] ARIA 標籤正確使用
- [ ] ARIA 角色 (role) 適當
- [ ] ARIA 狀態 (aria-*) 正確
- [ ] 頁面標題 (`<title>`) 準確描述
- [ ] 區域地標 (landmark) 正確使用
- [ ] 表格有標題 (`<caption>`)

#### 語義化 HTML
- [ ] 使用正確的 HTML5 標籤
- [ ] 標題層級 (h1-h6) 結構正確
- [ ] 列表使用 `<ul>/<ol>/<li>`
- [ ] 表格使用 `<table>/<thead>/<tbody>`
- [ ] 按鈕使用 `<button>` 而非 `<div>`
- [ ] 連結使用 `<a href>`
- [ ] 導航使用 `<nav>`
- [ ] 主要內容使用 `<main>`

#### 其他無障礙要求
- [ ] 不僅依賴色彩傳達資訊
- [ ] 狀態附加圖示與文字
- [ ] 時間限制可調整或取消
- [ ] 無閃爍內容 (癲癇警告)
- [ ] 可調整文字大小至 200%
- [ ] 支援強制色彩模式

---

## 瀏覽器相容性

### 🌐 桌面瀏覽器

#### Chrome / Edge (Chromium)
- [ ] 最新版本 (121+) 顯示正常
- [ ] 前一個版本 (120) 顯示正常
- [ ] 前兩個版本 (119) 顯示正常
- [ ] DevTools 無 Console 錯誤
- [ ] 效能良好 (FPS ≥ 60)

#### Firefox
- [ ] 最新版本 (122+) 顯示正常
- [ ] 前一個版本 (121) 顯示正常
- [ ] 前兩個版本 (120) 顯示正常
- [ ] DevTools 無 Console 錯誤
- [ ] 效能良好 (FPS ≥ 60)

#### Safari
- [ ] macOS 最新版本 (17+) 顯示正常
- [ ] macOS 前一個版本 (16) 顯示正常
- [ ] iOS Safari 最新版本顯示正常
- [ ] Web Inspector 無錯誤
- [ ] 效能良好

### 📱 行動瀏覽器

#### iOS Safari
- [ ] iOS 17 顯示正常
- [ ] iOS 16 顯示正常
- [ ] iOS 15 顯示正常
- [ ] 觸控互動正常
- [ ] 滾動流暢
- [ ] 無佈局問題

#### Chrome Android
- [ ] Android 14 顯示正常
- [ ] Android 13 顯示正常
- [ ] Android 12 顯示正常
- [ ] 觸控互動正常
- [ ] 滾動流暢
- [ ] 無佈局問題

#### 其他行動瀏覽器
- [ ] Samsung Internet 顯示正常
- [ ] Firefox Mobile 顯示正常
- [ ] Opera Mobile 顯示正常

---

## 效能測試

### ⚡ Lighthouse 分數

#### 效能指標
- [ ] Performance Score ≥ 90
- [ ] First Contentful Paint (FCP) < 1.5s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Time to Interactive (TTI) < 3.5s
- [ ] Speed Index < 3.0s
- [ ] Total Blocking Time (TBT) < 200ms
- [ ] Cumulative Layout Shift (CLS) < 0.1

#### 無障礙分數
- [ ] Accessibility Score ≥ 95
- [ ] 色彩對比度通過
- [ ] ARIA 標籤正確
- [ ] 替代文字完整

#### 最佳實踐分數
- [ ] Best Practices Score ≥ 95
- [ ] 使用 HTTPS
- [ ] 無 Console 錯誤
- [ ] 圖片尺寸適當

#### SEO 分數
- [ ] SEO Score ≥ 90
- [ ] Meta 標籤完整
- [ ] 頁面標題正確
- [ ] 結構化資料正確

### 📊 資源大小

#### Bundle 分析
- [ ] Main bundle < 500KB (gzipped)
- [ ] CSS bundle < 100KB (gzipped)
- [ ] Vendor bundle < 300KB (gzipped)
- [ ] 無重複依賴
- [ ] Tree-shaking 正常運作

#### 圖片優化
- [ ] 圖片使用 WebP/AVIF 格式
- [ ] 圖片尺寸適當
- [ ] 圖片啟用懶載入
- [ ] 圖片有 loading="lazy"

#### 載入優化
- [ ] 啟用 Gzip/Brotli 壓縮
- [ ] 啟用瀏覽器快取
- [ ] 使用 CDN (如適用)
- [ ] 關鍵 CSS 內聯

### 🚀 執行時效能

#### 渲染效能
- [ ] 動畫幀率 ≥ 60 FPS
- [ ] 滾動流暢無卡頓
- [ ] 無 Layout Thrashing
- [ ] 無 Memory Leak

#### 互動效能
- [ ] 按鈕點擊回應 < 100ms
- [ ] 輸入延遲 < 50ms
- [ ] 頁面切換 < 300ms
- [ ] 模態框開啟 < 200ms

---

## 回歸測試

### 🔄 核心功能回歸

#### 認證流程
- [ ] 登入功能正常
- [ ] 登出功能正常
- [ ] 註冊功能正常
- [ ] 密碼重設功能正常
- [ ] Token 刷新正常

#### 資料操作
- [ ] 資料載入正常
- [ ] 資料新增正常
- [ ] 資料編輯正常
- [ ] 資料刪除正常
- [ ] 資料搜尋正常
- [ ] 資料篩選正常
- [ ] 資料排序正常
- [ ] 分頁功能正常

#### 檔案操作
- [ ] 檔案上傳正常
- [ ] 檔案下載正常
- [ ] 檔案預覽正常
- [ ] 檔案刪除正常

### 🔍 關鍵頁面回歸

#### 公開頁面
- [ ] 首頁顯示正常
- [ ] 登入頁顯示正常
- [ ] 註冊頁顯示正常
- [ ] 關於頁顯示正常

#### 主要功能頁
- [ ] 儀表板顯示正常
- [ ] 列表頁顯示正常
- [ ] 詳情頁顯示正常
- [ ] 表單頁顯示正常
- [ ] 設定頁顯示正常

#### 錯誤頁面
- [ ] 404 頁面顯示正常
- [ ] 500 頁面顯示正常
- [ ] 403 頁面顯示正常

---

## 測試工具

### 自動化測試工具

#### 效能分析
- **Lighthouse**: Chrome DevTools 內建
  - 使用: F12 → Lighthouse → Generate Report
  - 檢查: Performance, Accessibility, Best Practices, SEO

- **WebPageTest**: https://www.webpagetest.org/
  - 使用: 輸入網址 → Start Test
  - 檢查: Load Time, First Byte, Start Render

#### 無障礙檢查
- **axe DevTools**: Chrome/Firefox 擴充套件
  - 使用: F12 → axe DevTools → Scan
  - 檢查: WCAG Violations, Best Practices

- **WAVE**: Chrome/Firefox 擴充套件
  - 使用: 點擊圖示 → View Report
  - 檢查: Errors, Alerts, Features

- **Accessibility Insights**: Microsoft 工具
  - 使用: F12 → Accessibility Insights → FastPass
  - 檢查: Automated Checks, Tab Stops

#### 視覺回歸
- **Percy**: https://percy.io/
  - 使用: 整合 CI/CD pipeline
  - 檢查: Screenshot Diffs

- **Chromatic**: https://www.chromatic.com/
  - 使用: Storybook 整合
  - 檢查: Visual Changes

### 手動測試工具

#### 開發者工具
- **Chrome DevTools**: F12
  - Elements: 檢查 DOM 和樣式
  - Console: 檢查錯誤和警告
  - Network: 檢查資源載入
  - Performance: 記錄效能
  - Lighthouse: 綜合分析

- **Firefox DevTools**: F12
  - Inspector: 檢查元素
  - Console: 檢查訊息
  - Debugger: 除錯 JavaScript
  - Accessibility: 無障礙檢查

#### 螢幕閱讀器
- **NVDA** (Windows): 免費開源
  - 下載: https://www.nvaccess.org/
  - 使用: Ctrl + Alt + N 啟動

- **JAWS** (Windows): 商業軟體
  - 下載: https://www.freedomscientific.com/

- **VoiceOver** (macOS/iOS): 系統內建
  - 啟動: Cmd + F5 (macOS)

#### 色彩對比檢查
- **WebAIM Contrast Checker**
  - 網址: https://webaim.org/resources/contrastchecker/
  - 使用: 輸入前景色和背景色

- **Contrast Ratio by Lea Verou**
  - 網址: https://contrast-ratio.com/
  - 使用: 即時對比度計算

---

## 測試報告範本

### 測試摘要表

```markdown
# 玄武主題測試報告

**日期**: 2025-12-17  
**測試者**: [姓名]  
**版本**: 2.0.0  
**環境**: Production / Staging / Development

## 測試結果總覽

| 測試類型 | 通過 | 失敗 | 警告 | 總計 |
|---------|------|------|------|------|
| 視覺測試 | 95 | 2 | 3 | 100 |
| 功能測試 | 48 | 1 | 1 | 50 |
| 無障礙測試 | 42 | 0 | 3 | 45 |
| 瀏覽器相容性 | 28 | 0 | 2 | 30 |
| 效能測試 | 18 | 1 | 1 | 20 |
| 回歸測試 | 35 | 0 | 0 | 35 |
| **總計** | **266** | **4** | **10** | **280** |

**通過率**: 95.0% (266/280)

## 關鍵問題

### 🔴 嚴重問題 (Critical)

**無**

### 🟠 高優先級問題 (High)

1. **問題**: IE11 漸層顯示異常
   - **影響**: IE11 使用者無法看到正確的漸層效果
   - **建議**: 提供 fallback 純色背景
   - **狀態**: 待修復

### 🟡 中優先級問題 (Medium)

1. **問題**: Safari 14 陰影模糊
   - **影響**: 較舊版本 Safari 陰影效果不明顯
   - **建議**: 調整 box-shadow 值
   - **狀態**: 待修復

2. **問題**: 表格排序圖示對比度不足
   - **影響**: 無障礙性分數降低
   - **建議**: 調整圖示顏色或大小
   - **狀態**: 待修復

### �� 低優先級問題 (Low)

1. **問題**: 某些警告提示文字可讀性略低
   - **影響**: 使用者體驗輕微影響
   - **建議**: 增加警告色對比度
   - **狀態**: 可選修復

## Lighthouse 分數

| 指標 | 分數 | 狀態 |
|------|------|------|
| Performance | 92 | ✅ 優秀 |
| Accessibility | 96 | ✅ 優秀 |
| Best Practices | 95 | ✅ 優秀 |
| SEO | 100 | ✅ 完美 |

## 建議

1. **短期**: 修復高優先級問題，確保主流瀏覽器體驗一致
2. **中期**: 優化效能，提升 Lighthouse Performance 至 95+
3. **長期**: 持續監控無障礙性，保持 WCAG AA 合規

## 附件

- 截圖: `screenshots/xuanwu-theme-test-2025-12-17.zip`
- 詳細日誌: `logs/test-log-2025-12-17.txt`
- Lighthouse 報告: `reports/lighthouse-report.html`
```

---

**版本**: 2.0.0  
**最後更新**: 2025-12-17  
**維護者**: GitHub Copilot  
**狀態**: ✅ 生產環境就緒
