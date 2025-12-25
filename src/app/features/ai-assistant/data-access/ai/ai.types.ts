/**
 * Google Generative AI Integration - Angular Type Definitions
 *
 * 定義前端使用的 AI 類型
 */

/**
 * AI 文字生成請求介面
 */
export interface AIGenerateTextRequest {
  /** 提示詞 */
  prompt: string;
  /** 最大 token 數量 */
  maxTokens?: number;
  /** 溫度參數 (0-1)，控制創造性 */
  temperature?: number;
  /** Blueprint ID（用於事件記錄） */
  blueprintId?: string;
}

/**
 * AI 文字生成回應介面
 */
export interface AIGenerateTextResponse {
  /** AI 生成的文字 */
  text: string;
  /** 使用的 token 數量 */
  tokensUsed: number;
  /** 使用的模型名稱 */
  model: string;
  /** 時間戳記 */
  timestamp: number;
}

/**
 * AI 對話訊息介面
 */
export interface AIChatMessage {
  /** 角色：user 或 model */
  role: 'user' | 'model';
  /** 訊息內容 */
  content: string;
}

/**
 * AI 對話生成請求介面
 */
export interface AIGenerateChatRequest {
  /** 對話訊息陣列 */
  messages: AIChatMessage[];
  /** 最大 token 數量 */
  maxTokens?: number;
  /** 溫度參數 (0-1)，控制創造性 */
  temperature?: number;
  /** Blueprint ID（用於事件記錄） */
  blueprintId?: string;
}

/**
 * AI 對話生成回應介面
 */
export interface AIGenerateChatResponse {
  /** AI 的回應文字 */
  response: string;
  /** 使用的 token 數量 */
  tokensUsed: number;
  /** 使用的模型名稱 */
  model: string;
  /** 時間戳記 */
  timestamp: number;
}
