/**
 * Module type enumeration
 * 模組類型列舉
 *
 * Defines the types of modules available in the Blueprint system.
 * This enum is used throughout the application for type-safe module references.
 */
export enum ModuleType {
  TASKS = 'tasks',
  LOGS = 'logs',
  QUALITY = 'quality',
  DIARY = 'diary',
  DASHBOARD = 'dashboard',
  FILES = 'files',
  TODOS = 'todos',
  CHECKLISTS = 'checklists',
  ISSUES = 'issues',
  BOT_WORKFLOW = 'bot_workflow'
}
