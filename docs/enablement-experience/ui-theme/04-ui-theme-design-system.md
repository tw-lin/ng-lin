# GigHub 玄武主題設計系統
# GigHub Xuanwu Theme Design System

> **專業、耐看、高級、穩定、內斂、玄武**  
> **Professional, Elegant, Premium, Stable, Restrained, Xuanwu**

## 📚 文件導覽 (Documentation Navigation)

### 核心文件 (Core Documents)

1. **[玄武主題指南](./XUANWU_THEME.md)** - 完整主題規範與使用指南
   - Theme philosophy and symbolism
   - Complete color palette
   - Design principles
   - Usage guidelines

2. **[色彩系統](./COLOR_SYSTEM.md)** - 詳細配色規範
   - 10-level color scales
   - Semantic colors
   - Gradient system
   - Accessibility compliance

3. **[實施指南](./IMPLEMENTATION_GUIDE.md)** - 技術實作方法
   - Runtime configuration
   - Compile-time setup
   - Dynamic theme switching
   - Code examples

4. **[元件主題化](./COMPONENTS.md)** - 元件層級樣式指南
   - Button styles
   - Form components
   - Tables and lists
   - Navigation elements

5. **[最佳實踐](./BEST_PRACTICES.md)** - 設計與開發準則
   - Do's and Don'ts
   - Performance optimization
   - Accessibility guidelines
   - Responsive design

6. **[遷移指南](./MIGRATION.md)** - 從其他主題遷移
   - From Azure Dragon theme
   - Breaking changes
   - Migration checklist
   - Troubleshooting

7. **[測試清單](./TESTING.md)** - 品質保證檢查項目
   - Visual testing
   - Accessibility testing
   - Browser compatibility
   - Performance metrics

## 🎨 快速開始 (Quick Start)

### 主題配置 (Theme Configuration)

```typescript
// src/app/app.config.ts
import { NzConfig, provideNzConfig } from 'ng-zorro-antd/core/config';

const ngZorroConfig: NzConfig = {
  theme: {
    primaryColor: '#1E3A8A',    // 玄武深藍 (Xuanwu Navy)
    successColor: '#0D9488',    // 深青綠 (Deep Teal)
    warningColor: '#F59E0B',    // 琥珀黃 (Amber)
    errorColor: '#EF4444',      // 赤紅 (Crimson)
    infoColor: '#64748B'        // 鋼藍 (Steel Blue)
  }
};
```

### 核心色彩 (Core Colors)

| 用途 | 色碼 | 描述 |
|------|------|------|
| **主色 (Primary)** | `#1E3A8A` | 玄武深藍 - 穩定專業 |
| **成功 (Success)** | `#0D9488` | 深青綠 - 流動生命 |
| **警告 (Warning)** | `#F59E0B` | 琥珀黃 - 溫和提示 |
| **錯誤 (Error)** | `#EF4444` | 赤紅 - 明確警示 |
| **資訊 (Info)** | `#64748B` | 鋼藍 - 清晰智慧 |

## 🐢 玄武象徵意義 (Xuanwu Symbolism)

玄武，中國四象之一，代表北方守護神：

- **穩定性** (Stability): 龜甲提供堅不可摧的保護
- **智慧** (Wisdom): 千萬年累積的深邃知識
- **耐力** (Endurance): 穿越嚴寒冬季的堅韌
- **深度** (Depth): 水與夜的深奧奧祕
- **守護** (Protection): 北方的守護神

### 設計特徵 (Design Characteristics)

- **顏色**: 深藍、暗藍、青綠、銀灰、近黑
- **元素**: 水波紋、龜甲紋理、北方星辰
- **感受**: 穩定、專業、值得信賴、深沉、沉靜

## 🎯 設計原則 (Design Principles)

### 1. 專業性 (Professionalism)
- 使用深沉、穩重的色調
- 避免過於花俏的裝飾
- 保持視覺層次清晰

### 2. 耐看性 (Longevity)
- 經典配色不易過時
- 適度使用漸層與效果
- 注重細節質感

### 3. 高級感 (Premium Feel)
- 精緻的陰影系統
- 流暢的過渡動畫
- 高品質的視覺呈現

### 4. 穩定性 (Stability)
- 一致的設計語言
- 可預測的互動模式
- 穩固的視覺基礎

### 5. 內斂性 (Restraint)
- 適度留白
- 克制的色彩使用
- 低調的品牌呈現

## 📊 版本資訊 (Version Information)

- **主題版本**: 2.0.0
- **最後更新**: 2025-12-17
- **相容性**: Angular 20+, ng-zorro-antd 20+, ng-alain 20+
- **狀態**: ✅ 生產環境就緒

## 🔗 相關資源 (Related Resources)

### 官方文檔
- [ng-zorro-antd 主題化](https://ng.ant.design/docs/customize-theme/zh)
- [ng-alain 主題系統](https://ng-alain.com/theme/getting-started/zh)
- [Ant Design 色彩系統](https://ant.design/docs/spec/colors-cn)

### 設計工具
- [色彩對比檢查器](https://webaim.org/resources/contrastchecker/)
- [WCAG 無障礙指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [漸層生成器](https://cssgradient.io/)

## 📝 更新日誌 (Changelog)

### v2.0.0 (2025-12-17)
- ✅ 建立完整的玄武主題設計文件
- ✅ 定義 10 級色彩系統
- ✅ 制定漸層與陰影規範
- ✅ 編寫實施與測試指南
- ✅ 提供元件主題化範例

---

**維護者**: GitHub Copilot  
**專案**: GigHub  
**主題**: 玄武 (Xuanwu / Black Tortoise)
