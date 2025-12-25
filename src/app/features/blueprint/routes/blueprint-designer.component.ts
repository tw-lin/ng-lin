/**
 * @module BlueprintDesignerComponent
 * @description
 * Visual blueprint designer with drag-and-drop module composition
 * 
 * ## Purpose
 * Interactive canvas for designing construction project blueprints by:
 * - Visual drag-and-drop module placement
 * - Module dependency management with validation
 * - Real-time connection visualization
 * - Automatic dependency resolution and cycle detection
 * 
 * ## Key Features
 * - **Visual Canvas**: Drag-and-drop interface with grid-based positioning
 * - **Module Library**: Categorized modules (Basic, Finance, Cloud, Quality, etc.)
 * - **Connection Management**: Visual connection drawing with SVG layer
 * - **Dependency Validation**: Real-time circular dependency detection
 * - **Auto-save**: Automatic persistence on changes
 * - **Module Configuration**: Drawer-based configuration editing
 * 
 * ## Architecture
 * - **Presentation Layer**: Standalone component with OnPush change detection
 * - **State Management**: Angular Signals for reactive UI updates
 * - **Service Layer**: BlueprintFeatureService for data operations
 * - **Validation**: DependencyValidatorService for graph analysis
 * 
 * ## Module Categories
 * - **Basic**: Tasks, Members, Diary, Audit Logs
 * - **Finance**: Budget tracking, payment management
 * - **Cloud**: Document storage and backup
 * - **Quality**: QA inspections, acceptance
 * - **Documents**: Contracts, agreements
 * 
 * ## State Management
 * Uses Angular 20+ Signals pattern:
 * - `blueprint` - Current blueprint state
 * - `modules` - Canvas modules with positions
 * - `connections` - Module dependencies
 * - `validationResult` - Dependency validation status
 * - Computed signals for derived state
 * 
 * ## Multi-Tenancy
 * Respects Blueprint-based isolation:
 * - Each blueprint is a permission boundary
 * - Modules belong to specific blueprints
 * - Changes require blueprint-level permissions
 * 
 * @see {@link docs/⭐️/整體架構設計.md} - Overall Architecture
 * @see {@link src/app/features/blueprint/README.md} - Blueprint Module Documentation
 * @see {@link .github/instructions/ng-gighub-architecture.instructions.md} - Architecture Guidelines
 * 
 * @remarks
 * This is the most complex component in the blueprint feature (1052 lines).
 * Key complexity areas:
 * - SVG connection rendering
 * - Drag-and-drop state management
 * - Dependency graph validation
 * - Real-time UI updates
 * 
 * @example
 * ```typescript
 * // Route configuration
 * {
 *   path: ':id/designer',
 *   component: BlueprintDesignerComponent
 * }
 * 
 * // Navigation
 * router.navigate(['/blueprint', blueprintId, 'designer']);
 * ```
 */
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Blueprint, LoggerService, ModuleType } from '@core';
import { ModuleConnection } from '@core/blueprint/models';
import { DependencyValidatorService, DependencyValidationResult } from '@core/blueprint/services';
import { SHARED_IMPORTS } from '@shared';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzMessageService } from 'ng-zorro-antd/message';

import { ConnectionLayerComponent, ValidationAlertsComponent } from './components';
import { BlueprintFeatureService } from '../services/blueprint.service';

/**
 * Canvas Module Interface
 * 畫布模組資料結構
 */
interface CanvasModule {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  enabled: boolean;
  config: Record<string, unknown>;
  dependencies: string[];
}

/**
 * Module Category Interface
 * 模組分類資料結構
 */
interface ModuleCategory {
  name: string;
  modules: Array<{
    type: string;
    name: string;
    icon: string;
  }>;
}

/**
 * Connection Creation State
 * 連接建立狀態
 */
interface ConnectionCreationState {
  /** 是否正在建立連接 */
  active: boolean;
  /** 來源模組 ID */
  sourceModuleId: string | null;
  /** 來源端點位置 */
  sourcePosition: { x: number; y: number } | null;
  /** 當前滑鼠位置 */
  currentPosition: { x: number; y: number } | null;
}

/**
 * Blueprint Designer Component
 * 藍圖設計器 - 視覺化拖放式模組配置介面
 *
 * Features:
 * - Drag-and-drop module configuration
 * - Visual module dependencies (NEW: Task 1)
 * - Module connection visualization (NEW: Task 1)
 * - Drag-to-connect functionality (NEW: Task 1.3)
 * - Dependency validation (NEW: Task 2)
 * - Real-time property editing
 * - Canvas-based layout
 *
 * ✅ Modern Angular 20 with Signals and new control flow
 * ✅ Task 1.1: Connection data structures implemented
 * ✅ Task 1.2: SVG connection line rendering
 * 🔄 Task 1.3: Drag-to-connect (in progress)
 */
@Component({
  selector: 'app-blueprint-designer',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    DragDropModule,
    NzDrawerModule,
    NzEmptyModule,
    NzFormModule,
    FormsModule,
    ConnectionLayerComponent,
    ValidationAlertsComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <page-header [title]="'藍圖設計器: ' + (blueprint()?.name || '')" [action]="headerActions">
      <ng-template #headerActions>
        <button nz-button (click)="preview()">
          <span nz-icon nzType="eye"></span>
          預覽
        </button>
        <button nz-button nzType="primary" (click)="save()" [nzLoading]="saving()">
          <span nz-icon nzType="save"></span>
          儲存
        </button>
        <button nz-button (click)="close()">
          <span nz-icon nzType="close"></span>
          關閉
        </button>
      </ng-template>
    </page-header>

    <!-- ✅ FIX: Wrap with cdkDropListGroup to enable drag from palette to canvas -->
    <div class="designer-container" cdkDropListGroup>
      <!-- Validation Alerts (Top) - Task 2.3 -->
      <div class="validation-section">
        <app-validation-alerts [validationResult]="validationResult()" />
      </div>

      <!-- Module Palette (Left Panel) -->
      <div class="module-palette">
        <nz-card nzTitle="模組選擇器" [nzBordered]="false">
          <!-- ✅ FIX: Add cdkDropList to enable dragging from palette -->
          <div class="module-categories" cdkDropList id="module-palette-list" [cdkDropListData]="[]">
            <!-- 📌 使用 @for 新語法 -->
            @for (category of moduleCategories(); track category.name) {
              <div class="category">
                <h4>{{ category.name }}</h4>

                <!-- 📌 巢狀 @for -->
                @for (module of category.modules; track module.type) {
                  <div class="module-card" cdkDrag [cdkDragData]="module" (cdkDragStarted)="onDragStart(module)">
                    <span nz-icon [nzType]="module.icon"></span>
                    <span>{{ module.name }}</span>
                  </div>
                }
              </div>
            }
          </div>
        </nz-card>
      </div>

      <!-- Canvas Area (Center) -->
      <div class="canvas-area">
        <nz-card nzTitle="畫布區域" [nzBordered]="false" class="canvas-card">
          <div
            class="canvas"
            #canvas
            cdkDropList
            id="canvas-drop-list"
            [cdkDropListData]="canvasModules()"
            (cdkDropListDropped)="onDrop($event)"
            (mousemove)="onCanvasMouseMove($event)"
            (mouseleave)="onCanvasMouseLeave()"
          >
            <!-- 📌 Connection Layer (SVG) - Task 1.2 -->
            <app-connection-layer
              [connections]="connections()"
              [modules]="modulePositions()"
              [selectedConnectionId]="selectedConnectionId()"
              (connectionClick)="selectConnection($event)"
              (connectionContextMenu)="onConnectionContextMenu($event)"
            />

            <!-- 📌 Connection Preview (Task 1.3) -->
            @if (
              connectionCreationState().active && connectionCreationState().sourcePosition && connectionCreationState().currentPosition
            ) {
              <svg
                class="connection-preview"
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 100;"
              >
                <path [attr.d]="getPreviewPath()" stroke-width="2" stroke-dasharray="5,5" fill="none" opacity="0.6" />
              </svg>
            }

            <!-- Render modules on canvas -->
            @for (module of canvasModules(); track module.id) {
              <div
                class="canvas-module"
                [class.selected]="selectedModule()?.id === module.id"
                [style.left.px]="module.position.x"
                [style.top.px]="module.position.y"
                (click)="selectModule(module)"
                cdkDrag
              >
                <!-- 📌 Input Port (Left side) - Task 1.3 -->
                <div
                  class="connection-port input-port"
                  [class.active]="isPortActive('input', module.id)"
                  (mouseenter)="onPortHover('input', module.id, $event)"
                  (mouseleave)="onPortLeave()"
                  (mousedown)="onPortMouseDown('input', module.id, $event)"
                  title="輸入端點 (接收事件)"
                >
                  <span nz-icon nzType="arrow-left" nzTheme="outline"></span>
                </div>

                <div class="module-header">
                  <span nz-icon [nzType]="getModuleIcon(module.type)"></span>
                  <span>{{ module.name }}</span>
                  <button nz-button nzType="text" nzSize="small" (click)="removeModule(module.id); $event.stopPropagation()">
                    <span nz-icon nzType="close"></span>
                  </button>
                </div>

                <!-- 📌 Output Port (Right side) - Task 1.3 -->
                <div
                  class="connection-port output-port"
                  [class.active]="isPortActive('output', module.id)"
                  (mouseenter)="onPortHover('output', module.id, $event)"
                  (mouseleave)="onPortLeave()"
                  (mousedown)="onPortMouseDown('output', module.id, $event)"
                  title="輸出端點 (發送事件)"
                >
                  <span nz-icon nzType="arrow-right" nzTheme="outline"></span>
                </div>

                <!-- 📌 使用 @if 顯示依賴關係 -->
                @if (module.dependencies.length > 0) {
                  <div class="module-dependencies"> 依賴: {{ module.dependencies.join(', ') }} </div>
                }
              </div>
            }

            <!-- Empty state -->
            @if (canvasModules().length === 0) {
              <nz-empty [nzNotFoundContent]="'拖放模組到此處開始設計'" class="canvas-empty"></nz-empty>
            }
          </div>
        </nz-card>
      </div>

      <!-- Property Panel (Right Drawer) -->
      <nz-drawer
        [nzVisible]="selectedModule() !== null"
        nzPlacement="right"
        [nzTitle]="'模組設定'"
        [nzWidth]="400"
        (nzOnClose)="closePropertyPanel()"
      >
        @if (selectedModule(); as module) {
          <div class="property-panel">
            <form nz-form nzLayout="vertical">
              <nz-form-item>
                <nz-form-label nzRequired>模組名稱</nz-form-label>
                <nz-form-control>
                  <input nz-input [(ngModel)]="module.name" name="moduleName" placeholder="輸入模組名稱" />
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <nz-form-label>啟用狀態</nz-form-label>
                <nz-form-control>
                  <nz-switch [(ngModel)]="module.enabled" name="moduleEnabled"></nz-switch>
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <nz-form-label>模組設定</nz-form-label>
                <nz-form-control>
                  <textarea
                    nz-input
                    [nzAutosize]="{ minRows: 5, maxRows: 10 }"
                    [(ngModel)]="moduleConfigJson"
                    name="moduleConfig"
                    placeholder="JSON 格式"
                  ></textarea>
                </nz-form-control>
              </nz-form-item>

              <button nz-button nzType="primary" nzBlock type="button" (click)="updateModuleConfig()"> 更新設定 </button>
            </form>
          </div>
        }
      </nz-drawer>
    </div>
  `,
  styles: [
    `
      .validation-section {
        margin-bottom: 16px;
      }

      .designer-container {
        display: flex;
        height: calc(100vh - 180px);
        gap: 16px;
      }

      .module-palette {
        width: 250px;
        flex-shrink: 0;
        overflow-y: auto;
      }

      .category {
        margin-bottom: 16px;
      }

      .module-categories {
        /* Allow items to be dragged from this list without visual drop zone */
        min-height: auto;
      }

      .category h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 500;
      }

      .module-card {
        padding: 12px;
        margin-bottom: 8px;
        border: 1px solid;
        border-radius: 4px;
        cursor: move;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s;
      }

      .module-card:hover {
      }

      .canvas-area {
        flex: 1;
        overflow: auto;
      }

      .canvas-card {
        height: 100%;
      }

      .canvas {
        position: relative;
        min-height: 600px;
        border: 2px dashed;
        border-radius: 4px;
        padding: 16px;
      }

      .canvas-module {
        position: absolute;
        width: 200px;
        padding: 16px;
        background: white;
        border: 2px solid;
        border-radius: 8px;
        cursor: move;
        transition: all 0.3s;
      }

      .canvas-module:hover,
      .canvas-module.selected {
      }

      .module-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
      }

      .module-header button {
        margin-left: auto;
      }

      .module-dependencies {
        margin-top: 8px;
        font-size: 12px;
      }

      .canvas-empty {
        margin-top: 200px;
      }

      .property-panel {
        padding: 16px;
      }

      /* ✅ Task 1.3: Connection Ports Styling */
      .connection-port {
        position: absolute;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: crosshair;
        transition: all 0.3s;
        z-index: 10;
      }

      .connection-port:hover {
        transform: scale(1.2);
      }

      .connection-port.active {
      }

      .connection-port.active [nz-icon] {
      }

      .input-port {
        left: -12px;
        top: 50%;
        transform: translateY(-50%);
      }

      .output-port {
        right: -12px;
        top: 50%;
        transform: translateY(-50%);
      }

      .connection-port [nz-icon] {
        font-size: 12px;
      }

      /* Connection preview line */
      .connection-preview {
        position: absolute;
        pointer-events: none;
        z-index: 5;
      }
    `
  ]
})
export class BlueprintDesignerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);
  private readonly logger = inject(LoggerService);
  private readonly blueprintService = inject(BlueprintFeatureService);
  private readonly validatorService = inject(DependencyValidatorService);

  @ViewChild('canvas', { static: false }) canvasElement?: ElementRef<HTMLDivElement>;

  // ✅ Signals for reactive state management
  readonly blueprint = signal<Blueprint | null>(null);
  readonly canvasModules = signal<CanvasModule[]>([]);
  readonly selectedModule = signal<CanvasModule | null>(null);
  readonly saving = signal(false);
  readonly moduleConfigJson = signal('{}');

  // ✅ NEW: Task 1.1 - Connection management signals
  readonly connections = signal<ModuleConnection[]>([]);
  readonly selectedConnectionId = signal<string | null>(null);
  readonly connectionCreationState = signal<ConnectionCreationState>({
    active: false,
    sourceModuleId: null,
    sourcePosition: null,
    currentPosition: null
  });

  // ✅ Task 1.3: Port interaction state
  private hoveredPortType: 'input' | 'output' | null = null;
  private hoveredPortModuleId: string | null = null;
  private isDraggingConnection = false;

  // ✅ Task 2: Validation state
  readonly validationResult = signal<DependencyValidationResult | null>(null);

  // ✅ Computed signal for module categories
  readonly moduleCategories = computed<ModuleCategory[]>(() => [
    {
      name: '基礎模組',
      modules: [
        { type: 'tasks', name: '任務管理', icon: 'check-square' },
        { type: 'logs', name: '日誌管理', icon: 'file-text' },
        { type: 'documents', name: '文件管理', icon: 'folder' }
      ]
    },
    {
      name: '進階模組',
      modules: [
        { type: 'quality', name: '品質驗收', icon: 'safety' },
        { type: 'inspection', name: '檢查管理', icon: 'eye' }
      ]
    }
  ]);

  // ✅ Task 1.2: Computed signal for module positions (for ConnectionLayerComponent)
  readonly modulePositions = computed(() => {
    return this.canvasModules().map(module => ({
      id: module.id,
      position: {
        x: module.position.x + 100, // Center of module (200px width / 2)
        y: module.position.y + 30 // Approximate center height
      },
      width: 200,
      height: 60
    }));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBlueprint(id);
    }
  }

  /**
   * Load blueprint data
   * 載入藍圖資料
   */
  loadBlueprint(id: string): void {
    this.blueprintService.getById(id).subscribe({
      next: blueprint => {
        if (!blueprint) {
          this.message.error('藍圖不存在');
          return;
        }

        this.blueprint.set(blueprint);

        // Convert enabled modules to canvas modules with initial positions
        const modules: CanvasModule[] = blueprint.enabledModules.map((type: ModuleType, index: number) => ({
          id: `module-${Date.now()}-${index}`,
          type,
          name: this.getModuleName(type),
          position: { x: 50 + (index % 3) * 220, y: 50 + Math.floor(index / 3) * 150 },
          enabled: true,
          config: {},
          dependencies: []
        }));

        this.canvasModules.set(modules);
        this.logger.info('[BlueprintDesigner]', 'Loaded blueprint', { id, modulesCount: modules.length });

        // ✅ Task 2: Run validation after loading
        this.runValidation();
      },
      error: error => {
        this.logger.error('[BlueprintDesigner]', 'Failed to load blueprint', error instanceof Error ? error : new Error(String(error)));
        this.message.error('載入藍圖失敗');
      }
    });
  }

  /**
   * Handle drag start event
   * 處理拖曳開始事件
   */
  onDragStart(module: { type: string; name: string; icon: string }): void {
    this.logger.debug('[BlueprintDesigner]', 'Drag started', { module });
  }

  /**
   * Handle drop event on canvas
   * 處理放置事件
   *
   * ✅ FIX: Enhanced to properly handle drops from palette to canvas
   */
  onDrop(event: CdkDragDrop<CanvasModule[]>): void {
    if (event.previousContainer === event.container) {
      // Reorder within canvas
      const modules = [...this.canvasModules()];
      moveItemInArray(modules, event.previousIndex, event.currentIndex);
      this.canvasModules.set(modules);
      this.logger.debug('[BlueprintDesigner]', 'Module reordered', {
        fromIndex: event.previousIndex,
        toIndex: event.currentIndex
      });
    } else {
      // Add new module from palette to canvas
      const moduleData = event.item.data;

      // Calculate position relative to canvas container
      let x = 50; // Default position
      let y = 50;

      if (this.canvasElement && event.dropPoint) {
        const canvas = this.canvasElement.nativeElement;
        const rect = canvas.getBoundingClientRect();
        x = event.dropPoint.x - rect.left + canvas.scrollLeft;
        y = event.dropPoint.y - rect.top + canvas.scrollTop;

        // Adjust for drag offset to center the module at drop point
        x = Math.max(0, x - 100); // Center horizontally (module width 200px / 2)
        y = Math.max(0, y - 30); // Center vertically
      }

      const newModule: CanvasModule = {
        id: `module-${Date.now()}`,
        type: moduleData.type,
        name: moduleData.name,
        position: { x, y },
        enabled: true,
        config: {},
        dependencies: []
      };

      this.canvasModules.update(modules => [...modules, newModule]);
      this.message.success(`已新增 ${newModule.name}`);
      this.logger.info('[BlueprintDesigner]', 'Module added from palette', {
        module: newModule,
        position: { x, y }
      });

      // ✅ Task 2: Run validation after adding module
      this.runValidation();
    }
  }

  /**
   * Select a module for editing
   * 選擇模組進行編輯
   */
  selectModule(module: CanvasModule): void {
    this.selectedModule.set(module);
    this.moduleConfigJson.set(JSON.stringify(module.config, null, 2));
    this.logger.debug('[BlueprintDesigner]', 'Module selected', { module });
  }

  /**
   * Remove a module from canvas
   * 從畫布移除模組
   */
  removeModule(id: string): void {
    this.canvasModules.update(modules => modules.filter(m => m.id !== id));
    if (this.selectedModule()?.id === id) {
      this.selectedModule.set(null);
    }
    this.message.success('已移除模組');
    this.logger.info('[BlueprintDesigner]', 'Module removed', { id });
  }

  /**
   * Close property panel
   * 關閉屬性面板
   */
  closePropertyPanel(): void {
    this.selectedModule.set(null);
  }

  /**
   * Update module configuration
   * 更新模組設定
   */
  updateModuleConfig(): void {
    try {
      const config = JSON.parse(this.moduleConfigJson());
      const module = this.selectedModule();
      if (module) {
        module.config = config;
        this.message.success('設定已更新');
        this.logger.info('[BlueprintDesigner]', 'Module config updated', { module });
      }
    } catch (error) {
      this.logger.error('[BlueprintDesigner]', 'Invalid JSON config', error instanceof Error ? error : new Error(String(error)));
      this.message.error('JSON 格式錯誤');
    }
  }

  /**
   * Save blueprint configuration
   * 儲存藍圖配置
   *
   * ✅ Task 2: Validate before saving
   */
  async save(): Promise<void> {
    this.saving.set(true);
    try {
      const blueprint = this.blueprint();
      if (!blueprint) return;

      // ✅ Task 2: Run validation before saving
      this.runValidation();
      const validation = this.validationResult();

      if (validation && !validation.isValid) {
        this.message.error(`儲存失敗: 發現 ${validation.errors.length} 個配置錯誤,請先修正`);
        this.saving.set(false);
        return;
      }

      // Convert canvas modules to enabled modules
      const enabledModules: ModuleType[] = this.canvasModules()
        .filter(m => m.enabled)
        .map(m => m.type as ModuleType);

      await this.blueprintService.update(blueprint.id, {
        enabledModules
      });

      this.message.success('儲存成功');
      this.logger.info('[BlueprintDesigner]', 'Blueprint saved', {
        blueprintId: blueprint.id,
        modulesCount: enabledModules.length,
        connectionsCount: this.connections().length
      });
    } catch (error) {
      this.logger.error('[BlueprintDesigner]', 'Failed to save', error instanceof Error ? error : new Error(String(error)));
      this.message.error('儲存失敗');
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Preview blueprint
   * 預覽藍圖
   */
  preview(): void {
    const blueprint = this.blueprint();
    if (blueprint) {
      this.router.navigate(['/blueprint', blueprint.id]);
    }
  }

  /**
   * Close designer and return to list
   * 關閉設計器返回列表
   */
  close(): void {
    this.router.navigate(['/blueprint']);
  }

  /**
   * Get module display name
   * 取得模組顯示名稱
   */
  private getModuleName(type: string): string {
    const names: Record<string, string> = {
      tasks: '任務管理',
      logs: '日誌管理',
      quality: '品質驗收',
      documents: '文件管理',
      inspection: '檢查管理'
    };
    return names[type] || type;
  }

  /**
   * Get module icon
   * 取得模組圖示
   */
  getModuleIcon(type: string): string {
    const icons: Record<string, string> = {
      tasks: 'check-square',
      logs: 'file-text',
      quality: 'safety',
      documents: 'folder',
      inspection: 'eye'
    };
    return icons[type] || 'question';
  }

  // ============================================
  // Task 1.3: Drag-to-Connect Functionality
  // ============================================

  /**
   * Check if a port is active (in connection creation state)
   * 檢查端點是否處於活動狀態
   */
  isPortActive(portType: 'input' | 'output', moduleId: string): boolean {
    const state = this.connectionCreationState();
    if (!state.active) return false;

    // Highlight valid target ports during connection creation
    if (state.sourceModuleId) {
      // If dragging from output, highlight input ports (except source module)
      if (portType === 'input' && moduleId !== state.sourceModuleId) {
        return true;
      }
    }

    return false;
  }

  /**
   * Handle port hover event
   * 處理端點懸停事件
   */
  onPortHover(portType: 'input' | 'output', moduleId: string, event: MouseEvent): void {
    this.hoveredPortType = portType;
    this.hoveredPortModuleId = moduleId;
    event.stopPropagation();
  }

  /**
   * Handle port leave event
   * 處理端點離開事件
   */
  onPortLeave(): void {
    if (!this.isDraggingConnection) {
      this.hoveredPortType = null;
      this.hoveredPortModuleId = null;
    }
  }

  /**
   * Handle port mouse down (start connection)
   * 處理端點按下事件 (開始建立連接)
   */
  onPortMouseDown(portType: 'input' | 'output', moduleId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    // Only allow starting connections from output ports
    if (portType !== 'output') {
      return;
    }

    const module = this.canvasModules().find(m => m.id === moduleId);
    if (!module) return;

    // Calculate port position
    const portPosition = {
      x: module.position.x + 200 + 12, // Right edge + port offset
      y: module.position.y + 30 // Approximate center
    };

    this.isDraggingConnection = true;
    this.connectionCreationState.set({
      active: true,
      sourceModuleId: moduleId,
      sourcePosition: portPosition,
      currentPosition: portPosition
    });

    // Add global mouse up listener
    document.addEventListener('mouseup', this.onGlobalMouseUp);

    this.logger.info('[BlueprintDesigner]', 'Connection creation started', {
      sourceModuleId: moduleId,
      portType
    });
  }

  /**
   * Handle canvas mouse move (update connection preview)
   * 處理畫布滑鼠移動 (更新連接預覽)
   */
  onCanvasMouseMove(event: MouseEvent): void {
    const state = this.connectionCreationState();
    if (!state.active || !this.canvasElement) return;

    const canvas = this.canvasElement.nativeElement;
    const rect = canvas.getBoundingClientRect();

    const currentPosition = {
      x: event.clientX - rect.left + canvas.scrollLeft,
      y: event.clientY - rect.top + canvas.scrollTop
    };

    this.connectionCreationState.update(s => ({
      ...s,
      currentPosition
    }));
  }

  /**
   * Handle canvas mouse leave
   * 處理畫布滑鼠離開
   */
  onCanvasMouseLeave(): void {
    // Don't cancel if actively dragging
  }

  /**
   * Handle global mouse up (finish or cancel connection)
   * 處理全域滑鼠放開 (完成或取消連接)
   */
  private onGlobalMouseUp = (): void => {
    const state = this.connectionCreationState();
    if (!state.active) return;

    // Check if mouse up is over a valid input port
    if (this.hoveredPortType === 'input' && this.hoveredPortModuleId) {
      const targetModuleId = this.hoveredPortModuleId;

      // Validate connection
      if (this.validateConnection(state.sourceModuleId!, targetModuleId)) {
        this.createConnection(state.sourceModuleId!, targetModuleId);
      }
    }

    // Clean up
    this.cancelConnectionCreation();
    document.removeEventListener('mouseup', this.onGlobalMouseUp);
  };

  /**
   * Validate connection before creation
   * 驗證連接是否有效
   */
  private validateConnection(sourceId: string, targetId: string): boolean {
    // Prevent self-connection
    if (sourceId === targetId) {
      this.message.warning('無法連接到自己');
      this.logger.warn('[BlueprintDesigner]', 'Self-connection attempted', { sourceId, targetId });
      return false;
    }

    // Check for duplicate connection
    const existingConnection = this.connections().find(conn => conn.source.moduleId === sourceId && conn.target.moduleId === targetId);

    if (existingConnection) {
      this.message.warning('此連接已存在');
      this.logger.warn('[BlueprintDesigner]', 'Duplicate connection attempted', { sourceId, targetId });
      return false;
    }

    return true;
  }

  /**
   * Create a new connection
   * 建立新連接
   */
  private createConnection(sourceId: string, targetId: string): void {
    const sourceModule = this.canvasModules().find(m => m.id === sourceId);
    const targetModule = this.canvasModules().find(m => m.id === targetId);

    if (!sourceModule || !targetModule) return;

    const newConnection: ModuleConnection = {
      id: `conn-${Date.now()}`,
      source: {
        moduleId: sourceId,
        position: {
          x: sourceModule.position.x + 200,
          y: sourceModule.position.y + 30
        }
      },
      target: {
        moduleId: targetId,
        position: {
          x: targetModule.position.x,
          y: targetModule.position.y + 30
        }
      },
      eventType: 'DATA_TRANSFER',
      status: 'active'
    };

    this.connections.update(conns => [...conns, newConnection]);

    // ✅ Task 2: Re-run validation after creation
    this.runValidation();

    this.message.success(`已建立連接: ${sourceModule.name} → ${targetModule.name}`);

    this.logger.info('[BlueprintDesigner]', 'Connection created', {
      connection: newConnection,
      source: sourceModule.name,
      target: targetModule.name
    });
  }

  /**
   * Cancel connection creation
   * 取消連接建立
   */
  private cancelConnectionCreation(): void {
    this.connectionCreationState.set({
      active: false,
      sourceModuleId: null,
      sourcePosition: null,
      currentPosition: null
    });
    this.isDraggingConnection = false;
    this.hoveredPortType = null;
    this.hoveredPortModuleId = null;
  }

  /**
   * Select a connection for editing
   * 選擇連接進行編輯
   */
  selectConnection(connectionId: string): void {
    this.selectedConnectionId.set(connectionId);
    this.logger.debug('[BlueprintDesigner]', 'Connection selected', { connectionId });
  }

  /**
   * Handle connection context menu (right-click)
   * 處理連接右鍵選單
   */
  onConnectionContextMenu(event: { connectionId: string; event: MouseEvent }): void {
    event.event.preventDefault();

    // Simple implementation: show confirm to delete
    if (confirm('是否刪除此連接?')) {
      this.deleteConnection(event.connectionId);
    }
  }

  /**
   * Delete a connection
   * 刪除連接
   */
  private deleteConnection(connectionId: string): void {
    this.connections.update(conns => conns.filter(c => c.id !== connectionId));

    if (this.selectedConnectionId() === connectionId) {
      this.selectedConnectionId.set(null);
    }

    // ✅ Task 2: Re-run validation after deletion
    this.runValidation();

    this.message.success('已刪除連接');
    this.logger.info('[BlueprintDesigner]', 'Connection deleted', { connectionId });
  }

  /**
   * Run dependency validation
   * 執行依賴驗證
   *
   * ✅ Task 2.1-2.2: DFS cycle detection + missing module check
   */
  private runValidation(): void {
    const moduleIds = this.canvasModules().map(m => m.id);
    const connections = this.connections();

    const result = this.validatorService.validate(moduleIds, connections);
    this.validationResult.set(result);

    this.logger.debug('[BlueprintDesigner]', 'Validation completed', {
      isValid: result.isValid,
      errorsCount: result.errors.length,
      warningsCount: result.warnings.length
    });
  }

  /**
   * Get SVG path for connection preview
   * 取得連接預覽的 SVG 路徑
   */
  getPreviewPath(): string {
    const state = this.connectionCreationState();
    if (!state.sourcePosition || !state.currentPosition) return '';

    const start = state.sourcePosition;
    const end = state.currentPosition;

    // Simple cubic Bezier curve for preview
    const dx = end.x - start.x;
    const controlPointOffset = Math.abs(dx) * 0.5;

    const cp1x = start.x + controlPointOffset;
    const cp1y = start.y;
    const cp2x = end.x - controlPointOffset;
    const cp2y = end.y;

    return `M ${start.x},${start.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${end.x},${end.y}`;
  }
}
