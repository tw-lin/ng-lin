/**
 * Issue Formatters - Shared Utilities
 * 問題格式化工具 - 共享工具
 *
 * Purpose: Format issue status, severity, source labels
 * Features: Type-safe formatters for consistent display across components
 */

import type { IssueStatus, IssueSeverity, IssueSource } from '../../issues.model';

/**
 * Status display configuration
 */
export interface StatusConfig {
  text: string;
  color: 'warning' | 'processing' | 'success' | 'default' | 'error';
  icon: string;
}

/**
 * Severity display configuration
 */
export interface SeverityConfig {
  text: string;
  color: 'error' | 'warning' | 'default';
}

/**
 * Source display configuration
 */
export interface SourceConfig {
  text: string;
  color: 'default' | 'blue' | 'cyan' | 'orange' | 'red';
}

/**
 * Get status display configuration
 */
export function getStatusConfig(status: IssueStatus): StatusConfig {
  const configs: Record<IssueStatus, StatusConfig> = {
    open: { text: '待處理', color: 'warning', icon: 'exclamation-circle' },
    in_progress: { text: '處理中', color: 'processing', icon: 'clock-circle' },
    resolved: { text: '已解決', color: 'success', icon: 'check-circle' },
    verified: { text: '已驗證', color: 'success', icon: 'safety-certificate' },
    closed: { text: '已關閉', color: 'default', icon: 'check-square' }
  };
  return configs[status];
}

/**
 * Get severity display configuration
 */
export function getSeverityConfig(severity: IssueSeverity): SeverityConfig {
  const configs: Record<IssueSeverity, SeverityConfig> = {
    critical: { text: '嚴重', color: 'error' },
    major: { text: '重要', color: 'warning' },
    minor: { text: '輕微', color: 'default' }
  };
  return configs[severity];
}

/**
 * Get source display configuration
 */
export function getSourceConfig(source: IssueSource): SourceConfig {
  const configs: Record<IssueSource, SourceConfig> = {
    manual: { text: '手動', color: 'default' },
    acceptance: { text: '驗收', color: 'blue' },
    qc: { text: 'QC', color: 'cyan' },
    warranty: { text: '保固', color: 'orange' },
    safety: { text: '安全', color: 'red' }
  };
  return configs[source];
}

/**
 * Format status text
 */
export function formatStatusText(status: IssueStatus): string {
  return getStatusConfig(status).text;
}

/**
 * Format severity text
 */
export function formatSeverityText(severity: IssueSeverity): string {
  return getSeverityConfig(severity).text;
}

/**
 * Format source text
 */
export function formatSourceText(source: IssueSource): string {
  return getSourceConfig(source).text;
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get severity options for select/form
 */
export function getSeverityOptions(): Array<{ value: IssueSeverity; label: string }> {
  return [
    { value: 'critical', label: '嚴重 - 需立即處理' },
    { value: 'major', label: '重要 - 需儘快處理' },
    { value: 'minor', label: '輕微 - 可稍後處理' }
  ];
}

/**
 * Get category options for select/form
 */
export function getCategoryOptions(): Array<{ value: string; label: string }> {
  return [
    { value: 'quality', label: '品質問題' },
    { value: 'safety', label: '安全問題' },
    { value: 'warranty', label: '保固問題' },
    { value: 'other', label: '其他' }
  ];
}
