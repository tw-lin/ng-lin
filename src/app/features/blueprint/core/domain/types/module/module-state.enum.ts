/**
 * Module lifecycle states
 * 模組生命週期狀態
 */
export enum ModuleState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  ACTIVE = 'active',
  PAUSED = 'paused',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error'
}
