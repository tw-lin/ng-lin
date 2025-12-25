import { CommonModule } from '@angular/common';
import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { ModuleConnection } from '@core/blueprint/models';

/**
 * Canvas Module Position Interface
 * 畫布模組位置介面 - 用於連接線端點計算
 */
interface ModulePosition {
  id: string;
  position: { x: number; y: number };
  width: number;
  height: number;
}

/**
 * Connection Path Data
 * 連接路徑資料 - SVG 路徑字串與樣式
 */
interface ConnectionPath {
  id: string;
  d: string; // SVG path data
  className: string;
  label?: string;
  labelPosition: { x: number; y: number };
}

/**
 * Connection Layer Component
 * 連接層元件 - 使用 SVG 渲染模組間的連接線
 *
 * @description
 * 此元件負責在設計器畫布上渲染所有模組連接。
 * 使用貝塞爾曲線繪製平滑的連接線，支援懸停、選中和標籤顯示。
 *
 * Features:
 * - SVG 貝塞爾曲線渲染
 * - 連接線懸停效果
 * - 連接線選中高亮
 * - 連接標籤顯示
 * - 點擊選擇功能
 * - 右鍵選單支援
 *
 * @example
 * ```html
 * <app-connection-layer
 *   [connections]="connections()"
 *   [modules]="modules()"
 *   [selectedConnectionId]="selectedId()"
 *   (connectionClick)="selectConnection($event)"
 *   (connectionContextMenu)="showMenu($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-connection-layer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="connection-layer">
      <!-- Connection lines -->
      @for (path of connectionPaths(); track path.id) {
        <g class="connection-group" (click)="handleClick(path.id)" (contextmenu)="handleContextMenu($event, path.id)">
          <!-- Main connection line -->
          <path [attr.d]="path.d" [class]="path.className" fill="none" stroke-width="2" />

          <!-- Hover hit area (invisible, wider for easier interaction) -->
          <path [attr.d]="path.d" class="connection-hit-area" fill="none" stroke="transparent" stroke-width="20" />

          <!-- Connection label -->
          @if (path.label) {
            <text
              [attr.x]="path.labelPosition.x"
              [attr.y]="path.labelPosition.y"
              class="connection-label"
              text-anchor="middle"
              dominant-baseline="middle"
            >
              {{ path.label }}
            </text>
          }
        </g>
      }
    </svg>
  `,
  styles: [
    `
      :host {
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }

      .connection-layer {
        width: 100%;
        height: 100%;
      }

      .connection-group {
        pointer-events: auto;
        cursor: pointer;
      }

      .connection-line {
        transition: all 0.2s ease;
      }

      .connection-line:hover {
        stroke-width: 3;
      }

      .connection-line.selected {
        stroke-width: 3;
      }

      .connection-line.error {
        stroke-dasharray: 5, 5;
      }

      .connection-line.inactive {
        opacity: 0.5;
      }

      .connection-hit-area {
        cursor: pointer;
      }

      .connection-label {
        font-size: 12px;
        font-weight: 500;
        pointer-events: none;
        user-select: none;
      }

      .connection-group:hover .connection-label {
      }
    `
  ]
})
export class ConnectionLayerComponent {
  // ✅ Modern Angular 19+ input/output functions
  connections = input.required<ModuleConnection[]>();
  modules = input.required<ModulePosition[]>();
  selectedConnectionId = input<string | null>(null);

  connectionClick = output<string>();
  connectionContextMenu = output<{ connectionId: string; event: MouseEvent }>();

  /**
   * Computed signal for connection paths
   * 計算連接路徑資料
   */
  connectionPaths = computed<ConnectionPath[]>(() => {
    const conns = this.connections();
    const mods = this.modules();
    const selectedId = this.selectedConnectionId();

    return conns.map(conn => {
      const path = this.calculatePath(conn, mods);
      const className = this.getConnectionClassName(conn, selectedId);
      const labelPosition = this.calculateLabelPosition(conn, mods);

      return {
        id: conn.id,
        d: path,
        className,
        label: conn.label,
        labelPosition
      };
    });
  });

  /**
   * Calculate SVG path for connection using Bezier curve
   * 計算連接的 SVG 路徑 (使用貝塞爾曲線)
   *
   * @param connection - Connection to render
   * @param modules - Module positions for endpoint calculation
   * @returns SVG path string
   */
  private calculatePath(connection: ModuleConnection, modules: ModulePosition[]): string {
    const sourceModule = modules.find(m => m.id === connection.source.moduleId);
    const targetModule = modules.find(m => m.id === connection.target.moduleId);

    if (!sourceModule || !targetModule) {
      return ''; // Invalid connection, no modules found
    }

    // Calculate connection points (right side of source, left side of target)
    const startX = sourceModule.position.x + sourceModule.width;
    const startY = sourceModule.position.y + sourceModule.height / 2;
    const endX = targetModule.position.x;
    const endY = targetModule.position.y + targetModule.height / 2;

    // Calculate control points for smooth Bezier curve
    const controlPointOffset = Math.abs(endX - startX) / 2;
    const cp1x = startX + controlPointOffset;
    const cp1y = startY;
    const cp2x = endX - controlPointOffset;
    const cp2y = endY;

    // Generate SVG path using cubic Bezier curve (C command)
    return `M ${startX},${startY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`;
  }

  /**
   * Get CSS class name for connection based on status and selection
   * 根據狀態與選中狀態取得 CSS 類別名稱
   */
  private getConnectionClassName(connection: ModuleConnection, selectedId: string | null): string {
    const classes = ['connection-line'];

    if (connection.id === selectedId) {
      classes.push('selected');
    }

    if (connection.status === 'error') {
      classes.push('error');
    } else if (connection.status === 'inactive') {
      classes.push('inactive');
    }

    return classes.join(' ');
  }

  /**
   * Calculate label position at the middle of the connection
   * 計算標籤位置 (連接線中點)
   */
  private calculateLabelPosition(connection: ModuleConnection, modules: ModulePosition[]): { x: number; y: number } {
    const sourceModule = modules.find(m => m.id === connection.source.moduleId);
    const targetModule = modules.find(m => m.id === connection.target.moduleId);

    if (!sourceModule || !targetModule) {
      return { x: 0, y: 0 };
    }

    const startX = sourceModule.position.x + sourceModule.width;
    const startY = sourceModule.position.y + sourceModule.height / 2;
    const endX = targetModule.position.x;
    const endY = targetModule.position.y + targetModule.height / 2;

    // Label at midpoint
    return {
      x: (startX + endX) / 2,
      y: (startY + endY) / 2 - 10 // Offset above the line
    };
  }

  /**
   * Handle connection click event
   * 處理連接點擊事件
   */
  handleClick(connectionId: string): void {
    this.connectionClick.emit(connectionId);
  }

  /**
   * Handle connection right-click (context menu)
   * 處理連接右鍵選單
   */
  handleContextMenu(event: MouseEvent, connectionId: string): void {
    event.preventDefault();
    this.connectionContextMenu.emit({ connectionId, event });
  }
}
