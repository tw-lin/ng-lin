# 玄武主題遷移指南
# Xuanwu Theme Migration Guide

> **從其他主題無痛遷移到玄武主題**

## 📖 目錄

1. [遷移概覽](#遷移概覽)
2. [從 Azure Dragon 主題遷移](#從-azure-dragon-主題遷移)
3. [從預設主題遷移](#從預設主題遷移)
4. [遷移檢查清單](#遷移檢查清單)
5. [常見問題](#常見問題)
6. [回滾方案](#回滾方案)

---

## 遷移概覽

### 主要變更

| 項目 | 原主題 | 玄武主題 | 影響範圍 |
|------|--------|----------|----------|
| 主色 | Azure Blue (#0EA5E9) | Xuanwu Navy (#1E3A8A) | 所有主要按鈕、連結 |
| 成功色 | Jade Green (#14B8A6) | Deep Teal (#0D9488) | 成功提示、狀態 |
| 資訊色 | Cyan (#06B6D4) | Steel Blue (#64748B) | 資訊提示 |
| 漸層 | Dragon 系列 | Xuanwu/Tortoise 系列 | 特色元素 |
| 陰影 | @shadow-azure-* | @shadow-xuanwu-* | 所有陰影效果 |

### 遷移時間估算

- **小型專案** (< 50 個元件): 1-2 小時
- **中型專案** (50-200 個元件): 4-8 小時
- **大型專案** (> 200 個元件): 1-2 天

### 風險評估

- **低風險**: 使用主題變數的元件 (自動更新)
- **中風險**: 部分硬編碼顏色的元件 (需手動更新)
- **高風險**: 自訂複雜樣式的元件 (需重新設計)

---

## 從 Azure Dragon 主題遷移

### 步驟 1: 備份現有配置

```bash
# 備份主題檔案
cp src/styles/theme.less src/styles/theme.less.backup
cp src/app/app.config.ts src/app/app.config.ts.backup

# 建立 Git 備份分支
git checkout -b backup-azure-theme
git add .
git commit -m "Backup Azure Dragon theme before migration"
git checkout main
```

### 步驟 2: 更新色彩變數

#### 在 theme.less 中替換

```less
// ========== 舊的 (Azure Dragon) ==========
@primary-color: #0EA5E9;        // Azure Blue
@success-color: #14B8A6;        // Jade Green
@info-color: #06B6D4;           // Cyan

@azure-1: #E6F7FF;
@azure-6: #0EA5E9;              // 主色
@jade-4: #14B8A6;               // 成功色
@cyan-3: #06B6D4;               // 資訊色

// ========== 新的 (Xuanwu) ==========
@primary-color: #1E3A8A;        // Xuanwu Navy
@success-color: #0D9488;        // Deep Teal
@info-color: #64748B;           // Steel Blue

@xuanwu-1: #EFF6FF;
@xuanwu-6: #1E3A8A;            // 主色
@teal-4: #0D9488;              // 成功色
@steel-3: #64748B;             // 資訊色
```

#### 色彩對照完整表

| Azure Dragon | Xuanwu | 用途 | 對比度變化 |
|--------------|--------|------|------------|
| @azure-1 (#E6F7FF) | @xuanwu-1 (#EFF6FF) | 最淺背景 | 相似 |
| @azure-2 (#BAE7FF) | @xuanwu-2 (#DBEAFE) | 懸停背景 | 相似 |
| @azure-3 (#91D5FF) | @xuanwu-3 (#BFDBFE) | 次要元素 | 相似 |
| @azure-4 (#69C0FF) | @xuanwu-4 (#93C5FD) | 禁用狀態 | 相似 |
| @azure-5 (#40A9FF) | @xuanwu-5 (#60A5FA) | 懸停輔助 | 相似 |
| @azure-6 (#0EA5E9) | @xuanwu-6 (#1E3A8A) | ⭐ 主色 | 較深 |
| @jade-4 (#14B8A6) | @teal-4 (#0D9488) | 成功色 | 略深 |
| @cyan-3 (#06B6D4) | @steel-3 (#64748B) | 資訊色 | 較深 |

### 步驟 3: 更新漸層定義

```less
// ========== 舊的漸層 ==========
@gradient-dragon-soaring: linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%);
@gradient-dragon-scales: linear-gradient(45deg, #0C83BA 0%, #0D9488 50%, #0EA5E9 100%);
@gradient-azure-sky: linear-gradient(180deg, #0EA5E9 0%, #06B6D4 50%, #14B8A6 100%);
@gradient-dawn-light: linear-gradient(135deg, #E6F7FF 0%, #E0F7FA 50%, #E6FFF9 100%);

// ========== 新的漸層 ==========
@gradient-northern-waters: linear-gradient(135deg, #1E3A8A 0%, #0D9488 100%);
@gradient-tortoise-shell: linear-gradient(45deg, #172554 0%, #1E3A8A 50%, #64748B 100%);
@gradient-winter-night: linear-gradient(180deg, #0F172A 0%, #1E3A8A 50%, #0D9488 100%);
@gradient-silver-frost: linear-gradient(135deg, #EFF6FF 0%, #E2E8F0 50%, #CBD5E1 100%);
```

### 步驟 4: 更新陰影變數

```less
// ========== 舊的陰影 ==========
@shadow-azure-sm: 0 1px 2px rgba(14, 165, 233, 0.05);
@shadow-azure-md: 0 4px 6px rgba(14, 165, 233, 0.1);
@shadow-azure-lg: 0 10px 15px rgba(14, 165, 233, 0.15);

// ========== 新的陰影 ==========
@shadow-xuanwu-sm: 0 1px 2px rgba(30, 58, 138, 0.05);
@shadow-xuanwu-md: 0 4px 6px rgba(30, 58, 138, 0.1);
@shadow-xuanwu-lg: 0 10px 15px rgba(30, 58, 138, 0.15);
```

### 步驟 5: 批次替換 CSS 類別

#### 使用搜尋與替換

```bash
# 方法 1: 使用 sed (Linux/Mac)
cd src
find . -type f \( -name "*.less" -o -name "*.html" -o -name "*.ts" \) \
  -exec sed -i 's/@azure-/@xuanwu-/g' {} +
  
find . -type f \( -name "*.less" -o -name "*.html" -o -name "*.ts" \) \
  -exec sed -i 's/@jade-/@teal-/g' {} +
  
find . -type f \( -name "*.less" -o -name "*.html" -o -name "*.ts" \) \
  -exec sed -i 's/@cyan-/@steel-/g' {} +

# 方法 2: 使用 VS Code 全域搜尋替換
# 搜尋: @azure-
# 替換: @xuanwu-
# 搜尋: @jade-
# 替換: @teal-
# 搜尋: @cyan-
# 替換: @steel-
```

#### 手動檢查與替換清單

| 舊 | 新 | 檔案類型 |
|---|---|----------|
| `.azure-card` | `.xuanwu-card` | HTML, Less |
| `.azure-bg-gradient` | `.xuanwu-bg-gradient` | HTML, Less |
| `.dragon-effect` | `.tortoise-effect` | HTML, Less |
| `azure-` (class prefix) | `xuanwu-` | HTML |
| `dragon-` (class prefix) | `tortoise-` | HTML |

### 步驟 6: 更新 TypeScript 配置

#### 更新 app.config.ts

```typescript
// src/app/app.config.ts
import { NzConfig, provideNzConfig } from 'ng-zorro-antd/core/config';

const ngZorroConfig: NzConfig = {
  theme: {
    primaryColor: '#1E3A8A',    // 從 #0EA5E9 改為 #1E3A8A
    successColor: '#0D9488',    // 從 #14B8A6 改為 #0D9488
    warningColor: '#F59E0B',    // 保持不變
    errorColor: '#EF4444',      // 保持不變
    infoColor: '#64748B'        // 從 #06B6D4 改為 #64748B
  }
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideNzConfig(ngZorroConfig),
    // ... 其他 providers
  ]
};
```

---

## 從預設主題遷移

### 步驟 1: 安裝玄武主題配置

#### 建立 theme.less

```less
// src/styles/theme.less

// ========== 玄武主題色彩定義 ==========
@primary-color: #1E3A8A;
@success-color: #0D9488;
@warning-color: #F59E0B;
@error-color: #EF4444;
@info-color: #64748B;

// 文字色
@text-color: #1E293B;
@text-color-secondary: #64748B;
@heading-color: #0F172A;
@disabled-color: #94A3B8;

// 邊框色
@border-color-base: #CBD5E1;
@border-color-split: #E2E8F0;

// 背景色
@body-background: #F8FAFC;
@component-background: #ffffff;
@layout-body-background: #F1F5F9;

// ========== 導入 @delon/theme ==========
@import '@delon/theme/theme-default.less';

// ========== 玄武主題擴展變數 ==========
@import './xuanwu-variables.less';
```

#### 建立 xuanwu-variables.less

```less
// src/styles/xuanwu-variables.less

// 10 級主色階梯
@xuanwu-1: #EFF6FF;
@xuanwu-2: #DBEAFE;
@xuanwu-3: #BFDBFE;
@xuanwu-4: #93C5FD;
@xuanwu-5: #60A5FA;
@xuanwu-6: #1E3A8A;
@xuanwu-7: #1E40AF;
@xuanwu-8: #1D4ED8;
@xuanwu-9: #172554;
@xuanwu-10: #0F172A;

// 6 級成功色階梯
@teal-1: #F0FDFA;
@teal-2: #CCFBF1;
@teal-3: #99F6E4;
@teal-4: #0D9488;
@teal-5: #0F766E;
@teal-6: #115E59;

// 5 級資訊色階梯
@steel-1: #F8FAFC;
@steel-2: #F1F5F9;
@steel-3: #64748B;
@steel-4: #475569;
@steel-5: #334155;

// 4 級強調色階梯
@silver-1: #F8FAFC;
@silver-2: #E2E8F0;
@silver-3: #94A3B8;
@silver-4: #64748B;

// 漸層系統
@gradient-northern-waters: linear-gradient(135deg, #1E3A8A 0%, #0D9488 100%);
@gradient-tortoise-shell: linear-gradient(45deg, #172554 0%, #1E3A8A 50%, #64748B 100%);
@gradient-winter-night: linear-gradient(180deg, #0F172A 0%, #1E3A8A 50%, #0D9488 100%);
@gradient-silver-frost: linear-gradient(135deg, #EFF6FF 0%, #E2E8F0 50%, #CBD5E1 100%);

// 陰影系統
@shadow-xuanwu-sm: 0 1px 2px rgba(30, 58, 138, 0.05);
@shadow-xuanwu-md: 0 4px 6px rgba(30, 58, 138, 0.1);
@shadow-xuanwu-lg: 0 10px 15px rgba(30, 58, 138, 0.15);
@shadow-xuanwu-xl: 0 20px 25px rgba(30, 58, 138, 0.2);

// 光暈效果
@glow-xuanwu: 0 0 20px rgba(30, 58, 138, 0.5);
@glow-teal: 0 0 20px rgba(13, 148, 136, 0.5);
```

### 步驟 2: 更新 styles.less

```less
// src/styles.less
@import './styles/theme.less';
@import './styles/xuanwu-custom.less';
```

### 步驟 3: 更新 angular.json

```json
{
  "projects": {
    "your-project": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "src/styles.less"
            ]
          }
        }
      }
    }
  }
}
```

---

## 遷移檢查清單

### 🎨 視覺檢查

#### 全域樣式
- [ ] 主色顯示正確
- [ ] 成功/警告/錯誤色正確
- [ ] 背景色正確
- [ ] 文字色對比度足夠

#### 元件樣式
- [ ] 按鈕樣式正確
- [ ] 連結顏色正確
- [ ] 表單元素正確
- [ ] 表格樣式正確
- [ ] 導航樣式正確
- [ ] 卡片樣式正確
- [ ] 模態框樣式正確
- [ ] 提示訊息樣式正確

### 🔧 技術檢查

#### 建置檢查
- [ ] Less 編譯成功
- [ ] 無 TypeScript 錯誤
- [ ] 無 ESLint 警告
- [ ] `yarn build` 成功
- [ ] `yarn start` 正常運行
- [ ] Bundle 大小合理

#### 程式碼檢查
- [ ] 已移除所有硬編碼顏色
- [ ] 已更新所有主題變數
- [ ] 已更新 CSS 類別名稱
- [ ] 已更新漸層引用
- [ ] 已更新陰影引用

### 📱 瀏覽器測試

#### 桌面瀏覽器
- [ ] Chrome (最新版本)
- [ ] Firefox (最新版本)
- [ ] Safari (最新版本)
- [ ] Edge (最新版本)

#### 行動瀏覽器
- [ ] iOS Safari
- [ ] Chrome Android
- [ ] Samsung Internet

### ♿ 無障礙檢查

#### WCAG 合規
- [ ] 色彩對比度達標 (WCAG AA)
- [ ] 鍵盤導航正常
- [ ] 螢幕閱讀器相容
- [ ] 焦點狀態清晰
- [ ] ARIA 標籤正確

---

## 常見問題

### Q1: 某些元件顏色沒有更新？

**原因**：可能使用了硬編碼的顏色值。

**解決方案**：
```bash
# 搜尋硬編碼的 Azure Blue
grep -r "#0EA5E9" src/

# 替換為變數
# 將 #0EA5E9 改為 @xuanwu-6
```

### Q2: Less 編譯錯誤？

**原因**：變數定義順序不正確或遺漏導入。

**解決方案**：
1. 確認變數定義在 `@import '@delon/theme'` 之前
2. 檢查所有 `@import` 語句路徑正確
3. 清除快取：`rm -rf .angular && yarn build`

### Q3: 動態主題切換不生效？

**原因**：NzConfigService 配置未正確更新。

**解決方案**：
```typescript
// 確認配置正確注入
export const appConfig: ApplicationConfig = {
  providers: [
    provideNzConfig(ngZorroConfig), // 確保此行存在
    // ...
  ]
};
```

### Q4: 效能下降？

**原因**：過多漸層或陰影效果。

**解決方案**：
1. 檢查是否過度使用漸層
2. 在行動裝置上簡化樣式
3. 啟用生產模式建置
4. 使用 CSS transform 而非 position

### Q5: 某些頁面佈局錯亂？

**原因**：主題變更影響了元件尺寸或間距。

**解決方案**：
1. 檢查該頁面的自訂樣式
2. 確認使用標準間距變數
3. 檢視瀏覽器開發者工具中的樣式衝突

---

## 回滾方案

### 緊急回滾

如果遷移後遇到嚴重問題，可以快速回滾：

```bash
# 方法 1: Git 回滾
git stash
git checkout backup-azure-theme
git checkout -b main-rollback

# 方法 2: 恢復備份檔案
cp src/styles/theme.less.backup src/styles/theme.less
cp src/app/app.config.ts.backup src/app/app.config.ts

# 重新建置
rm -rf .angular
yarn build
```

### 漸進式遷移策略

如果需要漸進式遷移：

1. **階段 1**：更新核心主題配置
2. **階段 2**：更新主要頁面 (首頁、列表頁)
3. **階段 3**：更新次要頁面
4. **階段 4**：更新自訂元件
5. **階段 5**：完全移除舊主題程式碼

---

**版本**: 2.0.0  
**最後更新**: 2025-12-17  
**維護者**: GitHub Copilot  
**狀態**: ✅ 生產環境就緒
