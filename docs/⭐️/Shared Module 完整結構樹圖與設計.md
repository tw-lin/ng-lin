## Shared Module 完整結構樹圖與設計

```
src/app/shared/
├── components/                          # 通用 UI 組件
│   ├── data-table/                      # 通用表格組件
│   │   ├── data-table.component.ts
│   │   ├── data-table.component.html
│   │   ├── data-table.component.less
│   │   ├── models/
│   │   │   ├── column-definition.model.ts     # 欄位定義
│   │   │   ├── table-config.model.ts          # 表格配置
│   │   │   ├── filter-config.model.ts         # 篩選配置
│   │   │   ├── sort-config.model.ts           # 排序配置
│   │   │   └── pagination-config.model.ts     # 分頁配置
│   │   ├── components/
│   │   │   ├── column-filter/                 # 欄位篩選器
│   │   │   │   ├── text-filter.component.ts
│   │   │   │   ├── date-filter.component.ts
│   │   │   │   ├── select-filter.component.ts
│   │   │   │   └── range-filter.component.ts
│   │   │   ├── bulk-actions/                  # 批次操作
│   │   │   │   └── bulk-actions.component.ts
│   │   │   ├── column-settings/               # 欄位顯示設定
│   │   │   │   └── column-settings.component.ts
│   │   │   └── export-menu/                   # 導出選單
│   │   │       └── export-menu.component.ts
│   │   ├── services/
│   │   │   ├── table-state.service.ts         # 表格狀態管理
│   │   │   └── table-export.service.ts        # 導出服務 (CSV/Excel)
│   │   └── pipes/
│   │       └── table-cell-renderer.pipe.ts    # 自訂單元格渲染
│   │
│   ├── avatar/                          # 用戶頭像組件
│   │   ├── avatar.component.ts
│   │   ├── avatar.component.html
│   │   ├── avatar.component.less
│   │   ├── avatar-group.component.ts          # 頭像組 (+99)
│   │   ├── avatar-group.component.html
│   │   ├── models/
│   │   │   ├── avatar-size.enum.ts            # small/default/large/xlarge
│   │   │   ├── avatar-shape.enum.ts           # circle/square
│   │   │   └── avatar-status.enum.ts          # online/offline/busy/away
│   │   ├── services/
│   │   │   └── avatar-generator.service.ts    # 初始頭像生成 (Initials)
│   │   ├── pipes/
│   │   │   └── avatar-url.pipe.ts             # Firebase Storage URL 處理
│   │   └── directives/
│   │       └── avatar-tooltip.directive.ts    # Hover 顯示用戶資訊
│   │
│   ├── tag-selector/                    # 標籤選擇器
│   │   ├── tag-selector.component.ts
│   │   ├── tag-selector.component.html
│   │   ├── tag-selector.component.less
│   │   ├── models/
│   │   │   ├── tag.model.ts                   # 標籤模型
│   │   │   ├── tag-group.model.ts             # 標籤分組
│   │   │   └── tag-selection-mode.enum.ts     # single/multiple
│   │   ├── components/
│   │   │   ├── tag-input/                     # 標籤輸入框
│   │   │   │   └── tag-input.component.ts
│   │   │   ├── tag-dropdown/                  # 下拉選擇器
│   │   │   │   └── tag-dropdown.component.ts
│   │   │   ├── tag-create-modal/              # 建立標籤彈窗
│   │   │   │   └── tag-create-modal.component.ts
│   │   │   └── tag-color-picker/              # 顏色選擇器
│   │   │       └── tag-color-picker.component.ts
│   │   ├── services/
│   │   │   ├── tag.service.ts                 # 標籤 CRUD
│   │   │   └── tag-suggestion.service.ts      # 智能建議
│   │   └── pipes/
│   │       └── tag-color.pipe.ts              # 標籤顏色計算
│   │
│   ├── markdown-editor/                 # Markdown 編輯器 (Tinymce 封裝)
│   │   ├── markdown-editor.component.ts
│   │   ├── markdown-editor.component.html
│   │   ├── markdown-editor.component.less
│   │   ├── models/
│   │   │   ├── editor-config.model.ts         # 編輯器配置
│   │   │   ├── toolbar-config.model.ts        # 工具列配置
│   │   │   └── plugin-config.model.ts         # 插件配置
│   │   ├── components/
│   │   │   ├── image-upload/                  # 圖片上傳處理
│   │   │   │   └── image-upload.component.ts
│   │   │   ├── mention-picker/                # @mention 選擇器
│   │   │   │   └── mention-picker.component.ts
│   │   │   ├── emoji-picker/                  # Emoji 選擇器
│   │   │   │   └── emoji-picker.component.ts
│   │   │   └── preview-panel/                 # 預覽面板
│   │   │       └── preview-panel.component.ts
│   │   ├── services/
│   │   │   ├── tinymce-adapter.service.ts     # Tinymce 適配器
│   │   │   ├── markdown-parser.service.ts     # Markdown 解析
│   │   │   ├── image-handler.service.ts       # 圖片處理 (壓縮/上傳)
│   │   │   └── mention-resolver.service.ts    # @mention 解析
│   │   ├── plugins/
│   │   │   ├── code-highlight/                # 程式碼高亮
│   │   │   ├── table-editor/                  # 表格編輯
│   │   │   └── file-attachment/               # 檔案附件
│   │   └── pipes/
│   │       └── markdown-to-html.pipe.ts       # Markdown 轉 HTML
│   │
│   ├── permission-badge/                # 權限徽章
│   │   ├── permission-badge.component.ts
│   │   ├── permission-badge.component.html
│   │   ├── permission-badge.component.less
│   │   ├── role-badge.component.ts            # 角色徽章
│   │   ├── role-badge.component.html
│   │   ├── models/
│   │   │   ├── badge-style.enum.ts            # 徽章樣式
│   │   │   ├── badge-size.enum.ts             # 徽章大小
│   │   │   └── permission-display.model.ts
│   │   ├── services/
│   │   │   ├── badge-color.service.ts         # 徽章顏色映射
│   │   │   └── permission-formatter.service.ts # 權限格式化
│   │   └── pipes/
│   │       ├── permission-label.pipe.ts       # repo:write → "可寫入"
│   │       └── role-color.pipe.ts             # owner → 'red'
│   │
│   ├── tenant-selector/                 # 租戶切換器
│   │   ├── tenant-selector.component.ts
│   │   ├── tenant-selector.component.html
│   │   ├── tenant-selector.component.less
│   │   ├── models/
│   │   │   ├── tenant-display.model.ts        # 顯示模型
│   │   │   └── tenant-switch-result.model.ts
│   │   ├── components/
│   │   │   ├── tenant-dropdown/               # 下拉選單
│   │   │   │   └── tenant-dropdown.component.ts
│   │   │   ├── tenant-search/                 # 搜尋框
│   │   │   │   └── tenant-search.component.ts
│   │   │   ├── create-tenant-quick/           # 快速建立租戶
│   │   │   │   └── create-tenant-quick.component.ts
│   │   │   └── tenant-list-item/              # 租戶列表項
│   │   │       └── tenant-list-item.component.ts
│   │   ├── services/
│   │   │   ├── tenant-switcher.service.ts     # 切換邏輯
│   │   │   └── tenant-cache.service.ts        # 租戶列表緩存
│   │   └── pipes/
│   │       └── tenant-role.pipe.ts            # 顯示用戶在該租戶的角色
│   │
│   ├── empty-state/                     # 空狀態組件
│   │   ├── empty-state.component.ts
│   │   ├── empty-state.component.html
│   │   ├── empty-state.component.less
│   │   ├── models/
│   │   │   ├── empty-state-type.enum.ts       # no-data/error/no-permission
│   │   │   └── empty-state-config.model.ts
│   │   ├── templates/                         # 預定義模板
│   │   │   ├── no-repositories.template.ts    # 無儲存庫
│   │   │   ├── no-issues.template.ts          # 無 Issue
│   │   │   ├── no-results.template.ts         # 無搜尋結果
│   │   │   └── error-state.template.ts        # 錯誤狀態
│   │   └── services/
│   │       └── illustration.service.ts        # SVG 插圖服務
│   │
│   ├── loading-skeleton/                # 骨架屏組件
│   │   ├── skeleton.component.ts
│   │   ├── skeleton.component.html
│   │   ├── skeleton.component.less
│   │   ├── presets/                           # 預設骨架屏
│   │   │   ├── card-skeleton.component.ts
│   │   │   ├── list-skeleton.component.ts
│   │   │   └── table-skeleton.component.ts
│   │   └── models/
│   │       └── skeleton-config.model.ts
│   │
│   ├── breadcrumb/                      # 麵包屑導航
│   │   ├── breadcrumb.component.ts
│   │   ├── breadcrumb.component.html
│   │   ├── breadcrumb.component.less
│   │   ├── services/
│   │   │   └── breadcrumb.service.ts          # 動態生成麵包屑
│   │   └── models/
│   │       └── breadcrumb-item.model.ts
│   │
│   ├── status-indicator/                # 狀態指示器
│   │   ├── status-indicator.component.ts
│   │   ├── status-indicator.component.html
│   │   ├── status-indicator.component.less
│   │   └── models/
│   │       └── status.enum.ts                 # success/warning/error/info
│   │
│   ├── confirmation-dialog/             # 確認對話框
│   │   ├── confirmation-dialog.component.ts
│   │   ├── confirmation-dialog.component.html
│   │   ├── confirmation-dialog.component.less
│   │   ├── services/
│   │   │   └── confirmation.service.ts        # 程式化呼叫
│   │   └── models/
│   │       └── confirmation-config.model.ts
│   │
│   ├── file-upload/                     # 檔案上傳
│   │   ├── file-upload.component.ts
│   │   ├── file-upload.component.html
│   │   ├── file-upload.component.less
│   │   ├── components/
│   │   │   ├── drag-drop-zone/
│   │   │   ├── file-preview/
│   │   │   └── upload-progress/
│   │   ├── services/
│   │   │   ├── file-validator.service.ts      # 檔案驗證
│   │   │   └── upload-manager.service.ts      # 上傳管理
│   │   └── models/
│   │       ├── upload-config.model.ts
│   │       └── file-item.model.ts
│   │
│   ├── search-input/                    # 搜尋輸入框
│   │   ├── search-input.component.ts
│   │   ├── search-input.component.html
│   │   ├── search-input.component.less
│   │   ├── components/
│   │   │   ├── search-suggestions/            # 搜尋建議
│   │   │   └── search-history/                # 搜尋歷史
│   │   └── services/
│   │       └── search-history.service.ts
│   │
│   ├── date-range-picker/               # 日期範圍選擇器
│   │   ├── date-range-picker.component.ts
│   │   ├── date-range-picker.component.html
│   │   ├── date-range-picker.component.less
│   │   ├── presets/
│   │   │   └── date-presets.const.ts          # Today/Last 7 days/etc
│   │   └── models/
│   │       └── date-range.model.ts
│   │
│   ├── code-block/                      # 程式碼區塊
│   │   ├── code-block.component.ts
│   │   ├── code-block.component.html
│   │   ├── code-block.component.less
│   │   ├── services/
│   │   │   └── syntax-highlighter.service.ts  # Prism.js 整合
│   │   └── models/
│   │       └── code-theme.enum.ts
│   │
│   ├── notification-bell/               # 通知鈴鐺
│   │   ├── notification-bell.component.ts
│   │   ├── notification-bell.component.html
│   │   ├── notification-bell.component.less
│   │   ├── components/
│   │   │   ├── notification-list/
│   │   │   └── notification-item/
│   │   └── services/
│   │       └── notification-ui.service.ts
│   │
│   ├── timeline/                        # 時間線組件
│   │   ├── timeline.component.ts
│   │   ├── timeline.component.html
│   │   ├── timeline.component.less
│   │   ├── components/
│   │   │   └── timeline-item.component.ts
│   │   └── models/
│   │       └── timeline-event.model.ts
│   │
│   ├── label-group/                     # 標籤組 (類似 GitHub Labels)
│   │   ├── label-group.component.ts
│   │   ├── label-group.component.html
│   │   ├── label-group.component.less
│   │   └── models/
│   │       └── label.model.ts
│   │
│   ├── progress-bar/                    # 進度條
│   │   ├── progress-bar.component.ts
│   │   ├── progress-bar.component.html
│   │   ├── progress-bar.component.less
│   │   └── models/
│   │       └── progress-config.model.ts
│   │
│   ├── pagination/                      # 分頁器 (封裝 nz-pagination)
│   │   ├── pagination.component.ts
│   │   ├── pagination.component.html
│   │   ├── pagination.component.less
│   │   └── models/
│   │       └── pagination-state.model.ts
│   │
│   └── tooltip/                         # 提示框 (增強版)
│       ├── tooltip.directive.ts
│       ├── tooltip.component.ts
│       └── models/
│           └── tooltip-config.model.ts
│
├── directives/                          # 通用指令
│   ├── click-outside.directive.ts       # 點擊外部關閉
│   ├── auto-focus.directive.ts          # 自動聚焦
│   ├── copy-to-clipboard.directive.ts   # 複製到剪貼板
│   ├── lazy-load.directive.ts           # 圖片懶載入
│   ├── infinite-scroll.directive.ts     # 無限滾動
│   ├── debounce-click.directive.ts      # 防抖點擊
│   ├── permission.directive.ts          # 權限控制 (*appHasPermission)
│   ├── role.directive.ts                # 角色控制 (*appHasRole)
│   ├── tenant-scope.directive.ts        # 租戶範疇 (*appTenantScope)
│   ├── loading.directive.ts             # Loading 狀態
│   ├── tooltip-trigger.directive.ts     # Tooltip 觸發器
│   └── drag-drop.directive.ts           # 拖放功能
│
├── pipes/                               # 通用管道
│   ├── date/
│   │   ├── relative-time.pipe.ts        # "2 hours ago"
│   │   ├── format-date.pipe.ts          # 日期格式化
│   │   └── time-ago.pipe.ts             # 時間差
│   ├── string/
│   │   ├── truncate.pipe.ts             # 截斷文字
│   │   ├── capitalize.pipe.ts           # 首字母大寫
│   │   ├── highlight.pipe.ts            # 高亮關鍵字
│   │   └── slug.pipe.ts                 # 轉換為 URL slug
│   ├── number/
│   │   ├── file-size.pipe.ts            # 檔案大小格式化
│   │   ├── number-format.pipe.ts        # 數字格式化
│   │   └── percentage.pipe.ts           # 百分比
│   ├── array/
│   │   ├── sort.pipe.ts                 # 陣列排序
│   │   ├── filter.pipe.ts               # 陣列篩選
│   │   └── group-by.pipe.ts             # 分組
│   ├── tenant/
│   │   ├── tenant-name.pipe.ts          # 租戶名稱
│   │   └── tenant-filter.pipe.ts        # 租戶過濾
│   ├── permission/
│   │   ├── can.pipe.ts                  # 權限檢查
│   │   ├── permission-label.pipe.ts     # 權限標籤
│   │   └── role-name.pipe.ts            # 角色名稱
│   ├── user/
│   │   ├── user-display-name.pipe.ts    # 用戶顯示名稱
│   │   └── avatar-url.pipe.ts           # 頭像 URL
│   └── safe/
│       ├── safe-html.pipe.ts            # 安全 HTML
│       ├── safe-url.pipe.ts             # 安全 URL
│       └── safe-style.pipe.ts           # 安全樣式
│
├── validators/                          # 表單驗證器
│   ├── email-validators.ts              # Email 驗證
│   ├── password-validators.ts           # 密碼強度
│   ├── url-validators.ts                # URL 驗證
│   ├── file-validators.ts               # 檔案驗證
│   ├── custom-validators.ts             # 自訂驗證
│   └── async-validators.ts              # 異步驗證 (唯一性)
│
├── utils/                               # 工具函數
│   ├── date.util.ts                     # 日期工具
│   ├── string.util.ts                   # 字串工具
│   ├── array.util.ts                    # 陣列工具
│   ├── object.util.ts                   # 物件工具
│   ├── file.util.ts                     # 檔案工具
│   ├── url.util.ts                      # URL 工具
│   ├── color.util.ts                    # 顏色工具
│   ├── crypto.util.ts                   # 加密工具
│   ├── storage.util.ts                  # Storage 工具
│   └── validator.util.ts                # 驗證工具
│
├── models/                              # 通用模型
│   ├── base.model.ts                    # 基礎模型
│   ├── tenant-entity.model.ts           # 租戶實體基類
│   ├── paginated-response.model.ts      # 分頁響應
│   ├── api-response.model.ts            # API 響應
│   ├── error-response.model.ts          # 錯誤響應
│   ├── select-option.model.ts           # 下拉選項
│   └── key-value.model.ts               # 鍵值對
│
├── services/                            # 通用服務
│   ├── clipboard.service.ts             # 剪貼板操作
│   ├── download.service.ts              # 檔案下載
│   ├── local-storage.service.ts         # LocalStorage 封裝
│   ├── session-storage.service.ts       # SessionStorage 封裝
│   ├── modal.service.ts                 # 彈窗服務
│   ├── message.service.ts               # 訊息提示
│   ├── notification.service.ts          # 通知服務
│   └── theme.service.ts                 # 主題切換
│
├── constants/                           # 常量定義
│   ├── app.constants.ts                 # 應用常量
│   ├── api.constants.ts                 # API 端點
│   ├── regex.constants.ts               # 正則表達式
│   ├── colors.constants.ts              # 顏色定義
│   └── icons.constants.ts               # 圖標映射
│
├── types/                               # TypeScript 類型定義
│   ├── common.types.ts                  # 通用類型
│   ├── utility.types.ts                 # 工具類型
│   └── globals.d.ts                     # 全域類型聲明
│
├── animations/                          # 動畫定義
│   ├── fade.animation.ts                # 淡入淡出
│   ├── slide.animation.ts               # 滑動
│   ├── expand.animation.ts              # 展開/收起
│   └── list.animation.ts                # 列表動畫
│
├── styles/                              # 通用樣式
│   ├── _variables.less                  # LESS 變數
│   ├── _mixins.less                     # LESS Mixins
│   ├── _utilities.less                  # 工具類
│   ├── _animations.less                 # 動畫樣式
│   └── _theme.less                      # 主題樣式
│
└── shared.module.ts                     # 共享模組入口
```

---

## 核心組件詳細設計

### 1. Data Table (通用表格)

#### 設計目標
- 基於 NG-ZORRO `nz-table` 封裝
- 支持租戶隔離數據
- 可配置欄位、篩選、排序、分頁
- 支持批次操作
- 支持導出 (CSV/Excel)
- 欄位顯示設定持久化

#### 核心模型

```typescript
// models/column-definition.model.ts
export interface ColumnDefinition<T = any> {
  key: keyof T;                          // 數據鍵
  title: string;                         // 欄位標題
  width?: string;                        // 欄位寬度
  align?: 'left' | 'center' | 'right';   // 對齊方式
  sortable?: boolean;                    // 可排序
  filterable?: boolean;                  // 可篩選
  filterType?: 'text' | 'select' | 'date' | 'range';
  filterOptions?: SelectOption[];        // 篩選選項 (for select)
  render?: (value: any, row: T) => string | TemplateRef<any>; // 自訂渲染
  hidden?: boolean;                      // 隱藏欄位
  fixed?: 'left' | 'right';              // 固定欄位
  exportable?: boolean;                  // 可導出
  permission?: string;                   // 權限控制
}

// models/table-config.model.ts
export interface TableConfig<T = any> {
  columns: ColumnDefinition<T>[];
  dataSource: T[] | Observable<T[]>;
  loading?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  showPagination?: boolean;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  total?: number;
  rowSelection?: {
    enabled: boolean;
    type: 'checkbox' | 'radio';
    onChange: (selectedRows: T[]) => void;
  };
  bulkActions?: BulkAction<T>[];
  onRowClick?: (row: T) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, any>) => void;
  expandable?: {
    expandedRowRender: (row: T) => TemplateRef<any>;
  };
  persistence?: {
    key: string;                         // LocalStorage key
    saveColumnSettings: boolean;         // 儲存欄位設定
    saveFilters: boolean;                // 儲存篩選條件
  };
}

export interface BulkAction<T = any> {
  key: string;
  label: string;
  icon?: string;
  danger?: boolean;
  permission?: string;
  handler: (selectedRows: T[]) => void | Promise<void>;
}
```

#### 組件實作

```typescript
// data-table.component.ts
@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent<T = any> implements OnInit, OnDestroy {
  @Input() config!: TableConfig<T>;
  @Output() configChange = new EventEmitter<TableConfig<T>>();

  // 狀態管理
  displayData = signal<T[]>([]);
  loading = signal(false);
  selectedRows = signal<T[]>([]);
  currentPage = signal(1);
  pageSize = signal(10);
  total = signal(0);
  sortState = signal<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  filters = signal<Record<string, any>>({});

  // 欄位設定
  visibleColumns = signal<ColumnDefinition<T>[]>([]);
  columnSettingsVisible = signal(false);

  constructor(
    private tableState: TableStateService,
    private tableExport: TableExportService,
    private permission: PermissionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 載入持久化設定
    if (this.config.persistence) {
      this.loadPersistedSettings();
    }

    // 初始化可見欄位
    this.visibleColumns.set(
      this.config.columns.filter(col => !col.hidden)
    );

    // 訂閱數據源
    if (this.config.dataSource instanceof Observable) {
      this.config.dataSource.subscribe(data => {
        this.displayData.set(data);
        this.cdr.markForCheck();
      });
    } else {
      this.displayData.set(this.config.dataSource);
    }
  }

  // 排序處理
  onSort(column: ColumnDefinition<T>): void {
    if (!column.sortable) return;

    const current = this.sortState();
    let direction: 'asc' | 'desc' | null = 'asc';

    if (current?.key === column.key) {
      direction = current.direction === 'asc' ? 'desc' : null;
    }

    if (direction) {
      this.sortState.set({ key: column.key as string, direction });
      this.config.onSort?.(column.key as string, direction);
    } else {
      this.sortState.set(null);
    }
  }

  // 篩選處理
  onFilter(column: ColumnDefinition<T>, value: any): void {
    const filters = { ...this.filters(), [column.key]: value };
    this.filters.set(filters);
    this.config.onFilter?.(filters);

    if (this.config.persistence?.saveFilters) {
      this.persistFilters(filters);
    }
  }

  // 批次操作
  async executeBulkAction(action: BulkAction<T>): Promise<void> {
    const selected = this.selectedRows();
    if (selected.length === 0) return;

    // 權限檢查