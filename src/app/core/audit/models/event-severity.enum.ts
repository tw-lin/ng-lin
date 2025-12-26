/**
 * Event Severity Enum
 * 
 * Defines 4 severity levels for audit events based on impact and urgency.
 * Used by the Classification Engine (Layer 4) for risk scoring and alerting.
 * 
 * Severity Assignment Rules:
 * - LOW: Routine operations, informational events, no immediate action required
 * - MEDIUM: Notable events, potential issues, monitor for patterns
 * - HIGH: Security-relevant events, policy violations, requires attention
 * - CRITICAL: Security incidents, system failures, immediate action required
 * 
 * @see docs/⭐️/audit-layers/LAYER_4_CLASSIFICATION_ENGINE.md
 */
export enum AuditLevel {
  /**
   * LOW severity (0-25 risk score)
   * - Routine operations (read, list, query)
   * - Informational events (session started, cache hit)
   * - No immediate action required
   * - Auto-archive after 7 days
   */
  LOW = 'LOW',
  
  /**
   * MEDIUM severity (26-50 risk score)
   * - Notable events (blueprint updated, member added)
   * - Potential issues (slow query, cache miss)
   * - Monitor for patterns
   * - Review weekly
   */
  MEDIUM = 'MEDIUM',
  
  /**
   * HIGH severity (51-75 risk score)
   * - Security-relevant events (permission denied, role changed)
   * - Policy violations (rate limit exceeded, quota exceeded)
   * - AI architectural decisions (pattern selection, refactoring)
   * - Requires attention within 24 hours
   * - Auto-review flag enabled
   */
  HIGH = 'HIGH',
  
  /**
   * CRITICAL severity (76-100 risk score)
   * - Security incidents (intrusion detected, unauthorized access)
   * - System failures (database connection lost, service crashed)
   * - Data breaches (GDPR violation, PHI exposed)
   * - Immediate action required (< 1 hour)
   * - Auto-alert enabled
   * - Mandatory review
   */
  CRITICAL = 'CRITICAL'
}

/**
 * Risk Score Thresholds
 * Used for mapping risk scores to severity levels
 */
export const RISK_SCORE_THRESHOLDS = {
  LOW: { min: 0, max: 25 },
  MEDIUM: { min: 26, max: 50 },
  HIGH: { min: 51, max: 75 },
  CRITICAL: { min: 76, max: 100 }
} as const;

/**
 * Helper function to get severity from risk score
 */
export function getSeverityFromRiskScore(riskScore: number): AuditLevel {
  if (riskScore <= RISK_SCORE_THRESHOLDS.LOW.max) {
    return AuditLevel.LOW;
  } else if (riskScore <= RISK_SCORE_THRESHOLDS.MEDIUM.max) {
    return AuditLevel.MEDIUM;
  } else if (riskScore <= RISK_SCORE_THRESHOLDS.HIGH.max) {
    return AuditLevel.HIGH;
  } else {
    return AuditLevel.CRITICAL;
  }
}
