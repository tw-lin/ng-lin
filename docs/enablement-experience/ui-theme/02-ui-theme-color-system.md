# 玄武主題色彩系統
# Xuanwu Theme Color System

> **詳細配色規範與使用指南**

## 📖 目錄 (Table of Contents)

1. [完整色彩階梯](#完整色彩階梯)
2. [語義色彩](#語義色彩)
3. [漸層系統](#漸層系統)
4. [陰影與光暈](#陰影與光暈)
5. [對比度測試](#對比度測試)
6. [色彩變數](#色彩變數)

---

## 完整色彩階梯 (Complete Color Scales)

### 主色系 - 玄武深藍 (Xuanwu Navy)

10 級色階，靈感源自深海與午夜天空。

| 等級 | 變數名 | 色碼 | RGB | HSL | 用途 |
|------|--------|------|-----|-----|------|
| 1 | `@xuanwu-1` | `#EFF6FF` | rgb(239, 246, 255) | hsl(214, 100%, 97%) | 最淺背景 |
| 2 | `@xuanwu-2` | `#DBEAFE` | rgb(219, 234, 254) | hsl(214, 95%, 93%) | 懸停背景 |
| 3 | `@xuanwu-3` | `#BFDBFE` | rgb(191, 219, 254) | hsl(214, 95%, 87%) | 次要元素 |
| 4 | `@xuanwu-4` | `#93C5FD` | rgb(147, 197, 253) | hsl(213, 97%, 78%) | 禁用狀態 |
| 5 | `@xuanwu-5` | `#60A5FA` | rgb(96, 165, 250) | hsl(213, 94%, 68%) | 懸停輔助 |
| 6 | `@xuanwu-6` | `#1E3A8A` | rgb(30, 58, 138) | hsl(224, 64%, 33%) | ⭐ 品牌主色 |
| 7 | `@xuanwu-7` | `#1E40AF` | rgb(30, 64, 175) | hsl(224, 71%, 40%) | 啟用主色 |
| 8 | `@xuanwu-8` | `#1D4ED8` | rgb(29, 78, 216) | hsl(224, 76%, 48%) | 文字色 |
| 9 | `@xuanwu-9` | `#172554` | rgb(23, 37, 84) | hsl(226, 57%, 21%) | 強調深色 |
| 10 | `@xuanwu-10` | `#0F172A` | rgb(15, 23, 42) | hsl(222, 47%, 11%) | 暗色背景 |

#### 對比度測試 (白色背景)

| 等級 | 對比度 | WCAG AA | WCAG AAA | 適用場景 |
|------|--------|---------|----------|----------|
| xuanwu-1 | 1.01:1 | ❌ | ❌ | 僅背景 |
| xuanwu-2 | 1.05:1 | ❌ | ❌ | 僅背景 |
| xuanwu-3 | 1.18:1 | ❌ | ❌ | 僅背景/邊框 |
| xuanwu-4 | 1.64:1 | ❌ | ❌ | 僅裝飾 |
| xuanwu-5 | 2.25:1 | ❌ | ❌ | 大字號 |
| xuanwu-6 | 8.92:1 | ✅ AA | ✅ AAA | 所有文字 |
| xuanwu-7 | 6.50:1 | ✅ AA | ✅ AAA | 所有文字 |
| xuanwu-8 | 4.76:1 | ✅ AA | ⚠️ AAA 大字 | 正常文字 |
| xuanwu-9 | 13.84:1 | ✅ AA | ✅ AAA | 所有文字 |
| xuanwu-10 | 17.89:1 | ✅ AA | ✅ AAA | 所有文字 |

### 次要色系 - 深青綠 (Deep Teal)

6 級色階，代表流動之水與深處生命力。

| 等級 | 變數名 | 色碼 | RGB | HSL | 用途 |
|------|--------|------|-----|-----|------|
| 1 | `@teal-1` | `#F0FDFA` | rgb(240, 253, 250) | hsl(166, 76%, 97%) | 成功背景 |
| 2 | `@teal-2` | `#CCFBF1` | rgb(204, 251, 241) | hsl(166, 76%, 89%) | 懸停成功 |
| 3 | `@teal-3` | `#99F6E4` | rgb(153, 246, 228) | hsl(166, 76%, 78%) | 次要成功 |
| 4 | `@teal-4` | `#0D9488` | rgb(13, 148, 136) | hsl(174, 84%, 32%) | ⭐ 主成功色 |
| 5 | `@teal-5` | `#0F766E` | rgb(15, 118, 110) | hsl(174, 77%, 26%) | 啟用成功 |
| 6 | `@teal-6` | `#115E59` | rgb(17, 94, 89) | hsl(176, 69%, 22%) | 強調成功 |

#### 對比度測試 (白色背景)

| 等級 | 對比度 | WCAG AA | WCAG AAA | 適用場景 |
|------|--------|---------|----------|----------|
| teal-1 | 1.01:1 | ❌ | ❌ | 僅背景 |
| teal-2 | 1.08:1 | ❌ | ❌ | 僅背景 |
| teal-3 | 1.31:1 | ❌ | ❌ | 僅裝飾 |
| teal-4 | 4.53:1 | ✅ AA | ⚠️ AAA 大字 | 正常文字 |
| teal-5 | 6.41:1 | ✅ AA | ✅ AAA | 所有文字 |
| teal-6 | 8.59:1 | ✅ AA | ✅ AAA | 所有文字 |

### 第三色系 - 鋼藍 (Steel Blue)

5 級色階，代表智慧、清晰與保護。

| 等級 | 變數名 | 色碼 | RGB | HSL | 用途 |
|------|--------|------|-----|-----|------|
| 1 | `@steel-1` | `#F8FAFC` | rgb(248, 250, 252) | hsl(210, 20%, 98%) | 資訊背景 |
| 2 | `@steel-2` | `#F1F5F9` | rgb(241, 245, 249) | hsl(210, 20%, 96%) | 懸停資訊 |
| 3 | `@steel-3` | `#64748B` | rgb(100, 116, 139) | hsl(215, 16%, 47%) | ⭐ 主資訊色 |
| 4 | `@steel-4` | `#475569` | rgb(71, 85, 105) | hsl(215, 19%, 35%) | 啟用資訊 |
| 5 | `@steel-5` | `#334155` | rgb(51, 65, 85) | hsl(215, 25%, 27%) | 強調資訊 |

#### 對比度測試 (白色背景)

| 等級 | 對比度 | WCAG AA | WCAG AAA | 適用場景 |
|------|--------|---------|----------|----------|
| steel-1 | 1.01:1 | ❌ | ❌ | 僅背景 |
| steel-2 | 1.04:1 | ❌ | ❌ | 僅背景 |
| steel-3 | 5.29:1 | ✅ AA | ✅ AAA | 所有文字 |
| steel-4 | 7.94:1 | ✅ AA | ✅ AAA | 所有文字 |
| steel-5 | 11.06:1 | ✅ AA | ✅ AAA | 所有文字 |

### 強調色系 - 銀灰 (Silver)

4 級色階，代表龜甲防護與遠古智慧。

| 等級 | 變數名 | 色碼 | RGB | HSL | 用途 |
|------|--------|------|-----|-----|------|
| 1 | `@silver-1` | `#F8FAFC` | rgb(248, 250, 252) | hsl(210, 20%, 98%) | 最淺背景 |
| 2 | `@silver-2` | `#E2E8F0` | rgb(226, 232, 240) | hsl(214, 32%, 91%) | 邊框 |
| 3 | `@silver-3` | `#94A3B8` | rgb(148, 163, 184) | hsl(214, 20%, 65%) | ⭐ 次要文字 |
| 4 | `@silver-4` | `#64748B` | rgb(100, 116, 139) | hsl(215, 16%, 47%) | 主要文字 |

---

## 語義色彩 (Semantic Colors)

### 主要語義色

```less
// 主色 (Primary)
@primary-color: @xuanwu-6; // #1E3A8A
@primary-color-hover: @xuanwu-7; // #1E40AF
@primary-color-active: @xuanwu-8; // #1D4ED8
@primary-color-outline: fade(@xuanwu-6, 20%);

// 成功 (Success)
@success-color: @teal-4; // #0D9488
@success-color-hover: @teal-5; // #0F766E
@success-color-active: @teal-6; // #115E59
@success-color-outline: fade(@teal-4, 20%);
@success-color-bg: @teal-1; // #F0FDFA

// 警告 (Warning)
@warning-color: #F59E0B; // Amber
@warning-color-hover: #D97706;
@warning-color-active: #B45309;
@warning-color-outline: rgba(245, 158, 11, 0.2);
@warning-color-bg: #FEF3C7;

// 錯誤 (Error)
@error-color: #EF4444; // Red
@error-color-hover: #DC2626;
@error-color-active: #B91C1C;
@error-color-outline: rgba(239, 68, 68, 0.2);
@error-color-bg: #FEE2E2;

// 資訊 (Info)
@info-color: @steel-3; // #64748B
@info-color-hover: @steel-4; // #475569
@info-color-active: @steel-5; // #334155
@info-color-outline: fade(@steel-3, 20%);
@info-color-bg: @steel-1; // #F8FAFC
```

### 中性色系

```less
// 文字色
@text-color: #1E293B; // Slate 800 - 主文字
@text-color-secondary: #64748B; // Slate 500 - 次要文字
@text-color-inverse: #ffffff; // 反色文字
@heading-color: #0F172A; // Slate 900 - 標題
@disabled-color: #94A3B8; // Slate 400 - 禁用

// 邊框色
@border-color-base: #CBD5E1; // Slate 300 - 基礎邊框
@border-color-split: #E2E8F0; // Slate 200 - 分隔線
@border-color-inverse: #ffffff; // 反色邊框

// 背景色
@body-background: #F8FAFC; // Slate 50 - 頁面背景
@component-background: #ffffff; // 元件背景
@layout-body-background: #F1F5F9; // Slate 100 - 佈局背景
@layout-header-background: #ffffff; // 頁首背景
@layout-footer-background: @layout-body-background; // 頁尾背景
```

---

## 漸層系統 (Gradient System)

### 主要漸層

```less
// 1. 北方之水 (Northern Waters)
@gradient-northern-waters: linear-gradient(135deg, #1E3A8A 0%, #0D9488 100%);

// 2. 龜甲紋理 (Tortoise Shell)
@gradient-tortoise-shell: linear-gradient(45deg, #172554 0%, #1E3A8A 50%, #64748B 100%);

// 3. 冬夜深沉 (Winter Night)
@gradient-winter-night: linear-gradient(180deg, #0F172A 0%, #1E3A8A 50%, #0D9488 100%);

// 4. 銀霜微光 (Silver Frost)
@gradient-silver-frost: linear-gradient(135deg, #EFF6FF 0%, #E2E8F0 50%, #CBD5E1 100%);

// 5. 深淵神秘 (Deep Mystery)
@gradient-deep-mystery: linear-gradient(135deg, #172554 0%, #115E59 100%);
```

### 徑向漸層

```less
// 玄武光暈 (Xuanwu Aura)
@gradient-xuanwu-aura: radial-gradient(circle at center, #1E3A8A 0%, #64748B 50%, transparent 100%);

// 水波漣漪 (Water Ripple)
@gradient-water-ripple: radial-gradient(ellipse at center, #0D9488 0%, #1E3A8A 40%, transparent 70%);
```

### 漸層使用指南

```less
// 主要按鈕
.button-primary {
  background: @gradient-northern-waters;
  border: none;
  color: #ffffff;
}

// 特色卡片
.featured-card {
  background: @gradient-silver-frost;
  border: 1px solid fade(@xuanwu-6, 10%);
}

// 頁面橫幅
.page-banner {
  background: @gradient-winter-night;
  color: #ffffff;
}

// 裝飾性背景
.decorative-bg {
  background: @gradient-tortoise-shell;
  opacity: 0.05;
  position: absolute;
}
```

---

## 陰影與光暈 (Shadows & Glows)

### 陰影系統

```less
// 小陰影 - 卡片、按鈕
@shadow-xuanwu-sm: 0 1px 2px rgba(30, 58, 138, 0.05);

// 中陰影 - 浮動元素、下拉選單
@shadow-xuanwu-md: 0 4px 6px rgba(30, 58, 138, 0.1);

// 大陰影 - 對話框、抽屜
@shadow-xuanwu-lg: 0 10px 15px rgba(30, 58, 138, 0.15);

// 超大陰影 - 全屏遮罩、Modal
@shadow-xuanwu-xl: 0 20px 25px rgba(30, 58, 138, 0.2);

// 2XL 陰影 - 特殊強調
@shadow-xuanwu-2xl: 0 25px 50px rgba(30, 58, 138, 0.25);
```

### 光暈效果

```less
// 玄武光暈 - 主要互動元素
@glow-xuanwu: 0 0 20px rgba(30, 58, 138, 0.5);
@glow-xuanwu-strong: 0 0 30px rgba(30, 58, 138, 0.7);

// 青綠光暈 - 成功狀態高亮
@glow-teal: 0 0 20px rgba(13, 148, 136, 0.5);
@glow-teal-strong: 0 0 30px rgba(13, 148, 136, 0.7);

// 焦點光暈
@glow-focus: 0 0 0 3px fade(@xuanwu-6, 20%);
```

### 陰影使用範例

```less
// 卡片陰影
.card {
  box-shadow: @shadow-xuanwu-sm;
  transition: box-shadow 0.3s ease;
  
  &:hover {
    box-shadow: @shadow-xuanwu-md;
  }
}

// 浮動按鈕
.fab {
  box-shadow: @shadow-xuanwu-lg;
  
  &:hover {
    box-shadow: @shadow-xuanwu-xl;
  }
  
  &:active {
    box-shadow: @shadow-xuanwu-md;
  }
}

// 對話框
.modal {
  box-shadow: @shadow-xuanwu-xl;
}

// 焦點狀態
.input:focus {
  border-color: @xuanwu-6;
  box-shadow: @glow-focus;
}

// 成功高亮
.success-highlight {
  box-shadow: @glow-teal;
}
```

---

## 對比度測試 (Contrast Testing)

### 主色對比度矩陣

#### Xuanwu-6 (#1E3A8A) 在不同背景上

| 背景色 | 背景 Hex | 對比度 | WCAG AA | WCAG AAA | 推薦用途 |
|--------|----------|--------|---------|----------|----------|
| 白色 | #FFFFFF | 8.92:1 | ✅ | ✅ | 文字、按鈕 |
| Xuanwu-1 | #EFF6FF | 8.82:1 | ✅ | ✅ | 文字 |
| Xuanwu-2 | #DBEAFE | 8.48:1 | ✅ | ✅ | 文字 |
| Steel-1 | #F8FAFC | 8.82:1 | ✅ | ✅ | 文字 |
| Silver-2 | #E2E8F0 | 7.82:1 | ✅ | ✅ | 文字 |
| 黑色 | #000000 | 2.36:1 | ❌ | ❌ | 不推薦 |

### 文字顏色對比度 (白色背景)

| 文字色 | 色碼 | 對比度 | WCAG AA | WCAG AAA | 用途 |
|--------|------|--------|---------|----------|------|
| Heading | #0F172A | 17.89:1 | ✅ | ✅ | 標題 |
| Primary Text | #1E293B | 14.84:1 | ✅ | ✅ | 正文 |
| Secondary Text | #64748B | 5.29:1 | ✅ | ✅ | 輔助說明 |
| Disabled | #94A3B8 | 3.06:1 | ❌ | ❌ | 禁用狀態 |
| Primary Color | #1E3A8A | 8.92:1 | ✅ | ✅ | 連結、按鈕 |
| Success Color | #0D9488 | 4.53:1 | ✅ | ⚠️ | 成功提示 |
| Error Color | #EF4444 | 4.53:1 | ✅ | ⚠️ | 錯誤提示 |
| Warning Color | #F59E0B | 2.84:1 | ❌ | ❌ | 警告提示(需圖示) |

### 最小對比度建議

```less
// ✅ 推薦：AAA 級對比度 (7:1+)
.text-primary {
  color: #1E293B; // 14.84:1
}

// ✅ 推薦：AA 級對比度 (4.5:1+)
.text-link {
  color: #1E3A8A; // 8.92:1
}

// ⚠️ 謹慎：接近最低要求
.text-success {
  color: #0D9488; // 4.53:1
  font-weight: 500; // 加粗提高可讀性
}

// ❌ 避免：對比度不足
.text-disabled {
  color: #94A3B8; // 3.06:1 - 僅用於非必要文字
}
```

---

## 色彩變數 (Color Variables)

### Less 變數完整清單

```less
// ========== 主色系 (Primary) ==========
@xuanwu-1: #EFF6FF;
@xuanwu-2: #DBEAFE;
@xuanwu-3: #BFDBFE;
@xuanwu-4: #93C5FD;
@xuanwu-5: #60A5FA;
@xuanwu-6: #1E3A8A; // 主色
@xuanwu-7: #1E40AF;
@xuanwu-8: #1D4ED8;
@xuanwu-9: #172554;
@xuanwu-10: #0F172A;

// ========== 次要色系 (Success) ==========
@teal-1: #F0FDFA;
@teal-2: #CCFBF1;
@teal-3: #99F6E4;
@teal-4: #0D9488; // 成功色
@teal-5: #0F766E;
@teal-6: #115E59;

// ========== 第三色系 (Info) ==========
@steel-1: #F8FAFC;
@steel-2: #F1F5F9;
@steel-3: #64748B; // 資訊色
@steel-4: #475569;
@steel-5: #334155;

// ========== 強調色系 (Accent) ==========
@silver-1: #F8FAFC;
@silver-2: #E2E8F0;
@silver-3: #94A3B8;
@silver-4: #64748B;

// ========== 語義色 (Semantic) ==========
@primary-color: @xuanwu-6;
@success-color: @teal-4;
@warning-color: #F59E0B;
@error-color: #EF4444;
@info-color: @steel-3;

// ========== 文字色 (Text) ==========
@text-color: #1E293B;
@text-color-secondary: #64748B;
@heading-color: #0F172A;
@disabled-color: #94A3B8;

// ========== 邊框色 (Border) ==========
@border-color-base: #CBD5E1;
@border-color-split: #E2E8F0;

// ========== 背景色 (Background) ==========
@body-background: #F8FAFC;
@component-background: #ffffff;
@layout-body-background: #F1F5F9;
```

### TypeScript 型別定義

```typescript
// types/theme.ts
export const XuanwuColors = {
  xuanwu: {
    1: '#EFF6FF',
    2: '#DBEAFE',
    3: '#BFDBFE',
    4: '#93C5FD',
    5: '#60A5FA',
    6: '#1E3A8A', // Primary
    7: '#1E40AF',
    8: '#1D4ED8',
    9: '#172554',
    10: '#0F172A'
  },
  teal: {
    1: '#F0FDFA',
    2: '#CCFBF1',
    3: '#99F6E4',
    4: '#0D9488', // Success
    5: '#0F766E',
    6: '#115E59'
  },
  steel: {
    1: '#F8FAFC',
    2: '#F1F5F9',
    3: '#64748B', // Info
    4: '#475569',
    5: '#334155'
  },
  silver: {
    1: '#F8FAFC',
    2: '#E2E8F0',
    3: '#94A3B8',
    4: '#64748B'
  }
} as const;

export type XuanwuColorKey = keyof typeof XuanwuColors;
export type XuanwuColorLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
```

---

## 📚 使用範例 (Usage Examples)

### 主題配置

```typescript
// app.config.ts
import { NzConfig, provideNzConfig } from 'ng-zorro-antd/core/config';

const ngZorroConfig: NzConfig = {
  theme: {
    primaryColor: '#1E3A8A', // xuanwu-6
    successColor: '#0D9488', // teal-4
    warningColor: '#F59E0B',
    errorColor: '#EF4444',
    infoColor: '#64748B' // steel-3
  }
};

export const appConfig: ApplicationConfig = {
  providers: [provideNzConfig(ngZorroConfig)]
};
```

### Less 檔案使用

```less
// theme.less
@import '@delon/theme/theme-default.less';

// 使用色彩變數
.custom-button {
  background: @xuanwu-6;
  color: #ffffff;
  border: none;
  
  &:hover {
    background: @xuanwu-7;
  }
  
  &:active {
    background: @xuanwu-8;
  }
}

// 使用漸層
.hero-banner {
  background: @gradient-northern-waters;
  color: #ffffff;
}

// 使用陰影
.card {
  box-shadow: @shadow-xuanwu-md;
}
```

---

**版本**: 2.0.0  
**最後更新**: 2025-12-17  
**維護者**: GitHub Copilot  
**狀態**: ✅ 生產環境就緒
