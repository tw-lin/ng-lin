/**
 * Module Connection Interface
 * 模組連接介面 - 定義模組間的事件通訊連接
 *
 * @description
 * 此介面定義了藍圖設計器中模組之間的連接關係。
 * 每個連接代表一個事件流，從源模組到目標模組。
 *
 * @example
 * ```typescript
 * const connection: ModuleConnection = {
 *   id: 'conn-1234567890',
 *   source: {
 *     moduleId: 'module-tasks',
 *     portId: 'TASK_COMPLETED',
 *     position: { x: 250, y: 100 }
 *   },
 *   target: {
 *     moduleId: 'module-logs',
 *     portId: 'onTaskCompleted',
 *     position: { x: 50, y: 200 }
 *   },
 *   eventType: 'TASK_COMPLETED',
 *   status: 'active'
 * };
 * ```
 */
export interface ModuleConnection {
  /**
   * 連接唯一識別碼
   * Unique identifier for the connection
   */
  id: string;

  /**
   * 來源模組資訊
   * Source module information
   */
  source: {
    /**
     * 來源模組 ID
     * Source module ID
     */
    moduleId: string;

    /**
     * 輸出端口 (事件類型)
     * Output port (event type)
     *
     * @optional
     */
    portId?: string;

    /**
     * 端點位置 (用於 SVG 路徑計算)
     * Endpoint position (for SVG path calculation)
     */
    position: { x: number; y: number };
  };

  /**
   * 目標模組資訊
   * Target module information
   */
  target: {
    /**
     * 目標模組 ID
     * Target module ID
     */
    moduleId: string;

    /**
     * 輸入端口 (事件處理器)
     * Input port (event handler)
     *
     * @optional
     */
    portId?: string;

    /**
     * 端點位置 (用於 SVG 路徑計算)
     * Endpoint position (for SVG path calculation)
     */
    position: { x: number; y: number };
  };

  /**
   * 連接傳遞的事件類型
   * Event type transmitted through this connection
   */
  eventType: string;

  /**
   * 連接狀態
   * Connection status
   *
   * @default 'active'
   */
  status?: 'active' | 'inactive' | 'error';

  /**
   * 連接標籤 (可選顯示在連接線上)
   * Connection label (optional, displayed on the connection line)
   *
   * @optional
   */
  label?: string;

  /**
   * 連接配置 (擴展屬性)
   * Connection configuration (extended properties)
   *
   * @optional
   */
  config?: Record<string, unknown>;
}

/**
 * Connection Create DTO
 * 建立連接的資料傳輸物件
 *
 * @description
 * 用於建立新連接時傳遞的最小必要資料
 */
export interface CreateConnectionDto {
  /** 來源模組 ID */
  sourceModuleId: string;

  /** 目標模組 ID */
  targetModuleId: string;

  /** 事件類型 */
  eventType: string;

  /** 連接標籤 (可選) */
  label?: string;

  /** 連接配置 (可選) */
  config?: Record<string, unknown>;
}

/**
 * Connection Update DTO
 * 更新連接的資料傳輸物件
 */
export interface UpdateConnectionDto {
  /** 事件類型 */
  eventType?: string;

  /** 連接標籤 */
  label?: string;

  /** 連接狀態 */
  status?: 'active' | 'inactive' | 'error';

  /** 連接配置 */
  config?: Record<string, unknown>;
}

/**
 * Connection Validation Result
 * 連接驗證結果
 */
export interface ConnectionValidationResult {
  /** 連接是否有效 */
  valid: boolean;

  /** 錯誤訊息列表 */
  errors: string[];

  /** 警告訊息列表 */
  warnings: string[];
}
