/**
 * Simplified Execution Context Interface
 *
 * Minimal interface for module lifecycle
 */
export interface IExecutionContext {
  blueprintId: string;
  [key: string]: any;
}
