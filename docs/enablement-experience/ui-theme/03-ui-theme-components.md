# 玄武主題元件樣式指南
# Xuanwu Theme Component Styling Guide

> **元件層級樣式規範與範例**

## 📖 目錄 (Table of Contents)

1. [按鈕元件](#按鈕元件-buttons)
2. [表單元件](#表單元件-forms)
3. [表格與列表](#表格與列表-tables--lists)
4. [導航元件](#導航元件-navigation)
5. [回饋元件](#回饋元件-feedback)
6. [資料展示](#資料展示-data-display)

---

## 按鈕元件 (Buttons)

### 主要按鈕 (Primary Button)

```html
<button nz-button nzType="primary">主要操作</button>
<button nz-button nzType="primary" nzSize="large">大型按鈕</button>
<button nz-button nzType="primary" nzSize="small">小型按鈕</button>
```

#### 樣式定義

```less
.ant-btn-primary {
  background: @xuanwu-6;
  border-color: @xuanwu-6;
  color: #ffffff;
  
  &:hover {
    background: @xuanwu-7;
    border-color: @xuanwu-7;
  }
  
  &:active {
    background: @xuanwu-8;
    border-color: @xuanwu-8;
  }
  
  &[disabled] {
    background: @xuanwu-4;
    border-color: @xuanwu-4;
    color: fade(#ffffff, 50%);
  }
}

// 漸層樣式（特色按鈕）
.ant-btn-primary.featured-button {
  background: @gradient-northern-waters;
  border: none;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }
}
```

### 次要按鈕 (Default Button)

```html
<button nz-button>次要操作</button>
<button nz-button nzType="dashed">虛線按鈕</button>
<button nz-button nzType="link">連結按鈕</button>
<button nz-button nzType="text">文字按鈕</button>
```

#### 樣式定義

```less
.ant-btn-default {
  border-color: @xuanwu-6;
  color: @xuanwu-6;
  background: transparent;
  
  &:hover {
    border-color: @xuanwu-7;
    color: @xuanwu-7;
    background: @xuanwu-1;
  }
  
  &:active {
    border-color: @xuanwu-8;
    color: @xuanwu-8;
  }
}
```

### 危險按鈕 (Danger Button)

```html
<button nz-button nzType="primary" nzDanger>刪除</button>
<button nz-button nzDanger>取消</button>
```

#### 樣式定義

```less
.ant-btn-dangerous {
  &.ant-btn-primary {
    background: @error-color;
    border-color: @error-color;
    
    &:hover {
      background: @error-color-hover;
      border-color: @error-color-hover;
    }
  }
  
  &.ant-btn-default {
    border-color: @error-color;
    color: @error-color;
    
    &:hover {
      border-color: @error-color-hover;
      color: @error-color-hover;
      background: @error-color-bg;
    }
  }
}
```

---

## 表單元件 (Forms)

### 輸入框 (Input)

```html
<input nz-input placeholder="請輸入內容" />
<input nz-input placeholder="禁用狀態" [disabled]="true" />
```

#### 樣式定義

```less
.ant-input {
  border-color: @border-color-base;
  border-radius: 4px;
  
  &:hover {
    border-color: @xuanwu-5;
  }
  
  &:focus,
  &.ant-input-focused {
    border-color: @xuanwu-6;
    box-shadow: 0 0 0 2px fade(@xuanwu-6, 20%);
    outline: none;
  }
  
  &[disabled] {
    background: @silver-1;
    color: @disabled-color;
    border-color: @border-color-split;
  }
}

// 輸入群組
.ant-input-group {
  .ant-input-group-addon {
    background: @silver-1;
    border-color: @border-color-base;
    color: @text-color-secondary;
  }
}
```

### 選擇器 (Select)

```html
<nz-select [(ngModel)]="selectedValue" nzPlaceHolder="請選擇">
  <nz-option nzValue="option1" nzLabel="選項 1"></nz-option>
  <nz-option nzValue="option2" nzLabel="選項 2"></nz-option>
</nz-select>
```

#### 樣式定義

```less
.ant-select {
  .ant-select-selector {
    border-color: @border-color-base;
    
    &:hover {
      border-color: @xuanwu-5;
    }
  }
  
  &.ant-select-focused {
    .ant-select-selector {
      border-color: @xuanwu-6;
      box-shadow: 0 0 0 2px fade(@xuanwu-6, 20%);
    }
  }
}

// 下拉選單
.ant-select-dropdown {
  box-shadow: @shadow-xuanwu-lg;
  border-radius: 4px;
  
  .ant-select-item {
    &:hover {
      background: @xuanwu-1;
    }
    
    &.ant-select-item-option-selected {
      background: @xuanwu-2;
      color: @xuanwu-6;
      font-weight: 600;
    }
  }
}
```

### 複選框 (Checkbox)

```html
<label nz-checkbox [(ngModel)]="checked">同意條款</label>
<nz-checkbox-group [(ngModel)]="checkOptions"></nz-checkbox-group>
```

#### 樣式定義

```less
.ant-checkbox-wrapper {
  .ant-checkbox {
    .ant-checkbox-inner {
      border-color: @border-color-base;
      border-radius: 2px;
    }
    
    &:hover .ant-checkbox-inner {
      border-color: @xuanwu-6;
    }
    
    &.ant-checkbox-checked {
      .ant-checkbox-inner {
        background: @xuanwu-6;
        border-color: @xuanwu-6;
        
        &::after {
          border-color: #ffffff;
        }
      }
      
      &::after {
        border-color: @xuanwu-6;
      }
    }
  }
}
```

---

## 表格與列表 (Tables & Lists)

### 表格 (Table)

```html
<nz-table [nzData]="dataList" [nzPageSize]="10">
  <thead>
    <tr>
      <th>姓名</th>
      <th>年齡</th>
      <th>地址</th>
      <th>操作</th>
    </tr>
  </thead>
  <tbody>
    <tr *ngFor="let data of dataList">
      <td>{{ data.name }}</td>
      <td>{{ data.age }}</td>
      <td>{{ data.address }}</td>
      <td>
        <button nz-button nzType="link">編輯</button>
        <button nz-button nzType="link" nzDanger>刪除</button>
      </td>
    </tr>
  </tbody>
</nz-table>
```

#### 樣式定義

```less
.ant-table {
  background: @component-background;
  border-radius: 8px;
  
  .ant-table-thead > tr > th {
    background: @gradient-silver-frost;
    color: @xuanwu-7;
    font-weight: 600;
    border-bottom: 2px solid @border-color-split;
  }
  
  .ant-table-tbody > tr {
    &:hover > td {
      background: fade(@xuanwu-1, 80%);
    }
    
    &.ant-table-row-selected > td {
      background: fade(@xuanwu-2, 90%);
    }
  }
  
  .ant-table-pagination {
    margin: 16px 0;
  }
}
```

---

## 導航元件 (Navigation)

### 選單 (Menu)

```html
<ul nz-menu nzMode="inline">
  <li nz-menu-item nzSelected>
    <span nz-icon nzType="home"></span>
    <span>首頁</span>
  </li>
  <li nz-menu-item>
    <span nz-icon nzType="user"></span>
    <span>用戶管理</span>
  </li>
</ul>
```

#### 樣式定義

```less
.ant-menu {
  &.ant-menu-inline {
    border-right: none;
  }
  
  .ant-menu-item {
    &:hover {
      background: @xuanwu-1;
      color: @xuanwu-6;
    }
    
    &.ant-menu-item-selected {
      background: @xuanwu-1;
      color: @xuanwu-6;
      font-weight: 500;
      
      &::after {
        border-right-color: @xuanwu-6;
        border-right-width: 3px;
      }
    }
  }
}
```

---

## 回饋元件 (Feedback)

### 警告提示 (Alert)

```html
<nz-alert nzType="success" nzMessage="操作成功" nzShowIcon></nz-alert>
<nz-alert nzType="error" nzMessage="操作失敗" nzShowIcon></nz-alert>
<nz-alert nzType="warning" nzMessage="請注意" nzShowIcon></nz-alert>
<nz-alert nzType="info" nzMessage="提示資訊" nzShowIcon></nz-alert>
```

#### 樣式定義

```less
.ant-alert {
  border-radius: 4px;
  
  &.ant-alert-success {
    background: @success-color-bg;
    border-left: 3px solid @success-color;
  }
  
  &.ant-alert-error {
    background: @error-color-bg;
    border-left: 3px solid @error-color;
  }
  
  &.ant-alert-warning {
    background: @warning-color-bg;
    border-left: 3px solid @warning-color;
  }
  
  &.ant-alert-info {
    background: @info-color-bg;
    border-left: 3px solid @info-color;
  }
}
```

---

## 資料展示 (Data Display)

### 卡片 (Card)

```html
<nz-card nzTitle="卡片標題">
  <p>卡片內容</p>
</nz-card>
```

#### 樣式定義

```less
.ant-card {
  border-radius: 8px;
  box-shadow: @shadow-xuanwu-sm;
  border: 1px solid @border-color-split;
  transition: all @transition-base;
  
  &:hover {
    box-shadow: @shadow-xuanwu-md;
    transform: translateY(-2px);
  }
  
  .ant-card-head {
    background: @gradient-silver-frost;
    border-bottom: 1px solid @border-color-split;
    
    .ant-card-head-title {
      color: @xuanwu-7;
      font-weight: 600;
    }
  }
}
```

---

**版本**: 2.0.0  
**最後更新**: 2025-12-17  
**維護者**: GitHub Copilot  
**狀態**: ✅ 生產環境就緒
