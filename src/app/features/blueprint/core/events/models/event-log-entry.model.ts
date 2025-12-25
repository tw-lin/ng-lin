/**
 * 事件日誌記錄
 *
 * 記錄事件的處理歷史和結果
 */
export interface EventLogEntry {
  /** 事件唯一識別碼 */
  eventId: string;
  /** 事件類型 */
  eventType: string;
  /** 藍圖 ID */
  blueprintId: string;
  /** 事件時間戳 */
  timestamp: Date;
  /** 事件來源 */
  source: string;
  /** 事件資料摘要 */
  dataSummary?: string;
  /** 處理時間（毫秒） */
  processingTime?: number;
  /** 處理錯誤 */
  error?: {
    message: string;
    stack?: string;
  };
  /** 處理結果 */
  handlerResults?: unknown[];
  /** 是否成功處理 */
  success: boolean;
}

/**
 * 事件日誌查詢過濾器
 */
export interface EventLogFilter {
  /** 事件類型過濾 */
  eventTypes?: string[];
  /** 藍圖 ID 過濾 */
  blueprintId?: string;
  /** 開始時間 */
  startTime?: Date;
  /** 結束時間 */
  endTime?: Date;
  /** 是否有錯誤 */
  hasError?: boolean;
  /** 來源模組過濾 */
  source?: string;
  /** 最大筆數 */
  limit?: number;
}
