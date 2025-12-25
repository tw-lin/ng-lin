/**
 * Base error class for Blueprint module
 * 藍圖模組基礎錯誤類別
 */
export class BlueprintError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' | 'critical',
    public recoverable = true,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, BlueprintError.prototype);
  }
}
