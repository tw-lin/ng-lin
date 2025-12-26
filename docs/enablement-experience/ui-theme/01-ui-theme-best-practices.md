# 玄武主題最佳實踐
# Xuanwu Theme Best Practices

> **設計與開發準則 - 專業、耐看、高級、穩定、內斂**

## 📖 目錄

1. [設計準則](#設計準則)
2. [開發準則](#開發準則)
3. [效能優化](#效能優化)
4. [無障礙性](#無障礙性)
5. [響應式設計](#響應式設計)
6. [程式碼品質](#程式碼品質)

---

## 設計準則

### ✅ 推薦做法 (Do's)

#### 1. 使用一致的色彩系統

```less
// ✅ 推薦：使用主題變數
.button {
  background: @xuanwu-6;
  color: #ffffff;
  border: none;
}

// ❌ 避免：硬編碼顏色
.button {
  background: #1E3A8A; // 難以維護
  color: white;
}
```

**理由**：
- 方便主題切換
- 統一色彩管理
- 易於維護更新

#### 2. 適度使用漸層

```less
// ✅ 推薦：重點使用
.hero-banner {
  background: @gradient-northern-waters;
}

.regular-card {
  background: @component-background; // 純色
}

// ❌ 避免：到處都是漸層
.everything-gradient {
  .header { background: linear-gradient(...); }
  .content { background: linear-gradient(...); }
  .footer { background: linear-gradient(...); }
}
```

**建議**：
- 每個視圖限制 1-2 個漸層
- 保留給重要元素
- 行動裝置簡化漸層

#### 3. 保持視覺層次

```less
// ✅ 推薦：使用陰影建立層次
.layer-1 {
  box-shadow: @shadow-xuanwu-sm; // 基礎層
}

.layer-2 {
  box-shadow: @shadow-xuanwu-md; // 浮動層
  z-index: 10;
}

.layer-3 {
  box-shadow: @shadow-xuanwu-lg; // 對話框層
  z-index: 1000;
}
```

#### 4. 注重細節質感

```less
// ✅ 推薦：統一圓角
.card {
  border-radius: 8px; // 標準圓角
}

.button {
  border-radius: 4px; // 較小圓角
}

// ✅ 推薦：統一過渡
.interactive-element {
  transition: all @transition-base;
}
```

### ❌ 應避免 (Don'ts)

#### 1. 不過度使用色彩

```less
// ❌ 避免：色彩混亂
.chaos {
  background: @xuanwu-6;
  border: 2px solid @teal-4;
  color: @steel-3;
  box-shadow: 0 0 10px @error-color;
}

// ✅ 推薦：色彩和諧
.harmony {
  background: @xuanwu-6;
  border: none;
  color: #ffffff;
  box-shadow: @shadow-xuanwu-md;
}
```

#### 2. 不忽略對比度

```less
// ❌ 避免：對比度不足
.low-contrast {
  color: @xuanwu-4; // 2:1 對比度
  background: #ffffff;
}

// ✅ 推薦：確保對比度
.high-contrast {
  color: @xuanwu-8; // 4.76:1 對比度
  background: #ffffff;
}
```

#### 3. 不使用純黑

```less
// ❌ 避免
.text {
  color: #000000; // 過於刺眼
}

// ✅ 推薦
.text {
  color: @heading-color; // #0F172A 更柔和
}
```

#### 4. 不混合太多風格

```less
// ❌ 避免：風格不一致
.inconsistent {
  .card-1 {
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .card-2 {
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
}

// ✅ 推薦：統一風格
.consistent {
  .card {
    border-radius: 8px;
    box-shadow: @shadow-xuanwu-md;
  }
}
```

---

## 開發準則

### TypeScript 最佳實踐

#### 1. 型別安全的顏色管理

```typescript
// ✅ 推薦：使用常數與型別
export const XuanwuColors = {
  primary: '#1E3A8A',
  success: '#0D9488',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#64748B'
} as const;

export type XuanwuColorKey = keyof typeof XuanwuColors;

// 使用範例
const getPrimaryColor = (): string => XuanwuColors.primary;
```

#### 2. 主題服務封裝

```typescript
// ✅ 推薦：建立主題服務
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private nzConfigService = inject(NzConfigService);
  
  private currentTheme = signal<string>('xuanwu');
  
  switchTheme(themeName: string): void {
    this.nzConfigService.set('theme', {
      primaryColor: this.getThemeConfig(themeName).primaryColor
    });
    this.currentTheme.set(themeName);
  }
  
  private getThemeConfig(name: string): ThemeConfig {
    // 主題配置邏輯
  }
}
```

### Less 最佳實踐

#### 1. 使用變數而非硬編碼

```less
// ✅ 推薦
.card {
  background: @component-background;
  border: 1px solid @border-color-base;
  box-shadow: @shadow-xuanwu-md;
  border-radius: 8px;
  padding: 24px;
}

// ❌ 避免
.card {
  background: white;
  border: 1px solid #e0e0e0;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  border-radius: 8px;
  padding: 24px;
}
```

#### 2. 建立可重用的 Mixin

```less
// ✅ 推薦：定義 mixin
.hover-lift() {
  transition: all @transition-base;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: @shadow-xuanwu-lg;
  }
}

// 使用 mixin
.card {
  .hover-lift();
  background: @component-background;
}
```

#### 3. 組織樣式結構

```less
// ✅ 推薦：結構化樣式
.component {
  // 定位
  position: relative;
  display: flex;
  
  // 盒模型
  width: 100%;
  padding: 16px;
  margin-bottom: 16px;
  
  // 外觀
  background: @component-background;
  border: 1px solid @border-color-base;
  border-radius: 8px;
  
  // 文字
  color: @text-color;
  font-size: 14px;
  
  // 其他
  transition: all @transition-base;
  
  // 巢狀元素
  .component__header {
    font-weight: 600;
  }
  
  // 偽類
  &:hover {
    box-shadow: @shadow-xuanwu-md;
  }
  
  // 修飾符
  &--large {
    padding: 24px;
  }
}
```

---

## 效能優化

### 1. 減少 CSS 檔案大小

```less
// ✅ 推薦：合併相似樣式
.card-base {
  border-radius: 8px;
  box-shadow: @shadow-xuanwu-sm;
  background: @component-background;
}

.card-sm {
  .card-base();
  padding: 12px;
}

.card-md {
  .card-base();
  padding: 16px;
}

.card-lg {
  .card-base();
  padding: 24px;
}
```

### 2. 優化動畫效能

```less
// ✅ 推薦：使用 transform (GPU 加速)
.button {
  transition: transform @transition-fast;
  
  &:hover {
    transform: translateY(-2px);
  }
}

// ❌ 避免：使用 margin/top (重排)
.button {
  transition: margin-top @transition-fast;
  
  &:hover {
    margin-top: -2px;
  }
}
```

### 3. 減少重繪

```less
// ✅ 推薦：使用 will-change
.animated-element {
  will-change: transform, opacity;
  transition: all @transition-base;
}

// 使用後移除
.animated-element.animated {
  will-change: auto;
}
```

### 4. 延遲載入

```typescript
// ✅ 推薦：懶載入路由
export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => 
      import('./dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
  }
];
```

---

## 無障礙性

### 1. 確保鍵盤導航

```less
// ✅ 推薦：清晰的焦點樣式
*:focus-visible {
  outline: 2px solid @xuanwu-6;
  outline-offset: 2px;
}

button:focus-visible {
  box-shadow: 0 0 0 3px fade(@xuanwu-6, 20%);
}

// 移除預設 outline
*:focus:not(:focus-visible) {
  outline: none;
}
```

### 2. 提供替代文字

```html
<!-- ✅ 推薦：圖示 + 文字 -->
<button nz-button>
  <span nz-icon nzType="save"></span>
  <span>儲存</span>
</button>

<!-- ✅ 推薦：僅圖示時提供 aria-label -->
<button nz-button aria-label="儲存">
  <span nz-icon nzType="save"></span>
</button>

<!-- ❌ 避免：僅圖示無文字 -->
<button nz-button>
  <span nz-icon nzType="save"></span>
</button>
```

### 3. 使用語義化 HTML

```html
<!-- ✅ 推薦 -->
<nav aria-label="主導航">
  <ul>
    <li><a href="/">首頁</a></li>
    <li><a href="/about">關於</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>文章標題</h1>
    <p>內容...</p>
  </article>
</main>

<!-- ❌ 避免 -->
<div class="navigation">
  <div class="nav-item">首頁</div>
  <div class="nav-item">關於</div>
</div>
```

### 4. 確保色彩對比

```less
// ✅ 推薦：高對比度
.text-primary {
  color: @text-color; // 14.8:1 (AAA)
}

.text-link {
  color: @xuanwu-6; // 8.9:1 (AAA)
}

// ⚠️ 謹慎：接近最低要求
.text-success {
  color: @success-color; // 4.53:1 (AA)
  font-weight: 500; // 加粗提高可讀性
}
```

---

## 響應式設計

### 斷點系統

```less
// 定義斷點變數
@screen-xs: 480px;
@screen-sm: 576px;
@screen-md: 768px;
@screen-lg: 992px;
@screen-xl: 1200px;
@screen-xxl: 1600px;
```

### 行動優先

```less
// ✅ 推薦：從小螢幕開始設計
.container {
  // 預設 (行動)
  padding: 12px;
  font-size: 14px;
  
  // 平板
  @media (min-width: @screen-md) {
    padding: 16px;
    font-size: 15px;
  }
  
  // 桌面
  @media (min-width: @screen-lg) {
    padding: 24px;
    font-size: 16px;
  }
  
  // 大螢幕
  @media (min-width: @screen-xl) {
    padding: 32px;
  }
}
```

### 簡化行動裝置樣式

```less
// ✅ 推薦：行動裝置簡化
.hero-banner {
  background: @gradient-northern-waters;
  
  @media (max-width: @screen-sm) {
    // 行動裝置使用純色，提升效能
    background: @xuanwu-6;
  }
}

.card {
  box-shadow: @shadow-xuanwu-lg;
  
  @media (max-width: @screen-sm) {
    // 簡化陰影
    box-shadow: @shadow-xuanwu-sm;
  }
}
```

---

## 程式碼品質

### 1. 命名慣例

```less
// ✅ 推薦：BEM 命名法
.card {
  &__header {
    font-weight: 600;
  }
  
  &__body {
    padding: 16px;
  }
  
  &__footer {
    border-top: 1px solid @border-color-split;
  }
  
  &--large {
    padding: 24px;
  }
  
  &--featured {
    background: @gradient-northern-waters;
  }
}
```

### 2. 註解規範

```less
// ✅ 推薦：清晰的註解
/**
 * 卡片元件基礎樣式
 * 用於資料展示與內容容器
 */
.card {
  // 佈局
  display: flex;
  flex-direction: column;
  
  // 外觀
  background: @component-background;
  border-radius: 8px;
  box-shadow: @shadow-xuanwu-md;
  
  // 互動效果
  transition: all @transition-base;
}
```

### 3. 避免過度巢狀

```less
// ❌ 避免：過度巢狀
.nav {
  .nav-list {
    .nav-item {
      .nav-link {
        .nav-icon {
          // 太深了！
        }
      }
    }
  }
}

// ✅ 推薦：扁平化
.nav-list {
  // 樣式
}

.nav-item {
  // 樣式
}

.nav-link {
  // 樣式
}

.nav-icon {
  // 樣式
}
```

---

## 📚 總結

### 核心原則

1. **專業性**: 使用深沉穩重的色調，保持視覺層次清晰
2. **耐看性**: 經典配色不易過時，適度使用漸層與效果
3. **高級感**: 精緻的陰影系統，流暢的過渡動畫
4. **穩定性**: 一致的設計語言，可預測的互動模式
5. **內斂性**: 適度留白，克制的色彩使用

### 快速檢查清單

- [ ] 使用主題變數而非硬編碼
- [ ] 保持色彩對比度 ≥ 4.5:1
- [ ] 適度使用漸層 (1-2 個/視圖)
- [ ] 確保鍵盤可訪問性
- [ ] 使用語義化 HTML
- [ ] 優化動畫效能
- [ ] 實現響應式設計
- [ ] 保持程式碼整潔

---

**版本**: 2.0.0  
**最後更新**: 2025-12-17  
**維護者**: GitHub Copilot  
**狀態**: ✅ 生產環境就緒
